/**
 * Capability Discovery System
 *
 * Phase 5 of Agent-Native Evolution
 *
 * Provides runtime discovery of available capabilities, enabling Mary to:
 * 1. Discover available pathways and their configurations
 * 2. Discover phase-specific actions for any pathway/phase combination
 * 3. Discover available document types and their requirements
 *
 * This enables emergent behavior - Mary can compose solutions for requests
 * that weren't explicitly built, by discovering and combining capabilities.
 */

import { pathwayRouter } from './pathway-router';
import { PHASE_ORDER } from './session-primitives';
import { PathwayType, BmadPathway } from './types';

// =============================================================================
// Types
// =============================================================================

export interface DiscoveredPathway {
  id: string;
  name: string;
  description: string;
  targetUser: string;
  expectedOutcome: string;
  timeCommitment: number;
  phases: string[];
  templateSequence: string[];
}

export interface PhaseAction {
  id: string;
  name: string;
  description: string;
  type: 'analysis' | 'generation' | 'transition' | 'capture';
  requiredInputs: string[];
  optionalInputs: string[];
  producesOutput: boolean;
  outputType?: 'document' | 'insight' | 'recommendation' | 'canvas';
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  category: 'canvas' | 'brief' | 'summary' | 'analysis';
  requiredContext: string[];
  optionalContext: string[];
  estimatedCompletionPhase: string[];
  generatorAvailable: boolean;
}

export interface CapabilityContext {
  pathway: string;
  currentPhase: string;
  completedPhases: string[];
  availableInsightCategories: string[];
  insightCount: number;
}

export interface DiscoveryResult<T> {
  items: T[];
  context?: string;
  totalCount: number;
}

// =============================================================================
// Pathway Discovery
// =============================================================================

/**
 * Discover all available pathways and their configurations.
 * This is the entry point for Mary to understand what strategic journeys
 * are available for users.
 */
export function listAvailablePathways(): DiscoveryResult<DiscoveredPathway> {
  const pathways = pathwayRouter.getAllPathways();

  const discoveredPathways = pathways.map(
    (pathway: BmadPathway): DiscoveredPathway => ({
      id: pathway.id,
      name: pathway.name,
      description: pathway.description,
      targetUser: pathway.targetUser,
      expectedOutcome: pathway.expectedOutcome,
      timeCommitment: pathway.timeCommitment,
      phases: PHASE_ORDER[pathway.id] || [],
      templateSequence: pathway.templateSequence,
    })
  );

  return {
    items: discoveredPathways,
    context:
      'Available strategic pathways for guiding users through business validation',
    totalCount: discoveredPathways.length,
  };
}

/**
 * Get detailed information about a specific pathway.
 */
export function getPathwayDetails(
  pathwayId: string
): DiscoveredPathway | null {
  const pathway = pathwayRouter.getPathway(pathwayId as PathwayType);
  if (!pathway) return null;

  return {
    id: pathway.id,
    name: pathway.name,
    description: pathway.description,
    targetUser: pathway.targetUser,
    expectedOutcome: pathway.expectedOutcome,
    timeCommitment: pathway.timeCommitment,
    phases: PHASE_ORDER[pathway.id] || [],
    templateSequence: pathway.templateSequence,
  };
}

/**
 * Find pathways suitable for a given user type or goal.
 */
export function findPathwaysForGoal(goal: string): DiscoveryResult<DiscoveredPathway> {
  const allPathways = listAvailablePathways();
  const goalLower = goal.toLowerCase();

  // Simple keyword matching for pathway recommendation
  const relevantPathways = allPathways.items.filter((pathway) => {
    const searchText = `${pathway.description} ${pathway.targetUser} ${pathway.expectedOutcome}`.toLowerCase();
    return goalLower.split(' ').some((word) => word.length > 3 && searchText.includes(word));
  });

  return {
    items: relevantPathways.length > 0 ? relevantPathways : allPathways.items,
    context: relevantPathways.length > 0
      ? `Found ${relevantPathways.length} pathways matching "${goal}"`
      : 'Showing all pathways (no specific match found)',
    totalCount: relevantPathways.length || allPathways.items.length,
  };
}

// =============================================================================
// Phase Action Discovery
// =============================================================================

/**
 * Comprehensive registry of actions available at each phase.
 * This is the source of truth for what Mary can do at any point.
 */
