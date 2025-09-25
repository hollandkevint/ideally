import {
  BmadSession,
  PathwayType,
  SessionProgress,
  SessionContext,
  SessionOutputs
} from '../types';
import { BmadDatabase } from '../database';

/**
 * Universal Session State for cross-pathway management
 */
export interface UniversalSessionState {
  sessionId: string;
  currentPathway: PathwayType;
  pathwayHistory: PathwayTransition[];

  // Consolidated pathway states
  newIdeaState?: NewIdeaSessionState;
  businessModelState?: BusinessModelSessionState;
  featureRefinementState?: FeatureRefinementSessionState;

  // Cross-pathway data
  sharedContext: SharedSessionContext;
  globalProgress: GlobalProgressTracker;
  analytics: SessionAnalytics;
}

export interface SharedSessionContext {
  userInputs: string[];
  keyInsights: string[];
  recommendations: string[];
  generatedDocuments: Document[];
}

export interface PathwayTransition {
  fromPathway: PathwayType | null;
  toPathway: PathwayType;
  reason: 'user_choice' | 'recommendation' | 'error_recovery';
  timestamp: Date;
  contextTransferred: boolean;
}

export interface GlobalProgressTracker {
  overallCompletion: number;
  pathwayCompletions: { [pathway: string]: number };
  timeSpent: { [pathway: string]: number };
  totalSessionTime: number;
}

export interface SessionAnalytics {
  pathwaySwitches: number;
  completionRate: number;
  userBehaviorPatterns: Record<string, unknown>;
  effectivenessMetrics: Record<string, number>;
}

// Pathway-specific state interfaces
export interface NewIdeaSessionState {
  currentPhase: string;
  conceptData: Record<string, unknown>;
  marketAnalysis: Record<string, unknown>;
  progress: SessionProgress;
}

export interface BusinessModelSessionState {
  currentPhase: string;
  businessModelCanvas: Record<string, unknown>;
  revenueAnalysis: Record<string, unknown>;
  progress: SessionProgress;
}

export interface FeatureRefinementSessionState {
  currentPhase: string;
  featureData: Record<string, unknown>;
  userAnalysis: Record<string, unknown>;
  progress: SessionProgress;
}

export type BackupType = 'auto_backup' | 'pathway_switch' | 'manual_save' | 'error_recovery';

/**
 * Universal Session State Manager
 * Manages cross-pathway session state, backups, and transitions
 */
export class UniversalSessionStateManager {
  private database: BmadDatabase;
  private stateCache = new Map<string, UniversalSessionState>();
  private backupInterval: number = 120000; // 2 minutes
  private activeBackupTimers = new Map<string, NodeJS.Timeout>();

  constructor(database?: BmadDatabase) {
    this.database = database || new BmadDatabase();
  }

  /**
   * Save universal session state
   */
  async saveState(sessionId: string, state: UniversalSessionState): Promise<void> {
    try {
      // Update cache
      this.stateCache.set(sessionId, state);

      // Save to database
      await this.database.saveSessionState(sessionId, {
        session_state: state,
        pathway_history: state.pathwayHistory,
        analytics_data: state.analytics,
        updated_at: new Date()
      });

      // Schedule automatic backup if not already scheduled
      this.scheduleAutoBackup(sessionId);

    } catch (error) {
      throw new Error(`Failed to save session state: ${error}`);
    }
  }

  /**
   * Load universal session state
   */
  async loadState(sessionId: string): Promise<UniversalSessionState> {
    try {
      // Check cache first
      const cachedState = this.stateCache.get(sessionId);
      if (cachedState) {
        return cachedState;
      }

      // Load from database
      const sessionData = await this.database.getSession(sessionId);
      if (!sessionData) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const universalState: UniversalSessionState = {
        sessionId,
        currentPathway: sessionData.pathway,
        pathwayHistory: sessionData.pathway_history || [],
        sharedContext: this.extractSharedContext(sessionData),
        globalProgress: this.calculateGlobalProgress(sessionData),
        analytics: sessionData.analytics_data || this.createDefaultAnalytics()
      };

      // Load pathway-specific state
      await this.loadPathwayStates(universalState, sessionData);

      // Cache the loaded state
      this.stateCache.set(sessionId, universalState);

      return universalState;

    } catch (error) {
      throw new Error(`Failed to load session state: ${error}`);
    }
  }

