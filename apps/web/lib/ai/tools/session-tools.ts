/**
 * Session Manipulation Tools
 *
 * Implements the atomic session tools that give Mary agency over session state.
 * These replace heuristic-based phase completion with explicit agent decisions.
 */

import { createClient } from '@/lib/supabase/server';
import { maryPersona, SubPersonaSessionState } from '../mary-persona';
import type {
  CompletePhaseInput,
  CompletePhaseResult,
  SwitchModeInput,
  SwitchModeResult,
  RecommendActionInput,
  RecommendActionResult,
  ReadSessionStateResult,
  UpdateContextInput,
  UpdateContextResult,
} from './index';

// =============================================================================
// Phase Definitions
// =============================================================================

const PHASE_ORDER: Record<string, string[]> = {
  'new-idea': ['discovery', 'ideation', 'validation', 'planning'],
  'business-model': ['analysis', 'revenue', 'customer', 'validation', 'planning'],
  'strategic-optimization': ['assessment', 'analysis', 'strategy', 'implementation'],
};

function getNextPhase(pathway: string, currentPhase: string): string | null {
  const phases = PHASE_ORDER[pathway];
  if (!phases) return null;

  const currentIndex = phases.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex >= phases.length - 1) {
    return null; // No next phase or phase not found
  }

  return phases[currentIndex + 1];
}

// =============================================================================
// Tool Implementations
// =============================================================================

/**
 * Read the current session state
 */
