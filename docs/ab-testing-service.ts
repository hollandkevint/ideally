/**
 * BMad A/B Testing Service
 * 
 * Provides comprehensive A/B testing capabilities for optimizing the BMad Method,
 * including experiment management, variant assignment, statistical analysis,
 * and automated insights generation.
 */

import { createClient } from '@/lib/supabase/client'
import { PathwayType } from './types'

// A/B Testing Types
export interface ExperimentConfig {
  name: string
  description: string
  hypothesis: string
  pathway?: PathwayType
  variants: Record<string, ExperimentVariant>
  trafficAllocation: Record<string, number>
  targetCriteria: Record<string, any>
  primaryMetric: string
  primaryMetricTarget?: number
  secondaryMetrics: string[]
  minimumSampleSize: number
  significanceThreshold: number
  powerThreshold: number
  minimumEffectSize?: number
  duration?: number // days
}

export interface ExperimentVariant {
  name: string
  description: string
  changes: Record<string, any>
  enabled: boolean
}

export interface Experiment {
  id: string
  name: string
  description: string
  hypothesis: string
  pathway?: PathwayType
  variants: Record<string, ExperimentVariant>
  trafficAllocation: Record<string, number>
  targetCriteria: Record<string, any>
  primaryMetric: string
  primaryMetricTarget?: number
  secondaryMetrics: string[]
  minimumSampleSize: number
  significanceThreshold: number
  powerThreshold: number
  minimumEffectSize?: number
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  startDate?: Date
  endDate?: Date
  actualEndDate?: Date
  resultsData: Record<string, any>
  statisticalSignificance?: boolean
  effectSize?: number
  confidenceInterval?: [number, number]
  createdAt: Date
  updatedAt: Date
}

export interface ExperimentAssignment {
  id: string
  experimentId: string
  sessionId: string
  userId: string
  variant: string
  assignmentReason?: string
  assignedAt: Date
  firstInteractionAt?: Date
  lastInteractionAt?: Date
  primaryConversion: boolean
  primaryConversionAt?: Date
  primaryConversionValue?: number
  secondaryConversions: Record<string, any>
}

export interface ConversionEvent {
  sessionId: string
  experimentId: string
  metric: string
  value: number
  timestamp?: Date
  metadata?: Record<string, any>
}

export interface ExperimentResults {
  experiment: Experiment
  variants: Record<string, VariantResults>
  overallStatistics: {
    totalSessions: number
    totalConversions: number
    overallConversionRate: number
    statisticalSignificance: boolean
    pValue?: number
    confidenceLevel: number
  }
  recommendations: string[]
  insights: string[]
}

export interface VariantResults {
  variant: string
  sessions: number
  conversions: number
  conversionRate: number
  averageValue: number
  standardError: number
  confidenceInterval: [number, number]
  lift?: number
  liftConfidenceInterval?: [number, number]
  statisticalSignificance: boolean
}

export interface SignificanceTest {
  experimentId: string
  variant: string
  baselineVariant: string
  metric: string
  pValue: number
  zScore: number
  statisticalSignificance: boolean
  confidenceLevel: number
  effectSize: number
  minimumDetectableEffect: number
  power: number
  sampleSize: number
  requiredSampleSize: number
}

// A/B Testing Service Implementation
export class BMadABTestingService {
  private supabase = createClient()

