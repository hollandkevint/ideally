// Unit tests for New Idea pathway logic
import { describe, it, expect, beforeEach } from 'vitest';
import { NewIdeaPathway, NewIdeaTimeUtils } from '@/lib/bmad/pathways/new-idea-pathway';
import { NEW_IDEA_PHASES } from '@/lib/bmad/templates/new-idea-templates';
import { PathwayType } from '@/lib/bmad/types';

describe('NewIdeaPathway', () => {
  let pathway: NewIdeaPathway;

  beforeEach(() => {
    pathway = new NewIdeaPathway();
  });

  describe('initialization', () => {
    it('should initialize with correct starting state', () => {
      expect(pathway.getCurrentPhase().id).toBe('ideation');
      expect(pathway.getSessionData().ideationInsights).toEqual([]);
      expect(pathway.getSessionData().marketOpportunities).toEqual([]);
      expect(pathway.getSessionData().uniqueValueProps).toEqual([]);
      expect(pathway.getSessionData().competitiveLandscape).toEqual([]);
    });

    it('should start first phase automatically', () => {
      pathway.startPhase();
      expect(pathway.getCurrentPhase().id).toBe('ideation');
      expect(pathway.getCurrentPhase().name).toBe('Creative Expansion');
    });
  });

  describe('phase progression', () => {
    beforeEach(() => {
      pathway.startPhase();
    });

    it('should advance through all phases correctly', () => {
      const expectedPhases = ['ideation', 'market_exploration', 'concept_refinement', 'positioning'];

      expectedPhases.forEach((expectedPhaseId, index) => {
        const currentPhase = pathway.getCurrentPhase();
        expect(currentPhase.id).toBe(expectedPhaseId);

        if (index < expectedPhases.length - 1) {
          // Add required session data to enable phase completion
          switch (expectedPhaseId) {
            case 'ideation':
              pathway.updateSessionData({ ideationInsights: ['Test insight'] });
              break;
            case 'market_exploration':
              pathway.updateSessionData({
                marketOpportunities: [{
                  id: 'test',
                  description: 'Test opportunity',
                  marketSize: '$1M',
                  growthPotential: 'high' as const,
                  confidence: 0.8,
                  insights: ['Test insight']
                }]
              });
              break;
            case 'concept_refinement':
              pathway.updateSessionData({ uniqueValueProps: ['Test value prop'] });
              break;
          }

          const result = pathway.advanceToNextPhase();
          expect(result.success).toBe(true);
          expect(result.nextPhase).toBeTruthy();
        }
      });
    });

    it('should not advance to next phase if current phase is not complete', () => {
      // Don't complete current phase
      const result = pathway.advanceToNextPhase();
      expect(result.success).toBe(false);
      expect(result.nextPhase).toBeNull();
    });

    it('should complete session when all phases are finished', () => {
      // Complete all phases with required data
      const phases = ['ideation', 'market_exploration', 'concept_refinement', 'positioning'];

      phases.forEach((phaseId, index) => {
        // Add required data for each phase
        switch (phaseId) {
          case 'ideation':
            pathway.updateSessionData({ ideationInsights: ['Test insight'] });
            break;
          case 'market_exploration':
            pathway.updateSessionData({
              marketOpportunities: [{
                id: 'test',
                description: 'Test opportunity',
                marketSize: '$1M',
                growthPotential: 'high' as const,
                confidence: 0.8,
                insights: ['Test insight']
              }]
            });
            break;
          case 'concept_refinement':
            pathway.updateSessionData({ uniqueValueProps: ['Test value prop'] });
            break;
          case 'positioning':
            pathway.updateSessionData({
              businessModelElements: {
                revenueStreams: ['Test revenue'],
                costStructure: [],
                keyActivities: [],
                keyResources: [],
                channels: [],
                customerRelationships: []
              }
            });
            break;
        }

        pathway.completeCurrentPhase();
        const result = pathway.advanceToNextPhase();

        // If this is the last phase, advancement should indicate completion
        if (index === phases.length - 1) {
          expect(result.nextPhase).toBeNull(); // No more phases
        }
      });

      expect(pathway.isSessionComplete()).toBe(true);
    });
  });

  describe('time management', () => {
    beforeEach(() => {
      pathway.startPhase();
    });

    it('should track time allocation for each phase', () => {
      const timeAllocation = pathway.getCurrentPhaseTimeAllocation();
      expect(timeAllocation).toBe(NEW_IDEA_PHASES[0].timeAllocation * 60 * 1000); // 8 minutes in ms
    });

    it('should calculate remaining time correctly', () => {
      const remainingTime = pathway.getRemainingPhaseTime();
      expect(remainingTime).toBeGreaterThan(0);
      expect(remainingTime).toBeLessThanOrEqual(NEW_IDEA_PHASES[0].timeAllocation * 60 * 1000);
    });

    it('should track total session time correctly', () => {
      const totalTime = pathway.getRemainingTime();
      expect(totalTime).toBe(30 * 60 * 1000); // 30 minutes in ms
    });
  });

  describe('session data management', () => {
    beforeEach(() => {
      pathway.startPhase();
    });

    it('should update session data correctly', () => {
      const testData = {
        rawIdea: 'Test business idea',
        ideationInsights: ['Insight 1', 'Insight 2']
      };

      pathway.updateSessionData(testData);
      const sessionData = pathway.getSessionData();

      expect(sessionData.rawIdea).toBe('Test business idea');
      expect(sessionData.ideationInsights).toEqual(['Insight 1', 'Insight 2']);
    });

    it('should preserve existing data when updating', () => {
      pathway.updateSessionData({ rawIdea: 'Initial idea' });
      pathway.updateSessionData({ ideationInsights: ['New insight'] });

      const sessionData = pathway.getSessionData();
      expect(sessionData.rawIdea).toBe('Initial idea');
      expect(sessionData.ideationInsights).toEqual(['New insight']);
    });
  });

  describe('completion tracking', () => {
    it('should track completion percentage correctly', () => {
      pathway.startPhase();

      // Initial completion should be 0
      expect(pathway.getCompletionPercentage()).toBe(0);

      // Mock time passage by directly accessing private property (for testing only)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pathway as any).totalElapsedTime = 10 * 60 * 1000; // 10 minutes

      const completion = pathway.getCompletionPercentage();
      expect(completion).toBeGreaterThan(0);
      expect(completion).toBeLessThanOrEqual(100);
    });

    it('should generate session summary correctly', () => {
      pathway.startPhase();
      pathway.updateSessionData({
        rawIdea: 'Test idea',
        ideationInsights: ['Insight 1']
      });

      const summary = pathway.getSessionSummary();

      expect(summary.pathway).toBe(PathwayType.NEW_IDEA);
      expect(summary.totalPhases).toBe(NEW_IDEA_PHASES.length);
      expect(summary.sessionData.rawIdea).toBe('Test idea');
    });
  });

  describe('phase validation', () => {
    beforeEach(() => {
      pathway.startPhase();
    });

    it('should validate ideation phase completion', () => {
      // Empty ideation insights should not allow completion
      let { canAdvance } = pathway.completeCurrentPhase();
      expect(canAdvance).toBe(false);

      // Add insights and check again
      pathway.updateSessionData({
        ideationInsights: ['Valid insight']
      });

      ({ canAdvance } = pathway.completeCurrentPhase());
      expect(canAdvance).toBe(true);
    });

    it('should validate market exploration phase completion', () => {
      // Advance to market exploration phase
      pathway.updateSessionData({ ideationInsights: ['Insight'] });
      pathway.completeCurrentPhase();
      pathway.advanceToNextPhase();

      // Empty market opportunities should not allow completion
      let { canAdvance } = pathway.completeCurrentPhase();
      expect(canAdvance).toBe(false);

      // Add market opportunities
      pathway.updateSessionData({
        marketOpportunities: [{
          id: 'test',
          description: 'Test opportunity',
          marketSize: '$1M',
          growthPotential: 'high' as const,
          confidence: 0.8,
          insights: ['Test insight']
        }]
      });

      ({ canAdvance } = pathway.completeCurrentPhase());
      expect(canAdvance).toBe(true);
    });
  });
});

