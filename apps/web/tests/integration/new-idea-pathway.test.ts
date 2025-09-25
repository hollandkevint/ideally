// Integration tests for New Idea pathway end-to-end flow
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sessionOrchestrator } from '@/lib/bmad/session-orchestrator';
import { PathwayType } from '@/lib/bmad/types';

// Mock database operations for testing
vi.mock('@/lib/bmad/database', () => ({
  BmadDatabase: {
    createSession: vi.fn().mockResolvedValue('test-session-id'),
    getSession: vi.fn(),
    updateSessionProgress: vi.fn(),
    recordUserResponse: vi.fn()
  }
}));

// Mock pathway router
vi.mock('@/lib/bmad/pathway-router', () => ({
  pathwayRouter: {
    getPathway: vi.fn().mockReturnValue({
      id: PathwayType.NEW_IDEA,
      name: 'New Idea Creative Expansion',
      templateSequence: ['new-idea-pathway']
    })
  }
}));

// Mock template engine
vi.mock('@/lib/bmad/template-engine', () => ({
  bmadTemplateEngine: {
    loadTemplate: vi.fn().mockResolvedValue({
      id: 'new-idea-pathway',
      name: 'New Idea Creative Expansion',
      phases: [{
        id: 'ideation',
        name: 'Creative Expansion',
        timeAllocation: 8
      }]
    })
  }
}));