const PHASE_ACTIONS: Record<string, PhaseAction[]> = {
  // New Idea pathway phases
  discovery: [
    {
      id: 'probe_problem',
      name: 'Problem Probing',
      description: 'Deep exploration of the problem space and user pain points',
      type: 'analysis',
      requiredInputs: ['user_problem_statement'],
      optionalInputs: ['target_market', 'existing_solutions'],
      producesOutput: true,
      outputType: 'insight',
    },
    {
      id: 'market_scan',
      name: 'Initial Market Scan',
      description: 'Quick scan of market landscape and competition',
      type: 'analysis',
      requiredInputs: ['problem_domain'],
      optionalInputs: ['geographic_focus'],
      producesOutput: true,
      outputType: 'insight',
    },
    {
      id: 'record_insight',
      name: 'Capture Key Insight',
      description: 'Record an important discovery from the exploration',
      type: 'capture',
      requiredInputs: ['insight_text'],
      optionalInputs: ['category'],
      producesOutput: true,
      outputType: 'insight',
    },
  ],
  ideation: [
    {
      id: 'solution_brainstorm',
      name: 'Solution Brainstorming',
      description: 'Generate and evaluate potential solutions',
      type: 'analysis',
      requiredInputs: ['validated_problem'],
      optionalInputs: ['constraints', 'inspiration_sources'],
      producesOutput: true,
      outputType: 'insight',
    },
    {
      id: 'differentiation_analysis',
      name: 'Differentiation Analysis',
      description: 'Identify unique value propositions',
      type: 'analysis',
      requiredInputs: ['solution_concept'],
      optionalInputs: ['competitor_list'],
      producesOutput: true,
      outputType: 'insight',
    },
    {
      id: 'generate_concept',
      name: 'Generate Concept Document',
      description: 'Create a structured concept document from insights',
      type: 'generation',
      requiredInputs: ['problem_insight', 'solution_insight'],
      optionalInputs: ['target_user', 'differentiation'],
      producesOutput: true,
      outputType: 'document',
    },
  ],
  validation: [
    {
      id: 'assumption_testing',
      name: 'Assumption Testing',
      description: 'Identify and stress-test key assumptions',
      type: 'analysis',
      requiredInputs: ['business_concept'],
      optionalInputs: ['risk_tolerance'],
      producesOutput: true,
      outputType: 'insight',
    },
    {
      id: 'viability_assessment',
      name: 'Viability Assessment',
      description: 'Assess overall viability and provide recommendation',
      type: 'analysis',
      requiredInputs: ['concerns', 'strengths'],
      optionalInputs: ['additional_context'],
      producesOutput: true,
      outputType: 'recommendation',
    },
    {
      id: 'generate_lean_canvas',
      name: 'Generate Lean Canvas',
      description: 'Create a Lean Canvas from validated insights',
      type: 'generation',
      requiredInputs: ['problem', 'solution', 'unique_value'],
      optionalInputs: ['customer_segments', 'channels', 'revenue_streams'],
      producesOutput: true,
      outputType: 'canvas',
    },
  ],
  planning: [
    {
      id: 'roadmap_creation',
      name: 'Roadmap Creation',
      description: 'Create actionable next steps and milestones',
      type: 'generation',
      requiredInputs: ['validated_concept'],
      optionalInputs: ['timeline_constraints', 'resource_constraints'],
      producesOutput: true,
      outputType: 'document',
    },
    {
      id: 'generate_prd',
      name: 'Generate Product Brief',
      description: 'Create a comprehensive product requirements document',
      type: 'generation',
      requiredInputs: ['concept', 'lean_canvas'],
      optionalInputs: ['technical_constraints', 'mvp_scope'],
      producesOutput: true,
      outputType: 'document',
    },
    {
      id: 'session_summary',
      name: 'Generate Session Summary',
      description: 'Create a summary of the entire session journey',
      type: 'generation',
      requiredInputs: ['session_insights'],
      optionalInputs: [],
      producesOutput: true,
      outputType: 'document',
    },
  ],

  // Business Model pathway phases
  analysis: [
    {
      id: 'revenue_analysis',
      name: 'Revenue Model Analysis',
      description: 'Analyze current or potential revenue streams',
      type: 'analysis',
      requiredInputs: ['business_description'],
      optionalInputs: ['current_revenue', 'target_market'],
      producesOutput: true,
      outputType: 'insight',
    },
    {
      id: 'cost_structure',
      name: 'Cost Structure Analysis',
      description: 'Map out cost structure and unit economics',
      type: 'analysis',
      requiredInputs: ['business_model'],
      optionalInputs: ['scale_assumptions'],
      producesOutput: true,
      outputType: 'insight',
    },
  ],
  revenue: [
    {
      id: 'pricing_strategy',
      name: 'Pricing Strategy Analysis',
      description: 'Evaluate pricing options and willingness to pay',
      type: 'analysis',
      requiredInputs: ['value_proposition', 'customer_segments'],
      optionalInputs: ['competitor_pricing'],
      producesOutput: true,
      outputType: 'insight',
    },
    {
      id: 'monetization_options',
      name: 'Monetization Options',
      description: 'Explore different monetization strategies',
      type: 'analysis',
      requiredInputs: ['product_type'],
      optionalInputs: ['market_norms'],
      producesOutput: true,
      outputType: 'insight',
    },
  ],
  customer: [
    {
      id: 'segment_analysis',
      name: 'Customer Segment Analysis',
      description: 'Deep dive into customer segments and personas',
      type: 'analysis',
      requiredInputs: ['target_market'],
      optionalInputs: ['existing_customers'],
      producesOutput: true,
      outputType: 'insight',
    },
    {
      id: 'channel_analysis',
      name: 'Channel Analysis',
      description: 'Evaluate customer acquisition and distribution channels',
      type: 'analysis',
      requiredInputs: ['customer_segments'],
      optionalInputs: ['current_channels'],
      producesOutput: true,
      outputType: 'insight',
    },
  ],

  // Strategic Optimization pathway phases
  assessment: [
    {
      id: 'current_state',
      name: 'Current State Assessment',
      description: 'Evaluate current product/business state',
      type: 'analysis',
      requiredInputs: ['product_description'],
      optionalInputs: ['metrics', 'user_feedback'],
      producesOutput: true,
      outputType: 'insight',
    },
    {
      id: 'competitive_position',
      name: 'Competitive Position Analysis',
      description: 'Assess competitive positioning and market fit',
      type: 'analysis',
      requiredInputs: ['market_context'],
      optionalInputs: ['competitor_list'],
      producesOutput: true,
      outputType: 'insight',
    },
  ],
  strategy: [
    {
      id: 'opportunity_mapping',
      name: 'Opportunity Mapping',
      description: 'Map potential improvement and growth opportunities',
      type: 'analysis',
      requiredInputs: ['current_state', 'goals'],
      optionalInputs: ['constraints'],
      producesOutput: true,
      outputType: 'insight',
    },
    {
      id: 'priority_framework',
      name: 'Priority Framework',
      description: 'Create framework for prioritizing opportunities',
      type: 'analysis',
      requiredInputs: ['opportunity_list'],
      optionalInputs: ['criteria_weights'],
      producesOutput: true,
      outputType: 'insight',
    },
  ],
  implementation: [
    {
      id: 'action_plan',
      name: 'Action Plan Creation',
      description: 'Create detailed implementation action plan',
      type: 'generation',
      requiredInputs: ['prioritized_opportunities'],
      optionalInputs: ['resource_constraints', 'timeline'],
      producesOutput: true,
      outputType: 'document',
    },
    {
      id: 'success_metrics',
      name: 'Success Metrics Definition',
      description: 'Define metrics to track implementation success',
      type: 'analysis',
      requiredInputs: ['action_plan'],
      optionalInputs: ['baseline_metrics'],
      producesOutput: true,
      outputType: 'insight',
    },
  ],
};