describe('NewIdeaTimeUtils', () => {
  describe('formatTime', () => {
    it('should format time correctly', () => {
      expect(NewIdeaTimeUtils.formatTime(60000)).toBe('1:00'); // 1 minute
      expect(NewIdeaTimeUtils.formatTime(90000)).toBe('1:30'); // 1.5 minutes
      expect(NewIdeaTimeUtils.formatTime(3661000)).toBe('61:01'); // 61 minutes, 1 second
    });
  });

  describe('getPhaseTimeWarning', () => {
    it('should return correct warning levels', () => {
      const totalTime = 100000; // 100 seconds

      expect(NewIdeaTimeUtils.getPhaseTimeWarning(50000, totalTime)).toBe('none'); // 50%
      expect(NewIdeaTimeUtils.getPhaseTimeWarning(20000, totalTime)).toBe('warning'); // 20%
      expect(NewIdeaTimeUtils.getPhaseTimeWarning(5000, totalTime)).toBe('critical'); // 5%
    });
  });

  describe('calculateOptimalPhaseTime', () => {
    it('should calculate optimal time distribution', () => {
      const remainingTime = 1200000; // 20 minutes
      const currentPhase = 1; // Second phase (0-indexed)

      const optimalTime = NewIdeaTimeUtils.calculateOptimalPhaseTime(currentPhase, remainingTime);
      const remainingPhases = NEW_IDEA_PHASES.length - currentPhase;

      expect(optimalTime).toBe(remainingTime / remainingPhases);
    });
  });
});

describe('New Idea Pathway Integration', () => {
  it('should work with the phase template system', () => {
    const pathway = new NewIdeaPathway();

    // Check that all template phases are accessible
    NEW_IDEA_PHASES.forEach((templatePhase, index) => {
      pathway.startPhase(index);
      const currentPhase = pathway.getCurrentPhase();

      expect(currentPhase.id).toBe(templatePhase.id);
      expect(currentPhase.name).toBe(templatePhase.name);
      expect(currentPhase.timeAllocation).toBe(templatePhase.timeAllocation);
    });
  });

  it('should handle error scenarios gracefully', () => {
    const pathway = new NewIdeaPathway();

    // Try to advance without starting
    const result = pathway.advanceToNextPhase();
    expect(result.success).toBe(false);

    // Try to get remaining time without starting
    const remainingTime = pathway.getRemainingTime();
    expect(remainingTime).toBeGreaterThanOrEqual(0);
  });
});