export async function readSessionState(sessionId: string): Promise<ReadSessionStateResult> {
  try {
    const supabase = await createClient();

    const { data: session, error } = await supabase
      .from('bmad_sessions')
      .select(`
        id,
        pathway,
        current_phase,
        overall_completion,
        sub_persona_state
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return {
        success: false,
        error: `Failed to read session: ${error?.message || 'Session not found'}`,
      };
    }

    const subPersonaState = session.sub_persona_state as SubPersonaSessionState | null;

    // Get recent insights
    const { data: insights } = await supabase
      .from('bmad_phase_outputs')
      .select('output_data')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentInsights = insights?.flatMap(i => {
      const data = i.output_data as Record<string, unknown>;
      if (typeof data?.insight === 'string') {
        return [data.insight];
      }
      return [];
    }).slice(0, 5) || [];

    return {
      success: true,
      data: {
        sessionId: session.id,
        pathway: session.pathway,
        currentPhase: session.current_phase,
        progress: session.overall_completion || 0,
        currentMode: subPersonaState?.currentMode || 'inquisitive',
        exchangeCount: subPersonaState?.exchangeCount || 0,
        insights: recentInsights,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error reading session state: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Complete the current phase and advance to the next
 */
export async function completePhase(
  sessionId: string,
  input: CompletePhaseInput
): Promise<CompletePhaseResult> {
  try {
    const supabase = await createClient();

    // Get current session state
    const { data: session, error: fetchError } = await supabase
      .from('bmad_sessions')
      .select('pathway, current_phase, overall_completion')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return {
        success: false,
        error: `Failed to fetch session: ${fetchError?.message || 'Session not found'}`,
      };
    }

    const previousPhase = session.current_phase;
    const nextPhase = getNextPhase(session.pathway, previousPhase);

    // Calculate new progress
    const phases = PHASE_ORDER[session.pathway] || [];
    const currentIndex = phases.indexOf(previousPhase);
    const newProgress = phases.length > 0
      ? Math.round(((currentIndex + 1) / phases.length) * 100)
      : session.overall_completion;

    // Update session
    const updateData: Record<string, unknown> = {
      overall_completion: newProgress,
      updated_at: new Date().toISOString(),
    };

    if (nextPhase) {
      updateData.current_phase = nextPhase;
    } else {
      // Session complete
      updateData.status = 'completed';
      updateData.end_time = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('bmad_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      return {
        success: false,
        error: `Failed to update session: ${updateError.message}`,
      };
    }

    // Record phase completion in outputs
    await supabase.from('bmad_phase_outputs').insert({
      session_id: sessionId,
      phase_id: previousPhase,
      output_id: `completion-${Date.now()}`,
      output_name: 'Phase Completion',
      output_type: 'document',
      output_data: {
        reason: input.reason,
        key_outcomes: input.key_outcomes || [],
        completed_at: new Date().toISOString(),
      },
      is_required: false,
    });

    return {
      success: true,
      data: {
        previousPhase,
        nextPhase,
        completionReason: input.reason,
        sessionProgress: newProgress,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error completing phase: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Switch the sub-persona mode
 */
export async function switchPersonaMode(
  sessionId: string,
  input: SwitchModeInput
): Promise<SwitchModeResult> {
  try {
    const supabase = await createClient();

    // Get current sub-persona state
    const { data: session, error: fetchError } = await supabase
      .from('bmad_sessions')
      .select('sub_persona_state')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return {
        success: false,
        error: `Failed to fetch session: ${fetchError?.message || 'Session not found'}`,
      };
    }

    const currentState = session.sub_persona_state as SubPersonaSessionState | null;
    const previousMode = currentState?.currentMode || 'inquisitive';

    // Create updated state
    const updatedState: SubPersonaSessionState = currentState || maryPersona.initializeSubPersonaState('new-idea');
    updatedState.currentMode = input.new_mode;
    updatedState.modeHistory = [
      ...(updatedState.modeHistory || []),
      {
        mode: input.new_mode,
        timestamp: new Date(),
        trigger: `tool_switch: ${input.reason}`,
      },
    ];

    // Update database
    const { error: updateError } = await supabase
      .from('bmad_sessions')
      .update({
        sub_persona_state: updatedState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      return {
        success: false,
        error: `Failed to update mode: ${updateError.message}`,
      };
    }

    return {
      success: true,
      data: {
        previousMode,
        newMode: input.new_mode,
        reason: input.reason,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error switching mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Provide a strategic recommendation (kill/pivot/proceed)
 */
export async function recommendAction(
  sessionId: string,
  input: RecommendActionInput
): Promise<RecommendActionResult> {
  try {
    const supabase = await createClient();

    // Get current session state for viability assessment
    const { data: session, error: fetchError } = await supabase
      .from('bmad_sessions')
      .select('sub_persona_state')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return {
        success: false,
        error: `Failed to fetch session: ${fetchError?.message || 'Session not found'}`,
      };
    }

    const currentState = session.sub_persona_state as SubPersonaSessionState | null;

    // Use the existing viability assessment logic
    const assessment = maryPersona.assessViability(
      currentState || maryPersona.initializeSubPersonaState('new-idea'),
      input.concerns,
      input.strengths
    );

    // Update kill decision state
    if (currentState) {
      const updatedState = maryPersona.updateKillDecision(
        currentState,
        input.concerns,
        true // A recommendation counts as a probe
      );

      await supabase
        .from('bmad_sessions')
        .update({
          sub_persona_state: updatedState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }

    // Record the recommendation
    await supabase.from('bmad_phase_outputs').insert({
      session_id: sessionId,
      phase_id: 'viability_assessment',
      output_id: `recommendation-${Date.now()}`,
      output_name: 'Strategic Recommendation',
      output_type: 'analysis',
      output_data: {
        recommendation: assessment.recommendation,
        viability_score: assessment.score,
        concerns: input.concerns,
        strengths: input.strengths,
        reasoning: assessment.reasoning,
        additional_context: input.additional_context,
        assessed_at: new Date().toISOString(),
      },
      is_required: false,
    });

    return {
      success: true,
      data: {
        recommendation: assessment.recommendation,
        viabilityScore: assessment.score,
        concerns: input.concerns,
        strengths: input.strengths,
        reasoning: assessment.reasoning,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error making recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Update session context with a new insight
 */
export async function updateSessionContext(
  sessionId: string,
  input: UpdateContextInput
): Promise<UpdateContextResult> {
  try {
    const supabase = await createClient();

    // Get current phase
    const { data: session } = await supabase
      .from('bmad_sessions')
      .select('current_phase')
      .eq('id', sessionId)
      .single();

    // Record the insight
    await supabase.from('bmad_phase_outputs').insert({
      session_id: sessionId,
      phase_id: session?.current_phase || 'general',
      output_id: `insight-${Date.now()}`,
      output_name: 'Session Insight',
      output_type: 'text',
      output_data: {
        insight: input.insight,
        category: input.category || 'general',
        recorded_at: new Date().toISOString(),
      },
      is_required: false,
    });

    // Count total insights
    const { count } = await supabase
      .from('bmad_phase_outputs')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('output_name', 'Session Insight');

    return {
      success: true,
      data: {
        insightAdded: input.insight,
        totalInsights: count || 1,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error updating context: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
