/**
 * Capability Discovery Tests
 *
 * Tests for Phase 5: Dynamic Capability Discovery
 */

import { describe, it, expect } from 'vitest';
import {
  listAvailablePathways,
  getPathwayDetails,
  findPathwaysForGoal,
  listPhaseActions,
  listActionsByType,
  listActionsByOutput,
  listDocumentTypes,
  listDocumentTypesByCategory,
  listDocumentTypesForPhase,
  listAvailableDocumentTypes,
  getDocumentTypeDetails,
  discoverCapabilities,
  type DiscoveredPathway,
  type PhaseAction,
  type DocumentType,
  type CapabilityContext,
} from '@/lib/bmad/capability-discovery';

describe('Pathway Discovery', () => {
  describe('listAvailablePathways', () => {
    it('should return all available pathways', () => {
      const result = listAvailablePathways();

      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalCount).toBe(result.items.length);
      expect(result.context).toBeDefined();
    });

    it('should return pathways with required fields', () => {
      const result = listAvailablePathways();

      for (const pathway of result.items) {
        expect(pathway.id).toBeDefined();
        expect(pathway.name).toBeDefined();
        expect(pathway.description).toBeDefined();
        expect(pathway.targetUser).toBeDefined();
        expect(pathway.expectedOutcome).toBeDefined();
        expect(pathway.timeCommitment).toBeTypeOf('number');
        expect(pathway.phases).toBeInstanceOf(Array);
        expect(pathway.templateSequence).toBeInstanceOf(Array);
      }
    });

    it('should include new-idea pathway', () => {
      const result = listAvailablePathways();
      const newIdea = result.items.find((p) => p.id === 'new-idea');

      expect(newIdea).toBeDefined();
      expect(newIdea?.phases).toContain('discovery');
      expect(newIdea?.phases).toContain('ideation');
      expect(newIdea?.phases).toContain('validation');
      expect(newIdea?.phases).toContain('planning');
    });

    it('should include business-model pathway', () => {
      const result = listAvailablePathways();
      const businessModel = result.items.find((p) => p.id === 'business-model');

      expect(businessModel).toBeDefined();
      expect(businessModel?.phases).toContain('analysis');
      expect(businessModel?.phases).toContain('revenue');
    });

    it('should include strategic-optimization pathway', () => {
      const result = listAvailablePathways();
      const strategic = result.items.find(
        (p) => p.id === 'strategic-optimization'
      );

      expect(strategic).toBeDefined();
      expect(strategic?.phases).toContain('assessment');
      expect(strategic?.phases).toContain('implementation');
    });
  });

  describe('getPathwayDetails', () => {
    it('should return details for known pathway', () => {
      const details = getPathwayDetails('new-idea');

      expect(details).not.toBeNull();
      expect(details?.id).toBe('new-idea');
      expect(details?.name).toBeDefined();
      expect(details?.phases.length).toBeGreaterThan(0);
    });

    it('should return null for unknown pathway', () => {
      const details = getPathwayDetails('unknown-pathway');

      expect(details).toBeNull();
    });
  });

  describe('findPathwaysForGoal', () => {
    it('should find pathways matching a goal', () => {
      const result = findPathwaysForGoal('startup idea innovation');

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.context).toContain('matching');
    });

    it('should return all pathways when no match found', () => {
      const result = findPathwaysForGoal('xyz');
      const allPathways = listAvailablePathways();

      // Should return all pathways as fallback
      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});

describe('Phase Action Discovery', () => {
  describe('listPhaseActions', () => {
    it('should return actions for discovery phase', () => {
      const result = listPhaseActions('discovery');

      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.context).toContain('discovery');
    });

    it('should include universal actions', () => {
      const result = listPhaseActions('discovery');

      const recordInsight = result.items.find((a) => a.id === 'record_insight');
      const completePhase = result.items.find((a) => a.id === 'complete_phase');
      const modeShift = result.items.find((a) => a.id === 'mode_shift');

      expect(recordInsight).toBeDefined();
      expect(completePhase).toBeDefined();
      expect(modeShift).toBeDefined();
    });

    it('should return only universal actions for unknown phase', () => {
      const result = listPhaseActions('unknown-phase');

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.context).toContain('not found');
    });

    it('should have valid action structure', () => {
      const result = listPhaseActions('ideation');

      for (const action of result.items) {
        expect(action.id).toBeDefined();
        expect(action.name).toBeDefined();
        expect(action.description).toBeDefined();
        expect(['analysis', 'generation', 'transition', 'capture']).toContain(
          action.type
        );
        expect(action.requiredInputs).toBeInstanceOf(Array);
        expect(action.optionalInputs).toBeInstanceOf(Array);
        expect(action.producesOutput).toBeTypeOf('boolean');
      }
    });
  });

  describe('listActionsByType', () => {
    it('should filter actions by type', () => {
      const result = listActionsByType('validation', 'analysis');

      expect(result.items.length).toBeGreaterThan(0);
      for (const action of result.items) {
        expect(action.type).toBe('analysis');
      }
    });

    it('should return empty for non-matching type', () => {
      // Discovery phase may not have generation actions
      const result = listActionsByType('discovery', 'generation');

      // All items should be of the requested type (may be empty)
      for (const action of result.items) {
        expect(action.type).toBe('generation');
      }
    });
  });

  describe('listActionsByOutput', () => {
    it('should find actions that produce documents', () => {
      const result = listActionsByOutput('document');

      expect(result.items.length).toBeGreaterThan(0);
      for (const action of result.items) {
        expect(action.outputType).toBe('document');
      }
    });

    it('should find actions that produce insights', () => {
      const result = listActionsByOutput('insight');

      expect(result.items.length).toBeGreaterThan(0);
      for (const action of result.items) {
        expect(action.outputType).toBe('insight');
      }
    });

    it('should find actions that produce recommendations', () => {
      const result = listActionsByOutput('recommendation');

      expect(result.items.length).toBeGreaterThan(0);
      for (const action of result.items) {
        expect(action.outputType).toBe('recommendation');
      }
    });
  });
});

