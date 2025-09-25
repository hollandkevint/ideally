import { BmadSession, BmadPhase, PathwayType, SessionPhaseStatus } from '../types';
import { NEW_IDEA_PHASES, NEW_IDEA_TEMPLATE, NewIdeaPhaseData } from '../templates/new-idea-templates';

/**
 * New Idea Pathway Orchestrator
 * Manages session flow, time allocation, and phase transitions
 */
export class NewIdeaPathway {
  private sessionData: NewIdeaPhaseData;
  private currentPhaseIndex: number = 0;
  private phaseStartTime: Date | null = null;
  private totalElapsedTime: number = 0; // in milliseconds

  constructor(initialData?: Partial<NewIdeaPhaseData>) {
    this.sessionData = {
      ideationInsights: [],
      marketOpportunities: [],
      uniqueValueProps: [],
      competitiveLandscape: [],
      ...initialData
    };
  }

  /**
   * Get current phase information
   */
  getCurrentPhase(): BmadPhase {
    return NEW_IDEA_PHASES[this.currentPhaseIndex];
  }

  /**
   * Get all phases with completion status
   */
  getPhaseProgress(): Array<BmadPhase & { status: SessionPhaseStatus; timeSpent: number }> {
    return NEW_IDEA_PHASES.map((phase, index) => ({
      ...phase,
      status: this.getPhaseStatus(index),
      timeSpent: this.getPhaseTimeSpent(index)
    }));
  }

  /**
   * Start a phase and begin time tracking
   */
  startPhase(phaseIndex?: number): void {
    if (phaseIndex !== undefined) {
      this.currentPhaseIndex = phaseIndex;
    }
    
    this.phaseStartTime = new Date();
  }

  /**
   * Complete current phase and calculate time spent
   */
  completeCurrentPhase(): { timeSpent: number; canAdvance: boolean } {
    const timeSpent = this.calculatePhaseTime();
    this.totalElapsedTime += timeSpent;
    
    const currentPhase = this.getCurrentPhase();
    const canAdvance = this.validatePhaseCompletion(currentPhase);
    
    return { timeSpent, canAdvance };
  }

  /**
   * Advance to next phase with transition validation
   */
  advanceToNextPhase(): { success: boolean; nextPhase: BmadPhase | null; timeRemaining: number } {
    if (!this.canAdvancePhase()) {
      return {
        success: false,
        nextPhase: null,
        timeRemaining: this.getRemainingTime()
      };
    }

    this.currentPhaseIndex++;
    
    if (this.currentPhaseIndex >= NEW_IDEA_PHASES.length) {
      return {
        success: true,
        nextPhase: null, // Session complete
        timeRemaining: this.getRemainingTime()
      };
    }

    const nextPhase = NEW_IDEA_PHASES[this.currentPhaseIndex];
    this.startPhase();
    
    return {
      success: true,
      nextPhase,
      timeRemaining: this.getRemainingTime()
    };
  }

  /**
   * Get time allocation for current phase
   */
  getCurrentPhaseTimeAllocation(): number {
    return this.getCurrentPhase().timeAllocation * 60 * 1000; // Convert minutes to milliseconds
  }

  /**
   * Get remaining time in current phase
   */
  getRemainingPhaseTime(): number {
    if (!this.phaseStartTime) return this.getCurrentPhaseTimeAllocation();
    
    const elapsed = Date.now() - this.phaseStartTime.getTime();
    const remaining = this.getCurrentPhaseTimeAllocation() - elapsed;
    
    return Math.max(0, remaining);
  }

  /**
   * Get total remaining session time
   */
  getRemainingTime(): number {
    const totalSessionTime = NEW_IDEA_TEMPLATE.totalDuration * 60 * 1000; // 30 minutes in milliseconds
    return Math.max(0, totalSessionTime - this.totalElapsedTime);
  }

