import {
  BmadPhase,
  BmadTemplate,
  ElicitationType,
  MarketOpportunity,
  CompetitorAnalysis,
  TargetAudience,
  BusinessModelElements,
  BusinessConcept
} from '../types';

/**
 * New Idea Pathway Templates for BMad Method
 * Structured phases for creative expansion and market positioning
 */

export interface NewIdeaPhaseData {
  rawIdea?: string;
  ideationInsights: string[];
  marketOpportunities: MarketOpportunity[];
  uniqueValueProps: string[];
  competitiveLandscape: CompetitorAnalysis[];
  targetAudience?: TargetAudience;
  businessModelElements?: BusinessModelElements;
}

// Note: Type definitions moved to ../types.ts for consistency

// Phase definitions for New Idea pathway
export const NEW_IDEA_PHASES: BmadPhase[] = [
  {
    id: 'ideation',
    name: 'Creative Expansion',
    description: 'Explore and expand your raw business idea through structured ideation',
    timeAllocation: 8, // minutes
    prompts: [
      {
        id: 'idea_capture',
        text: 'Describe your business idea in detail. What problem does it solve? Who would use it?',
        type: 'open-ended',
        required: true,
        helpText: 'Be as specific as possible about your vision'
      },
      {
        id: 'idea_variations',
        text: 'What are 3 different ways you could approach this idea?',
        type: 'structured',
        required: true,
        structure: {
          fields: ['Variation 1', 'Variation 2', 'Variation 3']
        }
      },
      {
        id: 'inspiration',
        text: 'What inspired this idea? What personal experience or observation led you here?',
        type: 'open-ended',
        required: false
      }
    ],
    elicitation: {
      type: ElicitationType.NUMBERED_OPTIONS,
      prompt: 'Which aspect of your idea would you like to explore first?',
      options: [
        {
          number: 1,
          text: 'Problem validation - Is this a real problem worth solving?',
          category: 'validation',
          estimatedTime: 3
        },
        {
          number: 2,
          text: 'Solution innovation - How can we make this solution unique?',
          category: 'innovation',
          estimatedTime: 3
        },
        {
          number: 3,
          text: 'Market opportunity - Who needs this and how many?',
          category: 'market',
          estimatedTime: 2
        }
      ]
    },
    outputs: [
      {
        id: 'ideation_insights',
        name: 'Creative Expansion Insights',
        type: 'list',
        required: true
      },
      {
        id: 'core_concept',
        name: 'Refined Core Concept',
        type: 'text',
        required: true
      }
    ]
  },
  {
    id: 'market_exploration',
    name: 'Market Opportunity Analysis',
    description: 'Identify and analyze market opportunities for your concept',
    timeAllocation: 10, // minutes
    prompts: [
      {
        id: 'target_market',
        text: 'Who is your ideal customer? Describe them in detail.',
        type: 'structured',
        required: true,
        structure: {
          fields: ['Demographics', 'Behaviors', 'Pain Points', 'Budget']
        }
      },
      {
        id: 'market_size',
        text: 'How large is your potential market? (Local, National, Global)',
        type: 'multiple-choice',
        required: true,
        options: ['Local (< 10K users)', 'Regional (10K-100K)', 'National (100K-1M)', 'Global (1M+)']
      },
      {
        id: 'competition',
        text: 'Who are your main competitors or alternatives?',
        type: 'open-ended',
        required: true,
        helpText: 'Include both direct competitors and alternative solutions'
      }
    ],
    elicitation: {
      type: ElicitationType.NUMBERED_OPTIONS,
      prompt: 'What market analysis approach would be most valuable?',
      options: [
        {
          number: 1,
          text: 'Customer segmentation - Define specific user personas',
          category: 'segmentation',
          estimatedTime: 5
        },
        {
          number: 2,
          text: 'Competitive landscape - Map existing solutions',
          category: 'competition',
          estimatedTime: 5
        },
        {
          number: 3,
          text: 'Market trends - Identify growth opportunities',
          category: 'trends',
          estimatedTime: 5
        }
      ]
    },
    outputs: [
      {
        id: 'market_opportunities',
        name: 'Market Opportunities',
        type: 'list',
        required: true
      },
      {
        id: 'competitive_landscape',
        name: 'Competitive Analysis',
        type: 'matrix',
        required: true
      },
      {
        id: 'target_audience',
        name: 'Target Audience Profile',
        type: 'document',
        required: true
      }
    ]
  },
  {
    id: 'concept_refinement',
    name: 'Business Concept Refinement',
    description: 'Refine your value proposition and business model',
    timeAllocation: 8, // minutes
    prompts: [
      {
        id: 'value_prop',
        text: 'What unique value does your solution provide that others don\'t?',
        type: 'open-ended',
        required: true,
        helpText: 'Focus on what makes you different and better'
      },
      {
        id: 'revenue_model',
        text: 'How will you make money?',
        type: 'structured',
        required: true,
        structure: {
          fields: ['Primary Revenue Stream', 'Pricing Strategy', 'Customer Lifetime Value']
        }
      },
      {
        id: 'key_metrics',
        text: 'What metrics will indicate success?',
        type: 'open-ended',
        required: true
      }
    ],
    elicitation: {
      type: ElicitationType.NUMBERED_OPTIONS,
      prompt: 'Which business model element needs the most attention?',
      options: [
        {
          number: 1,
          text: 'Revenue streams - How to monetize effectively',
          category: 'revenue',
          estimatedTime: 4
        },
        {
          number: 2,
          text: 'Cost structure - Understanding unit economics',
          category: 'costs',
          estimatedTime: 4
        },
        {
          number: 3,
          text: 'Growth strategy - How to scale the business',
          category: 'growth',
          estimatedTime: 4
        }
      ]
    },
    outputs: [
      {
        id: 'unique_value_props',
        name: 'Unique Value Propositions',
        type: 'list',
        required: true
      },
      {
        id: 'business_model',
        name: 'Business Model Elements',
        type: 'canvas',
        required: true
      }
    ]
  },
  {
    id: 'positioning',
    name: 'Strategic Positioning',
    description: 'Position your concept for market entry and define next steps',
    timeAllocation: 4, // minutes
    prompts: [
      {
        id: 'positioning_statement',
        text: 'Complete this positioning statement: "For [target customer] who [need], [product] is a [category] that [benefit]"',
        type: 'structured',
        required: true,
        structure: {
          fields: ['Target Customer', 'Need', 'Product', 'Category', 'Key Benefit']
        }
      },
      {
        id: 'launch_strategy',
        text: 'What\'s your go-to-market strategy?',
        type: 'multiple-choice',
        required: true,
        options: ['Soft launch with beta users', 'Targeted launch in niche', 'Broad market launch', 'Partnership-driven launch']
      },
      {
        id: 'next_actions',
        text: 'What are the next 3 concrete steps to move forward?',
        type: 'structured',
        required: true,
        structure: {
          fields: ['Step 1 (This Week)', 'Step 2 (This Month)', 'Step 3 (Next Quarter)']
        }
      }
    ],
    outputs: [
      {
        id: 'positioning_strategy',
        name: 'Market Positioning Strategy',
        type: 'document',
        required: true
      },
      {
        id: 'action_plan',
        name: 'Next Steps Action Plan',
        type: 'list',
        required: true
      },
      {
        id: 'concept_document',
        name: 'Business Concept Document',
        type: 'document',
        required: true
      }
    ]
  }
];

