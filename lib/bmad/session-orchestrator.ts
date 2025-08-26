import { 
  BmadSession, 
  PathwayType, 
  SessionProgress,
  SessionContext,
  SessionOutputs,
  BmadPhase,
  BmadTemplate,
  BmadMethodError,
  SessionStateError,
  PhaseTimeAllocation
} from './types';
import { bmadTemplateEngine } from './template-engine';
import { pathwayRouter } from './pathway-router';
import { elicitationSystem } from './elicitation-system';
import { BmadDatabase } from './database';

/**
 * Session configuration for initialization
 */
export interface SessionConfiguration {
  userId: string;
  workspaceId: string;
  pathway: PathwayType;
  initialContext?: any;
}

/**
 * Session advancement result
 */
export interface SessionAdvancement {
  session: BmadSession;
  nextAction: 'continue_phase' | 'advance_phase' | 'complete_template' | 'complete_session';
  message: string;
  elicitationNeeded: boolean;
  templateUpdate?: any;
  phaseTransition?: PhaseTransitionInfo;
}

/**
 * Phase transition information
 */
export interface PhaseTransitionInfo {
  fromPhase: string;
  toPhase: string;
  reason: string;
  completionPercentage: number;
}

/**
 * Phase time allocation
 */
export interface PhaseTimeAllocation {
  phaseId: string;
  allocatedMinutes: number;
  actualMinutes: number;
  overrunRisk: 'low' | 'medium' | 'high';
}

/**
 * BMad Method Session Orchestrator
 * Manages BMad Method session lifecycle, template execution, and progress tracking
 */
export class SessionOrchestrator {
  private activeSessions = new Map<string, BmadSession>();
  private phaseManager = new PhaseManager();
  private progressTracker = new ProgressTracker();

  /**
   * Create new BMad Method session
   */
  async createSession(config: SessionConfiguration): Promise<BmadSession> {
    try {
      // Get pathway configuration
      const pathway = pathwayRouter.getPathway(config.pathway);
      if (!pathway) {
        throw new BmadMethodError(
          `Invalid pathway: ${config.pathway}`,
          'INVALID_PATHWAY',
          { pathway: config.pathway }
        );
      }

      // Load initial template
      const firstTemplate = await bmadTemplateEngine.loadTemplate(pathway.templateSequence[0]);
      const firstPhase = firstTemplate.phases[0];

      // Create session in database
      const sessionId = await BmadDatabase.createSession({
        userId: config.userId,
        workspaceId: config.workspaceId,
        pathway: config.pathway,
        templates: pathway.templateSequence,
        currentPhase: firstPhase.id,
        currentTemplate: firstTemplate.id
      });

      // Build complete session object
      const session: BmadSession = {
        id: sessionId,
        userId: config.userId,
        workspaceId: config.workspaceId,
        pathway: config.pathway,
        templates: pathway.templateSequence,
        currentPhase: firstPhase.id,
        currentTemplate: firstTemplate.id,
        progress: this.initializeProgress(pathway.templateSequence, firstTemplate),
        startTime: new Date(),
        timeAllocations: this.calculateTimeAllocations(pathway.templateSequence),
        context: {
          userResponses: config.initialContext || {},
          elicitationHistory: [],
          personaEvolution: [],
          knowledgeReferences: []
        },
        outputs: {
          phaseOutputs: {},
          templateOutputs: {},
          finalDocuments: [],
          actionItems: []
        },
        metadata: {
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      // Store session in memory for active use
      this.activeSessions.set(session.id, session);

      return session;

    } catch (error) {
      throw new BmadMethodError(
        `Failed to create BMad session: ${error.message}`,
        'SESSION_CREATION_ERROR',
        { config, originalError: error }
      );
    }
  }

  /**
   * Advance session based on user input
   */
  async advanceSession(
    sessionId: string,
    userInput: string
  ): Promise<SessionAdvancement> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new SessionStateError('Session not found', sessionId);
      }

      // Get current template and phase
      const currentTemplate = await bmadTemplateEngine.loadTemplate(session.currentTemplate);
      const currentPhase = currentTemplate.phases.find(p => p.id === session.currentPhase);
      if (!currentPhase) {
        throw new SessionStateError(`Current phase ${session.currentPhase} not found`, sessionId);
      }

      // Process user input in context of current phase
      const phaseResult = await this.phaseManager.processInput(
        currentPhase,
        userInput,
        session
      );

      // Record user response in database
      await BmadDatabase.recordUserResponse(
        sessionId,
        currentPhase.id,
        `phase_input_${Date.now()}`,
        { text: userInput }
      );

      // Update session context with user response
      session.context.userResponses[`${currentPhase.id}_${Date.now()}`] = userInput;
      
      // Update progress
      session.progress = await this.progressTracker.updateProgress(session, phaseResult);

      // Determine next action
      const advancement = await this.determineNextAction(session, currentPhase, phaseResult);

      // Update session state
      this.activeSessions.set(sessionId, advancement.session);
      
      // Persist changes
      await this.persistSession(advancement.session);

      return advancement;

    } catch (error) {
      throw new BmadMethodError(
        `Failed to advance session: ${error.message}`,
        'SESSION_ADVANCEMENT_ERROR',
        { sessionId, userInput, originalError: error }
      );
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<BmadSession | null> {
    // Check in-memory cache first
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId)!;
    }

