import { FeatureInputData } from '@/lib/bmad/types'

export interface QuestionTemplate {
  category: 'user_value' | 'feasibility' | 'success_measurement'
  template: string
  weight: number
}

/**
 * Default question templates for feature validation
 */
export const FEATURE_QUESTION_TEMPLATES: QuestionTemplate[] = [
  // User Value Questions
  {
    category: 'user_value',
    template: 'What specific user pain point does this feature solve, and how acute is that pain?',
    weight: 10
  },
  {
    category: 'user_value',
    template: 'How do users currently solve this problem, and why would they switch to your solution?',
    weight: 9
  },
  {
    category: 'user_value',
    template: 'What evidence do you have that users actually want this feature?',
    weight: 8
  },
  {
    category: 'user_value',
    template: 'Which user segment would benefit most from this feature, and why?',
    weight: 7
  },

  // Feasibility Questions
  {
    category: 'feasibility',
    template: 'What are the main technical challenges in building this feature?',
    weight: 9
  },
  {
    category: 'feasibility',
    template: 'What existing systems or integrations would this feature require?',
    weight: 8
  },
  {
    category: 'feasibility',
    template: 'How much development time and resources would this feature realistically need?',
    weight: 8
  },
  {
    category: 'feasibility',
    template: 'What compliance or security considerations does this feature introduce?',
    weight: 7
  },

  // Success Measurement Questions
  {
    category: 'success_measurement',
    template: 'How will you measure whether this feature is successful?',
    weight: 10
  },
  {
    category: 'success_measurement',
    template: 'What user behavior changes would indicate this feature is working?',
    weight: 9
  },
  {
    category: 'success_measurement',
    template: 'What business metrics should improve if this feature succeeds?',
    weight: 8
  },
  {
    category: 'success_measurement',
    template: 'How long after launch would you expect to see measurable impact?',
    weight: 7
  }
]

/**
 * Generates contextual questions based on feature input
 */
export function generateContextualQuestions(data: FeatureInputData): string[] {
  const questions: string[] = []
  const description = data.feature_description.toLowerCase()

  // Analyze feature type and generate specific questions
  if (description.includes('mobile') || description.includes('app')) {
    questions.push('How will this feature work across different mobile platforms and screen sizes?')
  }

  if (description.includes('data') || description.includes('analytics')) {
    questions.push('What data privacy and security measures are needed for this feature?')
    questions.push('How will you ensure data accuracy and prevent misuse?')
  }

  if (description.includes('integration') || description.includes('api')) {
    questions.push('Which existing systems need to integrate with this feature?')
    questions.push('What happens if external integrations fail or become unavailable?')
  }

  if (description.includes('ai') || description.includes('machine learning')) {
    questions.push('What training data and computational resources will this AI feature require?')
    questions.push('How will you handle AI errors or unexpected outputs?')
  }

  if (description.includes('notification') || description.includes('alert')) {
    questions.push('How will you prevent notification fatigue and ensure relevance?')
  }

  if (description.includes('payment') || description.includes('transaction')) {
    questions.push('What payment security standards and compliance requirements apply?')
    questions.push('How will you handle failed transactions and refunds?')
  }

  // Add questions based on missing context
  if (!data.target_users) {
    questions.push('Who are the primary users for this feature, and what are their key characteristics?')
  }

  if (!data.current_problems) {
    questions.push('What specific problems or frustrations will this feature eliminate?')
  }

  if (!data.success_definition) {
    questions.push('What specific outcomes will indicate this feature is successful?')
  }

  return questions
}

/**
 * Selects the best questions based on feature input
 */
export function selectBestQuestions(
  data: FeatureInputData,
  targetCount: number = 4
): string[] {
  const baseQuestions: string[] = []
  const contextualQuestions = generateContextualQuestions(data)

  // Always include high-priority questions from each category
  const requiredQuestions = [
    'What specific user pain point does this feature solve, and how acute is that pain?',
    'How will you measure whether this feature is successful?'
  ]

  baseQuestions.push(...requiredQuestions)

  // Add contextual questions
  baseQuestions.push(...contextualQuestions.slice(0, 2))

  // Fill remaining slots with template questions based on what's missing
  const remainingSlots = targetCount - baseQuestions.length

  if (remainingSlots > 0) {
    const additionalQuestions = []

    if (!data.target_users) {
      additionalQuestions.push('Which user segment would benefit most from this feature, and why?')
    }

    if (!baseQuestions.some(q => q.includes('technical'))) {
      additionalQuestions.push('What are the main technical challenges in building this feature?')
    }

    if (!baseQuestions.some(q => q.includes('behavior'))) {
      additionalQuestions.push('What user behavior changes would indicate this feature is working?')
    }

    baseQuestions.push(...additionalQuestions.slice(0, remainingSlots))
  }

  // Ensure we have exactly the target count
  return baseQuestions.slice(0, targetCount)
}

/**
 * Fallback questions if AI generation fails
 */
export function getFallbackQuestions(data: FeatureInputData): string[] {
  return selectBestQuestions(data, 4)
}

/**
 * Validates generated questions for quality
 */
export function validateQuestions(questions: string[]): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (questions.length < 3) {
    issues.push('Too few questions generated')
  }

  if (questions.length > 6) {
    issues.push('Too many questions generated')
  }

  const tooShort = questions.filter(q => q.length < 20)
  if (tooShort.length > 0) {
    issues.push('Some questions are too short to be useful')
  }

  const duplicates = questions.filter((q, i) => questions.indexOf(q) !== i)
  if (duplicates.length > 0) {
    issues.push('Duplicate questions detected')
  }

  const nonQuestions = questions.filter(q => !q.includes('?') && !q.toLowerCase().includes('how') && !q.toLowerCase().includes('what') && !q.toLowerCase().includes('why'))
  if (nonQuestions.length > 0) {
    issues.push('Some entries are not proper questions')
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}