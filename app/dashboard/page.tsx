'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth/AuthContext'
import { supabase } from '../../lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Workspace {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  chat_context: any[]
  canvas_elements: any[]
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('')
  const router = useRouter()


  useEffect(() => {
    if (user) {
      fetchWorkspaces()
    }
  }, [user])

  const fetchWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setWorkspaces(data || [])
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim() || creating) return
    
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          user_id: user?.id,
          name: newWorkspaceName.trim(),
          description: newWorkspaceDescription.trim(),
          chat_context: [],
          canvas_elements: []
        })
        .select()
        .single()

      if (error) throw error
      
      // Redirect to the new workspace
      router.push(`/workspace/${data.id}`)
    } catch (error) {
      console.error('Error creating workspace:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteWorkspace = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id)

      if (error) throw error
      setWorkspaces(workspaces.filter(w => w.id !== id))
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
    router.push('/login')
    return null
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-divider">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">Strategic Workspace</h1>
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

        {/* Existing Workspaces */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Strategic Sessions</h2>
          
          {workspaces.length === 0 ? (
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
  )
}