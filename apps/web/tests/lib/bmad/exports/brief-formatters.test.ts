import { describe, it, expect } from 'vitest'
import {
  formatBriefAsMarkdown,
  formatBriefAsText,
  formatBriefAsHTML
} from '@/lib/bmad/exports/brief-formatters'
import { FeatureBrief } from '@/lib/bmad/types'

const mockBrief: FeatureBrief = {
  id: 'brief-123',
  title: 'Add User Profile Customization',
  description: 'Enable users to customize their profile settings and preferences for a more personalized experience.',
  userStories: [
    'As a user, I want to customize my profile so that I can express my identity',
    'As a user, I want to save my preferences so that I have a consistent experience',
    'As an admin, I want to see user customization data so that I can understand engagement'
  ],
  acceptanceCriteria: [
    'User can upload profile photo up to 5MB',
    'User can edit display name with 3-50 characters',
    'User can set privacy preferences (public, private, friends)',
    'Changes are saved automatically within 2 seconds',
    'User receives visual confirmation of changes'
  ],
  successMetrics: [
    'Profile completion rate increases by 40% within 3 months',
    'User engagement increases by 25% within 2 months',
    'Customization feature usage reaches 60% of active users within 1 month'
  ],
  implementationNotes: [
    'Consider mobile-first design approach for responsive layouts',
    'Implement progressive enhancement for photo uploads',
    'Add analytics tracking for feature usage and engagement metrics'
  ],
  priorityContext: {
    score: 2.67,
    category: 'Critical',
    quadrant: 'Quick Wins'
  },
  generatedAt: new Date('2024-01-15T10:00:00Z'),
  lastEditedAt: new Date('2024-01-15T10:30:00Z'),
  version: 1
}