// Complete New Idea pathway template
export const NEW_IDEA_TEMPLATE: BmadTemplate = {
  id: 'new-idea-pathway',
  name: 'New Idea Creative Expansion',
  description: 'Transform your raw business idea into a structured opportunity',
  version: '1.0',
  pathway: 'NEW_IDEA',
  totalDuration: 30, // minutes
  phases: NEW_IDEA_PHASES,
  outputs: [
    {
      id: 'business_concept',
      name: 'Complete Business Concept',
      type: 'document',
      template: 'concept-document',
      includePhases: ['ideation', 'market_exploration', 'concept_refinement', 'positioning']
    },
    {
      id: 'market_analysis',
      name: 'Market Analysis Report',
      type: 'document',
      template: 'market-report',
      includePhases: ['market_exploration']
    },
    {
      id: 'action_roadmap',
      name: 'Implementation Roadmap',
      type: 'document',
      template: 'action-roadmap',
      includePhases: ['positioning']
    }
  ],
  metadata: {
    author: 'BMad Method',
    createdAt: new Date('2025-01-14'),
    tags: ['new-idea', 'ideation', 'creative-expansion', 'market-analysis'],
    difficulty: 'beginner'
  }
};

/**
 * Question sequences for each phase
 */
export const NEW_IDEA_QUESTION_SEQUENCES = {
  ideation: {
    validation: [
      'What specific problem are you solving?',
      'Who experiences this problem most acutely?',
      'How are people currently solving this problem?',
      'What makes this problem worth solving now?',
      'What evidence do you have that this problem exists?'
    ],
    innovation: [
      'What\'s your most innovative feature or approach?',
      'How does technology enable your solution?',
      'What assumptions are you challenging?',
      'How could this solution evolve in 5 years?',
      'What would a 10x better solution look like?'
    ],
    market: [
      'How many people have this problem?',
      'What would they pay to solve it?',
      'What related problems could you also solve?',
      'Which market segment is most underserved?',
      'What market trends support your timing?'
    ]
  },
  market_exploration: {
    segmentation: [
      'Describe your early adopter in detail',
      'What are their demographics and psychographics?',
      'Where do they currently look for solutions?',
      'What triggers their search for a solution?',
      'How do they make purchase decisions?'
    ],
    competition: [
      'Who are the top 3 competitors?',
      'What are their strengths and weaknesses?',
      'What do customers complain about?',
      'Where are the gaps in existing solutions?',
      'How will you differentiate?'
    ],
    trends: [
      'What macro trends support your idea?',
      'How is the market evolving?',
      'What new technologies are emerging?',
      'What regulatory changes might impact you?',
      'What cultural shifts create opportunity?'
    ]
  },
  concept_refinement: {
    revenue: [
      'What\'s your primary revenue model?',
      'How much will customers pay?',
      'What\'s the pricing strategy?',
      'How will pricing evolve over time?',
      'What are the unit economics?'
    ],
    costs: [
      'What are your main cost drivers?',
      'What\'s the cost to acquire a customer?',
      'What are the operational costs?',
      'How do costs scale with growth?',
      'What\'s the path to profitability?'
    ],
    growth: [
      'How will you acquire first customers?',
      'What\'s the viral or referral mechanism?',
      'How will you scale operations?',
      'What partnerships accelerate growth?',
      'What\'s the 3-year growth trajectory?'
    ]
  }
};

