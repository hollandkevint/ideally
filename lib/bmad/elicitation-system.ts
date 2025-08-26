import { 
  NumberedOption, 
  ElicitationResult, 
  BmadPhase, 
  BmadSession,
  BmadMethodError,
  SessionContext 
} from './types';

/**
 * Elicitation technique definition
 */
export interface ElicitationTechnique {
  id: string;
  name: string;
  description: string;
  category: 'analytical' | 'creative' | 'evaluative' | 'explorative';
  applicablePhases: string[];
  defaultOptions: NumberedOption[];
  customPrompts: string[];
}

/**
 * Generated elicitation response
 */
export interface ElicitationResponse {
  technique: ElicitationTechnique;
  options: NumberedOption[];
  customOption: CustomOptionPrompt;
  contextualPrompts: string[];
  selectedReasoning: string;
}

/**
 * Custom option prompt configuration
 */
export interface CustomOptionPrompt {
  text: string;
  placeholder: string;
  followUpQuestions: string[];
}

/**
 * User pattern analysis for personalization
 */
export interface UserPatterns {
  userId: string;
  preferredTechniques: string[];
  responsePatterns: {
    analytical: number;
    creative: number; 
    evaluative: number;
    explorative: number;
  };
  selectionHistory: {
    numbered: number;
    custom: number;
  };
  engagementMetrics: {
    averageResponseTime: number;
    completionRate: number;
    satisfactionScore: number;
  };
}

/**
 * BMad Method Interactive Elicitation System
 * Implements advanced elicitation patterns with numbered options as specified in advanced-elicitation.md
 */
export class ElicitationSystem {
  private techniques: Map<string, ElicitationTechnique>;
  private userPatterns: Map<string, UserPatterns>;
  private optionGenerator: ElicitationOptionGenerator;

  constructor() {
    this.techniques = new Map();
    this.userPatterns = new Map();
    this.optionGenerator = new ElicitationOptionGenerator();
    this.initializeBmadTechniques();
  }

