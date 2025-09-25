import { BmadSession } from '@/lib/bmad/types'
import { ConversationQueries } from '@/lib/supabase/conversation-queries'
import { ConversationContextInsert } from '@/lib/supabase/conversation-schema'
import { createConversationSummarizer } from './conversation-summarizer'

export interface PhaseContext {
  phase: string
  objectives: string[]
  keyInsights: string[]
  decisions: string[]
  challengesIdentified: string[]
  nextPhasePrep: string[]
}

export interface ContextBridge {
  fromPhase: string
  toPhase: string
  carryOverInsights: string[]
  contextualPrompt: string
  transitionGuidance: string
}

export class CoachingContextBridge {
  constructor(private conversationId: string) {}

  /**
   * Create phase context when BMad session phase changes
   */
  async capturePhaseContext(
    bmadSession: BmadSession,
    completedPhase: string
  ): Promise<PhaseContext> {
    // Get recent conversation messages for this phase
    const recentMessages = await ConversationQueries.getRecentMessages(
      this.conversationId, 
      30
    )

    // Generate phase-specific context summary
    const phaseContextPrompt = this.buildPhaseContextPrompt(
      completedPhase,
      bmadSession,
      recentMessages
    )

    const contextResponse = await this.generatePhaseContext(phaseContextPrompt)
    const phaseContext = this.parsePhaseContext(contextResponse, completedPhase)

    // Store phase context in database
    await this.storePhaseContext(phaseContext, bmadSession)

    return phaseContext
  }

  /**
   * Generate context bridge for transitioning between phases
   */
  async createContextBridge(
    fromPhase: string,
    toPhase: string,
    bmadSession: BmadSession
  ): Promise<ContextBridge> {
    // Get context from previous phase
    const fromPhaseContext = await ConversationQueries.getConversationContext(
      this.conversationId,
      'bmad_phase'
    )

    // Get relevant insights and decisions
    const insights = await ConversationQueries.getConversationContext(
      this.conversationId,
      'key_insight'
    )

    const decisions = await ConversationQueries.getConversationContext(
      this.conversationId,
      'decision_point'
    )

    // Generate bridge context
    const bridgePrompt = this.buildBridgePrompt(
      fromPhase,
      toPhase,
      bmadSession,
      fromPhaseContext,
      insights,
      decisions
    )

    const bridgeResponse = await this.generatePhaseContext(bridgePrompt)
    const contextBridge = this.parseContextBridge(
      bridgeResponse, 
      fromPhase, 
      toPhase
    )

    // Store the bridge for future reference
    await this.storeBridgeContext(contextBridge, bmadSession)

    return contextBridge
  }

  /**
   * Get coaching prompt with phase-aware context
   */
  async getPhaseAwareContext(bmadSession: BmadSession): Promise<string> {
    const currentPhase = bmadSession.currentPhase
    const pathway = bmadSession.pathway

    // Get phase-specific context
    const phaseContexts = await ConversationQueries.getConversationContext(
      this.conversationId,
      'bmad_phase'
    )

    // Get recent insights and decisions
    const recentInsights = await ConversationQueries.getConversationContext(
      this.conversationId,
      'key_insight'
    )

    const recentDecisions = await ConversationQueries.getConversationContext(
      this.conversationId,
      'decision_point'
    )

    return this.buildPhaseAwarePrompt(
      currentPhase,
      pathway,
      bmadSession,
      phaseContexts,
      recentInsights,
      recentDecisions
    )
  }

  /**
   * Build prompt for capturing phase context
   */
  private buildPhaseContextPrompt(
    phase: string,
    bmadSession: BmadSession,
    messages: any[]
  ): string {
    const conversationText = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n')

    const phaseDescriptions: Record<string, string> = {
      foundation: 'establishing core context and strategic objectives',
      discovery: 'gathering insights and analyzing market conditions', 
      ideation: 'creating and exploring strategic options',
      analysis: 'analyzing feasibility and strategic alignment',
      validation: 'testing assumptions and validating approaches',
      planning: 'developing concrete implementation plans',
      synthesis: 'combining insights into coherent strategy',
      execution: 'preparing actionable next steps and timelines'
    }

    return `You are analyzing the completion of the "${phase}" phase in a BMad Method strategic coaching session (${bmadSession.pathway} pathway). The "${phase}" phase focuses on ${phaseDescriptions[phase] || 'strategic development'}.

Please extract the key outcomes from this phase in the following structure:

PHASE OBJECTIVES ACHIEVED:
- [What specific objectives were accomplished in this phase]
- [How well the phase goals were met]

KEY INSIGHTS DISCOVERED:
- [Important strategic insights or breakthroughs]
- [New understanding or perspectives gained]

DECISIONS MADE:
- [Strategic decisions reached during this phase]
- [Choices made that will impact future phases]

CHALLENGES IDENTIFIED:
- [Obstacles or issues that emerged]
- [Areas requiring further attention]

NEXT PHASE PREPARATION:
- [What should carry forward to the next phase]
- [Specific context needed for continued progress]

Current BMad Session Context:
- Pathway: ${bmadSession.pathway}
- Current Phase: ${phase}
- Progress: ${Math.round(bmadSession.progress.overallCompletion)}%
- Current Step: ${bmadSession.progress.currentStep}

Phase Conversation:
${conversationText}

Provide the response in the exact format above with clear section headers.`
  }

