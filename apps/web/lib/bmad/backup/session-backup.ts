/**
 * Session Backup System
 * Dedicated backup management for session resilience
 */

import { BmadDatabase } from '../database';
import {
  UniversalSessionState,
  BackupType
} from '../session/universal-state-manager';

export interface BackupMetadata {
  backupId: string;
  sessionId: string;
  backupType: BackupType;
  createdAt: Date;
  size: number; // bytes
  pathway: string;
  phase: string;
  completionPercentage: number;
}

export interface BackupRestoreOptions {
  preserveCurrentPhase?: boolean;
  mergeWith?: string; // Another backup ID to merge
  selectiveRestore?: string[]; // Specific fields to restore
}

export interface BackupPolicy {
  autoBackupEnabled: boolean;
  backupInterval: number; // milliseconds
  maxBackupsPerSession: number;
  backupRetentionDays: number;
  backupOnPathwaySwitch: boolean;
  backupOnPhaseTransition: boolean;
}

/**
 * Session Backup Manager
 * Handles creation, management, and restoration of session backups
 */
export class SessionBackupManager {
  private database: BmadDatabase;
  private defaultPolicy: BackupPolicy;
  private activeBackupTimers = new Map<string, NodeJS.Timeout>();

  constructor(database?: BmadDatabase) {
    this.database = database || new BmadDatabase();
    this.defaultPolicy = this.createDefaultPolicy();
  }

