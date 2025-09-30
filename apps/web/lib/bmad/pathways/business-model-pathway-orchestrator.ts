/**
 * Business Model Pathway Orchestrator
 * Coordinates all business model analysis engines and manages pathway flow
 */

import { RevenueStreamAnalyzer } from '../engines/revenue-stream-analyzer'
import { CustomerSegmentMapper } from '../engines/customer-segment-mapper'
import { MonetizationStrategist } from '../engines/monetization-strategist'
import { RoadmapGenerator } from '../engines/roadmap-generator'
import {
  BmadSession,
  ConversationMessage,
  AnalysisResults,
  EngineResponse,
  BusinessModelCanvas
} from '../types'

export class BusinessModelPathwayOrchestrator {
  private revenueAnalyzer: RevenueStreamAnalyzer
  private segmentMapper: CustomerSegmentMapper
  private strategist: MonetizationStrategist
  private roadmapGen: RoadmapGenerator

  constructor() {
    this.revenueAnalyzer = new RevenueStreamAnalyzer()
    this.segmentMapper = new CustomerSegmentMapper()
    this.strategist = new MonetizationStrategist()
    this.roadmapGen = new RoadmapGenerator()
  }

  /**
   * Run complete business model analysis pathway
   */
  async runPathway(
    session: BmadSession,
    conversationHistory: ConversationMessage[],
    context?: Record<string, any>
  ): Promise<EngineResponse<AnalysisResults>> {
    try {
      const results: AnalysisResults = {}

      // Phase 1: Revenue Stream Analysis
      const revenueResult = await this.revenueAnalyzer.analyze(
        conversationHistory,
        context
      )

      if (!revenueResult.success) {
        return {
          success: false,
          error: `Revenue analysis failed: ${revenueResult.error}`
        }
      }

      results.revenueAnalysis = revenueResult.data

      // Phase 2: Customer Segmentation
      const customerResult = await this.segmentMapper.analyze(
        conversationHistory,
        revenueResult.data?.identifiedStreams,
        context
      )

      if (!customerResult.success) {
        // Continue with partial results
        console.warn('Customer analysis failed:', customerResult.error)
      } else {
        results.customerAnalysis = customerResult.data
      }

      // Phase 3: Monetization Strategy
      if (results.revenueAnalysis && results.customerAnalysis) {
        const strategyResult = await this.strategist.analyze(
          conversationHistory,
          results.revenueAnalysis.identifiedStreams,
          results.customerAnalysis.segments,
          context
        )

        if (strategyResult.success) {
          results.monetizationStrategy = strategyResult.data
        }
      }

      // Phase 4: Implementation Roadmap
      if (results.revenueAnalysis && results.customerAnalysis && results.monetizationStrategy) {
        const roadmapResult = await this.roadmapGen.generate(
          results.revenueAnalysis,
          results.customerAnalysis,
          results.monetizationStrategy,
          context
        )

        if (roadmapResult.success) {
          results.implementationRoadmap = roadmapResult.data
        }
      }

      // Phase 5: Business Model Canvas (optional)
      if (results.revenueAnalysis && results.customerAnalysis) {
        results.businessModelCanvas = this.generateBusinessModelCanvas(
          results,
          context
        )
      }

      return {
        success: true,
        data: results,
        metadata: {
          phasesCompleted: this.countCompletedPhases(results),
          totalPhases: 5,
          analysisTimestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pathway orchestration failed'
      }
    }
  }

  /**
   * Run individual phase of analysis
   */
  async runPhase(
    phaseId: string,
    session: BmadSession,
    conversationHistory: ConversationMessage[],
    previousResults?: AnalysisResults,
    context?: Record<string, any>
  ): Promise<EngineResponse<any>> {
    switch (phaseId) {
      case 'revenue-analysis':
        return await this.revenueAnalyzer.analyze(conversationHistory, context)

      case 'customer-segmentation':
        return await this.segmentMapper.analyze(
          conversationHistory,
          previousResults?.revenueAnalysis?.identifiedStreams,
          context
        )

      case 'monetization-strategy':
        if (!previousResults?.revenueAnalysis || !previousResults?.customerAnalysis) {
          return {
            success: false,
            error: 'Revenue analysis and customer segmentation required for monetization strategy'
          }
        }
        return await this.strategist.analyze(
          conversationHistory,
          previousResults.revenueAnalysis.identifiedStreams,
          previousResults.customerAnalysis.segments,
          context
        )

      case 'implementation-roadmap':
        if (!previousResults?.revenueAnalysis ||
            !previousResults?.customerAnalysis ||
            !previousResults?.monetizationStrategy) {
          return {
            success: false,
            error: 'All previous analyses required for roadmap generation'
          }
        }
        return await this.roadmapGen.generate(
          previousResults.revenueAnalysis,
          previousResults.customerAnalysis,
          previousResults.monetizationStrategy,
          context
        )

      default:
        return {
          success: false,
          error: `Unknown phase: ${phaseId}`
        }
    }
  }

  /**
   * Generate Business Model Canvas from analysis results
   */
  private generateBusinessModelCanvas(
    results: AnalysisResults,
    context?: Record<string, any>
  ): BusinessModelCanvas {
    const canvas: BusinessModelCanvas = {
      keyPartners: [],
      keyActivities: [],
      keyResources: [],
      valuePropositions: [],
      customerRelationships: [],
      channels: [],
      customerSegments: [],
      costStructure: [],
      revenueStreams: []
    }

    // Value Propositions
    if (results.customerAnalysis) {
      const allValueProps = results.customerAnalysis.segments.flatMap(
        s => s.valuePropositions
      )
      canvas.valuePropositions = [...new Set(allValueProps)]
    }

    // Customer Segments
    if (results.customerAnalysis) {
      canvas.customerSegments = results.customerAnalysis.segments.map(
        s => `${s.name}: ${s.description}`
      )
    }

    // Revenue Streams
    if (results.revenueAnalysis) {
      canvas.revenueStreams = results.revenueAnalysis.identifiedStreams.map(
        s => `${s.name} (${s.type}): ${s.description}`
      )
    }

    // Channels (from customer segments)
    if (results.customerAnalysis) {
      const allChannels = results.customerAnalysis.segments.flatMap(
        s => s.acquisitionChannels
      )
      canvas.channels = [...new Set(allChannels)]
    }

    // Customer Relationships
    if (results.monetizationStrategy) {
      canvas.customerRelationships = [
        'Self-service platform',
        'Customer success management',
        'Community support',
        'Automated services'
      ]
    }

    // Key Activities
    canvas.keyActivities = [
      'Product development',
      'Customer acquisition',
      'Customer support',
      'Platform maintenance'
    ]

    // Key Resources
    canvas.keyResources = [
      'Technology platform',
      'Customer data',
      'Team expertise',
      'Brand reputation'
    ]

    // Key Partners
    canvas.keyPartners = [
      'Technology providers',
      'Payment processors',
      'Distribution partners',
      'Strategic alliances'
    ]

    // Cost Structure
    if (results.monetizationStrategy) {
      canvas.costStructure = [
        'Product development costs',
        'Customer acquisition costs (CAC)',
        'Infrastructure and hosting',
        'Team salaries',
        'Marketing and sales',
        'Customer support'
      ]
    }

    return canvas
  }

  /**
   * Count completed analysis phases
   */
  private countCompletedPhases(results: AnalysisResults): number {
    let count = 0
    if (results.revenueAnalysis) count++
    if (results.customerAnalysis) count++
    if (results.monetizationStrategy) count++
    if (results.implementationRoadmap) count++
    if (results.businessModelCanvas) count++
    return count
  }

  /**
   * Validate session can proceed to phase
   */
  validatePhasePrerequisites(
    phaseId: string,
    previousResults?: AnalysisResults
  ): { valid: boolean; message?: string } {
    switch (phaseId) {
      case 'revenue-analysis':
        return { valid: true }

      case 'customer-segmentation':
        return { valid: true }

      case 'monetization-strategy':
        if (!previousResults?.revenueAnalysis) {
          return {
            valid: false,
            message: 'Revenue analysis must be completed first'
          }
        }
        if (!previousResults?.customerAnalysis) {
          return {
            valid: false,
            message: 'Customer segmentation must be completed first'
          }
        }
        return { valid: true }

      case 'implementation-roadmap':
        if (!previousResults?.revenueAnalysis ||
            !previousResults?.customerAnalysis ||
            !previousResults?.monetizationStrategy) {
          return {
            valid: false,
            message: 'All previous analyses must be completed first'
          }
        }
        return { valid: true }

      default:
        return {
          valid: false,
          message: `Unknown phase: ${phaseId}`
        }
    }
  }

  /**
   * Get next recommended phase
   */
  getNextPhase(currentPhaseId: string): string | null {
    const phaseSequence = [
      'revenue-analysis',
      'customer-segmentation',
      'monetization-strategy',
      'implementation-roadmap'
    ]

    const currentIndex = phaseSequence.indexOf(currentPhaseId)
    if (currentIndex === -1 || currentIndex === phaseSequence.length - 1) {
      return null // No next phase
    }

    return phaseSequence[currentIndex + 1]
  }

  /**
   * Get pathway progress percentage
   */
  getProgressPercentage(results: AnalysisResults): number {
    const totalPhases = 5
    const completedPhases = this.countCompletedPhases(results)
    return Math.round((completedPhases / totalPhases) * 100)
  }
}