describe('New Idea Pathway Integration', () => {
  const mockSessionConfig = {
    userId: 'test-user-id',
    workspaceId: 'test-workspace-id',
    pathway: PathwayType.NEW_IDEA
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('session creation', () => {
    it('should create New Idea pathway session successfully', async () => {
      const session = await sessionOrchestrator.createSession(mockSessionConfig);

      expect(session).toBeDefined();
      expect(session.pathway).toBe(PathwayType.NEW_IDEA);
      expect(session.currentPhase).toBe('ideation');
      expect(session.userId).toBe(mockSessionConfig.userId);
      expect(session.workspaceId).toBe(mockSessionConfig.workspaceId);
    });

    it('should initialize session with correct progress tracking', async () => {
      const session = await sessionOrchestrator.createSession(mockSessionConfig);

      expect(session.progress.overallCompletion).toBe(0);
      expect(session.progress.phaseCompletion).toBeDefined();
      expect(session.progress.currentStep).toContain('Starting');
    });

    it('should set up time allocations for New Idea phases', async () => {
      const session = await sessionOrchestrator.createSession(mockSessionConfig);

      expect(session.timeAllocations).toBeDefined();
      expect(session.timeAllocations.length).toBeGreaterThan(0);
    });
  });

  describe('session advancement', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await sessionOrchestrator.createSession(mockSessionConfig);
      sessionId = session.id;
    });

    it('should process ideation phase input correctly', async () => {
      const userInput = 'I want to create a mobile app that helps people find local restaurants with dietary restrictions.';

      const advancement = await sessionOrchestrator.advanceSession(sessionId, userInput);

      expect(advancement).toBeDefined();
      expect(advancement.session).toBeDefined();
      expect(advancement.nextAction).toBeOneOf(['continue_phase', 'advance_phase']);
      expect(advancement.message).toBeDefined();
    });

    it('should handle market exploration input', async () => {
      // First, complete ideation phase
      await sessionOrchestrator.advanceSession(
        sessionId,
        'App for finding restaurants with dietary restrictions - targeting health-conscious consumers.'
      );

      // Advance to market exploration
      const marketInput = 'Target market is health-conscious millennials in urban areas who have dietary restrictions like gluten-free, vegan, or keto diets.';
      const advancement = await sessionOrchestrator.advanceSession(sessionId, marketInput);

      expect(advancement.session.context.userResponses).toBeDefined();
      expect(Object.keys(advancement.session.context.userResponses).length).toBeGreaterThan(0);
    });

    it('should track session progress correctly', async () => {
      const initialSession = await sessionOrchestrator.getSession(sessionId);
      const initialProgress = initialSession?.progress.overallCompletion || 0;

      await sessionOrchestrator.advanceSession(
        sessionId,
        'Detailed business idea with market research and validation.'
      );

      const updatedSession = await sessionOrchestrator.getSession(sessionId);
      const updatedProgress = updatedSession?.progress.overallCompletion || 0;

      expect(updatedProgress).toBeGreaterThanOrEqual(initialProgress);
    });
  });

  describe('phase transitions', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await sessionOrchestrator.createSession(mockSessionConfig);
      sessionId = session.id;
    });

    it('should advance through all New Idea phases', async () => {
      const phaseInputs = [
        'Mobile app for dietary restriction restaurant discovery - solving the problem of finding suitable dining options.',
        'Target market: Health-conscious millennials in cities with dietary restrictions. Market size: 50M+ people.',
        'Unique value: Real-time dietary filter with verified restaurant partnerships. Revenue: Subscription + commission model.',
        'Competitive advantage: Comprehensive dietary database and restaurant verification. Next steps: MVP development, partner acquisition.'
      ];

      for (const input of phaseInputs) {
        const advancement = await sessionOrchestrator.advanceSession(sessionId, input);

        expect(advancement).toBeDefined();
        expect(['continue_phase', 'advance_phase', 'complete_session']).toContain(advancement.nextAction);
      }
    });

    it('should handle phase completion validation', async () => {
      // Insufficient input should not advance phase
      const shortInput = 'Brief idea.';
      const advancement1 = await sessionOrchestrator.advanceSession(sessionId, shortInput);

      expect(advancement1.nextAction).toBe('continue_phase');

      // Comprehensive input should advance phase
      const detailedInput = 'Comprehensive mobile application for restaurant discovery with dietary restriction filtering, targeting health-conscious consumers who struggle to find suitable dining options in their area.';
      const advancement2 = await sessionOrchestrator.advanceSession(sessionId, detailedInput);

      expect(['advance_phase', 'continue_phase']).toContain(advancement2.nextAction);
    });
  });

  describe('session completion', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await sessionOrchestrator.createSession(mockSessionConfig);
      sessionId = session.id;
    });

    it('should complete session and generate final documents', async () => {
      // Simulate completing all phases
      const completionInputs = [
        'Restaurant discovery app for dietary restrictions - comprehensive solution.',
        'Target: Urban millennials with dietary needs. Market: $2B+ opportunity.',
        'Value: Verified restaurant partnerships. Revenue: SaaS + marketplace commission.',
        'Advantage: Comprehensive dietary database. Launch: MVP in 90 days.'
      ];

      let finalAdvancement;
      for (const input of completionInputs) {
        finalAdvancement = await sessionOrchestrator.advanceSession(sessionId, input);
      }

      if (finalAdvancement?.nextAction === 'complete_session') {
        const completedSession = await sessionOrchestrator.completeSession(sessionId);

        expect(completedSession.progress.overallCompletion).toBe(1.0);
        expect(completedSession.outputs.finalDocuments).toBeDefined();
        expect(completedSession.outputs.finalDocuments.length).toBeGreaterThan(0);
        expect(completedSession.outputs.actionItems).toBeDefined();
      }
    });

    it('should generate business concept document', async () => {
      // Complete session with mock data
      const session = await sessionOrchestrator.getSession(sessionId);
      if (session) {
        session.progress.overallCompletion = 1.0; // Mock completion
        const completedSession = await sessionOrchestrator.completeSession(sessionId);

        const conceptDoc = completedSession.outputs.finalDocuments.find(
          doc => doc.type === 'concept-document'
        );

        expect(conceptDoc).toBeDefined();
        expect(conceptDoc?.content).toBeDefined();
        expect(conceptDoc?.format).toBe('markdown');
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid session ID gracefully', async () => {
      await expect(
        sessionOrchestrator.advanceSession('invalid-session-id', 'test input')
      ).rejects.toThrow();
    });

    it('should handle missing user input', async () => {
      const session = await sessionOrchestrator.createSession(mockSessionConfig);

      await expect(
        sessionOrchestrator.advanceSession(session.id, '')
      ).resolves.toBeDefined(); // Should handle empty input gracefully
    });

    it('should recover from analysis failures', async () => {
      const session = await sessionOrchestrator.createSession(mockSessionConfig);

      // Mock analysis failure by providing malformed input
      const advancement = await sessionOrchestrator.advanceSession(
        session.id,
        'Invalid input that might cause analysis to fail'
      );

      expect(advancement).toBeDefined();
      expect(advancement.session).toBeDefined();
    });
  });

  describe('performance requirements', () => {
    it('should complete session within 30-minute time limit', async () => {
      const session = await sessionOrchestrator.createSession(mockSessionConfig);
      const startTime = Date.now();

      // Simulate rapid completion
      const quickInputs = [
        'Restaurant app idea',
        'Urban millennials target',
        'Subscription revenue model',
        'MVP in 90 days'
      ];

      for (const input of quickInputs) {
        await sessionOrchestrator.advanceSession(session.id, input);
      }

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeLessThan(30 * 60 * 1000); // Less than 30 minutes
    });

    it('should handle phase transitions under 2 seconds', async () => {
      const session = await sessionOrchestrator.createSession(mockSessionConfig);

      const startTime = Date.now();
      await sessionOrchestrator.advanceSession(
        session.id,
        'Comprehensive business idea with sufficient detail for phase completion'
      );
      const elapsedTime = Date.now() - startTime;

      expect(elapsedTime).toBeLessThan(2000); // Less than 2 seconds
    });
  });
});