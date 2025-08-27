/**
 * BMad Analytics Service
 * 
 * Comprehensive analytics service for tracking user behavior, session performance,
 * and generating business intelligence insights for the BMad Method.
 * 
 * Key capabilities:
 * - Real-time event tracking
 * - User behavior analysis
 * - Pathway performance metrics
 * - Session quality assessment
 * - A/B testing support
 * - Optimization insights
 */

import { createClient } from '@/lib/supabase/client'
import { PathwayType } from './types'

// Analytics Event Types
export type AnalyticsEventType = 
  | 'session_start' | 'session_pause' | 'session_resume' | 'session_exit'
  | 'phase_enter' | 'phase_exit' | 'phase_timeout'
  | 'elicitation_start' | 'elicitation_complete' | 'elicitation_abandon'
  | 'persona_switch' | 'knowledge_reference' | 'user_confusion'
  | 'breakthrough_moment' | 'session_complete' | 'ai_response'
  | 'user_response' | 'quality_milestone' | 'optimization_trigger'

// Core Analytics Interfaces
export interface AnalyticsEvent {
  sessionId: string
  userId: string
  eventType: AnalyticsEventType
  eventData: Record<string, any>
  eventMetadata?: Record<string, any>
  performanceData?: {
    processingTimeMs?: number
    aiResponseTimeMs?: number
    clientRenderTimeMs?: number
  }
  contextData?: {
    currentPhase?: string
    currentTemplate?: string
    pathway: PathwayType
    sessionProgressPercent?: number
    userEngagementScore?: number
    aiConfidenceScore?: number
  }
}

export interface UserBehaviorAnalysis {
  sessionId: string
  userId: string
  pathway: PathwayType
  engagementScore: number
  focusScore?: number
  collaborationScore?: number
  interactionPatterns: {
    responseVelocity: Record<string, number>
    interactionDepthScore?: number
    revisionFrequency?: number
    questionAskingFrequency?: number
  }
  preferences: {
    preferredElicitationStyle?: 'structured' | 'conversational' | 'visual' | 'mixed'
    optimalSessionLength?: number
    mostEffectivePersona?: 'analyst' | 'advisor' | 'coach'
    preferredInteractionPace?: 'fast' | 'moderate' | 'deliberate'
  }
  insights: string[]
  recommendations: string[]
  analysisConfidence: number
}

export interface PathwayPerformanceMetrics {
  pathway: PathwayType
  timeframe: 'day' | 'week' | 'month'
  period: string // ISO date string
  
  // Core metrics
  sessionsStarted: number
  sessionsCompleted: number
  sessionsAbandoned: number
  completionRate: number
  
  // Time metrics
  avgSessionDurationMinutes: number
  avgTimeToFirstBreakthrough?: number
  avgPhaseCompletionTime: Record<string, number>
  phaseTimeoutRate: number
  
  // Experience metrics
  avgPersonaSwitches: number
  avgKnowledgeReferences: number
  confusionEventsPerSession: number
  breakthroughMomentsPerSession: number
  
  // Quality metrics
  actionableOutputsPerSession: number
  avgOutputQualityScore?: number
  avgUserEngagementScore?: number
  avgAiConfidenceScore?: number
  userSatisfactionScore?: number
  
  // Performance metrics
  avgAiResponseTimeMs?: number
  p95AiResponseTimeMs?: number
  systemErrorRate: number
}

export interface SessionQualityScore {
  sessionId: string
  completionQuality: number // 1-10
  engagementQuality: number // 1-10
  outputQuality: number // 1-10
  interactionQuality: number // 1-10
  valueDeliveryQuality: number // 1-10
  overallQualityScore: number // 1-10
  userSatisfactionScore?: number // 1-5
  
  qualityIndicators: Record<string, any>
  improvementOpportunities: string[]
  successFactors: string[]
  scoreConfidence: number
}

export interface OptimizationInsight {
  id: string
  insightType: 'pathway_optimization' | 'phase_improvement' | 'user_experience' | 'ai_performance' | 'engagement_boost' | 'completion_rate'
  pathway?: PathwayType
  phaseId?: string
  
  title: string
  description: string
  rationale: string
  
