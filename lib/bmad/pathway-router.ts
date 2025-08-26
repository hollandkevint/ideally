import { 
  PathwayType, 
  BmadPathway, 
  PersonaConfiguration, 
  BmadMethodError 
} from './types';

/**
 * Pathway recommendation result
 */
export interface PathwayRecommendation {
  primary: PathwayType;
  confidence: number;
  reasoning: string;
  alternatives: {
    pathway: PathwayType;
    confidence: number;
    reasoning: string;
  }[];
}

/**
 * User intent analysis result
 */
export interface IntentAnalysis {
  keywords: string[];
  category: 'ideation' | 'validation' | 'optimization' | 'planning';
  urgency: 'low' | 'medium' | 'high';
  scope: 'feature' | 'product' | 'business' | 'market';
  confidence: number;
}

/**
 * BMad Method Pathway Router
 * Analyzes user intent and routes to appropriate strategic pathway
 */
export class PathwayRouter {
  private pathways: Map<PathwayType, BmadPathway>;
  private intentClassifier: IntentClassifier;

  constructor() {
    this.pathways = new Map();
    this.intentClassifier = new IntentClassifier();
    this.initializePathways();
  }

  /**
   * Initialize the three core BMad Method pathways
   */
  private initializePathways(): void {
    // New Idea Pathway
    this.pathways.set(PathwayType.NEW_IDEA, {
      id: PathwayType.NEW_IDEA,
      name: "New Idea Exploration",
      description: "Transform raw ideas into validated business concepts using structured BMad Method brainstorming and market analysis",
      targetUser: "Early-stage entrepreneurs, innovation teams, ideation facilitators",
      expectedOutcome: "Validated idea with market positioning and next-step validation plan",
      timeCommitment: 30,
      templateSequence: ['brainstorm-session', 'market-research', 'project-brief'],
      maryPersonaConfig: {
        primaryPersona: 'analyst',
        adaptationTriggers: [
          {
            condition: 'creative_block_detected',
            targetPersona: 'coach',
            reason: 'User needs creative breakthrough techniques'
          },
          {
            condition: 'analysis_phase_entered', 
            targetPersona: 'advisor',
            reason: 'Strategic evaluation and decision-making required'
          }
        ],
        communicationStyle: {
          questioningStyle: 'curious',
          responseLength: 'moderate',
          frameworkEmphasis: 'moderate'
        }
      }
    });

    // Business Model Pathway
    this.pathways.set(PathwayType.BUSINESS_MODEL, {
      id: PathwayType.BUSINESS_MODEL,
      name: "Business Model Analysis",
      description: "Solve revenue and business model challenges using systematic BMad Method market research and competitive analysis",
      targetUser: "SaaS founders, business development teams, strategy consultants",
      expectedOutcome: "Revenue strategy with validated market assumptions and implementation roadmap",
      timeCommitment: 30,
      templateSequence: ['business-model-canvas', 'competitive-analysis', 'market-research'],
      maryPersonaConfig: {
        primaryPersona: 'advisor',
        adaptationTriggers: [
          {
            condition: 'data_collection_needed',
            targetPersona: 'analyst',
            reason: 'Systematic data gathering and market research required'
          },
          {
            condition: 'strategic_options_evaluation',
            targetPersona: 'advisor', 
            reason: 'Strategic decision-making and trade-off analysis needed'
          }
        ],
        communicationStyle: {
          questioningStyle: 'challenging',
          responseLength: 'detailed',
          frameworkEmphasis: 'heavy'
        }
      }
    });

    // Strategic Optimization Pathway
    this.pathways.set(PathwayType.STRATEGIC_OPTIMIZATION, {
      id: PathwayType.STRATEGIC_OPTIMIZATION,
      name: "Strategic Optimization",
      description: "Refine and optimize existing features or concepts using data-driven BMad Method competitive analysis and user research",
      targetUser: "Product managers, strategic consultants, optimization teams",
      expectedOutcome: "Feature roadmap with competitive positioning and user-validated priorities",
      timeCommitment: 25,
      templateSequence: ['competitive-analysis', 'user-research', 'feature-prioritization'],
      maryPersonaConfig: {
        primaryPersona: 'advisor',
        adaptationTriggers: [
          {
            condition: 'user_research_needed',
            targetPersona: 'analyst',
            reason: 'Systematic user feedback collection and analysis required'
          },
          {
            condition: 'creative_alternatives_needed',
            targetPersona: 'coach',
            reason: 'Alternative approaches and creative solutions needed'
          }
        ],
        communicationStyle: {
          questioningStyle: 'challenging',
          responseLength: 'concise',
          frameworkEmphasis: 'heavy'
        }
      }
    });
  }