  /**
   * Create a session backup
   */
  async createBackup(
    sessionId: string,
    state: UniversalSessionState,
    backupType: BackupType,
    metadata?: Partial<BackupMetadata>
  ): Promise<BackupMetadata> {
    try {
      const backupId = this.generateBackupId(sessionId, backupType);
      const stateSize = this.calculateStateSize(state);

      const backupMetadata: BackupMetadata = {
        backupId,
        sessionId,
        backupType,
        createdAt: new Date(),
        size: stateSize,
        pathway: state.currentPathway,
        phase: this.getCurrentPhase(state),
        completionPercentage: state.globalProgress.overallCompletion,
        ...metadata
      };

      // Save to database
      await this.database.createSessionSnapshot({
        id: backupId,
        session_id: sessionId,
        snapshot_type: backupType,
        session_state: state,
        pathway_context: state.currentPathway,
        created_at: backupMetadata.createdAt
      });

      // Cleanup old backups if needed
      await this.enforceRetentionPolicy(sessionId);

      return backupMetadata;

    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore session from backup
   */
  async restoreBackup(
    backupId: string,
    options?: BackupRestoreOptions
  ): Promise<UniversalSessionState> {
    try {
      const snapshot = await this.database.getSessionSnapshot(backupId);
      if (!snapshot) {
        throw new Error(`Backup ${backupId} not found`);
      }

      let restoredState = snapshot.session_state as UniversalSessionState;

      // Apply restoration options
      if (options) {
        restoredState = await this.applyRestoreOptions(
          restoredState,
          options,
          snapshot.session_id
        );
      }

      return restoredState;

    } catch (error) {
      throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all backups for a session
   */
  async listBackups(sessionId: string): Promise<BackupMetadata[]> {
    try {
      const snapshots = await this.database.getSessionSnapshots(sessionId);

      return snapshots.map(snapshot => ({
        backupId: snapshot.id,
        sessionId: snapshot.session_id,
        backupType: snapshot.snapshot_type as BackupType,
        createdAt: new Date(snapshot.created_at),
        size: this.calculateStateSize(snapshot.session_state),
        pathway: snapshot.pathway_context,
        phase: this.getCurrentPhase(snapshot.session_state as UniversalSessionState),
        completionPercentage: (snapshot.session_state as UniversalSessionState).globalProgress?.overallCompletion || 0
      }));

    } catch (error) {
      throw new Error(`Failed to list backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      await this.database.deleteSessionSnapshot(backupId);
    } catch (error) {
      throw new Error(`Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get latest backup for a session
   */
  async getLatestBackup(sessionId: string): Promise<BackupMetadata | null> {
    try {
      const backups = await this.listBackups(sessionId);
      if (backups.length === 0) {
        return null;
      }

      // Sort by creation date descending
      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return backups[0];

    } catch (error) {
      throw new Error(`Failed to get latest backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start automatic backup for a session
   */
  startAutoBackup(
    sessionId: string,
    stateProvider: () => Promise<UniversalSessionState>,
    policy?: Partial<BackupPolicy>
  ): void {
    const appliedPolicy = { ...this.defaultPolicy, ...policy };

    if (!appliedPolicy.autoBackupEnabled) {
      return;
    }

    // Clear existing timer
    this.stopAutoBackup(sessionId);

    // Schedule automatic backups
    const timer = setInterval(async () => {
      try {
        const state = await stateProvider();
        await this.createBackup(sessionId, state, 'auto_backup');
      } catch (error) {
        console.error(`Auto-backup failed for session ${sessionId}:`, error);
      }
    }, appliedPolicy.backupInterval);

    this.activeBackupTimers.set(sessionId, timer);
  }

  /**
   * Stop automatic backup for a session
   */
  stopAutoBackup(sessionId: string): void {
    const timer = this.activeBackupTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.activeBackupTimers.delete(sessionId);
    }
  }

  /**
   * Compare two backups
   */
  async compareBackups(
    backupId1: string,
    backupId2: string
  ): Promise<BackupComparison> {
    try {
      const [backup1, backup2] = await Promise.all([
        this.database.getSessionSnapshot(backupId1),
        this.database.getSessionSnapshot(backupId2)
      ]);

      if (!backup1 || !backup2) {
        throw new Error('One or both backups not found');
      }

      const state1 = backup1.session_state as UniversalSessionState;
      const state2 = backup2.session_state as UniversalSessionState;

      return {
        timeDifference: new Date(backup2.created_at).getTime() - new Date(backup1.created_at).getTime(),
        pathwayChanged: state1.currentPathway !== state2.currentPathway,
        progressDifference: state2.globalProgress.overallCompletion - state1.globalProgress.overallCompletion,
        newInsights: this.calculateNewInsights(state1, state2),
        changedFields: this.identifyChangedFields(state1, state2)
      };

    } catch (error) {
      throw new Error(`Failed to compare backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId: string): Promise<BackupVerificationResult> {
    try {
      const snapshot = await this.database.getSessionSnapshot(backupId);
      if (!snapshot) {
        return {
          valid: false,
          errors: [`Backup ${backupId} not found`],
          warnings: []
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Verify state structure
      const state = snapshot.session_state as UniversalSessionState;
      if (!state.sessionId) {
        errors.push('Missing sessionId in backup state');
      }
      if (!state.currentPathway) {
        errors.push('Missing currentPathway in backup state');
      }
      if (!state.sharedContext) {
        warnings.push('Missing sharedContext in backup state');
      }

      // Verify data integrity
      if (state.pathwayHistory && !Array.isArray(state.pathwayHistory)) {
        errors.push('Invalid pathwayHistory structure');
      }

      // Check for orphaned references
      if (state.sessionId !== snapshot.session_id) {
        warnings.push('Session ID mismatch between state and snapshot');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Backup verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  // Private helper methods

  private createDefaultPolicy(): BackupPolicy {
    return {
      autoBackupEnabled: true,
      backupInterval: 120000, // 2 minutes
      maxBackupsPerSession: 20,
      backupRetentionDays: 30,
      backupOnPathwaySwitch: true,
      backupOnPhaseTransition: true
    };
  }

  private generateBackupId(sessionId: string, backupType: BackupType): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${backupType}_${sessionId}_${timestamp}_${random}`;
  }

  private calculateStateSize(state: any): number {
    try {
      return JSON.stringify(state).length;
    } catch {
      return 0;
    }
  }

  private getCurrentPhase(state: UniversalSessionState): string {
    // Extract current phase from appropriate pathway state
    if (state.newIdeaState) {
      return state.newIdeaState.currentPhase;
    }
    if (state.businessModelState) {
      return state.businessModelState.currentPhase;
    }
    if (state.featureRefinementState) {
      return state.featureRefinementState.currentPhase;
    }
    return 'unknown';
  }

  private async applyRestoreOptions(
    state: UniversalSessionState,
    options: BackupRestoreOptions,
    sessionId: string
  ): Promise<UniversalSessionState> {
    let restoredState = { ...state };

    // Preserve current phase if requested
    if (options.preserveCurrentPhase) {
      const currentSession = await this.database.getSession(sessionId);
      if (currentSession) {
        // Update phase in restored state
        switch (restoredState.currentPathway) {
          case 'new-idea':
            if (restoredState.newIdeaState) {
              restoredState.newIdeaState.currentPhase = currentSession.currentPhase;
            }
            break;
          case 'business-model':
            if (restoredState.businessModelState) {
              restoredState.businessModelState.currentPhase = currentSession.currentPhase;
            }
            break;
          case 'feature-refinement':
            if (restoredState.featureRefinementState) {
              restoredState.featureRefinementState.currentPhase = currentSession.currentPhase;
            }
            break;
        }
      }
    }

    // Selective restore
    if (options.selectiveRestore && options.selectiveRestore.length > 0) {
      // Only restore specified fields
      restoredState = this.selectivelyRestore(restoredState, options.selectiveRestore);
    }

    // Merge with another backup
    if (options.mergeWith) {
      const otherBackup = await this.restoreBackup(options.mergeWith);
      restoredState = this.mergeStates(restoredState, otherBackup);
    }

    return restoredState;
  }

  private selectivelyRestore(
    state: UniversalSessionState,
    fields: string[]
  ): UniversalSessionState {
    const selective: Partial<UniversalSessionState> = {
      sessionId: state.sessionId,
      currentPathway: state.currentPathway,
      pathwayHistory: state.pathwayHistory,
      sharedContext: state.sharedContext,
      globalProgress: state.globalProgress,
      analytics: state.analytics
    };

    // Add requested fields
    for (const field of fields) {
      if (field in state) {
        (selective as any)[field] = (state as any)[field];
      }
    }

    return selective as UniversalSessionState;
  }

  private mergeStates(
    state1: UniversalSessionState,
    state2: UniversalSessionState
  ): UniversalSessionState {
    return {
      ...state1,
      sharedContext: {
        userInputs: [
          ...state1.sharedContext.userInputs,
          ...state2.sharedContext.userInputs
        ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
        keyInsights: [
          ...state1.sharedContext.keyInsights,
          ...state2.sharedContext.keyInsights
        ].filter((v, i, a) => a.indexOf(v) === i),
        recommendations: [
          ...state1.sharedContext.recommendations,
          ...state2.sharedContext.recommendations
        ].filter((v, i, a) => a.indexOf(v) === i),
        generatedDocuments: [
          ...state1.sharedContext.generatedDocuments,
          ...state2.sharedContext.generatedDocuments
        ]
      }
    };
  }

  private async enforceRetentionPolicy(sessionId: string): Promise<void> {
    try {
      const backups = await this.listBackups(sessionId);

      // Remove old backups beyond retention period
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.defaultPolicy.backupRetentionDays);

      const oldBackups = backups.filter(b => b.createdAt < retentionDate);
      for (const backup of oldBackups) {
        await this.deleteBackup(backup.backupId);
      }

      // Remove excess backups beyond max count
      if (backups.length > this.defaultPolicy.maxBackupsPerSession) {
        const sortedBackups = backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const excessBackups = sortedBackups.slice(this.defaultPolicy.maxBackupsPerSession);

        for (const backup of excessBackups) {
          await this.deleteBackup(backup.backupId);
        }
      }

    } catch (error) {
      console.error(`Failed to enforce retention policy: ${error}`);
    }
  }

  private calculateNewInsights(
    state1: UniversalSessionState,
    state2: UniversalSessionState
  ): number {
    const insights1Count = state1.sharedContext.keyInsights.length;
    const insights2Count = state2.sharedContext.keyInsights.length;
    return Math.max(0, insights2Count - insights1Count);
  }

  private identifyChangedFields(
    state1: UniversalSessionState,
    state2: UniversalSessionState
  ): string[] {
    const changed: string[] = [];

    // Compare top-level fields
    if (state1.currentPathway !== state2.currentPathway) {
      changed.push('currentPathway');
    }
    if (state1.globalProgress.overallCompletion !== state2.globalProgress.overallCompletion) {
      changed.push('globalProgress');
    }
    if (state1.pathwayHistory.length !== state2.pathwayHistory.length) {
      changed.push('pathwayHistory');
    }

    return changed;
  }

  /**
   * Cleanup resources
   */
  cleanup(sessionId?: string): void {
    if (sessionId) {
      this.stopAutoBackup(sessionId);
    } else {
      // Stop all auto-backups
      this.activeBackupTimers.forEach((timer, sid) => {
        this.stopAutoBackup(sid);
      });
    }
  }
}

// Supporting interfaces
export interface BackupComparison {
  timeDifference: number; // milliseconds
  pathwayChanged: boolean;
  progressDifference: number;
  newInsights: number;
  changedFields: string[];
}

export interface BackupVerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Export singleton instance
export const sessionBackupManager = new SessionBackupManager();
