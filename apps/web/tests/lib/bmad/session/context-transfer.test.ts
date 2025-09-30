/**
 * Tests for ContextTransferEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextTransferEngine } from '@/lib/bmad/session/context-transfer';
import { UniversalSessionState } from '@/lib/bmad/session/universal-state-manager';
import { PathwayType } from '@/lib/bmad/types';

describe('ContextTransferEngine', () => {
  let engine: ContextTransferEngine;

  beforeEach(() => {
    engine = new ContextTransferEngine();
  });

  describe('Context Transfer', () => {
    it('should transfer context from New Idea to Business Model', async () => {
      const state = createMockStateWith NewIdea();

      const result = await engine.transferContext(
        state,
        PathwayType.NEW_IDEA,
        PathwayType.BUSINESS_MODEL
      );

      expect(result.success).toBe(true);
      expect(result.transferredFields.length).toBeGreaterThan(0);
      expect(result.preservationScore).toBeGreaterThan(0);
    });

    it('should transfer context from Business Model to Feature Refinement', async () => {
      const state = createMockStateWithBusinessModel();

      const result = await engine.transferContext(
        state,
        PathwayType.BUSINESS_MODEL,
        PathwayType.FEATURE_REFINEMENT
      );

      expect(result.success).toBe(true);
      expect(result.mappings.length).toBeGreaterThan(0);
    });

    it('should always preserve shared context', async () => {
      const state: UniversalSessionState = {
        sessionId: 'test-123',
        currentPathway: PathwayType.NEW_IDEA,
        pathwayHistory: [],
        sharedContext: {
          userInputs: ['Input 1', 'Input 2'],
          keyInsights: ['Insight 1'],
          recommendations: ['Rec 1'],
          generatedDocuments: []
        },
        globalProgress: {
          overallCompletion: 0,
          pathwayCompletions: {},
          timeSpent: {},
          totalSessionTime: 0
        },
        analytics: {
          pathwaySwitches: 0,
          completionRate: 0,
          userBehaviorPatterns: {},
          effectivenessMetrics: {}
        }
      };

      const result = await engine.transferContext(
        state,
        PathwayType.NEW_IDEA,
        PathwayType.BUSINESS_MODEL
      );

      expect(result.transferredFields).toContain('userInputs');
      expect(result.transferredFields).toContain('keyInsights');
    });

    it('should generate warnings for missing source data', async () => {
      const emptyState: UniversalSessionState = {
        sessionId: 'test-123',
        currentPathway: PathwayType.NEW_IDEA,
        pathwayHistory: [],
        sharedContext: {
          userInputs: [],
          keyInsights: [],
          recommendations: [],
          generatedDocuments: []
        },
        globalProgress: {
          overallCompletion: 0,
          pathwayCompletions: {},
          timeSpent: {},
          totalSessionTime: 0
        },
        analytics: {
          pathwaySwitches: 0,
          completionRate: 0,
          userBehaviorPatterns: {},
          effectivenessMetrics: {}
        }
      };

      const result = await engine.transferContext(
        emptyState,
        PathwayType.NEW_IDEA,
        PathwayType.BUSINESS_MODEL
      );

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Context Mappings', () => {
    it('should create direct mappings for preserved fields', async () => {
      const state = createMockStateWithNewIdea();

      const result = await engine.transferContext(
        state,
        PathwayType.NEW_IDEA,
        PathwayType.BUSINESS_MODEL
      );

      const directMappings = result.mappings.filter(m => m.mappingType === 'direct');
      expect(directMappings.length).toBeGreaterThan(0);
    });

    it('should create transformed mappings for field translations', async () => {
      const state = createMockStateWithNewIdea();

      const result = await engine.transferContext(
        state,
        PathwayType.NEW_IDEA,
        PathwayType.BUSINESS_MODEL
      );

      const transformedMappings = result.mappings.filter(m => m.mappingType === 'transformed');
      expect(transformedMappings.length).toBeGreaterThan(0);
    });

    it('should create inferred mappings for new fields', async () => {
      const state = createMockStateWithNewIdea();

      const result = await engine.transferContext(
        state,
        PathwayType.NEW_IDEA,
        PathwayType.BUSINESS_MODEL
      );

      const inferredMappings = result.mappings.filter(m => m.mappingType === 'inferred');
      expect(inferredMappings.length).toBeGreaterThan(0);
    });

    it('should have confidence scores for all mappings', async () => {
      const state = createMockStateWithBusinessModel();

      const result = await engine.transferContext(
        state,
        PathwayType.BUSINESS_MODEL,
        PathwayType.FEATURE_REFINEMENT
      );

      for (const mapping of result.mappings) {
        expect(mapping.confidence).toBeGreaterThan(0);
        expect(mapping.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Preservation Score', () => {
    it('should calculate high preservation score for complete transfers', async () => {
      const state = createMockStateWithNewIdea();

      const result = await engine.transferContext(
        state,
        PathwayType.NEW_IDEA,
        PathwayType.BUSINESS_MODEL
      );

      expect(result.preservationScore).toBeGreaterThan(50);
    });

    it('should calculate low preservation score for incomplete transfers', async () => {
      const emptyState: UniversalSessionState = {
        sessionId: 'test-123',
        currentPathway: PathwayType.NEW_IDEA,
        pathwayHistory: [],
        sharedContext: {
          userInputs: [],
          keyInsights: [],
          recommendations: [],
          generatedDocuments: []
        },
        globalProgress: {
          overallCompletion: 0,
          pathwayCompletions: {},
          timeSpent: {},
          totalSessionTime: 0
        },
        analytics: {
          pathwaySwitches: 0,
          completionRate: 0,
          userBehaviorPatterns: {},
          effectivenessMetrics: {}
        }
      };

      const result = await engine.transferContext(
        emptyState,
        PathwayType.NEW_IDEA,
        PathwayType.BUSINESS_MODEL
      );

      expect(result.preservationScore).toBeLessThan(50);
    });
  });

  describe('Key Concepts Extraction', () => {
    it('should extract conceptual insights for New Idea pathway', () => {
      const sourceState = {
        valuePropositions: 'Save 10 hours per week',
        marketOpportunities: 'Growing SaaS market'
      };

      const concepts = engine.extractKeyConcepts(sourceState, PathwayType.NEW_IDEA);

      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts.some(c => c.includes('Value Proposition'))).toBe(true);
    });

    it('should extract business insights for Business Model pathway', () => {
      const sourceState = {
        targetMarket: 'SMB companies',
        userInsights: 'Budget conscious customers'
      };

      const concepts = engine.extractKeyConcepts(sourceState, PathwayType.BUSINESS_MODEL);

      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts.some(c => c.includes('Target Market'))).toBe(true);
    });

    it('should extract user insights for Feature Refinement pathway', () => {
      const sourceState = {
        customerSegments: 'Small businesses',
        painPoints: 'Time management challenges'
      };

      const concepts = engine.extractKeyConcepts(sourceState, PathwayType.FEATURE_REFINEMENT);

      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts.some(c => c.includes('Customer Segments'))).toBe(true);
    });
  });

  describe('Bidirectional Transfers', () => {
    it('should support transfer from Feature Refinement back to New Idea', async () => {
      const state = createMockStateWithFeatureRefinement();

      const result = await engine.transferContext(
        state,
        PathwayType.FEATURE_REFINEMENT,
        PathwayType.NEW_IDEA
      );

      expect(result.success).toBe(true);
      expect(result.transferredFields.length).toBeGreaterThan(0);
    });

    it('should support transfer from Business Model back to Feature Refinement', async () => {
      const state = createMockStateWithBusinessModel();

      const result = await engine.transferContext(
        state,
        PathwayType.BUSINESS_MODEL,
        PathwayType.FEATURE_REFINEMENT
      );

      expect(result.success).toBe(true);
    });
  });
});

// Helper functions to create mock states
function createMockStateWithNewIdea(): UniversalSessionState {
  return {
    sessionId: 'test-123',
    currentPathway: PathwayType.NEW_IDEA,
    pathwayHistory: [],
    newIdeaState: {
      currentPhase: 'concept_exploration',
      conceptData: {
        concept: 'AI-powered task management',
        targetMarket: 'Small businesses',
        uniqueValue: 'Saves 10 hours per week',
        differentiators: ['AI automation', 'Simple UX']
      },
      marketAnalysis: {
        marketInsights: 'Growing demand for productivity tools'
      },
      progress: {
        currentPhase: 'concept_exploration',
        overallCompletion: 50,
        phaseCompletion: 50,
        timeSpent: 600000,
        startTime: new Date()
      }
    },
    sharedContext: {
      userInputs: ['I want to help small businesses save time'],
      keyInsights: ['Time management is key pain point'],
      recommendations: ['Focus on simplicity'],
      generatedDocuments: []
    },
    globalProgress: {
      overallCompletion: 50,
      pathwayCompletions: { [PathwayType.NEW_IDEA]: 50 },
      timeSpent: { [PathwayType.NEW_IDEA]: 600000 },
      totalSessionTime: 600000
    },
    analytics: {
      pathwaySwitches: 0,
      completionRate: 0.5,
      userBehaviorPatterns: {},
      effectivenessMetrics: {}
    }
  };
}

function createMockStateWithBusinessModel(): UniversalSessionState {
  return {
    sessionId: 'test-123',
    currentPathway: PathwayType.BUSINESS_MODEL,
    pathwayHistory: [],
    businessModelState: {
      currentPhase: 'revenue_analysis',
      businessModelCanvas: {
        customerSegments: 'Small businesses (10-50 employees)',
        valuePropositions: 'Save time with AI automation',
        painPoints: ['Limited time', 'High costs', 'Complexity']
      },
      revenueAnalysis: {
        revenueModel: 'Subscription',
        pricing: '$49/month'
      },
      progress: {
        currentPhase: 'revenue_analysis',
        overallCompletion: 60,
        phaseCompletion: 60,
        timeSpent: 720000,
        startTime: new Date()
      }
    },
    sharedContext: {
      userInputs: ['Focus on subscription revenue'],
      keyInsights: ['SMB market is large and growing'],
      recommendations: ['Tier pricing model'],
      generatedDocuments: []
    },
    globalProgress: {
      overallCompletion: 60,
      pathwayCompletions: { [PathwayType.BUSINESS_MODEL]: 60 },
      timeSpent: { [PathwayType.BUSINESS_MODEL]: 720000 },
      totalSessionTime: 720000
    },
    analytics: {
      pathwaySwitches: 1,
      completionRate: 0.6,
      userBehaviorPatterns: {},
      effectivenessMetrics: {}
    }
  };
}

function createMockStateWithFeatureRefinement(): UniversalSessionState {
  return {
    sessionId: 'test-123',
    currentPathway: PathwayType.FEATURE_REFINEMENT,
    pathwayHistory: [],
    featureRefinementState: {
      currentPhase: 'feature_analysis',
      featureData: {
        featureDescription: 'AI-powered task prioritization',
        targetUsers: 'Busy professionals',
        problemsToSolve: ['Task overload', 'Poor prioritization'],
        featureBenefits: ['Save time', 'Reduce stress']
      },
      userAnalysis: {
        userInsights: 'Users need simple interfaces',
        technicalConstraints: 'Must work offline'
      },
      progress: {
        currentPhase: 'feature_analysis',
        overallCompletion: 40,
        phaseCompletion: 40,
        timeSpent: 480000,
        startTime: new Date()
      }
    },
    sharedContext: {
      userInputs: ['Feature should be easy to use'],
      keyInsights: ['Simplicity is critical'],
      recommendations: ['Mobile-first design'],
      generatedDocuments: []
    },
    globalProgress: {
      overallCompletion: 40,
      pathwayCompletions: { [PathwayType.FEATURE_REFINEMENT]: 40 },
      timeSpent: { [PathwayType.FEATURE_REFINEMENT]: 480000 },
      totalSessionTime: 480000
    },
    analytics: {
      pathwaySwitches: 2,
      completionRate: 0.4,
      userBehaviorPatterns: {},
      effectivenessMetrics: {}
    }
  };
}
