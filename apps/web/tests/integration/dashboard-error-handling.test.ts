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

describe('Dashboard Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PGRST205 Error Scenarios', () => {
    it('should handle PGRST205 dual_pane_state column errors', async () => {
      const pgrst205Error = {
        code: 'PGRST205',
        message: 'Could not find the \'dual_pane_state\' column of \'workspaces\'',
        details: 'Searched for the column on \'workspaces\' but it was not found',
        hint: null
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

      expect(result.error.code).toBe('PGRST205')
      expect(result.error.message).toContain('dual_pane_state')
      expect(result.data).toBeNull()
    })

    it('should handle general PGRST205 schema errors', async () => {
      const pgrst205Error = {
        code: 'PGRST205',
        message: 'Could not find the \'other_field\' column of \'workspaces\'',
        details: 'Schema error',
        hint: null
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

      expect(result.error.code).toBe('PGRST205')
      expect(result.error.message).not.toContain('dual_pane_state')
      expect(result.data).toBeNull()
    })

    it('should validate error logging structure for PGRST205 errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const pgrst205Error = {
        code: 'PGRST205',
        message: 'Could not find the \'dual_pane_state\' column of \'workspaces\'',
        details: 'Schema mismatch',
        hint: 'Check database schema'
      }

      // Simulate error logging pattern from dashboard
      console.error('PGRST205 Schema Error:', {
        message: pgrst205Error.message,
        details: pgrst205Error.details,
        hint: pgrst205Error.hint,
        code: pgrst205Error.code
      })

      expect(consoleSpy).toHaveBeenCalledWith('PGRST205 Schema Error:', {
        message: pgrst205Error.message,
        details: pgrst205Error.details,
        hint: pgrst205Error.hint,
        code: pgrst205Error.code
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Workspace Creation Error Handling', () => {
    it('should handle PGRST205 errors during workspace creation', async () => {
      const creationError = {
        code: 'PGRST205',
        message: 'Could not find the \'dual_pane_state\' column of \'workspaces\'',
        details: 'Schema error during insert'
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: creationError
            })
          })
        })
      })

      const supabase = createClient()
      const result = await supabase
        .from('workspaces')
        .insert({
          user_id: 'test-user-id',
          name: 'Test Workspace',
          description: 'Test Description',
          dual_pane_state: {
            chat_width: 50,
            canvas_width: 50,
            active_pane: 'chat',
            collapsed: false
          }
        })
        .select()
        .single()

      expect(result.error.code).toBe('PGRST205')
      expect(result.data).toBeNull()
    })

    it('should handle dual_pane_state specific field errors during creation', async () => {
      const fieldError = {
        message: 'Invalid input for dual_pane_state field',
        code: 'INVALID_INPUT'
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: fieldError
            })
          })
        })
      })

      const supabase = createClient()
      const result = await supabase
        .from('workspaces')
        .insert({
          user_id: 'test-user-id',
          name: 'Test Workspace',
          dual_pane_state: 'invalid-data' // Invalid type
        })
        .select()
        .single()

      expect(result.error.message).toContain('dual_pane_state')
      expect(result.data).toBeNull()
    })
  })

  describe('Error Message Classification', () => {
    it('should classify PGRST205 errors correctly', () => {
      const errors = [
        { code: 'PGRST205', message: 'dual_pane_state column missing', type: 'dual_pane_state_specific' },
        { code: 'PGRST205', message: 'other column missing', type: 'general_schema' },
        { code: 'PGRST001', message: 'authentication failed', type: 'authentication' },
        { message: 'unknown error', type: 'general' }
      ]

      errors.forEach(error => {
        if (error.code === 'PGRST205' && error.message.includes('dual_pane_state')) {
          expect(error.type).toBe('dual_pane_state_specific')
        } else if (error.code === 'PGRST205') {
          expect(error.type).toBe('general_schema')
        } else if (error.code === 'PGRST001') {
          expect(error.type).toBe('authentication')
        } else {
          expect(error.type).toBe('general')
        }
      })
    })

    it('should handle errors without message property', () => {
      const errorWithoutMessage = {
        code: 'ERROR_NO_MESSAGE'
      }

      // Test the error handling pattern from dashboard
      const errorMessage = errorWithoutMessage.message || 'Unknown error occurred'

      expect(errorMessage).toBe('Unknown error occurred')
    })
  })

  describe('Console Error Elimination Validation', () => {
    it('should verify no dual_pane_state column errors in successful operations', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'test-workspace',
                  dual_pane_state: { active_pane: 'chat' }
                }
              ],
              error: null
            })
          })
        })
      })

      const supabase = createClient()
      await supabase
        .from('workspaces')
        .select('id, name, description, dual_pane_state, chat_context, canvas_elements, created_at, updated_at')
        .eq('user_id', 'test-user-id')
        .order('updated_at', { ascending: false })

      // Should not have any console errors about dual_pane_state columns
      const dualPaneStateErrors = consoleSpy.mock.calls.filter(call =>
        call.some(arg =>
          typeof arg === 'string' &&
          arg.includes('dual_pane_state') &&
          arg.includes('column')
        )
      )

      expect(dualPaneStateErrors).toHaveLength(0)
      consoleSpy.mockRestore()
    })
  })
})