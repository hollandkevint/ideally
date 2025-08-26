// BMad Method core types and interfaces

export interface BmadTemplate {
  id: string;
  name: string;
  version: string;
  metadata: TemplateMetadata;
  phases: BmadPhase[];
  outputs: TemplateOutput[];
  dependencies?: string[];
}

export interface TemplateMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  timeEstimate: number; // minutes
  category: 'brainstorming' | 'analysis' | 'planning' | 'validation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface BmadPhase {
  id: string;
  name: string;
  description: string;
  timeAllocation: number; // minutes
  prompts: string[];
  elicitationOptions: { [key: number]: string };
  validationRules: ValidationRule[];
  outputs: PhaseOutput[];
  nextPhaseLogic?: PhaseTransition[];
}

export interface PhaseOutput {
  id: string;
  name: string;
  type: 'text' | 'list' | 'matrix' | 'canvas' | 'document';
  required: boolean;
  validationRules?: ValidationRule[];
}

export interface TemplateOutput {
  id: string;
  name: string;
  type: 'document' | 'framework' | 'analysis' | 'plan';
  template: string;
  includePhases: string[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value: any;
  errorMessage: string;
}

export interface PhaseTransition {
  condition: TransitionCondition;
  nextPhase: string;
  skipConditions?: SkipCondition[];
}

export interface TransitionCondition {
  type: 'completion' | 'time' | 'user_choice' | 'quality_threshold';
  value: any;
}

// Session-related types
export enum PathwayType {
  NEW_IDEA = 'new-idea',
  BUSINESS_MODEL = 'business-model',
  STRATEGIC_OPTIMIZATION = 'strategic-optimization'
}

export interface BmadPathway {
  id: PathwayType;
  name: string;
  description: string;
  targetUser: string;
  expectedOutcome: string;
  timeCommitment: number;
  templateSequence: string[];
  maryPersonaConfig: PersonaConfiguration;
}

export interface PersonaConfiguration {
  primaryPersona: 'analyst' | 'advisor' | 'coach';
  adaptationTriggers: AdaptationTrigger[];
  communicationStyle: CommunicationStyle;
}

export interface AdaptationTrigger {
  condition: string;
  targetPersona: 'analyst' | 'advisor' | 'coach';
  reason: string;
}

export interface CommunicationStyle {
  questioningStyle: 'curious' | 'challenging' | 'supportive';
  responseLength: 'concise' | 'moderate' | 'detailed';
  frameworkEmphasis: 'light' | 'moderate' | 'heavy';
}

// Session management types
export interface BmadSession {
  id: string;
  userId: string;
  workspaceId: string;
  pathway: PathwayType;
  templates: string[];
  currentPhase: string;
  currentTemplate: string;
  progress: SessionProgress;
  startTime: Date;
  timeAllocations: PhaseTimeAllocation[];
  context: SessionContext;
  outputs: SessionOutputs;
  metadata: SessionMetadata;
}

export interface SessionProgress {
  overallCompletion: number;
  phaseCompletion: { [phaseId: string]: number };
  templateCompletion: { [templateId: string]: number };
  currentStep: string;
  nextSteps: string[];
}

export interface SessionContext {
  userResponses: { [key: string]: any };
  elicitationHistory: ElicitationHistory[];
  personaEvolution: PersonaEvolution[];
  knowledgeReferences: KnowledgeReference[];
}

export interface SessionOutputs {
  phaseOutputs: { [phaseId: string]: any };
  templateOutputs: { [templateId: string]: any };
  finalDocuments: GeneratedDocument[];
  actionItems: ActionItem[];
}

export interface ElicitationHistory {
  phaseId: string;
  timestamp: Date;
  options: NumberedOption[];
  userSelection: number | string;
  result: ElicitationResult;
}

export interface NumberedOption {
  number: number;
  text: string;
  category: string;
  estimatedTime: number;
}

export interface ElicitationResult {
  selectedPath: string;
  generatedContext: any;
  nextPhaseHint?: string;
}

// Knowledge base types
export interface KnowledgeReference {
  entryId: string;
  title: string;
  relevanceScore: number;
  appliedInPhase: string;
  timestamp: Date;
}

export interface BmadKnowledgeEntry {
  id: string;
  type: 'framework' | 'technique' | 'template' | 'case_study';
  title: string;
  content: string;
  tags: string[];
  applicablePhases: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  vector?: number[]; // for semantic search
  createdAt: Date;
  updatedAt: Date;
}

// Error handling
export class BmadMethodError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'BmadMethodError';
  }
}

export class TemplateValidationError extends BmadMethodError {
  constructor(message: string, public templateId: string, public validation: any) {
    super(message, 'TEMPLATE_VALIDATION_ERROR', { templateId, validation });
  }
}

export class SessionStateError extends BmadMethodError {
  constructor(message: string, public sessionId: string) {
    super(message, 'SESSION_STATE_ERROR', { sessionId });
  }
}

// Additional types for database integration
export interface PhaseTimeAllocation {
  phaseId: string;
  templateId: string;
  allocatedMinutes: number;
  usedMinutes: number;
  startTime?: Date;
  endTime?: Date;
}

export interface PersonaEvolution {
  phaseId: string;
  previousPersona: 'analyst' | 'advisor' | 'coach';
  newPersona: 'analyst' | 'advisor' | 'coach';
  triggerCondition: string;
  reasoning: string;
  confidenceScore: number;
  timestamp: Date;
}

export interface GeneratedDocument {
  id: string;
  name: string;
  type: string;
  content: string;
  format: 'markdown' | 'html' | 'pdf' | 'docx';
  filePath?: string;
  createdAt: Date;
}

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionMetadata {
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
  endTime?: Date;
}

export interface SkipCondition {
  type: string;
  value: any;
}