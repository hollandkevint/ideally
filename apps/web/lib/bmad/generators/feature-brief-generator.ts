/**
 * Feature Brief Generator
 * Story 2.4c: Generates professional feature briefs from feature input and priority scoring
 */

import { claudeClient } from '@/lib/ai/claude-client'
import type {
  FeatureBrief,
  FeatureSessionData,
  BriefQualityValidation,
  PriorityScoring,
  FeatureInputData
} from '../types'

export class FeatureBriefGenerator {
  /**
   * Generate a complete feature brief from session data
   */
  async generate(sessionData: FeatureSessionData): Promise<FeatureBrief> {
    const { featureInput, priorityScoring } = sessionData

    // Generate all brief sections
    const [title, description, userStories, acceptanceCriteria, successMetrics, implementationNotes] = await Promise.all([
      this.generateTitle(featureInput),
      this.generateDescription(featureInput, priorityScoring),
      this.generateUserStories(featureInput, priorityScoring),
      this.generateAcceptanceCriteria(featureInput, priorityScoring),
      this.generateSuccessMetrics(featureInput.feature_description, priorityScoring.impact_score, priorityScoring.priority_category),
      this.generateImplementationNotes(priorityScoring)
    ])

    const brief: FeatureBrief = {
      id: crypto.randomUUID(),
      title,
      description,
      userStories,
      acceptanceCriteria,
      successMetrics,
      implementationNotes,
      priorityContext: {
        score: priorityScoring.calculated_priority,
        category: priorityScoring.priority_category,
        quadrant: priorityScoring.quadrant
      },
      generatedAt: new Date(),
      lastEditedAt: new Date(),
      version: 1
    }

    return brief
  }

  /**
   * Regenerate a feature brief
   */
  async regenerate(briefId: string, sessionData: FeatureSessionData): Promise<FeatureBrief> {
    const newBrief = await this.generate(sessionData)
    return {
      ...newBrief,
      id: briefId,
      version: (sessionData.featureBrief?.version || 0) + 1
    }
  }

  /**
   * Update specific fields of a feature brief
   */
  async update(briefId: string, updates: Partial<FeatureBrief>): Promise<FeatureBrief> {
    return {
      ...updates,
      id: briefId,
      lastEditedAt: new Date(),
      version: (updates.version || 1) + 1
    } as FeatureBrief
  }

  /**
   * Generate feature title
   */
  private async generateTitle(featureInput: FeatureInputData): Promise<string> {
    const prompt = `Generate a concise, action-oriented feature title (3-8 words) for this feature:

Feature: ${featureInput.feature_description}

Requirements:
- Start with a verb (e.g., "Add", "Enable", "Improve", "Create")
- Focus on user benefit
- Professional tone
- No jargon

Output only the title, nothing else.`

    try {
      const response = await claudeClient.sendMessage(prompt, [])
      let title = ''

      for await (const chunk of response.content) {
        title += chunk
      }

      return title.trim()
    } catch (error) {
      // Fallback title
      const words = featureInput.feature_description.split(' ').slice(0, 6)
      return 'Add ' + words.join(' ')
    }
  }

  /**
   * Generate executive description
   */
  private async generateDescription(
    featureInput: FeatureInputData,
    priorityScoring: PriorityScoring
  ): Promise<string> {
    const prompt = `Write a 2-3 sentence executive summary for this feature:

Feature: ${featureInput.feature_description}
Target Users: ${featureInput.target_users || 'Not specified'}
Priority: ${priorityScoring.priority_category} (Score: ${priorityScoring.calculated_priority.toFixed(2)})
Impact: ${priorityScoring.impact_score}/10
Effort: ${priorityScoring.effort_score}/10

Requirements:
- First sentence: What and why
- Second sentence: Key benefit
- Third sentence (optional): Business value
- Focus on outcomes, not implementation
- Professional PM language

Output only the description.`

    try {
      const response = await claudeClient.sendMessage(prompt, [])
      let description = ''

      for await (const chunk of response.content) {
        description += chunk
      }

      return description.trim()
    } catch (error) {
      return `${featureInput.feature_description}. This ${priorityScoring.priority_category.toLowerCase()} priority feature will provide significant value to users.`
    }
  }