  estimatedImpactScore: number // 1-100
  implementationEffort: 'low' | 'medium' | 'high'
  expectedRoiMultiplier?: number
  
  dataConfidence: number
  supportingMetrics: Record<string, any>
  sampleSize: number
  
  recommendedActions: string[]
  successCriteria: Record<string, any>
  
  status: 'new' | 'under_review' | 'approved' | 'implemented' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'critical'
}

// Main Analytics Service Class
export class BMadAnalyticsService {
  private supabase = createClient()

  /**
   * Track a single analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('bmad_analytics_events')
        .insert({
          session_id: event.sessionId,
          user_id: event.userId,
          event_type: event.eventType,
          event_data: event.eventData,
          event_metadata: event.eventMetadata || {},
          
          // Performance data
          processing_time_ms: event.performanceData?.processingTimeMs,
          ai_response_time_ms: event.performanceData?.aiResponseTimeMs,
          client_render_time_ms: event.performanceData?.clientRenderTimeMs,
          
          // Context
          current_phase: event.contextData?.currentPhase,
          current_template: event.contextData?.currentTemplate,
          pathway: event.contextData?.pathway,
          session_progress_percent: event.contextData?.sessionProgressPercent,
          user_engagement_score: event.contextData?.userEngagementScore,
          ai_confidence_score: event.contextData?.aiConfidenceScore,
          
          // Technical context
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          viewport_size: typeof window !== 'undefined' ? 
            `${window.innerWidth}x${window.innerHeight}` : null
        })

      if (error) throw error

      // Update real-time metrics if this is a significant event
      if (this.isSignificantEvent(event.eventType)) {
        await this.updateRealTimeMetrics(event)
      }

    } catch (error) {
      console.error('Failed to track analytics event:', error)
      // Don't throw - analytics should never break user experience
    }
  }

  /**
   * Track multiple events in batch for performance
   */
  async trackEventBatch(events: AnalyticsEvent[]): Promise<void> {
    try {
      const eventData = events.map(event => ({
        session_id: event.sessionId,
        user_id: event.userId,
        event_type: event.eventType,
        event_data: event.eventData,
        event_metadata: event.eventMetadata || {},
        
        processing_time_ms: event.performanceData?.processingTimeMs,
        ai_response_time_ms: event.performanceData?.aiResponseTimeMs,
        client_render_time_ms: event.performanceData?.clientRenderTimeMs,
        
        current_phase: event.contextData?.currentPhase,
        current_template: event.contextData?.currentTemplate,
        pathway: event.contextData?.pathway,
        session_progress_percent: event.contextData?.sessionProgressPercent,
        user_engagement_score: event.contextData?.userEngagementScore,
        ai_confidence_score: event.contextData?.aiConfidenceScore,
        
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        viewport_size: typeof window !== 'undefined' ? 
          `${window.innerWidth}x${window.innerHeight}` : null
      }))

      const { error } = await this.supabase
        .from('bmad_analytics_events')
        .insert(eventData)

      if (error) throw error

    } catch (error) {
      console.error('Failed to track analytics event batch:', error)
    }
  }