  /**
   * Build prompt for context bridge between phases
   */
  private buildBridgePrompt(
    fromPhase: string,
    toPhase: string,
    bmadSession: BmadSession,
    phaseContexts: any[],
    insights: any[],
    decisions: any[]
  ): string {
    const fromPhaseContext = phaseContexts
      .filter(ctx => ctx.content.includes(fromPhase))
      .map(ctx => ctx.content)
      .join('\n\n')

    const insightContext = insights
      .map(insight => `• ${insight.content}`)
      .join('\n')

    const decisionContext = decisions
      .map(decision => `• ${decision.content}`)
      .join('\n')

    const phaseTransitions: Record<string, Record<string, string>> = {
      foundation: {
        discovery: 'Now that core objectives are established, begin exploring market landscape and opportunities',
        ideation: 'With foundation set, start generating creative solutions and strategic options'
      },
      discovery: {
        ideation: 'Based on market insights, generate innovative solutions and approaches',
        analysis: 'With market understanding, analyze feasibility and strategic fit of options'
      },
      ideation: {
        analysis: 'Evaluate generated ideas for strategic alignment and feasibility',
        validation: 'Test the most promising ideas against real-world constraints'
      },
      analysis: {
        validation: 'Test analyzed approaches with stakeholders and market feedback',
        planning: 'Develop detailed implementation plans for validated strategies'
      },
      validation: {
        planning: 'Create detailed execution plans based on validated approaches',
        synthesis: 'Integrate validated insights into comprehensive strategic framework'
      },
      planning: {
        execution: 'Begin implementing planned strategies with clear next steps',
        synthesis: 'Combine planning insights into holistic strategic approach'
      },
      synthesis: {
        execution: 'Transform synthesized strategy into actionable implementation steps'
      }
    }

    const transitionGuidance = phaseTransitions[fromPhase]?.[toPhase] || 
                             `Transition from ${fromPhase} focus to ${toPhase} objectives`

    return `Create a context bridge for transitioning from "${fromPhase}" phase to "${toPhase}" phase in a BMad Method coaching session (${bmadSession.pathway} pathway).

CARRY-OVER INSIGHTS:
[Select the most relevant insights from the previous phase that should inform the next phase]

CONTEXTUAL PROMPT:
[Provide coaching context that helps maintain continuity between phases]

TRANSITION GUIDANCE:
[Specific guidance for how to approach the new phase based on previous phase outcomes]

Previous Phase Context:
${fromPhaseContext}

Key Insights Available:
${insightContext}

Decisions Made:
${decisionContext}

Standard Transition: ${transitionGuidance}

Current Session State:
- Pathway: ${bmadSession.pathway}
- Overall Progress: ${Math.round(bmadSession.progress.overallCompletion)}%
- Next Steps: ${bmadSession.progress.nextSteps.join(', ')}

Provide the response in the exact format above.`
  }

  /**
   * Build phase-aware coaching prompt
   */
  private buildPhaseAwarePrompt(
    currentPhase: string,
    pathway: string,
    bmadSession: BmadSession,
    phaseContexts: any[],
    insights: any[],
    decisions: any[]
  ): string {
    const phaseSpecificGuidance: Record<string, string> = {
      foundation: 'Focus on establishing clear strategic context and objectives. Help clarify vision, scope, and success criteria.',
      discovery: 'Emphasize market research, competitive analysis, and understanding the strategic landscape.',
      ideation: 'Encourage creative thinking, brainstorming, and generation of multiple strategic options.',
      analysis: 'Apply analytical frameworks to evaluate options. Focus on feasibility, risks, and strategic alignment.',
      validation: 'Guide testing of assumptions and validation of strategic approaches with stakeholders.',
      planning: 'Help develop concrete, actionable implementation plans with timelines and resources.',
      synthesis: 'Support integration of insights into cohesive strategic framework and decision-making.',
      execution: 'Focus on actionable next steps, implementation tactics, and monitoring progress.'
    }

    const contextSummary = phaseContexts
      .map(ctx => ctx.content)
      .slice(0, 3)
      .join('\n\n')

    const keyInsightsSummary = insights
      .map(insight => insight.content)
      .slice(0, 5)
      .join('\n• ')

    const recentDecisions = decisions
      .map(decision => decision.content)
      .slice(0, 3)
      .join('\n• ')

    return `You are Mary, an expert strategic business coach specializing in the BMad Method. You're currently guiding someone through the "${currentPhase}" phase of the ${pathway} pathway.

CURRENT PHASE FOCUS: ${phaseSpecificGuidance[currentPhase] || 'Strategic development'}

SESSION CONTEXT:
- Current Phase: ${currentPhase}
- Pathway: ${pathway} 
- Progress: ${Math.round(bmadSession.progress.overallCompletion)}%
- Current Step: ${bmadSession.progress.currentStep}

CONVERSATION HISTORY CONTEXT:
${contextSummary}

KEY INSIGHTS TO REFERENCE:
• ${keyInsightsSummary}

RECENT STRATEGIC DECISIONS:
• ${recentDecisions}

COACHING GUIDELINES:
1. Maintain awareness of the current BMad Method phase and its objectives
2. Reference relevant insights and decisions from previous phases
3. Guide conversation toward phase-specific outcomes
4. Connect current discussion to overall strategic journey
5. Prepare groundwork for future phases when appropriate

Continue the coaching conversation with full awareness of this context and the current phase focus.`
  }

