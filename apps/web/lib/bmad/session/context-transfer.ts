/**
 * Context Transfer Engine
 * Intelligent cross-pathway data mapping for seamless transitions
 */

import { PathwayType } from '../types';
import {
  UniversalSessionState,
  NewIdeaSessionState,
  BusinessModelSessionState,
  FeatureRefinementSessionState,
  SharedSessionContext
} from './universal-state-manager';

export interface ContextTransferResult {
  success: boolean;
  transferredFields: string[];
  mappings: ContextFieldMapping[];
  preservationScore: number; // 0-100
  warnings: string[];
}

export interface ContextFieldMapping {
  sourceField: string;
  targetField: string;
  mappingType: 'direct' | 'transformed' | 'inferred';
  confidence: number;
  transformationApplied?: string;
}

/**
 * Context Transfer Engine
 * Maps data intelligently between different pathway contexts
 */
export class ContextTransferEngine {
  /**
   * Transfer context from current pathway to target pathway
   */
  async transferContext(
    state: UniversalSessionState,
    fromPathway: PathwayType,
    toPathway: PathwayType
  ): Promise<ContextTransferResult> {
    try {
      const transferredFields: string[] = [];
      const mappings: ContextFieldMapping[] = [];
      const warnings: string[] = [];

      // Get transfer strategy for this pathway combination
      const strategy = this.getTransferStrategy(fromPathway, toPathway);

      // Apply shared context (always preserved)
      transferredFields.push(...this.transferSharedContext(state.sharedContext));

      // Apply pathway-specific transfers
      const pathwayMappings = await this.applyPathwaySpecificTransfer(
        state,
        fromPathway,
        toPathway,
        strategy
      );

      mappings.push(...pathwayMappings.mappings);
      transferredFields.push(...pathwayMappings.fields);
      warnings.push(...pathwayMappings.warnings);

      // Calculate preservation score
      const preservationScore = this.calculatePreservationScore(
        transferredFields,
        mappings
      );

      return {
        success: true,
        transferredFields,
        mappings,
        preservationScore,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        transferredFields: [],
        mappings: [],
        preservationScore: 0,
        warnings: [`Context transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get transfer strategy for pathway combination
   */
  private getTransferStrategy(from: PathwayType, to: PathwayType): TransferStrategy {
    const strategyKey = `${from}_to_${to}`;
    const strategies: Record<string, TransferStrategy> = {
      // New Idea → Business Model
      [`${PathwayType.NEW_IDEA}_to_${PathwayType.BUSINESS_MODEL}`]: {
        preserveFields: ['concept', 'marketInsights', 'targetMarket', 'uniqueValue'],
        transformations: {
          'concept': 'valuePropositions',
          'targetMarket': 'customerSegments',
          'marketInsights': 'marketOpportunities'
        },
        inferFields: ['revenueModel']
      },

      // Business Model → Feature Refinement
      [`${PathwayType.BUSINESS_MODEL}_to_${PathwayType.FEATURE_REFINEMENT}`]: {
        preserveFields: ['customerSegments', 'painPoints', 'valuePropositions'],
        transformations: {
          'customerSegments': 'targetUsers',
          'painPoints': 'problemsToSolve',
          'valuePropositions': 'featureBenefits'
        },
        inferFields: ['userStories', 'acceptanceCriteria']
      },

      // Feature Refinement → New Idea
      [`${PathwayType.FEATURE_REFINEMENT}_to_${PathwayType.NEW_IDEA}`]: {
        preserveFields: ['userInsights', 'technicalConstraints', 'successMetrics'],
        transformations: {
          'userInsights': 'marketInsights',
          'technicalConstraints': 'implementationConsiderations'
        },
        inferFields: ['innovationOpportunities']
      },

      // New Idea → Feature Refinement
      [`${PathwayType.NEW_IDEA}_to_${PathwayType.FEATURE_REFINEMENT}`]: {
        preserveFields: ['concept', 'targetMarket', 'differentiators'],
        transformations: {
          'concept': 'featureDescription',
          'targetMarket': 'targetUsers',
          'differentiators': 'keyFeatures'
        },
        inferFields: ['userStories']
      },

      // Business Model → New Idea
      [`${PathwayType.BUSINESS_MODEL}_to_${PathwayType.NEW_IDEA}`]: {
        preserveFields: ['marketOpportunities', 'customerInsights', 'revenueModel'],
        transformations: {
          'marketOpportunities': 'marketInsights',
          'customerInsights': 'targetMarket'
        },
        inferFields: ['innovationAngles']
      },

      // Feature Refinement → Business Model
      [`${PathwayType.FEATURE_REFINEMENT}_to_${PathwayType.BUSINESS_MODEL}`]: {
        preserveFields: ['targetUsers', 'problemsToSolve', 'featureBenefits'],
        transformations: {
          'targetUsers': 'customerSegments',
          'problemsToSolve': 'painPoints',
          'featureBenefits': 'valuePropositions'
        },
        inferFields: ['revenueOpportunities']
      }
    };

    return strategies[strategyKey] || {
      preserveFields: [],
      transformations: {},
      inferFields: []
    };
  }

  /**
   * Transfer shared context (always preserved)
   */
  private transferSharedContext(sharedContext: SharedSessionContext): string[] {
    const fields: string[] = [];

    if (sharedContext.userInputs.length > 0) {
      fields.push('userInputs');
    }
    if (sharedContext.keyInsights.length > 0) {
      fields.push('keyInsights');
    }
    if (sharedContext.recommendations.length > 0) {
      fields.push('recommendations');
    }
    if (sharedContext.generatedDocuments.length > 0) {
      fields.push('generatedDocuments');
    }

    return fields;
  }

  /**
   * Apply pathway-specific transfer logic
   */
  private async applyPathwaySpecificTransfer(
    state: UniversalSessionState,
    fromPathway: PathwayType,
    toPathway: PathwayType,
    strategy: TransferStrategy
  ): Promise<PathwayTransferResult> {
    const mappings: ContextFieldMapping[] = [];
    const fields: string[] = [];
    const warnings: string[] = [];

    // Get source pathway state
    const sourceState = this.getPathwayState(state, fromPathway);
    if (!sourceState) {
      warnings.push(`No data found for source pathway: ${fromPathway}`);
      return { mappings, fields, warnings };
    }

    // Apply direct preservations
    for (const field of strategy.preserveFields) {
      if (this.hasField(sourceState, field)) {
        mappings.push({
          sourceField: field,
          targetField: field,
          mappingType: 'direct',
          confidence: 1.0
        });
        fields.push(field);
      }
    }

    // Apply transformations
    for (const [sourceField, targetField] of Object.entries(strategy.transformations)) {
      if (this.hasField(sourceState, sourceField)) {
        mappings.push({
          sourceField,
          targetField,
          mappingType: 'transformed',
          confidence: 0.85,
          transformationApplied: `${sourceField} → ${targetField}`
        });
        fields.push(targetField);
      }
    }

    // Infer new fields from context
    for (const field of strategy.inferFields) {
      mappings.push({
        sourceField: 'sharedContext',
        targetField: field,
        mappingType: 'inferred',
        confidence: 0.6
      });
      fields.push(field);
    }

    return { mappings, fields, warnings };
  }

  /**
   * Get pathway-specific state
   */
  private getPathwayState(
    state: UniversalSessionState,
    pathway: PathwayType
  ): Record<string, any> | null {
    switch (pathway) {
      case PathwayType.NEW_IDEA:
        return state.newIdeaState || null;
      case PathwayType.BUSINESS_MODEL:
        return state.businessModelState || null;
      case PathwayType.FEATURE_REFINEMENT:
        return state.featureRefinementState || null;
      default:
        return null;
    }
  }

  /**
   * Check if field exists in state
   */
  private hasField(state: Record<string, any>, field: string): boolean {
    return state && (field in state || this.hasNestedField(state, field));
  }

  /**
   * Check for nested field
   */
  private hasNestedField(state: Record<string, any>, field: string): boolean {
    for (const key of Object.keys(state)) {
      const value = state[key];
      if (typeof value === 'object' && value !== null) {
        if (field in value) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Calculate preservation score (0-100)
   */
  private calculatePreservationScore(
    transferredFields: string[],
    mappings: ContextFieldMapping[]
  ): number {
    if (mappings.length === 0) return 0;

    // Weight by mapping confidence
    const totalConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0);
    const avgConfidence = totalConfidence / mappings.length;

    // Base score from field count (50%) + confidence (50%)
    const fieldScore = Math.min(transferredFields.length / 10, 1.0) * 50;
    const confidenceScore = avgConfidence * 50;

    return Math.round(fieldScore + confidenceScore);
  }

  /**
   * Extract key concepts from source pathway for target
   */
  extractKeyConcepts(
    sourceState: Record<string, any>,
    targetPathway: PathwayType
  ): string[] {
    const concepts: string[] = [];

    // Extract based on target pathway needs
    switch (targetPathway) {
      case PathwayType.NEW_IDEA:
        concepts.push(
          ...this.extractConceptualInsights(sourceState)
        );
        break;
      case PathwayType.BUSINESS_MODEL:
        concepts.push(
          ...this.extractBusinessInsights(sourceState)
        );
        break;
      case PathwayType.FEATURE_REFINEMENT:
        concepts.push(
          ...this.extractUserInsights(sourceState)
        );
        break;
    }

    return concepts.filter(Boolean);
  }

  /**
   * Extract conceptual insights for New Idea pathway
   */
  private extractConceptualInsights(state: Record<string, any>): string[] {
    const insights: string[] = [];

    // Look for innovative concepts, market gaps, differentiation opportunities
    if (state.valuePropositions) {
      insights.push(`Value Proposition: ${state.valuePropositions}`);
    }
    if (state.marketOpportunities) {
      insights.push(`Market Opportunity: ${state.marketOpportunities}`);
    }

    return insights;
  }

  /**
   * Extract business insights for Business Model pathway
   */
  private extractBusinessInsights(state: Record<string, any>): string[] {
    const insights: string[] = [];

    // Look for revenue potential, customer segments, market size
    if (state.targetMarket) {
      insights.push(`Target Market: ${state.targetMarket}`);
    }
    if (state.userInsights) {
      insights.push(`Customer Insights: ${state.userInsights}`);
    }

    return insights;
  }

  /**
   * Extract user insights for Feature Refinement pathway
   */
  private extractUserInsights(state: Record<string, any>): string[] {
    const insights: string[] = [];

    // Look for user needs, pain points, behaviors
    if (state.customerSegments) {
      insights.push(`Customer Segments: ${state.customerSegments}`);
    }
    if (state.painPoints) {
      insights.push(`Pain Points: ${state.painPoints}`);
    }

    return insights;
  }
}

// Transfer strategy interface
interface TransferStrategy {
  preserveFields: string[];
  transformations: Record<string, string>;
  inferFields: string[];
}

// Pathway transfer result interface
interface PathwayTransferResult {
  mappings: ContextFieldMapping[];
  fields: string[];
  warnings: string[];
}

// Export singleton instance
export const contextTransferEngine = new ContextTransferEngine();
