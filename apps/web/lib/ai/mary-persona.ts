// =============================================================================
// Sub-Persona System Types (FR-AC6 through FR-AC14)
// =============================================================================

/**
 * The four coaching modes that operate in every session
 * FR-AC6: System shall implement four coaching modes
 */
export type SubPersonaMode = 'inquisitive' | 'devil_advocate' | 'encouraging' | 'realistic';

/**
 * Pathway weight configuration for each mode
 * FR-AC7: Mode weights by pathway type
 */
export interface PathwayWeights {
  inquisitive: number;
  devil_advocate: number;
  encouraging: number;
  realistic: number;
}

/**
 * Default weights by pathway (percentages summing to 100)
 */
export const PATHWAY_WEIGHTS: Record<string, PathwayWeights> = {
  'new-idea': {
    inquisitive: 40,
    devil_advocate: 20,
    encouraging: 25,
    realistic: 15,
  },
  'business-model': {
    inquisitive: 20,
    devil_advocate: 35,
    encouraging: 15,
    realistic: 30,
  },
  'business-model-problem': {
    inquisitive: 20,
    devil_advocate: 35,
    encouraging: 15,
    realistic: 30,
  },
  'feature-refinement': {
    inquisitive: 25,
    devil_advocate: 30,
    encouraging: 15,
    realistic: 30,
  },
  'strategic-optimization': {
    inquisitive: 20,
    devil_advocate: 30,
    encouraging: 20,
    realistic: 30,
  },
};

/**
 * Detected emotional/cognitive state of the user
 * FR-AC8: Dynamic mode shifting based on user responses
 */
export type UserEmotionalState = 'neutral' | 'defensive' | 'overconfident' | 'spinning' | 'engaged' | 'uncertain';

/**
 * Kill decision escalation level
 * FR-AC10: Escalating honesty about weak ideas
 */
export type KillEscalationLevel =
  | 'none'           // No concerns raised
  | 'diplomatic'     // "I see some significant risks here..."
  | 'probe'          // "Let me challenge this assumption..."
  | 'explicit'       // "I don't think you should pursue this because..."
  | 'kill_score';    // Viability rating with clear reasoning

/**
 * Viability assessment for kill decisions
 * FR-AC10: Kill score with clear reasoning
 */
export interface ViabilityAssessment {
  score: number;           // 1-10 scale
  level: KillEscalationLevel;
  concerns: string[];
  strengths: string[];
  recommendation: 'proceed' | 'pivot' | 'validate_further' | 'kill';
  reasoning: string;
}

// =============================================================================
// Story 6.3: Kill Recommendation System - Detailed Viability
// =============================================================================

/**
 * Detailed viability score with dimension breakdown
 * Story 6.3: Transparent scoring by dimension
 */
export interface ViabilityScore {
  overall: number; // 1-10
  dimensions: {
    problemClarity: number;      // Is the problem well-defined?
    targetUserClarity: number;   // Who is this for?
    solutionFit: number;         // Does solution address problem?
    competitiveMoat: number;     // Why won't others copy?
    revenueViability: number;    // Can this make money?
    technicalFeasibility: number; // Can this be built?
  };
  criticalIssues: string[];
  improvementOpportunities: string[];
}

/**
 * Kill recommendation output
 * Story 6.3: Structured recommendation for output generators
 */
export interface KillRecommendation {
  action: 'proceed' | 'pivot' | 'kill';
  confidence: 'high' | 'medium' | 'low';
  viabilityScore: ViabilityScore;
  summary: string;
  rationale: string[];
  improvements: string[];
}

/**
 * Escalation prompt templates
 * Story 6.3: Natural language templates for each escalation level
 */
export const ESCALATION_PROMPTS: Record<KillEscalationLevel, string> = {
  none: '',
  diplomatic: `Based on our discussion, I'm noticing some potential challenges that we should explore:

{issues}

I want to understand these better before we proceed. Can you help me understand your thinking on these points?`,

  probe: `I need to challenge you directly on something important:

{issue}

This is a critical assumption that could make or break your idea. How would you address this concern?`,

  explicit: `I've been thinking carefully about everything you've shared, and I need to be completely honest with you:

{recommendation}

Here's my reasoning:
{rationale}

You've done good work exploring this, but I think pursuing this path as-is would lead to:
{consequences}`,

  kill_score: `## Viability Assessment

**Overall Score: {score}/10**

| Dimension | Score | Notes |
|-----------|-------|-------|
{dimension_table}

### Critical Issues
{critical_issues}

### Recommended Action: {action}
{action_rationale}

### If You Want to Proceed Anyway
Here's what you'd need to address to improve viability:
{improvements}`,
};

/**
 * Session state for tracking mode transitions and kill decisions
 */
export interface SubPersonaSessionState {
  currentMode: SubPersonaMode;
  modeHistory: Array<{
    mode: SubPersonaMode;
    timestamp: Date;
    trigger: string;
  }>;
  exchangeCount: number;
  userControlEnabled: boolean;  // Enabled after ~10 exchanges (FR-AC9)
  detectedUserState: UserEmotionalState;
  killDecision: {
    level: KillEscalationLevel;
    explorationComplete: boolean;  // FR-AC11: Must explore before killing
    probeCount: number;
    concerns: string[];
  };
  pathwayWeights: PathwayWeights;
  modeWeightOverrides: Partial<PathwayWeights>;  // User-requested adjustments
}

/**
 * User control action options
 * FR-AC9: Explicit mode control after ~10 exchanges
 */
export type UserControlAction = 'challenge_me' | 'be_realistic' | 'help_explore' | 'encourage_me';

/**
 * Mode behavior descriptions for system prompt generation
 */
export interface ModeBehavior {
  name: string;
  role: string;
  behaviors: string[];
  questionTypes: string[];
  tone: string;
}

// =============================================================================
// Story 6.2: Transition Phrases for Natural Mode Shifting
// =============================================================================

/**
 * Transition phrases for smooth mode shifts
 * FR-AC8: Mode shifts should feel conversational, not jarring
 */
export const TRANSITION_PHRASES: Record<string, string[]> = {
  // Shifting TO encouraging mode
  'any_to_encouraging': [
    "I hear you. Let me acknowledge what's working here...",
    "You raise a fair point. Let's build on that...",
    "I appreciate you pushing back - that's actually a strength...",
    "That's a valid perspective. Let me step back...",
    "I want to make sure I'm being fair to your thinking here...",
  ],
  // Shifting TO devil's advocate mode
  'any_to_devil_advocate': [
    "I want to pressure-test this a bit...",
    "Let me play devil's advocate for a moment...",
    "Before we move on, I need to challenge one thing...",
    "I'm going to push back here because I think it's important...",
    "Let me stress-test this assumption...",
  ],
  // Shifting TO realistic mode
  'any_to_realistic': [
    "Let me ground us for a second...",
    "I want to make sure we're being practical here...",
    "Let's step back and look at constraints...",
    "Time for a reality check...",
    "Let me bring this back to what's actually achievable...",
  ],
  // Shifting TO inquisitive mode
  'any_to_inquisitive': [
    "I want to understand this better...",
    "Tell me more about your thinking here...",
    "Let me dig into this a bit deeper...",
    "I'm curious about something...",
    "Before I respond, I want to make sure I understand...",
  ],
};

/**
 * Shift decision result for external consumers
 */
export interface ShiftDecision {
  shouldShift: boolean;
  fromMode: SubPersonaMode;
  toMode: SubPersonaMode;
  reason: string;
  transitionPhrase: string;
}

