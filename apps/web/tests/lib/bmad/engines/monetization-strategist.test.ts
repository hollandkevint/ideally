/**
 * Tests for MonetizationStrategist
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MonetizationStrategist } from '@/lib/bmad/engines/monetization-strategist'
import {
  ConversationMessage,
  RevenueStream,
  CustomerSegment
} from '@/lib/bmad/types'

describe('MonetizationStrategist', () => {
  let strategist: MonetizationStrategist

  beforeEach(() => {
    strategist = new MonetizationStrategist()
  })

  const mockRevenueStreams: RevenueStream[] = [
    {
      id: 'rev-1',
      name: 'Monthly Subscription',
      type: 'subscription',
      description: 'Monthly recurring revenue',
      targetMarket: 'SaaS companies',
      feasibilityScore: 85,
      pros: ['Predictable revenue', 'Low churn'],
      cons: ['Requires customer success'],
      implementation: ['Set up billing', 'Payment processor']
    },
    {
      id: 'rev-2',
      name: 'One-time Purchase',
      type: 'one-time',
      description: 'Single payment model',
      targetMarket: 'All customers',
      feasibilityScore: 70,
      pros: ['Simple', 'No churn management'],
      cons: ['No recurring revenue'],
      implementation: ['Payment gateway']
    }
  ]

  const mockCustomerSegments: CustomerSegment[] = [
    {
      id: 'seg-1',
      name: 'Small Businesses',
      description: 'SMBs with 10-50 employees',
      size: 'large',
      characteristics: ['Budget conscious', 'Value simple solutions'],
      painPoints: ['Limited budget', 'Time constraints'],
      valuePropositions: ['Affordable pricing', 'Easy to use'],
      acquisitionChannels: ['SEO', 'Content marketing'],
      clvEstimate: '$3,000',
      cacEstimate: '$100'
    },
    {
      id: 'seg-2',
      name: 'Enterprise',
      description: 'Large organizations',
      size: 'medium',
      characteristics: ['Complex needs', 'Security focused'],
      painPoints: ['Integration challenges', 'Compliance'],
      valuePropositions: ['Enterprise features', 'Security'],
      acquisitionChannels: ['Direct sales', 'Partnerships'],
      clvEstimate: '$50,000',
      cacEstimate: '$5,000'
    }
  ]

  const mockConversation: ConversationMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'We want to offer subscription pricing for our SaaS product.',
      timestamp: new Date()
    }
  ]

  describe('analyze', () => {
    it('should generate monetization strategy', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.recommendedModel).toBeDefined()
      expect(result.data!.pricingStrategy).toBeDefined()
    })

    it('should require revenue streams', async () => {
      const result = await strategist.analyze(
        mockConversation,
        [],
        mockCustomerSegments
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Revenue streams required')
    })

    it('should recommend subscription model for high feasibility', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      expect(result.data!.recommendedModel).toContain('Subscription')
    })

    it('should generate pricing strategy', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      const strategy = result.data!.pricingStrategy
      expect(strategy.model).toBeDefined()
      expect(['value-based', 'cost-plus', 'competition-based', 'dynamic']).toContain(strategy.model)
      expect(strategy.reasoning).toBeDefined()
      expect(strategy.testingApproach.length).toBeGreaterThan(0)
    })

    it('should create pricing tiers for subscription models', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      if (result.data!.recommendedModel.toLowerCase().includes('subscription')) {
        expect(result.data!.pricingStrategy.tiers).toBeDefined()
        expect(result.data!.pricingStrategy.tiers!.length).toBeGreaterThan(0)
      }
    })

    it('should generate optimization tactics', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      expect(result.data!.optimizationTactics.length).toBeGreaterThan(0)
      expect(result.data!.optimizationTactics[0]).toContain('revenue' || 'pricing' || 'customer')
    })

    it('should analyze competitive positioning', async () => {
      const context = {
        competitors: ['Competitor A', 'Competitor B']
      }

      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments,
        context
      )

      expect(result.success).toBe(true)
      expect(result.data!.competitivePositioning).toBeDefined()
      expect(result.data!.competitivePositioning.length).toBeGreaterThan(0)
    })

    it('should identify growth levers', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      expect(result.data!.growthLevers.length).toBeGreaterThan(0)
    })

    it('should assess risks', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      expect(result.data!.risks.length).toBeGreaterThan(0)
      expect(result.data!.risks[0]).toBeTruthy()
    })

    it('should include confidence score', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      expect(result.metadata).toBeDefined()
      expect(result.metadata!.confidence).toBeGreaterThan(0)
      expect(result.metadata!.confidence).toBeLessThanOrEqual(100)
    })
  })

  describe('pricing strategy models', () => {
    it('should recommend value-based pricing for differentiated products', async () => {
      const uniqueSegments: CustomerSegment[] = [{
        ...mockCustomerSegments[0],
        valuePropositions: ['Unique feature A', 'Unique feature B', 'Unique feature C']
      }]

      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        uniqueSegments
      )

      expect(result.success).toBe(true)
      expect(['value-based', 'competition-based']).toContain(result.data!.pricingStrategy.model)
    })

    it('should recommend dynamic pricing for usage-based models', async () => {
      const usageStreams: RevenueStream[] = [{
        id: 'rev-trans',
        name: 'Transaction Fees',
        type: 'transaction-fee',
        description: 'Per-transaction pricing',
        targetMarket: 'All',
        feasibilityScore: 80,
        pros: ['Scales with usage'],
        cons: ['Variable revenue'],
        implementation: ['Usage tracking']
      }]

      const result = await strategist.analyze(
        mockConversation,
        usageStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      expect(result.data!.pricingStrategy.model).toBe('dynamic')
    })

    it('should recommend competition-based for crowded markets', async () => {
      const context = {
        competitors: ['Comp1', 'Comp2', 'Comp3', 'Comp4', 'Comp5', 'Comp6']
      }

      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments,
        context
      )

      expect(result.success).toBe(true)
      expect(['competition-based', 'value-based']).toContain(result.data!.pricingStrategy.model)
    })
  })

  describe('pricing tiers', () => {
    it('should create tiers with proper structure', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      if (result.data!.pricingStrategy.tiers) {
        const tier = result.data!.pricingStrategy.tiers[0]
        expect(tier.name).toBeDefined()
        expect(tier.price).toBeDefined()
        expect(tier.features).toBeDefined()
        expect(tier.features.length).toBeGreaterThan(0)
        expect(tier.targetSegment).toBeDefined()
        expect(tier.positioning).toBeDefined()
      }
    })

    it('should include free tier for large markets', async () => {
      const largeSegments: CustomerSegment[] = [{
        ...mockCustomerSegments[0],
        size: 'large'
      }]

      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        largeSegments
      )

      expect(result.success).toBe(true)
      if (result.data!.pricingStrategy.tiers) {
        const tierNames = result.data!.pricingStrategy.tiers.map(t => t.name.toLowerCase())
        expect(tierNames.some(name => name.includes('free'))).toBe(true)
      }
    })

    it('should include enterprise tier when appropriate', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      if (result.data!.pricingStrategy.tiers) {
        const tierNames = result.data!.pricingStrategy.tiers.map(t => t.name.toLowerCase())
        if (mockCustomerSegments.some(s => s.name.toLowerCase().includes('enterprise'))) {
          expect(tierNames.some(name => name.includes('enterprise'))).toBe(true)
        }
      }
    })
  })

  describe('optimization tactics', () => {
    it('should include revenue expansion tactics', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      const tactics = result.data!.optimizationTactics.join(' ').toLowerCase()
      expect(tactics).toContain('revenue' || 'expansion' || 'pricing')
    })

    it('should include retention tactics', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      const tactics = result.data!.optimizationTactics.join(' ').toLowerCase()
      expect(tactics).toContain('churn' || 'retention' || 'customer')
    })

    it('should suggest segment-specific tactics for multiple segments', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      expect(result.data!.optimizationTactics.length).toBeGreaterThan(5)
    })
  })

  describe('growth levers', () => {
    it('should identify acquisition levers', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      const levers = result.data!.growthLevers.join(' ').toLowerCase()
      expect(levers).toContain('acquisition' || 'customer' || 'cac')
    })

    it('should identify expansion levers', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      const levers = result.data!.growthLevers.join(' ').toLowerCase()
      expect(levers).toContain('expansion' || 'segment' || 'revenue')
    })
  })

  describe('risk assessment', () => {
    it('should identify freemium risks', async () => {
      const freemiumStreams: RevenueStream[] = [{
        ...mockRevenueStreams[0],
        type: 'freemium'
      }]

      const result = await strategist.analyze(
        mockConversation,
        freemiumStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      const risks = result.data!.risks.join(' ').toLowerCase()
      expect(risks).toContain('freemium' || 'conversion')
    })

    it('should identify pricing complexity risks', async () => {
      const complexContext = {
        multipleRevenues: true
      }

      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments,
        complexContext
      )

      expect(result.success).toBe(true)
      expect(result.data!.risks.length).toBeGreaterThan(0)
    })

    it('should identify competitive pressure risks', async () => {
      const context = {
        competitors: Array(10).fill('Competitor')
      }

      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments,
        context
      )

      expect(result.success).toBe(true)
      const risks = result.data!.risks.join(' ').toLowerCase()
      expect(risks).toContain('competitive' || 'competition' || 'pricing')
    })
  })

  describe('confidence scoring', () => {
    it('should have higher confidence with more revenue streams', async () => {
      const singleStream = [mockRevenueStreams[0]]
      const multipleStreams = mockRevenueStreams

      const result1 = await strategist.analyze(mockConversation, singleStream, mockCustomerSegments)
      const result2 = await strategist.analyze(mockConversation, multipleStreams, mockCustomerSegments)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result2.metadata!.confidence).toBeGreaterThanOrEqual(result1.metadata!.confidence)
    })

    it('should have higher confidence with high feasibility scores', async () => {
      const highFeasibility: RevenueStream[] = [{
        ...mockRevenueStreams[0],
        feasibilityScore: 90
      }]

      const result = await strategist.analyze(
        mockConversation,
        highFeasibility,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      expect(result.metadata!.confidence).toBeGreaterThan(70)
    })
  })

  describe('testing recommendations', () => {
    it('should recommend A/B testing', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      const testing = result.data!.pricingStrategy.testingApproach.join(' ').toLowerCase()
      expect(testing).toContain('a/b' || 'test')
    })

    it('should recommend customer research', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      const testing = result.data!.pricingStrategy.testingApproach.join(' ').toLowerCase()
      expect(testing).toContain('customer' || 'interview' || 'willingness')
    })

    it('should provide multiple testing approaches', async () => {
      const result = await strategist.analyze(
        mockConversation,
        mockRevenueStreams,
        mockCustomerSegments
      )

      expect(result.success).toBe(true)
      expect(result.data!.pricingStrategy.testingApproach.length).toBeGreaterThan(3)
    })
  })
})