/**
 * Revenue Stream Analyzer Engine
 * Extracts and analyzes revenue streams from conversation context
 */

import { ConversationMessage, RevenueAnalysis, RevenueStream, RevenueType, EngineResponse } from '../types'

export class RevenueStreamAnalyzer {
  /**
   * Analyze conversation to extract revenue streams
   */
  async analyze(
    conversationHistory: ConversationMessage[],
    context?: Record<string, any>
  ): Promise<EngineResponse<RevenueAnalysis>> {
    try {
      // Extract revenue mentions from conversation
      const extractedStreams = this.extractStreamsFromConversation(conversationHistory)

      if (extractedStreams.length === 0) {
        return {
          success: false,
          error: 'No revenue streams identified in conversation. Please provide more details about your revenue model.'
        }
      }

      // Score each stream for feasibility
      const scoredStreams = this.scoreStreams(extractedStreams, context)

      // Generate recommendations
      const recommendations = this.generateRecommendations(scoredStreams, context)

      // Create prioritized next steps
      const nextSteps = this.prioritizeNextSteps(scoredStreams)

      // Calculate confidence score
      const confidence = this.calculateConfidence(conversationHistory, extractedStreams)

      const analysis: RevenueAnalysis = {
        identifiedStreams: scoredStreams,
        feasibilityScores: scoredStreams.reduce((acc, stream) => {
          acc[stream.id] = stream.feasibilityScore
          return acc
        }, {} as Record<string, number>),
        recommendations,
        nextSteps,
        confidence
      }

      return {
        success: true,
        data: analysis,
        confidence,
        metadata: {
          streamsAnalyzed: scoredStreams.length,
          conversationLength: conversationHistory.length,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Extract revenue stream mentions from conversation
   */
  private extractStreamsFromConversation(
    conversationHistory: ConversationMessage[]
  ): Partial<RevenueStream>[] {
    const streams: Partial<RevenueStream>[] = []

    // Revenue-related keywords and patterns
    const revenueKeywords = [
      'subscription', 'monthly fee', 'annual plan', 'recurring',
      'one-time', 'purchase', 'buy', 'sell',
      'freemium', 'free tier', 'premium',
      'commission', 'transaction fee', 'marketplace',
      'advertising', 'ads', 'sponsored',
      'licensing', 'license fee',
      'consulting', 'service fee', 'hourly rate',
      'saas', 'software', 'platform'
    ]

    conversationHistory.forEach((message, index) => {
      if (message.role === 'user') {
        const content = message.content.toLowerCase()

        // Check for revenue keyword mentions
        revenueKeywords.forEach(keyword => {
          if (content.includes(keyword)) {
            // Extract context around keyword
            const sentences = message.content.split(/[.!?]+/)
            const relevantSentence = sentences.find(s =>
              s.toLowerCase().includes(keyword)
            )

            if (relevantSentence) {
              // Determine revenue type
              const type = this.inferRevenueType(content, keyword)

              streams.push({
                id: `stream-${streams.length + 1}`,
                name: this.generateStreamName(type, relevantSentence),
                type,
                description: relevantSentence.trim(),
                targetMarket: 'To be refined in customer segmentation phase',
                pros: [],
                cons: [],
                implementation: []
              })
            }
          }
        })
      }
    })

    // Deduplicate similar streams
    return this.deduplicateStreams(streams)
  }

  /**
   * Infer revenue type from context
   */
  private inferRevenueType(content: string, keyword: string): RevenueType {
    if (/subscription|recurring|monthly|annual|saas/.test(content)) {
      return 'subscription'
    }
    if (/freemium|free tier|premium/.test(content)) {
      return 'freemium'
    }
    if (/commission|transaction fee|marketplace/.test(content)) {
      return 'transaction-fee'
    }
    if (/advertising|ads|sponsored/.test(content)) {
      return 'advertising'
    }
    if (/licensing|license/.test(content)) {
      return 'licensing'
    }
    if (/consulting|service|hourly/.test(content)) {
      return 'consulting'
    }
    if (/marketplace|platform/.test(content)) {
      return 'marketplace'
    }

    return 'one-time'
  }

  /**
   * Generate stream name from type and context
   */
  private generateStreamName(type: RevenueType, context: string): string {
    const typeNames: Record<RevenueType, string> = {
      'subscription': 'Subscription Revenue',
      'one-time': 'One-Time Purchase',
      'freemium': 'Freemium Model',
      'transaction-fee': 'Transaction Fees',
      'advertising': 'Advertising Revenue',
      'licensing': 'Licensing Fees',
      'consulting': 'Consulting Services',
      'marketplace': 'Marketplace Commission',
      'hybrid': 'Hybrid Model'
    }

    return typeNames[type]
  }

  /**
   * Deduplicate similar revenue streams
   */
  private deduplicateStreams(streams: Partial<RevenueStream>[]): Partial<RevenueStream>[] {
    const unique = new Map<RevenueType, Partial<RevenueStream>>()

    streams.forEach(stream => {
      if (stream.type && !unique.has(stream.type)) {
        unique.set(stream.type, stream)
      }
    })

    return Array.from(unique.values())
  }

  /**
   * Score streams for feasibility
   */
  private scoreStreams(
    streams: Partial<RevenueStream>[],
    context?: Record<string, any>
  ): RevenueStream[] {
    return streams.map(stream => {
      const feasibilityScore = this.calculateFeasibilityScore(stream, context)

      // Generate pros/cons based on stream type
      const { pros, cons } = this.generateProsAndCons(stream.type!)

      // Generate implementation steps
      const implementation = this.generateImplementationSteps(stream.type!)

      return {
        id: stream.id!,
        name: stream.name!,
        type: stream.type!,
        description: stream.description!,
        targetMarket: stream.targetMarket!,
        feasibilityScore,
        pros,
        cons,
        implementation
      }
    })
  }

  /**
   * Calculate feasibility score (0-100)
   */
  private calculateFeasibilityScore(
    stream: Partial<RevenueStream>,
    context?: Record<string, any>
  ): number {
    let score = 50 // Base score

    // Type-based scoring
    const typeScores: Record<RevenueType, number> = {
      'subscription': 80, // Generally high feasibility
      'freemium': 75,
      'one-time': 70,
      'transaction-fee': 65,
      'marketplace': 60,
      'consulting': 85,
      'licensing': 70,
      'advertising': 55,
      'hybrid': 65
    }

    if (stream.type) {
      score = typeScores[stream.type]
    }

    // Adjust based on context
    if (context?.hasExistingCustomers) {
      score += 10
    }
    if (context?.hasProductMarketFit) {
      score += 15
    }
    if (context?.competitiveMarket) {
      score -= 10
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Generate pros and cons for revenue type
   */
  private generateProsAndCons(type: RevenueType): { pros: string[]; cons: string[] } {
    const prosConsByType: Record<RevenueType, { pros: string[]; cons: string[] }> = {
      'subscription': {
        pros: ['Predictable recurring revenue', 'Customer retention focus', 'Higher lifetime value'],
        cons: ['Requires ongoing value delivery', 'Churn management needed', 'Longer sales cycle']
      },
      'one-time': {
        pros: ['Immediate revenue', 'Simple to implement', 'Clear value proposition'],
        cons: ['No recurring revenue', 'Constant customer acquisition', 'Revenue unpredictability']
      },
      'freemium': {
        pros: ['Low barrier to entry', 'Viral growth potential', 'Large user base'],
        cons: ['Low conversion rates', 'High support costs', 'Complex tier design']
      },
      'transaction-fee': {
        pros: ['Scales with usage', 'Aligned with customer success', 'No upfront cost barrier'],
        cons: ['Revenue variability', 'Requires transaction volume', 'Complex pricing']
      },
      'advertising': {
        pros: ['Free for users', 'Scalable revenue', 'Multiple monetization options'],
        cons: ['Requires large audience', 'User experience tradeoffs', 'Ad platform dependencies']
      },
      'licensing': {
        pros: ['Passive income potential', 'Scalable model', 'IP protection'],
        cons: ['Complex contracts', 'Enforcement challenges', 'Limited to specific markets']
      },
      'consulting': {
        pros: ['High margin potential', 'Direct customer relationships', 'Quick to launch'],
        cons: ['Time-based revenue cap', 'Not scalable', 'Resource intensive']
      },
      'marketplace': {
        pros: ['Network effects', 'Transaction-based scaling', 'Two-sided revenue'],
        cons: ['Chicken-and-egg problem', 'Platform competition', 'Trust and safety costs']
      },
      'hybrid': {
        pros: ['Revenue diversification', 'Flexible customer options', 'Risk mitigation'],
        cons: ['Complex pricing', 'Operational complexity', 'Brand confusion risk']
      }
    }

    return prosConsByType[type] || { pros: [], cons: [] }
  }

  /**
   * Generate implementation steps for revenue type
   */
  private generateImplementationSteps(type: RevenueType): string[] {
    const stepsByType: Record<RevenueType, string[]> = {
      'subscription': [
        'Define subscription tiers and pricing',
        'Set up billing system (Stripe, Paddle, etc.)',
        'Create onboarding flow',
        'Implement trial period strategy',
        'Build cancellation and retention flows'
      ],
      'one-time': [
        'Set product pricing',
        'Integrate payment processor',
        'Create purchase flow',
        'Set up order fulfillment',
        'Build customer support system'
      ],
      'freemium': [
        'Define free vs paid features',
        'Set conversion goals',
        'Build upgrade prompts',
        'Create feature gating',
        'Develop premium tier value props'
      ],
      'transaction-fee': [
        'Define fee structure',
        'Build transaction tracking',
        'Set up payment processing',
        'Create pricing calculator',
        'Implement fee transparency'
      ],
      'advertising': [
        'Build audience to 10k+ users',
        'Choose ad platform (Google, native)',
        'Design ad placements',
        'Set CPM/CPC targets',
        'Monitor user experience impact'
      ],
      'licensing': [
        'Document IP and capabilities',
        'Create licensing tiers',
        'Draft license agreements',
        'Set up license management',
        'Establish enforcement policy'
      ],
      'consulting': [
        'Define service offerings',
        'Set hourly/project rates',
        'Create service contracts',
        'Build client onboarding',
        'Establish delivery processes'
      ],
      'marketplace': [
        'Build supply-side acquisition',
        'Develop demand-side marketing',
        'Create transaction flow',
        'Implement trust mechanisms',
        'Set commission structure'
      ],
      'hybrid': [
        'Map revenue model combinations',
        'Prioritize primary revenue source',
        'Design integrated pricing',
        'Build unified billing',
        'Create clear customer communication'
      ]
    }

    return stepsByType[type] || []
  }

  /**
   * Generate strategic recommendations
   */
  private generateRecommendations(
    streams: RevenueStream[],
    context?: Record<string, any>
  ): string[] {
    const recommendations: string[] = []

    // Prioritize highest feasibility streams
    const topStream = streams.sort((a, b) => b.feasibilityScore - a.feasibilityScore)[0]

    if (topStream) {
      recommendations.push(
        `Focus on ${topStream.name} (${topStream.feasibilityScore}% feasibility) as your primary revenue model`
      )
    }

    // Diversification recommendation
    if (streams.length >= 3) {
      recommendations.push(
        'Consider implementing 2-3 revenue streams for diversification and risk mitigation'
      )
    }

    // Context-based recommendations
    if (context?.earlyStage) {
      recommendations.push(
        'Start with simple pricing model to validate willingness to pay before adding complexity'
      )
    }

    if (streams.some(s => s.type === 'subscription')) {
      recommendations.push(
        'For subscription model: Offer annual plans with 20-30% discount to improve cash flow'
      )
    }

    if (streams.some(s => s.type === 'freemium')) {
      recommendations.push(
        'For freemium: Target 2-5% free-to-paid conversion rate as initial benchmark'
      )
    }

    // General best practices
    recommendations.push(
      'Validate pricing with 10-20 target customers before full launch',
      'Plan to iterate pricing strategy quarterly based on conversion data'
    )

    return recommendations
  }

  /**
   * Prioritize next steps
   */
  private prioritizeNextSteps(streams: RevenueStream[]): string[] {
    const nextSteps: string[] = []

    // Always start with validation
    nextSteps.push('Conduct 5-10 customer interviews to validate pricing assumptions')

    // Top stream-specific actions
    const topStream = streams.sort((a, b) => b.feasibilityScore - a.feasibilityScore)[0]

    if (topStream) {
      nextSteps.push(`Set up ${topStream.type} infrastructure: ${topStream.implementation[0]}`)
      nextSteps.push(`Create pricing calculator for ${topStream.name}`)
    }

    // Competitive analysis
    nextSteps.push('Analyze 3-5 competitors\' pricing models and positioning')

    // Testing
    nextSteps.push('Run small-scale pricing test with early adopters')

    return nextSteps
  }

  /**
   * Calculate analysis confidence score
   */
  private calculateConfidence(
    conversationHistory: ConversationMessage[],
    streams: Partial<RevenueStream>[]
  ): number {
    let confidence = 50

    // More conversation = higher confidence
    confidence += Math.min(30, conversationHistory.length * 3)

    // More streams identified = higher confidence
    confidence += Math.min(20, streams.length * 5)

    return Math.min(100, confidence)
  }
}