describe('Brief Formatters', () => {
  describe('formatBriefAsMarkdown', () => {
    it('should format brief as markdown with all sections', () => {
      const markdown = formatBriefAsMarkdown(mockBrief)

      // Check title
      expect(markdown).toContain('# Add User Profile Customization')

      // Check metadata
      expect(markdown).toContain('**Priority Score:** 2.67')
      expect(markdown).toContain('**Priority Category:** Critical')
      expect(markdown).toContain('**Priority Quadrant:** Quick Wins')

      // Check description
      expect(markdown).toContain('## Description')
      expect(markdown).toContain('Enable users to customize their profile')

      // Check user stories section
      expect(markdown).toContain('## User Stories')
      expect(markdown).toContain('1. As a user, I want to customize my profile')
      expect(markdown).toContain('2. As a user, I want to save my preferences')
      expect(markdown).toContain('3. As an admin, I want to see user customization data')

      // Check acceptance criteria
      expect(markdown).toContain('## Acceptance Criteria')
      expect(markdown).toContain('1. User can upload profile photo')
      expect(markdown).toContain('5. User receives visual confirmation')

      // Check success metrics
      expect(markdown).toContain('## Success Metrics')
      expect(markdown).toContain('Profile completion rate increases by 40%')

      // Check implementation notes
      expect(markdown).toContain('## Implementation Notes')
      expect(markdown).toContain('Consider mobile-first design approach')
    })

    it('should handle empty arrays gracefully', () => {
      const briefWithEmptyArrays: FeatureBrief = {
        ...mockBrief,
        userStories: [],
        acceptanceCriteria: [],
        successMetrics: [],
        implementationNotes: []
      }

      const markdown = formatBriefAsMarkdown(briefWithEmptyArrays)

      expect(markdown).toContain('# Add User Profile Customization')
      expect(markdown).toContain('## User Stories')
      expect(markdown).toContain('## Acceptance Criteria')
      expect(markdown).not.toContain('undefined')
    })

    it('should format metadata footer', () => {
      const markdown = formatBriefAsMarkdown(mockBrief)

      expect(markdown).toContain('---')
      expect(markdown).toContain('*Generated:')
      expect(markdown).toContain('Version: 1*')
    })
  })

  describe('formatBriefAsText', () => {
    it('should format brief as plain text with ASCII decorations', () => {
      const text = formatBriefAsText(mockBrief)

      // Check title formatting
      expect(text).toContain('ADD USER PROFILE CUSTOMIZATION')
      expect(text).toContain('='.repeat(50))

      // Check priority context
      expect(text).toContain('PRIORITY CONTEXT')
      expect(text).toContain('Priority Score: 2.67')
      expect(text).toContain('Category: Critical')
      expect(text).toContain('Quadrant: Quick Wins')

      // Check sections
      expect(text).toContain('DESCRIPTION')
      expect(text).toContain('USER STORIES')
      expect(text).toContain('ACCEPTANCE CRITERIA')
      expect(text).toContain('SUCCESS METRICS')
      expect(text).toContain('IMPLEMENTATION NOTES')

      // Check numbered lists
      expect(text).toContain('1. As a user, I want to customize')
      expect(text).toContain('2. As a user, I want to save')
    })

    it('should use ASCII bullets and separators', () => {
      const text = formatBriefAsText(mockBrief)

      expect(text).toContain('---')
      expect(text).toContain('-'.repeat(50))
    })

    it('should handle special characters in text format', () => {
      const briefWithSpecialChars: FeatureBrief = {
        ...mockBrief,
        description: 'Test with "quotes" and \'apostrophes\' & symbols'
      }

      const text = formatBriefAsText(briefWithSpecialChars)

      expect(text).toContain('quotes')
      expect(text).toContain('apostrophes')
      expect(text).toContain('&')
    })
  })

  describe('formatBriefAsHTML', () => {
    it('should format brief as styled HTML', () => {
      const html = formatBriefAsHTML(mockBrief)

      // Check HTML structure
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html>')
      expect(html).toContain('</html>')
      expect(html).toContain('<head>')
      expect(html).toContain('<body>')

      // Check title
      expect(html).toContain('<h1>Add User Profile Customization</h1>')

      // Check styling
      expect(html).toContain('<style>')
      expect(html).toContain('font-family')
      expect(html).toContain('max-width')

      // Check priority badge
      expect(html).toContain('priority-badge')
      expect(html).toContain('Critical')
      expect(html).toContain('Quick Wins')

      // Check sections
      expect(html).toContain('<h2>Description</h2>')
      expect(html).toContain('<h2>User Stories</h2>')
      expect(html).toContain('<h2>Acceptance Criteria</h2>')

      // Check lists
      expect(html).toContain('<ol>')
      expect(html).toContain('</ol>')
      expect(html).toContain('<li>')
    })

    it('should apply proper CSS styling', () => {
      const html = formatBriefAsHTML(mockBrief)

      // Check color scheme
      expect(html).toContain('#1e3a8a') // Blue color
      expect(html).toContain('#059669') // Green color

      // Check responsive design
      expect(html).toContain('max-width: 800px')
      expect(html).toContain('margin: 0 auto')
      expect(html).toContain('padding')
    })

    it('should escape HTML special characters', () => {
      const briefWithHTML: FeatureBrief = {
        ...mockBrief,
        description: 'Test with <script>alert("xss")</script> tags'
      }

      const html = formatBriefAsHTML(briefWithHTML)

      // Should escape the script tag
      expect(html).toContain('&lt;script&gt;')
      expect(html).toContain('&lt;/script&gt;')
      expect(html).not.toContain('<script>alert')
    })

    it('should include metadata footer in HTML', () => {
      const html = formatBriefAsHTML(mockBrief)

      expect(html).toContain('<div class="metadata">')
      expect(html).toContain('Generated:')
      expect(html).toContain('Version: 1')
    })

    it('should handle long content without breaking layout', () => {
      const briefWithLongContent: FeatureBrief = {
        ...mockBrief,
        description: 'A'.repeat(1000),
        userStories: Array(20).fill('Long user story ' + 'content '.repeat(50))
      }

      const html = formatBriefAsHTML(briefWithLongContent)

      expect(html).toContain('word-wrap: break-word')
      expect(html).toContain('max-width')
    })
  })

  describe('Format Consistency', () => {
    it('should include all required sections in all formats', () => {
      const markdown = formatBriefAsMarkdown(mockBrief)
      const text = formatBriefAsText(mockBrief)
      const html = formatBriefAsHTML(mockBrief)

      const requiredSections = [
        'User Stories',
        'Acceptance Criteria',
        'Success Metrics',
        'Implementation Notes'
      ]

      requiredSections.forEach(section => {
        expect(markdown).toContain(section)
        expect(text.toUpperCase()).toContain(section.toUpperCase())
        expect(html).toContain(section)
      })
    })

    it('should preserve content integrity across formats', () => {
      const markdown = formatBriefAsMarkdown(mockBrief)
      const text = formatBriefAsText(mockBrief)
      const html = formatBriefAsHTML(mockBrief)

      const criticalContent = [
        mockBrief.title,
        mockBrief.userStories[0],
        mockBrief.acceptanceCriteria[0],
        mockBrief.successMetrics[0]
      ]

      criticalContent.forEach(content => {
        expect(markdown).toContain(content)
        expect(text).toContain(content)
        // HTML might have escaped characters, so check contains partial
        expect(html).toContain(content.substring(0, 20))
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle brief with minimal data', () => {
      const minimalBrief: FeatureBrief = {
        id: 'minimal',
        title: 'Minimal Feature',
        description: 'Short description',
        userStories: ['Single story'],
        acceptanceCriteria: ['Single criterion'],
        successMetrics: ['Single metric'],
        implementationNotes: [],
        priorityContext: {
          score: 1.0,
          category: 'Low',
          quadrant: 'Time Wasters'
        },
        generatedAt: new Date(),
        lastEditedAt: new Date(),
        version: 1
      }

      expect(() => formatBriefAsMarkdown(minimalBrief)).not.toThrow()
      expect(() => formatBriefAsText(minimalBrief)).not.toThrow()
      expect(() => formatBriefAsHTML(minimalBrief)).not.toThrow()
    })

    it('should handle special priority values', () => {
      const specialBrief: FeatureBrief = {
        ...mockBrief,
        priorityContext: {
          score: 10.0,
          category: 'Critical',
          quadrant: 'Quick Wins'
        }
      }

      const markdown = formatBriefAsMarkdown(specialBrief)
      expect(markdown).toContain('10')

      const text = formatBriefAsText(specialBrief)
      expect(text).toContain('10')
    })
  })
})