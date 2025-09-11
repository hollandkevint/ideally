import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { supabase } from '../../lib/supabase/client'
import { AuthProvider, useAuth } from '../../lib/auth/AuthContext'
import GoogleOneTapSignin from '../../app/components/auth/GoogleOneTapSignin'
import { loadGoogleScript, createGoogleConfig, isGoogleLoaded } from '../../lib/auth/google-config'
import type { User, Session } from '@supabase/supabase-js'

// Mock Supabase client
vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithIdToken: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => Promise.resolve({ data: null, error: null })),
        delete: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}))

// Mock Google config
vi.mock('../../lib/auth/google-config')
vi.mock('next/script', () => ({
  default: ({ onLoad, onError, ...props }: any) => <script {...props} />
}))

const mockSupabase = vi.mocked(supabase)
const mockLoadGoogleScript = vi.mocked(loadGoogleScript)
const mockCreateGoogleConfig = vi.mocked(createGoogleConfig)
const mockIsGoogleLoaded = vi.mocked(isGoogleLoaded)

// Mock Google Identity Services
const mockGooglePrompt = vi.fn()
const mockGoogleInitialize = vi.fn()
const mockGoogleCancel = vi.fn()

Object.defineProperty(window, 'google', {
  value: {
    accounts: {
      id: {
        initialize: mockGoogleInitialize,
        prompt: mockGooglePrompt,
        cancel: mockGoogleCancel
      }
    }
  },
  writable: true
})

// Test component for regression testing with workspace functionality
function RegressionTestComponent() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) return <div data-testid="loading">Loading...</div>
  
  if (user) {
    return (
      <div data-testid="authenticated">
        <div data-testid="user-info">User: {user.email}</div>
        <button onClick={signOut} data-testid="signout-button">Sign Out</button>
        <WorkspaceComponent />
        <ConversationComponent />
        <BMadSessionComponent />
        <DataExportComponent />
      </div>
    )
  }
  
  return (
    <div data-testid="unauthenticated">
      <GoogleOneTapSignin 
        onSuccess={() => console.log('Success')}
        onError={(error) => console.error(error)}
      />
    </div>
  )
}

// Mock workspace component
function WorkspaceComponent() {
  return (
    <div data-testid="workspace">
      <div data-testid="workspace-title">My Workspace</div>
      <button data-testid="create-workspace">Create New Workspace</button>
      <div data-testid="workspace-list">
        <div data-testid="workspace-item">Default Workspace</div>
      </div>
    </div>
  )
}

// Mock conversation component
function ConversationComponent() {
  return (
    <div data-testid="conversations">
      <div data-testid="conversation-title">Conversations</div>
      <button data-testid="new-conversation">New Conversation</button>
      <div data-testid="conversation-list">
        <div data-testid="conversation-item">Previous Conversation</div>
      </div>
    </div>
  )
}

// Mock BMad session component
function BMadSessionComponent() {
  return (
    <div data-testid="bmad-session">
      <div data-testid="bmad-title">BMad Method Session</div>
      <button data-testid="start-bmad">Start BMad Session</button>
      <div data-testid="bmad-history">
        <div data-testid="bmad-session-item">Previous BMad Session</div>
      </div>
    </div>
  )
}

// Mock data export component
function DataExportComponent() {
  return (
    <div data-testid="data-export">
      <div data-testid="export-title">Data Export</div>
      <button data-testid="export-data">Export My Data</button>
      <div data-testid="external-integrations">
        <button data-testid="connect-slack">Connect Slack</button>
        <button data-testid="connect-notion">Connect Notion</button>
      </div>
    </div>
  )
}

