import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/bmad/route'
import { FeatureBrief } from '@/lib/bmad/types'

/**
 * Integration Test Suite: Feature Brief API Endpoints
 *
 * Tests the API integration for Story 2.4c Feature Brief Generation
 * Covers all 4 API actions:
 * - generate_feature_brief
 * - update_feature_brief
 * - regenerate_feature_brief
 * - export_feature_brief
 */

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-session-123',
              user_id: 'test-user-123',
              session_data: {
                featureInput: {
                  feature_description: 'Add user profile customization',
                  analysis_questions: ['Question 1', 'Question 2']
                },
                priorityScoring: {
                  effort_score: 3,
                  impact_score: 8,
                  calculated_priority: 2.67,
                  priority_category: 'Critical',
                  quadrant: 'Quick Wins'
                }
              }
            },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: { id: 'test-session-123' },
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        data: [{ id: 'test-session-123' }],
        error: null
      }))
    }))
  }))
}))

// Mock Anthropic client
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn(async () => ({
        content: [{
          type: 'text',
          text: JSON.stringify({
            title: 'Add User Profile Customization',
            description: 'Enable users to customize their profiles',
            userStories: [
              'As a user, I want to customize my profile so that I can express my identity',
              'As a user, I want to save preferences so that I have consistent experience'
            ],
            acceptanceCriteria: [
              'User can upload profile photo',
              'User can edit display name',
              'User can set privacy preferences',
              'Changes saved automatically',
              'User receives confirmation'
            ],
            successMetrics: [
              'Profile completion rate increases 40% in 3 months',
              'User engagement increases 25% in 2 months',
              'Feature usage reaches 60% of users'
            ],
            implementationNotes: [
              'Consider mobile-first design',
              'Implement progressive enhancement',
              'Add analytics tracking'
            ]
          })
        }]
      }))
    }
  }))
}))

