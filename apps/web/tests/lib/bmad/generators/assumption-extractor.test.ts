import { describe, it, expect } from 'vitest'
import {
  extractAssumptions,
  categorizeAssumptions,
  formatAssumptionsAsMarkdown,
  Assumption,
} from '@/lib/bmad/generators/assumption-extractor'
import { Message } from '@/lib/ai/types'

describe('Assumption Extractor', () => {
  describe('extractAssumptions', () => {
    it('should extract "assuming that" patterns', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'I think our app will work because assuming that users want a simpler solution they will switch.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions.length).toBe(1)
      expect(assumptions[0].text).toContain('users want a simpler solution')
      expect(assumptions[0].source).toBe('user')
    })

    it('should extract "this assumes" patterns', () => {
      const messages: Message[] = [
        {
          role: 'assistant',
          content: 'This pricing model is interesting. This assumes that enterprise customers will pay $500/month for premium features.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions.length).toBe(1)
      expect(assumptions[0].text).toContain('enterprise customers will pay')
      expect(assumptions[0].source).toBe('assistant')
    })

    it('should extract "based on the assumption" patterns', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Based on the assumption that the market will grow 20% annually we can scale.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions.length).toBe(1)
      expect(assumptions[0].text).toContain('market will grow 20%')
    })

    it('should extract "if we assume" patterns', () => {
      const messages: Message[] = [
        {
          role: 'assistant',
          content: 'If we assume that users prefer mobile over desktop this design makes sense.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions.length).toBe(1)
      expect(assumptions[0].text).toContain('users prefer mobile over desktop')
    })

    it('should deduplicate identical assumptions', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Assuming that customers want faster delivery options for their orders.',
        },
        {
          role: 'user',
          content: 'As I mentioned, assuming that customers want faster delivery options for their orders.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      // Should only have 1 unique assumption, not 2
      expect(assumptions.length).toBe(1)
    })

    it('should skip assumptions that are too short', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Assuming that X.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions.length).toBe(0)
    })

    it('should extract multiple assumptions from conversation', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'We are assuming that small businesses need better tools for this.',
        },
        {
          role: 'assistant',
          content: 'The assumption is that they have budget for new software tools.',
        },
        {
          role: 'user',
          content: 'If we assume that the average customer will stay for 12 months that works.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions.length).toBe(3)
    })
  })

  describe('challenged assumptions', () => {
    it('should detect when Mary challenges an assumption', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'We are assuming that users want more features rather than simplicity.',
        },
        {
          role: 'assistant',
          content: 'I want to challenge this assumption. Is that really true? Have you validated that users want more features because sometimes the need is actually for simplicity.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions.length).toBe(1)
      expect(assumptions[0].challenged).toBe(true)
      expect(assumptions[0].challengeReason).toBeTruthy()
    })

    it('should mark as unchallenged when no challenge occurs', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'We are assuming that the API will handle 1000 requests per second.',
        },
        {
          role: 'assistant',
          content: 'That sounds reasonable for your expected traffic.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions.length).toBe(1)
      expect(assumptions[0].challenged).toBe(false)
    })
  })

  describe('categorizeAssumptions', () => {
    it('should categorize assumptions by type', () => {
      const assumptions: Assumption[] = [
        {
          text: 'Users will prefer mobile over desktop',
          source: 'user',
          sourceMessage: '',
          challenged: false,
          category: 'user',
        },
        {
          text: 'The market will grow 20% this year',
          source: 'user',
          sourceMessage: '',
          challenged: false,
          category: 'market',
        },
        {
          text: 'Revenue will be $100K in year one',
          source: 'user',
          sourceMessage: '',
          challenged: true,
          challengeReason: 'Seems optimistic',
          category: 'business',
        },
      ]

      const categorized = categorizeAssumptions(assumptions)

      expect(categorized.user.length).toBe(1)
      expect(categorized.market.length).toBe(1)
      expect(categorized.business.length).toBe(1)
      expect(categorized.challenged.length).toBe(1)
    })
  })

  describe('formatAssumptionsAsMarkdown', () => {
    it('should return empty string for no assumptions', () => {
      const result = formatAssumptionsAsMarkdown([])
      expect(result).toBe('')
    })

    it('should format assumptions with proper sections', () => {
      const assumptions: Assumption[] = [
        {
          text: 'Users want simpler tools',
          source: 'user',
          sourceMessage: '',
          challenged: false,
          category: 'user',
        },
        {
          text: 'Revenue will hit $50K MRR',
          source: 'assistant',
          sourceMessage: '',
          challenged: true,
          challengeReason: 'This seems aggressive',
          category: 'business',
        },
      ]

      const result = formatAssumptionsAsMarkdown(assumptions)

      expect(result).toContain('## Key Assumptions')
      expect(result).toContain('### User Assumptions')
      expect(result).toContain('### Business Assumptions')
      expect(result).toContain('### Challenged Assumptions')
      expect(result).toContain('Users want simpler tools')
      expect(result).toContain('This seems aggressive')
    })
  })

  describe('assumption categorization by keywords', () => {
    it('should categorize user-related assumptions', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Assuming that customers prefer self-service over talking to support.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions[0].category).toBe('user')
    })

    it('should categorize market-related assumptions', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Assuming that the market demand will increase with competition.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions[0].category).toBe('market')
    })

    it('should categorize technical assumptions', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Assuming that the API integration will scale with our infrastructure.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions[0].category).toBe('technical')
    })

    it('should categorize business assumptions', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Assuming that our pricing will generate enough revenue for profit.',
        },
      ]

      const assumptions = extractAssumptions(messages)

      expect(assumptions[0].category).toBe('business')
    })
  })
})