  /**
   * Create a new A/B test experiment
   */
  async createExperiment(config: ExperimentConfig): Promise<Experiment> {
    try {
      // Validate configuration
      this.validateExperimentConfig(config)
      
      const { data, error } = await this.supabase
        .from('bmad_ab_experiments')
        .insert({
          experiment_name: config.name,
          description: config.description,
          hypothesis: config.hypothesis,
          pathway: config.pathway,
          variants: config.variants,
          traffic_allocation: config.trafficAllocation,
          target_criteria: config.targetCriteria,
          primary_metric: config.primaryMetric,
          primary_metric_target: config.primaryMetricTarget,
          secondary_metrics: config.secondaryMetrics,
          minimum_sample_size: config.minimumSampleSize,
          significance_threshold: config.significanceThreshold,
          power_threshold: config.powerThreshold,
          minimum_effect_size: config.minimumEffectSize,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      return this.formatExperiment(data)
    } catch (error) {
      console.error('Failed to create experiment:', error)
      throw error
    }
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentId: string, duration?: number): Promise<void> {
    try {
      const endDate = duration ? 
        new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : undefined

      const { error } = await this.supabase
        .from('bmad_ab_experiments')
        .update({
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate?.toISOString()
        })
        .eq('id', experimentId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to start experiment:', error)
      throw error
    }
  }

  /**
   * Pause an experiment
   */
  async pauseExperiment(experimentId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('bmad_ab_experiments')
        .update({ status: 'paused' })
        .eq('id', experimentId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to pause experiment:', error)
      throw error
    }
  }

  /**
   * Complete an experiment
   */
  async completeExperiment(experimentId: string): Promise<void> {
    try {
      // Calculate final results
      const results = await this.calculateExperimentResults(experimentId)
      
      const { error } = await this.supabase
        .from('bmad_ab_experiments')
        .update({
          status: 'completed',
          actual_end_date: new Date().toISOString(),
          results_data: results,
          statistical_significance: results.overallStatistics.statisticalSignificance,
          effect_size: this.calculateOverallEffectSize(results)
        })
        .eq('id', experimentId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to complete experiment:', error)
      throw error
    }
  }

  /**
   * Assign a user to an experiment variant
   */
  async assignVariant(sessionId: string, userId: string): Promise<string> {
    try {
      // Get active experiments for this session's pathway
      const { data: session, error: sessionError } = await this.supabase
        .from('bmad_sessions')
        .select('pathway')
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      // Find active experiments for this pathway
      const { data: experiments, error: experimentsError } = await this.supabase
        .from('bmad_ab_experiments')
        .select('*')
        .eq('status', 'active')
        .or(`pathway.is.null,pathway.eq.${session.pathway}`)

      if (experimentsError) throw experimentsError

      let assignedVariant = 'control' // Default variant

      for (const experiment of experiments || []) {
        // Check if user meets targeting criteria
        if (await this.meetsTargetingCriteria(userId, experiment.target_criteria)) {
          // Check if already assigned
          const { data: existingAssignment } = await this.supabase
            .from('bmad_ab_assignments')
            .select('variant')
            .eq('experiment_id', experiment.id)
            .eq('session_id', sessionId)
            .single()

          if (existingAssignment) {
            assignedVariant = existingAssignment.variant
            break
          }

          // Assign new variant based on traffic allocation
          const variant = this.selectVariant(experiment.traffic_allocation)
          assignedVariant = variant

          // Record assignment
          await this.supabase
            .from('bmad_ab_assignments')
            .insert({
              experiment_id: experiment.id,
              session_id: sessionId,
              user_id: userId,
              variant: variant,
              assignment_reason: 'traffic_allocation'
            })

          break
        }
      }

      return assignedVariant
    } catch (error) {
      console.error('Failed to assign variant:', error)
      return 'control' // Fallback to control variant
    }
  }

  /**
   * Track a conversion event
   */
  async trackConversion(
    sessionId: string, 
    metric: string, 
    value: number = 1,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get experiment assignments for this session
      const { data: assignments, error: assignmentsError } = await this.supabase
        .from('bmad_ab_assignments')
        .select('*')
        .eq('session_id', sessionId)

      if (assignmentsError) throw assignmentsError

      // Update conversions for each assignment
      for (const assignment of assignments || []) {
        const { data: experiment, error: experimentError } = await this.supabase
          .from('bmad_ab_experiments')
          .select('primary_metric, secondary_metrics')
          .eq('id', assignment.experiment_id)
          .single()

        if (experimentError) continue

        if (metric === experiment.primary_metric) {
          // Primary conversion
          await this.supabase
            .from('bmad_ab_assignments')
            .update({
              primary_conversion: true,
              primary_conversion_at: new Date().toISOString(),
              primary_conversion_value: value,
              last_interaction_at: new Date().toISOString()
            })
            .eq('id', assignment.id)
        } else if (experiment.secondary_metrics.includes(metric)) {
          // Secondary conversion
          const secondaryConversions = assignment.secondary_conversions || {}
          secondaryConversions[metric] = {
            value,
            timestamp: new Date().toISOString(),
            metadata
          }

          await this.supabase
            .from('bmad_ab_assignments')
            .update({
              secondary_conversions: secondaryConversions,
              last_interaction_at: new Date().toISOString()
            })
            .eq('id', assignment.id)
        }

        // Update first interaction if not set
        if (!assignment.first_interaction_at) {
          await this.supabase
            .from('bmad_ab_assignments')
            .update({
              first_interaction_at: new Date().toISOString()
            })
            .eq('id', assignment.id)
        }
      }
    } catch (error) {
      console.error('Failed to track conversion:', error)
    }
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string): Promise<ExperimentResults> {
    try {
      return await this.calculateExperimentResults(experimentId)
    } catch (error) {
      console.error('Failed to get experiment results:', error)
      throw error
    }
  }

  /**
   * Calculate statistical significance
   */
  async calculateStatisticalSignificance(
    experimentId: string,
    variant: string,
    baselineVariant: string = 'control'
  ): Promise<SignificanceTest> {
    try {
      // Get experiment data
      const { data: experiment, error: experimentError } = await this.supabase
        .from('bmad_ab_experiments')
        .select('*')
        .eq('id', experimentId)
        .single()

      if (experimentError) throw experimentError

      // Get variant statistics
      const [variantStats, baselineStats] = await Promise.all([
        this.getVariantStatistics(experimentId, variant, experiment.primary_metric),
        this.getVariantStatistics(experimentId, baselineVariant, experiment.primary_metric)
      ])

      // Calculate statistical significance
      const significance = this.performZTest(variantStats, baselineStats)
      
      return {
        experimentId,
        variant,
        baselineVariant,
        metric: experiment.primary_metric,
        pValue: significance.pValue,
        zScore: significance.zScore,
        statisticalSignificance: significance.pValue < experiment.significance_threshold,
        confidenceLevel: 1 - experiment.significance_threshold,
        effectSize: significance.effectSize,
        minimumDetectableEffect: experiment.minimum_effect_size || 0.05,
        power: experiment.power_threshold,
        sampleSize: variantStats.sessions + baselineStats.sessions,
        requiredSampleSize: experiment.minimum_sample_size
      }
    } catch (error) {
      console.error('Failed to calculate statistical significance:', error)
      throw error
    }
  }

  /**
   * Get all active experiments
   */
  async getActiveExperiments(pathway?: PathwayType): Promise<Experiment[]> {
    try {
      let query = this.supabase
        .from('bmad_ab_experiments')
        .select('*')
        .eq('status', 'active')

      if (pathway) {
        query = query.or(`pathway.is.null,pathway.eq.${pathway}`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(this.formatExperiment)
    } catch (error) {
      console.error('Failed to get active experiments:', error)
      return []
    }
  }

  /**
   * Get experiment by ID
   */
  async getExperiment(experimentId: string): Promise<Experiment | null> {
    try {
      const { data, error } = await this.supabase
        .from('bmad_ab_experiments')
        .select('*')
        .eq('id', experimentId)
        .single()

      if (error) throw error

      return this.formatExperiment(data)
    } catch (error) {
      console.error('Failed to get experiment:', error)
      return null
    }
  }

  // Private helper methods

  private validateExperimentConfig(config: ExperimentConfig): void {
    if (!config.name || !config.description || !config.hypothesis) {
      throw new Error('Name, description, and hypothesis are required')
    }

    if (!config.variants || Object.keys(config.variants).length < 2) {
      throw new Error('At least 2 variants are required')
    }

    if (!config.primaryMetric) {
      throw new Error('Primary metric is required')
    }

    const allocationSum = Object.values(config.trafficAllocation).reduce((a, b) => a + b, 0)
    if (Math.abs(allocationSum - 100) > 0.01) {
      throw new Error('Traffic allocation must sum to 100%')
    }
  }

  private async meetsTargetingCriteria(userId: string, criteria: Record<string, any>): Promise<boolean> {
    // Implement targeting criteria logic
    // For now, return true (everyone is eligible)
    return true
  }

  private selectVariant(trafficAllocation: Record<string, number>): string {
    const random = Math.random() * 100
    let cumulative = 0

    for (const [variant, allocation] of Object.entries(trafficAllocation)) {
      cumulative += allocation
      if (random < cumulative) {
        return variant
      }
    }

    // Fallback to first variant (should not happen if allocation is correct)
    return Object.keys(trafficAllocation)[0]
  }

  private async calculateExperimentResults(experimentId: string): Promise<ExperimentResults> {
    // Get experiment details
    const { data: experiment, error: experimentError } = await this.supabase
      .from('bmad_ab_experiments')
      .select('*')
      .eq('id', experimentId)
      .single()

    if (experimentError) throw experimentError

    // Get all assignments
    const { data: assignments, error: assignmentsError } = await this.supabase
      .from('bmad_ab_assignments')
      .select('*')
      .eq('experiment_id', experimentId)

    if (assignmentsError) throw assignmentsError

    // Calculate results for each variant
    const variantResults: Record<string, VariantResults> = {}
    const variants = Object.keys(experiment.variants)

    for (const variant of variants) {
      const variantAssignments = (assignments || []).filter(a => a.variant === variant)
      const sessions = variantAssignments.length
      const conversions = variantAssignments.filter(a => a.primary_conversion).length
      const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0
      
      const values = variantAssignments
        .filter(a => a.primary_conversion_value != null)
        .map(a => a.primary_conversion_value)
      
      const averageValue = values.length > 0 ? 
        values.reduce((a, b) => a + b, 0) / values.length : 0

      const standardError = Math.sqrt((conversionRate * (100 - conversionRate)) / sessions)
      const confidenceInterval: [number, number] = [
        Math.max(0, conversionRate - 1.96 * standardError),
        Math.min(100, conversionRate + 1.96 * standardError)
      ]

      variantResults[variant] = {
        variant,
        sessions,
        conversions,
        conversionRate,
        averageValue,
        standardError,
        confidenceInterval,
        statisticalSignificance: false // Will be calculated against control
      }
    }

    // Calculate lift against control
    const controlVariant = 'control'
    if (variantResults[controlVariant]) {
      const controlRate = variantResults[controlVariant].conversionRate
      
      for (const variant of variants) {
        if (variant !== controlVariant && controlRate > 0) {
          const lift = ((variantResults[variant].conversionRate - controlRate) / controlRate) * 100
          variantResults[variant].lift = lift
          
          // Calculate lift confidence interval (approximate)
          const liftSE = Math.sqrt(
            Math.pow(variantResults[variant].standardError, 2) + 
            Math.pow(variantResults[controlVariant].standardError, 2)
          )
          variantResults[variant].liftConfidenceInterval = [
            lift - 1.96 * liftSE,
            lift + 1.96 * liftSE
          ]

          // Statistical significance test
          const significance = this.performZTest(
            variantResults[variant],
            variantResults[controlVariant]
          )
          variantResults[variant].statisticalSignificance = 
            significance.pValue < experiment.significance_threshold
        }
      }
    }

    const totalSessions = Object.values(variantResults).reduce((sum, v) => sum + v.sessions, 0)
    const totalConversions = Object.values(variantResults).reduce((sum, v) => sum + v.conversions, 0)
    const overallConversionRate = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0

    return {
      experiment: this.formatExperiment(experiment),
      variants: variantResults,
      overallStatistics: {
        totalSessions,
        totalConversions,
        overallConversionRate,
        statisticalSignificance: Object.values(variantResults).some(v => v.statisticalSignificance),
        confidenceLevel: 1 - experiment.significance_threshold
      },
      recommendations: this.generateRecommendations(variantResults, experiment),
      insights: this.generateInsights(variantResults, experiment)
    }
  }

  private async getVariantStatistics(
    experimentId: string, 
    variant: string, 
    metric: string
  ): Promise<VariantResults> {
    const { data: assignments, error } = await this.supabase
      .from('bmad_ab_assignments')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('variant', variant)

    if (error) throw error

    const sessions = (assignments || []).length
    const conversions = (assignments || []).filter(a => a.primary_conversion).length
    const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0

    const values = (assignments || [])
      .filter(a => a.primary_conversion_value != null)
      .map(a => a.primary_conversion_value)
    
    const averageValue = values.length > 0 ? 
      values.reduce((a, b) => a + b, 0) / values.length : 0

    const standardError = Math.sqrt((conversionRate * (100 - conversionRate)) / sessions)

    return {
      variant,
      sessions,
      conversions,
      conversionRate,
      averageValue,
      standardError,
      confidenceInterval: [0, 0], // Will be calculated if needed
      statisticalSignificance: false
    }
  }

  private performZTest(variant: VariantResults, control: VariantResults) {
    const p1 = variant.conversionRate / 100
    const p2 = control.conversionRate / 100
    const n1 = variant.sessions
    const n2 = control.sessions

    if (n1 === 0 || n2 === 0) {
      return { pValue: 1, zScore: 0, effectSize: 0 }
    }

    const pooledP = ((p1 * n1) + (p2 * n2)) / (n1 + n2)
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * ((1 / n1) + (1 / n2)))

    if (standardError === 0) {
      return { pValue: 1, zScore: 0, effectSize: 0 }
    }

    const zScore = (p1 - p2) / standardError
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)))

    // Effect size (Cohen's h)
    const effectSize = 2 * (Math.asin(Math.sqrt(p1)) - Math.asin(Math.sqrt(p2)))

    return { pValue, zScore, effectSize }
  }

  private normalCDF(x: number): number {
    // Approximation of the normal cumulative distribution function
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2.0)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)
  }

  private calculateOverallEffectSize(results: ExperimentResults): number {
    const variants = Object.values(results.variants)
    if (variants.length < 2) return 0

    const maxRate = Math.max(...variants.map(v => v.conversionRate))
    const minRate = Math.min(...variants.map(v => v.conversionRate))
    
    return maxRate > 0 ? (maxRate - minRate) / maxRate : 0
  }

  private generateRecommendations(
    variantResults: Record<string, VariantResults>, 
    experiment: any
  ): string[] {
    const recommendations: string[] = []
    const variants = Object.values(variantResults).sort((a, b) => b.conversionRate - a.conversionRate)

    if (variants.length === 0) return recommendations

    const bestVariant = variants[0]
    const hasSignificantWinner = variants.some(v => v.statisticalSignificance)

    if (hasSignificantWinner) {
      recommendations.push(`Implement ${bestVariant.variant} variant with ${bestVariant.conversionRate.toFixed(1)}% conversion rate`)
      
      if (bestVariant.lift && bestVariant.lift > 0) {
        recommendations.push(`Expected lift of ${bestVariant.lift.toFixed(1)}% over control`)
      }
    } else {
      recommendations.push('No statistically significant winner detected')
      recommendations.push('Consider running the test longer or increasing traffic allocation')
    }

    // Sample size recommendations
    const totalSamples = Object.values(variantResults).reduce((sum, v) => sum + v.sessions, 0)
    if (totalSamples < experiment.minimum_sample_size) {
      const remaining = experiment.minimum_sample_size - totalSamples
      recommendations.push(`Need ${remaining} more samples to reach minimum sample size`)
    }

    return recommendations
  }

  private generateInsights(
    variantResults: Record<string, VariantResults>, 
    experiment: any
  ): string[] {
    const insights: string[] = []
    const variants = Object.values(variantResults)

    if (variants.length === 0) return insights

    // Performance insights
    const conversionRates = variants.map(v => v.conversionRate)
    const avgRate = conversionRates.reduce((a, b) => a + b, 0) / conversionRates.length
    const variance = conversionRates.reduce((acc, rate) => acc + Math.pow(rate - avgRate, 2), 0) / conversionRates.length

    if (variance > 10) {
      insights.push('High variance in conversion rates suggests significant user preference differences')
    }

    // Sample size insights
    const sampleSizes = variants.map(v => v.sessions)
    const minSample = Math.min(...sampleSizes)
    const maxSample = Math.max(...sampleSizes)

    if (maxSample > 0 && (maxSample - minSample) / maxSample > 0.2) {
      insights.push('Uneven sample distribution across variants may affect result reliability')
    }

    // Performance patterns
    const bestPerformer = variants.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    )

    if (bestPerformer.conversionRate > avgRate * 1.2) {
      insights.push(`${bestPerformer.variant} variant shows strong performance indicators`)
    }

    return insights
  }

  private formatExperiment(data: any): Experiment {
    return {
      id: data.id,
      name: data.experiment_name,
      description: data.description,
      hypothesis: data.hypothesis,
      pathway: data.pathway,
      variants: data.variants,
      trafficAllocation: data.traffic_allocation,
      targetCriteria: data.target_criteria,
      primaryMetric: data.primary_metric,
      primaryMetricTarget: data.primary_metric_target,
      secondaryMetrics: data.secondary_metrics,
      minimumSampleSize: data.minimum_sample_size,
      significanceThreshold: data.significance_threshold,
      powerThreshold: data.power_threshold,
      minimumEffectSize: data.minimum_effect_size,
      status: data.status,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      actualEndDate: data.actual_end_date ? new Date(data.actual_end_date) : undefined,
      resultsData: data.results_data || {},
      statisticalSignificance: data.statistical_significance,
      effectSize: data.effect_size,
      confidenceInterval: data.confidence_interval,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}

// Singleton instance
export const abTestingService = new BMadABTestingService()

// Helper function to create common experiment configurations
export const createElicitationStyleExperiment = (): ExperimentConfig => ({
  name: 'Elicitation Style Optimization',
  description: 'Test effectiveness of different elicitation approaches',
  hypothesis: 'Conversational elicitation will improve user engagement and completion rates',
  variants: {
    control: {
      name: 'Numbered Options',
      description: 'Current structured numbered options approach',
      changes: { elicitationStyle: 'numbered' },
      enabled: true
    },
    conversational: {
      name: 'Conversational Prompts',
      description: 'Open-ended conversational prompts',
      changes: { elicitationStyle: 'conversational' },
      enabled: true
    }
  },
  trafficAllocation: { control: 50, conversational: 50 },
  targetCriteria: {},
  primaryMetric: 'session_completion_rate',
  secondaryMetrics: ['engagement_score', 'user_satisfaction'],
  minimumSampleSize: 200,
  significanceThreshold: 0.05,
  powerThreshold: 0.80,
  minimumEffectSize: 0.1
})

export const createSessionLengthExperiment = (): ExperimentConfig => ({
  name: 'Optimal Session Length',
  description: 'Test impact of extended phase time allocations',
  hypothesis: 'Longer phase allocations will improve output quality without hurting completion rates',
  variants: {
    control: {
      name: 'Standard Length',
      description: 'Current time allocations',
      changes: { timeMultiplier: 1.0 },
      enabled: true
    },
    extended: {
      name: 'Extended Length',
      description: '20% longer phase allocations',
      changes: { timeMultiplier: 1.2 },
      enabled: true
    }
  },
  trafficAllocation: { control: 50, extended: 50 },
  targetCriteria: {},
  primaryMetric: 'output_quality_score',
  secondaryMetrics: ['session_completion_rate', 'user_satisfaction'],
  minimumSampleSize: 150,
  significanceThreshold: 0.05,
  powerThreshold: 0.80,
  minimumEffectSize: 0.15
})