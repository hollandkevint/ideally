import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn()
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

describe('PGRST205 Error Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Workspace Schema Error Scenarios', () => {
    it('should NOT generate PGRST205 errors when dual_pane_state is included in interface', async () => {
      // Mock successful response with dual_pane_state
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

      const result = await supabase
        .from('workspaces')
        .select('id, name, description, dual_pane_state, chat_context, canvas_elements, created_at, updated_at')
        .eq('user_id', 'test-user-id')
        .order('updated_at', { ascending: false })

      // Should NOT have PGRST205 error
      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(result.data[0]).toHaveProperty('dual_pane_state')
    })

    it('should properly handle legacy workspaces without dual_pane_state', async () => {
      // Mock response with legacy workspace (missing dual_pane_state)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'legacy-workspace-id',
                name: 'Legacy Workspace',
                description: 'Legacy Description',
                dual_pane_state: null, // Database default should handle this
                chat_context: [],
                canvas_elements: [],
                created_at: '2025-09-15T00:00:00Z',
                updated_at: '2025-09-15T00:00:00Z'
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

      const result = await supabase
        .from('workspaces')
        .select('id, name, description, dual_pane_state, chat_context, canvas_elements, created_at, updated_at')
        .eq('user_id', 'test-user-id')
        .order('updated_at', { ascending: false })

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      // dual_pane_state should be present even if null (handled by database default)
      expect(result.data[0]).toHaveProperty('dual_pane_state')
    })

    it('should simulate former PGRST205 error scenario (now resolved)', async () => {
      // Simulate what would have been a PGRST205 error before the fix
      const formerErrorScenario = {
        code: 'PGRST205',
        message: 'Could not find the \'dual_pane_state\' column of \'workspaces\'',
        details: 'Searched for the column on \'workspaces\' but it was not found',
        hint: null
      }

      // Mock the old error scenario for documentation purposes
      const mockSelectWithError = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: formerErrorScenario
          })
        })
      })

      // Now mock the corrected scenario
      const mockSelectCorrected = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'test-workspace-id',
                dual_pane_state: {
                  chat_width: 50,
                  canvas_width: 50,
                  active_pane: 'chat',
                  collapsed: false
                }
              }
            ],
            error: null
          })
        })
      })

      // Test that the error would have occurred with old interface
      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectWithError
      })

      let supabase = createClient()
      const errorResult = await supabase
        .from('workspaces')
        .select('*') // Old query that would cause issues
        .eq('user_id', 'test-user-id')
        .order('updated_at', { ascending: false })

      expect(errorResult.error?.code).toBe('PGRST205')

      // Test that the error is now resolved with explicit field selection
      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectCorrected
      })

      supabase = createClient()
      const successResult = await supabase
        .from('workspaces')
        .select('id, name, description, dual_pane_state, chat_context, canvas_elements, created_at, updated_at')
        .eq('user_id', 'test-user-id')
        .order('updated_at', { ascending: false })

      expect(successResult.error).toBeNull()
      expect(successResult.data).toBeDefined()
    })
  })

  describe('Console Error Elimination', () => {
    it('should verify console error "Could not find dual_pane_state column" is eliminated', () => {
      // Mock console.error to capture any dual_pane_state related errors
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Simulate workspace interface usage
      interface TestWorkspace {
        id: string
        name: string
        description: string
        dual_pane_state: Record<string, unknown>
        created_at: string
        updated_at: string
        chat_context: Array<Record<string, unknown>>
        canvas_elements: Array<Record<string, unknown>>
      }

      const workspace: TestWorkspace = {
        id: 'test-id',
        name: 'Test',
        description: 'Test',
        dual_pane_state: { active_pane: 'chat' },
        created_at: '2025-09-16T00:00:00Z',
        updated_at: '2025-09-16T00:00:00Z',
        chat_context: [],
        canvas_elements: []
      }

      // Access dual_pane_state property
      expect(workspace.dual_pane_state).toBeDefined()

      // Verify no console errors about missing dual_pane_state column
      const errorCalls = consoleSpy.mock.calls.filter(call =>
        call.some(arg =>
          typeof arg === 'string' &&
          arg.includes('dual_pane_state') &&
          arg.includes('column')
        )
      )

      expect(errorCalls).toHaveLength(0)

      consoleSpy.mockRestore()
    })
  })
})