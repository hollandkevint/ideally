import { PathwayType } from '../types';
import { UniversalSessionStateManager, UniversalSessionState, PathwayTransition } from './universal-state-manager';

/**
 * Pathway switching recommendation
 */
export interface PathwaySwitchRecommendation {
  recommendedPathway: PathwayType;
  confidence: number;
  reasoning: string;
  benefits: string[];
  contextMappings: ContextMapping[];
}

export interface ContextMapping {
  fromContext: string;
  toContext: string;
  preservationLevel: 'full' | 'partial' | 'minimal';
  description: string;
}

/**
 * Pathway compatibility matrix
 */
export interface PathwayCompatibility {
  from: PathwayType;
  to: PathwayType;
  compatibility: number; // 0-1 score
  commonElements: string[];
  transferableInsights: string[];
  potentialLosses: string[];
}

/**
 * Pathway Switcher
 * Handles intelligent pathway transitions and context transfer
 */
export class PathwaySwitcher {
  private stateManager: UniversalSessionStateManager;
  private compatibilityMatrix: Map<string, PathwayCompatibility>;

  constructor(stateManager: UniversalSessionStateManager) {
    this.stateManager = stateManager;
    this.compatibilityMatrix = this.initializeCompatibilityMatrix();
  }

  /**
   * Analyze current session and recommend pathway switches
   */
  async analyzePathwaySwitchOpportunities(
    sessionId: string,
    currentState: UniversalSessionState
  ): Promise<PathwaySwitchRecommendation[]> {
    try {
      const recommendations: PathwaySwitchRecommendation[] = [];

      // Analyze user progress and context
      const userInputs = currentState.sharedContext.userInputs;
      const currentProgress = currentState.globalProgress.overallCompletion;
      const pathwayHistory = currentState.pathwayHistory;

      // Generate recommendations for each potential pathway
      for (const pathway of this.getAllPathways()) {
        if (pathway === currentState.currentPathway) continue;

        const recommendation = await this.generatePathwayRecommendation(
          currentState.currentPathway,
          pathway,
          currentState
        );

        if (recommendation.confidence > 0.3) { // Minimum confidence threshold
          recommendations.push(recommendation);
        }
      }

      // Sort by confidence
      return recommendations.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      throw new Error(`Failed to analyze pathway switch opportunities: ${error}`);
    }
  }

  /**
   * Execute pathway switch with intelligent context transfer
   */
  async executePathwaySwitch(
    sessionId: string,
    newPathway: PathwayType,
    transferContext: boolean = true,
    userConfirmed: boolean = false
  ): Promise<PathwayTransition> {
    try {
      const currentState = await this.stateManager.loadState(sessionId);

      if (!userConfirmed) {
        // Validate switch is beneficial
        const recommendations = await this.analyzePathwaySwitchOpportunities(sessionId, currentState);
        const targetRecommendation = recommendations.find(r => r.recommendedPathway === newPathway);

        if (!targetRecommendation || targetRecommendation.confidence < 0.5) {
          throw new Error('Pathway switch not recommended - low confidence in benefits');
        }
      }

      // Get pathway compatibility
      const compatibility = this.getPathwayCompatibility(currentState.currentPathway, newPathway);

      if (compatibility.compatibility < 0.2) {
        throw new Error('Pathway switch not possible - incompatible pathways');
      }

      // Create transition record
      const transition: PathwayTransition = {
        fromPathway: currentState.currentPathway,
        toPathway: newPathway,
        reason: userConfirmed ? 'user_choice' : 'recommendation',
        timestamp: new Date(),
        contextTransferred: transferContext
      };

      // Execute the switch
      await this.stateManager.switchPathway(sessionId, newPathway, transferContext);

      // Perform intelligent context transfer
      if (transferContext) {
        await this.performContextTransfer(sessionId, compatibility);
      }

      return transition;

    } catch (error) {
      throw new Error(`Failed to execute pathway switch: ${error}`);
    }
  }

  /**
   * Preview pathway switch impact
   */
  async previewPathwaySwitch(
    sessionId: string,
    targetPathway: PathwayType
  ): Promise<{
    compatibility: PathwayCompatibility;
    recommendation: PathwaySwitchRecommendation;
    estimatedImpact: PathwaySwitchImpact;
  }> {
    try {
      const currentState = await this.stateManager.loadState(sessionId);
      const compatibility = this.getPathwayCompatibility(currentState.currentPathway, targetPathway);
      const recommendation = await this.generatePathwayRecommendation(
        currentState.currentPathway,
        targetPathway,
        currentState
      );
      const estimatedImpact = this.calculateSwitchImpact(currentState, targetPathway, compatibility);

      return {
        compatibility,
        recommendation,
        estimatedImpact
      };

    } catch (error) {
      throw new Error(`Failed to preview pathway switch: ${error}`);
    }
  }