  /**
   * Initialize core BMad Method elicitation techniques
   */
  private initializeBmadTechniques(): void {
    // Analytical Elicitation Technique
    this.techniques.set('bmad-analytical', {
      id: 'bmad-analytical',
      name: 'BMad Analytical Framework',
      description: 'Systematic analysis using structured BMad Method frameworks',
      category: 'analytical',
      applicablePhases: ['problem_definition', 'market_analysis', 'competitive_analysis'],
      defaultOptions: [
        { number: 1, text: 'Competitive landscape analysis', category: 'market', estimatedTime: 8 },
        { number: 2, text: 'Customer segment validation', category: 'users', estimatedTime: 6 },
        { number: 3, text: 'Value proposition refinement', category: 'strategy', estimatedTime: 5 },
        { number: 4, text: 'Market opportunity assessment', category: 'market', estimatedTime: 7 },
        { number: 5, text: 'Resource requirement analysis', category: 'planning', estimatedTime: 4 }
      ],
      customPrompts: [
        'What specific analytical framework would be most valuable for your situation?',
        'Which data points would provide the most strategic insight?',
        'What aspect of your challenge needs the deepest analysis?'
      ]
    });

    // Creative Elicitation Technique
    this.techniques.set('bmad-creative', {
      id: 'bmad-creative',
      name: 'BMad Creative Exploration',
      description: 'Divergent thinking and creative breakthrough techniques',
      category: 'creative',
      applicablePhases: ['idea_generation', 'solution_brainstorming', 'innovation'],
      defaultOptions: [
        { number: 1, text: 'SCAMPER technique (Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse)', category: 'creative', estimatedTime: 10 },
        { number: 2, text: 'What-if scenarios and assumption reversals', category: 'creative', estimatedTime: 8 },
        { number: 3, text: 'Analogical thinking - how do other industries solve this?', category: 'creative', estimatedTime: 7 },
        { number: 4, text: 'Resource-based ideation - unique assets you can leverage', category: 'creative', estimatedTime: 6 },
        { number: 5, text: 'Constraint removal - what if budget/time weren\'t factors?', category: 'creative', estimatedTime: 9 },
        { number: 6, text: 'Stakeholder perspective shifts - see through different eyes', category: 'creative', estimatedTime: 8 }
      ],
      customPrompts: [
        'What creative angle haven\'t we explored yet?',
        'Which assumption would you most like to challenge?',
        'What would a completely different industry approach look like?'
      ]
    });

    // Evaluative Elicitation Technique  
    this.techniques.set('bmad-evaluative', {
      id: 'bmad-evaluative',
      name: 'BMad Strategic Evaluation',
      description: 'Systematic evaluation and decision-making frameworks',
      category: 'evaluative',
      applicablePhases: ['idea_evaluation', 'option_assessment', 'decision_making'],
      defaultOptions: [
        { number: 1, text: 'Impact vs Effort matrix evaluation', category: 'evaluation', estimatedTime: 6 },
        { number: 2, text: 'Feasibility and desirability assessment', category: 'evaluation', estimatedTime: 7 },
        { number: 3, text: 'Risk vs reward analysis framework', category: 'evaluation', estimatedTime: 8 },
        { number: 4, text: 'Strategic fit and alignment evaluation', category: 'evaluation', estimatedTime: 5 },
        { number: 5, text: 'Resource optimization and trade-off analysis', category: 'evaluation', estimatedTime: 9 }
      ],
      customPrompts: [
        'What evaluation criteria matter most for your decision?',
        'Which trade-offs are you most concerned about?',
        'What success metrics should guide this evaluation?'
      ]
    });

    // Explorative Elicitation Technique
    this.techniques.set('bmad-explorative', {
      id: 'bmad-explorative',
      name: 'BMad Strategic Discovery',
      description: 'Deep exploration and insight discovery techniques',
      category: 'explorative',
      applicablePhases: ['context_building', 'opportunity_discovery', 'market_exploration'],
      defaultOptions: [
        { number: 1, text: 'Five Whys root cause exploration', category: 'discovery', estimatedTime: 5 },
        { number: 2, text: 'Stakeholder ecosystem mapping', category: 'discovery', estimatedTime: 8 },
        { number: 3, text: 'Assumption identification and testing', category: 'discovery', estimatedTime: 7 },
        { number: 4, text: 'Context and constraint exploration', category: 'discovery', estimatedTime: 6 },
        { number: 5, text: 'Opportunity landscape scanning', category: 'discovery', estimatedTime: 9 },
        { number: 6, text: 'Success criteria and vision clarification', category: 'discovery', estimatedTime: 4 }
      ],
      customPrompts: [
        'What aspect of your challenge do you want to explore more deeply?',
        'Which stakeholders or factors haven\'t we considered yet?',
        'What assumptions are you making that we should examine?'
      ]
    });
  }

  /**
   * Generate elicitation options for a specific session context and phase
   */
  async generateElicitationOptions(
    session: BmadSession,
    currentPhase: BmadPhase
  ): Promise<ElicitationResponse> {
    try {
      // Analyze user patterns for personalization
      const userPatterns = await this.getUserPatterns(session.userId);
      
      // Select optimal technique based on phase and user patterns
      const technique = await this.selectOptimalTechnique(currentPhase, userPatterns, session.context);
      
      // Generate contextual options
      const contextualOptions = await this.optionGenerator.generateContextualOptions(
        technique,
        currentPhase,
        session.context
      );
      
      // Create custom option prompt
      const customOption = this.generateCustomOptionPrompt(technique, currentPhase);
      
      // Generate contextual prompts for Mary
      const contextualPrompts = this.generateContextualPrompts(technique, currentPhase, session);

      return {
        technique,
        options: contextualOptions,
        customOption,
        contextualPrompts,
        selectedReasoning: this.generateSelectionReasoning(technique, currentPhase, userPatterns)
      };

    } catch (error) {
      throw new BmadMethodError(
        `Failed to generate elicitation options: ${error.message}`,
        'ELICITATION_GENERATION_ERROR',
        { sessionId: session.id, phaseId: currentPhase.id, originalError: error }
      );
    }
  }

