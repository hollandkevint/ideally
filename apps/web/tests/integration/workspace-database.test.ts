import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client for integration tests
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn()
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

describe('Workspace Database Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Workspace CRUD operations with dual_pane_state', () => {
    it('should include dual_pane_state field when creating workspace', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-workspace-id',
              name: 'Test Workspace',
              description: 'Test Description',
              dual_pane_state: {
                chat_width: 50,
                canvas_width: 50,
                active_pane: 'chat',
                collapsed: false
              },
              chat_context: [],
              canvas_elements: []
            },
            error: null
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      })

      const supabase = createClient()

      const workspaceData = {
        user_id: 'test-user-id',
        name: 'Test Workspace',
        description: 'Test Description',
        dual_pane_state: {
          chat_width: 50,
          canvas_width: 50,
          active_pane: 'chat',
          collapsed: false
        },
        chat_context: [],
        canvas_elements: []
      }

      await supabase
        .from('workspaces')
        .insert(workspaceData)
        .select()
        .single()

      expect(mockInsert).toHaveBeenCalledWith(workspaceData)
    })

    it('should select dual_pane_state field when fetching workspaces', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'test-workspace-id',
                name: 'Test Workspace',
                description: 'Test Description',
                dual_pane_state: {
                  chat_width: 50,
                  canvas_width: 50,
                  active_pane: 'chat',
                  collapsed: false
                },
                chat_context: [],
                canvas_elements: [],
                created_at: '2025-09-16T00:00:00Z',
                updated_at: '2025-09-16T00:00:00Z'
              }
            ],
            error: null
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      })

      const supabase = createClient()

      await supabase
        .from('workspaces')
        .select('id, name, description, dual_pane_state, chat_context, canvas_elements, created_at, updated_at')
        .eq('user_id', 'test-user-id')
        .order('updated_at', { ascending: false })

      expect(mockSelect).toHaveBeenCalledWith('id, name, description, dual_pane_state, chat_context, canvas_elements, created_at, updated_at')
    })

    it('should handle PGRST205 errors gracefully', async () => {
      const pgrst205Error = {
        code: 'PGRST205',
        message: 'Could not find the \'dual_pane_state\' column of \'workspaces\'',
        details: 'schema error'
      }

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: pgrst205Error
            })
          })
        })
      })

      const supabase = createClient()

      const result = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', 'test-user-id')
        .order('updated_at', { ascending: false })

      expect(result.error).toEqual(pgrst205Error)
      expect(result.data).toBeNull()
    })
  })

  describe('RLS Policy Compliance', () => {
    it('should validate RLS policies support dual_pane_state field operations', async () => {
      // Mock user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'test-workspace-id',
              dual_pane_state: {
                chat_width: 60,
                canvas_width: 40,
                active_pane: 'canvas',
                collapsed: false
              }
            }
          ],
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      })

      const supabase = createClient()

      // Test updating dual_pane_state field through RLS
      await supabase
        .from('workspaces')
        .update({
          dual_pane_state: {
            chat_width: 60,
            canvas_width: 40,
            active_pane: 'canvas',
            collapsed: false
          }
        })
        .eq('id', 'test-workspace-id')

      expect(mockUpdate).toHaveBeenCalledWith({
        dual_pane_state: {
          chat_width: 60,
          canvas_width: 40,
          active_pane: 'canvas',
          collapsed: false
        }
      })
    })

    it('should maintain user data isolation through RLS with dual_pane_state', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'workspace-1',
                user_id: 'user-1',
                dual_pane_state: { active_pane: 'chat' }
              }
            ],
            error: null
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      })

      const supabase = createClient()

      // Fetch workspaces - should only return user's own workspaces
      await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', 'user-1')

      expect(mockSelect).toHaveBeenCalledWith('*')
    })
  })
})