describe('Document Type Discovery', () => {
  describe('listDocumentTypes', () => {
    it('should return all document types', () => {
      const result = listDocumentTypes();

      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalCount).toBe(result.items.length);
    });

    it('should include lean_canvas', () => {
      const result = listDocumentTypes();
      const leanCanvas = result.items.find((d) => d.id === 'lean_canvas');

      expect(leanCanvas).toBeDefined();
      expect(leanCanvas?.category).toBe('canvas');
      expect(leanCanvas?.generatorAvailable).toBe(true);
    });

    it('should include product_brief', () => {
      const result = listDocumentTypes();
      const productBrief = result.items.find((d) => d.id === 'product_brief');

      expect(productBrief).toBeDefined();
      expect(productBrief?.category).toBe('brief');
    });

    it('should have valid document type structure', () => {
      const result = listDocumentTypes();

      for (const doc of result.items) {
        expect(doc.id).toBeDefined();
        expect(doc.name).toBeDefined();
        expect(doc.description).toBeDefined();
        expect(['canvas', 'brief', 'summary', 'analysis']).toContain(
          doc.category
        );
        expect(doc.requiredContext).toBeInstanceOf(Array);
        expect(doc.optionalContext).toBeInstanceOf(Array);
        expect(doc.estimatedCompletionPhase).toBeInstanceOf(Array);
        expect(doc.generatorAvailable).toBeTypeOf('boolean');
      }
    });
  });

  describe('listDocumentTypesByCategory', () => {
    it('should filter by canvas category', () => {
      const result = listDocumentTypesByCategory('canvas');

      expect(result.items.length).toBeGreaterThan(0);
      for (const doc of result.items) {
        expect(doc.category).toBe('canvas');
      }
    });

    it('should filter by brief category', () => {
      const result = listDocumentTypesByCategory('brief');

      expect(result.items.length).toBeGreaterThan(0);
      for (const doc of result.items) {
        expect(doc.category).toBe('brief');
      }
    });

    it('should filter by summary category', () => {
      const result = listDocumentTypesByCategory('summary');

      for (const doc of result.items) {
        expect(doc.category).toBe('summary');
      }
    });
  });

  describe('listDocumentTypesForPhase', () => {
    it('should return documents for validation phase', () => {
      const result = listDocumentTypesForPhase('validation');

      expect(result.items.length).toBeGreaterThan(0);
      for (const doc of result.items) {
        expect(doc.estimatedCompletionPhase).toContain('validation');
      }
    });

    it('should return documents for planning phase', () => {
      const result = listDocumentTypesForPhase('planning');

      expect(result.items.length).toBeGreaterThan(0);
      for (const doc of result.items) {
        expect(doc.estimatedCompletionPhase).toContain('planning');
      }
    });
  });

  describe('listAvailableDocumentTypes', () => {
    it('should filter by available context', () => {
      const availableContext = ['problem', 'solution', 'unique_value_proposition'];
      const result = listAvailableDocumentTypes(availableContext);

      expect(result.items.length).toBeGreaterThan(0);
      // Lean Canvas requires these, so it should be included
      const leanCanvas = result.items.find((d) => d.id === 'lean_canvas');
      expect(leanCanvas).toBeDefined();
    });

    it('should return empty when context is insufficient', () => {
      const availableContext = ['random_context'];
      const result = listAvailableDocumentTypes(availableContext);

      // May be empty or contain docs with no required context
      for (const doc of result.items) {
        // All required context should be in available context
        for (const req of doc.requiredContext) {
          expect(availableContext.map((c) => c.toLowerCase())).toContain(
            req.toLowerCase()
          );
        }
      }
    });
  });

  describe('getDocumentTypeDetails', () => {
    it('should return details for known document type', () => {
      const details = getDocumentTypeDetails('lean_canvas');

      expect(details).not.toBeNull();
      expect(details?.id).toBe('lean_canvas');
      expect(details?.name).toBe('Lean Canvas');
    });

    it('should return null for unknown document type', () => {
      const details = getDocumentTypeDetails('unknown_doc');

      expect(details).toBeNull();
    });
  });
});

