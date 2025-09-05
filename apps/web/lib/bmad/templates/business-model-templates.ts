import { BmadPhase, BmadTemplate, ElicitationType } from '../types';

/**
 * Business Model Problem Pathway Templates for BMad Method
 * Systematic analysis of revenue streams, customer segments, and value propositions
 */

export interface BusinessModelPhaseData {
  currentModel?: string;
  revenueStreams: RevenueStream[];
  customerSegments: CustomerSegment[];
  valuePropositions: ValueProposition[];
  leanCanvasData?: LeanCanvasData;
  implementationRoadmap?: ActionItem[];
  kpis?: RecommendedMetric[];
}

export interface RevenueStream {
  id: string;
  name: string;
  type: 'subscription' | 'one-time' | 'freemium' | 'marketplace' | 'advertising' | 'commission' | 'licensing';
  feasibility: number;
  estimatedRevenue: string;
  implementation: string;
  confidence: number;
  marketValidation: 'validated' | 'assumed' | 'unknown';
}

export interface CustomerSegment {
  id: string;
  name: string;
  demographics: string[];
  psychographics: string[];
  painPoints: string[];
  size: 'small' | 'medium' | 'large';
  acquisitionCost: string;
  lifetimeValue: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ValueProposition {
  id: string;
  segment: string;
  jobToBeDone: string;
  painRelievers: string[];
  gainCreators: string[];
  uniqueDifferentiator: string;
  competitiveAdvantage: string;
}

export interface LeanCanvasData {
  problem: string[];
  solution: string[];
  uniqueValueProposition: string;
  unfairAdvantage: string;
  customerSegments: string[];
  keyMetrics: string[];
  channels: string[];
  costStructure: string[];
  revenueStreams: string[];
}

export interface ActionItem {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: 'this-week' | 'this-month' | 'next-quarter';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export interface RecommendedMetric {
  name: string;
  description: string;
  category: 'revenue' | 'customer' | 'product' | 'operational';
  target?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

// Phase definitions for Business Model Problem pathway
export const BUSINESS_MODEL_PHASES: BmadPhase[] = [
  {
    id: 'revenue_analysis',
    name: 'Revenue Stream Analysis',
    description: 'Analyze current revenue model and identify optimization opportunities',
    timeAllocation: 10, // minutes
    prompts: [
      {
        id: 'current_model',
        text: 'Describe your current business model. How do you make money today?',
        type: 'open-ended',
        required: true,
        helpText: 'Include all revenue sources, even if small or inconsistent'
      },
      {
        id: 'revenue_challenges',
        text: 'What specific challenges are you facing with monetization?',
        type: 'structured',
        required: true,
        structure: {
          fields: ['Primary Challenge', 'Impact on Business', 'Current Attempts to Solve']
        }
      },
      {
        id: 'revenue_goals',
        text: 'What are your revenue goals for the next 12 months?',
        type: 'open-ended',
        required: true,
        helpText: 'Be specific about targets and timelines'
      }
    ],
    elicitation: {
      type: ElicitationType.NUMBERED_OPTIONS,
      prompt: 'Which revenue analysis area should we focus on first?',
      options: [
        {
          number: 1,
          text: 'Revenue stream diversification - Explore new revenue sources',
          category: 'diversification',
          estimatedTime: 4
        },
        {
          number: 2,
          text: 'Pricing optimization - Improve current pricing model',
          category: 'pricing',
          estimatedTime: 4
        },
        {
          number: 3,
          text: 'Revenue model validation - Test market fit for current model',
          category: 'validation',
          estimatedTime: 2
        }
      ]
    },
    outputs: [
      {
        id: 'revenue_analysis',
        name: 'Revenue Stream Analysis',
        type: 'matrix',
        required: true
      },
      {
        id: 'optimization_opportunities',
        name: 'Revenue Optimization Opportunities',
        type: 'list',
        required: true
      }
    ]
  },
  {
    id: 'customer_segmentation',
    name: 'Customer Segment Mapping',
    description: 'AI-guided customer segmentation with value proposition alignment',
    timeAllocation: 8, // minutes
    prompts: [
      {
        id: 'current_customers',
        text: 'Who are your current customers? Describe your best customers in detail.',
        type: 'structured',
        required: true,
        structure: {
          fields: ['Demographics', 'Company Size/Type', 'Pain Points', 'Budget Range']
        }
      },
      {
        id: 'customer_acquisition',
        text: 'How do you currently acquire customers and what does it cost?',
        type: 'open-ended',
        required: true,
        helpText: 'Include both marketing costs and sales time'
      },
      {
        id: 'customer_lifetime_value',
        text: 'What is the lifetime value of your customers?',
        type: 'multiple-choice',
        required: true,
        options: ['< $100', '$100-1K', '$1K-10K', '$10K-100K', '$100K+', 'Don\'t know']
      }
    ],
    elicitation: {
      type: ElicitationType.NUMBERED_OPTIONS,
      prompt: 'What customer analysis would provide the most value?',
      options: [
        {
          number: 1,
          text: 'Customer persona refinement - Define ideal customer profiles',
          category: 'personas',
          estimatedTime: 4
        },
        {
          number: 2,
          text: 'Market segmentation - Identify underserved segments',
          category: 'segmentation',
          estimatedTime: 4
        },
        {
          number: 3,
          text: 'Value alignment - Match segments to value propositions',
          category: 'alignment',
          estimatedTime: 3
        }
      ]
    },
    outputs: [
      {
        id: 'customer_segments',
        name: 'Customer Segment Profiles',
        type: 'document',
        required: true
      },
      {
        id: 'segment_analysis',
        name: 'Customer Segment Analysis',
        type: 'matrix',
        required: true
      }
    ]
  },
  {
    id: 'value_proposition',
    name: 'Value Proposition Analysis',
    description: 'Align value propositions with customer needs and competitive positioning',
    timeAllocation: 6, // minutes
    prompts: [
      {
        id: 'current_value_prop',
        text: 'What value do you currently provide to customers? How do you describe your solution?',
        type: 'open-ended',
        required: true,
        helpText: 'Use the language your customers would use'
      },
      {
        id: 'competitive_advantage',
        text: 'What makes your solution uniquely valuable compared to alternatives?',
        type: 'structured',
        required: true,
        structure: {
          fields: ['Unique Feature/Capability', 'Customer Benefit', 'Competitive Moat']
        }
      },
      {
        id: 'value_gaps',
        text: 'Where do you feel your value proposition could be stronger?',
        type: 'open-ended',
        required: true
      }
    ],
    elicitation: {
      type: ElicitationType.NUMBERED_OPTIONS,
      prompt: 'Which value proposition area needs the most attention?',
      options: [
        {
          number: 1,
          text: 'Value clarity - Sharpen messaging and positioning',
          category: 'clarity',
          estimatedTime: 3
        },
        {
          number: 2,
          text: 'Competitive differentiation - Strengthen unique positioning',
          category: 'differentiation',
          estimatedTime: 3
        },
        {
          number: 3,
          text: 'Value demonstration - Improve proof and credibility',
          category: 'proof',
          estimatedTime: 2
        }
      ]
    },
    outputs: [
      {
        id: 'value_propositions',
        name: 'Value Proposition Canvas',
        type: 'canvas',
        required: true
      },
      {
        id: 'competitive_analysis',
        name: 'Competitive Positioning Analysis',
        type: 'matrix',
        required: true
      }
    ]
  },
  {
    id: 'monetization_strategy',
    name: 'Monetization Strategy',
    description: 'Concrete recommendations for pricing models and revenue optimization',
    timeAllocation: 4, // minutes
    prompts: [
      {
        id: 'pricing_model',
        text: 'What pricing model are you currently using and how is it performing?',
        type: 'structured',
        required: true,
        structure: {
          fields: ['Current Model', 'Performance/Results', 'Customer Feedback']
        }
      },
      {
        id: 'pricing_challenges',
        text: 'What pricing or monetization challenges are you experiencing?',
        type: 'multiple-choice',
        required: true,
        options: ['Prices too low', 'Resistance to pricing', 'Complex pricing structure', 'Unclear value delivery', 'Competitive pressure']
      },
      {
        id: 'growth_constraints',
        text: 'What constraints are limiting your revenue growth?',
        type: 'open-ended',
        required: true
      }
    ],
    elicitation: {
      type: ElicitationType.NUMBERED_OPTIONS,
      prompt: 'What monetization improvement would have the biggest impact?',
      options: [
        {
          number: 1,
          text: 'Pricing optimization - Improve pricing model and structure',
          category: 'pricing',
          estimatedTime: 2
        },
        {
          number: 2,
          text: 'Revenue diversification - Add new revenue streams',
          category: 'diversification',
          estimatedTime: 2
        },
        {
          number: 3,
          text: 'Growth strategy - Scale existing revenue more effectively',
          category: 'scaling',
          estimatedTime: 2
        }
      ]
    },
    outputs: [
      {
        id: 'monetization_strategy',
        name: 'Monetization Strategy Recommendations',
        type: 'document',
        required: true
      },
      {
        id: 'pricing_analysis',
        name: 'Pricing Model Analysis',
        type: 'matrix',
        required: true
      }
    ]
  },
  {
    id: 'implementation_planning',
    name: 'Implementation Roadmap',
    description: 'Prioritized action plan with specific next steps for business model improvements',
    timeAllocation: 2, // minutes
    prompts: [
      {
        id: 'immediate_actions',
        text: 'What could you implement immediately (this week) to improve your business model?',
        type: 'open-ended',
        required: true,
        helpText: 'Focus on quick wins and low-effort improvements'
      },
      {
        id: 'success_metrics',
        text: 'How will you measure success of business model improvements?',
        type: 'structured',
        required: true,
        structure: {
          fields: ['Key Metric', 'Current Baseline', 'Target Goal', 'Timeframe']
        }
      },
      {
        id: 'resource_constraints',
        text: 'What resources or constraints should we consider in the implementation plan?',
        type: 'open-ended',
        required: false
      }
    ],
    outputs: [
      {
        id: 'implementation_roadmap',
        name: 'Implementation Roadmap',
        type: 'document',
        required: true
      },
      {
        id: 'success_metrics',
        name: 'Success Metrics Dashboard',
        type: 'list',
        required: true
      },
      {
        id: 'lean_canvas',
        name: 'Updated Lean Canvas',
        type: 'canvas',
        required: true
      }
    ]
  }
];

// Complete Business Model Problem pathway template
export const BUSINESS_MODEL_TEMPLATE: BmadTemplate = {
  id: 'business-model-problem-pathway',
  name: 'Business Model Problem Analysis',
  description: 'Systematic analysis of revenue streams, customer segments, and value propositions using proven business frameworks',
  version: '1.0',
  pathway: 'BUSINESS_MODEL_PROBLEM',
  totalDuration: 30, // minutes
  phases: BUSINESS_MODEL_PHASES,
  outputs: [
    {
      id: 'lean_canvas',
      name: 'Complete Lean Canvas',
      type: 'framework',
      template: 'lean-canvas',
      includePhases: ['revenue_analysis', 'customer_segmentation', 'value_proposition', 'monetization_strategy', 'implementation_planning']
    },
    {
      id: 'business_model_analysis',
      name: 'Business Model Analysis Report',
      type: 'analysis',
      template: 'business-model-report',
      includePhases: ['revenue_analysis', 'customer_segmentation', 'value_proposition']
    },
    {
      id: 'implementation_plan',
      name: 'Business Model Implementation Plan',
      type: 'plan',
      template: 'implementation-roadmap',
      includePhases: ['monetization_strategy', 'implementation_planning']
    }
  ],
  metadata: {
    author: 'BMad Method',
    createdAt: new Date('2025-01-25'),
    tags: ['business-model', 'revenue-analysis', 'customer-segmentation', 'lean-canvas', 'monetization'],
    difficulty: 'intermediate'
  }
};

/**
 * Question sequences for each phase based on elicitation category
 */
export const BUSINESS_MODEL_QUESTION_SEQUENCES = {
  revenue_analysis: {
    diversification: [
      'What adjacent markets could you serve with minor modifications?',
      'What complementary products or services could you offer?',
      'How could you monetize your existing customer relationships differently?',
      'What data or insights do you have that others would value?',
      'What partnerships could create new revenue streams?'
    ],
    pricing: [
      'What value metrics matter most to your customers?',
      'How price sensitive are your different customer segments?',
      'What would justify a 2x price increase in your solution?',
      'How does your pricing compare to the cost of alternatives?',
      'What pricing experiments could you run this month?'
    ],
    validation: [
      'What evidence do you have that customers value your current offering?',
      'How do customers currently measure ROI from your solution?',
      'What would customers pay for your solution if it didn\'t exist?',
      'Which features or services drive the most willingness to pay?',
      'How does customer retention correlate with value delivery?'
    ]
  },
  customer_segmentation: {
    personas: [
      'Describe your highest-value customer in detail',
      'What triggers their need for your solution?',
      'How do they typically discover and evaluate solutions?',
      'What are their decision-making criteria and process?',
      'What would make them recommend you to others?'
    ],
    segmentation: [
      'What distinct groups of customers have different needs?',
      'Which segments are most underserved by current solutions?',
      'What segments have the highest growth potential?',
      'Which segments are easiest and hardest to serve?',
      'What segments could you dominate with focused effort?'
    ],
    alignment: [
      'Which customer segments get the most value from your solution?',
      'How does value perception differ across segments?',
      'What value propositions resonate with each segment?',
      'Which segments are most profitable and why?',
      'How should you adjust your offering for different segments?'
    ]
  },
  value_proposition: {
    clarity: [
      'Complete this sentence: "We help [customer] achieve [outcome] by [unique approach]"',
      'What outcome do customers hire your solution to achieve?',
      'How would customers explain your value to a colleague?',
      'What analogies or comparisons help customers understand your value?',
      'What proof points best demonstrate your value?'
    ],
    differentiation: [
      'What can you do that competitors fundamentally cannot?',
      'What unique assets, data, or relationships do you have?',
      'What would it cost competitors to replicate your solution?',
      'How do you deliver value differently than alternatives?',
      'What makes your approach unfairly advantageous?'
    ],
    proof: [
      'What concrete results have you delivered for customers?',
      'What testimonials or case studies showcase your impact?',
      'How do you measure and communicate value delivery?',
      'What guarantees or risk-reduction can you offer?',
      'What third-party validation supports your claims?'
    ]
  },
  monetization_strategy: {
    pricing: [
      'What pricing model would best capture the value you create?',
      'How could you align pricing with customer success metrics?',
      'What would usage-based or outcome-based pricing look like?',
      'How could you create pricing tiers that grow with customers?',
      'What pricing experiments would give you the most insight?'
    ],
    diversification: [
      'What services could you add to increase customer lifetime value?',
      'How could you monetize the data or insights you generate?',
      'What marketplace or platform opportunities exist?',
      'How could you create recurring revenue from one-time customers?',
      'What licensing or partnership revenue models make sense?'
    ],
    scaling: [
      'What are the biggest constraints on revenue growth?',
      'How could you increase revenue per customer?',
      'What would double your sales velocity?',
      'How could you improve customer retention and expansion?',
      'What operational changes would enable more revenue?'
    ]
  }
};

/**
 * AI prompts for Business Model Problem pathway analysis
 */
export const BUSINESS_MODEL_AI_PROMPTS = {
  revenue_analysis: {
    system: `You are a business model strategist specializing in revenue optimization and business model innovation.
    Your role is to help entrepreneurs identify revenue opportunities and solve monetization challenges.
    Be analytical and data-driven, focusing on practical, implementable solutions with measurable impact.`,
    
    analysis: `Analyze this business's revenue model and provide:
    1. Revenue stream assessment with feasibility scores
    2. Pricing optimization opportunities with specific recommendations
    3. New revenue stream possibilities with implementation difficulty
    4. Market validation status for current and proposed models
    5. Financial projections for recommended changes
    Focus on actionable improvements with clear business rationale.`
  },
  
  customer_segmentation: {
    system: `You are a customer development expert helping businesses understand their market segments.
    Provide precise customer insights with practical segmentation strategies.
    Use frameworks like customer personas, jobs-to-be-done, and value-based segmentation.`,
    
    analysis: `Conduct customer segmentation analysis for this business:
    1. Customer segment identification with sizing and characteristics
    2. Customer acquisition cost (CAC) analysis by segment
    3. Customer lifetime value (CLV) estimation by segment
    4. Segment prioritization matrix based on attractiveness and fit
    5. Go-to-market recommendations for each priority segment
    Use specific data points and actionable customer insights.`
  },
  
  value_proposition: {
    system: `You are a value proposition strategist helping businesses clarify and strengthen their market positioning.
    Focus on customer-centric value articulation using frameworks like Value Proposition Canvas.
    Create clear, differentiated value propositions that resonate with target segments.`,
    
    analysis: `Develop value proposition strategy with:
    1. Value Proposition Canvas for each customer segment
    2. Competitive differentiation analysis with positioning recommendations
    3. Value demonstration and proof strategies
    4. Messaging framework aligned with customer language
    5. Value-based pricing alignment recommendations
    Ensure recommendations are customer-validated and competitively defensible.`
  },
  
  monetization_strategy: {
    system: `You are a pricing and monetization specialist helping businesses optimize revenue models.
    Focus on value-based pricing, revenue optimization, and sustainable growth strategies.
    Provide specific, testable recommendations with clear success metrics.`,
    
    analysis: `Create monetization strategy with:
    1. Pricing model recommendations with rationale and benchmarks
    2. Revenue optimization tactics with expected impact
    3. Pricing experiment design for validation
    4. Revenue diversification opportunities with implementation plans
    5. Growth strategy alignment with business model strengths
    Make recommendations specific, measurable, and implementable within 90 days.`
  },
  
  implementation_planning: {
    system: `You are an implementation strategist helping businesses execute business model improvements.
    Create practical, prioritized roadmaps with clear milestones and success metrics.
    Focus on quick wins while building toward long-term strategic goals.`,
    
    analysis: `Develop implementation roadmap with:
    1. Prioritized action plan with effort/impact matrix
    2. 30-60-90 day milestone framework
    3. Key performance indicators (KPIs) and measurement plan
    4. Resource requirements and constraint analysis
    5. Risk mitigation strategies for implementation challenges
    Ensure recommendations are realistic and executable with available resources.`
  }
};

/**
 * Lean Canvas framework integration
 */
export const LEAN_CANVAS_TEMPLATE = {
  structure: {
    problem: {
      title: 'Problem',
      description: 'Top 3 problems you solve',
      questions: [
        'What are the top 3 problems your customers face?',
        'How are customers currently solving these problems?',
        'What makes these problems worth solving?'
      ]
    },
    solution: {
      title: 'Solution',
      description: 'Top 3 features that solve the problems',
      questions: [
        'What are your top 3 solution features?',
        'How do these features directly address the problems?',
        'What makes your solution approach unique?'
      ]
    },
    uniqueValueProposition: {
      title: 'Unique Value Proposition',
      description: 'Single, clear compelling message that states why you are different and worth paying attention to',
      questions: [
        'What outcome do you help customers achieve?',
        'How is your approach uniquely valuable?',
        'Why should customers choose you over alternatives?'
      ]
    },
    unfairAdvantage: {
      title: 'Unfair Advantage',
      description: 'Can\'t be easily copied or bought',
      questions: [
        'What unique assets do you have?',
        'What would be difficult for competitors to replicate?',
        'What gives you sustainable competitive advantage?'
      ]
    },
    customerSegments: {
      title: 'Customer Segments',
      description: 'Target customers',
      questions: [
        'Who are your early adopters?',
        'What customer segments will pay for your solution?',
        'Which segments offer the highest lifetime value?'
      ]
    },
    keyMetrics: {
      title: 'Key Metrics',
      description: 'Key numbers that tell you how your business is doing',
      questions: [
        'What metrics indicate business health?',
        'How do you measure customer value delivery?',
        'What leading indicators predict growth?'
      ]
    },
    channels: {
      title: 'Channels',
      description: 'Path to customers',
      questions: [
        'How do customers discover your solution?',
        'What channels are most effective for acquisition?',
        'How do you deliver your solution to customers?'
      ]
    },
    costStructure: {
      title: 'Cost Structure',
      description: 'Major costs to operate your business',
      questions: [
        'What are your key cost drivers?',
        'What costs scale with customer growth?',
        'What investments are required for growth?'
      ]
    },
    revenueStreams: {
      title: 'Revenue Streams',
      description: 'How you make money',
      questions: [
        'How do you generate revenue from customers?',
        'What pricing model captures the most value?',
        'What additional revenue streams are possible?'
      ]
    }
  }
};