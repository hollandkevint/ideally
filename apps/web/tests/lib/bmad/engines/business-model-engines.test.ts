/**
 * Integration tests for RoadmapGenerator and BusinessModelPathwayOrchestrator
 */

import { describe, it, expect } from 'vitest'
import { RoadmapGenerator } from '@/lib/bmad/engines/roadmap-generator'
import { BusinessModelPathwayOrchestrator } from '@/lib/bmad/pathways/business-model-pathway-orchestrator'

describe('RoadmapGenerator', () => {
  it('should generate implementation roadmap', async () => {
    const generator = new RoadmapGenerator()
    
    const mockData = {
      revenueAnalysis: {
        identifiedStreams: [{ id: 'r1', name: 'Subscription', type: 'subscription', description: 'Monthly', targetMarket: 'SaaS', feasibilityScore: 85, pros: [], cons: [], implementation: [] }],
        feasibilityScores: {},
        recommendations: [],
        nextSteps: [],
        confidence: 80
      },
      customerAnalysis: {
        segments: [{ id: 's1', name: 'SMB', description: 'Small biz', size: 'large' as const, characteristics: [], painPoints: [], valuePropositions: [], acquisitionChannels: [] }],
        segmentationCriteria: [],
        valuePropositionMap: {},
        prioritySegments: [],
        insights: []
      },
      monetizationStrategy: {
        recommendedModel: 'Subscription',
        pricingStrategy: { model: 'value-based' as const, reasoning: 'test', testingApproach: [] },
        optimizationTactics: [],
        competitivePositioning: 'test',
        growthLevers: [],
        risks: []
      }
    }

    const result = await generator.generate(
      mockData.revenueAnalysis,
      mockData.customerAnalysis,
      mockData.monetizationStrategy
    )

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.phases.length).toBeGreaterThan(0)
    expect(result.data!.quickWins.length).toBeGreaterThan(0)
    expect(result.data!.successMetrics.length).toBeGreaterThan(0)
  })
})

describe('BusinessModelPathwayOrchestrator', () => {
  it('should validate phase prerequisites', () => {
    const orchestrator = new BusinessModelPathwayOrchestrator()
    
    const validation = orchestrator.validatePhasePrerequisites('revenue-analysis')
    expect(validation.valid).toBe(true)
  })

  it('should get next phase in sequence', () => {
    const orchestrator = new BusinessModelPathwayOrchestrator()
    
    const nextPhase = orchestrator.getNextPhase('revenue-analysis')
    expect(nextPhase).toBe('customer-segmentation')
  })

  it('should calculate progress percentage', () => {
    const orchestrator = new BusinessModelPathwayOrchestrator()
    
    const results = {
      revenueAnalysis: {} as any,
      customerAnalysis: {} as any
    }

    const progress = orchestrator.getProgressPercentage(results)
    expect(progress).toBeGreaterThan(0)
    expect(progress).toBeLessThanOrEqual(100)
  })
})
