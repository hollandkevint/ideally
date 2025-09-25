import { PriorityScoring } from '@/lib/bmad/types'

export function calculatePriority(impact: number, effort: number): PriorityScoring {
  if (impact < 1 || impact > 10 || effort < 1 || effort > 10) {
    throw new Error('Impact and effort scores must be between 1 and 10')
  }

  const priority = Number((impact / effort).toFixed(2))

  const category = priority >= 2.0 ? 'Critical' :
                  priority >= 1.5 ? 'High' :
                  priority >= 1.0 ? 'Medium' : 'Low'

  const quadrant = impact >= 7 && effort <= 4 ? 'Quick Wins' :
                  impact >= 7 && effort >= 5 ? 'Major Projects' :
                  impact <= 6 && effort <= 4 ? 'Fill-ins' : 'Time Wasters'

  return {
    effort_score: effort,
    impact_score: impact,
    calculated_priority: priority,
    priority_category: category as 'Critical' | 'High' | 'Medium' | 'Low',
    quadrant: quadrant as 'Quick Wins' | 'Major Projects' | 'Fill-ins' | 'Time Wasters',
    scoring_timestamp: new Date()
  }
}

export function validatePriorityScoring(scoring: Partial<PriorityScoring>): string[] {
  const errors: string[] = []

  if (!scoring.effort_score || scoring.effort_score < 1 || scoring.effort_score > 10) {
    errors.push('Effort score must be between 1 and 10')
  }

  if (!scoring.impact_score || scoring.impact_score < 1 || scoring.impact_score > 10) {
    errors.push('Impact score must be between 1 and 10')
  }

  return errors
}

export function getPriorityRecommendations(quadrant: string): string[] {
  switch (quadrant) {
    case 'Quick Wins':
      return [
        'Prioritize for immediate implementation',
        'Consider as a quick prototype or MVP feature',
        'Use to demonstrate value to stakeholders',
        'Implement during sprint gaps or downtime'
      ]
    case 'Major Projects':
      return [
        'Plan carefully with proper resource allocation',
        'Break down into smaller deliverable phases',
        'Secure stakeholder buy-in before starting',
        'Schedule for upcoming quarters with dedicated team'
      ]
    case 'Fill-ins':
      return [
        'Good for junior developers or learning opportunities',
        'Implement when team has available capacity',
        'Consider bundling with other small improvements',
        'Use as buffer work between major features'
      ]
    case 'Time Wasters':
      return [
        'Question whether this feature is truly necessary',
        'Look for alternative approaches with lower effort',
        'Consider deprioritizing or removing from backlog',
        'Reassess impact assumptions before proceeding'
      ]
    default:
      return ['Unable to provide recommendations for unknown quadrant']
  }
}

export interface PriorityAnalysis {
  scoring: PriorityScoring
  recommendations: string[]
  riskFactors: string[]
  nextSteps: string[]
}

export function analyzePriority(impact: number, effort: number): PriorityAnalysis {
  const scoring = calculatePriority(impact, effort)
  const recommendations = getPriorityRecommendations(scoring.quadrant)

  const riskFactors: string[] = []
  if (scoring.quadrant === 'Time Wasters') {
    riskFactors.push('High effort with low impact may not justify investment')
    riskFactors.push('Consider opportunity cost of other features')
  }
  if (scoring.quadrant === 'Major Projects') {
    riskFactors.push('Requires significant resource commitment')
    riskFactors.push('May have longer time to value realization')
  }

  const nextSteps: string[] = []
  if (scoring.priority_category === 'Critical' || scoring.quadrant === 'Quick Wins') {
    nextSteps.push('Move to development backlog immediately')
    nextSteps.push('Identify required resources and timeline')
  } else if (scoring.priority_category === 'High') {
    nextSteps.push('Include in next quarter planning')
    nextSteps.push('Validate assumptions with users')
  } else {
    nextSteps.push('Monitor for changing conditions that might affect priority')
    nextSteps.push('Consider alternatives or enhancements to increase impact')
  }

  return {
    scoring,
    recommendations,
    riskFactors,
    nextSteps
  }
}