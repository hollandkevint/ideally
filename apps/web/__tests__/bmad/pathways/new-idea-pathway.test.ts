import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { NewIdeaPathway, createNewIdeaPathway, NewIdeaTimeUtils } from '../../../lib/bmad/pathways/new-idea-pathway';
import { NEW_IDEA_PHASES } from '../../../lib/bmad/templates/new-idea-templates';
import { SessionPhaseStatus } from '../../../lib/bmad/types';

describe('NewIdeaPathway', () => {
  let pathway: NewIdeaPathway;

  beforeEach(() => {
    pathway = createNewIdeaPathway();
  });

  describe('initialization', () => {
    it('should initialize with default session data', () => {
      const sessionData = pathway.getSessionData();
      
      expect(sessionData).toEqual({
        ideationInsights: [],
        marketOpportunities: [],
        uniqueValueProps: [],
        competitiveLandscape: []
      });
    });

    it('should accept initial data during creation', () => {
      const initialData = {
        rawIdea: 'My test idea',
        ideationInsights: ['Initial insight']
      };
      
      const pathwayWithData = createNewIdeaPathway(initialData);
      const sessionData = pathwayWithData.getSessionData();
      
      expect(sessionData.rawIdea).toBe('My test idea');
      expect(sessionData.ideationInsights).toEqual(['Initial insight']);
    });
  });

  describe('phase management', () => {
    it('should start with first phase', () => {
      const currentPhase = pathway.getCurrentPhase();
      expect(currentPhase.id).toBe('ideation');
      expect(currentPhase.name).toBe('Creative Expansion');
    });

    it('should track phase progress correctly', () => {
      pathway.startPhase(0);
      const progress = pathway.getPhaseProgress();
      
      expect(progress).toHaveLength(NEW_IDEA_PHASES.length);
      expect(progress[0].status).toBe('active');
      expect(progress[1].status).toBe('pending');
    });

    it('should advance to next phase when conditions are met', () => {
      // Set up some session data to meet completion requirements
      pathway.updateSessionData({
        ideationInsights: ['Some insight']
      });

      pathway.startPhase(0);
      const { success, nextPhase } = pathway.advanceToNextPhase();
      
      expect(success).toBe(true);
      expect(nextPhase?.id).toBe('market_exploration');
    });

    it('should not advance when phase requirements are not met', () => {
      pathway.startPhase(0);
      // No session data provided - requirements not met
      
      // Mock completeCurrentPhase to return canAdvance: false
      vi.spyOn(pathway as any, 'validatePhaseCompletion').mockReturnValue(false);
      vi.spyOn(pathway as any, 'calculatePhaseTime').mockReturnValue(1000); // 1 second
      
      const { success } = pathway.advanceToNextPhase();
      expect(success).toBe(false);
    });
  });

  describe('time management', () => {
    it('should calculate time allocations correctly', () => {
      const phase = pathway.getCurrentPhase();
      const allocation = pathway.getCurrentPhaseTimeAllocation();
      
      expect(allocation).toBe(phase.timeAllocation * 60 * 1000); // Convert to milliseconds
    });

    it('should track remaining time in session', () => {
      const remainingTime = pathway.getRemainingTime();
      const totalTime = 30 * 60 * 1000; // 30 minutes in milliseconds
      
      expect(remainingTime).toBeLessThanOrEqual(totalTime);
    });

    it('should calculate completion percentage', () => {
      const completion = pathway.getCompletionPercentage();
      expect(completion).toBeGreaterThanOrEqual(0);
      expect(completion).toBeLessThanOrEqual(100);
    });
  });

  describe('session data management', () => {
    it('should update session data correctly', () => {
      const updates = {
        rawIdea: 'Updated idea',
        ideationInsights: ['New insight 1', 'New insight 2']
      };
      
      pathway.updateSessionData(updates);
      const sessionData = pathway.getSessionData();
      
      expect(sessionData.rawIdea).toBe('Updated idea');
      expect(sessionData.ideationInsights).toHaveLength(2);
    });

    it('should merge updates with existing data', () => {
      pathway.updateSessionData({ rawIdea: 'First idea' });
      pathway.updateSessionData({ ideationInsights: ['Insight 1'] });
      
      const sessionData = pathway.getSessionData();
      expect(sessionData.rawIdea).toBe('First idea');
      expect(sessionData.ideationInsights).toEqual(['Insight 1']);
    });
  });

  describe('session completion', () => {
    it('should detect when session is complete', () => {
      expect(pathway.isSessionComplete()).toBe(false);
      
      // Simulate advancing through all phases
      for (let i = 0; i < NEW_IDEA_PHASES.length; i++) {
        pathway.updateSessionData({ ideationInsights: ['test'] }); // Meet requirements
        pathway.advanceToNextPhase();
      }
      
      expect(pathway.isSessionComplete()).toBe(true);
    });

    it('should generate session summary', () => {
      pathway.updateSessionData({
        rawIdea: 'Test idea',
        ideationInsights: ['Insight 1']
      });
      
      const summary = pathway.getSessionSummary();
      
      expect(summary.pathway).toBe('new-idea');
      expect(summary.sessionData.rawIdea).toBe('Test idea');
      expect(summary.completionPercentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('phase validation', () => {
    it('should validate ideation phase completion', () => {
      // Should not be valid without insights
      expect((pathway as any).validatePhaseCompletion(NEW_IDEA_PHASES[0])).toBe(false);
      
      // Should be valid with insights
      pathway.updateSessionData({ ideationInsights: ['Some insight'] });
      expect((pathway as any).validatePhaseCompletion(NEW_IDEA_PHASES[0])).toBe(true);
    });

    it('should validate market exploration phase completion', () => {
      const marketPhase = NEW_IDEA_PHASES.find(p => p.id === 'market_exploration')!;
      
      expect((pathway as any).validatePhaseCompletion(marketPhase)).toBe(false);
      
      pathway.updateSessionData({ 
        marketOpportunities: [{ 
          id: '1', 
          description: 'Opportunity', 
          marketSize: 'Large', 
          growthPotential: 'high' as const, 
          confidence: 0.8, 
          insights: [] 
        }] 
      });
      expect((pathway as any).validatePhaseCompletion(marketPhase)).toBe(true);
    });
  });
});

describe('NewIdeaTimeUtils', () => {
  describe('formatTime', () => {
    it('should format milliseconds correctly', () => {
      expect(NewIdeaTimeUtils.formatTime(0)).toBe('0:00');
      expect(NewIdeaTimeUtils.formatTime(30000)).toBe('0:30');
      expect(NewIdeaTimeUtils.formatTime(60000)).toBe('1:00');
      expect(NewIdeaTimeUtils.formatTime(90000)).toBe('1:30');
      expect(NewIdeaTimeUtils.formatTime(600000)).toBe('10:00');
    });
  });

  describe('getPhaseTimeWarning', () => {
    it('should return correct warning levels', () => {
      const totalTime = 10000; // 10 seconds
      
      expect(NewIdeaTimeUtils.getPhaseTimeWarning(9000, totalTime)).toBe('none');
      expect(NewIdeaTimeUtils.getPhaseTimeWarning(2000, totalTime)).toBe('warning'); // 20%
      expect(NewIdeaTimeUtils.getPhaseTimeWarning(500, totalTime)).toBe('critical'); // 5%
    });
  });

  describe('calculateOptimalPhaseTime', () => {
    it('should calculate optimal time distribution', () => {
      const remainingTime = 600000; // 10 minutes
      const currentPhase = 1; // Second phase
      
      const optimalTime = NewIdeaTimeUtils.calculateOptimalPhaseTime(currentPhase, remainingTime);
      
      // Should distribute remaining time across remaining phases
      const remainingPhases = NEW_IDEA_PHASES.length - currentPhase;
      expect(optimalTime).toBe(remainingTime / remainingPhases);
    });
  });
});

describe('Factory Function', () => {
  it('should create new pathway instance', () => {
    const pathway1 = createNewIdeaPathway();
    const pathway2 = createNewIdeaPathway();
    
    expect(pathway1).toBeInstanceOf(NewIdeaPathway);
    expect(pathway2).toBeInstanceOf(NewIdeaPathway);
    expect(pathway1).not.toBe(pathway2); // Different instances
  });

  it('should create pathway with initial data', () => {
    const initialData = {
      rawIdea: 'Factory test idea',
      ideationInsights: ['Factory insight']
    };
    
    const pathway = createNewIdeaPathway(initialData);
    const sessionData = pathway.getSessionData();
    
    expect(sessionData.rawIdea).toBe('Factory test idea');
    expect(sessionData.ideationInsights).toEqual(['Factory insight']);
  });
});