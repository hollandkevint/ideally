/**
 * Template Manager
 * Centralized system for loading, validating, and managing pathway templates
 */

import { PathwayTemplate, PathwayCategory, TemplateValidation, ValidationError, ValidationWarning } from '../types'
import { businessModelCanvasTemplate } from './business-model-canvas'

class TemplateManager {
  private templates: Map<string, PathwayTemplate> = new Map()
  private initialized: boolean = false

  /**
   * Initialize template manager and load all templates
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    // Register templates
    this.registerTemplate(businessModelCanvasTemplate)

    this.initialized = true
  }

  /**
   * Register a template in the manager
   */
  private registerTemplate(template: PathwayTemplate): void {
    const validation = this.validateTemplate(template)

    if (!validation.isValid) {
      throw new Error(`Invalid template "${template.id}": ${validation.errors.map(e => e.message).join(', ')}`)
    }

    if (validation.warnings.length > 0) {
      console.warn(`Template "${template.id}" has warnings:`, validation.warnings)
    }

    this.templates.set(template.id, template)
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): PathwayTemplate | null {
    return this.templates.get(templateId) || null
  }

  /**
   * Get all templates
   */
  getAllTemplates(): PathwayTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: PathwayCategory): PathwayTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    )
  }

  /**
   * Search templates by tags
   */
  searchTemplates(query: string): PathwayTemplate[] {
    const lowerQuery = query.toLowerCase()

    return Array.from(this.templates.values()).filter(template => {
      const nameMatch = template.name.toLowerCase().includes(lowerQuery)
      const descMatch = template.description.toLowerCase().includes(lowerQuery)
      const tagMatch = template.metadata.tags.some(tag =>
        tag.toLowerCase().includes(lowerQuery)
      )

      return nameMatch || descMatch || tagMatch
    })
  }

  /**
   * Get templates by difficulty level
   */
  getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): PathwayTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.difficulty === difficulty
    )
  }

  /**
   * Validate template structure
   */
  validateTemplate(template: PathwayTemplate): TemplateValidation {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Required fields validation
    if (!template.id) {
      errors.push({ field: 'id', message: 'Template ID is required', code: 'MISSING_ID' })
    }

    if (!template.name) {
      errors.push({ field: 'name', message: 'Template name is required', code: 'MISSING_NAME' })
    }

    if (!template.phases || template.phases.length === 0) {
      errors.push({ field: 'phases', message: 'Template must have at least one phase', code: 'NO_PHASES' })
    }

    // Phases validation
    if (template.phases) {
      const phaseIds = new Set<string>()

      template.phases.forEach((phase, index) => {
        // Check for duplicate phase IDs
        if (phaseIds.has(phase.id)) {
          errors.push({
            field: `phases[${index}].id`,
            message: `Duplicate phase ID: ${phase.id}`,
            code: 'DUPLICATE_PHASE_ID'
          })
        }
        phaseIds.add(phase.id)

        // Required phase fields
        if (!phase.systemPrompt || phase.systemPrompt.length < 50) {
          errors.push({
            field: `phases[${index}].systemPrompt`,
            message: 'System prompt is required and should be detailed (50+ characters)',
            code: 'INVALID_SYSTEM_PROMPT'
          })
        }

        if (!phase.userGuidance) {
          warnings.push({
            field: `phases[${index}].userGuidance`,
            message: 'User guidance is recommended for better UX',
            suggestion: 'Add clear instructions for users'
          })
        }

        if (!phase.expectedOutputs || phase.expectedOutputs.length === 0) {
          warnings.push({
            field: `phases[${index}].expectedOutputs`,
            message: 'Expected outputs help with validation',
            suggestion: 'Define what data this phase should collect'
          })
        }

        // Check order sequence
        if (phase.order !== index + 1) {
          warnings.push({
            field: `phases[${index}].order`,
            message: `Phase order (${phase.order}) doesn't match position (${index + 1})`,
            suggestion: 'Ensure phases are in correct order'
          })
        }
      })
    }

    // Duration validation
    if (template.estimatedDuration <= 0) {
      warnings.push({
        field: 'estimatedDuration',
        message: 'Estimated duration should be positive',
        suggestion: 'Set realistic time estimate for users'
      })
    }

    const totalPhaseDuration = template.phases?.reduce((sum, phase) => sum + (phase.estimatedDuration || 0), 0) || 0
    if (Math.abs(totalPhaseDuration - template.estimatedDuration) > 5) {
      warnings.push({
        field: 'estimatedDuration',
        message: `Template duration (${template.estimatedDuration}min) doesn't match sum of phases (${totalPhaseDuration}min)`,
        suggestion: 'Align template and phase duration estimates'
      })
    }

    // Metadata validation
    if (!template.metadata.version) {
      warnings.push({
        field: 'metadata.version',
        message: 'Version number is recommended',
        suggestion: 'Add semantic version (e.g., 1.0.0)'
      })
    }

    if (template.metadata.tags.length === 0) {
      warnings.push({
        field: 'metadata.tags',
        message: 'Tags help with template discovery',
        suggestion: 'Add relevant tags for searchability'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get template statistics
   */
  getStatistics() {
    const templates = this.getAllTemplates()

    return {
      totalTemplates: templates.length,
      byCategory: {
        'business-model': this.getTemplatesByCategory('business-model').length,
        'feature-refinement': this.getTemplatesByCategory('feature-refinement').length,
        'new-idea': this.getTemplatesByCategory('new-idea').length,
        'assumption-testing': this.getTemplatesByCategory('assumption-testing').length
      },
      byDifficulty: {
        beginner: this.getTemplatesByDifficulty('beginner').length,
        intermediate: this.getTemplatesByDifficulty('intermediate').length,
        advanced: this.getTemplatesByDifficulty('advanced').length
      },
      averageDuration: templates.reduce((sum, t) => sum + t.estimatedDuration, 0) / templates.length || 0,
      totalPhases: templates.reduce((sum, t) => sum + t.phases.length, 0)
    }
  }
}

// Singleton instance
export const templateManager = new TemplateManager()

// Auto-initialize on import
templateManager.initialize().catch(console.error)