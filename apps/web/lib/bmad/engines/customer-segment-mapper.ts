/**
 * Customer Segment Mapper Engine
 * Analyzes and maps customer segments with value propositions
 */

import {
  ConversationMessage,
  CustomerAnalysis,
  CustomerSegment,
  EngineResponse
} from '../types'

export class CustomerSegmentMapper {
  /**
   * Analyze conversation to identify and map customer segments
   */
  async analyze(
    conversationHistory: ConversationMessage[],
    revenueStreams?: any[],
    context?: Record<string, any>
  ): Promise<EngineResponse<CustomerAnalysis>> {
    try {
      // Extract customer segment mentions from conversation
      const extractedSegments = this.extractSegmentsFromConversation(
        conversationHistory,
        context
      )

      if (extractedSegments.length === 0) {
        return {
          success: false,
          error: 'No customer segments identified. Please describe your target customers in more detail.'
        }
      }

      // Enrich segments with analysis
      const enrichedSegments = this.enrichSegments(extractedSegments, revenueStreams, context)

      // Identify segmentation criteria
      const segmentationCriteria = this.identifySegmentationCriteria(enrichedSegments)

      // Map value propositions to segments
      const valuePropositionMap = this.mapValuePropositions(enrichedSegments)

      // Prioritize segments
      const prioritySegments = this.prioritizeSegments(enrichedSegments)

      // Generate insights
      const insights = this.generateInsights(enrichedSegments, revenueStreams)

      const analysis: CustomerAnalysis = {
        segments: enrichedSegments,
        segmentationCriteria,
        valuePropositionMap,
        prioritySegments,
        insights
      }

      return {
        success: true,
        data: analysis,
        metadata: {
          segmentsIdentified: enrichedSegments.length,
          confidence: this.calculateConfidence(conversationHistory, extractedSegments),
          analysisTimestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze customer segments'
      }
    }
  }

  /**
   * Extract customer segments from conversation
   */
  private extractSegmentsFromConversation(
    conversation: ConversationMessage[],
    context?: Record<string, any>
  ): CustomerSegment[] {
    const segments: CustomerSegment[] = []
    const segmentKeywords = {
      'small-business': ['small business', 'smb', 'small companies', 'local businesses'],
      'enterprise': ['enterprise', 'large companies', 'corporations', 'big companies'],
      'startup': ['startup', 'new companies', 'early stage', 'founders'],
      'freelancer': ['freelancer', 'independent', 'consultant', 'solopreneur'],
      'agency': ['agency', 'agencies', 'marketing firms', 'design studios'],
      'ecommerce': ['ecommerce', 'online store', 'retail', 'merchants'],
      'saas': ['saas', 'software companies', 'tech companies', 'b2b software'],
      'consumer': ['consumer', 'individual', 'personal use', 'end user']
    }

    // Extract from conversation
    const conversationText = conversation
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase()

    for (const [segmentType, keywords] of Object.entries(segmentKeywords)) {
      const mentioned = keywords.some(keyword => conversationText.includes(keyword))

      if (mentioned) {
        segments.push(this.createSegmentFromType(segmentType, conversationText))
      }
    }

    // Extract from context if provided
    if (context?.targetCustomers) {
      const contextSegments = this.parseContextSegments(context.targetCustomers)
      segments.push(...contextSegments)
    }

    // Deduplicate by name
    const uniqueSegments = Array.from(
      new Map(segments.map(s => [s.name, s])).values()
    )

    return uniqueSegments
  }

  /**
   * Create a segment from identified type
   */
  private createSegmentFromType(type: string, conversationText: string): CustomerSegment {
    const segmentTemplates: Record<string, Partial<CustomerSegment>> = {
      'small-business': {
        name: 'Small & Medium Businesses',
        description: 'Small to medium-sized businesses with limited resources',
        size: 'large',
        characteristics: ['Budget conscious', 'Need simple solutions', 'Value quick results'],
        painPoints: ['Limited technical expertise', 'Time constraints', 'Budget limitations'],
        acquisitionChannels: ['SEO', 'Content marketing', 'Referrals', 'Online communities']
      },
      'enterprise': {
        name: 'Enterprise Companies',
        description: 'Large organizations with complex needs',
        size: 'medium',
        characteristics: ['Need scalability', 'Security focused', 'Longer sales cycles'],
        painPoints: ['Integration challenges', 'Compliance requirements', 'Change management'],
        acquisitionChannels: ['Direct sales', 'Enterprise partnerships', 'Trade shows']
      },
      'startup': {
        name: 'Startups & Founders',
        description: 'Early-stage companies and entrepreneurs',
        size: 'medium',
        characteristics: ['Fast-moving', 'Tech-savvy', 'Growth focused'],
        painPoints: ['Limited budget', 'Rapid scaling needs', 'Uncertain future'],
        acquisitionChannels: ['Product Hunt', 'Startup communities', 'Social media', 'VC networks']
      },
      'freelancer': {
        name: 'Freelancers & Consultants',
        description: 'Independent professionals and consultants',
        size: 'medium',
        characteristics: ['Solo operators', 'Value automation', 'Price sensitive'],
        painPoints: ['Time management', 'Finding clients', 'Administrative overhead'],
        acquisitionChannels: ['LinkedIn', 'Freelance platforms', 'Networking', 'Referrals']
      },
      'agency': {
        name: 'Agencies',
        description: 'Marketing, design, and service agencies',
        size: 'medium',
        characteristics: ['Client-focused', 'Need collaboration tools', 'Value white-labeling'],
        painPoints: ['Client management', 'Project coordination', 'Team collaboration'],
        acquisitionChannels: ['Agency partnerships', 'Industry events', 'Case studies']
      },
      'ecommerce': {
        name: 'E-commerce Businesses',
        description: 'Online retailers and merchants',
        size: 'large',
        characteristics: ['Transaction-focused', 'Need integrations', 'Data-driven'],
        painPoints: ['Cart abandonment', 'Customer retention', 'Inventory management'],
        acquisitionChannels: ['App stores', 'E-commerce platforms', 'Digital ads']
      },
      'saas': {
        name: 'SaaS Companies',
        description: 'Software as a service businesses',
        size: 'medium',
        characteristics: ['Subscription-based', 'Tech-savvy', 'Growth-oriented'],
        painPoints: ['Customer acquisition cost', 'Churn', 'Product differentiation'],
        acquisitionChannels: ['Content marketing', 'SaaS directories', 'Partnerships']
      },
      'consumer': {
        name: 'Individual Consumers',
        description: 'End users and individual customers',
        size: 'large',
        characteristics: ['Price sensitive', 'Ease of use priority', 'Mobile-first'],
        painPoints: ['Complexity', 'Cost', 'Learning curve'],
        acquisitionChannels: ['Social media', 'App stores', 'Word of mouth', 'Digital ads']
      }
    }

    const template = segmentTemplates[type] || {
      name: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `${type} customer segment`,
      size: 'medium' as const,
      characteristics: [],
      painPoints: [],
      acquisitionChannels: []
    }

    return {
      id: `segment-${type}-${Date.now()}`,
      name: template.name!,
      description: template.description!,
      size: template.size!,
      characteristics: template.characteristics!,
      painPoints: template.painPoints!,
      valuePropositions: [],
      acquisitionChannels: template.acquisitionChannels!
    }
  }

  /**
   * Parse segments from context
   */
  private parseContextSegments(targetCustomers: string): CustomerSegment[] {
    // Simple parsing - can be enhanced with NLP
    const segments: CustomerSegment[] = []
    const lines = targetCustomers.split('\n').filter(l => l.trim())

    lines.forEach((line, idx) => {
      if (line.trim()) {
        segments.push({
          id: `context-segment-${idx}`,
          name: line.trim(),
          description: line.trim(),
          size: 'medium',
          characteristics: [],
          painPoints: [],
          valuePropositions: [],
          acquisitionChannels: []
        })
      }
    })

    return segments
  }

  /**
   * Enrich segments with detailed analysis
   */
  private enrichSegments(
    segments: CustomerSegment[],
    revenueStreams?: any[],
    context?: Record<string, any>
  ): CustomerSegment[] {
    return segments.map(segment => {
      // Add value propositions based on pain points
      const valueProps = this.generateValuePropositions(segment.painPoints, context)

      // Estimate CLV and CAC if possible
      const clvEstimate = this.estimateCLV(segment, revenueStreams)
      const cacEstimate = this.estimateCAC(segment)

      return {
        ...segment,
        valuePropositions: valueProps,
        clvEstimate,
        cacEstimate
      }
    })
  }

  /**
   * Generate value propositions for segment
   */
  private generateValuePropositions(painPoints: string[], context?: Record<string, any>): string[] {
    const valueProps: string[] = []

    // Map pain points to value propositions
    const painPointMap: Record<string, string> = {
      'limited technical expertise': 'Easy to use, no technical skills required',
      'time constraints': 'Save time with automated workflows',
      'budget limitations': 'Affordable pricing that fits your budget',
      'integration challenges': 'Seamless integration with existing tools',
      'compliance requirements': 'Built-in compliance and security features',
      'limited budget': 'Cost-effective solution for lean teams',
      'time management': 'Streamline your workflow and stay organized',
      'client management': 'Centralized client communication and project tracking',
      'cart abandonment': 'Recover lost sales with smart retargeting',
      'customer acquisition cost': 'Lower CAC with efficient marketing tools',
      'churn': 'Improve retention with better customer insights'
    }

    painPoints.forEach(painPoint => {
      const key = painPoint.toLowerCase()
      for (const [pain, value] of Object.entries(painPointMap)) {
        if (key.includes(pain)) {
          valueProps.push(value)
        }
      }
    })

    // Add context-specific value props
    if (context?.uniqueValue) {
      valueProps.push(context.uniqueValue)
    }

    return [...new Set(valueProps)] // Deduplicate
  }

  /**
   * Estimate Customer Lifetime Value
   */
  private estimateCLV(segment: CustomerSegment, revenueStreams?: any[]): string {
    // Simple heuristic based on segment size and revenue model
    const sizeMultiplier = {
      'small': 1,
      'medium': 2,
      'large': 3
    }

    const baseValue = 1000 * sizeMultiplier[segment.size]

    // Adjust based on revenue streams
    if (revenueStreams?.some(s => s.type === 'subscription')) {
      return `$${(baseValue * 3).toLocaleString()} - $${(baseValue * 5).toLocaleString()}`
    }

    return `$${baseValue.toLocaleString()} - $${(baseValue * 2).toLocaleString()}`
  }

  /**
   * Estimate Customer Acquisition Cost
   */
  private estimateCAC(segment: CustomerSegment): string {
    // Heuristic based on acquisition channels
    const channelCosts: Record<string, number> = {
      'direct sales': 500,
      'enterprise partnerships': 400,
      'content marketing': 100,
      'seo': 80,
      'referrals': 50,
      'social media': 75,
      'digital ads': 150,
      'app stores': 30
    }

    const avgCost = segment.acquisitionChannels.reduce((sum, channel) => {
      const cost = channelCosts[channel.toLowerCase()] || 100
      return sum + cost
    }, 0) / (segment.acquisitionChannels.length || 1)

    return `$${Math.round(avgCost)} - $${Math.round(avgCost * 2)}`
  }

  /**
   * Identify segmentation criteria used
   */
  private identifySegmentationCriteria(segments: CustomerSegment[]): string[] {
    const criteria = new Set<string>()

    segments.forEach(segment => {
      // Analyze what differentiates this segment
      if (segment.name.toLowerCase().includes('small') ||
          segment.name.toLowerCase().includes('enterprise')) {
        criteria.add('Company Size')
      }
      if (segment.name.toLowerCase().includes('b2b') ||
          segment.name.toLowerCase().includes('b2c') ||
          segment.name.toLowerCase().includes('consumer')) {
        criteria.add('Business Model')
      }
      if (segment.characteristics.some(c => c.toLowerCase().includes('tech'))) {
        criteria.add('Technical Sophistication')
      }
      if (segment.characteristics.some(c => c.toLowerCase().includes('budget') ||
                                             c.toLowerCase().includes('price'))) {
        criteria.add('Budget Sensitivity')
      }
    })

    return Array.from(criteria)
  }

  /**
   * Map value propositions to segments
   */
  private mapValuePropositions(segments: CustomerSegment[]): Record<string, string[]> {
    const map: Record<string, string[]> = {}

    segments.forEach(segment => {
      map[segment.id] = segment.valuePropositions
    })

    return map
  }

  /**
   * Prioritize segments based on attractiveness
   */
  private prioritizeSegments(segments: CustomerSegment[]): string[] {
    // Score segments based on multiple factors
    const scored = segments.map(segment => {
      let score = 0

      // Size factor (larger = higher score)
      const sizeScore = { 'small': 1, 'medium': 2, 'large': 3 }
      score += sizeScore[segment.size] * 10

      // Value proposition fit (more = better)
      score += segment.valuePropositions.length * 5

      // Acquisition channel ease (more channels = better)
      score += segment.acquisitionChannels.length * 3

      // Pain points (more = better opportunity)
      score += segment.painPoints.length * 2

      return { segment, score }
    })

    // Sort by score descending
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Top 3
      .map(s => s.segment.id)
  }

  /**
   * Generate insights about segments
   */
  private generateInsights(segments: CustomerSegment[], revenueStreams?: any[]): string[] {
    const insights: string[] = []

    // Total addressable market insight
    const totalSegments = segments.length
    insights.push(`Identified ${totalSegments} distinct customer segments`)

    // Segment size distribution
    const sizeDistribution = segments.reduce((acc, s) => {
      acc[s.size] = (acc[s.size] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    if (sizeDistribution.large > 0) {
      insights.push(`${sizeDistribution.large} large-volume segment(s) identified - significant market opportunity`)
    }

    // Acquisition channel overlap
    const allChannels = segments.flatMap(s => s.acquisitionChannels)
    const channelCounts = allChannels.reduce((acc, ch) => {
      acc[ch] = (acc[ch] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sharedChannels = Object.entries(channelCounts)
      .filter(([_, count]) => count > 1)
      .map(([channel, _]) => channel)

    if (sharedChannels.length > 0) {
      insights.push(`Shared acquisition channels (${sharedChannels.join(', ')}) can reduce CAC`)
    }

    // Pain point patterns
    const allPainPoints = segments.flatMap(s => s.painPoints)
    const uniquePainPoints = new Set(allPainPoints)

    if (allPainPoints.length > uniquePainPoints.size) {
      insights.push(`Common pain points across segments suggest strong product-market fit potential`)
    }

    // Revenue stream alignment
    if (revenueStreams && revenueStreams.length > 0) {
      insights.push(`Revenue model should align with segment willingness to pay and buying behavior`)
    }

    return insights
  }

  /**
   * Calculate confidence score for analysis
   */
  private calculateConfidence(
    conversation: ConversationMessage[],
    segments: CustomerSegment[]
  ): number {
    let confidence = 50 // Base confidence

    // More segments = higher confidence
    confidence += Math.min(segments.length * 5, 20)

    // Longer conversation = more data = higher confidence
    confidence += Math.min(conversation.length * 2, 20)

    // Complete segments (with all fields) = higher confidence
    const completeSegments = segments.filter(
      s => s.painPoints.length > 0 && s.characteristics.length > 0
    )
    confidence += (completeSegments.length / segments.length) * 10

    return Math.min(confidence, 95) // Cap at 95%
  }
}