/**
 * Universal actions available in all phases
 */
const UNIVERSAL_ACTIONS: PhaseAction[] = [
  {
    id: 'mode_shift',
    name: 'Shift Coaching Mode',
    description: 'Change coaching approach based on user needs',
    type: 'transition',
    requiredInputs: ['target_mode', 'reason'],
    optionalInputs: [],
    producesOutput: false,
  },
  {
    id: 'record_insight',
    name: 'Record Insight',
    description: 'Capture an important insight from the conversation',
    type: 'capture',
    requiredInputs: ['insight_text'],
    optionalInputs: ['category'],
    producesOutput: true,
    outputType: 'insight',
  },
  {
    id: 'complete_phase',
    name: 'Complete Current Phase',
    description: 'Signal that phase objectives have been met',
    type: 'transition',
    requiredInputs: ['completion_reason'],
    optionalInputs: ['key_outcomes'],
    producesOutput: false,
  },
];

/**
 * List all actions available for a specific phase.
 * Includes both phase-specific and universal actions.
 */
export function listPhaseActions(phaseId: string): DiscoveryResult<PhaseAction> {
  const phaseActions = PHASE_ACTIONS[phaseId] || [];
  const allActions = [...phaseActions, ...UNIVERSAL_ACTIONS];

  return {
    items: allActions,
    context: phaseActions.length > 0
      ? `Actions available in the "${phaseId}" phase`
      : `Phase "${phaseId}" not found, showing universal actions only`,
    totalCount: allActions.length,
  };
}

