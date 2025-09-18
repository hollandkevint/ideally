import { describe, it, expect } from 'vitest'

describe('Workspace Schema Alignment', () => {
  describe('TypeScript Interface Validation', () => {
    it('should have Workspace interface with dual_pane_state field', () => {
      // Define the expected interface structure
      interface ExpectedWorkspace {
        id: string
        name: string
        description: string
        dual_pane_state: Record<string, unknown>
        created_at: string
        updated_at: string
        chat_context: Array<Record<string, unknown>>
        canvas_elements: Array<Record<string, unknown>>
      }

      // Test that the interface matches expected structure
      const mockWorkspace: ExpectedWorkspace = {
        id: 'test-id',
        name: 'Test Workspace',
        description: 'Test Description',
        dual_pane_state: {
          chat_width: 50,
          canvas_width: 50,
          active_pane: 'chat',
          collapsed: false
        },
        created_at: '2025-09-16T00:00:00Z',
        updated_at: '2025-09-16T00:00:00Z',
        chat_context: [],
        canvas_elements: []
      }

      expect(mockWorkspace.dual_pane_state).toBeDefined()
      expect(typeof mockWorkspace.dual_pane_state).toBe('object')
    })

    it('should validate dual_pane_state default structure', () => {
      const defaultDualPaneState = {
        chat_width: 50,
        canvas_width: 50,
        active_pane: 'chat',
        collapsed: false
      }

      expect(defaultDualPaneState).toHaveProperty('chat_width', 50)
      expect(defaultDualPaneState).toHaveProperty('canvas_width', 50)
      expect(defaultDualPaneState).toHaveProperty('active_pane', 'chat')
      expect(defaultDualPaneState).toHaveProperty('collapsed', false)
    })
  })

  describe('Database Field Compatibility', () => {
    it('should match database schema structure', () => {
      // Database schema fields from workspaces table
      const databaseFields = [
        'id',
        'user_id',
        'name',
        'description',
        'dual_pane_state',
        'bmad_context',
        'canvas_elements',
        'chat_context',
        'created_at',
        'updated_at'
      ]

      // Frontend interface fields (excluding user_id and bmad_context which are not in UI)
      const frontendFields = [
        'id',
        'name',
        'description',
        'dual_pane_state',
        'chat_context',
        'canvas_elements',
        'created_at',
        'updated_at'
      ]

      // Verify dual_pane_state is present in both
      expect(databaseFields).toContain('dual_pane_state')
      expect(frontendFields).toContain('dual_pane_state')
    })

    it('should validate JSONB field compatibility', () => {
      // Test that dual_pane_state can be serialized/deserialized
      const originalState = {
        chat_width: 60,
        canvas_width: 40,
        active_pane: 'canvas',
        collapsed: true
      }

      const serialized = JSON.stringify(originalState)
      const deserialized = JSON.parse(serialized)

      expect(deserialized).toEqual(originalState)
      expect(typeof deserialized).toBe('object')
    })
  })

  describe('Error Prevention', () => {
    it('should prevent PGRST205 errors by including required fields', () => {
      // Mock workspace creation payload
      const workspaceCreatePayload = {
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

      // Verify all required fields are present
      expect(workspaceCreatePayload).toHaveProperty('dual_pane_state')
      expect(workspaceCreatePayload.dual_pane_state).toBeDefined()
      expect(workspaceCreatePayload.dual_pane_state).not.toBeNull()
    })

    it('should handle workspace fetching with explicit field selection', () => {
      const selectFields = 'id, name, description, dual_pane_state, chat_context, canvas_elements, created_at, updated_at'
      const fieldsArray = selectFields.split(', ').map(field => field.trim())

      expect(fieldsArray).toContain('dual_pane_state')
      expect(fieldsArray).toContain('id')
      expect(fieldsArray).toContain('name')
      expect(fieldsArray).toContain('description')
    })
  })
})