  /**
   * Generate phase context using Claude API
   */
  private async generatePhaseContext(prompt: string): Promise<string> {
    try {
      const response = await fetch('/api/chat/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          model: 'claude-3-sonnet-20240229',
          maxTokens: 1500
        })
      })

      if (!response.ok) {
        throw new Error(`Phase context generation failed: ${response.status}`)
      }

      const data = await response.json()
      return data.summary || ''
    } catch (error) {
      console.error('Phase context generation failed:', error)
      return 'Phase context generation unavailable'
    }
  }

  /**
   * Parse phase context response
   */
  private parsePhaseContext(response: string, phase: string): PhaseContext {
    const sections = this.extractSections(response)
    
    return {
      phase,
      objectives: this.parseListItems(sections.objectives || ''),
      keyInsights: this.parseListItems(sections.insights || ''),
      decisions: this.parseListItems(sections.decisions || ''),
      challengesIdentified: this.parseListItems(sections.challenges || ''),
      nextPhasePrep: this.parseListItems(sections.preparation || '')
    }
  }

  /**
   * Parse context bridge response
   */
  private parseContextBridge(
    response: string, 
    fromPhase: string, 
    toPhase: string
  ): ContextBridge {
    const sections = this.extractSections(response)
    
    return {
      fromPhase,
      toPhase,
      carryOverInsights: this.parseListItems(sections.insights || ''),
      contextualPrompt: sections.prompt || '',
      transitionGuidance: sections.guidance || ''
    }
  }

  /**
   * Extract sections from structured response
   */
  private extractSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {}
    const sectionRegex = /([A-Z\s]+):\s*\n(.*?)(?=\n[A-Z\s]+:|$)/gs
    let match

    while ((match = sectionRegex.exec(text)) !== null) {
      const sectionName = match[1].toLowerCase().trim().replace(/[\s\-]+/g, '_')
      const content = match[2].trim()
      
      sections[sectionName] = content
    }

    return sections
  }

  /**
   * Parse list items from text
   */
  private parseListItems(text: string): string[] {
    return text
      .split(/\n/)
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  /**
   * Store phase context in database
   */
  private async storePhaseContext(
    phaseContext: PhaseContext,
    bmadSession: BmadSession
  ): Promise<void> {
    const contextData: ConversationContextInsert = {
      conversation_id: this.conversationId,
      context_type: 'bmad_phase',
      content: `Phase: ${phaseContext.phase}\n\nObjectives:\n• ${phaseContext.objectives.join('\n• ')}\n\nInsights:\n• ${phaseContext.keyInsights.join('\n• ')}\n\nDecisions:\n• ${phaseContext.decisions.join('\n• ')}\n\nChallenges:\n• ${phaseContext.challengesIdentified.join('\n• ')}\n\nNext Phase Prep:\n• ${phaseContext.nextPhasePrep.join('\n• ')}`,
      tokens_saved: 0,
      message_range_start: 0,
      message_range_end: bmadSession.progress.overallCompletion
    }

    await ConversationQueries.addConversationContext(contextData)
  }

  /**
   * Store bridge context in database
   */
  private async storeBridgeContext(
    bridge: ContextBridge,
    bmadSession: BmadSession
  ): Promise<void> {
    const bridgeData: ConversationContextInsert = {
      conversation_id: this.conversationId,
      context_type: 'bmad_phase',
      content: `Bridge: ${bridge.fromPhase} → ${bridge.toPhase}\n\nCarry-over Insights:\n• ${bridge.carryOverInsights.join('\n• ')}\n\nContextual Prompt:\n${bridge.contextualPrompt}\n\nTransition Guidance:\n${bridge.transitionGuidance}`,
      tokens_saved: 0,
      message_range_start: 0,
      message_range_end: bmadSession.progress.overallCompletion
    }

    await ConversationQueries.addConversationContext(bridgeData)
  }
}

/**
 * Factory function for creating context bridges
 */
export function createCoachingContextBridge(conversationId: string): CoachingContextBridge {
  return new CoachingContextBridge(conversationId)
}