/**
 * List actions filtered by type.
 */
export function listActionsByType(
  phaseId: string,
  type: PhaseAction['type']
): DiscoveryResult<PhaseAction> {
  const allActions = listPhaseActions(phaseId);
  const filtered = allActions.items.filter((action) => action.type === type);

  return {
    items: filtered,
    context: `${type} actions in phase "${phaseId}"`,
    totalCount: filtered.length,
  };
}

/**
 * Get actions that produce a specific output type.
 */
export function listActionsByOutput(
  outputType: PhaseAction['outputType']
): DiscoveryResult<PhaseAction> {
  const allPhases = Object.keys(PHASE_ACTIONS);
  const matchingActions: PhaseAction[] = [];

  for (const phase of allPhases) {
    const actions = PHASE_ACTIONS[phase] || [];
    matchingActions.push(
      ...actions.filter((action) => action.outputType === outputType)
    );
  }

  // Add universal actions if they match
  matchingActions.push(
    ...UNIVERSAL_ACTIONS.filter((action) => action.outputType === outputType)
  );

  // Remove duplicates
  const uniqueActions = Array.from(
    new Map(matchingActions.map((a) => [a.id, a])).values()
  );

  return {
    items: uniqueActions,
    context: `Actions that produce "${outputType}" outputs`,
    totalCount: uniqueActions.length,
  };
}

// =============================================================================
// Document Type Discovery
// =============================================================================

/**
 * Registry of available document types and their requirements.
 */
const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'lean_canvas',
    name: 'Lean Canvas',
    description: 'One-page business model overview focusing on problem-solution fit',
    category: 'canvas',
    requiredContext: ['problem', 'solution', 'unique_value_proposition'],
    optionalContext: [
      'customer_segments',
      'channels',
      'revenue_streams',
      'cost_structure',
      'key_metrics',
      'unfair_advantage',
    ],
    estimatedCompletionPhase: ['validation', 'planning'],
    generatorAvailable: true,
  },
  {
    id: 'business_model_canvas',
    name: 'Business Model Canvas',
    description: 'Comprehensive business model framework with all 9 building blocks',
    category: 'canvas',
    requiredContext: [
      'customer_segments',
      'value_propositions',
      'channels',
      'customer_relationships',
    ],
    optionalContext: [
      'revenue_streams',
      'key_resources',
      'key_activities',
      'key_partnerships',
      'cost_structure',
    ],
    estimatedCompletionPhase: ['validation', 'planning'],
    generatorAvailable: true,
  },
  {
    id: 'concept_document',
    name: 'Concept Document',
    description: 'Structured overview of a business concept with problem, solution, and differentiation',
    category: 'brief',
    requiredContext: ['problem_statement', 'proposed_solution'],
    optionalContext: ['target_market', 'differentiation', 'key_assumptions'],
    estimatedCompletionPhase: ['ideation', 'validation'],
    generatorAvailable: true,
  },
  {
    id: 'product_brief',
    name: 'Product Brief (PRD)',
    description: 'Comprehensive product requirements document with features, users, and timeline',
    category: 'brief',
    requiredContext: ['product_overview', 'target_users', 'core_features'],
    optionalContext: [
      'success_metrics',
      'technical_requirements',
      'timeline',
      'risks',
      'dependencies',
    ],
    estimatedCompletionPhase: ['planning'],
    generatorAvailable: true,
  },
  {
    id: 'feature_brief',
    name: 'Feature Brief',
    description: 'Detailed specification for a single feature or capability',
    category: 'brief',
    requiredContext: ['feature_name', 'user_story', 'acceptance_criteria'],
    optionalContext: ['technical_notes', 'edge_cases', 'metrics'],
    estimatedCompletionPhase: ['planning', 'implementation'],
    generatorAvailable: true,
  },
  {
    id: 'brainstorm_summary',
    name: 'Brainstorm Summary',
    description: 'Summary of a brainstorming session with key insights and action items',
    category: 'summary',
    requiredContext: ['session_insights'],
    optionalContext: ['decisions_made', 'open_questions', 'action_items'],
    estimatedCompletionPhase: ['discovery', 'ideation', 'planning'],
    generatorAvailable: true,
  },
  {
    id: 'project_brief',
    name: 'Project Brief',
    description: 'Formal project documentation with scope, milestones, and stakeholders',
    category: 'brief',
    requiredContext: ['project_summary', 'objectives', 'scope'],
    optionalContext: ['milestones', 'stakeholders', 'constraints', 'dependencies'],
    estimatedCompletionPhase: ['planning'],
    generatorAvailable: true,
  },
  {
    id: 'viability_report',
    name: 'Viability Report',
    description: 'Assessment of idea viability with recommendation and reasoning',
    category: 'analysis',
    requiredContext: ['concerns', 'strengths', 'viability_score'],
    optionalContext: ['market_context', 'competitive_analysis', 'risk_assessment'],
    estimatedCompletionPhase: ['validation'],
    generatorAvailable: false, // Generated via recommend_action tool
  },
];

