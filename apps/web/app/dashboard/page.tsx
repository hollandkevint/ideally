'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '../../lib/auth/AuthContext'
import { supabase } from '../../lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import ErrorState from '../components/ui/ErrorState'
import OfflineNotice from '../components/ui/OfflineNotice'
import ErrorBoundary from '../components/ui/ErrorBoundary'

interface UserWorkspace {
  user_id: string
  workspace_state: {
    name?: string
    description?: string
    dual_pane_state?: Record<string, unknown>
    chat_context?: Array<Record<string, unknown>>
    canvas_elements?: Array<Record<string, unknown>>
    created_at?: string
    initialized?: boolean
  }
  updated_at: string
}

interface Workspace {
  id: string
  name: string
  description: string
  dual_pane_state: Record<string, unknown>
  created_at: string
  updated_at: string
  chat_context: Array<Record<string, unknown>>
  canvas_elements: Array<Record<string, unknown>>
}

function DashboardContent() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('')
  const [error, setError] = useState<string>('')
  const [retryCount, setRetryCount] = useState(0)
  const [authWaitCount, setAuthWaitCount] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isFromOAuth = searchParams.get('auth_success') === 'true'

  const fetchWorkspaces = useCallback(async (retryAttempt = 0) => {
    try {
      setError('')
      const { data, error } = await supabase
        .from('user_workspace')
        .select('user_id, workspace_state, updated_at')
        .eq('user_id', user?.id)
        .single()

      if (error) {
        console.error('Error fetching workspaces:', error)

        // Check if this is a retryable error
        const isRetryableError = error.code === 'PGRST001' ||
                               error.message?.includes('network') ||
                               error.message?.includes('timeout') ||
                               error.message?.includes('connection')

        if (isRetryableError && retryAttempt < 3) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryAttempt) * 1000
          console.log(`Retrying workspace fetch in ${delay}ms (attempt ${retryAttempt + 1}/3)`)
          setTimeout(() => fetchWorkspaces(retryAttempt + 1), delay)
          return
        }

        // Handle specific database errors with improved messaging
        if (error.code === 'PGRST205') {
          console.error('PGRST205 Schema Error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          if (error.message.includes('dual_pane_state')) {
            setError('Database schema mismatch detected for dual_pane_state field. This should be resolved with the latest update. Please refresh the page.')
          } else {
            setError('Database schema error detected. Please try again or contact support.')
          }
        } else if (error.message?.includes('schema')) {
          console.error('Schema-related error:', error)
          setError('Database schema error detected. Please try again or contact support.')
        } else if (error.code === 'PGRST001' || error.message?.includes('authentication')) {
          console.error('Authentication error:', error)
          setError('Authentication error. Please sign out and sign in again.')
        } else {
          console.error('General database error:', error)
          setError(`Database error: ${error.message || 'Unknown error occurred'}`)
        }

        // Don't redirect on database errors - show error state instead
        setWorkspaces([])
      } else {
        console.log('Dashboard: Successfully fetched user workspace:', data ? 'Found' : 'Not found', data)

        // Transform UserWorkspace data to Workspace format (single workspace per user)
        const transformedWorkspaces: Workspace[] = data ? [{
          id: data.user_id,
          name: data.workspace_state?.name || 'My Strategic Workspace',
          description: data.workspace_state?.description || 'Strategic thinking and planning workspace',
          dual_pane_state: data.workspace_state?.dual_pane_state || {
            chat_width: 50,
            canvas_width: 50,
            active_pane: 'chat',
            collapsed: false
          },
          created_at: data.workspace_state?.created_at || data.updated_at,
          updated_at: data.updated_at,
          chat_context: data.workspace_state?.chat_context || [],
          canvas_elements: data.workspace_state?.canvas_elements || []
        }] : []

        setWorkspaces(transformedWorkspaces)
        setRetryCount(0) // Reset retry count on success
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)

      // Check if this is a retryable network error
      if (retryAttempt < 3) {
        const delay = Math.pow(2, retryAttempt) * 1000
        console.log(`Retrying workspace fetch after network error in ${delay}ms (attempt ${retryAttempt + 1}/3)`)
        setTimeout(() => fetchWorkspaces(retryAttempt + 1), delay)
        return
      }

      setError('Network error. Please check your connection and try again.')
      // Graceful fallback - empty workspace list instead of crash
      setWorkspaces([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchWorkspaces()
    }
  }, [user, fetchWorkspaces])

  // Handle OAuth authentication wait timing
  useEffect(() => {
    if (isFromOAuth && !user && authWaitCount < 5) {
      const timer = setTimeout(() => {
        setAuthWaitCount(prev => prev + 1)
      }, 1000) // Wait 1 second between checks
      return () => clearTimeout(timer)
    }
  }, [isFromOAuth, user, authWaitCount])

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim() || creating) return

    setCreating(true)
    try {
      // Update the user's workspace with custom name and description
      const updatedWorkspaceState = {
        name: newWorkspaceName.trim(),
        description: newWorkspaceDescription.trim(),
        dual_pane_state: {
          chat_width: 50,
          canvas_width: 50,
          active_pane: 'chat',
          collapsed: false
        },
        chat_context: [],
        canvas_elements: [],
        initialized: true,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_workspace')
        .upsert({
          user_id: user?.id,
          workspace_state: updatedWorkspaceState,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) throw error

      // Redirect to the workspace (using user_id as workspace id)
      router.push(`/workspace/${user?.id}`)
    } catch (error: unknown) {
      console.error('Error creating workspace:', error)

      // Handle specific creation errors
      const errorObj = error as { code?: string; message?: string; details?: string; hint?: string }
      if (errorObj.code === 'PGRST205') {
        console.error('PGRST205 Error during workspace creation:', {
          message: errorObj.message,
          details: errorObj.details,
          hint: errorObj.hint,
          code: errorObj.code
        })
        setError('Database schema error during workspace creation. Please try again.')
      } else if (errorObj.message?.includes('dual_pane_state')) {
        console.error('dual_pane_state field error during creation:', error)
        setError('Error with workspace dual-pane configuration. Please try again.')
      } else {
        setError('Failed to create workspace. Please try again.')
      }
    } finally {
      setCreating(false)
    }
  }

  const deleteWorkspace = async (id: string) => {
    if (!confirm('Are you sure you want to reset this workspace? This will clear all data.')) return

    try {
      // Reset the workspace to default state instead of deleting
      const { error } = await supabase
        .from('user_workspace')
        .update({
          workspace_state: {
            initialized: true,
            created_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', id)

      if (error) throw error

      // Refresh the workspace list
      fetchWorkspaces()
    } catch (error) {
      console.error('Error deleting workspace:', error)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-secondary">Loading your strategic workspaces...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // If coming from OAuth, wait a bit longer for the session to sync
    if (isFromOAuth && authWaitCount < 5) {
      console.log(`Dashboard: Coming from OAuth, waiting for auth sync (attempt ${authWaitCount + 1}/5)`)

      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
            <p className="text-secondary">Completing Google sign-in...</p>
          </div>
        </div>
      )
    }

    // Only redirect if auth is fully loaded and user is definitely not authenticated
    if (!authLoading) {
      console.log('Dashboard: No authenticated user found after wait, redirecting to login')
      router.push('/login')
    } else {
      console.log('Dashboard: No user yet but auth still loading, waiting...')
    }

    // Show loading state while determining redirect
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-secondary">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-secondary">Loading your strategic workspaces...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Dashboard Error Boundary:', error, errorInfo)
      }}
    >
      <OfflineNotice />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-white border-b border-divider">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-primary">Thinkhaven</h1>
                <p className="text-secondary">AI-powered strategic thinking sessions</p>
              </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-secondary">Welcome, {user.email}</span>
              <Link
                href="/account"
                className="text-sm px-3 py-1 border border-divider rounded hover:bg-primary/5 transition-colors"
              >
                Account
              </Link>
              <button
                onClick={signOut}
                className="text-sm px-3 py-1 border border-divider rounded hover:bg-primary/5 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Start Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready for Strategic Thinking?</h2>
            <p className="text-gray-600 mb-4">
              Start a new strategic session with Mary, your AI coach, or continue working on an existing project.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              + New Strategic Session
            </button>
          </div>
        </div>

        {/* Create Workspace Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-lg border border-divider p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Strategic Session</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                  Session Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g., Product Strategy Review, New Business Idea..."
                  className="w-full px-3 py-2 border border-divider rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                  placeholder="Brief description of what you want to explore..."
                  rows={3}
                  className="w-full px-3 py-2 border border-divider rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createWorkspace}
                  disabled={!newWorkspaceName.trim() || creating}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Session'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewWorkspaceName('')
                    setNewWorkspaceDescription('')
                  }}
                  className="px-4 py-2 border border-divider text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8">
            <ErrorState
              error={error}
              onRetry={() => {
                setRetryCount(prev => prev + 1)
                setLoading(true)
                fetchWorkspaces()
              }}
              onSignOut={signOut}
              retryCount={retryCount}
              maxRetries={3}
              isRetrying={loading}
              showSignOut={retryCount > 2}
            />
          </div>
        )}

        {/* Existing Workspaces */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Strategic Sessions</h2>
          
          {workspaces.length === 0 && !error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-600 mb-4">Create your first strategic thinking session to get started.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
              >
                Create Your First Session
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="bg-white rounded-lg border border-divider p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 truncate">{workspace.name}</h3>
                    <button
                      onClick={() => deleteWorkspace(workspace.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete workspace"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {workspace.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{workspace.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                    <div className="flex gap-4">
                      <span>{workspace.chat_context.length} messages</span>
                      <span>{workspace.canvas_elements.length} drawings</span>
                    </div>
                    <span>{new Date(workspace.updated_at).toLocaleDateString()}</span>
                  </div>
                  
                  <Link
                    href={`/workspace/${workspace.id}`}
                    className="block w-full text-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Continue Session
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      </div>
    </ErrorBoundary>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-secondary">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}