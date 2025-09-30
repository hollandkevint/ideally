/**
 * Tests for UniversalSessionStateManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  UniversalSessionStateManager,
  UniversalSessionState,
  PathwayTransition
} from '@/lib/bmad/session/universal-state-manager';
import { PathwayType } from '@/lib/bmad/types';

describe('UniversalSessionStateManager', () => {
  let manager: UniversalSessionStateManager;
  const mockSessionId = 'test-session-123';

  beforeEach(() => {
    manager = new UniversalSessionStateManager();
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('State Management', () => {
    it('should save and load session state', async () => {
      const state: UniversalSessionState = createMockState(mockSessionId, PathwayType.NEW_IDEA);

      await manager.saveState(mockSessionId, state);
      const loadedState = await manager.loadState(mockSessionId);

      expect(loadedState.sessionId).toBe(mockSessionId);
      expect(loadedState.currentPathway).toBe(PathwayType.NEW_IDEA);
    });

    it('should cache loaded states', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      await manager.saveState(mockSessionId, state);

      const load1 = await manager.loadState(mockSessionId);
      const load2 = await manager.loadState(mockSessionId);

      expect(load1).toBe(load2); // Same object reference from cache
    });

    it('should handle missing session gracefully', async () => {
      await expect(manager.loadState('non-existent')).rejects.toThrow('Session non-existent not found');
    });
  });

  describe('Pathway Switching', () => {
    it('should switch pathway successfully', async () => {
      const initialState = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      await manager.saveState(mockSessionId, initialState);

      await manager.switchPathway(mockSessionId, PathwayType.BUSINESS_MODEL);

      const updatedState = await manager.loadState(mockSessionId);
      expect(updatedState.currentPathway).toBe(PathwayType.BUSINESS_MODEL);
    });

    it('should record pathway transition history', async () => {
      const initialState = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      await manager.saveState(mockSessionId, initialState);

      await manager.switchPathway(mockSessionId, PathwayType.BUSINESS_MODEL);

      const updatedState = await manager.loadState(mockSessionId);
      expect(updatedState.pathwayHistory.length).toBeGreaterThan(0);

      const lastTransition = updatedState.pathwayHistory[updatedState.pathwayHistory.length - 1];
      expect(lastTransition.fromPathway).toBe(PathwayType.NEW_IDEA);
      expect(lastTransition.toPathway).toBe(PathwayType.BUSINESS_MODEL);
    });

    it('should increment pathway switch counter', async () => {
      const initialState = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      await manager.saveState(mockSessionId, initialState);

      const initialSwitches = initialState.analytics.pathwaySwitches;

      await manager.switchPathway(mockSessionId, PathwayType.BUSINESS_MODEL);

      const updatedState = await manager.loadState(mockSessionId);
      expect(updatedState.analytics.pathwaySwitches).toBe(initialSwitches + 1);
    });

    it('should create backup before switching', async () => {
      const initialState = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      await manager.saveState(mockSessionId, initialState);

      // Mock backup creation to verify it's called
      const createBackupSpy = vi.spyOn(manager, 'createBackup');

      await manager.switchPathway(mockSessionId, PathwayType.BUSINESS_MODEL);

      expect(createBackupSpy).toHaveBeenCalledWith(mockSessionId, 'pathway_switch');
    });

    it('should transfer context when requested', async () => {
      const initialState = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      initialState.sharedContext.keyInsights = ['Test insight 1', 'Test insight 2'];
      await manager.saveState(mockSessionId, initialState);

      await manager.switchPathway(mockSessionId, PathwayType.BUSINESS_MODEL, true);

      const updatedState = await manager.loadState(mockSessionId);
      const lastTransition = updatedState.pathwayHistory[updatedState.pathwayHistory.length - 1];
      expect(lastTransition.contextTransferred).toBe(true);
    });
  });

  describe('Backup and Recovery', () => {
    it('should create backup successfully', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      await manager.saveState(mockSessionId, state);

      const backupId = await manager.createBackup(mockSessionId, 'manual_save');

      expect(backupId).toBeDefined();
      expect(typeof backupId).toBe('string');
    });

    it('should restore from backup', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      state.sharedContext.keyInsights = ['Original insight'];
      await manager.saveState(mockSessionId, state);

      const backupId = await manager.createBackup(mockSessionId, 'manual_save');

      // Modify state
      state.sharedContext.keyInsights = ['Modified insight'];
      await manager.saveState(mockSessionId, state);

      // Restore from backup
      const restoredState = await manager.restoreFromBackup(mockSessionId, backupId);

      expect(restoredState.sharedContext.keyInsights).toContain('Original insight');
    });

    it('should handle missing backup gracefully', async () => {
      await expect(
        manager.restoreFromBackup(mockSessionId, 'non-existent-backup')
      ).rejects.toThrow();
    });

    it('should schedule automatic backups', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      await manager.saveState(mockSessionId, state);

      // Verify auto-backup timer is set
      // Note: This is checking internal state, actual backup happens on interval
      expect(manager['activeBackupTimers'].has(mockSessionId)).toBe(true);
    });
  });

  describe('Session Analytics', () => {
    it('should retrieve session analytics', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      state.analytics = {
        pathwaySwitches: 3,
        completionRate: 0.75,
        userBehaviorPatterns: { activeTime: 1800000 },
        effectivenessMetrics: { engagementScore: 85 }
      };
      await manager.saveState(mockSessionId, state);

      const analytics = await manager.getSessionAnalytics(mockSessionId);

      expect(analytics.pathwaySwitches).toBe(3);
      expect(analytics.completionRate).toBe(0.75);
    });

    it('should return default analytics for new session', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      await manager.saveState(mockSessionId, state);

      const analytics = await manager.getSessionAnalytics(mockSessionId);

      expect(analytics.pathwaySwitches).toBe(0);
      expect(analytics.completionRate).toBe(0);
    });
  });

  describe('Real-time Sync', () => {
    it('should sync partial state updates', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      await manager.saveState(mockSessionId, state);

      const partialUpdate = {
        sharedContext: {
          ...state.sharedContext,
          keyInsights: [...state.sharedContext.keyInsights, 'New insight']
        }
      };

      await manager.syncSessionState(mockSessionId, partialUpdate);

      const updatedState = await manager.loadState(mockSessionId);
      expect(updatedState.sharedContext.keyInsights).toContain('New insight');
    });
  });

  describe('Shared Context', () => {
    it('should extract shared context from session data', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      state.sharedContext.userInputs = ['Input 1', 'Input 2'];
      state.sharedContext.keyInsights = ['Insight 1', 'Insight 2'];
      await manager.saveState(mockSessionId, state);

      const loadedState = await manager.loadState(mockSessionId);

      expect(loadedState.sharedContext.userInputs.length).toBe(2);
      expect(loadedState.sharedContext.keyInsights.length).toBe(2);
    });

    it('should preserve documents across pathways', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      state.sharedContext.generatedDocuments = [
        { id: 'doc1', type: 'concept-brief', content: 'Test content' }
      ];
      await manager.saveState(mockSessionId, state);

      await manager.switchPathway(mockSessionId, PathwayType.BUSINESS_MODEL);

      const updatedState = await manager.loadState(mockSessionId);
      expect(updatedState.sharedContext.generatedDocuments.length).toBe(1);
    });
  });

  describe('Global Progress', () => {
    it('should calculate global progress correctly', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      state.globalProgress = {
        overallCompletion: 60,
        pathwayCompletions: {
          [PathwayType.NEW_IDEA]: 60
        },
        timeSpent: {
          [PathwayType.NEW_IDEA]: 600000 // 10 minutes
        },
        totalSessionTime: 600000
      };
      await manager.saveState(mockSessionId, state);

      const loadedState = await manager.loadState(mockSessionId);

      expect(loadedState.globalProgress.overallCompletion).toBe(60);
      expect(loadedState.globalProgress.totalSessionTime).toBeGreaterThanOrEqual(0);
    });

    it('should update progress across pathways', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      state.globalProgress.pathwayCompletions = {
        [PathwayType.NEW_IDEA]: 100
      };
      await manager.saveState(mockSessionId, state);

      await manager.switchPathway(mockSessionId, PathwayType.BUSINESS_MODEL);

      // Simulate progress in new pathway
      const updatedState = await manager.loadState(mockSessionId);
      updatedState.globalProgress.pathwayCompletions[PathwayType.BUSINESS_MODEL] = 40;
      await manager.saveState(mockSessionId, updatedState);

      const finalState = await manager.loadState(mockSessionId);
      expect(finalState.globalProgress.pathwayCompletions[PathwayType.NEW_IDEA]).toBe(100);
      expect(finalState.globalProgress.pathwayCompletions[PathwayType.BUSINESS_MODEL]).toBe(40);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup specific session resources', async () => {
      const state = createMockState(mockSessionId, PathwayType.NEW_IDEA);
      await manager.saveState(mockSessionId, state);

      manager.cleanup(mockSessionId);

      expect(manager['activeBackupTimers'].has(mockSessionId)).toBe(false);
      expect(manager['stateCache'].has(mockSessionId)).toBe(false);
    });

    it('should cleanup all sessions', async () => {
      const session1 = createMockState('session-1', PathwayType.NEW_IDEA);
      const session2 = createMockState('session-2', PathwayType.BUSINESS_MODEL);

      await manager.saveState('session-1', session1);
      await manager.saveState('session-2', session2);

      manager.cleanup();

      expect(manager['activeBackupTimers'].size).toBe(0);
      expect(manager['stateCache'].size).toBe(0);
    });
  });
});

// Helper function to create mock state
function createMockState(sessionId: string, pathway: PathwayType): UniversalSessionState {
  return {
    sessionId,
    currentPathway: pathway,
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
}
