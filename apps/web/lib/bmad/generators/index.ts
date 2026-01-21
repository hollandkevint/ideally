// Structured Output Generators
// Export all generators for easy import

export {
  ConceptDocumentGenerator,
  createConceptDocumentGenerator,
  type DocumentGenerationOptions,
  type GeneratedDocument,
  type DocumentSection,
  type DocumentMetadata
} from './concept-document-generator'

export {
  LeanCanvasGenerator,
  createLeanCanvasGenerator,
  type CanvasGenerationOptions,
  type GeneratedCanvas,
  type CanvasSection,
  type CanvasMetadata,
  type BusinessModelCanvasData
} from './lean-canvas-generator'

export {
  BrainstormSummaryGenerator,
  createBrainstormSummaryGenerator,
  type BrainstormSummary,
  type TopicSummary,
  type ActionItem,
  type BrainstormGeneratorOptions
} from './brainstorm-summary-generator'

export {
  ProductBriefGenerator,
  createProductBriefGenerator,
  type ProductBrief,
  type ProductOverview,
  type ProblemStatement,
  type TargetUser,
  type ProposedSolution,
  type Feature,
  type SuccessCriterion,
  type Risk,
  type TimelinePhase,
  type ResourceRequirement,
  type ProductBriefOptions
} from './product-brief-generator'

export {
  ProjectBriefGenerator,
  createProjectBriefGenerator,
  type ProjectBrief,
  type ProjectSummary,
  type ProjectScope,
  type Objective,
  type Deliverable,
  type Milestone,
  type Stakeholder,
  type Constraint,
  type Dependency,
  type CommunicationPlan,
  type ProjectBriefOptions
} from './project-brief-generator'

// Story 3.5: Assumption extraction for exports
export {
  extractAssumptions,
  categorizeAssumptions,
  formatAssumptionsAsMarkdown,
  formatAssumptionsAsHtml,
  type Assumption,
  type CategorizedAssumptions
} from './assumption-extractor'
