export const analystScenarios = {
  healthcareDataPlatform: {
    id: 'healthcare-data',
    name: 'Healthcare Data Platform',
    initialPrompt: 'I want to build a platform for healthcare data analytics that helps hospitals improve patient outcomes',
    expectedTopics: ['HIPAA compliance', 'data security', 'interoperability', 'clinical workflows', 'ROI'],
    followUpQuestions: [
      'What specific healthcare data sources will you integrate?',
      'How will you ensure HIPAA compliance?',
      'What\'s your go-to-market strategy for hospitals?'
    ],
    validationPoints: [
      'Mentions regulatory requirements',
      'Addresses data privacy concerns',
      'Discusses integration with EHR systems',
      'Covers market analysis',
      'Includes technical architecture considerations'
    ]
  },

  ecommerceOptimization: {
    id: 'ecommerce-opt',
    name: 'E-commerce Conversion Optimization',
    initialPrompt: 'Help me optimize my e-commerce conversion funnel. We\'re seeing high cart abandonment rates',
    expectedTopics: ['conversion metrics', 'A/B testing', 'user experience', 'checkout flow', 'retention'],
    followUpQuestions: [
      'What\'s your current cart abandonment rate?',
      'Have you analyzed where users drop off?',
      'What payment methods do you offer?'
    ],
    validationPoints: [
      'Requests specific metrics',
      'Suggests A/B testing approaches',
      'Analyzes customer journey',
      'Recommends checkout optimizations',
      'Addresses trust signals'
    ]
  },

  saasPricing: {
    id: 'saas-pricing',
    name: 'B2B SaaS Pricing Strategy',
    initialPrompt: 'I need to develop a pricing model for my B2B SaaS product that targets enterprise customers',
    expectedTopics: ['value proposition', 'competitive analysis', 'pricing tiers', 'enterprise sales', 'ROI justification'],
    followUpQuestions: [
      'What\'s your core value proposition?',
      'Who are your main competitors?',
      'What\'s your current cost structure?'
    ],
    validationPoints: [
      'Analyzes competitive landscape',
      'Discusses value-based pricing',
      'Suggests tiered structure',
      'Addresses enterprise requirements',
      'Includes ROI calculations'
    ]
  },

  marketEntry: {
    id: 'market-entry',
    name: 'European Market Entry Strategy',
    initialPrompt: 'Should I enter the European market with my fintech product? We\'re currently US-only',
    expectedTopics: ['GDPR', 'regulatory compliance', 'market sizing', 'localization', 'partnerships'],
    followUpQuestions: [
      'What type of fintech product do you offer?',
      'What\'s your current US market share?',
      'Do you have resources for compliance?'
    ],
    validationPoints: [
      'Addresses GDPR compliance',
      'Analyzes regulatory landscape',
      'Provides market sizing',
      'Discusses go-to-market strategy',
      'Considers partnership opportunities'
    ]
  },

  productPivot: {
    id: 'product-pivot',
    name: 'Product Pivot Decision Framework',
    initialPrompt: 'Our product isn\'t gaining traction after 18 months. Should we pivot or persevere?',
    expectedTopics: ['root cause analysis', 'market validation', 'pivot options', 'resource constraints', 'decision criteria'],
    followUpQuestions: [
      'What metrics indicate lack of traction?',
      'Have you validated product-market fit?',
      'What\'s your current runway?'
    ],
    validationPoints: [
      'Conducts root cause analysis',
      'Evaluates current metrics',
      'Presents pivot options',
      'Provides decision framework',
      'Considers resource implications'
    ]
  }
}

export const bmadPathways = {
  newIdea: {
    pathway: 'new-idea',
    name: 'New Idea Creative Expansion',
    initialInput: 'I want to create a marketplace for AI-generated content',
    elicitationSequence: [1, 3, 2, 5, 4], // Sequence of numbered options to select
    expectedPhases: ['Brainstorming', 'Validation', 'Strategic Planning', 'Documentation'],
    expectedOutput: 'Project Brief'
  },

  businessModel: {
    pathway: 'business-model',
    name: 'Business Model Problem Analysis',
    initialInput: 'Our SaaS has high churn in the second month',
    elicitationSequence: [2, 4, 1, 3, 6],
    expectedPhases: ['Problem Definition', 'Root Cause Analysis', 'Solution Exploration', 'Implementation Planning'],
    expectedOutput: 'Business Model Canvas'
  },

  featureRefinement: {
    pathway: 'feature-refinement',
    name: 'Feature Refinement & User-Centered Design',
    initialInput: 'We need to improve our onboarding flow',
    elicitationSequence: [3, 1, 5, 2, 4],
    expectedPhases: ['User Research', 'Pain Point Analysis', 'Solution Design', 'Validation'],
    expectedOutput: 'Feature Specification'
  }
}