/**
 * AI prompts for each phase analysis
 */
export const NEW_IDEA_AI_PROMPTS = {
  ideation: {
    system: `You are Mary, a strategic business coach specializing in creative ideation and innovation. 
    Your role is to help entrepreneurs expand and validate their raw business ideas through structured exploration.
    Be encouraging but analytically rigorous. Ask probing questions that reveal assumptions and opportunities.`,
    
    analysis: `Analyze this business idea and provide:
    1. Core problem validation assessment
    2. Solution uniqueness evaluation
    3. Initial market opportunity sizing
    4. Key assumptions to test
    5. Creative variations to consider
    Focus on expanding thinking while identifying critical success factors.`
  },
  
  market_exploration: {
    system: `You are a market research analyst helping entrepreneurs understand their market opportunity.
    Provide data-driven insights about market size, competition, and customer segments.
    Be specific with numbers, trends, and concrete examples when possible.`,
    
    analysis: `Conduct market analysis for this business concept:
    1. Total addressable market (TAM) estimation
    2. Serviceable addressable market (SAM) 
    3. Competitive landscape mapping
    4. Customer segment prioritization
    5. Market entry barriers and opportunities
    Use industry data and comparable examples where relevant.`
  },
  
  concept_refinement: {
    system: `You are a business model strategist helping refine value propositions and revenue models.
    Focus on creating sustainable, scalable business models with clear differentiation.
    Challenge assumptions while building on validated insights.`,
    
    analysis: `Refine this business concept with:
    1. Unique value proposition statement
    2. Revenue model recommendations
    3. Cost structure analysis
    4. Key success metrics
    5. Business model risks and mitigations
    Ensure recommendations are practical and actionable.`
  },
  
  positioning: {
    system: `You are a strategic positioning expert helping businesses find their market position.
    Create clear, differentiated positioning that resonates with target customers.
    Focus on actionable next steps and concrete milestones.`,
    
    analysis: `Develop strategic positioning:
    1. Clear positioning statement
    2. Competitive differentiation strategy
    3. Go-to-market approach
    4. Key milestones for next 90 days
    5. Success metrics and validation methods
    Make recommendations specific and executable.`
  }
};