  /**
   * Check if phase can be advanced
   */
  private canAdvancePhase(): boolean {
    const currentPhase = this.getCurrentPhase();
    
    // Check required outputs are completed
    const hasRequiredOutputs = this.validatePhaseCompletion(currentPhase);
    
    // Allow advancement if minimum time has passed or if phase is complete
    const minTimeSpent = this.calculatePhaseTime() >= (currentPhase.timeAllocation * 60 * 1000 * 0.5); // 50% of allocated time
    
    return hasRequiredOutputs || minTimeSpent;
  }

  /**
   * Validate phase completion based on required outputs
   */
  private validatePhaseCompletion(phase: BmadPhase): boolean {
    switch (phase.id) {
      case 'ideation':
        return this.sessionData.ideationInsights.length > 0;
      
      case 'market_exploration':
        return this.sessionData.marketOpportunities.length > 0;
      
      case 'concept_refinement':
        return this.sessionData.uniqueValueProps.length > 0;
      
      case 'positioning':
        return this.sessionData.businessModelElements !== undefined;
      
      default:
        return true;
    }
  }

  /**
   * Calculate time spent in current phase
   */
  private calculatePhaseTime(): number {
    if (!this.phaseStartTime) return 0;
    return Date.now() - this.phaseStartTime.getTime();
  }

  /**
   * Get phase status
   */
  private getPhaseStatus(phaseIndex: number): SessionPhaseStatus {
    if (phaseIndex < this.currentPhaseIndex) {
      return 'completed';
    } else if (phaseIndex === this.currentPhaseIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  }

  /**
   * Get time spent in specific phase
   */
  private getPhaseTimeSpent(phaseIndex: number): number {
    if (phaseIndex < this.currentPhaseIndex) {
      // For completed phases, use allocated time (simplified)
      return NEW_IDEA_PHASES[phaseIndex].timeAllocation * 60 * 1000;
    } else if (phaseIndex === this.currentPhaseIndex) {
      return this.calculatePhaseTime();
    }
    return 0;
  }

  /**
   * Update session data for current phase
   */
  updateSessionData(updates: Partial<NewIdeaPhaseData>): void {
    this.sessionData = {
      ...this.sessionData,
      ...updates
    };
  }

  /**
   * Get current session data
   */
  getSessionData(): NewIdeaPhaseData {
    return this.sessionData;
  }

  /**
   * Get session completion percentage
   */
  getCompletionPercentage(): number {
    const totalDuration = NEW_IDEA_TEMPLATE.totalDuration * 60 * 1000;
    return Math.min(100, (this.totalElapsedTime / totalDuration) * 100);
  }

  /**
   * Check if session is complete
   */
  isSessionComplete(): boolean {
    return this.currentPhaseIndex >= NEW_IDEA_PHASES.length;
  }

  /**
   * Get session summary for completion
   */
  getSessionSummary() {
    return {
      pathway: PathwayType.NEW_IDEA,
      phasesCompleted: this.currentPhaseIndex,
      totalPhases: NEW_IDEA_PHASES.length,
      timeSpent: this.totalElapsedTime,
      completionPercentage: this.getCompletionPercentage(),
      sessionData: this.sessionData
    };
  }
}

/**
 * Factory function to create new pathway instance
 */
export function createNewIdeaPathway(initialData?: Partial<NewIdeaPhaseData>): NewIdeaPathway {
  return new NewIdeaPathway(initialData);
}

/**
 * Utility functions for time management
 */
export const NewIdeaTimeUtils = {
  formatTime: (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  getPhaseTimeWarning: (remainingTime: number, totalTime: number): 'none' | 'warning' | 'critical' => {
    const percentage = remainingTime / totalTime;
    if (percentage <= 0.1) return 'critical';
    if (percentage <= 0.25) return 'warning';
    return 'none';
  },

  calculateOptimalPhaseTime: (currentPhase: number, remainingTime: number): number => {
    const remainingPhases = NEW_IDEA_PHASES.length - currentPhase;
    return remainingTime / remainingPhases;
  }
};