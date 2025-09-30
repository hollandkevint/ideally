/**
 * Business Model Canvas - Revenue Analysis Pathway Template
 * Story 2.3: Business Model Problem Revenue Analysis
 */

import { PathwayTemplate } from '../types'

export const businessModelCanvasTemplate: PathwayTemplate = {
  id: 'business-model-canvas-v1',
  name: 'Business Model Problem: Revenue Analysis',
  description: 'Systematic analysis of revenue streams, customer segments, and value propositions to solve business model challenges',
  category: 'business-model',
  estimatedDuration: 25, // minutes
  difficulty: 'intermediate',

  phases: [
    {
      id: 'phase-1-revenue-discovery',
      name: 'Revenue Stream Discovery',
      description: 'Identify and evaluate current and potential revenue models',
      order: 1,
      systemPrompt: `You are Mary, an expert business strategist specializing in revenue model analysis. Your role is to help users identify and evaluate revenue streams systematically.

CONTEXT: The user is working on understanding and optimizing their business model's revenue generation.

YOUR APPROACH:
1. Ask clarifying questions about their current business or idea
2. Identify existing revenue streams (if any)
3. Explore potential revenue streams they haven't considered
4. Assess feasibility of each stream
5. Avoid jargon - use clear, actionable language

FOCUS AREAS:
- Current revenue sources (if applicable)
- Untapped revenue opportunities
- Revenue model types (subscription, one-time, freemium, etc.)
- Market validation and feasibility
- Revenue diversification opportunities

OUTPUT REQUIREMENTS:
- List of 3-5 identified revenue streams
- Brief description of each
- Initial feasibility assessment (high/medium/low)
- Key assumptions for each stream

Keep questions conversational and build on previous answers. Guide them to discover insights rather than telling them what to do.`,

      userGuidance: `Let's explore your revenue opportunities together. I'll ask you some questions to understand your business model and help identify the best revenue streams for your situation.

We'll cover:
✓ Your current revenue (if any)
✓ Potential new revenue sources
✓ What makes sense for your market
✓ Quick feasibility check

This should take about 5-7 minutes. Ready to start?`,

      expectedOutputs: [
        'identified_revenue_streams',
        'current_revenue_sources',
        'potential_revenue_opportunities',
        'feasibility_assessment'
      ],

      validationRules: [
        {
          type: 'required',
          field: 'identified_revenue_streams',
          message: 'At least one revenue stream must be identified'
        },
        {
          type: 'custom',
          field: 'revenue_stream_count',
          message: 'Should identify 2-5 revenue streams for meaningful analysis',
          validator: (data: any) => {
            const count = data.identified_revenue_streams?.length || 0
            return count >= 2 && count <= 5
          }
        }
      ],

      estimatedDuration: 7
    },

    {
      id: 'phase-2-customer-segmentation',
      name: 'Customer Segment Mapping',
      description: 'Define and analyze target customer segments',
      order: 2,
      systemPrompt: `You are Mary, continuing the business model analysis. Now focus on customer segmentation.

CONTEXT: You've identified revenue streams. Now we need to understand WHO will pay for these offerings and WHY.

YOUR APPROACH:
1. Identify distinct customer segments based on the revenue streams discussed
2. Explore each segment's characteristics, needs, and pain points
3. Map value propositions to each segment
4. Assess segment size and accessibility
5. Estimate customer acquisition cost (CAC) and lifetime value (CLV) ranges

FOCUS AREAS:
- Customer demographics and psychographics
- Pain points and needs for each segment
- Willingness to pay
- Acquisition channels
- Segment prioritization

OUTPUT REQUIREMENTS:
- 2-4 clearly defined customer segments
- Pain points and needs for each
- Value propositions matched to segments
- CAC/CLV estimates (rough ranges)
- Priority ranking of segments

Use the Socratic method - help them discover insights through guided questions.`,

      userGuidance: `Now let's identify who your customers are and what they need. Understanding your customer segments will help us refine your revenue strategy.

We'll explore:
✓ Different types of customers
✓ What problems you solve for each
✓ How much they might pay
✓ How to reach them

This takes about 6-8 minutes.`,

      expectedOutputs: [
        'customer_segments',
        'segment_pain_points',
        'value_proposition_map',
        'cac_clv_estimates',
        'priority_segments'
      ],

      validationRules: [
        {
          type: 'required',
          field: 'customer_segments',
          message: 'At least 2 customer segments should be defined'
        },
        {
          type: 'required',
          field: 'value_proposition_map',
          message: 'Value propositions must be mapped to segments'
        }
      ],

      estimatedDuration: 8
    },

    {
      id: 'phase-3-monetization-strategy',
      name: 'Monetization Strategy Development',
      description: 'Design pricing and revenue optimization approach',
      order: 3,
      systemPrompt: `You are Mary, developing the monetization strategy based on revenue streams and customer segments identified.

CONTEXT: You have revenue streams and customer segments. Now design the optimal monetization approach.

YOUR APPROACH:
1. Recommend pricing models (value-based, cost-plus, competition-based)
2. Design pricing tiers if applicable
3. Suggest revenue optimization tactics
4. Consider competitive positioning
5. Identify growth levers
6. Flag potential risks

FOCUS AREAS:
- Optimal pricing model for each segment
- Tiered pricing strategy (if applicable)
- Bundling and upsell opportunities
- Price testing approach
- Competitive differentiation
- Revenue growth tactics

OUTPUT REQUIREMENTS:
- Recommended pricing model with reasoning
- 2-3 pricing tiers (if applicable) with features
- 3-5 optimization tactics
- Competitive positioning statement
- Growth levers list
- Risk assessment

Be specific and actionable. Provide frameworks they can use immediately.`,

      userGuidance: `Let's design your pricing and monetization strategy. We'll determine the best pricing model and tactics to maximize revenue while delivering value.

We'll cover:
✓ Pricing model selection
✓ Pricing tiers (if needed)
✓ Optimization opportunities
✓ Competitive positioning
✓ Growth strategies

About 5-7 minutes for this phase.`,

      expectedOutputs: [
        'pricing_model',
        'pricing_tiers',
        'optimization_tactics',
        'competitive_positioning',
        'growth_levers',
        'monetization_risks'
      ],

      validationRules: [
        {
          type: 'required',
          field: 'pricing_model',
          message: 'A pricing model recommendation is required'
        },
        {
          type: 'required',
          field: 'optimization_tactics',
          message: 'At least 3 optimization tactics should be identified'
        }
      ],

      estimatedDuration: 7
    },

    {
      id: 'phase-4-implementation-roadmap',
      name: 'Implementation Roadmap',
      description: 'Create prioritized action plan with timeline',
      order: 4,
      systemPrompt: `You are Mary, creating the implementation roadmap to execute the business model strategy.

CONTEXT: The revenue strategy is defined. Now create a practical, prioritized action plan.

YOUR APPROACH:
1. Identify quick wins (0-30 days)
2. Define medium-term initiatives (1-3 months)
3. Outline long-term improvements (3-6 months)
4. Specify success metrics and KPIs
5. Note dependencies and resources needed
6. Create timeline with milestones

FOCUS AREAS:
- Prioritized action items
- Resource requirements
- Dependencies and sequencing
- Success metrics
- Timeline with milestones
- Risk mitigation

OUTPUT REQUIREMENTS:
- 3-5 quick wins with specific actions
- 3-5 medium-term initiatives
- 2-3 long-term improvements
- 5-7 key success metrics with targets
- Timeline overview (phases with durations)
- Critical dependencies

Make it actionable and realistic. They should be able to start implementing immediately.`,

      userGuidance: `Finally, let's create your implementation roadmap. We'll prioritize actions and set a realistic timeline so you can start executing right away.

We'll define:
✓ Quick wins (this month)
✓ Medium-term goals (1-3 months)
✓ Long-term initiatives (3-6 months)
✓ Success metrics to track
✓ What to do first

This final phase takes about 5 minutes.`,

      expectedOutputs: [
        'quick_wins',
        'medium_term_initiatives',
        'long_term_improvements',
        'success_metrics',
        'timeline',
        'dependencies'
      ],

      validationRules: [
        {
          type: 'required',
          field: 'quick_wins',
          message: 'At least 2 quick wins must be identified'
        },
        {
          type: 'required',
          field: 'success_metrics',
          message: 'Success metrics must be defined'
        }
      ],

      estimatedDuration: 6
    }
  ],

  metadata: {
    version: '1.0.0',
    author: 'ThinkHaven Product Team',
    tags: [
      'revenue-analysis',
      'business-model',
      'monetization',
      'customer-segments',
      'pricing-strategy'
    ],
    prerequisites: [
      'Basic understanding of your business or idea',
      'Willingness to explore different revenue approaches',
      'Openness to customer feedback and validation'
    ],
    learningOutcomes: [
      'Clear understanding of viable revenue streams',
      'Defined customer segments with value propositions',
      'Specific monetization strategy with pricing model',
      'Actionable implementation roadmap',
      'Complete Business Model Canvas'
    ],
    createdAt: '2025-09-30T00:00:00Z',
    updatedAt: '2025-09-30T00:00:00Z'
  }
}