  /**
   * Analyze user input and recommend optimal pathway
   */
  async analyzeUserIntent(userInput: string): Promise<PathwayRecommendation> {
    try {
      // Classify user intent
      const intentAnalysis = await this.intentClassifier.analyze(userInput);
      
      // Score each pathway based on intent
      const pathwayScores = await this.scorePathways(intentAnalysis, userInput);
      
      // Generate recommendation
      return this.generateRecommendation(pathwayScores, intentAnalysis);
    } catch (error) {
      throw new BmadMethodError(
        `Failed to analyze user intent: ${error.message}`,
        'INTENT_ANALYSIS_ERROR',
        { userInput, originalError: error }
      );
    }
  }

  /**
   * Score pathways based on intent analysis
   */
  private async scorePathways(
    intentAnalysis: IntentAnalysis,
    userInput: string
  ): Promise<Map<PathwayType, number>> {
    const scores = new Map<PathwayType, number>();

    // New Idea Pathway scoring
    let newIdeaScore = 0;
    
    // Keywords that suggest new idea pathway
    const newIdeaKeywords = [
      'new idea', 'brainstorm', 'innovation', 'startup', 'concept', 'invention',
      'creative', 'ideation', 'opportunity', 'vision', 'dream', 'imagine'
    ];
    newIdeaScore += this.calculateKeywordScore(userInput, newIdeaKeywords) * 0.4;

    // Category alignment
    if (intentAnalysis.category === 'ideation') newIdeaScore += 0.3;
    if (intentAnalysis.scope === 'business' || intentAnalysis.scope === 'market') newIdeaScore += 0.2;
    
    // Urgency factor (new ideas often have lower urgency)
    if (intentAnalysis.urgency === 'low') newIdeaScore += 0.1;

    scores.set(PathwayType.NEW_IDEA, Math.min(newIdeaScore, 1.0));

    // Business Model Pathway scoring
    let businessModelScore = 0;
    
    const businessModelKeywords = [
      'revenue', 'monetization', 'business model', 'pricing', 'profit', 'income',
      'sales', 'market', 'competition', 'customers', 'value proposition'
    ];
    businessModelScore += this.calculateKeywordScore(userInput, businessModelKeywords) * 0.4;

    if (intentAnalysis.category === 'validation' || intentAnalysis.category === 'planning') {
      businessModelScore += 0.3;
    }
    if (intentAnalysis.scope === 'business') businessModelScore += 0.2;
    if (intentAnalysis.urgency === 'high') businessModelScore += 0.1;

    scores.set(PathwayType.BUSINESS_MODEL, Math.min(businessModelScore, 1.0));

    // Strategic Optimization Pathway scoring
    let optimizationScore = 0;
    
    const optimizationKeywords = [
      'improve', 'optimize', 'refine', 'enhance', 'better', 'fix', 'problem',
      'feature', 'performance', 'efficiency', 'user experience', 'iteration'
    ];
    optimizationScore += this.calculateKeywordScore(userInput, optimizationKeywords) * 0.4;

    if (intentAnalysis.category === 'optimization') optimizationScore += 0.3;
    if (intentAnalysis.scope === 'feature' || intentAnalysis.scope === 'product') optimizationScore += 0.2;
    if (intentAnalysis.urgency === 'medium' || intentAnalysis.urgency === 'high') optimizationScore += 0.1;

    scores.set(PathwayType.STRATEGIC_OPTIMIZATION, Math.min(optimizationScore, 1.0));

    return scores;
  }

  /**
   * Calculate keyword matching score
   */
  private calculateKeywordScore(text: string, keywords: string[]): number {
    const lowercaseText = text.toLowerCase();
    const matches = keywords.filter(keyword => lowercaseText.includes(keyword.toLowerCase()));
    return matches.length / keywords.length;
  }

  /**
   * Generate pathway recommendation from scores
   */
  private generateRecommendation(
    scores: Map<PathwayType, number>,
    intentAnalysis: IntentAnalysis
  ): PathwayRecommendation {
    // Sort pathways by score
    const sortedPathways = Array.from(scores.entries())
      .sort(([,a], [,b]) => b - a);

    const [primaryPathway, primaryScore] = sortedPathways[0];
    const alternatives = sortedPathways.slice(1, 3).map(([pathway, score]) => ({
      pathway,
      confidence: score,
      reasoning: this.generateReasoningForPathway(pathway, score, intentAnalysis)
    }));

    return {
      primary: primaryPathway,
      confidence: primaryScore,
      reasoning: this.generateReasoningForPathway(primaryPathway, primaryScore, intentAnalysis),
      alternatives
    };
  }

