import yaml from 'js-yaml';
import { 
  BmadTemplate, 
  TemplateValidationError, 
  BmadMethodError,
  ValidationRule,
  BmadPhase 
} from './types';

/**
 * BMad Method YAML Template Engine
 * Parses, validates, and manages BMad Method templates
 */
export class BmadTemplateEngine {
  private templateCache = new Map<string, BmadTemplate>();
  private validator = new TemplateValidator();

  /**
   * Load and parse a BMad Method template from YAML
   */
  async loadTemplate(templateId: string): Promise<BmadTemplate> {
    try {
      // Check cache first
      if (this.templateCache.has(templateId)) {
        return this.templateCache.get(templateId)!;
      }

      // Load YAML content
      const templateYaml = await this.fetchTemplateYaml(templateId);
      const parsedTemplate = await this.parseTemplateYaml(templateYaml);
      
      // Validate template structure and content
      const validatedTemplate = await this.validator.validate(parsedTemplate);
      
      // Cache the validated template
      this.templateCache.set(templateId, validatedTemplate);
      
      return validatedTemplate;
    } catch (error) {
      throw new BmadMethodError(
        `Failed to load template ${templateId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TEMPLATE_LOAD_ERROR',
        { templateId, originalError: error }
      );
    }
  }

  /**
   * Parse YAML content into BMad Method template structure
   */
  private async parseTemplateYaml(yamlContent: string): Promise<BmadTemplate> {
    try {
      const parsed = yaml.load(yamlContent) as Record<string, unknown>;
      
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid YAML structure');
      }

      return this.transformYamlToTemplate(parsed);
    } catch (error) {
      throw new BmadMethodError(
        `YAML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'YAML_PARSE_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Transform parsed YAML object into BmadTemplate structure
   */
  private transformYamlToTemplate(yamlData: Record<string, unknown>): BmadTemplate {
    // Validate required top-level fields
    if (!yamlData.metadata || !yamlData.phases) {
      throw new Error('Template missing required metadata or phases');
    }

    const template: BmadTemplate = {
      id: yamlData.id as string || ((yamlData.metadata as any)?.name as string)?.toLowerCase().replace(/\s+/g, '-') || 'unknown-template',
      name: (yamlData.metadata as any)?.name as string || 'Unknown Template',
      version: (yamlData.metadata as any)?.version as string || '1.0.0',
      metadata: {
        name: (yamlData.metadata as any)?.name as string || 'Unknown Template',
        version: (yamlData.metadata as any)?.version as string || '1.0.0',
        description: (yamlData.metadata as any)?.description as string || '',
        author: (yamlData.metadata as any)?.author as string || 'BMad Method',
        timeEstimate: (yamlData.metadata as any)?.timeEstimate as number || 30,
        category: (yamlData.metadata as any)?.category as string || 'analysis',
        difficulty: (yamlData.metadata as any)?.difficulty as 'beginner' | 'intermediate' | 'advanced' || 'intermediate',
        tags: (yamlData.metadata as any)?.tags as string[] || []
      },
      phases: this.transformPhases(yamlData.phases),
      outputs: this.transformOutputs(yamlData.outputs || []),
      dependencies: yamlData.dependencies as string[] || []
    };

    return template;
  }

  /**
   * Transform YAML phases into BmadPhase objects
   */
  private transformPhases(phasesData: unknown): BmadPhase[] {
    let normalizedPhases: Record<string, unknown>[];
    
    if (!Array.isArray(phasesData)) {
      // Handle object format where phases are keyed
      const phasesObj = phasesData as Record<string, Record<string, unknown>>;
      normalizedPhases = Object.entries(phasesObj).map(([id, phaseData]) => ({
        id,
        ...phaseData
      }));
    } else {
      normalizedPhases = phasesData as Record<string, unknown>[];
    }

    return normalizedPhases.map((phaseData) => ({
      id: phaseData.id,
      name: phaseData.name,
      description: phaseData.description || '',
      timeAllocation: phaseData.timeAllocation || 5,
      prompts: Array.isArray(phaseData.prompts) ? phaseData.prompts : [phaseData.prompts || ''],
      elicitationOptions: phaseData.elicitationOptions || {},
      validationRules: this.transformValidationRules(phaseData.validationRules || []),
      outputs: phaseData.outputs || [],
      nextPhaseLogic: phaseData.nextPhaseLogic || []
    }));
  }

  /**
   * Transform outputs configuration
   */
  private transformOutputs(outputsData: Record<string, unknown>[]): Record<string, unknown>[] {
    return outputsData.map(output => ({
      id: output.id,
      name: output.name,
      type: output.type || 'document',
      template: output.template || '',
      includePhases: output.includePhases || []
    }));
  }

  /**
   * Transform validation rules
   */
  private transformValidationRules(rulesData: Record<string, unknown>[]): ValidationRule[] {
    return rulesData.map(rule => ({
      type: rule.type,
      value: rule.value,
      errorMessage: rule.errorMessage || `Validation failed for ${rule.type}`
    }));
  }

  /**
   * Fetch template YAML content (placeholder for actual implementation)
   */
  private async fetchTemplateYaml(templateId: string): Promise<string> {
    // In production, this would fetch from database or file system
    // For now, return sample template based on templateId
    return this.getSampleTemplate(templateId);
  }

  /**
   * Get sample template for development/testing
   */
  private getSampleTemplate(templateId: string): string {
    const sampleTemplates: { [key: string]: string } = {
      'brainstorm-session': `
id: brainstorm-session
metadata:
  name: "BMad Method Brainstorming Session"
  version: "1.0.0" 
  description: "Structured brainstorming using BMad Method techniques"
  author: "BMad Method"
  timeEstimate: 15
  category: "brainstorming"
  difficulty: "beginner"
  tags: ["ideation", "creativity", "divergent thinking"]

phases:
  - id: "problem_definition"
    name: "Problem Definition"
    description: "Clearly define the challenge or opportunity"
    timeAllocation: 3
    prompts:
      - "What specific problem are you trying to solve?"
      - "Who experiences this problem most acutely?"
      - "What would success look like?"
    elicitationOptions:
      1: "Customer pain point analysis"
      2: "Market opportunity exploration" 
      3: "Internal process improvement"
      4: "Competitive response strategy"
    validationRules:
      - type: "required"
        value: true
        errorMessage: "Problem definition is required"
    outputs:
      - id: "problem_statement"
        name: "Problem Statement"
        type: "text"
        required: true

  - id: "idea_generation"
    name: "Idea Generation"
    description: "Generate diverse solution approaches"
    timeAllocation: 8
    prompts:
      - "Let's explore different approaches to solving this problem"
      - "What if we approached this completely differently?"
      - "What resources or capabilities could we leverage?"
    elicitationOptions:
      1: "SCAMPER technique (Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse)"
      2: "What-if scenarios and assumption reversals"
      3: "Analogical thinking - how do other industries solve similar problems?"
      4: "Resource-based ideation - what unique assets can we leverage?"
      5: "Constraint removal - what if budget/time weren't factors?"
    outputs:
      - id: "generated_ideas"
        name: "Generated Ideas"
        type: "list"
        required: true

  - id: "idea_evaluation"  
    name: "Idea Evaluation"
    description: "Assess and prioritize generated ideas"
    timeAllocation: 4
    prompts:
      - "Let's evaluate these ideas against your success criteria"
      - "Which ideas have the highest impact potential?"
      - "What are the resource requirements for each?"
    elicitationOptions:
      1: "Impact vs Effort matrix evaluation"
      2: "Feasibility and desirability assessment"
      3: "Risk vs reward analysis"
      4: "Strategic fit evaluation"
    outputs:
      - id: "prioritized_ideas"
        name: "Prioritized Ideas"
        type: "matrix"
        required: true
      - id: "next_steps"
        name: "Next Steps"
        type: "list"
        required: true

outputs:
  - id: "brainstorm_summary"
    name: "Brainstorming Session Summary"
    type: "document"
    template: "brainstorm-summary.md"
    includePhases: ["problem_definition", "idea_generation", "idea_evaluation"]
      `,

      'project-brief': `
id: project-brief
metadata:
  name: "BMad Method Project Brief"
  version: "1.0.0"
  description: "Comprehensive project brief using BMad Method framework"
  author: "BMad Method"
  timeEstimate: 20
  category: "planning"
  difficulty: "intermediate"
  tags: ["project planning", "strategic brief", "scope definition"]

phases:
  - id: "project_context"
    name: "Project Context"
    description: "Establish the strategic context and rationale"
    timeAllocation: 5
    prompts:
      - "What business opportunity or challenge does this project address?"
      - "How does this align with broader strategic objectives?"
      - "What's the urgency and business impact?"
    elicitationOptions:
      1: "Strategic opportunity analysis"
      2: "Competitive response project"
      3: "Operational efficiency improvement"
      4: "Market expansion initiative"
      5: "Innovation and growth project"
    outputs:
      - id: "business_rationale"
        name: "Business Rationale"
        type: "text"
        required: true

  - id: "scope_definition"
    name: "Scope Definition" 
    description: "Define clear project boundaries and deliverables"
    timeAllocation: 8
    prompts:
      - "What exactly will be delivered by this project?"
      - "What's explicitly out of scope?"
      - "What are the key success criteria?"
    elicitationOptions:
      1: "Feature-based scope definition"
      2: "Outcome-based scope definition"
      3: "Time-boxed scope definition"
      4: "Resource-constrained scope definition"
    outputs:
      - id: "deliverables"
        name: "Key Deliverables"
        type: "list"
        required: true
      - id: "success_criteria"
        name: "Success Criteria"
        type: "list"
        required: true

  - id: "resource_planning"
    name: "Resource Planning"
    description: "Identify required resources and timeline"
    timeAllocation: 7
    prompts:
      - "What resources will be needed to execute this project?"
      - "What's a realistic timeline for delivery?"
      - "What are the key dependencies and risks?"
    elicitationOptions:
      1: "Team-based resource planning"
      2: "Budget-based resource planning"
      3: "Timeline-driven resource planning"
      4: "Skill-based resource assessment"
    outputs:
      - id: "resource_requirements"
        name: "Resource Requirements"  
        type: "list"
        required: true
      - id: "timeline"
        name: "Project Timeline"
        type: "text"
        required: true
      - id: "risk_factors"
        name: "Key Risk Factors"
        type: "list"
        required: true

outputs:
  - id: "project_brief_document"
    name: "Complete Project Brief"
    type: "document" 
    template: "project-brief.md"
    includePhases: ["project_context", "scope_definition", "resource_planning"]
      `
    };

    return sampleTemplates[templateId] || sampleTemplates['brainstorm-session'];
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get cached template without loading
   */
  getCachedTemplate(templateId: string): BmadTemplate | null {
    return this.templateCache.get(templateId) || null;
  }

  /**
   * List all cached templates
   */
  getCachedTemplates(): string[] {
    return Array.from(this.templateCache.keys());
  }
}

/**
 * Template validation class
 */
class TemplateValidator {
  async validate(template: BmadTemplate): Promise<BmadTemplate> {
    const errors: string[] = [];

    // Validate metadata
    if (!template.metadata.name) {
      errors.push('Template name is required');
    }

    if (!template.metadata.timeEstimate || template.metadata.timeEstimate <= 0) {
      errors.push('Valid time estimate is required');
    }

    // Validate phases
    if (!template.phases || template.phases.length === 0) {
      errors.push('Template must have at least one phase');
    }

    template.phases.forEach((phase, index) => {
      if (!phase.id) {
        errors.push(`Phase ${index} missing required id`);
      }
      
      if (!phase.name) {
        errors.push(`Phase ${phase.id || index} missing required name`);
      }

      if (!phase.prompts || phase.prompts.length === 0) {
        errors.push(`Phase ${phase.id || index} must have at least one prompt`);
      }
    });

    // Validate outputs
    if (template.outputs) {
      template.outputs.forEach((output, index) => {
        if (!output.id) {
          errors.push(`Output ${index} missing required id`);
        }
        
        if (!output.name) {
          errors.push(`Output ${output.id || index} missing required name`);
        }
      });
    }

    if (errors.length > 0) {
      throw new TemplateValidationError(
        `Template validation failed: ${errors.join(', ')}`,
        template.id,
        { errors }
      );
    }

    return template;
  }
}

// Export singleton instance
export const bmadTemplateEngine = new BmadTemplateEngine();