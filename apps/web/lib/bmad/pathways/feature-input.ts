import { FeatureInputData } from '@/lib/bmad/types'

export interface FeatureInputValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface FeatureAnalysisResult {
  questions: string[]
  analysis_id: string
  insights: {
    complexity_score: number
    user_focus_score: number
    feasibility_indicators: string[]
  }
}

/**
 * Validates feature input data according to requirements
 */
export function validateFeatureInput(data: Partial<FeatureInputData>): FeatureInputValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Required field validation
  if (!data.feature_description?.trim()) {
    errors.push('Feature description is required')
  } else {
    const description = data.feature_description.trim()

    // Length validation
    if (description.length < 50) {
      errors.push('Feature description must be at least 50 characters')
    }
    if (description.length > 500) {
      errors.push('Feature description must be 500 characters or less')
    }
  }

  // Optional field length validation
  if (data.target_users && data.target_users.length > 200) {
    errors.push('Target users description must be 200 characters or less')
  }

  if (data.current_problems && data.current_problems.length > 200) {
    errors.push('Current problems description must be 200 characters or less')
  }

  if (data.success_definition && data.success_definition.length > 200) {
    errors.push('Success definition must be 200 characters or less')
  }

  // Content quality warnings
  if (data.feature_description?.trim()) {
    const description = data.feature_description.trim()

    if (!data.target_users?.trim()) {
      warnings.push('Consider adding target user information for better analysis')
    }

    if (!data.current_problems?.trim()) {
      warnings.push('Describing current problems will improve question quality')
    }

    if (description.length < 100) {
      warnings.push('More detailed feature description will generate better questions')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Generates the Claude prompt for feature analysis
 */
export function createFeatureAnalysisPrompt(data: FeatureInputData): string {
  const contextParts = []

  contextParts.push(`Feature Description: ${data.feature_description}`)

  if (data.target_users) {
    contextParts.push(`Target Users: ${data.target_users}`)
  }

  if (data.current_problems) {
    contextParts.push(`Current Problems: ${data.current_problems}`)
  }

  if (data.success_definition) {
    contextParts.push(`Success Definition: ${data.success_definition}`)
  }

  return `
Analyze this feature idea and generate 3-5 focused questions that help the product manager validate:
1. User value and need
2. Basic feasibility considerations
3. Success measurement approach

${contextParts.join('\n')}

Generate practical, actionable questions that guide feature refinement. Each question should:
- Be specific and actionable
- Help validate assumptions
- Guide toward measurable outcomes
- Consider both user and business perspectives

Format your response as a JSON array of question strings.
`.trim()
}

/**
 * Processes the feature input for basic analysis
 */
export function analyzeFeatureInput(data: FeatureInputData): {
  complexity_score: number
  user_focus_score: number
  feasibility_indicators: string[]
} {
  const description = data.feature_description.toLowerCase()
  const indicators: string[] = []

  // Basic complexity assessment
  let complexity_score = 1

  const complexityKeywords = ['integration', 'ai', 'machine learning', 'algorithm', 'platform', 'api', 'database', 'realtime', 'sync']
  const complexityMatches = complexityKeywords.filter(keyword => description.includes(keyword))
  complexity_score = Math.min(10, 1 + complexityMatches.length * 1.5)

  // User focus assessment
  let user_focus_score = 5 // neutral starting point

  const userKeywords = ['user', 'customer', 'people', 'experience', 'interface', 'usability', 'accessibility']
  const userMatches = userKeywords.filter(keyword => description.includes(keyword))
  user_focus_score = Math.min(10, 5 + userMatches.length)

  if (data.target_users) {
    user_focus_score = Math.min(10, user_focus_score + 1)
  }

  // Feasibility indicators
  if (description.includes('mobile') || description.includes('app')) {
    indicators.push('Mobile development considerations needed')
  }

  if (description.includes('data') || description.includes('analytics')) {
    indicators.push('Data architecture and privacy considerations')
  }

  if (description.includes('payment') || description.includes('transaction')) {
    indicators.push('Payment processing and security requirements')
  }

  if (description.includes('notification') || description.includes('email')) {
    indicators.push('Communication infrastructure requirements')
  }

  if (complexityMatches.length > 3) {
    indicators.push('High technical complexity - consider MVP scope')
  }

  if (!data.target_users && !description.includes('user')) {
    indicators.push('User research recommended before development')
  }

  return {
    complexity_score: Math.round(complexity_score * 10) / 10,
    user_focus_score: Math.round(user_focus_score * 10) / 10,
    feasibility_indicators: indicators
  }
}

/**
 * Generates a unique analysis ID for tracking
 */
export function generateAnalysisId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `fa_${timestamp}_${random}`
}