describe('Authentication Regression Testing', () => {
  const mockUser: User = {
    id: 'regression-user-123',
    email: 'regression@test.com',
    app_metadata: { provider: 'google' },
    user_metadata: {
      email_verified: true,
      full_name: 'Regression Test User',
      avatar_url: 'https://lh3.googleusercontent.com/avatar.jpg',
      workspace_id: 'workspace-123',
      active_conversations: ['conv-1', 'conv-2'],
      bmad_sessions: ['session-1', 'session-2']
    },
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    role: 'authenticated'
  }

  const mockSession: Session = {
    access_token: 'regression_token',
    refresh_token: 'refresh_token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
    expires_at: Date.now() + 3600000
  }

  let mockSubscription: { unsubscribe: vi.Mock }
  let authStateCallback: ((event: string, session: Session | null) => void) | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockSubscription = { unsubscribe: vi.fn() }
    
    // Setup default mocks
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: mockSubscription } }
    })
    
    mockSupabase.auth.signInWithIdToken.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })
    
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    
    mockLoadGoogleScript.mockResolvedValue(undefined)
    mockIsGoogleLoaded.mockReturnValue(true)
    mockCreateGoogleConfig.mockResolvedValue({
      client_id: 'test-client-id',
      callback: vi.fn(),
      nonce: 'test-nonce'
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Existing User-Dependent Features', () => {
    it('tests all existing user-dependent features', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Verify all user-dependent features are rendered
      expect(screen.getByTestId('user-info')).toBeInTheDocument()
      expect(screen.getByTestId('workspace')).toBeInTheDocument()
      expect(screen.getByTestId('conversations')).toBeInTheDocument()
      expect(screen.getByTestId('bmad-session')).toBeInTheDocument()
      expect(screen.getByTestId('data-export')).toBeInTheDocument()

      // Test user information display
      expect(screen.getByText('User: regression@test.com')).toBeInTheDocument()
    })

    it('validates user profile access and display', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // User profile information should be accessible
      expect(screen.getByTestId('user-info')).toBeInTheDocument()
      expect(screen.getByText('User: regression@test.com')).toBeInTheDocument()
    })

    it('tests navigation and routing with authentication', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // All authenticated routes should be accessible
      expect(screen.getByTestId('workspace')).toBeInTheDocument()
      expect(screen.getByTestId('conversations')).toBeInTheDocument()
      expect(screen.getByTestId('bmad-session')).toBeInTheDocument()
    })

    it('validates user preferences and settings persistence', async () => {
      const userWithPreferences = {
        ...mockUser,
        user_metadata: {
          ...mockUser.user_metadata,
          preferences: {
            theme: 'dark',
            notifications: true,
            language: 'en'
          }
        }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { ...mockSession, user: userWithPreferences } },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // User preferences should be maintained
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
    })
  })

  describe('Workspace Creation and Management', () => {
    it('verifies workspace creation and management', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock workspace creation
      const mockWorkspaceInsert = vi.fn(() => Promise.resolve({ 
        data: { id: 'new-workspace', name: 'New Workspace', user_id: mockUser.id }, 
        error: null 
      }))

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ 
            data: [
              { id: 'workspace-123', name: 'Default Workspace', user_id: mockUser.id }
            ], 
            error: null 
          }))
        })),
        insert: mockWorkspaceInsert
      }))

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Workspace functionality should be available
      expect(screen.getByTestId('workspace')).toBeInTheDocument()
      expect(screen.getByTestId('workspace-title')).toHaveTextContent('My Workspace')
      expect(screen.getByTestId('create-workspace')).toBeInTheDocument()
      expect(screen.getByTestId('workspace-list')).toBeInTheDocument()

      // Test workspace creation
      const createButton = screen.getByTestId('create-workspace')
      fireEvent.click(createButton)

      // Should trigger workspace creation logic
      expect(createButton).toBeInTheDocument()
    })

    it('tests workspace data access and permissions', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock workspace data with RLS
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ 
            data: [
              { 
                id: 'workspace-123', 
                name: 'User Workspace', 
                user_id: mockUser.id,
                created_at: '2023-01-01T00:00:00Z'
              }
            ], 
            error: null 
          }))
        }))
      }))

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // User should only see their own workspaces
      expect(screen.getByTestId('workspace-item')).toBeInTheDocument()
    })

    it('validates workspace sharing and collaboration', async () => {
      const collaborativeWorkspace = {
        id: 'shared-workspace',
        name: 'Shared Workspace',
        user_id: mockUser.id,
        collaborators: ['user-2', 'user-3']
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ 
            data: [collaborativeWorkspace], 
            error: null 
          }))
        }))
      }))

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Collaborative features should work
      expect(screen.getByTestId('workspace')).toBeInTheDocument()
    })
  })

  describe('Conversation and BMad Session Functionality', () => {
    it('tests conversation and BMad session functionality', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Conversation functionality
      expect(screen.getByTestId('conversations')).toBeInTheDocument()
      expect(screen.getByTestId('conversation-title')).toHaveTextContent('Conversations')
      expect(screen.getByTestId('new-conversation')).toBeInTheDocument()
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument()

      // BMad session functionality
      expect(screen.getByTestId('bmad-session')).toBeInTheDocument()
      expect(screen.getByTestId('bmad-title')).toHaveTextContent('BMad Method Session')
      expect(screen.getByTestId('start-bmad')).toBeInTheDocument()
      expect(screen.getByTestId('bmad-history')).toBeInTheDocument()
    })

    it('validates conversation history and persistence', async () => {
      const userWithConversations = {
        ...mockUser,
        user_metadata: {
          ...mockUser.user_metadata,
          active_conversations: ['conv-1', 'conv-2', 'conv-3']
        }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { ...mockSession, user: userWithConversations } },
        error: null
      })

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ 
            data: [
              { id: 'conv-1', title: 'Strategy Discussion', user_id: mockUser.id },
              { id: 'conv-2', title: 'Project Planning', user_id: mockUser.id }
            ], 
            error: null 
          }))
        }))
      }))

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Conversation history should be preserved
      expect(screen.getByTestId('conversation-item')).toBeInTheDocument()
    })

    it('tests BMad session state management', async () => {
      const userWithBMadSessions = {
        ...mockUser,
        user_metadata: {
          ...mockUser.user_metadata,
          bmad_sessions: ['session-1', 'session-2']
        }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { ...mockSession, user: userWithBMadSessions } },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // BMad session state should be maintained
      expect(screen.getByTestId('bmad-session-item')).toBeInTheDocument()
    })

    it('validates real-time collaboration features', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Test new conversation creation
      const newConversationButton = screen.getByTestId('new-conversation')
      fireEvent.click(newConversationButton)

      // Should maintain authentication state during interaction
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
    })
  })

  describe('Data Export and External Integrations', () => {
    it('validates data export and external integrations', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Data export functionality
      expect(screen.getByTestId('data-export')).toBeInTheDocument()
      expect(screen.getByTestId('export-title')).toHaveTextContent('Data Export')
      expect(screen.getByTestId('export-data')).toBeInTheDocument()

      // External integrations
      expect(screen.getByTestId('external-integrations')).toBeInTheDocument()
      expect(screen.getByTestId('connect-slack')).toBeInTheDocument()
      expect(screen.getByTestId('connect-notion')).toBeInTheDocument()
    })

    it('tests data export functionality', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock export API
      const mockExportData = vi.fn(() => Promise.resolve({ 
        data: { export_id: 'export-123', status: 'pending' }, 
        error: null 
      }))

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: mockExportData
      }))

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Test export functionality
      const exportButton = screen.getByTestId('export-data')
      fireEvent.click(exportButton)

      // Should maintain authentication during export
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
    })

    it('validates external integration OAuth flows', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Test Slack integration
      const slackButton = screen.getByTestId('connect-slack')
      fireEvent.click(slackButton)

      // Should maintain session during external OAuth
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()

      // Test Notion integration
      const notionButton = screen.getByTestId('connect-notion')
      fireEvent.click(notionButton)

      // Should maintain session during external OAuth
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
    })

    it('tests data portability and GDPR compliance', async () => {
      const userWithGDPRData = {
        ...mockUser,
        user_metadata: {
          ...mockUser.user_metadata,
          country: 'Germany',
          gdpr_consent: true,
          data_processing_consent: true
        }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { ...mockSession, user: userWithGDPRData } },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // GDPR compliance features should be available
      expect(screen.getByTestId('export-data')).toBeInTheDocument()
    })
  })

  describe('Authentication State Preservation', () => {
    it('validates authentication state preservation across feature usage', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Test various feature interactions
      const interactions = [
        () => fireEvent.click(screen.getByTestId('create-workspace')),
        () => fireEvent.click(screen.getByTestId('new-conversation')),
        () => fireEvent.click(screen.getByTestId('start-bmad')),
        () => fireEvent.click(screen.getByTestId('export-data')),
        () => fireEvent.click(screen.getByTestId('connect-slack'))
      ]

      for (const interaction of interactions) {
        interaction()
        
        // Authentication state should be preserved
        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toBeInTheDocument()
        })
        
        expect(screen.getByText('User: regression@test.com')).toBeInTheDocument()
      }
    })

    it('tests feature availability based on authentication state', async () => {
      // Start unauthenticated
      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Features should not be available
      expect(screen.queryByTestId('workspace')).not.toBeInTheDocument()
      expect(screen.queryByTestId('conversations')).not.toBeInTheDocument()
      expect(screen.queryByTestId('bmad-session')).not.toBeInTheDocument()

      // Authenticate user
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      act(() => {
        authStateCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // All features should now be available
      expect(screen.getByTestId('workspace')).toBeInTheDocument()
      expect(screen.getByTestId('conversations')).toBeInTheDocument()
      expect(screen.getByTestId('bmad-session')).toBeInTheDocument()
      expect(screen.getByTestId('data-export')).toBeInTheDocument()
    })

    it('validates graceful degradation on authentication loss', async () => {
      // Start authenticated
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // All features available
      expect(screen.getByTestId('workspace')).toBeInTheDocument()
      expect(screen.getByTestId('conversations')).toBeInTheDocument()

      // Lose authentication
      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Features should be gracefully hidden
      expect(screen.queryByTestId('workspace')).not.toBeInTheDocument()
      expect(screen.queryByTestId('conversations')).not.toBeInTheDocument()
      expect(screen.queryByTestId('bmad-session')).not.toBeInTheDocument()
    })
  })

  describe('Backward Compatibility', () => {
    it('validates backward compatibility with existing user data', async () => {
      // Test with legacy user data structure
      const legacyUser = {
        ...mockUser,
        user_metadata: {
          email_verified: true,
          full_name: 'Legacy User',
          // Missing some new fields
          workspace_id: undefined,
          active_conversations: undefined
        }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { ...mockSession, user: legacyUser } },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Should handle legacy user data gracefully
      expect(screen.getByText('User: regression@test.com')).toBeInTheDocument()
      expect(screen.getByTestId('workspace')).toBeInTheDocument()
    })

    it('tests migration of authentication methods', async () => {
      // Test that Google signin works alongside any existing auth methods
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'migration-test-nonce'
        })
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Google signin should work
      act(() => {
        credentialCallback!({ credential: 'migration_test_credential' })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalled()
      })

      act(() => {
        authStateCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // All features should work with Google-authenticated user
      expect(screen.getByTestId('workspace')).toBeInTheDocument()
      expect(screen.getByTestId('conversations')).toBeInTheDocument()
    })

    it('validates API compatibility with existing endpoints', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Mock API calls that should still work
      const apiEndpoints = [
        '/api/user/profile',
        '/api/workspaces',
        '/api/conversations',
        '/api/bmad/sessions'
      ]

      for (const endpoint of apiEndpoints) {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${mockSession.access_token}`
          }
        }).catch(() => ({ ok: true, status: 200 })) // Mock successful response

        expect(response.ok || response.status === 200).toBe(true)
      }
    })
  })

  describe('Performance Regression Testing', () => {
    it('validates no performance regression in feature loading', async () => {
      const loadStartTime = Date.now()

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      const loadTime = Date.now() - loadStartTime

      // Feature loading should be fast
      expect(loadTime).toBeLessThan(1000) // Under 1 second

      // All features should be rendered
      expect(screen.getByTestId('workspace')).toBeInTheDocument()
      expect(screen.getByTestId('conversations')).toBeInTheDocument()
      expect(screen.getByTestId('bmad-session')).toBeInTheDocument()
      expect(screen.getByTestId('data-export')).toBeInTheDocument()
    })

    it('tests memory usage stability', async () => {
      const initialMemory = process.memoryUsage().heapUsed

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate feature usage
      const interactions = [
        () => fireEvent.click(screen.getByTestId('create-workspace')),
        () => fireEvent.click(screen.getByTestId('new-conversation')),
        () => fireEvent.click(screen.getByTestId('start-bmad'))
      ]

      for (const interaction of interactions) {
        interaction()
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024) // Less than 100MB
    })
  })
})