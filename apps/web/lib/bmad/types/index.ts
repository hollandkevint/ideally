/**
 * BMAD Method Type Definitions
 * Core types for pathway templates, analysis engines, and orchestration
 */

// Template Types
export interface PathwayTemplate {
  id: string
  name: string
  description: string
  category: PathwayCategory
  estimatedDuration: number // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  phases: PathwayPhase[]
  metadata: TemplateMetadata
}

export type PathwayCategory =
  | 'business-model'
  | 'feature-refinement'
  | 'new-idea'
  | 'assumption-testing'

export interface PathwayPhase {
  id: string
  name: string
  description: string
  order: number
  systemPrompt: string
  userGuidance: string
  expectedOutputs: string[]
  validationRules: ValidationRule[]
  estimatedDuration: number // minutes
}

export interface TemplateMetadata {
  version: string
  author: string
  tags: string[]
  prerequisites: string[]
  learningOutcomes: string[]
  createdAt: string
  updatedAt: string
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'pattern' | 'custom'
  field: string
  value?: any
  message: string
  validator?: (value: any) => boolean
}

// Session Types
export interface BmadSession {
  id: string
  userId: string
  workspaceId: string
  templateId: string
  currentPhaseId: string
  phaseData: Record<string, PhaseData>
  analysisResults: AnalysisResults
  completionPercentage: number
  status: SessionStatus
  startedAt: string
  updatedAt: string
  completedAt?: string
}

export type SessionStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'abandoned'

export interface PhaseData {
  phaseId: string
  userInputs: Record<string, any>
  aiInsights: string[]
  extractedData: Record<string, any>
  completedAt?: string
  validationStatus: 'pending' | 'valid' | 'invalid'
}

// Analysis Types
export interface AnalysisResults {
  revenueAnalysis?: RevenueAnalysis
  customerAnalysis?: CustomerAnalysis
  monetizationStrategy?: MonetizationStrategy
  implementationRoadmap?: ImplementationRoadmap
  businessModelCanvas?: BusinessModelCanvas
}

export interface RevenueAnalysis {
  identifiedStreams: RevenueStream[]
  feasibilityScores: Record<string, number>
  recommendations: string[]
  nextSteps: string[]
  confidence: number
}

export interface RevenueStream {
  id: string
  name: string
  type: RevenueType
  description: string
  targetMarket: string
  estimatedRevenue?: string
  feasibilityScore: number
  pros: string[]
  cons: string[]
  implementation: string[]
}

export type RevenueType =
  | 'subscription'
  | 'one-time'
  | 'freemium'
  | 'transaction-fee'
  | 'advertising'
  | 'licensing'
  | 'consulting'
  | 'marketplace'
  | 'hybrid'

export interface CustomerAnalysis {
  segments: CustomerSegment[]
  segmentationCriteria: string[]
  valuePropositionMap: Record<string, string[]>
  prioritySegments: string[]
  insights: string[]
}

export interface CustomerSegment {
  id: string
  name: string
  description: string
  size: 'small' | 'medium' | 'large'
  characteristics: string[]
  painPoints: string[]
  valuePropositions: string[]
  acquisitionChannels: string[]
  clvEstimate?: string
  cacEstimate?: string
}

export interface MonetizationStrategy {
  recommendedModel: string
  pricingStrategy: PricingStrategy
  optimizationTactics: string[]
  competitivePositioning: string
  growthLevers: string[]
  risks: string[]
}

export interface PricingStrategy {
  model: 'value-based' | 'cost-plus' | 'competition-based' | 'dynamic'
  tiers?: PricingTier[]
  reasoning: string
  testingApproach: string[]
}

export interface PricingTier {
  name: string
  price: string
  features: string[]
  targetSegment: string
  positioning: string
}

export interface ImplementationRoadmap {
  phases: RoadmapPhase[]
  quickWins: string[]
  longTermInitiatives: string[]
  successMetrics: Metric[]
  timeline: string
}

export interface RoadmapPhase {
  id: string
  name: string
  duration: string
  objectives: string[]
  deliverables: string[]
  dependencies: string[]
  resources: string[]
}

export interface Metric {
  name: string
  description: string
  target: string
  measurementFrequency: string
  dataSource: string
}

// Business Model Canvas Types
export interface BusinessModelCanvas {
  keyPartners: string[]
  keyActivities: string[]
  keyResources: string[]
  valuePropositions: string[]
  customerRelationships: string[]
  channels: string[]
  customerSegments: string[]
  costStructure: string[]
  revenueStreams: string[]
  generatedAt: string
}

// Orchestration Types
export interface OrchestrationContext {
  sessionId: string
  templateId: string
  currentPhase: PathwayPhase
  conversationHistory: ConversationMessage[]
  workspaceContext: WorkspaceContext
  userProfile?: UserProfile
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface WorkspaceContext {
  workspaceId: string
  workspaceName: string
  workspaceDescription?: string
  previousSessions: string[]
  relatedDocuments: string[]
}

export interface UserProfile {
  userId: string
  expertise: string[]
  industry?: string
  goals: string[]
  preferences: Record<string, any>
}

// Engine Response Types
export interface EngineResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  confidence?: number
  metadata?: Record<string, any>
}

// Template Validation
export interface TemplateValidation {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}