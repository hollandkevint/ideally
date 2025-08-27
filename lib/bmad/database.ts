import { createClient } from '@/lib/supabase/server';
import { 
  BmadSession, 
  PathwayType, 
  ElicitationHistory, 
  PersonaEvolution,
  PhaseTimeAllocation,
  ActionItem,
  GeneratedDocument,
  BmadMethodError,
  UserResponse
} from './types';

// Database row types that match Supabase schema
export interface BmadSessionRow {
  id: string;
  user_id: string;
  workspace_id: string;
  pathway: PathwayType;
  templates: string[];
  current_phase: string;
  current_template: string;
  start_time: string;
  end_time?: string;
  overall_completion: number;
  current_step: string;
  next_steps: string[];
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface PhaseAllocationRow {
  id: string;
  session_id: string;
  phase_id: string;
  template_id: string;
  allocated_minutes: number;
  used_minutes: number;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

export interface SessionProgressRow {
  id: string;
  session_id: string;
  phase_id: string;
  template_id: string;
  completion_percentage: number;
  last_updated: string;
}

export interface UserResponseRow {
  id: string;
  session_id: string;
  phase_id: string;
  prompt_id: string;
  response_text?: string;
  response_data?: Record<string, unknown>;
  elicitation_choice?: number;
  timestamp: string;
}

export interface ElicitationHistoryRow {
  id: string;
  session_id: string;
  phase_id: string;
  template_id: string;
  options: Record<string, unknown>;
  user_selection: string;
  selected_path: string;
  generated_context?: Record<string, unknown>;
  next_phase_hint?: string;
  timestamp: string;
}

export interface PersonaEvolutionRow {
  id: string;
  session_id: string;
  phase_id: string;
  previous_persona: 'analyst' | 'advisor' | 'coach';
  new_persona: 'analyst' | 'advisor' | 'coach';
  trigger_condition: string;
  reasoning: string;
  confidence_score?: number;
  timestamp: string;
}

export interface ActionItemRow {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeReferenceRow {
  id: string;
  session_id: string;
  entry_id: string;
  title: string;
  relevance_score: number;
  applied_in_phase: string;
  timestamp: string;
}

export interface PhaseOutputRow {
  id: string;
  session_id: string;
  phase_id: string;
  output_id: string;
  output_name: string;
  output_type: 'text' | 'list' | 'matrix' | 'canvas' | 'document';
  output_data: Record<string, unknown>;
  is_required: boolean;
  created_at: string;
}

export interface TemplateOutputRow {
  id: string;
  session_id: string;
  template_id: string;
  output_data: Record<string, unknown>;
  created_at: string;
}

export interface GeneratedDocumentRow {
  id: string;
  session_id: string;
  document_name: string;
  document_type: string;
  content: string;
  format: 'markdown' | 'html' | 'pdf' | 'docx';
  file_path?: string;
  created_at: string;
}

/**
 * BMad Method Database Access Layer
 */
export class BmadDatabase {
  
  /**
   * Create a new BMad Method session
   */
  static async createSession(sessionData: {
    userId: string;
    workspaceId: string;
    pathway: PathwayType;
    templates: string[];
    currentPhase: string;
    currentTemplate: string;
  }): Promise<string> {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('bmad_sessions')
        .insert({
          user_id: sessionData.userId,
          workspace_id: sessionData.workspaceId,
          pathway: sessionData.pathway,
          templates: sessionData.templates,
          current_phase: sessionData.currentPhase,
          current_template: sessionData.currentTemplate,
          current_step: 'session_initialized'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      throw new BmadMethodError(
        `Failed to create BMad session: ${error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error'}`,
        'SESSION_CREATION_ERROR',
        { sessionData, originalError: error }
      );
    }
  }

  /**
   * Get session by ID
   */
  static async getSession(sessionId: string): Promise<BmadSession | null> {
    try {
      const supabase = await createClient();
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('bmad_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        if (sessionError.code === 'PGRST116') return null; // Not found
        throw sessionError;
      }

      // Get related data
      const [
        { data: allocations },
        { data: progress },
        { data: responses },
        { data: elicitationHistory },
        { data: personaEvolution },
        { data: knowledgeRefs },
        { data: phaseOutputs },
        { data: templateOutputs },
        { data: documents },
        { data: actionItems }
      ] = await Promise.all([
        supabase.from('bmad_phase_allocations').select('*').eq('session_id', sessionId),
        supabase.from('bmad_session_progress').select('*').eq('session_id', sessionId),
        supabase.from('bmad_user_responses').select('*').eq('session_id', sessionId),
        supabase.from('bmad_elicitation_history').select('*').eq('session_id', sessionId),
        supabase.from('bmad_persona_evolution').select('*').eq('session_id', sessionId),
        supabase.from('bmad_knowledge_references').select('*').eq('session_id', sessionId),
        supabase.from('bmad_phase_outputs').select('*').eq('session_id', sessionId),
        supabase.from('bmad_template_outputs').select('*').eq('session_id', sessionId),
        supabase.from('bmad_generated_documents').select('*').eq('session_id', sessionId),
        supabase.from('bmad_action_items').select('*').eq('session_id', sessionId)
      ]);

      // Transform database rows to session object
      return this.transformSessionRow(sessionData, {
        allocations: allocations || [],
        progress: progress || [],
        responses: responses || [],
        elicitationHistory: elicitationHistory || [],
        personaEvolution: personaEvolution || [],
        knowledgeRefs: knowledgeRefs || [],
        phaseOutputs: phaseOutputs || [],
        templateOutputs: templateOutputs || [],
        documents: documents || [],
        actionItems: actionItems || []
      });

    } catch (error) {
      throw new BmadMethodError(
        `Failed to retrieve BMad session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SESSION_RETRIEVAL_ERROR',
        { sessionId, originalError: error }
      );
    }
  }

  /**
   * Update session progress
   */
  static async updateSessionProgress(
    sessionId: string, 
    updates: {
      currentPhase?: string;
      currentTemplate?: string;
      overallCompletion?: number;
      currentStep?: string;
      nextSteps?: string[];
      status?: 'active' | 'paused' | 'completed' | 'abandoned';
    }
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      const updateData: Record<string, unknown> = {};
      if (updates.currentPhase !== undefined) updateData.current_phase = updates.currentPhase;
      if (updates.currentTemplate !== undefined) updateData.current_template = updates.currentTemplate;
      if (updates.overallCompletion !== undefined) updateData.overall_completion = updates.overallCompletion;
      if (updates.currentStep !== undefined) updateData.current_step = updates.currentStep;
      if (updates.nextSteps !== undefined) updateData.next_steps = updates.nextSteps;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { error } = await supabase
        .from('bmad_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      throw new BmadMethodError(
        `Failed to update session progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SESSION_UPDATE_ERROR',
        { sessionId, updates, originalError: error }
      );
    }
  }

  /**
   * Record user response
   */
  static async recordUserResponse(
    sessionId: string,
    phaseId: string,
    promptId: string,
    response: {
      text?: string;
      data?: Record<string, unknown>;
      elicitationChoice?: number;
    }
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('bmad_user_responses')
        .insert({
          session_id: sessionId,
          phase_id: phaseId,
          prompt_id: promptId,
          response_text: response.text,
          response_data: response.data,
          elicitation_choice: response.elicitationChoice
        });

      if (error) throw error;
    } catch (error) {
      throw new BmadMethodError(
        `Failed to record user response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RESPONSE_RECORDING_ERROR',
        { sessionId, phaseId, promptId, originalError: error }
      );
    }
  }

  /**
   * Record elicitation interaction
   */
  static async recordElicitation(
    sessionId: string,
    elicitation: {
      phaseId: string;
      templateId: string;
      options: Record<string, unknown>;
      userSelection: string;
      selectedPath: string;
      generatedContext?: Record<string, unknown>;
      nextPhaseHint?: string;
    }
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('bmad_elicitation_history')
        .insert({
          session_id: sessionId,
          phase_id: elicitation.phaseId,
          template_id: elicitation.templateId,
          options: elicitation.options,
          user_selection: elicitation.userSelection,
          selected_path: elicitation.selectedPath,
          generated_context: elicitation.generatedContext,
          next_phase_hint: elicitation.nextPhaseHint
        });

      if (error) throw error;
    } catch (error) {
      throw new BmadMethodError(
        `Failed to record elicitation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ELICITATION_RECORDING_ERROR',
        { sessionId, elicitation, originalError: error }
      );
    }
  }

  /**
   * Record persona evolution
   */
  static async recordPersonaEvolution(
    sessionId: string,
    evolution: {
      phaseId: string;
      previousPersona: 'analyst' | 'advisor' | 'coach';
      newPersona: 'analyst' | 'advisor' | 'coach';
      triggerCondition: string;
      reasoning: string;
      confidenceScore?: number;
    }
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('bmad_persona_evolution')
        .insert({
          session_id: sessionId,
          phase_id: evolution.phaseId,
          previous_persona: evolution.previousPersona,
          new_persona: evolution.newPersona,
          trigger_condition: evolution.triggerCondition,
          reasoning: evolution.reasoning,
          confidence_score: evolution.confidenceScore
        });

      if (error) throw error;
    } catch (error) {
      throw new BmadMethodError(
        `Failed to record persona evolution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PERSONA_RECORDING_ERROR',
        { sessionId, evolution, originalError: error }
      );
    }
  }

  /**
   * Save phase output
   */
  static async savePhaseOutput(
    sessionId: string,
    output: {
      phaseId: string;
      outputId: string;
      outputName: string;
      outputType: 'text' | 'list' | 'matrix' | 'canvas' | 'document';
      outputData: Record<string, unknown>;
      isRequired: boolean;
    }
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('bmad_phase_outputs')
        .upsert({
          session_id: sessionId,
          phase_id: output.phaseId,
          output_id: output.outputId,
          output_name: output.outputName,
          output_type: output.outputType,
          output_data: output.outputData,
          is_required: output.isRequired
        }, {
          onConflict: 'session_id,phase_id,output_id'
        });

      if (error) throw error;
    } catch (error) {
      throw new BmadMethodError(
        `Failed to save phase output: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'OUTPUT_SAVE_ERROR',
        { sessionId, output, originalError: error }
      );
    }
  }

  /**
   * Get user sessions
   */
  static async getUserSessions(
    userId: string,
    workspaceId?: string,
    status?: 'active' | 'paused' | 'completed' | 'abandoned'
  ): Promise<BmadSessionRow[]> {
    try {
      const supabase = await createClient();
      
      let query = supabase
        .from('bmad_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new BmadMethodError(
        `Failed to retrieve user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SESSION_LIST_ERROR',
        { userId, workspaceId, status, originalError: error }
      );
    }
  }

  /**
   * Transform database session row to BmadSession object
   */
  private static transformSessionRow(
    sessionRow: BmadSessionRow,
    relatedData: {
      allocations: PhaseAllocationRow[];
      progress: SessionProgressRow[];
      responses: UserResponseRow[];
      elicitationHistory: ElicitationHistoryRow[];
      personaEvolution: PersonaEvolutionRow[];
      knowledgeRefs: KnowledgeReferenceRow[];
      phaseOutputs: PhaseOutputRow[];
      templateOutputs: TemplateOutputRow[];
      documents: GeneratedDocumentRow[];
      actionItems: ActionItemRow[];
    }
  ): BmadSession {
    // Transform phase completion from progress data
    const phaseCompletion: { [phaseId: string]: number } = {};
    const templateCompletion: { [templateId: string]: number } = {};

    relatedData.progress.forEach(p => {
      phaseCompletion[p.phase_id] = p.completion_percentage;
      if (!templateCompletion[p.template_id]) {
        templateCompletion[p.template_id] = 0;
      }
      templateCompletion[p.template_id] = Math.max(
        templateCompletion[p.template_id],
        p.completion_percentage
      );
    });

    // Transform time allocations
    const timeAllocations: PhaseTimeAllocation[] = relatedData.allocations.map(a => ({
      phaseId: a.phase_id,
      templateId: a.template_id,
      allocatedMinutes: a.allocated_minutes,
      usedMinutes: a.used_minutes,
      startTime: a.start_time ? new Date(a.start_time) : undefined,
      endTime: a.end_time ? new Date(a.end_time) : undefined
    }));

    // Transform user responses into context
    const userResponses: { [key: string]: UserResponse } = {};
    relatedData.responses.forEach(r => {
      const key = `${r.phase_id}.${r.prompt_id}`;
      userResponses[key] = {
        text: r.response_text,
        data: r.response_data,
        elicitationChoice: r.elicitation_choice,
        timestamp: new Date(r.timestamp)
      };
    });

    // Transform elicitation history
    const elicitationHistory: ElicitationHistory[] = relatedData.elicitationHistory.map(e => ({
      phaseId: e.phase_id,
      timestamp: new Date(e.timestamp),
      options: Array.isArray(e.options) ? e.options : [],
      userSelection: e.user_selection,
      result: {
        selectedPath: e.selected_path,
        generatedContext: e.generated_context || {},
        nextPhaseHint: e.next_phase_hint
      }
    }));

    // Transform persona evolution
    const personaEvolution: PersonaEvolution[] = relatedData.personaEvolution.map(p => ({
      phaseId: p.phase_id,
      previousPersona: p.previous_persona,
      newPersona: p.new_persona,
      triggerCondition: p.trigger_condition,
      reasoning: p.reasoning,
      confidenceScore: p.confidence_score || 0,
      timestamp: new Date(p.timestamp)
    }));

    // Transform outputs
    const phaseOutputs: { [phaseId: string]: Record<string, unknown> } = {};
    relatedData.phaseOutputs.forEach(o => {
      if (!phaseOutputs[o.phase_id]) {
        phaseOutputs[o.phase_id] = {};
      }
      phaseOutputs[o.phase_id][o.output_id] = o.output_data;
    });

    const templateOutputs: { [templateId: string]: Record<string, unknown> } = {};
    relatedData.templateOutputs.forEach(o => {
      templateOutputs[o.template_id] = o.output_data;
    });

    const finalDocuments: GeneratedDocument[] = relatedData.documents.map(d => ({
      id: d.id,
      name: d.document_name,
      type: d.document_type,
      content: d.content,
      format: d.format,
      filePath: d.file_path,
      createdAt: new Date(d.created_at)
    }));

    const actionItems: ActionItem[] = relatedData.actionItems.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      priority: a.priority,
      dueDate: a.due_date ? new Date(a.due_date) : undefined,
      status: a.status,
      assignedTo: a.assigned_to,
      createdAt: new Date(a.created_at),
      updatedAt: new Date(a.updated_at)
    }));

    return {
      id: sessionRow.id,
      userId: sessionRow.user_id,
      workspaceId: sessionRow.workspace_id,
      pathway: sessionRow.pathway,
      templates: sessionRow.templates,
      currentPhase: sessionRow.current_phase,
      currentTemplate: sessionRow.current_template,
      progress: {
        overallCompletion: sessionRow.overall_completion,
        phaseCompletion,
        templateCompletion,
        currentStep: sessionRow.current_step,
        nextSteps: sessionRow.next_steps
      },
      startTime: new Date(sessionRow.start_time),
      timeAllocations,
      context: {
        userResponses,
        elicitationHistory,
        personaEvolution,
        knowledgeReferences: [] // Transform if needed
      },
      outputs: {
        phaseOutputs,
        templateOutputs,
        finalDocuments,
        actionItems
      },
      metadata: {
        status: sessionRow.status,
        createdAt: new Date(sessionRow.created_at),
        updatedAt: new Date(sessionRow.updated_at),
        endTime: sessionRow.end_time ? new Date(sessionRow.end_time) : undefined
      }
    };
  }
}