  /**
   * Generate user stories
   */
  private async generateUserStories(
    featureInput: FeatureInputData,
    priorityScoring: PriorityScoring
  ): Promise<string[]> {
    const prompt = `Generate 3-5 user stories in standard format for this feature:

Feature: ${featureInput.feature_description}
Target Users: ${featureInput.target_users || 'End users'}
Priority: ${priorityScoring.priority_category}

Format each story as:
"As a [user type], I want [capability] so that [benefit]"

Requirements:
- Cover main user workflows
- Focus on user value
- Specific and testable
- Order by importance

Output ONLY a JSON array of strings. No other text.`

    try {
      const response = await claudeClient.sendMessage(prompt, [])
      let content = ''

      for await (const chunk of response.content) {
        content += chunk
      }

      // Try to parse JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const stories = JSON.parse(jsonMatch[0])
        return stories.slice(0, 5)
      }

      // Fallback parsing
      const lines = content.split('\n').filter(line => line.includes('As a'))
      return lines.slice(0, 5)
    } catch (error) {
      // Fallback user stories
      return [
        `As a ${featureInput.target_users || 'user'}, I want ${featureInput.feature_description.toLowerCase()} so that I can improve my experience`,
        `As a ${featureInput.target_users || 'user'}, I want this feature to be intuitive so that I can use it without training`,
        `As a ${featureInput.target_users || 'user'}, I want the feature to be reliable so that I can depend on it`
      ]
    }
  }

  /**
   * Generate acceptance criteria
   */
  private async generateAcceptanceCriteria(
    featureInput: FeatureInputData,
    priorityScoring: PriorityScoring
  ): Promise<string[]> {
    const prompt = `Generate 5-7 acceptance criteria for this feature:

Feature: ${featureInput.feature_description}
Priority: ${priorityScoring.priority_category}

Requirements:
- Specific and measurable
- Testable by QA/dev
- Cover happy path and edge cases
- Clear pass/fail conditions
- Use "Given/When/Then" format where helpful

Output ONLY a JSON array of strings. No other text.`

    try {
      const response = await claudeClient.sendMessage(prompt, [])
      let content = ''

      for await (const chunk of response.content) {
        content += chunk
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const criteria = JSON.parse(jsonMatch[0])
        return criteria.slice(0, 7)
      }

      const lines = content.split('\n').filter(line => line.trim().length > 20)
      return lines.slice(0, 7)
    } catch (error) {
      return [
        'Given a user accesses the feature, when they interact with it, then it responds within 2 seconds',
        'The feature must be accessible via keyboard navigation',
        'Error messages must be clear and actionable',
        'The feature must work on mobile devices',
        'Data must be validated before processing'
      ]
    }
  }

  /**
   * Generate success metrics
   */
  private async generateSuccessMetrics(
    featureDescription: string,
    impactScore: number,
    priorityCategory: string
  ): Promise<string[]> {
    const prompt = `Define 3-5 measurable success metrics for this feature:

Feature: ${featureDescription}
Impact Score: ${impactScore}/10
Priority: ${priorityCategory}

Requirements:
- Quantifiable with specific targets
- Include timeframes (e.g., "within 30 days")
- Mix of leading and lagging indicators
- Realistic and achievable
- Business-focused

Examples:
- "Increase user engagement by 15% within 60 days"
- "Reduce support tickets by 20% in first quarter"
- "Achieve 80% feature adoption within 30 days"

Output ONLY a JSON array of strings. No other text.`

    try {
      const response = await claudeClient.sendMessage(prompt, [])
      let content = ''

      for await (const chunk of response.content) {
        content += chunk
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const metrics = JSON.parse(jsonMatch[0])
        return metrics.slice(0, 5)
      }

      const lines = content.split('\n').filter(line => line.match(/\d+%|\d+ days/))
      return lines.slice(0, 5)
    } catch (error) {
      return [
        'Achieve 70% user adoption within 30 days of launch',
        'Maintain 95% feature uptime',
        'Receive positive feedback from 80% of users in first month'
      ]
    }
  }

  /**
   * Generate implementation notes
   */
  private async generateImplementationNotes(priorityScoring: PriorityScoring): Promise<string[]> {
    const prompt = `Create implementation notes highlighting priority and effort considerations:

Priority: ${priorityScoring.priority_category} (${priorityScoring.calculated_priority.toFixed(2)})
Quadrant: ${priorityScoring.quadrant}
Effort Score: ${priorityScoring.effort_score}/10
Impact Score: ${priorityScoring.impact_score}/10

Provide:
- Recommended implementation approach
- Risk factors to consider
- Resource requirements
- Timeline suggestions
- Dependencies to address

Output ONLY a JSON array of strings (3-5 notes). No other text.`

    try {
      const response = await claudeClient.sendMessage(prompt, [])
      let content = ''

      for await (const chunk of response.content) {
        content += chunk
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const notes = JSON.parse(jsonMatch[0])
        return notes.slice(0, 5)
      }

      const lines = content.split('\n').filter(line => line.trim().length > 30)
      return lines.slice(0, 5)
    } catch (error) {
      const effortLevel = priorityScoring.effort_score > 7 ? 'high' : priorityScoring.effort_score > 4 ? 'moderate' : 'low'
      return [
        `This is a ${priorityScoring.quadrant} feature requiring ${effortLevel} effort`,
        `Priority: ${priorityScoring.priority_category} - allocate appropriate resources`,
        'Conduct thorough testing before release',
        'Monitor user feedback closely after launch'
      ]
    }
  }

  /**
   * Validate brief quality
   */
  validateBrief(brief: FeatureBrief): BriefQualityValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // Title validation
    const titleWords = brief.title.split(' ').length
    if (titleWords < 3 || titleWords > 8) {
      warnings.push(`Title should be 3-8 words (currently ${titleWords})`)
    }

    // Description validation
    if (brief.description.length < 50) {
      errors.push('Description too short (minimum 50 characters)')
    }
    if (brief.description.length > 400) {
      warnings.push('Description may be too long (recommended max 400 characters)')
    }

    // User stories validation
    if (brief.userStories.length < 3) {
      errors.push('Minimum 3 user stories required')
    }
    brief.userStories.forEach((story, i) => {
      if (!this.validateUserStoryFormat(story)) {
        warnings.push(`User story ${i + 1} doesn't follow standard format`)
      }
    })

    // Acceptance criteria validation
    if (brief.acceptanceCriteria.length < 5) {
      warnings.push('Recommended minimum 5 acceptance criteria')
    }

    // Success metrics validation
    if (brief.successMetrics.length < 3) {
      errors.push('Minimum 3 success metrics required')
    }
    brief.successMetrics.forEach((metric, i) => {
      if (!this.validateMetricMeasurability(metric)) {
        warnings.push(`Success metric ${i + 1} may not be measurable`)
      }
    })

    const qualityScore = this.calculateQualityScore(brief, errors.length, warnings.length)

    return {
      isValid: errors.length === 0,
      qualityScore,
      errors,
      warnings
    }
  }

  /**
   * Validate user story format
   */
  validateUserStoryFormat(story: string): boolean {
    const format = /As a .+, I want .+ so that .+/i
    return format.test(story)
  }

  /**
   * Validate metric measurability
   */
  validateMetricMeasurability(metric: string): boolean {
    // Check for numbers and timeframes
    const hasNumber = /\d+/.test(metric)
    const hasTimeframe = /(days?|weeks?|months?|quarters?|years?|within|by)/i.test(metric)
    return hasNumber || hasTimeframe
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(brief: FeatureBrief, errorCount: number, warningCount: number): number {
    let score = 100

    // Deduct for errors and warnings
    score -= errorCount * 20
    score -= warningCount * 5

    // Bonus for completeness
    if (brief.userStories.length >= 4) score += 5
    if (brief.acceptanceCriteria.length >= 6) score += 5
    if (brief.successMetrics.length >= 4) score += 5

    return Math.max(0, Math.min(100, score))
  }
}