  /**
   * Process user selection (numbered option or custom response)
   */
  async processUserSelection(
    selection: number | string,
    elicitationResponse: ElicitationResponse,
    session: BmadSession
  ): Promise<ElicitationResult> {
    try {
      let result: ElicitationResult;

      if (typeof selection === 'number') {
        result = await this.processNumberedSelection(selection, elicitationResponse, session);
      } else {
        result = await this.processCustomResponse(selection, elicitationResponse, session);
      }

      // Update user patterns based on selection
      await this.updateUserPatterns(session.userId, selection, elicitationResponse, result);

      return result;

    } catch (error) {
      throw new BmadMethodError(
        `Failed to process user selection: ${error.message}`,
        'SELECTION_PROCESSING_ERROR',
        { sessionId: session.id, selection, originalError: error }
      );
    }
  }

  /**
   * Process numbered option selection
   */
  private async processNumberedSelection(
    selection: number,
    elicitationResponse: ElicitationResponse,
    session: BmadSession
  ): Promise<ElicitationResult> {
    const selectedOption = elicitationResponse.options.find(opt => opt.number === selection);
    
    if (!selectedOption) {
      throw new BmadMethodError(
        `Invalid option selection: ${selection}`,
        'INVALID_OPTION_SELECTION',
        { selection, availableOptions: elicitationResponse.options.map(o => o.number) }
      );
    }

    return {
      selectedPath: selectedOption.text,
      generatedContext: {
        technique: elicitationResponse.technique.id,
        selectedOption: selectedOption,
        category: selectedOption.category,
        estimatedTime: selectedOption.estimatedTime
      },
      nextPhaseHint: this.generateNextPhaseHint(selectedOption, elicitationResponse.technique)
    };
  }

  /**
   * Process custom text response
   */
  private async processCustomResponse(
    response: string,
    elicitationResponse: ElicitationResponse,
    session: BmadSession
  ): Promise<ElicitationResult> {
    // Analyze custom response to extract intent and category
    const analysis = await this.analyzeCustomResponse(response, elicitationResponse.technique);

    return {
      selectedPath: response,
      generatedContext: {
        technique: elicitationResponse.technique.id,
        customResponse: response,
        analyzedIntent: analysis.intent,
        category: analysis.category,
        estimatedTime: analysis.estimatedTime
      },
      nextPhaseHint: this.generateCustomResponseHint(analysis, elicitationResponse.technique)
    };
  }

  /**
   * Select optimal elicitation technique based on phase and user patterns
   */
  private async selectOptimalTechnique(
    phase: BmadPhase,
    userPatterns: UserPatterns,
    sessionContext: SessionContext
  ): Promise<ElicitationTechnique> {
    // Get techniques applicable to this phase
    const applicableTechniques = Array.from(this.techniques.values())
      .filter(technique => technique.applicablePhases.includes(phase.id));

    if (applicableTechniques.length === 0) {
      // Fallback to analytical technique
      return this.techniques.get('bmad-analytical')!;
    }

    // Score techniques based on user patterns and session context
    const scores = applicableTechniques.map(technique => ({
      technique,
      score: this.scoreTechniqueForUser(technique, userPatterns, sessionContext)
    }));

    // Sort by score and return best match
    scores.sort((a, b) => b.score - a.score);
    return scores[0].technique;
  }

  /**
   * Score technique suitability for user
   */
  private scoreTechniqueForUser(
    technique: ElicitationTechnique,
    userPatterns: UserPatterns,
    sessionContext: SessionContext
  ): number {
    let score = 0;

    // User preference weighting
    if (userPatterns.preferredTechniques.includes(technique.id)) {
      score += 0.4;
    }

    // Response pattern alignment
    const userCategoryScore = userPatterns.responsePatterns[technique.category] || 0;
    score += userCategoryScore * 0.3;

    // Recent engagement success
    score += Math.min(userPatterns.engagementMetrics.satisfactionScore / 5, 0.2);

    // Completion rate factor
    score += Math.min(userPatterns.engagementMetrics.completionRate, 0.1);

    return score;
  }