    // Load from database using BmadDatabase
    try {
      const session = await BmadDatabase.getSession(sessionId);
      
      if (!session) {
        return null;
      }

      // Cache in memory for active use
      this.activeSessions.set(sessionId, session);
      return session;

    } catch (error) {
      throw new BmadMethodError(
        `Failed to load session: ${error.message}`,
        'SESSION_LOAD_ERROR',
        { sessionId, originalError: error }
      );
    }
  }

  /**
   * Complete session and generate final outputs
   */
  async completeSession(sessionId: string): Promise<BmadSession> {
    try {
      const session = this.getActiveSession(sessionId);
      
      // Generate final documents
      session.outputs.finalDocuments = await this.generateFinalDocuments(session);
      
      // Extract action items from session outputs
      session.outputs.actionItems = await this.extractActionItems(session);

      // Update completion status
      session.progress.overallCompletion = 1.0;
      
      // Persist final state
      await this.persistSession(session);

      return session;

    } catch (error) {
      throw new BmadMethodError(
        `Failed to complete session: ${error.message}`,
        'SESSION_COMPLETION_ERROR',
        { sessionId, originalError: error }
      );
    }
  }

  /**
   * Initialize session progress tracking
   */
  private initializeProgress(
    templateSequence: string[],
    firstTemplate: BmadTemplate
  ): SessionProgress {
    const phaseCompletion: { [phaseId: string]: number } = {};
    const templateCompletion: { [templateId: string]: number } = {};

    // Initialize all phases as 0% complete
    firstTemplate.phases.forEach(phase => {
      phaseCompletion[phase.id] = 0;
    });

    // Initialize all templates as 0% complete
    templateSequence.forEach(templateId => {
      templateCompletion[templateId] = 0;
    });

    return {
      overallCompletion: 0,
      phaseCompletion,
      templateCompletion,
      currentStep: `Starting ${firstTemplate.phases[0].name}`,
      nextSteps: [`Complete ${firstTemplate.phases[0].name}`]
    };
  }

  /**
   * Calculate time allocations for pathway templates
   */
  private calculateTimeAllocations(templateSequence: string[]): PhaseTimeAllocation[] {
    // This would be implemented based on template metadata
    // For now, return basic allocations
    return templateSequence.map(templateId => ({
      phaseId: templateId,
      allocatedMinutes: 10,
      actualMinutes: 0,
      overrunRisk: 'low' as const
    }));
  }

  /**
   * Determine next action based on phase result
   */
  private async determineNextAction(
    session: BmadSession,
    currentPhase: BmadPhase,
    phaseResult: any
  ): Promise<SessionAdvancement> {
    const currentTemplate = await bmadTemplateEngine.loadTemplate(session.currentTemplate);
    
    // Check if current phase is complete
    if (phaseResult.phaseComplete) {
      // Check if there are more phases in current template
      const currentPhaseIndex = currentTemplate.phases.findIndex(p => p.id === currentPhase.id);
      const nextPhaseIndex = currentPhaseIndex + 1;

      if (nextPhaseIndex < currentTemplate.phases.length) {
        // Move to next phase in current template
        const nextPhase = currentTemplate.phases[nextPhaseIndex];
        session.currentPhase = nextPhase.id;
        session.progress.currentStep = `Starting ${nextPhase.name}`;

        return {
          session,
          nextAction: 'advance_phase',
          message: `Great progress! Moving on to ${nextPhase.name}.`,
          elicitationNeeded: true,
          phaseTransition: {
            fromPhase: currentPhase.id,
            toPhase: nextPhase.id,
            reason: 'Phase completion',
            completionPercentage: session.progress.overallCompletion
          }
        };
      } else {
        // Current template complete, check for next template
        const currentTemplateIndex = session.templates.findIndex(t => t === session.currentTemplate);
        const nextTemplateIndex = currentTemplateIndex + 1;

        if (nextTemplateIndex < session.templates.length) {
          // Move to next template
          const nextTemplateId = session.templates[nextTemplateIndex];
          const nextTemplate = await bmadTemplateEngine.loadTemplate(nextTemplateId);
          const nextPhase = nextTemplate.phases[0];

          session.currentTemplate = nextTemplateId;
          session.currentPhase = nextPhase.id;
          session.progress.templateCompletion[session.currentTemplate] = 1.0;

          return {
            session,
            nextAction: 'complete_template',
            message: `Excellent! We've completed ${currentTemplate.name}. Now let's move on to ${nextTemplate.name}.`,
            elicitationNeeded: true,
            templateUpdate: {
              completedTemplate: session.currentTemplate,
              nextTemplate: nextTemplateId
            }
          };
        } else {
          // All templates complete - session finished
          return {
            session,
            nextAction: 'complete_session',
            message: 'Congratulations! You\'ve completed your BMad Method strategic thinking session. Let me generate your final documents.',
            elicitationNeeded: false
          };
        }
      }
    } else {
      // Continue current phase
      return {
        session,
        nextAction: 'continue_phase',
        message: phaseResult.continuationMessage || 'Let\'s continue working on this phase.',
        elicitationNeeded: phaseResult.needsElicitation || false
      };
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `bmad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active session or throw error
   */
  private getActiveSession(sessionId: string): BmadSession {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new SessionStateError('Session not found in active sessions', sessionId);
    }
    return session;
  }

  /**
   * Persist session progress to database
   */
  private async persistSession(session: BmadSession): Promise<void> {
    try {
      await BmadDatabase.updateSessionProgress(session.id, {
        currentPhase: session.currentPhase,
        currentTemplate: session.currentTemplate,
        overallCompletion: session.progress.overallCompletion,
        currentStep: session.progress.currentStep,
        nextSteps: session.progress.nextSteps,
        status: session.metadata.status
      });
    } catch (error) {
      throw new BmadMethodError(
        `Failed to persist session: ${error.message}`,
        'SESSION_PERSISTENCE_ERROR',
        { sessionId: session.id, originalError: error }
      );
    }
  }

  /**
   * Deserialize session from database format
   */
  private deserializeSession(data: any): BmadSession {
    return {
      id: data.id,
      userId: data.user_id,
      workspaceId: data.workspace_id,
      pathway: data.pathway_type,
      templates: data.session_config.templates,
      currentPhase: data.current_phase,
      currentTemplate: data.session_config.templates[0], // Simplified
      progress: data.progress,
      startTime: new Date(data.started_at),
      timeAllocations: data.session_config.timeAllocations,
      context: data.context,
      outputs: data.outputs,
      metadata: data.session_config.metadata
    };
  }

  /**
   * Generate final session documents
   */
  private async generateFinalDocuments(session: BmadSession): Promise<any[]> {
    // This would integrate with document generation system
    // For now, return placeholder
    return [{
      id: 'session-summary',
      title: 'BMad Method Session Summary',
      type: 'summary',
      content: 'Generated session summary would go here',
      createdAt: new Date()
    }];
  }

  /**
   * Extract action items from session
   */
  private async extractActionItems(session: BmadSession): Promise<any[]> {
    // This would analyze session outputs to extract actionable items
    // For now, return placeholder
    return [{
      id: 'action-1',
      title: 'Implement top strategic recommendation',
      priority: 'high',
      estimatedTime: '2 hours',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
    }];
  }
}

/**
 * Manages phase execution and transitions
 */
class PhaseManager {
  async processInput(
    phase: BmadPhase,
    userInput: string,
    session: BmadSession
  ): Promise<any> {
    // Analyze user input for phase progression
    const inputAnalysis = await this.analyzeInput(userInput, phase);
    
    // Check if phase completion criteria are met
    const phaseComplete = await this.checkPhaseCompletion(phase, inputAnalysis, session);
    
    return {
      phaseComplete,
      inputAnalysis,
      continuationMessage: this.generateContinuationMessage(phase, inputAnalysis),
      needsElicitation: !phaseComplete
    };
  }

  private async analyzeInput(userInput: string, phase: BmadPhase): Promise<any> {
    // Simple analysis - could be enhanced with NLP
    return {
      wordCount: userInput.split(/\s+/).length,
      containsKeywords: this.checkForPhaseKeywords(userInput, phase),
      completeness: this.assessCompleteness(userInput, phase)
    };
  }

  private checkForPhaseKeywords(userInput: string, phase: BmadPhase): boolean {
    // Simple keyword checking based on phase type
    const phaseKeywords = this.getPhaseKeywords(phase);
    const inputLower = userInput.toLowerCase();
    return phaseKeywords.some(keyword => inputLower.includes(keyword));
  }

  private getPhaseKeywords(phase: BmadPhase): string[] {
    // Return relevant keywords based on phase ID
    const keywordMap: { [key: string]: string[] } = {
      'problem_definition': ['problem', 'challenge', 'issue', 'goal', 'objective'],
      'idea_generation': ['idea', 'solution', 'approach', 'option', 'alternative'],
      'idea_evaluation': ['evaluate', 'assess', 'compare', 'prioritize', 'rank'],
      'market_analysis': ['market', 'customer', 'competitor', 'industry', 'segment']
    };
    return keywordMap[phase.id] || [];
  }

  private assessCompleteness(userInput: string, phase: BmadPhase): number {
    // Simple completeness assessment
    const minWords = 10;
    const wordCount = userInput.split(/\s+/).length;
    return Math.min(wordCount / minWords, 1.0);
  }

  private async checkPhaseCompletion(
    phase: BmadPhase,
    inputAnalysis: any,
    session: BmadSession
  ): Promise<boolean> {
    // Simple completion logic - could be enhanced
    return inputAnalysis.completeness >= 0.8 && inputAnalysis.containsKeywords;
  }

  private generateContinuationMessage(phase: BmadPhase, inputAnalysis: any): string {
    if (inputAnalysis.completeness < 0.5) {
      return "Let's explore this further. Can you provide more details?";
    } else {
      return "Good progress! Let's continue developing this aspect.";
    }
  }
}

/**
 * Tracks session progress and completion
 */
class ProgressTracker {
  async updateProgress(session: BmadSession, phaseResult: any): Promise<SessionProgress> {
    const progress = { ...session.progress };
    
    // Update current phase completion
    if (phaseResult.phaseComplete) {
      progress.phaseCompletion[session.currentPhase] = 1.0;
    } else {
      progress.phaseCompletion[session.currentPhase] = Math.max(
        progress.phaseCompletion[session.currentPhase] || 0,
        0.5 // Partial progress
      );
    }

    // Calculate overall completion
    const totalPhases = Object.keys(progress.phaseCompletion).length;
    const completedPhases = Object.values(progress.phaseCompletion)
      .reduce((sum, completion) => sum + completion, 0);
    progress.overallCompletion = totalPhases > 0 ? completedPhases / totalPhases : 0;

    return progress;
  }
}

// Export singleton instance
export const sessionOrchestrator = new SessionOrchestrator();