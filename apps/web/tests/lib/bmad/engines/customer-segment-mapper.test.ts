/**
 * Tests for CustomerSegmentMapper
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CustomerSegmentMapper } from '@/lib/bmad/engines/customer-segment-mapper'
import { ConversationMessage } from '@/lib/bmad/types'

describe('CustomerSegmentMapper', () => {
  let mapper: CustomerSegmentMapper

  beforeEach(() => {
    mapper = new CustomerSegmentMapper()
  })

  describe('analyze', () => {
    it('should extract customer segments from conversation', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Our target customers are small businesses and startups looking for affordable solutions.',
          timestamp: new Date()
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Tell me more about these small businesses.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.segments.length).toBeGreaterThan(0)

      // Should identify small business and startup segments
      const segmentNames = result.data!.segments.map(s => s.name.toLowerCase())
      expect(segmentNames.some(name => name.includes('small'))).toBe(true)
    })

    it('should return error when no segments identified', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'I want to build something.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No customer segments identified')
    })

    it('should enrich segments with value propositions', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'We target small businesses who struggle with time management and budget constraints.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      const segment = result.data!.segments[0]
      expect(segment.valuePropositions.length).toBeGreaterThan(0)
      expect(segment.painPoints.length).toBeGreaterThan(0)
    })

    it('should estimate CLV and CAC for segments', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Our customers are enterprise companies with large budgets.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      const segment = result.data!.segments[0]
      expect(segment.clvEstimate).toBeDefined()
      expect(segment.cacEstimate).toBeDefined()
      expect(segment.clvEstimate).toContain('$')
      expect(segment.cacEstimate).toContain('$')
    })

    it('should prioritize segments', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'We serve small businesses, enterprise companies, and individual freelancers.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      expect(result.data!.prioritySegments.length).toBeGreaterThan(0)
      expect(result.data!.prioritySegments.length).toBeLessThanOrEqual(3) // Top 3
    })

    it('should identify segmentation criteria', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'We target small tech-savvy businesses and large enterprises with different pricing.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      expect(result.data!.segmentationCriteria.length).toBeGreaterThan(0)
      expect(Array.isArray(result.data!.segmentationCriteria)).toBe(true)
    })

    it('should generate insights about segments', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'We have multiple customer types including startups and agencies.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      expect(result.data!.insights.length).toBeGreaterThan(0)
      expect(result.data!.insights[0]).toContain('segment')
    })

    it('should include confidence score in metadata', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Our target market is small businesses.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      expect(result.metadata).toBeDefined()
      expect(result.metadata!.confidence).toBeGreaterThan(0)
      expect(result.metadata!.confidence).toBeLessThanOrEqual(100)
    })

    it('should use context for segment enrichment', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'We target businesses.',
          timestamp: new Date()
        }
      ]

      const context = {
        targetCustomers: 'E-commerce stores\nSaaS companies',
        uniqueValue: 'Save 10 hours per week'
      }

      const result = await mapper.analyze(conversation, undefined, context)

      expect(result.success).toBe(true)
      // Should include context-provided segments
      const segmentNames = result.data!.segments.map(s => s.name.toLowerCase())
      expect(segmentNames.some(name => name.includes('ecommerce') || name.includes('saas'))).toBe(true)
    })

    it('should deduplicate similar segments', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'We serve small businesses, SMBs, and small companies.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      // Should not have duplicate small business segments
      const smallBizCount = result.data!.segments.filter(s =>
        s.name.toLowerCase().includes('small')
      ).length
      expect(smallBizCount).toBeLessThanOrEqual(1)
    })

    it('should map value propositions to segments', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Small businesses need affordable, easy-to-use solutions.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      expect(result.data!.valuePropositionMap).toBeDefined()
      expect(Object.keys(result.data!.valuePropositionMap).length).toBeGreaterThan(0)
    })

    it('should handle revenue streams in analysis', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'We target subscription-based SaaS customers.',
          timestamp: new Date()
        }
      ]

      const revenueStreams = [
        {
          id: 'rev-1',
          name: 'Monthly Subscription',
          type: 'subscription' as const,
          description: 'Monthly recurring revenue',
          targetMarket: 'SaaS companies',
          feasibilityScore: 85,
          pros: ['Predictable revenue'],
          cons: ['Churn risk'],
          implementation: ['Set up billing']
        }
      ]

      const result = await mapper.analyze(conversation, revenueStreams)

      expect(result.success).toBe(true)
      expect(result.data!.segments.length).toBeGreaterThan(0)
    })
  })

  describe('segment characteristics', () => {
    it('should identify different segment sizes', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'We target individual consumers, small businesses, and large enterprises.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      const sizes = result.data!.segments.map(s => s.size)
      expect(sizes).toContain('large')
      expect(sizes.length).toBeGreaterThan(0)
    })

    it('should provide acquisition channels for each segment', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Our customers are startups found through Product Hunt.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      const segment = result.data!.segments[0]
      expect(segment.acquisitionChannels.length).toBeGreaterThan(0)
    })

    it('should identify pain points for segments', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Small businesses struggle with limited budgets and time constraints.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      const segment = result.data!.segments[0]
      expect(segment.painPoints.length).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should handle empty conversation', async () => {
      const conversation: ConversationMessage[] = []

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle conversation with no useful content', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello.',
          timestamp: new Date()
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(false)
    })

    it('should provide helpful error messages', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'I have an idea.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(false)
      expect(result.error).toContain('describe your target customers')
    })
  })

  describe('confidence scoring', () => {
    it('should have higher confidence with more segments', async () => {
      const shortConvo: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'We target small businesses.',
          timestamp: new Date()
        }
      ]

      const longConvo: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'We target small businesses, enterprises, startups, and agencies with specific needs.',
          timestamp: new Date()
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Tell me more.',
          timestamp: new Date()
        },
        {
          id: '3',
          role: 'user',
          content: 'Each segment has unique characteristics and pain points.',
          timestamp: new Date()
        }
      ]

      const result1 = await mapper.analyze(shortConvo)
      const result2 = await mapper.analyze(longConvo)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result2.metadata!.confidence).toBeGreaterThanOrEqual(result1.metadata!.confidence)
    })

    it('should have higher confidence with complete segment data', async () => {
      const conversation: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Small businesses need affordable solutions due to budget constraints and limited time.',
          timestamp: new Date()
        }
      ]

      const result = await mapper.analyze(conversation)

      expect(result.success).toBe(true)
      expect(result.metadata!.confidence).toBeGreaterThan(50)
    })
  })
})