/**
 * List all available document types.
 */
export function listDocumentTypes(): DiscoveryResult<DocumentType> {
  return {
    items: DOCUMENT_TYPES,
    context: 'All available document types for generation',
    totalCount: DOCUMENT_TYPES.length,
  };
}

/**
 * List document types by category.
 */
export function listDocumentTypesByCategory(
  category: DocumentType['category']
): DiscoveryResult<DocumentType> {
  const filtered = DOCUMENT_TYPES.filter((doc) => doc.category === category);

  return {
    items: filtered,
    context: `${category} document types`,
    totalCount: filtered.length,
  };
}

/**
 * Get document types appropriate for a specific phase.
 */
export function listDocumentTypesForPhase(
  phaseId: string
): DiscoveryResult<DocumentType> {
  const filtered = DOCUMENT_TYPES.filter((doc) =>
    doc.estimatedCompletionPhase.includes(phaseId)
  );

  return {
    items: filtered,
    context: `Document types suitable for the "${phaseId}" phase`,
    totalCount: filtered.length,
  };
}

/**
 * Get document types that have all required context available.
 */
export function listAvailableDocumentTypes(
  availableContext: string[]
): DiscoveryResult<DocumentType> {
  const availableSet = new Set(availableContext.map((c) => c.toLowerCase()));

  const filtered = DOCUMENT_TYPES.filter((doc) => {
    return doc.requiredContext.every((req) => availableSet.has(req.toLowerCase()));
  });

  return {
    items: filtered,
    context: 'Document types with all required context available',
    totalCount: filtered.length,
  };
}

/**
 * Get detailed information about a specific document type.
 */
export function getDocumentTypeDetails(documentId: string): DocumentType | null {
  return DOCUMENT_TYPES.find((doc) => doc.id === documentId) || null;
}

// =============================================================================
// Contextual Discovery
// =============================================================================

/**
 * Discover capabilities based on current session context.
 * This is the main entry point for Mary to understand what's possible
 * given the current state of a session.
 */
export function discoverCapabilities(context: CapabilityContext): {
  availableActions: PhaseAction[];
  availableDocuments: DocumentType[];
  suggestedNextSteps: string[];
} {
  // Get actions for current phase
  const actions = listPhaseActions(context.currentPhase);

  // Get documents that could be generated
  const documents = listDocumentTypesForPhase(context.currentPhase);

  // Generate suggested next steps based on context
  const suggestedNextSteps: string[] = [];

  // If we have enough insights, suggest document generation
  if (context.insightCount >= 3) {
    const generatableDoc = documents.items.find((d) => d.generatorAvailable);
    if (generatableDoc) {
      suggestedNextSteps.push(
        `Consider generating a ${generatableDoc.name} to capture progress`
      );
    }
  }

  // If in validation phase with insights, suggest viability assessment
  if (
    context.currentPhase === 'validation' &&
    context.insightCount >= 5
  ) {
    suggestedNextSteps.push(
      'Enough context gathered for viability assessment'
    );
  }

  // Check if ready for phase completion
  const phaseIndex = PHASE_ORDER[context.pathway]?.indexOf(context.currentPhase);
  if (phaseIndex !== undefined && phaseIndex >= 0 && context.insightCount >= 3) {
    suggestedNextSteps.push(
      'Phase objectives may be met - evaluate if ready to advance'
    );
  }

  return {
    availableActions: actions.items,
    availableDocuments: documents.items,
    suggestedNextSteps,
  };
}

// =============================================================================
// Export All
// =============================================================================

export const capabilityDiscovery = {
  // Pathway discovery
  listAvailablePathways,
  getPathwayDetails,
  findPathwaysForGoal,

  // Phase action discovery
  listPhaseActions,
  listActionsByType,
  listActionsByOutput,

  // Document type discovery
  listDocumentTypes,
  listDocumentTypesByCategory,
  listDocumentTypesForPhase,
  listAvailableDocumentTypes,
  getDocumentTypeDetails,

  // Contextual discovery
  discoverCapabilities,
};
