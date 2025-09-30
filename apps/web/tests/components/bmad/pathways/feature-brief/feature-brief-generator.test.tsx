import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import FeatureBriefGenerator from '@/app/components/bmad/pathways/FeatureBriefGenerator'
import { FeatureSessionData, FeatureBrief } from '@/lib/bmad/types'

// Mock fetch
global.fetch = vi.fn()

const mockSessionData: FeatureSessionData = {
  featureInput: {
    feature_description: 'Add user profile customization',
    target_users: 'End users',
    current_problems: 'Limited personalization',
    success_definition: 'Increased user engagement',
    analysis_questions: ['Question 1', 'Question 2'],
    input_timestamp: new Date()
  },
  priorityScoring: {
    effort_score: 3,
    impact_score: 8,
    calculated_priority: 2.67,
    priority_category: 'Critical',
    quadrant: 'Quick Wins',
    scoring_timestamp: new Date()
  }
}

const mockBrief: FeatureBrief = {
  id: 'brief-123',
  title: 'Add User Profile Customization',
  description: 'Enable users to customize their profile settings and preferences.',
  userStories: [
    'As a user, I want to customize my profile so that I can express my identity',
    'As a user, I want to save my preferences so that I have a consistent experience'
  ],
  acceptanceCriteria: [
    'User can upload profile photo',
    'User can edit display name',
    'User can set privacy preferences',
    'Changes are saved immediately',
    'User receives confirmation of changes'
  ],
  successMetrics: [
    'Profile completion rate increases by 40% within 3 months',
    'User engagement increases by 25% within 2 months',
    'Customization feature usage reaches 60% of active users'
  ],
  implementationNotes: [
    'Consider mobile-first design approach',
    'Implement progressive enhancement for photos',
    'Add analytics tracking for feature usage'
  ],
  priorityContext: {
    score: 2.67,
    category: 'Critical',
    quadrant: 'Quick Wins'
  },
  generatedAt: new Date(),
  lastEditedAt: new Date(),
  version: 1
}

describe('FeatureBriefGenerator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state while generating brief', () => {
    ;(global.fetch as any).mockImplementation(() =>
      new Promise(() => {}) // Never resolves
    )

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
      />
    )

    expect(screen.getByText('Generating your feature brief...')).toBeInTheDocument()
    expect(screen.getByText(/This may take up to 10 seconds/)).toBeInTheDocument()
  })

  it('should generate brief on mount', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        brief: mockBrief,
        validation: {
          isValid: true,
          qualityScore: 95,
          errors: [],
          warnings: []
        }
      })
    })

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
      />
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId: 'test-session'
        })
      })
    })

    await waitFor(() => {
      expect(screen.getByText(mockBrief.title)).toBeInTheDocument()
    })
  })

  it('should display brief content after generation', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        brief: mockBrief,
        validation: {
          isValid: true,
          qualityScore: 95,
          errors: [],
          warnings: []
        }
      })
    })

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(mockBrief.title)).toBeInTheDocument()
      expect(screen.getByText(mockBrief.description)).toBeInTheDocument()
    })

    // Check user stories are displayed
    mockBrief.userStories.forEach(story => {
      expect(screen.getByText(story)).toBeInTheDocument()
    })

    // Check acceptance criteria are displayed
    mockBrief.acceptanceCriteria.forEach(ac => {
      expect(screen.getByText(ac)).toBeInTheDocument()
    })
  })

  it('should display quality score', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        brief: mockBrief,
        validation: {
          isValid: true,
          qualityScore: 95,
          errors: [],
          warnings: []
        }
      })
    })

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Brief Quality Score')).toBeInTheDocument()
      expect(screen.getByText('95/100')).toBeInTheDocument()
      expect(screen.getByText('✓ Excellent')).toBeInTheDocument()
    })
  })

  it('should display validation errors and warnings', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        brief: mockBrief,
        validation: {
          isValid: false,
          qualityScore: 65,
          errors: ['Title is too short'],
          warnings: ['Consider adding more acceptance criteria']
        }
      })
    })

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('✗ Title is too short')).toBeInTheDocument()
      expect(screen.getByText('⚠ Consider adding more acceptance criteria')).toBeInTheDocument()
    })
  })

  it('should toggle between view and edit modes', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        brief: mockBrief,
        validation: {
          isValid: true,
          qualityScore: 95,
          errors: [],
          warnings: []
        }
      })
    })

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Edit Mode')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit Mode')
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('View Mode')).toBeInTheDocument()
    })
  })

  it('should regenerate brief when regenerate button clicked', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          brief: mockBrief,
          validation: {
            isValid: true,
            qualityScore: 95,
            errors: [],
            warnings: []
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          brief: { ...mockBrief, version: 2 },
          validation: {
            isValid: true,
            qualityScore: 98,
            errors: [],
            warnings: []
          }
        })
      })

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('↻ Regenerate')).toBeInTheDocument()
    })

    const regenerateButton = screen.getByText('↻ Regenerate')
    fireEvent.click(regenerateButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_feature_brief',
          sessionId: 'test-session'
        })
      })
    })
  })

  it('should display error message on generation failure', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Failed to generate feature brief')).toBeInTheDocument()
    })
  })

  it('should call onComplete when complete button clicked', async () => {
    const mockOnComplete = vi.fn()

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        brief: mockBrief,
        validation: {
          isValid: true,
          qualityScore: 95,
          errors: [],
          warnings: []
        }
      })
    })

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
        onComplete={mockOnComplete}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Complete Feature Refinement →')).toBeInTheDocument()
    })

    const completeButton = screen.getByText('Complete Feature Refinement →')
    fireEvent.click(completeButton)

    expect(mockOnComplete).toHaveBeenCalled()
  })

  it('should display priority context', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        brief: mockBrief,
        validation: {
          isValid: true,
          qualityScore: 95,
          errors: [],
          warnings: []
        }
      })
    })

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Priority Context')).toBeInTheDocument()
      expect(screen.getByText('Critical')).toBeInTheDocument()
      expect(screen.getByText('Quick Wins')).toBeInTheDocument()
    })
  })

  it('should display progress indicator', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        brief: mockBrief,
        validation: {
          isValid: true,
          qualityScore: 95,
          errors: [],
          warnings: []
        }
      })
    })

    render(
      <FeatureBriefGenerator
        sessionId="test-session"
        sessionData={mockSessionData}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Step 4 of 4 - Feature Brief')).toBeInTheDocument()
      expect(screen.getByText(/Time remaining: ~6 minutes/)).toBeInTheDocument()
    })
  })
})