  /**
   * Generate human-readable reasoning for pathway selection
   */
  private generateReasoningForPathway(
    pathway: PathwayType,
    score: number,
    intentAnalysis: IntentAnalysis
  ): string {
    const pathwayInfo = this.pathways.get(pathway)!;
    const confidenceLevel = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';

    let reasoning = `${pathwayInfo.name} shows ${confidenceLevel} alignment (${Math.round(score * 100)}%) `;

    switch (pathway) {
      case PathwayType.NEW_IDEA:
        reasoning += `based on ideation-focused language and early-stage exploration needs. `;
        reasoning += `Best for transforming raw concepts into validated business opportunities.`;
        break;
        
      case PathwayType.BUSINESS_MODEL:
        reasoning += `based on revenue and market-focused language. `;
        reasoning += `Optimal for solving monetization and business model challenges with systematic analysis.`;
        break;
        
      case PathwayType.STRATEGIC_OPTIMIZATION:
        reasoning += `based on improvement and optimization-focused language. `;
        reasoning += `Perfect for refining existing concepts with data-driven competitive analysis.`;
        break;
    }

    return reasoning;
  }

  /**
   * Get pathway configuration
   */
  getPathway(pathwayType: PathwayType): BmadPathway | null {
    return this.pathways.get(pathwayType) || null;
  }

  /**
   * List all available pathways
   */
  getAllPathways(): BmadPathway[] {
    return Array.from(this.pathways.values());
  }

  /**
   * Get pathway by template sequence
   */
  getPathwayByTemplates(templateIds: string[]): PathwayType | null {
    for (const [pathwayType, pathway] of this.pathways) {
      if (this.arraysEqual(pathway.templateSequence, templateIds)) {
        return pathwayType;
      }
    }
    return null;
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }
}

/**
 * Simple intent classification system
 */
class IntentClassifier {
  async analyze(userInput: string): Promise<IntentAnalysis> {
    const lowercaseInput = userInput.toLowerCase();
    
    // Extract keywords
    const keywords = this.extractKeywords(lowercaseInput);
    
    // Classify category
    const category = this.classifyCategory(lowercaseInput);
    
    // Determine urgency
    const urgency = this.classifyUrgency(lowercaseInput);
    
    // Determine scope
    const scope = this.classifyScope(lowercaseInput);

    return {
      keywords,
      category,
      urgency,
      scope,
      confidence: 0.75 // Simple fixed confidence for now
    };
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might'
    ]);

    return text
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  private classifyCategory(text: string): 'ideation' | 'validation' | 'optimization' | 'planning' {
    const ideationKeywords = ['idea', 'brainstorm', 'creative', 'innovation', 'concept'];
    const validationKeywords = ['validate', 'test', 'proof', 'research', 'market'];
    const optimizationKeywords = ['improve', 'optimize', 'better', 'enhance', 'fix'];
    const planningKeywords = ['plan', 'strategy', 'roadmap', 'timeline', 'execute'];

    const scores = {
      ideation: this.countKeywords(text, ideationKeywords),
      validation: this.countKeywords(text, validationKeywords),
      optimization: this.countKeywords(text, optimizationKeywords),
      planning: this.countKeywords(text, planningKeywords)
    };

    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b) as any;
  }

  private classifyUrgency(text: string): 'low' | 'medium' | 'high' {
    const highUrgencyKeywords = ['urgent', 'asap', 'emergency', 'critical', 'deadline', 'immediately'];
    const mediumUrgencyKeywords = ['soon', 'quickly', 'fast', 'priority', 'important'];
    
    if (this.countKeywords(text, highUrgencyKeywords) > 0) return 'high';
    if (this.countKeywords(text, mediumUrgencyKeywords) > 0) return 'medium';
    return 'low';
  }

  private classifyScope(text: string): 'feature' | 'product' | 'business' | 'market' {
    const featureKeywords = ['feature', 'function', 'capability', 'component'];
    const productKeywords = ['product', 'app', 'platform', 'service', 'tool'];
    const businessKeywords = ['business', 'company', 'revenue', 'profit', 'model'];
    const marketKeywords = ['market', 'industry', 'sector', 'competitive', 'customer'];

    const scores = {
      feature: this.countKeywords(text, featureKeywords),
      product: this.countKeywords(text, productKeywords),
      business: this.countKeywords(text, businessKeywords),
      market: this.countKeywords(text, marketKeywords)
    };

    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b) as any;
  }

  private countKeywords(text: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => 
      text.includes(keyword) ? count + 1 : count, 0);
  }
}

// Export singleton instance
export const pathwayRouter = new PathwayRouter();