  /**
   * Get pathway compatibility
   */
  private getPathwayCompatibility(fromPathway: PathwayType, toPathway: PathwayType): PathwayCompatibility {
    const key = `${fromPathway}_to_${toPathway}`;
    const compatibility = this.compatibilityMatrix.get(key);

    if (!compatibility) {
      // Generate dynamic compatibility if not in matrix
      return this.generateDynamicCompatibility(fromPathway, toPathway);
    }

    return compatibility;
  }

  /**
   * Generate pathway recommendation
   */
  private async generatePathwayRecommendation(
    fromPathway: PathwayType,
    toPathway: PathwayType,
    currentState: UniversalSessionState
  ): Promise<PathwaySwitchRecommendation> {
    const compatibility = this.getPathwayCompatibility(fromPathway, toPathway);

    // Calculate confidence based on multiple factors
    let confidence = compatibility.compatibility;

    // Adjust confidence based on progress
    const currentProgress = currentState.globalProgress.overallCompletion;
    if (currentProgress < 30) {
      confidence += 0.2; // Early stage switches are easier
    } else if (currentProgress > 70) {
      confidence -= 0.3; // Late stage switches lose more context
    }

    // Adjust confidence based on user behavior patterns
    const switchHistory = currentState.pathwayHistory.length;
    if (switchHistory > 2) {
      confidence -= 0.1 * switchHistory; // Penalize excessive switching
    }

    // Generate reasoning
    const reasoning = this.generateSwitchReasoning(fromPathway, toPathway, currentState);

    // Generate benefits
    const benefits = this.generateSwitchBenefits(toPathway, compatibility);

    // Generate context mappings
    const contextMappings = this.generateContextMappings(fromPathway, toPathway, compatibility);

    return {
      recommendedPathway: toPathway,
      confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0-1
      reasoning,
      benefits,
      contextMappings
    };
  }

  /**
   * Perform intelligent context transfer
   */
  private async performContextTransfer(
    sessionId: string,
    compatibility: PathwayCompatibility
  ): Promise<void> {
    const currentState = await this.stateManager.loadState(sessionId);

    // Transfer common elements
    const transferableContext = {
      userInputs: currentState.sharedContext.userInputs,
      keyInsights: compatibility.transferableInsights,
      preservedRecommendations: currentState.sharedContext.recommendations
        .filter(rec => this.isRecommendationTransferable(rec, compatibility))
    };

    // Update shared context with transferred data
    await this.stateManager.syncSessionState(sessionId, {
      sharedContext: {
        ...currentState.sharedContext,
        userInputs: transferableContext.userInputs,
        keyInsights: [...currentState.sharedContext.keyInsights, ...transferableContext.keyInsights]
      }
    });
  }

  /**
   * Calculate switch impact
   */
  private calculateSwitchImpact(
    currentState: UniversalSessionState,
    targetPathway: PathwayType,
    compatibility: PathwayCompatibility
  ): PathwaySwitchImpact {
    const progressLoss = (1 - compatibility.compatibility) * currentState.globalProgress.overallCompletion;
    const timeLoss = progressLoss * 0.3; // Estimate 30% time loss per progress point lost

    return {
      progressLoss: Math.round(progressLoss),
      estimatedTimeLoss: Math.round(timeLoss),
      contextRetention: Math.round(compatibility.compatibility * 100),
      potentialGains: compatibility.commonElements.length * 10, // Rough benefit estimate
      riskLevel: progressLoss > 30 ? 'high' : progressLoss > 15 ? 'medium' : 'low'
    };
  }

  /**
   * Initialize pathway compatibility matrix
   */
  private initializeCompatibilityMatrix(): Map<string, PathwayCompatibility> {
    const matrix = new Map<string, PathwayCompatibility>();

    // NEW_IDEA to BUSINESS_MODEL
    matrix.set('new-idea_to_business-model', {
      from: PathwayType.NEW_IDEA,
      to: PathwayType.BUSINESS_MODEL,
      compatibility: 0.8,
      commonElements: ['market_analysis', 'customer_segments', 'value_proposition'],
      transferableInsights: ['target_market', 'customer_needs', 'competitive_landscape'],
      potentialLosses: ['creative_exploration', 'ideation_momentum']
    });

    // BUSINESS_MODEL to FEATURE_REFINEMENT
    matrix.set('business-model_to_feature-refinement', {
      from: PathwayType.BUSINESS_MODEL,
      to: PathwayType.FEATURE_REFINEMENT,
      compatibility: 0.7,
      commonElements: ['user_personas', 'market_positioning', 'value_delivery'],
      transferableInsights: ['customer_segments', 'business_constraints', 'revenue_priorities'],
      potentialLosses: ['financial_modeling', 'business_strategy_depth']
    });

    // Add more pathway combinations
    this.addReverseCompatibilities(matrix);
    this.addCrossPathwayCompatibilities(matrix);

    return matrix;
  }