  /**
   * Analyze user behavior patterns for a session
   */
  async analyzeUserBehavior(sessionId: string, userId: string): Promise<UserBehaviorAnalysis | null> {
    try {
      // Get session events
      const { data: events, error: eventsError } = await this.supabase
        .from('bmad_analytics_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      if (eventsError) throw eventsError

      // Get user responses
      const { data: responses, error: responsesError } = await this.supabase
        .from('bmad_user_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      if (responsesError) throw responsesError

      // Analyze patterns
      const analysis = this.generateBehaviorAnalysis(events, responses, userId, sessionId)
      
      // Store analysis
      if (analysis) {
        await this.storeBehaviorAnalysis(analysis)
      }

      return analysis

    } catch (error) {
      console.error('Failed to analyze user behavior:', error)
      return null
    }
  }

  /**
   * Get pathway performance metrics
   */
  async getPathwayMetrics(
    pathway: PathwayType,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<PathwayPerformanceMetrics | null> {
    try {
      const startDate = this.getStartDateForTimeframe(timeframe)
      
      const { data, error } = await this.supabase
        .from('bmad_pathway_metrics')
        .select('*')
        .eq('pathway', pathway)
        .gte('metric_date', startDate)
        .order('metric_date', { ascending: false })
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) return null

      const metrics = data[0]
      
      return {
        pathway,
        timeframe,
        period: metrics.metric_date,
        
        sessionsStarted: metrics.sessions_started,
        sessionsCompleted: metrics.sessions_completed,
        sessionsAbandoned: metrics.sessions_abandoned,
        completionRate: metrics.completion_rate,
        
        avgSessionDurationMinutes: metrics.avg_session_duration_minutes,
        avgTimeToFirstBreakthrough: metrics.avg_time_to_first_breakthrough,
        avgPhaseCompletionTime: metrics.avg_phase_completion_time,
        phaseTimeoutRate: metrics.phase_timeout_rate,
        
        avgPersonaSwitches: metrics.avg_persona_switches,
        avgKnowledgeReferences: metrics.avg_knowledge_references,
        confusionEventsPerSession: metrics.confusion_events_per_session,
        breakthroughMomentsPerSession: metrics.breakthrough_moments_per_session,
        
        actionableOutputsPerSession: metrics.actionable_outputs_per_session,
        avgOutputQualityScore: metrics.avg_output_quality_score,
        avgUserEngagementScore: metrics.avg_user_engagement_score,
        avgAiConfidenceScore: metrics.avg_ai_confidence_score,
        userSatisfactionScore: metrics.user_satisfaction_score,
        
        avgAiResponseTimeMs: metrics.avg_ai_response_time_ms,
        p95AiResponseTimeMs: metrics.p95_ai_response_time_ms,
        systemErrorRate: metrics.system_error_rate
      }

    } catch (error) {
      console.error('Failed to get pathway metrics:', error)
      return null
    }
  }

  /**
   * Calculate session quality score
   */
  async calculateSessionQuality(sessionId: string): Promise<SessionQualityScore | null> {
    try {
      // Check if already calculated
      const { data: existing } = await this.supabase
        .from('bmad_session_quality_scores')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (existing) {
        return this.formatQualityScore(existing)
      }

      // Calculate new quality score
      const qualityScore = await this.computeSessionQuality(sessionId)
      
      if (qualityScore) {
        // Store the calculated score
        const { error } = await this.supabase
          .from('bmad_session_quality_scores')
          .insert({
            session_id: sessionId,
            completion_quality: qualityScore.completionQuality,
            engagement_quality: qualityScore.engagementQuality,
            output_quality: qualityScore.outputQuality,
            interaction_quality: qualityScore.interactionQuality,
            value_delivery_quality: qualityScore.valueDeliveryQuality,
            overall_quality_score: qualityScore.overallQualityScore,
            user_satisfaction_score: qualityScore.userSatisfactionScore,
            quality_indicators: qualityScore.qualityIndicators,
            improvement_opportunities: qualityScore.improvementOpportunities,
            success_factors: qualityScore.successFactors,
            score_confidence: qualityScore.scoreConfidence
          })

        if (error) throw error
      }

      return qualityScore

    } catch (error) {
      console.error('Failed to calculate session quality:', error)
      return null
    }
  }

  /**
   * Get optimization insights
   */
  async getOptimizationInsights(
    pathway?: PathwayType,
    status?: string,
    limit: number = 10
  ): Promise<OptimizationInsight[]> {
    try {
      let query = this.supabase
        .from('bmad_optimization_insights')
        .select('*')

      if (pathway) {
        query = query.eq('pathway', pathway)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
        .order('estimated_impact_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(insight => ({
        id: insight.id,
        insightType: insight.insight_type,
        pathway: insight.pathway,
        phaseId: insight.phase_id,
        
        title: insight.insight_title,
        description: insight.insight_description,
        rationale: insight.insight_rationale,
        
        estimatedImpactScore: insight.estimated_impact_score,
        implementationEffort: insight.implementation_effort,
        expectedRoiMultiplier: insight.expected_roi_multiplier,
        
        dataConfidence: insight.data_confidence,
        supportingMetrics: insight.supporting_metrics,
        sampleSize: insight.sample_size,
        
        recommendedActions: insight.recommended_actions,
        successCriteria: insight.success_criteria,
        
        status: insight.status,
        priority: insight.priority
      }))

    } catch (error) {
      console.error('Failed to get optimization insights:', error)
      return []
    }
  }

  // Private helper methods

  private isSignificantEvent(eventType: AnalyticsEventType): boolean {
    return [
      'session_start', 'session_complete', 'breakthrough_moment',
      'phase_exit', 'elicitation_complete'
    ].includes(eventType)
  }

  private async updateRealTimeMetrics(event: AnalyticsEvent): Promise<void> {
    // Update real-time dashboard metrics
    // This could trigger WebSocket updates or cache updates
  }

  private generateBehaviorAnalysis(
    events: any[], 
    responses: any[], 
    userId: string, 
    sessionId: string
  ): UserBehaviorAnalysis | null {
    if (!events || events.length === 0) return null

    const pathway = events[0]?.pathway as PathwayType
    if (!pathway) return null

    // Calculate engagement score
    const engagementScore = this.calculateEngagementFromEvents(events, responses)
    
    // Analyze interaction patterns
    const responseVelocity = this.calculateResponseVelocity(responses)
    const interactionDepthScore = this.calculateInteractionDepth(events, responses)
    
    // Detect preferences
    const preferences = this.detectUserPreferences(events, responses)
    
    // Generate insights
    const insights = this.generateBehaviorInsights(events, responses, engagementScore)
    const recommendations = this.generateBehaviorRecommendations(insights, preferences)

    return {
      sessionId,
      userId,
      pathway,
      engagementScore,
      interactionPatterns: {
        responseVelocity,
        interactionDepthScore,
        revisionFrequency: this.calculateRevisionFrequency(responses),
        questionAskingFrequency: this.calculateQuestionFrequency(responses)
      },
      preferences,
      insights,
      recommendations,
      analysisConfidence: Math.min(1, Math.max(0.1, events.length / 50)) // More events = higher confidence
    }
  }

  private async storeBehaviorAnalysis(analysis: UserBehaviorAnalysis): Promise<void> {
    try {
      await this.supabase
        .from('bmad_user_behavior')
        .upsert({
          user_id: analysis.userId,
          session_id: analysis.sessionId,
          pathway: analysis.pathway,
          engagement_score: analysis.engagementScore,
          interaction_depth_score: analysis.interactionPatterns.interactionDepthScore,
          revision_frequency: analysis.interactionPatterns.revisionFrequency,
          question_asking_frequency: analysis.interactionPatterns.questionAskingFrequency,
          response_velocity: analysis.interactionPatterns.responseVelocity,
          preferred_elicitation_style: analysis.preferences.preferredElicitationStyle,
          optimal_session_length: analysis.preferences.optimalSessionLength,
          most_effective_persona: analysis.preferences.mostEffectivePersona,
          preferred_interaction_pace: analysis.preferences.preferredInteractionPace,
          insights_generated: analysis.insights,
          recommendations: analysis.recommendations,
          analysis_confidence: analysis.analysisConfidence
        })

    } catch (error) {
      console.error('Failed to store behavior analysis:', error)
    }
  }

  private getStartDateForTimeframe(timeframe: 'day' | 'week' | 'month'): string {
    const now = new Date()
    
    switch (timeframe) {
      case 'day':
        return now.toISOString().split('T')[0]
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return weekAgo.toISOString().split('T')[0]
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return monthAgo.toISOString().split('T')[0]
      default:
        return now.toISOString().split('T')[0]
    }
  }

  private async computeSessionQuality(sessionId: string): Promise<SessionQualityScore | null> {
    // This would implement the actual quality scoring algorithm
    // For now, return a placeholder implementation
    return {
      sessionId,
      completionQuality: 8,
      engagementQuality: 7,
      outputQuality: 8,
      interactionQuality: 9,
      valueDeliveryQuality: 8,
      overallQualityScore: 8.0,
      userSatisfactionScore: 4,
      qualityIndicators: {},
      improvementOpportunities: [],
      successFactors: [],
      scoreConfidence: 0.85
    }
  }

  private formatQualityScore(dbScore: any): SessionQualityScore {
    return {
      sessionId: dbScore.session_id,
      completionQuality: dbScore.completion_quality,
      engagementQuality: dbScore.engagement_quality,
      outputQuality: dbScore.output_quality,
      interactionQuality: dbScore.interaction_quality,
      valueDeliveryQuality: dbScore.value_delivery_quality,
      overallQualityScore: dbScore.overall_quality_score,
      userSatisfactionScore: dbScore.user_satisfaction_score,
      qualityIndicators: dbScore.quality_indicators,
      improvementOpportunities: dbScore.improvement_opportunities,
      successFactors: dbScore.success_factors,
      scoreConfidence: dbScore.score_confidence
    }
  }

  // Additional helper methods for behavior analysis
  private calculateEngagementFromEvents(events: any[], responses: any[]): number {
    // Implement engagement calculation logic
    const totalEvents = events.length
    const significantEvents = events.filter(e => 
      ['breakthrough_moment', 'elicitation_complete', 'user_response'].includes(e.event_type)
    ).length
    
    return Math.min(100, Math.max(1, (significantEvents / Math.max(1, totalEvents)) * 100))
  }

  private calculateResponseVelocity(responses: any[]): Record<string, number> {
    // Calculate average response time per phase
    const velocityByPhase: Record<string, number[]> = {}
    
    for (let i = 1; i < responses.length; i++) {
      const current = responses[i]
      const previous = responses[i - 1]
      const timeDiff = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()
      
      if (!velocityByPhase[current.phase_id]) {
        velocityByPhase[current.phase_id] = []
      }
      velocityByPhase[current.phase_id].push(timeDiff / 1000) // Convert to seconds
    }

    const avgVelocity: Record<string, number> = {}
    for (const [phase, times] of Object.entries(velocityByPhase)) {
      avgVelocity[phase] = times.reduce((a, b) => a + b, 0) / times.length
    }

    return avgVelocity
  }

  private calculateInteractionDepth(events: any[], responses: any[]): number {
    // Measure depth of user engagement
    const depthIndicators = [
      responses.filter(r => r.response_text && r.response_text.length > 100).length,
      events.filter(e => e.event_type === 'knowledge_reference').length,
      responses.filter(r => r.response_text && r.response_text.includes('?')).length
    ]

    return Math.min(100, Math.max(1, depthIndicators.reduce((a, b) => a + b, 0) * 5))
  }

  private calculateRevisionFrequency(responses: any[]): number {
    // Count how often user revises their responses
    return responses.filter(r => r.response_text?.includes('actually') || 
                            r.response_text?.includes('correction') ||
                            r.response_text?.includes('revise')).length / Math.max(1, responses.length)
  }

  private calculateQuestionFrequency(responses: any[]): number {
    // Count how often user asks questions
    return responses.filter(r => r.response_text?.includes('?')).length / Math.max(1, responses.length)
  }

  private detectUserPreferences(events: any[], responses: any[]): UserBehaviorAnalysis['preferences'] {
    // Analyze patterns to detect user preferences
    return {
      preferredElicitationStyle: 'structured', // Default - would analyze actual patterns
      optimalSessionLength: 60, // Default - would calculate from successful sessions
      mostEffectivePersona: 'advisor', // Default - would analyze persona switch patterns
      preferredInteractionPace: 'moderate' // Default - would analyze response timing
    }
  }

  private generateBehaviorInsights(events: any[], responses: any[], engagementScore: number): string[] {
    const insights: string[] = []

    if (engagementScore > 80) {
      insights.push('High engagement throughout session')
    }

    if (events.filter(e => e.event_type === 'breakthrough_moment').length > 2) {
      insights.push('Multiple breakthrough moments indicate effective methodology')
    }

    return insights
  }

  private generateBehaviorRecommendations(
    insights: string[], 
    preferences: UserBehaviorAnalysis['preferences']
  ): string[] {
    const recommendations: string[] = []

    if (preferences.preferredElicitationStyle === 'conversational') {
      recommendations.push('Consider more open-ended questioning approaches')
    }

    return recommendations
  }
}

// Singleton instance
export const analyticsService = new BMadAnalyticsService()