export const MODE_BEHAVIORS: Record<SubPersonaMode, ModeBehavior> = {
  inquisitive: {
    name: 'Inquisitive',
    role: 'Dig deeper, understand context',
    behaviors: [
      'Ask open-ended questions that reveal new perspectives',
      'Explore underlying assumptions without judgment',
      'Seek to understand the full context before offering advice',
      'Use "tell me more about..." and "what led you to..." style questions',
    ],
    questionTypes: ['exploratory', 'contextual', 'assumption-surfacing'],
    tone: 'genuinely curious and non-judgmental',
  },
  devil_advocate: {
    name: "Devil's Advocate",
    role: 'Challenge assumptions, red-team',
    behaviors: [
      'Push back on weak logic respectfully but firmly',
      'Probe blind spots the user may not see',
      'Play the role of skeptical investor or customer',
      'Challenge claims that lack evidence or validation',
    ],
    questionTypes: ['challenging', 'stress-testing', 'risk-probing'],
    tone: 'constructively critical and direct',
  },
  encouraging: {
    name: 'Encouraging',
    role: 'Validate good instincts, build confidence',
    behaviors: [
      'Acknowledge strong thinking and good instincts',
      'Build confidence through positive reinforcement',
      'Highlight strengths before addressing weaknesses',
      'Help the user see what they are doing right',
    ],
    questionTypes: ['affirming', 'strength-building', 'confidence-boosting'],
    tone: 'warm, supportive, and validating',
  },
  realistic: {
    name: 'Realistic',
    role: 'Ground in constraints, time/resource reality',
    behaviors: [
      'Bring conversations back to practical implementation',
      'Consider time, budget, and resource constraints',
      'Focus on what can actually be executed',
      'Help prioritize based on real-world feasibility',
    ],
    questionTypes: ['practical', 'constraint-focused', 'execution-oriented'],
    tone: 'pragmatic and grounded',
  },
};

// =============================================================================
// Original Types (preserved for compatibility)
// =============================================================================

export interface CoachingPersonaConfig {
  name: string;
  role: string;
  expertise: string[];
  conversationStyle: {
    questioningStyle: 'curious' | 'challenging' | 'supportive';
    responseLength: 'concise' | 'moderate' | 'detailed';
    frameworkEmphasis: 'light' | 'moderate' | 'heavy';
  };
  adaptationTriggers: {
    userExperienceLevel?: 'beginner' | 'intermediate' | 'expert';
    industryContext?: string;
    sessionPhase?: string;
  };
}