  private addReverseCompatibilities(matrix: Map<string, PathwayCompatibility>): void {
    const originalEntries = Array.from(matrix.entries());

    originalEntries.forEach(([key, compatibility]) => {
      const reverseKey = `${compatibility.to}_to_${compatibility.from}`;
      if (!matrix.has(reverseKey)) {
        matrix.set(reverseKey, {
          from: compatibility.to,
          to: compatibility.from,
          compatibility: compatibility.compatibility * 0.9, // Slightly lower reverse compatibility
          commonElements: compatibility.commonElements,
          transferableInsights: compatibility.potentialLosses, // What was lost becomes transferable
          potentialLosses: compatibility.transferableInsights
        });
      }
    });
  }

  private addCrossPathwayCompatibilities(matrix: Map<string, PathwayCompatibility>): void {
    // Add direct NEW_IDEA to FEATURE_REFINEMENT compatibility
    matrix.set('new-idea_to_feature-refinement', {
      from: PathwayType.NEW_IDEA,
      to: PathwayType.FEATURE_REFINEMENT,
      compatibility: 0.6,
      commonElements: ['user_needs', 'problem_definition', 'solution_concepts'],
      transferableInsights: ['user_research', 'problem_insights', 'creative_solutions'],
      potentialLosses: ['market_analysis', 'business_viability']
    });
  }

  // Helper methods

  private getAllPathways(): PathwayType[] {
    return Object.values(PathwayType);
  }

  private generateDynamicCompatibility(fromPathway: PathwayType, toPathway: PathwayType): PathwayCompatibility {
    // Generate basic compatibility for unknown pathway combinations
    return {
      from: fromPathway,
      to: toPathway,
      compatibility: 0.4, // Default moderate compatibility
      commonElements: ['user_context', 'strategic_thinking'],
      transferableInsights: ['user_inputs', 'session_progress'],
      potentialLosses: ['pathway_specific_analysis', 'specialized_insights']
    };
  }

  private generateSwitchReasoning(
    fromPathway: PathwayType,
    toPathway: PathwayType,
    currentState: UniversalSessionState
  ): string {
    const progress = currentState.globalProgress.overallCompletion;
    const pathwayNames = this.getPathwayDisplayNames();

    if (progress < 25) {
      return `Early in your ${pathwayNames[fromPathway]} journey, switching to ${pathwayNames[toPathway]} could provide a fresh perspective while preserving most of your insights.`;
    } else if (progress > 75) {
      return `You've made significant progress in ${pathwayNames[fromPathway]}. Consider completing this pathway first, then starting ${pathwayNames[toPathway]} as a follow-up.`;
    } else {
      return `Your ${pathwayNames[fromPathway]} insights could be valuable for ${pathwayNames[toPathway]} analysis. The switch could provide complementary strategic perspectives.`;
    }
  }

  private generateSwitchBenefits(toPathway: PathwayType, compatibility: PathwayCompatibility): string[] {
    const benefits = [
      `Access to ${toPathway.replace('-', ' ')} specialized frameworks`,
      `Leverage existing insights in new context`
    ];

    compatibility.commonElements.forEach(element => {
      benefits.push(`Enhanced ${element.replace('_', ' ')} analysis`);
    });

    return benefits;
  }

  private generateContextMappings(
    fromPathway: PathwayType,
    toPathway: PathwayType,
    compatibility: PathwayCompatibility
  ): ContextMapping[] {
    return compatibility.transferableInsights.map(insight => ({
      fromContext: `${fromPathway}_${insight}`,
      toContext: `${toPathway}_${insight}`,
      preservationLevel: compatibility.compatibility > 0.7 ? 'full' :
                        compatibility.compatibility > 0.4 ? 'partial' : 'minimal',
      description: `Transfer ${insight.replace('_', ' ')} from ${fromPathway} to ${toPathway} context`
    }));
  }

  private getPathwayDisplayNames(): Record<PathwayType, string> {
    return {
      [PathwayType.NEW_IDEA]: 'New Idea Development',
      [PathwayType.BUSINESS_MODEL]: 'Business Model Analysis',
      [PathwayType.BUSINESS_MODEL_PROBLEM]: 'Business Model Problem Analysis',
      [PathwayType.FEATURE_REFINEMENT]: 'Feature Refinement',
      [PathwayType.STRATEGIC_OPTIMIZATION]: 'Strategic Optimization'
    };
  }

  private isRecommendationTransferable(recommendation: string, compatibility: PathwayCompatibility): boolean {
    return compatibility.commonElements.some(element =>
      recommendation.toLowerCase().includes(element.toLowerCase())
    );
  }
}

// Additional interfaces
export interface PathwaySwitchImpact {
  progressLoss: number; // Percentage
  estimatedTimeLoss: number; // Minutes
  contextRetention: number; // Percentage
  potentialGains: number; // Benefit score
  riskLevel: 'low' | 'medium' | 'high';
}

// Export singleton
export const pathwaySwitcher = new PathwaySwitcher(
  require('./universal-state-manager').universalSessionStateManager
);