  /**
   * Get or initialize user patterns
   */
  private async getUserPatterns(userId: string): Promise<UserPatterns> {
    if (this.userPatterns.has(userId)) {
      return this.userPatterns.get(userId)!;
    }

    // Initialize default user patterns
    const defaultPatterns: UserPatterns = {
      userId,
      preferredTechniques: [],
      responsePatterns: {
        analytical: 0.5,
        creative: 0.5,
        evaluative: 0.5,
        explorative: 0.5
      },
      selectionHistory: {
        numbered: 0,
        custom: 0
      },
      engagementMetrics: {
        averageResponseTime: 30,
        completionRate: 0.8,
        satisfactionScore: 4.0
      }
    };

    this.userPatterns.set(userId, defaultPatterns);
    return defaultPatterns;
  }

  /**
   * Generate custom option prompt
   */
  private generateCustomOptionPrompt(
    technique: ElicitationTechnique,
    phase: BmadPhase
  ): CustomOptionPrompt {
    const prompts = technique.customPrompts;
    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    return {
      text: selectedPrompt,
      placeholder: `Describe your specific ${technique.category} approach...`,
      followUpQuestions: [
        'What specific outcome are you hoping to achieve?',
        'What constraints or considerations should I keep in mind?',
        'How does this align with your broader strategic objectives?'
      ]
    };
  }

  /**
   * Generate contextual prompts for Mary
   */
  private generateContextualPrompts(
    technique: ElicitationTechnique,
    phase: BmadPhase,
    session: BmadSession
  ): string[] {
    const basePrompts = [
      `Based on your ${phase.name.toLowerCase()} work so far, I recommend using ${technique.name}.`,
      `Let's apply a ${technique.category} approach to make progress on ${phase.name.toLowerCase()}.`
    ];

    // Add technique-specific prompts
    switch (technique.category) {
      case 'analytical':
        basePrompts.push(
          'We\'ll work systematically through the data and frameworks to build a solid foundation.',
          'This structured approach will help us identify the key factors and relationships.'
        );
        break;
        
      case 'creative':
        basePrompts.push(
          'Let\'s explore some creative approaches to breakthrough any current limitations.',
          'This technique often reveals unexpected opportunities and innovative solutions.'
        );
        break;
        
      case 'evaluative':
        basePrompts.push(
          'We\'ll use proven evaluation frameworks to assess your options objectively.',
          'This will help you make a well-informed decision based on clear criteria.'
        );
        break;
        
      case 'explorative':
        basePrompts.push(
          'Let\'s dive deeper to uncover insights that might not be immediately obvious.',
          'This exploratory approach often reveals important context and opportunities.'
        );
        break;
    }

    return basePrompts;
  }

  /**
   * Analyze custom response to extract intent and categorize
   */
  private async analyzeCustomResponse(
    response: string,
    technique: ElicitationTechnique
  ): Promise<{ intent: string; category: string; estimatedTime: number }> {
    // Simple analysis - could be enhanced with NLP
    const words = response.toLowerCase().split(/\s+/);
    
    const category = technique.category;
    let estimatedTime = 5; // Default
    
    // Adjust based on response complexity
    if (words.length > 20) estimatedTime += 3;
    if (words.length > 50) estimatedTime += 5;

    // Look for specific intent indicators
    const intent = this.extractIntent(response);

    return {
      intent,
      category,
      estimatedTime
    };
  }

  /**
   * Extract intent from user response
   */
  private extractIntent(response: string): string {
    const response_lower = response.toLowerCase();
    
    if (response_lower.includes('analyze') || response_lower.includes('data')) {
      return 'analytical_deep_dive';
    } else if (response_lower.includes('creative') || response_lower.includes('innovative')) {
      return 'creative_exploration';
    } else if (response_lower.includes('compare') || response_lower.includes('evaluate')) {
      return 'comparative_analysis';
    } else {
      return 'custom_exploration';
    }
  }