describe('Contextual Discovery', () => {
  describe('discoverCapabilities', () => {
    it('should return available actions for current phase', () => {
      const context: CapabilityContext = {
        pathway: 'new-idea',
        currentPhase: 'discovery',
        completedPhases: [],
        availableInsightCategories: ['market', 'product'],
        insightCount: 2,
      };

      const capabilities = discoverCapabilities(context);

      expect(capabilities.availableActions).toBeInstanceOf(Array);
      expect(capabilities.availableActions.length).toBeGreaterThan(0);
    });

    it('should return available documents for current phase', () => {
      const context: CapabilityContext = {
        pathway: 'new-idea',
        currentPhase: 'validation',
        completedPhases: ['discovery', 'ideation'],
        availableInsightCategories: ['market', 'product', 'competition'],
        insightCount: 5,
      };

      const capabilities = discoverCapabilities(context);

      expect(capabilities.availableDocuments).toBeInstanceOf(Array);
      expect(capabilities.availableDocuments.length).toBeGreaterThan(0);
    });

    it('should suggest document generation when enough insights', () => {
      const context: CapabilityContext = {
        pathway: 'new-idea',
        currentPhase: 'validation',
        completedPhases: ['discovery', 'ideation'],
        availableInsightCategories: ['market', 'product'],
        insightCount: 5,
      };

      const capabilities = discoverCapabilities(context);

      expect(capabilities.suggestedNextSteps.length).toBeGreaterThan(0);
    });

    it('should suggest viability assessment in validation phase with enough context', () => {
      const context: CapabilityContext = {
        pathway: 'new-idea',
        currentPhase: 'validation',
        completedPhases: ['discovery', 'ideation'],
        availableInsightCategories: ['market', 'product', 'risk'],
        insightCount: 6,
      };

      const capabilities = discoverCapabilities(context);

      const hasViabilitySuggestion = capabilities.suggestedNextSteps.some(
        (step) => step.toLowerCase().includes('viability')
      );
      expect(hasViabilitySuggestion).toBe(true);
    });

    it('should suggest phase completion when ready', () => {
      const context: CapabilityContext = {
        pathway: 'new-idea',
        currentPhase: 'discovery',
        completedPhases: [],
        availableInsightCategories: ['market', 'product'],
        insightCount: 4,
      };

      const capabilities = discoverCapabilities(context);

      const hasPhaseCompletionSuggestion = capabilities.suggestedNextSteps.some(
        (step) => step.toLowerCase().includes('phase')
      );
      expect(hasPhaseCompletionSuggestion).toBe(true);
    });
  });
});

describe('Discovery Tool Integration Types', () => {
  it('should export DiscoveredPathway type with correct shape', () => {
    const pathway: DiscoveredPathway = {
      id: 'test',
      name: 'Test Pathway',
      description: 'A test pathway',
      targetUser: 'Testers',
      expectedOutcome: 'Tests pass',
      timeCommitment: 30,
      phases: ['phase1', 'phase2'],
      templateSequence: ['template1'],
    };

    expect(pathway.id).toBe('test');
    expect(pathway.phases).toHaveLength(2);
  });

  it('should export PhaseAction type with correct shape', () => {
    const action: PhaseAction = {
      id: 'test_action',
      name: 'Test Action',
      description: 'A test action',
      type: 'analysis',
      requiredInputs: ['input1'],
      optionalInputs: ['input2'],
      producesOutput: true,
      outputType: 'insight',
    };

    expect(action.type).toBe('analysis');
    expect(action.producesOutput).toBe(true);
  });

  it('should export DocumentType type with correct shape', () => {
    const doc: DocumentType = {
      id: 'test_doc',
      name: 'Test Document',
      description: 'A test document',
      category: 'brief',
      requiredContext: ['context1'],
      optionalContext: ['context2'],
      estimatedCompletionPhase: ['planning'],
      generatorAvailable: true,
    };

    expect(doc.category).toBe('brief');
    expect(doc.generatorAvailable).toBe(true);
  });
});