  /**
   * Switch pathway with context transfer
   */
  async switchPathway(
    sessionId: string,
    newPathway: PathwayType,
    transferContext: boolean = true
  ): Promise<void> {
    try {
      const currentState = await this.loadState(sessionId);

      // Create backup before switching
      await this.createBackup(sessionId, 'pathway_switch');

      const transition: PathwayTransition = {
        fromPathway: currentState.currentPathway,
        toPathway: newPathway,
        reason: 'user_choice',
        timestamp: new Date(),
        contextTransferred: transferContext
      };

      // Transfer context if requested
      if (transferContext) {
        await this.transferContext(currentState, newPathway);
      }

      // Update state
      currentState.currentPathway = newPathway;
      currentState.pathwayHistory.push(transition);
      currentState.analytics.pathwaySwitches++;

      // Save updated state
      await this.saveState(sessionId, currentState);

      // Update session in database
      await this.database.updateSession(sessionId, {
        pathway: newPathway,
        current_phase: this.getInitialPhaseForPathway(newPathway),
        pathway_history: currentState.pathwayHistory,
        updated_at: new Date()
      });

    } catch (error) {
      throw new Error(`Failed to switch pathway: ${error}`);
    }
  }

  /**
   * Create session backup
   */
  async createBackup(sessionId: string, backupType: BackupType): Promise<string> {
    try {
      const state = await this.loadState(sessionId);
      const backupId = `backup_${sessionId}_${Date.now()}`;

      await this.database.createSessionSnapshot({
        id: backupId,
        session_id: sessionId,
        snapshot_type: backupType,
        session_state: state,
        pathway_context: state.currentPathway,
        created_at: new Date()
      });

      return backupId;

    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(sessionId: string, backupId: string): Promise<UniversalSessionState> {
    try {
      const snapshot = await this.database.getSessionSnapshot(backupId);
      if (!snapshot || snapshot.session_id !== sessionId) {
        throw new Error(`Backup ${backupId} not found for session ${sessionId}`);
      }

      const restoredState = snapshot.session_state as UniversalSessionState;

      // Update current state
      await this.saveState(sessionId, restoredState);

      // Update main session record
      await this.database.updateSession(sessionId, {
        pathway: restoredState.currentPathway,
        current_phase: this.getCurrentPhaseFromState(restoredState),
        updated_at: new Date()
      });

      return restoredState;

    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error}`);
    }
  }

  /**
   * Real-time state synchronization
   */
  async syncSessionState(sessionId: string, partialUpdate: Partial<UniversalSessionState>): Promise<void> {
    try {
      const currentState = await this.loadState(sessionId);
      const updatedState = { ...currentState, ...partialUpdate };

      await this.saveState(sessionId, updatedState);

    } catch (error) {
      throw new Error(`Failed to sync session state: ${error}`);
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
    try {
      const state = await this.loadState(sessionId);
      return state.analytics;

    } catch (error) {
      throw new Error(`Failed to get session analytics: ${error}`);
    }
  }

  // Private helper methods

  private scheduleAutoBackup(sessionId: string): void {
    // Clear existing timer
    const existingTimer = this.activeBackupTimers.get(sessionId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Schedule new backup timer
    const timer = setInterval(async () => {
      try {
        await this.createBackup(sessionId, 'auto_backup');
      } catch (error) {
        console.error(`Auto-backup failed for session ${sessionId}:`, error);
      }
    }, this.backupInterval);

    this.activeBackupTimers.set(sessionId, timer);
  }

  private extractSharedContext(sessionData: any): SharedSessionContext {
    return {
      userInputs: sessionData.context?.userResponses ?
        Object.values(sessionData.context.userResponses).map((r: any) => r.text).filter(Boolean) : [],
      keyInsights: sessionData.outputs?.actionItems?.map((a: any) => a.description) || [],
      recommendations: [], // Extract from session outputs
      generatedDocuments: sessionData.outputs?.finalDocuments || []
    };
  }

  private calculateGlobalProgress(sessionData: any): GlobalProgressTracker {
    return {
      overallCompletion: sessionData.progress?.overallCompletion || 0,
      pathwayCompletions: { [sessionData.pathway]: sessionData.progress?.overallCompletion || 0 },
      timeSpent: { [sessionData.pathway]: this.calculateTimeSpent(sessionData) },
      totalSessionTime: this.calculateTimeSpent(sessionData)
    };
  }

  private calculateTimeSpent(sessionData: any): number {
    if (!sessionData.startTime) return 0;
    const start = new Date(sessionData.startTime);
    const now = new Date();
    return now.getTime() - start.getTime();
  }

  private createDefaultAnalytics(): SessionAnalytics {
    return {
      pathwaySwitches: 0,
      completionRate: 0,
      userBehaviorPatterns: {},
      effectivenessMetrics: {}
    };
  }

  private async loadPathwayStates(state: UniversalSessionState, sessionData: any): Promise<void> {
    // Load pathway-specific states based on pathway history and current pathway
    switch (state.currentPathway) {
      case PathwayType.NEW_IDEA:
        state.newIdeaState = {
          currentPhase: sessionData.currentPhase,
          conceptData: sessionData.outputs?.phaseOutputs || {},
          marketAnalysis: {}, // Extract from session data
          progress: sessionData.progress
        };
        break;
      case PathwayType.BUSINESS_MODEL:
        state.businessModelState = {
          currentPhase: sessionData.currentPhase,
          businessModelCanvas: sessionData.outputs?.phaseOutputs || {},
          revenueAnalysis: {},
          progress: sessionData.progress
        };
        break;
      case PathwayType.FEATURE_REFINEMENT:
        state.featureRefinementState = {
          currentPhase: sessionData.currentPhase,
          featureData: sessionData.outputs?.phaseOutputs || {},
          userAnalysis: {},
          progress: sessionData.progress
        };
        break;
    }
  }

  private async transferContext(currentState: UniversalSessionState, newPathway: PathwayType): Promise<void> {
    // Implement intelligent context transfer logic
    const sharedContext = currentState.sharedContext;

    // Map shared insights to new pathway context
    switch (newPathway) {
      case PathwayType.NEW_IDEA:
        // Transfer business insights to new idea development
        break;
      case PathwayType.BUSINESS_MODEL:
        // Transfer concept data to business model analysis
        break;
      case PathwayType.FEATURE_REFINEMENT:
        // Transfer user insights to feature refinement
        break;
    }
  }

  private getInitialPhaseForPathway(pathway: PathwayType): string {
    // Return initial phase ID for each pathway
    switch (pathway) {
      case PathwayType.NEW_IDEA:
        return 'concept_exploration';
      case PathwayType.BUSINESS_MODEL:
        return 'business_model_canvas';
      case PathwayType.FEATURE_REFINEMENT:
        return 'feature_analysis';
      default:
        return 'initial_phase';
    }
  }

  private getCurrentPhaseFromState(state: UniversalSessionState): string {
    switch (state.currentPathway) {
      case PathwayType.NEW_IDEA:
        return state.newIdeaState?.currentPhase || 'concept_exploration';
      case PathwayType.BUSINESS_MODEL:
        return state.businessModelState?.currentPhase || 'business_model_canvas';
      case PathwayType.FEATURE_REFINEMENT:
        return state.featureRefinementState?.currentPhase || 'feature_analysis';
      default:
        return 'unknown_phase';
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(sessionId?: string): void {
    if (sessionId) {
      // Cleanup specific session
      const timer = this.activeBackupTimers.get(sessionId);
      if (timer) {
        clearInterval(timer);
        this.activeBackupTimers.delete(sessionId);
      }
      this.stateCache.delete(sessionId);
    } else {
      // Cleanup all sessions
      this.activeBackupTimers.forEach(timer => clearInterval(timer));
      this.activeBackupTimers.clear();
      this.stateCache.clear();
    }
  }
}

// Export singleton instance
export const universalSessionStateManager = new UniversalSessionStateManager();