  /**
   * Generate reasoning for technique selection
   */
  private generateSelectionReasoning(
    technique: ElicitationTechnique,
    phase: BmadPhase,
    userPatterns: UserPatterns
  ): string {
    let reasoning = `I selected ${technique.name} because `;
    
    // Phase alignment reasoning
    reasoning += `it's particularly effective for ${phase.name.toLowerCase()} activities. `;
    
    // User pattern reasoning
    if (userPatterns.preferredTechniques.includes(technique.id)) {
      reasoning += `You've had success with this approach before. `;
    }
    
    const categoryScore = userPatterns.responsePatterns[technique.category];
    if (categoryScore > 0.7) {
      reasoning += `Your ${technique.category} thinking style aligns well with this technique. `;
    }
    
    return reasoning;
  }

  /**
   * Generate next phase hint based on selection
   */
  private generateNextPhaseHint(
    selectedOption: NumberedOption,
    technique: ElicitationTechnique
  ): string {
    return `After completing this ${selectedOption.category} work (estimated ${selectedOption.estimatedTime} minutes), we'll likely move to synthesis and planning phases.`;
  }

  /**
   * Generate hint for custom responses
   */
  private generateCustomResponseHint(
    analysis: { intent: string; category: string; estimatedTime: number },
    technique: ElicitationTechnique
  ): string {
    return `Your ${analysis.intent} approach will take approximately ${analysis.estimatedTime} minutes. Let's dive in and see what insights we uncover.`;
  }

  /**
   * Update user patterns based on interaction
   */
  private async updateUserPatterns(
    userId: string,
    selection: number | string,
    elicitationResponse: ElicitationResponse,
    result: ElicitationResult
  ): Promise<void> {
    const patterns = await this.getUserPatterns(userId);
    
    // Update selection history
    if (typeof selection === 'number') {
      patterns.selectionHistory.numbered++;
    } else {
      patterns.selectionHistory.custom++;
    }

    // Update technique preferences
    const techniqueId = elicitationResponse.technique.id;
    if (!patterns.preferredTechniques.includes(techniqueId)) {
      patterns.preferredTechniques.push(techniqueId);
    }

    // Update response patterns (simplified - would need feedback mechanism in production)
    const category = elicitationResponse.technique.category;
    patterns.responsePatterns[category] = Math.min(patterns.responsePatterns[category] + 0.1, 1.0);

    this.userPatterns.set(userId, patterns);
  }
}

/**
 * Generates contextual options based on technique and session state
 */
class ElicitationOptionGenerator {
  async generateContextualOptions(
    technique: ElicitationTechnique,
    phase: BmadPhase,
    sessionContext: SessionContext
  ): Promise<NumberedOption[]> {
    // Start with technique default options
    let options = [...technique.defaultOptions];

    // Customize options based on session context
    options = this.customizeOptionsForContext(options, sessionContext);

    // Limit to 6 options maximum for usability
    options = options.slice(0, 6);

    // Ensure sequential numbering
    options.forEach((option, index) => {
      option.number = index + 1;
    });

    return options;
  }

  /**
   * Customize options based on session context
   */
  private customizeOptionsForContext(
    options: NumberedOption[],
    sessionContext: SessionContext
  ): NumberedOption[] {
    // Simple context-based filtering and customization
    // In production, this would be more sophisticated
    
    // If user has shown preference for certain categories, prioritize those
    const responses = sessionContext.userResponses || {};
    
    // Sort options by relevance (simplified scoring)
    return options.sort((a, b) => {
      // Prefer options that match patterns in user responses
      const aRelevance = this.calculateOptionRelevance(a, responses);
      const bRelevance = this.calculateOptionRelevance(b, responses);
      return bRelevance - aRelevance;
    });
  }

  /**
   * Calculate option relevance based on user responses
   */
  private calculateOptionRelevance(option: NumberedOption, responses: any): number {
    let relevance = 0;
    
    const responseText = JSON.stringify(responses).toLowerCase();
    const optionWords = option.text.toLowerCase().split(/\s+/);
    
    // Simple keyword matching
    optionWords.forEach(word => {
      if (responseText.includes(word)) {
        relevance += 1;
      }
    });

    return relevance;
  }
}

// Export singleton instance
export const elicitationSystem = new ElicitationSystem();