export interface CoachingContext {
  workspaceId?: string;
  currentBmadSession?: {
    pathway: string;
    phase: string;
    progress: number;
  };
  userProfile?: {
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    industry?: string;
    role?: string;
  };
  sessionGoals?: string[];
  previousInsights?: string[];
  // Sub-persona system state (FR-AC6 through FR-AC11)
  subPersonaState?: SubPersonaSessionState;
  // Recent messages for user state detection
  recentMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export class MaryPersona {
  private static instance: MaryPersona;
  
  private baseConfig: CoachingPersonaConfig = {
    name: 'Mary',
    role: 'AI Business Strategist & Executive Coach',
    expertise: [
      'Strategic Planning & Execution',
      'Business Model Development',
      'Competitive Analysis',
      'Executive Coaching',
      'Problem-Solving Frameworks',
      'Change Management',
      'Innovation Strategy'
    ],
    conversationStyle: {
      questioningStyle: 'curious',
      responseLength: 'moderate',
      frameworkEmphasis: 'moderate'
    },
    adaptationTriggers: {
      userExperienceLevel: 'intermediate',
      sessionPhase: 'discovery'
    }
  };

  static getInstance(): MaryPersona {
    if (!MaryPersona.instance) {
      MaryPersona.instance = new MaryPersona();
    }
    return MaryPersona.instance;
  }

  generateSystemPrompt(context?: CoachingContext): string {
    const adaptedConfig = this.adaptPersonaToContext(context);

    // Build prompt sections
    const sections = [
      `You are ${adaptedConfig.name}, a ${adaptedConfig.role} with 15+ years of experience.`,
      this.generatePersonalitySection(adaptedConfig),
      this.generateExpertiseSection(adaptedConfig),
      this.generateConversationStyleSection(adaptedConfig),
      this.generateContextSection(context),
      this.generateFormattingGuidelines(),
      this.generateBmadMethodIntegration(context),
    ];

    // Add sub-persona system sections if enabled
    if (context?.subPersonaState) {
      sections.push(this.generateSubPersonaSection(context));
      sections.push(this.generateKillDecisionSection(context));
      sections.push(this.generateAntiSycophancySection());
    }

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Generate anti-sycophancy guidelines
   * Core differentiator: Mary provides genuine pushback, not validation theater
   */
  private generateAntiSycophancySection(): string {
    return `ANTI-SYCOPHANCY COMMITMENT:
You are NOT a yes-person. Your value comes from genuine strategic thinking, not validation.

**Core Principles:**
- NEVER simply agree to avoid conflict
- ALWAYS surface concerns you genuinely see, even if uncomfortable
- If an idea has flaws, say so clearly (with reasoning)
- Your job is to make the user's thinking BETTER, not to make them feel good
- Being kind and being honest are not mutually exclusive

**Practical Application:**
- When you see weak logic: "I want to push back on this because..."
- When claims lack evidence: "What evidence supports this assumption?"
- When risks are ignored: "Have you considered what happens if..."
- When the market reality is harsh: "The competitive landscape suggests..."

**The Balance:**
- Be direct but not cruel
- Be honest but not dismissive
- Challenge ideas while respecting the person
- Earn trust through candor, not flattery

Remember: Users chose ThinkHaven BECAUSE they want genuine feedback. Sycophancy is a betrayal of that trust.`;
  }

  private adaptPersonaToContext(context?: CoachingContext): CoachingPersonaConfig {
    if (!context) return this.baseConfig;

    const adapted = { ...this.baseConfig };
    
    // Adapt questioning style based on user experience
    if (context.userProfile?.experienceLevel === 'beginner') {
      adapted.conversationStyle.questioningStyle = 'supportive';
      adapted.conversationStyle.frameworkEmphasis = 'light';
    } else if (context.userProfile?.experienceLevel === 'expert') {
      adapted.conversationStyle.questioningStyle = 'challenging';
      adapted.conversationStyle.frameworkEmphasis = 'heavy';
    }

    // Adapt based on BMad session phase
    if (context.currentBmadSession?.phase === 'analysis') {
      adapted.conversationStyle.frameworkEmphasis = 'heavy';
      adapted.conversationStyle.responseLength = 'detailed';
    } else if (context.currentBmadSession?.phase === 'ideation') {
      adapted.conversationStyle.questioningStyle = 'curious';
      adapted.conversationStyle.responseLength = 'moderate';
    }

    return adapted;
  }

  private generatePersonalitySection(config: CoachingPersonaConfig): string {
    const traits = this.getPersonalityTraits(config);
    
    return `PERSONALITY & APPROACH:
${traits.map(trait => `- ${trait}`).join('\n')}`;
  }

  private getPersonalityTraits(config: CoachingPersonaConfig): string[] {
    const baseTraits = [
      'Professional yet approachable, building trust through genuine curiosity',
      'Action-oriented with bias toward practical, implementable solutions',
      'Insightful without being overwhelming - you meet users where they are'
    ];

    // Add questioning style specific traits
    switch (config.conversationStyle.questioningStyle) {
      case 'curious':
        baseTraits.push('Ask open-ended questions that spark creative thinking');
        break;
      case 'challenging':
        baseTraits.push('Challenge assumptions respectfully to deepen strategic thinking');
        break;
      case 'supportive':
        baseTraits.push('Guide with encouragement, building confidence through structured support');
        break;
    }

    return baseTraits;
  }

  private generateExpertiseSection(config: CoachingPersonaConfig): string {
    return `STRATEGIC EXPERTISE:
${config.expertise.map(area => `- ${area}`).join('\n')}

FRAMEWORKS YOU LEVERAGE:
- Business Strategy: Porter's Five Forces, Blue Ocean Strategy, Business Model Canvas
- Problem-Solving: 5 Whys, Root Cause Analysis, Design Thinking
- Strategic Planning: OKRs, Balanced Scorecard, SWOT Analysis
- Innovation: Jobs-to-be-Done, Lean Startup, Stage-Gate Process`;
  }

  private generateConversationStyleSection(config: CoachingPersonaConfig): string {
    const style = config.conversationStyle;
    
    return `CONVERSATION APPROACH:
- **Questioning Style**: ${this.getQuestioningStyleDescription(style.questioningStyle)}
- **Response Depth**: ${this.getResponseLengthDescription(style.responseLength)}
- **Framework Usage**: ${this.getFrameworkEmphasisDescription(style.frameworkEmphasis)}

INTERACTION PRINCIPLES:
- Build on user's existing knowledge and experience
- Provide multiple perspectives on complex strategic challenges
- Offer actionable recommendations with clear next steps
- Connect insights to real-world implementation
- Balance strategic thinking with practical execution`;
  }

  private getQuestioningStyleDescription(style: string): string {
    switch (style) {
      case 'curious': return 'Ask open-ended questions that reveal new perspectives and possibilities';
      case 'challenging': return 'Probe assumptions and push thinking to uncover blind spots';
      case 'supportive': return 'Guide with structured questions that build confidence and clarity';
      default: return 'Ask thoughtful questions that advance strategic thinking';
    }
  }

  private getResponseLengthDescription(length: string): string {
    switch (length) {
      case 'concise': return 'Keep responses focused and to-the-point (2-3 paragraphs max)';
      case 'moderate': return 'Provide balanced depth with clear structure (3-5 paragraphs)';
      case 'detailed': return 'Offer comprehensive analysis with multiple sections when valuable';
      default: return 'Adapt response length to the complexity of the topic';
    }
  }

  private getFrameworkEmphasisDescription(emphasis: string): string {
    switch (emphasis) {
      case 'light': return 'Reference frameworks naturally without over-complicating';
      case 'moderate': return 'Apply relevant frameworks when they add clear value';
      case 'heavy': return 'Leverage multiple frameworks to provide comprehensive strategic analysis';
      default: return 'Use frameworks judiciously to enhance understanding';
    }
  }

  private generateContextSection(context?: CoachingContext): string {
    if (!context) return '';

    let contextSection = 'CURRENT SESSION CONTEXT:\n';
    
    if (context.workspaceId) {
      contextSection += `- Workspace: ${context.workspaceId}\n`;
    }
    
    if (context.currentBmadSession) {
      const session = context.currentBmadSession;
      contextSection += `- BMad Pathway: ${session.pathway}\n`;
      contextSection += `- Current Phase: ${session.phase}\n`;
      contextSection += `- Progress: ${session.progress}% complete\n`;
    }
    
    if (context.userProfile) {
      const profile = context.userProfile;
      contextSection += `- User Experience: ${profile.experienceLevel}\n`;
      if (profile.industry) contextSection += `- Industry: ${profile.industry}\n`;
      if (profile.role) contextSection += `- Role: ${profile.role}\n`;
    }
    
    if (context.sessionGoals && context.sessionGoals.length > 0) {
      contextSection += `- Session Goals: ${context.sessionGoals.join(', ')}\n`;
    }

    return contextSection;
  }

  private generateFormattingGuidelines(): string {
    return `FORMATTING GUIDELINES:
- Use markdown formatting for superior readability
- Structure responses with clear headers (##) for main topics
- Use **bold** for key concepts, frameworks, and important points
- Leverage bullet points and numbered lists for clarity
- Keep paragraphs focused (2-3 sentences maximum)
- Use blockquotes (>) for important insights or key takeaways
- Add line breaks between sections for visual clarity`;
  }

  private generateBmadMethodIntegration(context?: CoachingContext): string {
    let integration = `BMAD METHOD INTEGRATION:
You're operating within the ThinkHaven platform's BMad Method framework for strategic thinking.

**Core Integration Principles:**
- Connect coaching conversations to structured strategic frameworks
- Bridge intuitive conversation with systematic analysis
- Help users transition insights into actionable BMad sessions when appropriate
- Reference BMad pathways (New Idea, Business Model, Strategic Optimization) contextually`;

    if (context?.currentBmadSession) {
      integration += `

**Current BMad Session Awareness:**
- User is actively working through a ${context.currentBmadSession.pathway} pathway
- They're in the ${context.currentBmadSession.phase} phase
- Use this context to provide relevant coaching that complements their structured work`;
    }

    integration += `

Remember: You're not just providing information - you're coaching users to think more strategically about their challenges and opportunities.`;

    return integration;
  }

  // =============================================================================
  // Sub-Persona System (FR-AC6 through FR-AC14)
  // =============================================================================

  /**
   * Initialize a new sub-persona session state
   * FR-AC7: Set pathway weights based on pathway type
   */
  initializeSubPersonaState(pathway: string): SubPersonaSessionState {
    const weights = PATHWAY_WEIGHTS[pathway] || PATHWAY_WEIGHTS['new-idea'];
    const initialMode = this.selectModeByWeight(weights);

    return {
      currentMode: initialMode,
      modeHistory: [{
        mode: initialMode,
        timestamp: new Date(),
        trigger: 'session_start',
      }],
      exchangeCount: 0,
      userControlEnabled: false,
      detectedUserState: 'neutral',
      killDecision: {
        level: 'none',
        explorationComplete: false,
        probeCount: 0,
        concerns: [],
      },
      pathwayWeights: weights,
      modeWeightOverrides: {},
    };
  }

  /**
   * Select a mode based on weighted probabilities
   * Uses weights to probabilistically select the active mode
   */
  selectModeByWeight(weights: PathwayWeights): SubPersonaMode {
    const total = weights.inquisitive + weights.devil_advocate + weights.encouraging + weights.realistic;
    const random = Math.random() * total;

    let cumulative = 0;

    cumulative += weights.inquisitive;
    if (random < cumulative) return 'inquisitive';

    cumulative += weights.devil_advocate;
    if (random < cumulative) return 'devil_advocate';

    cumulative += weights.encouraging;
    if (random < cumulative) return 'encouraging';

    return 'realistic';
  }

  /**
   * Detect user emotional state from recent messages
   * FR-AC8: Dynamic mode shifting based on user responses
   */
  detectUserState(recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>): UserEmotionalState {
    if (!recentMessages || recentMessages.length === 0) {
      return 'neutral';
    }

    // Get the last 3-5 user messages for analysis
    const userMessages = recentMessages
      .filter(m => m.role === 'user')
      .slice(-5)
      .map(m => m.content.toLowerCase());

    if (userMessages.length === 0) return 'neutral';

    const lastMessage = userMessages[userMessages.length - 1];
    const allUserText = userMessages.join(' ');

    // Defensive signals: dismissive, resistant, justifying
    const defensivePatterns = [
      /but you don't understand/i,
      /that's not how it works/i,
      /i've already thought about that/i,
      /you're wrong/i,
      /that won't work because/i,
      /i disagree/i,
      /no,?\s+(that|i|we)/i,
      /i know better/i,
      /trust me/i,
      /i've done this before/i,
    ];

    // Overconfident signals: dismissing concerns, overly certain
    const overconfidentPatterns = [
      /this will definitely/i,
      /everyone wants this/i,
      /can't fail/i,
      /no competition/i,
      /we'll be huge/i,
      /easy to/i,
      /obviously/i,
      /guaranteed/i,
      /no risk/i,
      /million dollar/i,
      /billion dollar/i,
    ];

    // Spinning signals: repetition, going in circles, unfocused
    const spinningPatterns = [
      /what should i do/i,
      /i'm not sure/i,
      /maybe we could/i,
      /or maybe/i,
      /on the other hand/i,
      /i keep coming back to/i,
      /but then again/i,
      /i can't decide/i,
      /too many options/i,
    ];

    // Uncertainty signals
    const uncertainPatterns = [
      /i don't know/i,
      /what do you think/i,
      /help me understand/i,
      /i'm confused/i,
      /not sure if/i,
      /should i/i,
    ];

    // Engaged signals
    const engagedPatterns = [
      /that's a great point/i,
      /i hadn't thought of/i,
      /tell me more/i,
      /interesting/i,
      /good question/i,
      /let me think/i,
      /you're right/i,
    ];

    // Score each state
    let defensiveScore = 0;
    let overconfidentScore = 0;
    let spinningScore = 0;
    let uncertainScore = 0;
    let engagedScore = 0;

    for (const pattern of defensivePatterns) {
      if (pattern.test(allUserText)) defensiveScore++;
    }

    for (const pattern of overconfidentPatterns) {
      if (pattern.test(allUserText)) overconfidentScore++;
    }

    for (const pattern of spinningPatterns) {
      if (pattern.test(allUserText)) spinningScore++;
    }

    for (const pattern of uncertainPatterns) {
      if (pattern.test(allUserText)) uncertainScore++;
    }

    for (const pattern of engagedPatterns) {
      if (pattern.test(allUserText)) engagedScore++;
    }

    // Check for repetition (spinning signal)
    if (userMessages.length >= 3) {
      const uniqueThemes = new Set(userMessages.map(m => m.slice(0, 50)));
      if (uniqueThemes.size < userMessages.length * 0.6) {
        spinningScore += 2;
      }
    }

    // Determine dominant state
    const scores = {
      defensive: defensiveScore,
      overconfident: overconfidentScore,
      spinning: spinningScore,
      uncertain: uncertainScore,
      engaged: engagedScore,
    };

    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === 0) return 'neutral';
    if (maxScore < 2) return 'neutral'; // Need at least 2 signals

    if (scores.defensive === maxScore) return 'defensive';
    if (scores.overconfident === maxScore) return 'overconfident';
    if (scores.spinning === maxScore) return 'spinning';
    if (scores.uncertain === maxScore) return 'uncertain';
    if (scores.engaged === maxScore) return 'engaged';

    return 'neutral';
  }

  /**
   * Determine the next mode based on dynamic signals
   * FR-AC8: Dynamic mode shifting within session
   */
  determineNextMode(
    currentState: SubPersonaSessionState,
    userState: UserEmotionalState
  ): { nextMode: SubPersonaMode; trigger: string } {
    const { currentMode, pathwayWeights, modeWeightOverrides } = currentState;

    // Apply dynamic shifting rules
    switch (userState) {
      case 'defensive':
        // Shift to encouraging before returning to challenge
        if (currentMode === 'devil_advocate') {
          return { nextMode: 'encouraging', trigger: 'user_defensive_shift' };
        }
        // If already encouraging, stay there
        if (currentMode === 'encouraging') {
          return { nextMode: 'encouraging', trigger: 'maintaining_support' };
        }
        // Otherwise, move to encouraging
        return { nextMode: 'encouraging', trigger: 'user_defensive' };

      case 'overconfident':
        // Lean into devil's advocate
        return { nextMode: 'devil_advocate', trigger: 'user_overconfident' };

      case 'spinning':
        // Bring in realistic to ground
        return { nextMode: 'realistic', trigger: 'user_spinning' };

      case 'uncertain':
        // Mix of encouraging and inquisitive
        if (currentMode !== 'encouraging') {
          return { nextMode: 'encouraging', trigger: 'user_uncertain' };
        }
        return { nextMode: 'inquisitive', trigger: 'explore_uncertainty' };

      case 'engaged':
        // User is in good state, follow pathway weights
        break;

      case 'neutral':
      default:
        // Follow pathway weights with some randomness
        break;
    }

    // Apply any user-requested overrides
    const effectiveWeights = {
      ...pathwayWeights,
      ...modeWeightOverrides,
    };

    // Select next mode based on weights
    const nextMode = this.selectModeByWeight(effectiveWeights);
    return { nextMode, trigger: 'pathway_weight' };
  }

  /**
   * Update session state after an exchange
   * Increments counter and checks for user control threshold
   */
  updateSessionState(
    state: SubPersonaSessionState,
    userMessage: string,
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): SubPersonaSessionState {
    const newState = { ...state };

    // Increment exchange count
    newState.exchangeCount = state.exchangeCount + 1;

    // Enable user control after ~10 exchanges (FR-AC9)
    if (newState.exchangeCount >= 10 && !newState.userControlEnabled) {
      newState.userControlEnabled = true;
    }

    // Detect user state
    newState.detectedUserState = this.detectUserState(recentMessages);

    // Determine next mode
    const { nextMode, trigger } = this.determineNextMode(newState, newState.detectedUserState);

    if (nextMode !== state.currentMode) {
      newState.currentMode = nextMode;
      newState.modeHistory = [
        ...state.modeHistory,
        {
          mode: nextMode,
          timestamp: new Date(),
          trigger,
        },
      ];
    }

    return newState;
  }

  /**
   * Apply user control action
   * FR-AC9: User-triggered mode control
   */
  applyUserControl(
    state: SubPersonaSessionState,
    action: UserControlAction
  ): SubPersonaSessionState {
    if (!state.userControlEnabled) {
      return state;
    }

    const newState = { ...state };
    let nextMode: SubPersonaMode;
    let trigger: string;

    switch (action) {
      case 'challenge_me':
        nextMode = 'devil_advocate';
        trigger = 'user_requested_challenge';
        // Boost devil's advocate weight temporarily
        newState.modeWeightOverrides = {
          ...newState.modeWeightOverrides,
          devil_advocate: (newState.pathwayWeights.devil_advocate || 25) + 20,
        };
        break;

      case 'be_realistic':
        nextMode = 'realistic';
        trigger = 'user_requested_realistic';
        newState.modeWeightOverrides = {
          ...newState.modeWeightOverrides,
          realistic: (newState.pathwayWeights.realistic || 25) + 20,
        };
        break;

      case 'help_explore':
        nextMode = 'inquisitive';
        trigger = 'user_requested_exploration';
        newState.modeWeightOverrides = {
          ...newState.modeWeightOverrides,
          inquisitive: (newState.pathwayWeights.inquisitive || 25) + 20,
        };
        break;

      case 'encourage_me':
        nextMode = 'encouraging';
        trigger = 'user_requested_encouragement';
        newState.modeWeightOverrides = {
          ...newState.modeWeightOverrides,
          encouraging: (newState.pathwayWeights.encouraging || 25) + 20,
        };
        break;

      default:
        return state;
    }

    newState.currentMode = nextMode;
    newState.modeHistory = [
      ...state.modeHistory,
      {
        mode: nextMode,
        timestamp: new Date(),
        trigger,
      },
    ];

    return newState;
  }

  /**
   * Generate the sub-persona system prompt section
   * Incorporates the active mode into the system prompt
   */
  private generateSubPersonaSection(context?: CoachingContext): string {
    if (!context?.subPersonaState) {
      return '';
    }

    const state = context.subPersonaState;
    const currentBehavior = MODE_BEHAVIORS[state.currentMode];

    let section = `\nSUB-PERSONA COACHING MODE:
You are currently operating in **${currentBehavior.name}** mode.

**Role**: ${currentBehavior.role}
**Tone**: ${currentBehavior.tone}

**Active Behaviors:**
${currentBehavior.behaviors.map(b => `- ${b}`).join('\n')}

**Question Types to Emphasize:**
${currentBehavior.questionTypes.map(q => `- ${q}`).join('\n')}
`;

    // Add mode balancing guidance
    const weights = state.pathwayWeights;
    section += `
**Mode Balance for This Session (weights):**
- Inquisitive: ${weights.inquisitive}%
- Devil's Advocate: ${weights.devil_advocate}%
- Encouraging: ${weights.encouraging}%
- Realistic: ${weights.realistic}%

While emphasizing ${currentBehavior.name} mode, weave in elements of other modes naturally.
All four coaching modes should be present in your responses, but weighted toward the current emphasis.
`;

    // Add user state awareness
    if (state.detectedUserState !== 'neutral') {
      section += `
**User State Awareness:**
The user appears to be in a ${state.detectedUserState} state. Adapt your approach accordingly:
`;
      switch (state.detectedUserState) {
        case 'defensive':
          section += `- Lead with validation before introducing new perspectives\n- Use softer language when challenging assumptions\n- Build rapport before pushing back`;
          break;
        case 'overconfident':
          section += `- Ask probing questions that surface unconsidered risks\n- Request evidence for strong claims\n- Introduce competitive or market realities`;
          break;
        case 'spinning':
          section += `- Help focus on one decision at a time\n- Summarize what's been discussed\n- Provide clear frameworks for decision-making`;
          break;
        case 'uncertain':
          section += `- Provide more structure and guidance\n- Break down complex decisions into smaller steps\n- Offer concrete examples and frameworks`;
          break;
        case 'engaged':
          section += `- Maintain the productive momentum\n- Challenge at a higher level\n- Push for deeper insights`;
          break;
      }
      section += '\n';
    }

    return section;
  }

  /**
   * Generate the kill decision framework section
   * FR-AC10, FR-AC11: Escalating honesty and earning right to kill
   */
  private generateKillDecisionSection(context?: CoachingContext): string {
    if (!context?.subPersonaState) {
      return '';
    }

    const { killDecision } = context.subPersonaState;

    let section = `
KILL DECISION FRAMEWORK:
You have the authority to recommend killing ideas when warranted. This is a key differentiator.

**Escalation Sequence:**
1. **Diplomatic flags** - "I see some significant risks here..." (current concerns noted, allow user to address)
2. **Deeper probe** - "Let me challenge this assumption..." (give user chance to defend or pivot)
3. **Explicit recommendation** - "Based on what we've discussed, I don't think you should pursue this because..."
4. **Kill score** - Provide a viability rating (1-10) with clear reasoning

**Core Principle:**
You earn the right to kill an idea by doing the work first. NEVER dismiss early - explore, challenge, and THEN render judgment.
`;

    // Add current kill decision state
    if (killDecision.level !== 'none') {
      section += `
**Current Assessment State:**
- Escalation Level: ${killDecision.level}
- Exploration Complete: ${killDecision.explorationComplete ? 'Yes' : 'Not yet'}
- Probe Count: ${killDecision.probeCount}
${killDecision.concerns.length > 0 ? `- Noted Concerns: ${killDecision.concerns.join(', ')}` : ''}
`;
    }

    section += `
**Guidelines:**
- Only escalate after sufficient exploration (at least 5-7 exchanges on the topic)
- Always validate that exploration is complete before rendering kill judgment
- If recommending to kill, provide:
  1. Specific concerns with evidence from the conversation
  2. What would need to change for the idea to become viable
  3. Alternative directions worth considering
  4. A clear viability score with reasoning
`;

    return section;
  }

  /**
   * Assess idea viability for kill decisions
   * FR-AC10: Kill score with clear reasoning
   */
  assessViability(
    state: SubPersonaSessionState,
    concerns: string[],
    strengths: string[]
  ): ViabilityAssessment {
    // Ensure exploration is complete (FR-AC11)
    if (state.exchangeCount < 5) {
      return {
        score: 5,
        level: 'none',
        concerns,
        strengths,
        recommendation: 'validate_further',
        reasoning: 'More exploration is needed before a viability assessment can be made.',
      };
    }

    // Calculate score based on concerns vs strengths
    const concernWeight = concerns.length * 1.5;
    const strengthWeight = strengths.length * 1.2;

    // Base score of 5, adjusted by relative weights
    let score = 5 + (strengthWeight - concernWeight);
    score = Math.max(1, Math.min(10, score));

    // Determine recommendation
    let recommendation: ViabilityAssessment['recommendation'];
    let level: KillEscalationLevel;

    if (score >= 7) {
      recommendation = 'proceed';
      level = 'none';
    } else if (score >= 5) {
      recommendation = 'validate_further';
      level = 'diplomatic';
    } else if (score >= 3) {
      recommendation = 'pivot';
      level = 'probe';
    } else {
      recommendation = 'kill';
      level = state.killDecision.explorationComplete ? 'explicit' : 'probe';
    }

    // Generate reasoning
    let reasoning = '';
    if (recommendation === 'proceed') {
      reasoning = `The idea shows strong fundamentals with ${strengths.length} notable strengths. While there are ${concerns.length} areas of concern, they appear manageable.`;
    } else if (recommendation === 'validate_further') {
      reasoning = `The idea has potential but needs more validation. The ${concerns.length} concerns identified require addressing before moving forward.`;
    } else if (recommendation === 'pivot') {
      reasoning = `The core concept has issues that may require a significant pivot. Consider addressing: ${concerns.slice(0, 3).join(', ')}.`;
    } else {
      reasoning = `Based on our exploration, the idea faces fundamental challenges: ${concerns.slice(0, 3).join(', ')}. The path to viability is unclear.`;
    }

    return {
      score: Math.round(score * 10) / 10,
      level,
      concerns,
      strengths,
      recommendation,
      reasoning,
    };
  }

  /**
   * Update kill decision state
   * Tracks escalation through the kill decision framework
   */
  updateKillDecision(
    state: SubPersonaSessionState,
    newConcerns: string[],
    probeOccurred: boolean
  ): SubPersonaSessionState {
    const newState = { ...state };
    const currentKill = { ...state.killDecision };

    // Add new concerns (deduplicated)
    currentKill.concerns = Array.from(new Set([...currentKill.concerns, ...newConcerns]));

    // Increment probe count if a probe occurred
    if (probeOccurred) {
      currentKill.probeCount++;
    }

    // Check if exploration is complete (at least 5 exchanges and 2 probes)
    if (state.exchangeCount >= 5 && currentKill.probeCount >= 2) {
      currentKill.explorationComplete = true;
    }

    // Escalate level based on concerns and exploration
    if (currentKill.concerns.length === 0) {
      currentKill.level = 'none';
    } else if (currentKill.concerns.length <= 2) {
      currentKill.level = 'diplomatic';
    } else if (!currentKill.explorationComplete) {
      currentKill.level = 'probe';
    } else if (currentKill.concerns.length >= 4) {
      currentKill.level = 'explicit';
    } else {
      currentKill.level = 'probe';
    }

    newState.killDecision = currentKill;
    return newState;
  }

  // Quick action generators for common coaching requests
  // FR-AC9: Surface explicit mode control after ~10 exchanges
  generateQuickActions(context?: CoachingContext): string[] {
    const baseActions = [
      'Challenge my assumptions',
      'Explore alternative approaches',
      'Identify potential risks',
      'Find competitive advantages',
      'Clarify my next steps'
    ];

    // FR-AC9: Add user control options after ~10 exchanges
    if (context?.subPersonaState?.userControlEnabled) {
      return this.generateUserControlActions(context);
    }

    if (context?.currentBmadSession) {
      const phase = context.currentBmadSession.phase;
      switch (phase) {
        case 'discovery':
          return [
            'Help me dig deeper',
            'Challenge my assumptions',
            'What am I missing?',
            'Explore different angles'
          ];
        case 'analysis':
          return [
            'Validate this approach',
            'Find potential flaws',
            'Compare alternatives',
            'Assess market fit'
          ];
        case 'planning':
          return [
            'Prioritize these options',
            'Identify key risks',
            'Plan implementation',
            'Set success metrics'
          ];
        default:
          return baseActions;
      }
    }

    return baseActions;
  }

  /**
   * Generate user control actions for mode steering
   * FR-AC9: After ~10 exchanges, surface explicit mode control options
   */
  private generateUserControlActions(context: CoachingContext): string[] {
    const state = context.subPersonaState;
    if (!state) return [];

    // Core user control actions (always available after threshold)
    const controlActions = [
      'Challenge me', // Maps to devil_advocate
      'Be realistic', // Maps to realistic
      'Help me explore', // Maps to inquisitive
      'Build my confidence', // Maps to encouraging
    ];

    // Add context-specific actions based on current mode
    const currentMode = state.currentMode;
    const contextActions: string[] = [];

    switch (currentMode) {
      case 'inquisitive':
        contextActions.push("I'm ready to move forward");
        contextActions.push('What are the risks?');
        break;
      case 'devil_advocate':
        contextActions.push('What am I doing right?');
        contextActions.push("Let's find solutions");
        break;
      case 'encouraging':
        contextActions.push("I'm ready for hard truths");
        contextActions.push("What's the reality check?");
        break;
      case 'realistic':
        contextActions.push("Let's think bigger");
        contextActions.push('What opportunities am I missing?');
        break;
    }

    // Add kill decision-related action if concerns exist
    if (state.killDecision.concerns.length > 0) {
      contextActions.push('Give me your honest assessment');
    }

    // Combine and limit to 5 actions
    return [...controlActions.slice(0, 4), ...contextActions.slice(0, 1)];
  }

  /**
   * Map user control action text to UserControlAction enum
   * Used by the UI to translate user clicks into state updates
   */
  mapActionToControl(actionText: string): UserControlAction | null {
    const normalizedText = actionText.toLowerCase().trim();

    if (normalizedText.includes('challenge')) return 'challenge_me';
    if (normalizedText.includes('realistic') || normalizedText.includes('reality')) return 'be_realistic';
    if (normalizedText.includes('explore') || normalizedText.includes('bigger')) return 'help_explore';
    if (normalizedText.includes('confidence') || normalizedText.includes('doing right')) return 'encourage_me';

    return null;
  }

  /**
   * Get the current sub-persona mode description for UI display
   */
  getCurrentModeDescription(state: SubPersonaSessionState): { name: string; description: string } {
    const behavior = MODE_BEHAVIORS[state.currentMode];
    return {
      name: behavior.name,
      description: behavior.role,
    };
  }

  /**
   * Get viability assessment summary for UI display
   */
  getViabilitySummary(assessment: ViabilityAssessment): {
    scoreLabel: string;
    color: 'green' | 'yellow' | 'orange' | 'red';
    shortRecommendation: string;
  } {
    let scoreLabel: string;
    let color: 'green' | 'yellow' | 'orange' | 'red';

    if (assessment.score >= 7) {
      scoreLabel = 'Strong';
      color = 'green';
    } else if (assessment.score >= 5) {
      scoreLabel = 'Moderate';
      color = 'yellow';
    } else if (assessment.score >= 3) {
      scoreLabel = 'Weak';
      color = 'orange';
    } else {
      scoreLabel = 'Critical';
      color = 'red';
    }

    const recommendationMap = {
      proceed: 'Ready to proceed',
      validate_further: 'Needs more validation',
      pivot: 'Consider pivoting',
      kill: 'Recommend stopping',
    };

    return {
      scoreLabel,
      color,
      shortRecommendation: recommendationMap[assessment.recommendation],
    };
  }
}

// =============================================================================
// Helper Functions for External Use
// =============================================================================

/**
 * Create a new sub-persona session state for a given pathway
 * Use this when starting a new BMad session
 */
export function createSubPersonaState(pathway: string): SubPersonaSessionState {
  return maryPersona.initializeSubPersonaState(pathway);
}

/**
 * Update sub-persona state based on user interaction
 * Use this after each user message
 */
export function updateSubPersonaState(
  state: SubPersonaSessionState,
  userMessage: string,
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
): SubPersonaSessionState {
  return maryPersona.updateSessionState(state, userMessage, recentMessages);
}

/**
 * Apply a user control action to the sub-persona state
 * Use this when user clicks a control action
 */
export function applyUserControlAction(
  state: SubPersonaSessionState,
  action: UserControlAction
): SubPersonaSessionState {
  return maryPersona.applyUserControl(state, action);
}

// Export singleton instance
export const maryPersona = MaryPersona.getInstance();

// =============================================================================
// Story 6.1: Wire Sub-Persona to Claude API - Helper Functions
// =============================================================================

/**
 * Get the system prompt section for a specific mode
 * Story 6.1: Returns mode-specific instructions for Claude
 */
export function getSystemPromptForMode(mode: SubPersonaMode): string {
  const behavior = MODE_BEHAVIORS[mode];

  return `You are currently operating in **${behavior.name}** mode.

**Your Role**: ${behavior.role}
**Your Tone**: ${behavior.tone}

**Active Behaviors:**
${behavior.behaviors.map(b => `- ${b}`).join('\n')}

**Question Types to Emphasize:**
${behavior.questionTypes.map(q => `- ${q}`).join('\n')}`;
}

/**
 * Select a mode for a message based on pathway and message index
 * Story 6.1: Implements weighted random selection per pathway
 *
 * @param pathway - The current pathway (e.g., 'new-idea', 'business-model')
 * @param messageIndex - The current message index (used for potential patterns)
 * @returns The selected SubPersonaMode
 */
export function selectModeForMessage(
  pathway: string,
  messageIndex: number = 0
): SubPersonaMode {
  const weights = PATHWAY_WEIGHTS[pathway] || PATHWAY_WEIGHTS['new-idea'];
  return maryPersona.selectModeByWeight(weights);
}

/**
 * Get pathway weights for a given pathway type
 * Story 6.1: Exposes pathway weights for external use
 */
export function getPathwayWeights(pathway: string): PathwayWeights {
  return PATHWAY_WEIGHTS[pathway] || PATHWAY_WEIGHTS['new-idea'];
}

// =============================================================================
// Story 6.2: Dynamic Mode Shifting - Helper Functions
// =============================================================================

/**
 * Get a random transition phrase for a mode shift
 * Story 6.2: Returns conversational phrase for natural mode transitions
 *
 * @param toMode - The mode being shifted to
 * @returns A random transition phrase
 */
export function getTransitionPhrase(toMode: SubPersonaMode): string {
  const key = `any_to_${toMode}`;
  const phrases = TRANSITION_PHRASES[key];

  if (!phrases || phrases.length === 0) {
    return ''; // No transition needed
  }

  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Determine if a mode shift should occur based on user state
 * Story 6.2: Implements mode shift decision logic
 *
 * @param state - Current sub-persona session state
 * @param recentMessages - Recent conversation messages for state detection
 * @returns ShiftDecision with shouldShift, modes, reason, and transition phrase
 */
export function shouldShiftMode(
  state: SubPersonaSessionState,
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
): ShiftDecision {
  const currentMode = state.currentMode;

  // Detect user emotional state
  const userState = maryPersona.detectUserState(recentMessages);

  // Get next mode decision
  const { nextMode, trigger } = maryPersona.determineNextMode(state, userState);

  // Check if shift should occur
  const shouldShift = nextMode !== currentMode;

  // Get transition phrase if shifting
  const transitionPhrase = shouldShift ? getTransitionPhrase(nextMode) : '';

  // Build reason based on trigger and user state
  let reason = '';
  if (shouldShift) {
    switch (userState) {
      case 'defensive':
        reason = 'User appears defensive - shifting to build rapport before continuing challenge';
        break;
      case 'overconfident':
        reason = 'User appears overconfident - shifting to provide more rigorous challenge';
        break;
      case 'spinning':
        reason = 'User appears to be spinning - shifting to ground the conversation';
        break;
      case 'uncertain':
        reason = 'User appears uncertain - shifting to provide more support and clarity';
        break;
      case 'engaged':
        reason = 'User is engaged - following pathway weights for natural flow';
        break;
      default:
        reason = `Following pathway weights (trigger: ${trigger})`;
    }
  }

  return {
    shouldShift,
    fromMode: currentMode,
    toMode: nextMode,
    reason,
    transitionPhrase,
  };
}

/**
 * Generate mode shift context for system prompt
 * Story 6.2: Creates prompt section for mode transitions
 *
 * @param decision - The shift decision
 * @returns System prompt section for mode transition
 */
export function generateModeShiftPrompt(decision: ShiftDecision): string {
  if (!decision.shouldShift) {
    return '';
  }

  const fromBehavior = MODE_BEHAVIORS[decision.fromMode];
  const toBehavior = MODE_BEHAVIORS[decision.toMode];

  return `
MODE TRANSITION CONTEXT:
You are shifting from ${fromBehavior.name} mode to ${toBehavior.name} mode.

**Reason for shift:** ${decision.reason}

**Transition approach:**
- Start your response with a natural transition: "${decision.transitionPhrase}"
- Gradually shift your tone from ${fromBehavior.tone} to ${toBehavior.tone}
- This should feel conversational, not jarring

**New mode emphasis:**
- Role: ${toBehavior.role}
- Behaviors: ${toBehavior.behaviors.slice(0, 2).join('; ')}
`;
}

// =============================================================================
// Story 6.3: Kill Recommendation System - Helper Functions
// =============================================================================

/**
 * Calculate detailed viability score with dimensions
 * Story 6.3: Transparent scoring by dimension
 *
 * @param concerns - List of identified concerns
 * @param strengths - List of identified strengths
 * @param conversationContext - Optional context for more nuanced scoring
 * @returns Detailed viability score
 */
export function calculateDetailedViability(
  concerns: string[],
  strengths: string[],
  conversationContext?: {
    problemDiscussed: boolean;
    targetUserDefined: boolean;
    competitorsMentioned: boolean;
    revenueModelDiscussed: boolean;
    technicalApproachDiscussed: boolean;
  }
): ViabilityScore {
  // Base dimension scores (5 = neutral)
  const dimensions = {
    problemClarity: 5,
    targetUserClarity: 5,
    solutionFit: 5,
    competitiveMoat: 5,
    revenueViability: 5,
    technicalFeasibility: 5,
  };

  // Adjust based on concerns (lower scores)
  concerns.forEach((concern) => {
    const lowerConcern = concern.toLowerCase();

    if (lowerConcern.includes('problem') || lowerConcern.includes('need') || lowerConcern.includes('pain')) {
      dimensions.problemClarity = Math.max(1, dimensions.problemClarity - 1.5);
    }
    if (lowerConcern.includes('user') || lowerConcern.includes('customer') || lowerConcern.includes('audience')) {
      dimensions.targetUserClarity = Math.max(1, dimensions.targetUserClarity - 1.5);
    }
    if (lowerConcern.includes('solution') || lowerConcern.includes('fit') || lowerConcern.includes('address')) {
      dimensions.solutionFit = Math.max(1, dimensions.solutionFit - 1.5);
    }
    if (lowerConcern.includes('competition') || lowerConcern.includes('competitor') || lowerConcern.includes('moat')) {
      dimensions.competitiveMoat = Math.max(1, dimensions.competitiveMoat - 1.5);
    }
    if (lowerConcern.includes('revenue') || lowerConcern.includes('money') || lowerConcern.includes('pricing')) {
      dimensions.revenueViability = Math.max(1, dimensions.revenueViability - 1.5);
    }
    if (lowerConcern.includes('technical') || lowerConcern.includes('build') || lowerConcern.includes('feasib')) {
      dimensions.technicalFeasibility = Math.max(1, dimensions.technicalFeasibility - 1.5);
    }
  });

  // Adjust based on strengths (raise scores)
  strengths.forEach((strength) => {
    const lowerStrength = strength.toLowerCase();

    if (lowerStrength.includes('problem') || lowerStrength.includes('need') || lowerStrength.includes('pain')) {
      dimensions.problemClarity = Math.min(10, dimensions.problemClarity + 1.2);
    }
    if (lowerStrength.includes('user') || lowerStrength.includes('customer') || lowerStrength.includes('audience')) {
      dimensions.targetUserClarity = Math.min(10, dimensions.targetUserClarity + 1.2);
    }
    if (lowerStrength.includes('solution') || lowerStrength.includes('fit') || lowerStrength.includes('address')) {
      dimensions.solutionFit = Math.min(10, dimensions.solutionFit + 1.2);
    }
    if (lowerStrength.includes('unique') || lowerStrength.includes('different') || lowerStrength.includes('moat')) {
      dimensions.competitiveMoat = Math.min(10, dimensions.competitiveMoat + 1.2);
    }
    if (lowerStrength.includes('revenue') || lowerStrength.includes('money') || lowerStrength.includes('pricing')) {
      dimensions.revenueViability = Math.min(10, dimensions.revenueViability + 1.2);
    }
    if (lowerStrength.includes('technical') || lowerStrength.includes('build') || lowerStrength.includes('feasib')) {
      dimensions.technicalFeasibility = Math.min(10, dimensions.technicalFeasibility + 1.2);
    }
  });

  // Boost scores if context shows discussion occurred
  if (conversationContext) {
    if (conversationContext.problemDiscussed) dimensions.problemClarity += 0.5;
    if (conversationContext.targetUserDefined) dimensions.targetUserClarity += 0.5;
    if (conversationContext.competitorsMentioned) dimensions.competitiveMoat += 0.5;
    if (conversationContext.revenueModelDiscussed) dimensions.revenueViability += 0.5;
    if (conversationContext.technicalApproachDiscussed) dimensions.technicalFeasibility += 0.5;
  }

  // Cap all dimensions at 10
  Object.keys(dimensions).forEach((key) => {
    const k = key as keyof typeof dimensions;
    dimensions[k] = Math.min(10, Math.max(1, Math.round(dimensions[k] * 10) / 10));
  });

  // Calculate overall score
  const overall = Object.values(dimensions).reduce((a, b) => a + b, 0) / 6;

  // Identify critical issues (dimensions below 4)
  const criticalIssues: string[] = [];
  if (dimensions.problemClarity < 4) criticalIssues.push('Problem is not clearly defined');
  if (dimensions.targetUserClarity < 4) criticalIssues.push('Target user is unclear or too broad');
  if (dimensions.solutionFit < 4) criticalIssues.push('Solution may not adequately address the problem');
  if (dimensions.competitiveMoat < 4) criticalIssues.push('No clear competitive advantage or moat');
  if (dimensions.revenueViability < 4) criticalIssues.push('Revenue model is unrealistic or undefined');
  if (dimensions.technicalFeasibility < 4) criticalIssues.push('Technical approach may be infeasible');

  // Identify improvement opportunities (dimensions 4-6)
  const improvementOpportunities: string[] = [];
  if (dimensions.problemClarity >= 4 && dimensions.problemClarity <= 6) {
    improvementOpportunities.push('Sharpen problem definition with specific user pain points');
  }
  if (dimensions.targetUserClarity >= 4 && dimensions.targetUserClarity <= 6) {
    improvementOpportunities.push('Define target user more specifically (demographics, behaviors)');
  }
  if (dimensions.solutionFit >= 4 && dimensions.solutionFit <= 6) {
    improvementOpportunities.push('Validate solution-problem fit with user interviews');
  }
  if (dimensions.competitiveMoat >= 4 && dimensions.competitiveMoat <= 6) {
    improvementOpportunities.push('Identify unique differentiators or defensible advantages');
  }
  if (dimensions.revenueViability >= 4 && dimensions.revenueViability <= 6) {
    improvementOpportunities.push('Test pricing assumptions with potential customers');
  }
  if (dimensions.technicalFeasibility >= 4 && dimensions.technicalFeasibility <= 6) {
    improvementOpportunities.push('Prototype core technical components to validate approach');
  }

  return {
    overall: Math.round(overall * 10) / 10,
    dimensions,
    criticalIssues,
    improvementOpportunities,
  };
}

/**
 * Generate a kill recommendation based on viability score
 * Story 6.3: Creates structured recommendation for outputs
 *
 * @param viabilityScore - The calculated viability score
 * @param concerns - List of concerns from exploration
 * @param strengths - List of strengths identified
 * @returns Kill recommendation with action, rationale, and improvements
 */
export function generateKillRecommendation(
  viabilityScore: ViabilityScore,
  concerns: string[],
  strengths: string[]
): KillRecommendation {
  const overall = viabilityScore.overall;

  // Determine action and confidence
  let action: 'proceed' | 'pivot' | 'kill';
  let confidence: 'high' | 'medium' | 'low';

  if (overall >= 7) {
    action = 'proceed';
    confidence = overall >= 8 ? 'high' : 'medium';
  } else if (overall >= 5) {
    action = 'pivot';
    confidence = 'medium';
  } else if (overall >= 3) {
    action = 'pivot';
    confidence = 'low';
  } else {
    action = 'kill';
    confidence = overall < 2 ? 'high' : 'medium';
  }

  // Generate summary based on action
  let summary: string;
  switch (action) {
    case 'proceed':
      summary = `This idea shows strong fundamentals with an overall viability score of ${overall}/10. While there are areas for improvement, the core concept is solid and worth pursuing.`;
      break;
    case 'pivot':
      summary = `This idea has potential but needs significant refinement. With a score of ${overall}/10, I recommend pivoting to address the ${viabilityScore.criticalIssues.length} critical issues identified.`;
      break;
    case 'kill':
      summary = `Based on our thorough exploration, I cannot recommend pursuing this idea as-is. With a score of ${overall}/10, the fundamental challenges outweigh the potential.`;
      break;
  }

  // Generate rationale from concerns and scores
  const rationale: string[] = [];
  if (concerns.length > 0) {
    rationale.push(`Key concerns identified: ${concerns.slice(0, 3).join('; ')}`);
  }
  viabilityScore.criticalIssues.forEach((issue) => {
    rationale.push(issue);
  });
  if (strengths.length > 0 && action !== 'kill') {
    rationale.push(`Notable strengths: ${strengths.slice(0, 2).join('; ')}`);
  }

  return {
    action,
    confidence,
    viabilityScore,
    summary,
    rationale,
    improvements: viabilityScore.improvementOpportunities,
  };
}

/**
 * Generate escalation prompt from template
 * Story 6.3: Fills in escalation template with specific data
 *
 * @param level - The escalation level
 * @param data - Data to fill into the template
 * @returns Formatted escalation prompt
 */
export function generateEscalationPrompt(
  level: KillEscalationLevel,
  data: {
    issues?: string[];
    issue?: string;
    recommendation?: string;
    rationale?: string[];
    consequences?: string[];
    score?: number;
    dimensions?: ViabilityScore['dimensions'];
    criticalIssues?: string[];
    action?: string;
    actionRationale?: string;
    improvements?: string[];
  }
): string {
  let template = ESCALATION_PROMPTS[level];

  if (level === 'none' || !template) {
    return '';
  }

  // Replace placeholders
  if (data.issues) {
    template = template.replace('{issues}', data.issues.map(i => `- ${i}`).join('\n'));
  }
  if (data.issue) {
    template = template.replace('{issue}', data.issue);
  }
  if (data.recommendation) {
    template = template.replace('{recommendation}', data.recommendation);
  }
  if (data.rationale) {
    template = template.replace('{rationale}', data.rationale.map(r => `- ${r}`).join('\n'));
  }
  if (data.consequences) {
    template = template.replace('{consequences}', data.consequences.map(c => `- ${c}`).join('\n'));
  }
  if (data.score !== undefined) {
    template = template.replace('{score}', data.score.toString());
  }
  if (data.dimensions) {
    const rows = [
      `| Problem Clarity | ${data.dimensions.problemClarity}/10 | How well-defined is the problem? |`,
      `| Target User | ${data.dimensions.targetUserClarity}/10 | Who is this for? |`,
      `| Solution Fit | ${data.dimensions.solutionFit}/10 | Does solution address problem? |`,
      `| Competitive Moat | ${data.dimensions.competitiveMoat}/10 | Why won't others copy? |`,
      `| Revenue Viability | ${data.dimensions.revenueViability}/10 | Can this make money? |`,
      `| Technical Feasibility | ${data.dimensions.technicalFeasibility}/10 | Can this be built? |`,
    ];
    template = template.replace('{dimension_table}', rows.join('\n'));
  }
  if (data.criticalIssues) {
    template = template.replace('{critical_issues}', data.criticalIssues.map(i => `- ${i}`).join('\n') || '- None identified');
  }
  if (data.action) {
    template = template.replace('{action}', data.action.toUpperCase());
  }
  if (data.actionRationale) {
    template = template.replace('{action_rationale}', data.actionRationale);
  }
  if (data.improvements) {
    template = template.replace('{improvements}', data.improvements.map(i => `- ${i}`).join('\n') || '- Continue as planned');
  }

  return template;
}