describe('Feature Brief API Integration Tests', () => {
  let mockRequest: Request

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/bmad - generate_feature_brief', () => {
    it('should generate feature brief from session data', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId: 'test-session-123'
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('brief')
      expect(data).toHaveProperty('validation')

      const brief: FeatureBrief = data.brief
      expect(brief).toHaveProperty('id')
      expect(brief).toHaveProperty('title')
      expect(brief).toHaveProperty('description')
      expect(brief).toHaveProperty('userStories')
      expect(brief).toHaveProperty('acceptanceCriteria')
      expect(brief).toHaveProperty('successMetrics')
      expect(brief).toHaveProperty('implementationNotes')
      expect(brief).toHaveProperty('priorityContext')

      // Verify priority context matches session data
      expect(brief.priorityContext.category).toBe('Critical')
      expect(brief.priorityContext.quadrant).toBe('Quick Wins')
    })

    it('should return validation results with quality score', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId: 'test-session-123'
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(data.validation).toHaveProperty('isValid')
      expect(data.validation).toHaveProperty('qualityScore')
      expect(data.validation).toHaveProperty('errors')
      expect(data.validation).toHaveProperty('warnings')

      expect(typeof data.validation.qualityScore).toBe('number')
      expect(data.validation.qualityScore).toBeGreaterThanOrEqual(0)
      expect(data.validation.qualityScore).toBeLessThanOrEqual(100)
    })

    it('should validate user story format', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId: 'test-session-123'
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      const brief: FeatureBrief = data.brief
      brief.userStories.forEach(story => {
        // Should follow "As a... I want... so that..." format
        expect(story).toMatch(/As a|As an/i)
        expect(story).toMatch(/I want|I need/i)
        expect(story).toMatch(/so that/i)
      })
    })

    it('should include priority-based implementation guidance', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId: 'test-session-123'
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      const brief: FeatureBrief = data.brief
      expect(brief.implementationNotes.length).toBeGreaterThan(0)

      // Quick Wins should have fast-track guidance
      const guidanceText = brief.implementationNotes.join(' ').toLowerCase()
      expect(guidanceText).toMatch(/fast|quick|priority|immediate/i)
    })

    it('should return 400 for missing sessionId', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief'
          // Missing sessionId
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should return 404 for non-existent session', async () => {
      // Mock Supabase to return no data
      vi.mocked(createClient).mockReturnValueOnce({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { message: 'Session not found' }
              }))
            }))
          }))
        }))
      } as any)

      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId: 'non-existent-session'
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/bmad - update_feature_brief', () => {
    it('should update brief with new content', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_feature_brief',
          sessionId: 'test-session-123',
          briefId: 'brief-123',
          updates: {
            title: 'Updated Feature Title',
            description: 'Updated description with more details'
          }
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.brief.title).toBe('Updated Feature Title')
      expect(data.brief.description).toBe('Updated description with more details')
      expect(data.brief).toHaveProperty('lastEditedAt')
    })

    it('should validate updated content', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_feature_brief',
          sessionId: 'test-session-123',
          briefId: 'brief-123',
          updates: {
            title: 'AB', // Too short
            userStories: ['Invalid story without proper format']
          }
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(data.validation.errors.length).toBeGreaterThan(0)
      expect(data.validation.qualityScore).toBeLessThan(100)
    })

    it('should preserve version number on update', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_feature_brief',
          sessionId: 'test-session-123',
          briefId: 'brief-123',
          updates: {
            description: 'Minor description update'
          }
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      // Version should remain same for updates (only increment on regenerate)
      expect(data.brief.version).toBe(1)
    })
  })

  describe('POST /api/bmad - regenerate_feature_brief', () => {
    it('should regenerate brief and increment version', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_feature_brief',
          sessionId: 'test-session-123'
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.brief.version).toBe(2) // Incremented from 1 to 2
      expect(data.brief).toHaveProperty('generatedAt')
      expect(data.brief).toHaveProperty('lastEditedAt')
    })

    it('should generate different content on regeneration', async () => {
      // First generation
      const firstRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId: 'test-session-123'
        })
      })

      const firstResponse = await POST(firstRequest)
      const firstData = await firstResponse.json()

      // Regeneration
      const regenRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_feature_brief',
          sessionId: 'test-session-123'
        })
      })

      const regenResponse = await POST(regenRequest)
      const regenData = await regenResponse.json()

      // Should have different IDs
      expect(regenData.brief.id).not.toBe(firstData.brief.id)
      expect(regenData.brief.version).toBeGreaterThan(firstData.brief.version)
    })
  })

  describe('POST /api/bmad - export_feature_brief', () => {
    it('should export brief as markdown', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId: 'test-session-123',
          briefId: 'brief-123',
          format: 'markdown'
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.export).toHaveProperty('format', 'markdown')
      expect(data.export).toHaveProperty('content')
      expect(data.export).toHaveProperty('filename')

      expect(data.export.filename).toMatch(/\.md$/)
      expect(data.export.content).toContain('# ')
      expect(data.export.content).toContain('## ')
    })

    it('should export brief as text', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId: 'test-session-123',
          briefId: 'brief-123',
          format: 'text'
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(data.export.format).toBe('text')
      expect(data.export.filename).toMatch(/\.txt$/)
      expect(data.export.content).toContain('=====')
      expect(data.export.content).toContain('-----')
    })

    it('should export brief as PDF/HTML', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId: 'test-session-123',
          briefId: 'brief-123',
          format: 'pdf'
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(data.export.format).toBe('pdf')
      expect(data.export.filename).toMatch(/\.pdf$/)
      expect(data.export.content).toContain('<!DOCTYPE html>')
      expect(data.export.content).toContain('<style>')
    })

    it('should include all brief sections in export', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId: 'test-session-123',
          briefId: 'brief-123',
          format: 'markdown'
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      const content = data.export.content
      expect(content).toContain('User Stories')
      expect(content).toContain('Acceptance Criteria')
      expect(content).toContain('Success Metrics')
      expect(content).toContain('Implementation Notes')
      expect(content).toContain('Priority')
    })

    it('should return 400 for invalid format', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId: 'test-session-123',
          briefId: 'brief-123',
          format: 'invalid-format'
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(400)
    })
  })

  describe('Performance Requirements', () => {
    it('should generate brief within 10 seconds', async () => {
      const startTime = Date.now()

      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId: 'test-session-123'
        })
      })

      await POST(mockRequest)

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(10000) // 10 seconds max
    })

    it('should export brief within 5 seconds', async () => {
      const startTime = Date.now()

      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId: 'test-session-123',
          briefId: 'brief-123',
          format: 'markdown'
        })
      })

      await POST(mockRequest)

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(5000) // 5 seconds max
    })
  })

  describe('Error Handling', () => {
    it('should handle Claude API errors gracefully', async () => {
      // Mock Anthropic to throw error
      vi.mocked(Anthropic).mockImplementationOnce(() => ({
        messages: {
          create: vi.fn(() => Promise.reject(new Error('API rate limit exceeded')))
        }
      } as any))

      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId: 'test-session-123'
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should handle database errors gracefully', async () => {
      // Mock Supabase to throw error
      vi.mocked(createClient).mockReturnValueOnce({
        from: vi.fn(() => ({
          select: vi.fn(() => {
            throw new Error('Database connection failed')
          })
        }))
      } as any)

      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId: 'test-session-123'
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(500)
    })

    it('should handle malformed JSON in request', async () => {
      mockRequest = new Request('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(400)
    })
  })
})