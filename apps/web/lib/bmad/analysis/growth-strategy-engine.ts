import { z } from 'zod';
import { 
  BusinessModelPhaseData, 
  CustomerSegment, 
  RevenueStream 
} from '../templates/business-model-templates';
import { CLVEstimation } from './clv-estimation-engine';
import { CACAnalysis } from './cac-analysis-framework';
import { DetailedCompetitivePricingAnalysis } from './competitive-pricing-analyzer';

export interface GrowthStrategyAnalysis {
  analysisId: string;
  timestamp: Date;
  currentGrowthProfile: GrowthProfile;
  growthOpportunities: GrowthOpportunity[];
  recommendedStrategies: GrowthStrategy[];
  growthExperiments: GrowthExperiment[];
  scalingPlan: ScalingPlan;
  resourceRequirements: ResourceRequirements;
  riskAssessment: GrowthRiskAssessment;
  expectedOutcomes: GrowthProjection[];
}

export interface GrowthProfile {
  currentStage: BusinessStage;
  growthMetrics: GrowthMetrics;
  growthConstraints: GrowthConstraint[];
  marketPosition: MarketPositioning;
  competitiveAdvantages: CompetitiveAdvantage[];
  growthReadiness: GrowthReadinessAssessment;
}

export enum BusinessStage {
  STARTUP = 'startup',
  EARLY_STAGE = 'early-stage',
  GROWTH_STAGE = 'growth-stage',
  SCALE_STAGE = 'scale-stage',
  MATURE = 'mature',
  EXPANSION = 'expansion'
}

export interface GrowthMetrics {
  revenueGrowthRate: number;
  customerGrowthRate: number;
  marketShareGrowth: number;
  productMarketFit: number; // 0-1 score
  customerSatisfactionScore: number;
  netPromoterScore: number;
  churnRate: number;
  expansionRevenue: number;
  timeToPayback: number;
  burnRate?: number;
  runway?: number;
}

export interface GrowthConstraint {
  constraintType: 'capital' | 'talent' | 'technology' | 'market' | 'operational' | 'regulatory';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  timeToResolve: string;
  resolutionCost: number;
  mitigationOptions: string[];
}

export interface MarketPositioning {
  marketSize: number;
  totalAddressableMarket: number;
  servicableAddressableMarket: number;
  servicableObtainableMarket: number;
  marketGrowthRate: number;
  currentMarketShare: number;
  competitorCount: number;
  marketConcentration: 'fragmented' | 'moderately-concentrated' | 'highly-concentrated';
  barriers_to_entry: BarrierToEntry[];
}

export interface BarrierToEntry {
  barrier: string;
  strength: 'low' | 'medium' | 'high';
  impact: string;
}

export interface CompetitiveAdvantage {
  advantage: string;
  strengthScore: number; // 1-10
  sustainability: 'temporary' | 'medium-term' | 'long-term';
  defensibility: 'low' | 'medium' | 'high';
  monetizationPotential: number;
}

export interface GrowthReadinessAssessment {
  productReadiness: number; // 0-1
  marketReadiness: number; // 0-1
  teamReadiness: number; // 0-1
  operationalReadiness: number; // 0-1
  financialReadiness: number; // 0-1
  overallReadiness: number; // 0-1
  readinessGaps: ReadinessGap[];
}

export interface ReadinessGap {
  area: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  actionItems: string[];
  timeToClose: string;
  investmentRequired: number;
}

export interface GrowthOpportunity {
  opportunityId: string;
  opportunityType: GrowthOpportunityType;
  title: string;
  description: string;
  marketSize: number;
  potentialRevenue: number;
  timeframe: string;
  probabilityOfSuccess: number;
  investmentRequired: number;
  resourceRequirements: string[];
  competitiveRisk: 'low' | 'medium' | 'high';
  strategicFit: number; // 0-1
  priorityScore: number; // 0-100
}

export enum GrowthOpportunityType {
  MARKET_EXPANSION = 'market-expansion',
  PRODUCT_EXPANSION = 'product-expansion',
  GEOGRAPHIC_EXPANSION = 'geographic-expansion',
  CHANNEL_EXPANSION = 'channel-expansion',
  VERTICAL_EXPANSION = 'vertical-expansion',
  ACQUISITION = 'acquisition',
  PARTNERSHIP = 'partnership',
  PLATFORM_PLAY = 'platform-play',
  ECOSYSTEM_EXPANSION = 'ecosystem-expansion'
}

export interface GrowthStrategy {
  strategyId: string;
  strategyName: string;
  strategyType: GrowthStrategyType;
  description: string;
  targetOpportunities: string[]; // opportunity IDs
  tactics: GrowthTactic[];
  keyMetrics: string[];
  timeline: GrowthTimeline;
  budget: GrowthBudget;
  expectedResults: GrowthResults;
  riskFactors: string[];
  dependencies: string[];
}

export enum GrowthStrategyType {
  ORGANIC_GROWTH = 'organic-growth',
  INORGANIC_GROWTH = 'inorganic-growth',
  HYBRID_GROWTH = 'hybrid-growth',
  VIRAL_GROWTH = 'viral-growth',
  PLATFORM_GROWTH = 'platform-growth',
  ECOSYSTEM_GROWTH = 'ecosystem-growth'
}

export interface GrowthTactic {
  tacticId: string;
  tacticName: string;
  tacticType: 'acquisition' | 'retention' | 'expansion' | 'monetization';
  description: string;
  channels: string[];
  targetSegments: string[];
  expectedROI: number;
  timeToImplement: string;
  resourceRequirements: string[];
  successMetrics: string[];
}

export interface GrowthTimeline {
  phase1: GrowthPhase; // 0-6 months
  phase2: GrowthPhase; // 6-12 months
  phase3: GrowthPhase; // 12-24 months
  longTerm: GrowthPhase; // 24+ months
}

export interface GrowthPhase {
  timeframe: string;
  objectives: string[];
  keyInitiatives: string[];
  milestones: string[];
  budget: number;
  expectedRevenue: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface GrowthBudget {
  totalBudget: number;
  marketingBudget: number;
  productBudget: number;
  salesBudget: number;
  operationsBudget: number;
  technologyBudget: number;
  budgetAllocation: BudgetAllocation[];
}

export interface BudgetAllocation {
  category: string;
  amount: number;
  percentage: number;
  rationale: string;
}

export interface GrowthResults {
  revenueProjection: number;
  customerProjection: number;
  marketShareProjection: number;
  profitabilityProjection: number;
  roiProjection: number;
  timeToResults: string;
  confidenceLevel: number;
}

export interface GrowthExperiment {
  experimentId: string;
  experimentName: string;
  hypothesis: string;
  experimentType: 'pricing' | 'product' | 'marketing' | 'sales' | 'operations';
  targetMetric: string;
  testDuration: string;
  sampleSize: number;
  successCriteria: string[];
  budget: number;
  riskLevel: 'low' | 'medium' | 'high';
  learningObjectives: string[];
  nextSteps: string[];
}

export interface ScalingPlan {
  scalingStrategy: string;
  scalingMilestones: ScalingMilestone[];
  operationalRequirements: OperationalRequirement[];
  technologyRequirements: TechnologyRequirement[];
  talentRequirements: TalentRequirement[];
  financialRequirements: FinancialRequirement[];
}

export interface ScalingMilestone {
  milestone: string;
  targetDate: Date;
  revenueTarget: number;
  customerTarget: number;
  teamSizeTarget: number;
  successCriteria: string[];
  dependencies: string[];
}

export interface OperationalRequirement {
  area: string;
  requirement: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
  cost: number;
  impact: string;
}

export interface TechnologyRequirement {
  technology: string;
  purpose: string;
  priority: 'high' | 'medium' | 'low';
  buildVsBuy: 'build' | 'buy' | 'partner';
  timeframe: string;
  cost: number;
  alternatives: string[];
}

export interface TalentRequirement {
  role: string;
  count: number;
  skills: string[];
  priority: 'high' | 'medium' | 'low';
  hiringTimeframe: string;
  salaryRange: { min: number; max: number };
  alternatives: string[];
}

export interface FinancialRequirement {
  requirement: string;
  amount: number;
  timeframe: string;
  purpose: string;
  fundingSource: 'revenue' | 'debt' | 'equity' | 'grants';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ResourceRequirements {
  humanResources: TalentRequirement[];
  financialResources: FinancialRequirement[];
  technologyResources: TechnologyRequirement[];
  operationalResources: OperationalRequirement[];
  totalInvestment: number;
  paybackPeriod: string;
  roi: number;
}

export interface GrowthRiskAssessment {
  overallRiskLevel: 'low' | 'medium' | 'high';
  riskFactors: GrowthRiskFactor[];
  mitigationStrategies: RiskMitigation[];
  contingencyPlans: ContingencyPlan[];
  monitoringMetrics: string[];
}

export interface GrowthRiskFactor {
  riskId: string;
  riskType: 'market' | 'competitive' | 'operational' | 'financial' | 'technology' | 'regulatory';
  description: string;
  probability: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  riskScore: number; // probability * impact
  timeframe: string;
}

export interface RiskMitigation {
  riskId: string;
  mitigationStrategy: string;
  cost: number;
  effectiveness: number; // 0-1
  timeToImplement: string;
  responsibility: string;
}

export interface ContingencyPlan {
  scenario: string;
  trigger: string;
  actions: string[];
  resourceRequirements: string[];
  timeline: string;
  decisionMaker: string;
}

export interface GrowthProjection {
  timeframe: string;
  scenarioType: 'conservative' | 'base' | 'optimistic';
  revenueProjection: number;
  customerProjection: number;
  marketShareProjection: number;
  assumptions: string[];
  riskFactors: string[];
}

export interface GrowthStrategyRequest {
  businessData: BusinessModelPhaseData;
  currentMetrics?: GrowthMetrics;
  marketData?: {
    marketSize: number;
    growthRate: number;
    competitorCount: number;
  };
  constraints?: string[];
  objectives?: string[];
  timeframe: '1-year' | '2-year' | '3-year' | '5-year';
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
}

const GrowthStrategyRequestSchema = z.object({
  businessData: z.any(), // BusinessModelPhaseData type
  currentMetrics: z.object({
    revenueGrowthRate: z.number(),
    customerGrowthRate: z.number(),
    marketShareGrowth: z.number(),
    productMarketFit: z.number(),
    customerSatisfactionScore: z.number(),
    netPromoterScore: z.number(),
    churnRate: z.number(),
    expansionRevenue: z.number(),
    timeToPayback: z.number(),
    burnRate: z.number().optional(),
    runway: z.number().optional(),
  }).optional(),
  marketData: z.object({
    marketSize: z.number(),
    growthRate: z.number(),
    competitorCount: z.number(),
  }).optional(),
  constraints: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  timeframe: z.enum(['1-year', '2-year', '3-year', '5-year']),
  aggressiveness: z.enum(['conservative', 'moderate', 'aggressive']),
});

export class GrowthStrategyEngine {

  private generateGrowthAnalysisPrompt(request: GrowthStrategyRequest): string {
    return `# Growth Strategy Analysis

## Business Context
**Business Model**: ${request.businessData.sessionType || 'Business Analysis'}
**Customer Segments**: ${request.businessData.customerSegments?.length || 0} segments identified
**Revenue Streams**: ${request.businessData.revenueStreams?.length || 0} streams identified
**Growth Timeframe**: ${request.timeframe}
**Growth Approach**: ${request.aggressiveness}

## Current Performance Metrics
${request.currentMetrics ? `
**Revenue Growth Rate**: ${(request.currentMetrics.revenueGrowthRate * 100).toFixed(1)}%
**Customer Growth Rate**: ${(request.currentMetrics.customerGrowthRate * 100).toFixed(1)}%
**Product-Market Fit Score**: ${(request.currentMetrics.productMarketFit * 100).toFixed(1)}%
**Net Promoter Score**: ${request.currentMetrics.netPromoterScore}
**Customer Satisfaction**: ${(request.currentMetrics.customerSatisfactionScore * 100).toFixed(1)}%
**Churn Rate**: ${(request.currentMetrics.churnRate * 100).toFixed(1)}%
**Expansion Revenue**: $${request.currentMetrics.expansionRevenue.toLocaleString()}
${request.currentMetrics.burnRate ? `**Burn Rate**: $${request.currentMetrics.burnRate.toLocaleString()}/month` : ''}
${request.currentMetrics.runway ? `**Runway**: ${request.currentMetrics.runway} months` : ''}
` : 'Current metrics not provided - estimate based on business stage'}

## Market Context
${request.marketData ? `
**Total Market Size**: $${request.marketData.marketSize.toLocaleString()}
**Market Growth Rate**: ${(request.marketData.growthRate * 100).toFixed(1)}%
**Competitor Count**: ${request.marketData.competitorCount}
` : 'Market data not provided - analyze based on business model'}

## Constraints
${request.constraints?.length ? request.constraints.map(c => `- ${c}`).join('\n') : '- No specific constraints identified'}

## Objectives
${request.objectives?.length ? request.objectives.map(o => `- ${o}`).join('\n') : '- Standard growth objectives assumed'}

## Customer Segments Analysis
${request.businessData.customerSegments?.map(segment => `
**${segment.name}**
- Pain Points: ${segment.painPoints?.join(', ') || 'Not specified'}
- Jobs to be Done: ${segment.jobsToBeDone?.join(', ') || 'Not specified'}
- Size: ${segment.size || 'Unknown'}
`).join('\n') || 'Customer segments not detailed'}

## Revenue Streams Analysis
${request.businessData.revenueStreams?.map(stream => `
**${stream.name}**
- Description: ${stream.description || 'Not specified'}
- Pricing: ${stream.pricing?.amount ? `$${stream.pricing.amount}` : 'Not specified'}
- Target Segments: ${stream.targetSegments?.join(', ') || 'Not specified'}
`).join('\n') || 'Revenue streams not detailed'}

## Analysis Requirements

Please provide a comprehensive growth strategy analysis including:

### 1. Current Growth Profile Assessment
- Business stage identification (startup, early-stage, growth, scale, mature)
- Growth readiness assessment across product, market, team, operations, and finance
- Current growth constraints and their severity
- Market positioning and competitive advantages
- Key growth metrics analysis

### 2. Growth Opportunities Identification
- Market expansion opportunities (geographic, vertical, segment)
- Product expansion opportunities (new features, new products, platform plays)
- Channel expansion opportunities (direct, indirect, digital)
- Partnership and acquisition opportunities
- Platform and ecosystem opportunities
- Prioritized by strategic fit, ROI potential, and feasibility

### 3. Growth Strategy Recommendations
- Primary growth strategy recommendation (organic vs inorganic)
- Specific growth tactics and channels
- Phased implementation timeline (Phase 1: 0-6mo, Phase 2: 6-12mo, etc.)
- Resource allocation recommendations
- Key metrics and success indicators
- Risk factors and mitigation strategies

### 4. Scaling Plan
- Operational scaling requirements
- Technology and infrastructure needs
- Talent acquisition and organizational design
- Financial requirements and funding needs
- Scaling milestones and success criteria

### 5. Growth Experiments Design
- High-impact, low-risk experiments to validate growth hypotheses
- Specific experiment designs with success criteria
- Learning objectives and next steps
- Resource requirements and timelines

### 6. Risk Assessment and Mitigation
- Major risk factors across market, competitive, operational, and financial dimensions
- Probability and impact assessment
- Mitigation strategies and contingency plans
- Monitoring and early warning systems

Focus on ${request.aggressiveness} growth strategies appropriate for the ${request.timeframe} timeframe, considering the business stage and current constraints.`;
  }

  async analyzeGrowthStrategy(request: GrowthStrategyRequest): Promise<GrowthStrategyAnalysis> {
    try {
      GrowthStrategyRequestSchema.parse(request);

      // Assess current growth profile
      const currentGrowthProfile = this.assessGrowthProfile(request);
      
      // Identify growth opportunities
      const growthOpportunities = this.identifyGrowthOpportunities(request, currentGrowthProfile);
      
      // Generate growth strategies
      const recommendedStrategies = this.generateGrowthStrategies(request, growthOpportunities, currentGrowthProfile);
      
      // Design growth experiments
      const growthExperiments = this.designGrowthExperiments(request, recommendedStrategies);
      
      // Create scaling plan
      const scalingPlan = this.createScalingPlan(request, recommendedStrategies);
      
      // Calculate resource requirements
      const resourceRequirements = this.calculateResourceRequirements(recommendedStrategies, scalingPlan);
      
      // Assess risks
      const riskAssessment = this.assessGrowthRisks(request, recommendedStrategies);
      
      // Project outcomes
      const expectedOutcomes = this.projectGrowthOutcomes(request, recommendedStrategies);

      const analysis: GrowthStrategyAnalysis = {
        analysisId: `growth-strategy-${Date.now()}`,
        timestamp: new Date(),
        currentGrowthProfile,
        growthOpportunities,
        recommendedStrategies,
        growthExperiments,
        scalingPlan,
        resourceRequirements,
        riskAssessment,
        expectedOutcomes,
      };

      return analysis;
    } catch (error) {
      throw new Error(`Growth strategy analysis failed: ${error.message}`);
    }
  }

  private assessGrowthProfile(request: GrowthStrategyRequest): GrowthProfile {
    // Determine business stage based on metrics and context
    let currentStage = BusinessStage.EARLY_STAGE;
    
    if (request.currentMetrics) {
      const metrics = request.currentMetrics;
      if (metrics.revenueGrowthRate > 1.0 && metrics.productMarketFit < 0.7) {
        currentStage = BusinessStage.STARTUP;
      } else if (metrics.revenueGrowthRate > 0.5 && metrics.productMarketFit > 0.7) {
        currentStage = BusinessStage.GROWTH_STAGE;
      } else if (metrics.revenueGrowthRate > 0.2 && metrics.productMarketFit > 0.8) {
        currentStage = BusinessStage.SCALE_STAGE;
      } else if (metrics.revenueGrowthRate < 0.1) {
        currentStage = BusinessStage.MATURE;
      }
    }

    // Default growth metrics
    const growthMetrics: GrowthMetrics = {
      revenueGrowthRate: request.currentMetrics?.revenueGrowthRate || 0.3,
      customerGrowthRate: request.currentMetrics?.customerGrowthRate || 0.25,
      marketShareGrowth: request.currentMetrics?.marketShareGrowth || 0.02,
      productMarketFit: request.currentMetrics?.productMarketFit || 0.6,
      customerSatisfactionScore: request.currentMetrics?.customerSatisfactionScore || 0.75,
      netPromoterScore: request.currentMetrics?.netPromoterScore || 30,
      churnRate: request.currentMetrics?.churnRate || 0.05,
      expansionRevenue: request.currentMetrics?.expansionRevenue || 50000,
      timeToPayback: request.currentMetrics?.timeToPayback || 18,
      burnRate: request.currentMetrics?.burnRate,
      runway: request.currentMetrics?.runway,
    };

    // Identify growth constraints
    const growthConstraints: GrowthConstraint[] = [];
    
    if (request.constraints) {
      request.constraints.forEach(constraint => {
        growthConstraints.push({
          constraintType: this.categorizeConstraint(constraint),
          description: constraint,
          severity: 'medium',
          impact: 'May limit growth velocity and scale',
          timeToResolve: '6-12 months',
          resolutionCost: 50000,
          mitigationOptions: this.generateConstraintMitigations(constraint),
        });
      });
    }

    // Default constraints based on stage
    if (currentStage === BusinessStage.STARTUP || currentStage === BusinessStage.EARLY_STAGE) {
      growthConstraints.push({
        constraintType: 'capital',
        description: 'Limited capital for aggressive growth',
        severity: 'high',
        impact: 'Restricts marketing spend and hiring velocity',
        timeToResolve: '12-18 months',
        resolutionCost: 500000,
        mitigationOptions: ['Bootstrap growth', 'Seek venture funding', 'Revenue-based financing'],
      });
    }

    // Market positioning
    const marketPositioning: MarketPositioning = {
      marketSize: request.marketData?.marketSize || 1000000000,
      totalAddressableMarket: request.marketData?.marketSize || 1000000000,
      servicableAddressableMarket: (request.marketData?.marketSize || 1000000000) * 0.3,
      servicableObtainableMarket: (request.marketData?.marketSize || 1000000000) * 0.05,
      marketGrowthRate: request.marketData?.growthRate || 0.15,
      currentMarketShare: 0.01, // Assume small initial share
      competitorCount: request.marketData?.competitorCount || 10,
      marketConcentration: 'moderately-concentrated',
      barriers_to_entry: [
        { barrier: 'Customer acquisition cost', strength: 'medium', impact: 'Moderate barrier for new entrants' },
        { barrier: 'Product complexity', strength: 'medium', impact: 'Technical barriers exist' },
        { barrier: 'Network effects', strength: 'low', impact: 'Limited network effects currently' }
      ],
    };

    // Competitive advantages
    const competitiveAdvantages: CompetitiveAdvantage[] = [
      {
        advantage: 'Product innovation',
        strengthScore: 7,
        sustainability: 'medium-term',
        defensibility: 'medium',
        monetizationPotential: 100000,
      },
      {
        advantage: 'Customer experience',
        strengthScore: 8,
        sustainability: 'long-term',
        defensibility: 'high',
        monetizationPotential: 200000,
      },
    ];

    // Growth readiness assessment
    const growthReadiness = this.assessGrowthReadiness(request, currentStage, growthMetrics);

    return {
      currentStage,
      growthMetrics,
      growthConstraints,
      marketPositioning,
      competitiveAdvantages,
      growthReadiness,
    };
  }

  private assessGrowthReadiness(
    request: GrowthStrategyRequest,
    stage: BusinessStage,
    metrics: GrowthMetrics
  ): GrowthReadinessAssessment {
    const productReadiness = metrics.productMarketFit;
    const marketReadiness = metrics.customerSatisfactionScore > 0.7 ? 0.8 : 0.6;
    const teamReadiness = stage === BusinessStage.STARTUP ? 0.6 : 0.7;
    const operationalReadiness = metrics.churnRate < 0.1 ? 0.7 : 0.5;
    const financialReadiness = metrics.runway && metrics.runway > 12 ? 0.8 : 0.6;
    
    const overallReadiness = (productReadiness + marketReadiness + teamReadiness + operationalReadiness + financialReadiness) / 5;
    
    const readinessGaps: ReadinessGap[] = [];
    
    if (productReadiness < 0.7) {
      readinessGaps.push({
        area: 'Product-Market Fit',
        currentScore: productReadiness,
        targetScore: 0.8,
        gap: 0.8 - productReadiness,
        actionItems: ['Customer feedback analysis', 'Product iteration', 'Feature prioritization'],
        timeToClose: '3-6 months',
        investmentRequired: 100000,
      });
    }
    
    if (teamReadiness < 0.7) {
      readinessGaps.push({
        area: 'Team Capabilities',
        currentScore: teamReadiness,
        targetScore: 0.8,
        gap: 0.8 - teamReadiness,
        actionItems: ['Key hire identification', 'Skills development', 'Organizational structure'],
        timeToClose: '6-12 months',
        investmentRequired: 300000,
      });
    }

    return {
      productReadiness,
      marketReadiness,
      teamReadiness,
      operationalReadiness,
      financialReadiness,
      overallReadiness,
      readinessGaps,
    };
  }

  private identifyGrowthOpportunities(
    request: GrowthStrategyRequest,
    profile: GrowthProfile
  ): GrowthOpportunity[] {
    const opportunities: GrowthOpportunity[] = [];

    // Market expansion opportunities
    if (profile.currentStage === BusinessStage.GROWTH_STAGE || profile.currentStage === BusinessStage.SCALE_STAGE) {
      opportunities.push({
        opportunityId: 'market-exp-1',
        opportunityType: GrowthOpportunityType.MARKET_EXPANSION,
        title: 'Geographic Market Expansion',
        description: 'Expand into new geographic markets with proven product-market fit',
        marketSize: profile.marketPositioning.servicableAddressableMarket * 0.3,
        potentialRevenue: profile.marketPositioning.servicableAddressableMarket * 0.3 * 0.02,
        timeframe: '12-18 months',
        probabilityOfSuccess: 0.7,
        investmentRequired: 200000,
        resourceRequirements: ['Marketing team', 'Local partnerships', 'Regulatory compliance'],
        competitiveRisk: 'medium',
        strategicFit: 0.8,
        priorityScore: 75,
      });
    }

    // Product expansion
    if (profile.growthMetrics.productMarketFit > 0.7) {
      opportunities.push({
        opportunityId: 'product-exp-1',
        opportunityType: GrowthOpportunityType.PRODUCT_EXPANSION,
        title: 'Adjacent Product Development',
        description: 'Develop complementary products for existing customer base',
        marketSize: profile.marketPositioning.servicableObtainableMarket * 2,
        potentialRevenue: profile.marketPositioning.servicableObtainableMarket * 2 * 0.05,
        timeframe: '9-15 months',
        probabilityOfSuccess: 0.6,
        investmentRequired: 500000,
        resourceRequirements: ['Product development', 'Customer research', 'Go-to-market'],
        competitiveRisk: 'low',
        strategicFit: 0.9,
        priorityScore: 80,
      });
    }

    // Channel expansion
    opportunities.push({
      opportunityId: 'channel-exp-1',
      opportunityType: GrowthOpportunityType.CHANNEL_EXPANSION,
      title: 'Partner Channel Development',
      description: 'Build indirect sales channels through strategic partnerships',
      marketSize: profile.marketPositioning.servicableObtainableMarket * 1.5,
      potentialRevenue: profile.marketPositioning.servicableObtainableMarket * 1.5 * 0.03,
      timeframe: '6-12 months',
      probabilityOfSuccess: 0.8,
      investmentRequired: 150000,
      resourceRequirements: ['Partner management', 'Channel enablement', 'Revenue sharing'],
      competitiveRisk: 'medium',
      strategicFit: 0.7,
      priorityScore: 85,
    });

    // Platform opportunity
    if (profile.currentStage === BusinessStage.SCALE_STAGE) {
      opportunities.push({
        opportunityId: 'platform-1',
        opportunityType: GrowthOpportunityType.PLATFORM_PLAY,
        title: 'Platform Ecosystem Development',
        description: 'Transform product into a platform with third-party integrations',
        marketSize: profile.marketPositioning.totalAddressableMarket * 0.1,
        potentialRevenue: profile.marketPositioning.totalAddressableMarket * 0.1 * 0.15,
        timeframe: '18-36 months',
        probabilityOfSuccess: 0.5,
        investmentRequired: 1000000,
        resourceRequirements: ['Platform architecture', 'Developer relations', 'Ecosystem management'],
        competitiveRisk: 'high',
        strategicFit: 0.6,
        priorityScore: 70,
      });
    }

    return opportunities.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  private generateGrowthStrategies(
    request: GrowthStrategyRequest,
    opportunities: GrowthOpportunity[],
    profile: GrowthProfile
  ): GrowthStrategy[] {
    const strategies: GrowthStrategy[] = [];

    // Primary organic growth strategy
    const organicStrategy: GrowthStrategy = {
      strategyId: 'organic-growth-1',
      strategyName: 'Accelerated Organic Growth',
      strategyType: GrowthStrategyType.ORGANIC_GROWTH,
      description: 'Focus on organic growth through customer acquisition, retention, and expansion',
      targetOpportunities: opportunities.slice(0, 2).map(o => o.opportunityId),
      tactics: this.generateOrganicTactics(profile),
      keyMetrics: ['Monthly Recurring Revenue', 'Customer Acquisition Cost', 'Lifetime Value', 'Net Revenue Retention'],
      timeline: this.createGrowthTimeline(request.timeframe, 'organic'),
      budget: this.createGrowthBudget(500000, 'organic'),
      expectedResults: {
        revenueProjection: profile.marketPositioning.servicableObtainableMarket * 0.08,
        customerProjection: 5000,
        marketShareProjection: 0.05,
        profitabilityProjection: 0.2,
        roiProjection: 3.5,
        timeToResults: '12-18 months',
        confidenceLevel: 0.8,
      },
      riskFactors: ['Market saturation', 'Competitive response', 'Customer acquisition challenges'],
      dependencies: ['Product-market fit', 'Operational scaling', 'Team expansion'],
    };

    strategies.push(organicStrategy);

    // Partnership-driven growth strategy
    if (opportunities.find(o => o.opportunityType === GrowthOpportunityType.PARTNERSHIP)) {
      strategies.push({
        strategyId: 'partnership-growth-1',
        strategyName: 'Strategic Partnership Growth',
        strategyType: GrowthStrategyType.HYBRID_GROWTH,
        description: 'Accelerate growth through strategic partnerships and channel expansion',
        targetOpportunities: opportunities.filter(o => 
          o.opportunityType === GrowthOpportunityType.PARTNERSHIP || 
          o.opportunityType === GrowthOpportunityType.CHANNEL_EXPANSION
        ).map(o => o.opportunityId),
        tactics: this.generatePartnershipTactics(),
        keyMetrics: ['Partner-sourced revenue', 'Partner activation rate', 'Revenue per partner'],
        timeline: this.createGrowthTimeline(request.timeframe, 'partnership'),
        budget: this.createGrowthBudget(300000, 'partnership'),
        expectedResults: {
          revenueProjection: profile.marketPositioning.servicableObtainableMarket * 0.05,
          customerProjection: 2500,
          marketShareProjection: 0.03,
          profitabilityProjection: 0.25,
          roiProjection: 4.0,
          timeToResults: '9-15 months',
          confidenceLevel: 0.7,
        },
        riskFactors: ['Partner dependency', 'Channel conflict', 'Revenue sharing impact'],
        dependencies: ['Partner recruitment', 'Channel enablement', 'Performance management'],
      });
    }

    return strategies;
  }

  private generateOrganicTactics(profile: GrowthProfile): GrowthTactic[] {
    return [
      {
        tacticId: 'seo-content',
        tacticName: 'SEO & Content Marketing',
        tacticType: 'acquisition',
        description: 'Drive organic traffic and leads through SEO-optimized content',
        channels: ['Blog', 'SEO', 'Content syndication'],
        targetSegments: ['All segments'],
        expectedROI: 4.0,
        timeToImplement: '3-6 months',
        resourceRequirements: ['Content team', 'SEO specialist', 'Design support'],
        successMetrics: ['Organic traffic growth', 'Lead conversion rate', 'Content engagement'],
      },
      {
        tacticId: 'customer-success',
        tacticName: 'Customer Success Program',
        tacticType: 'retention',
        description: 'Reduce churn and increase expansion through proactive customer success',
        channels: ['Direct customer contact', 'Product usage data', 'Success metrics'],
        targetSegments: ['High-value customers'],
        expectedROI: 6.0,
        timeToImplement: '2-4 months',
        resourceRequirements: ['Customer success team', 'Analytics platform', 'Automation tools'],
        successMetrics: ['Net Revenue Retention', 'Customer health score', 'Expansion revenue'],
      },
      {
        tacticId: 'referral-program',
        tacticName: 'Customer Referral Program',
        tacticType: 'acquisition',
        description: 'Leverage satisfied customers to drive new customer acquisition',
        channels: ['Customer referrals', 'Partner referrals', 'Influencer network'],
        targetSegments: ['Satisfied customers', 'Brand advocates'],
        expectedROI: 5.0,
        timeToImplement: '1-3 months',
        resourceRequirements: ['Referral platform', 'Incentive budget', 'Program management'],
        successMetrics: ['Referral conversion rate', 'Customer acquisition cost', 'Program participation'],
      },
    ];
  }

  private generatePartnershipTactics(): GrowthTactic[] {
    return [
      {
        tacticId: 'channel-partners',
        tacticName: 'Channel Partner Program',
        tacticType: 'acquisition',
        description: 'Build indirect sales channels through reseller partnerships',
        channels: ['Partner networks', 'Channel partners', 'System integrators'],
        targetSegments: ['Enterprise', 'Mid-market'],
        expectedROI: 3.5,
        timeToImplement: '6-9 months',
        resourceRequirements: ['Partner manager', 'Channel enablement', 'Training materials'],
        successMetrics: ['Partner revenue', 'Partner activation', 'Deal registration'],
      },
      {
        tacticId: 'integration-partners',
        tacticName: 'Technology Integration Partners',
        tacticType: 'acquisition',
        description: 'Partner with complementary technology providers for joint solutions',
        channels: ['Technology partnerships', 'Joint go-to-market', 'Co-marketing'],
        targetSegments: ['Technology-forward customers'],
        expectedROI: 4.5,
        timeToImplement: '4-8 months',
        resourceRequirements: ['Technical partnerships', 'Integration development', 'Joint marketing'],
        successMetrics: ['Integration adoption', 'Partner-sourced leads', 'Joint customer success'],
      },
    ];
  }

  private createGrowthTimeline(timeframe: string, strategyType: string): GrowthTimeline {
    const basePhases = {
      phase1: {
        timeframe: '0-6 months',
        objectives: ['Foundation building', 'Initial execution'],
        keyInitiatives: ['Team building', 'Process setup', 'Early campaigns'],
        milestones: ['Team in place', 'Systems operational', 'First results'],
        budget: 100000,
        expectedRevenue: 50000,
        riskLevel: 'medium' as const,
      },
      phase2: {
        timeframe: '6-12 months',
        objectives: ['Scale execution', 'Optimize performance'],
        keyInitiatives: ['Campaign scaling', 'Process optimization', 'Performance tuning'],
        milestones: ['Consistent performance', 'ROI targets met', 'Market validation'],
        budget: 150000,
        expectedRevenue: 200000,
        riskLevel: 'low' as const,
      },
      phase3: {
        timeframe: '12-24 months',
        objectives: ['Market expansion', 'Competitive advantage'],
        keyInitiatives: ['Market expansion', 'Product enhancement', 'Competitive moats'],
        milestones: ['Market leadership', 'Sustainable advantage', 'Profitability'],
        budget: 200000,
        expectedRevenue: 500000,
        riskLevel: 'low' as const,
      },
      longTerm: {
        timeframe: '24+ months',
        objectives: ['Market dominance', 'Platform expansion'],
        keyInitiatives: ['Platform development', 'Ecosystem building', 'Global expansion'],
        milestones: ['Market dominance', 'Platform adoption', 'Global presence'],
        budget: 300000,
        expectedRevenue: 1000000,
        riskLevel: 'medium' as const,
      },
    };

    return basePhases;
  }

  private createGrowthBudget(totalBudget: number, strategyType: string): GrowthBudget {
    const allocations: BudgetAllocation[] = [];
    
    if (strategyType === 'organic') {
      allocations.push(
        { category: 'Marketing', amount: totalBudget * 0.4, percentage: 40, rationale: 'Customer acquisition focus' },
        { category: 'Product', amount: totalBudget * 0.25, percentage: 25, rationale: 'Product development and enhancement' },
        { category: 'Sales', amount: totalBudget * 0.2, percentage: 20, rationale: 'Sales team and enablement' },
        { category: 'Operations', amount: totalBudget * 0.1, percentage: 10, rationale: 'Operational scaling' },
        { category: 'Technology', amount: totalBudget * 0.05, percentage: 5, rationale: 'Infrastructure and tools' }
      );
    } else {
      allocations.push(
        { category: 'Marketing', amount: totalBudget * 0.3, percentage: 30, rationale: 'Co-marketing and enablement' },
        { category: 'Sales', amount: totalBudget * 0.3, percentage: 30, rationale: 'Channel development' },
        { category: 'Product', amount: totalBudget * 0.2, percentage: 20, rationale: 'Integration development' },
        { category: 'Operations', amount: totalBudget * 0.15, percentage: 15, rationale: 'Partner management' },
        { category: 'Technology', amount: totalBudget * 0.05, percentage: 5, rationale: 'Partner enablement tools' }
      );
    }

    return {
      totalBudget,
      marketingBudget: allocations.find(a => a.category === 'Marketing')?.amount || 0,
      productBudget: allocations.find(a => a.category === 'Product')?.amount || 0,
      salesBudget: allocations.find(a => a.category === 'Sales')?.amount || 0,
      operationsBudget: allocations.find(a => a.category === 'Operations')?.amount || 0,
      technologyBudget: allocations.find(a => a.category === 'Technology')?.amount || 0,
      budgetAllocation: allocations,
    };
  }

  private designGrowthExperiments(
    request: GrowthStrategyRequest,
    strategies: GrowthStrategy[]
  ): GrowthExperiment[] {
    return [
      {
        experimentId: 'pricing-experiment-1',
        experimentName: 'Value-Based Pricing Test',
        hypothesis: 'Higher value-based pricing will increase revenue without significantly impacting conversion',
        experimentType: 'pricing',
        targetMetric: 'Revenue per customer',
        testDuration: '8 weeks',
        sampleSize: 1000,
        successCriteria: ['10% increase in revenue per customer', 'Less than 5% decrease in conversion rate'],
        budget: 25000,
        riskLevel: 'medium',
        learningObjectives: ['Price sensitivity understanding', 'Value perception validation', 'Revenue optimization'],
        nextSteps: ['Full rollout if successful', 'Price optimization if mixed results', 'Revert if negative impact'],
      },
      {
        experimentId: 'acquisition-experiment-1',
        experimentName: 'Multi-Channel Acquisition Test',
        hypothesis: 'Diversifying acquisition channels will reduce CAC and improve customer quality',
        experimentType: 'marketing',
        targetMetric: 'Customer Acquisition Cost',
        testDuration: '12 weeks',
        sampleSize: 500,
        successCriteria: ['20% reduction in blended CAC', 'Maintained or improved customer quality'],
        budget: 50000,
        riskLevel: 'low',
        learningObjectives: ['Channel effectiveness', 'Customer quality by channel', 'Optimal budget allocation'],
        nextSteps: ['Scale winning channels', 'Optimize underperforming channels', 'Develop channel playbooks'],
      },
      {
        experimentId: 'retention-experiment-1',
        experimentName: 'Onboarding Optimization Test',
        hypothesis: 'Improved onboarding will increase activation and reduce early churn',
        experimentType: 'product',
        targetMetric: 'Day 30 retention rate',
        testDuration: '6 weeks',
        sampleSize: 2000,
        successCriteria: ['15% improvement in 30-day retention', '25% increase in feature adoption'],
        budget: 75000,
        riskLevel: 'low',
        learningObjectives: ['Activation drivers', 'Onboarding friction points', 'Success metric correlation'],
        nextSteps: ['Implement successful elements', 'Iterate on suboptimal areas', 'Expand to existing customers'],
      },
    ];
  }

  private createScalingPlan(
    request: GrowthStrategyRequest,
    strategies: GrowthStrategy[]
  ): ScalingPlan {
    const milestones: ScalingMilestone[] = [
      {
        milestone: 'Foundation Scale',
        targetDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months
        revenueTarget: 500000,
        customerTarget: 1000,
        teamSizeTarget: 25,
        successCriteria: ['Repeatable processes', 'Positive unit economics', 'Product-market fit'],
        dependencies: ['Team hiring', 'Process documentation', 'System implementation'],
      },
      {
        milestone: 'Growth Scale',
        targetDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000), // 12 months
        revenueTarget: 2000000,
        customerTarget: 5000,
        teamSizeTarget: 50,
        successCriteria: ['Sustainable growth rate', 'Market validation', 'Operational efficiency'],
        dependencies: ['Market expansion', 'Team scaling', 'Technology platform'],
      },
      {
        milestone: 'Market Scale',
        targetDate: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000), // 24 months
        revenueTarget: 10000000,
        customerTarget: 20000,
        teamSizeTarget: 100,
        successCriteria: ['Market leadership', 'Competitive moats', 'Profitable growth'],
        dependencies: ['Geographic expansion', 'Product platform', 'Strategic partnerships'],
      },
    ];

    const operationalRequirements: OperationalRequirement[] = [
      {
        area: 'Customer Success',
        requirement: 'Scalable customer success platform and processes',
        priority: 'high',
        timeframe: '3-6 months',
        cost: 200000,
        impact: 'Reduced churn and increased expansion revenue',
      },
      {
        area: 'Sales Operations',
        requirement: 'CRM system and sales process optimization',
        priority: 'high',
        timeframe: '2-4 months',
        cost: 100000,
        impact: 'Improved sales efficiency and forecasting',
      },
      {
        area: 'Marketing Operations',
        requirement: 'Marketing automation and analytics platform',
        priority: 'medium',
        timeframe: '4-6 months',
        cost: 150000,
        impact: 'Better lead quality and campaign ROI',
      },
    ];

    const technologyRequirements: TechnologyRequirement[] = [
      {
        technology: 'Scalable Cloud Infrastructure',
        purpose: 'Support customer and data growth',
        priority: 'high',
        buildVsBuy: 'buy',
        timeframe: '2-3 months',
        cost: 300000,
        alternatives: ['AWS', 'Google Cloud', 'Azure'],
      },
      {
        technology: 'Data Analytics Platform',
        purpose: 'Customer insights and business intelligence',
        priority: 'medium',
        buildVsBuy: 'buy',
        timeframe: '3-5 months',
        cost: 200000,
        alternatives: ['Snowflake', 'BigQuery', 'Databricks'],
      },
    ];

    const talentRequirements: TalentRequirement[] = [
      {
        role: 'VP of Sales',
        count: 1,
        skills: ['B2B sales leadership', 'Team building', 'Process optimization'],
        priority: 'high',
        hiringTimeframe: '2-3 months',
        salaryRange: { min: 150000, max: 200000 },
        alternatives: ['Interim executive', 'Sales consultant'],
      },
      {
        role: 'Product Manager',
        count: 2,
        skills: ['Product strategy', 'Customer research', 'Growth mindset'],
        priority: 'high',
        hiringTimeframe: '3-4 months',
        salaryRange: { min: 120000, max: 160000 },
        alternatives: ['Product consultant', 'Internal promotion'],
      },
      {
        role: 'Marketing Manager',
        count: 2,
        skills: ['Digital marketing', 'Content strategy', 'Analytics'],
        priority: 'medium',
        hiringTimeframe: '2-3 months',
        salaryRange: { min: 80000, max: 120000 },
        alternatives: ['Marketing agency', 'Contractor'],
      },
    ];

    const financialRequirements: FinancialRequirement[] = [
      {
        requirement: 'Growth capital for scaling',
        amount: 2000000,
        timeframe: '6-12 months',
        purpose: 'Team expansion, marketing, and infrastructure',
        fundingSource: 'equity',
        riskLevel: 'medium',
      },
      {
        requirement: 'Working capital facility',
        amount: 500000,
        timeframe: '3-6 months',
        purpose: 'Cash flow management during growth',
        fundingSource: 'debt',
        riskLevel: 'low',
      },
    ];

    return {
      scalingStrategy: 'Controlled aggressive growth with systematic capability building',
      scalingMilestones: milestones,
      operationalRequirements,
      technologyRequirements,
      talentRequirements,
      financialRequirements,
    };
  }

  private calculateResourceRequirements(
    strategies: GrowthStrategy[],
    scalingPlan: ScalingPlan
  ): ResourceRequirements {
    const totalInvestment = strategies.reduce((sum, s) => sum + s.budget.totalBudget, 0) +
                           scalingPlan.financialRequirements.reduce((sum, r) => sum + r.amount, 0);

    return {
      humanResources: scalingPlan.talentRequirements,
      financialResources: scalingPlan.financialRequirements,
      technologyResources: scalingPlan.technologyRequirements,
      operationalResources: scalingPlan.operationalRequirements,
      totalInvestment,
      paybackPeriod: '18-24 months',
      roi: 3.5,
    };
  }

  private assessGrowthRisks(
    request: GrowthStrategyRequest,
    strategies: GrowthStrategy[]
  ): GrowthRiskAssessment {
    const riskFactors: GrowthRiskFactor[] = [
      {
        riskId: 'market-saturation',
        riskType: 'market',
        description: 'Market becomes saturated faster than expected',
        probability: 0.3,
        impact: 'high',
        riskScore: 0.3 * 3, // high impact = 3
        timeframe: '12-18 months',
      },
      {
        riskId: 'competitive-response',
        riskType: 'competitive',
        description: 'Competitors respond aggressively to growth initiatives',
        probability: 0.6,
        impact: 'medium',
        riskScore: 0.6 * 2, // medium impact = 2
        timeframe: '6-12 months',
      },
      {
        riskId: 'scaling-challenges',
        riskType: 'operational',
        description: 'Operational challenges in scaling team and processes',
        probability: 0.4,
        impact: 'medium',
        riskScore: 0.4 * 2,
        timeframe: '9-15 months',
      },
      {
        riskId: 'capital-constraints',
        riskType: 'financial',
        description: 'Inability to secure required growth capital',
        probability: 0.2,
        impact: 'high',
        riskScore: 0.2 * 3,
        timeframe: '6-12 months',
      },
    ];

    const mitigationStrategies: RiskMitigation[] = riskFactors.map(risk => ({
      riskId: risk.riskId,
      mitigationStrategy: this.generateMitigationStrategy(risk),
      cost: risk.impact === 'high' ? 100000 : 50000,
      effectiveness: 0.7,
      timeToImplement: '3-6 months',
      responsibility: 'Executive team',
    }));

    const contingencyPlans: ContingencyPlan[] = [
      {
        scenario: 'Growth stalls due to market saturation',
        trigger: '2 consecutive quarters of declining growth rate',
        actions: ['Pivot to adjacent markets', 'Accelerate product development', 'Consider M&A opportunities'],
        resourceRequirements: ['Strategy consultant', 'Additional capital', 'Business development team'],
        timeline: '30-60 days',
        decisionMaker: 'CEO',
      },
      {
        scenario: 'Capital shortage constrains growth',
        trigger: 'Runway drops below 12 months',
        actions: ['Reduce burn rate', 'Accelerate revenue generation', 'Emergency funding round'],
        resourceRequirements: ['CFO involvement', 'Investment banker', 'Board support'],
        timeline: '60-90 days',
        decisionMaker: 'Board of Directors',
      },
    ];

    const averageRiskScore = riskFactors.reduce((sum, r) => sum + r.riskScore, 0) / riskFactors.length;
    let overallRiskLevel: 'low' | 'medium' | 'high';
    if (averageRiskScore < 1) overallRiskLevel = 'low';
    else if (averageRiskScore < 2) overallRiskLevel = 'medium';
    else overallRiskLevel = 'high';

    return {
      overallRiskLevel,
      riskFactors,
      mitigationStrategies,
      contingencyPlans,
      monitoringMetrics: [
        'Monthly recurring revenue growth',
        'Customer acquisition cost trends',
        'Market share indicators',
        'Competitive win/loss rates',
        'Team velocity metrics',
        'Cash flow projections',
      ],
    };
  }

  private projectGrowthOutcomes(
    request: GrowthStrategyRequest,
    strategies: GrowthStrategy[]
  ): GrowthProjection[] {
    const baseRevenue = 1000000; // Assumed current revenue
    
    return [
      {
        timeframe: '12 months',
        scenarioType: 'conservative',
        revenueProjection: baseRevenue * 2,
        customerProjection: 2000,
        marketShareProjection: 0.02,
        assumptions: ['Moderate execution success', 'Stable market conditions', 'No major competitive threats'],
        riskFactors: ['Slower than expected adoption', 'Higher than expected churn'],
      },
      {
        timeframe: '12 months',
        scenarioType: 'base',
        revenueProjection: baseRevenue * 3,
        customerProjection: 3000,
        marketShareProjection: 0.03,
        assumptions: ['Planned execution success', 'Normal market growth', 'Competitive response as expected'],
        riskFactors: ['Market saturation', 'Scaling challenges'],
      },
      {
        timeframe: '12 months',
        scenarioType: 'optimistic',
        revenueProjection: baseRevenue * 4.5,
        customerProjection: 5000,
        marketShareProjection: 0.05,
        assumptions: ['Exceptional execution', 'Market expansion', 'Competitive advantages sustained'],
        riskFactors: ['Overextension', 'Quality compromises from rapid growth'],
      },
    ];
  }

  private categorizeConstraint(constraint: string): GrowthConstraint['constraintType'] {
    const constraintLower = constraint.toLowerCase();
    if (constraintLower.includes('capital') || constraintLower.includes('fund') || constraintLower.includes('money')) {
      return 'capital';
    }
    if (constraintLower.includes('talent') || constraintLower.includes('hire') || constraintLower.includes('team')) {
      return 'talent';
    }
    if (constraintLower.includes('technology') || constraintLower.includes('tech') || constraintLower.includes('system')) {
      return 'technology';
    }
    if (constraintLower.includes('market') || constraintLower.includes('customer')) {
      return 'market';
    }
    if (constraintLower.includes('regulation') || constraintLower.includes('compliance')) {
      return 'regulatory';
    }
    return 'operational';
  }

  private generateConstraintMitigations(constraint: string): string[] {
    const constraintType = this.categorizeConstraint(constraint);
    
    const mitigationMap: Record<GrowthConstraint['constraintType'], string[]> = {
      capital: ['Bootstrap growth', 'Revenue-based financing', 'Strategic investor', 'Debt financing'],
      talent: ['Contractor/consultant model', 'Offshore development', 'Strategic partnerships', 'Equity compensation'],
      technology: ['SaaS solutions', 'Open source alternatives', 'Technology partnerships', 'Phased implementation'],
      market: ['Adjacent market entry', 'Product positioning', 'Value proposition refinement', 'Channel strategy'],
      operational: ['Process automation', 'Outsourcing', 'Operational partnerships', 'Phased scaling'],
      regulatory: ['Regulatory expertise', 'Compliance partners', 'Phased market entry', 'Legal consultation'],
    };

    return mitigationMap[constraintType] || ['Strategic assessment', 'Expert consultation', 'Phased approach'];
  }

  private generateMitigationStrategy(risk: GrowthRiskFactor): string {
    const strategyMap: Record<GrowthRiskFactor['riskType'], string> = {
      market: 'Diversify market approach and monitor early indicators',
      competitive: 'Build competitive moats and accelerate differentiation',
      operational: 'Implement robust processes and hire experienced talent',
      financial: 'Maintain multiple funding sources and conservative projections',
      technology: 'Invest in scalable architecture and technical expertise',
      regulatory: 'Engage regulatory experts and maintain compliance monitoring',
    };

    return strategyMap[risk.riskType] || 'Implement comprehensive monitoring and response protocols';
  }

  async generateGrowthStrategyReport(analysis: GrowthStrategyAnalysis): Promise<string> {
    return `# Growth Strategy Analysis Report

## Executive Summary
**Business Stage**: ${analysis.currentGrowthProfile.currentStage.toUpperCase().replace('-', ' ')}
**Growth Readiness**: ${Math.round(analysis.currentGrowthProfile.growthReadiness.overallReadiness * 100)}%
**Primary Strategy**: ${analysis.recommendedStrategies[0]?.strategyName || 'Not determined'}
**Investment Required**: $${analysis.resourceRequirements.totalInvestment.toLocaleString()}
**Expected ROI**: ${analysis.resourceRequirements.roi}x over 24 months

## Current Growth Profile

### Growth Metrics
- **Revenue Growth Rate**: ${(analysis.currentGrowthProfile.growthMetrics.revenueGrowthRate * 100).toFixed(1)}%
- **Customer Growth Rate**: ${(analysis.currentGrowthProfile.growthMetrics.customerGrowthRate * 100).toFixed(1)}%
- **Product-Market Fit**: ${(analysis.currentGrowthProfile.growthMetrics.productMarketFit * 100).toFixed(1)}%
- **Net Promoter Score**: ${analysis.currentGrowthProfile.growthMetrics.netPromoterScore}
- **Churn Rate**: ${(analysis.currentGrowthProfile.growthMetrics.churnRate * 100).toFixed(1)}%

### Market Position
- **Market Size**: $${analysis.currentGrowthProfile.marketPositioning.totalAddressableMarket.toLocaleString()}
- **Current Market Share**: ${(analysis.currentGrowthProfile.marketPositioning.currentMarketShare * 100).toFixed(2)}%
- **Market Growth Rate**: ${(analysis.currentGrowthProfile.marketPositioning.marketGrowthRate * 100).toFixed(1)}%

### Growth Readiness Assessment
${analysis.currentGrowthProfile.growthReadiness.readinessGaps.length > 0 ? `
**Key Readiness Gaps:**
${analysis.currentGrowthProfile.growthReadiness.readinessGaps.map(gap => `
- **${gap.area}**: ${(gap.currentScore * 100).toFixed(0)}% → ${(gap.targetScore * 100).toFixed(0)}% (${gap.timeToClose})
  - Actions: ${gap.actionItems.slice(0, 2).join(', ')}
  - Investment: $${gap.investmentRequired.toLocaleString()}
`).join('')}
` : '**No critical readiness gaps identified**'}

## Growth Opportunities

${analysis.growthOpportunities.slice(0, 5).map(opp => `
### ${opp.title}
**Type**: ${opp.opportunityType.replace('-', ' ').toUpperCase()}
**Potential Revenue**: $${opp.potentialRevenue.toLocaleString()}
**Investment**: $${opp.investmentRequired.toLocaleString()}
**Timeframe**: ${opp.timeframe}
**Success Probability**: ${(opp.probabilityOfSuccess * 100).toFixed(0)}%
**Priority Score**: ${opp.priorityScore}/100

${opp.description}
`).join('')}

## Recommended Growth Strategies

${analysis.recommendedStrategies.map(strategy => `
### ${strategy.strategyName}
**Type**: ${strategy.strategyType.replace('-', ' ').toUpperCase()}
**Budget**: $${strategy.budget.totalBudget.toLocaleString()}
**Expected Revenue**: $${strategy.expectedResults.revenueProjection.toLocaleString()}
**ROI**: ${strategy.expectedResults.roiProjection}x
**Confidence**: ${(strategy.expectedResults.confidenceLevel * 100).toFixed(0)}%

**Description**: ${strategy.description}

**Key Tactics**:
${strategy.tactics.slice(0, 3).map(tactic => `- ${tactic.tacticName}: ${tactic.description}`).join('\n')}

**Timeline**:
- Phase 1 (0-6mo): ${strategy.timeline.phase1.objectives.join(', ')}
- Phase 2 (6-12mo): ${strategy.timeline.phase2.objectives.join(', ')}
- Phase 3 (12-24mo): ${strategy.timeline.phase3.objectives.join(', ')}

**Key Metrics**: ${strategy.keyMetrics.join(', ')}
`).join('')}

## Scaling Plan

### Resource Requirements
**Total Investment**: $${analysis.resourceRequirements.totalInvestment.toLocaleString()}
**Payback Period**: ${analysis.resourceRequirements.paybackPeriod}

**Key Hires**:
${analysis.resourceRequirements.humanResources.filter(r => r.priority === 'high').map(role => `
- ${role.count}x ${role.role}: $${role.salaryRange.min.toLocaleString()}-${role.salaryRange.max.toLocaleString()} (${role.hiringTimeframe})
`).join('')}

**Technology Investments**:
${analysis.resourceRequirements.technologyResources.filter(r => r.priority === 'high').map(tech => `
- ${tech.technology}: $${tech.cost.toLocaleString()} (${tech.timeframe})
`).join('')}

### Scaling Milestones
${analysis.scalingPlan.scalingMilestones.map(milestone => `
**${milestone.milestone}** - ${milestone.targetDate.toLocaleDateString()}
- Revenue Target: $${milestone.revenueTarget.toLocaleString()}
- Customer Target: ${milestone.customerTarget.toLocaleString()}
- Team Size: ${milestone.teamSizeTarget} people
`).join('')}

## Risk Assessment

**Overall Risk Level**: ${analysis.riskAssessment.overallRiskLevel.toUpperCase()}

### Major Risk Factors
${analysis.riskAssessment.riskFactors.filter(r => r.riskScore >= 1).map(risk => `
**${risk.riskType.toUpperCase()} RISK**: ${risk.description}
- Probability: ${(risk.probability * 100).toFixed(0)}% | Impact: ${risk.impact}
- Timeframe: ${risk.timeframe}
`).join('')}

### Mitigation Strategies
${analysis.riskAssessment.mitigationStrategies.slice(0, 3).map(mitigation => `
- ${mitigation.mitigationStrategy} (${(mitigation.effectiveness * 100).toFixed(0)}% effective)
`).join('')}

## Growth Experiments

${analysis.growthExperiments.map(experiment => `
### ${experiment.experimentName}
**Hypothesis**: ${experiment.hypothesis}
**Target Metric**: ${experiment.targetMetric}
**Duration**: ${experiment.testDuration}
**Budget**: $${experiment.budget.toLocaleString()}
**Success Criteria**: ${experiment.successCriteria.join(', ')}
`).join('')}

## Growth Projections

${analysis.expectedOutcomes.map(projection => `
### ${projection.timeframe} ${projection.scenarioType.toUpperCase()} Scenario
- **Revenue**: $${projection.revenueProjection.toLocaleString()}
- **Customers**: ${projection.customerProjection.toLocaleString()}
- **Market Share**: ${(projection.marketShareProjection * 100).toFixed(2)}%
`).join('')}

## Implementation Timeline

### Next 30 Days
${analysis.scalingPlan.scalingMilestones[0] ? `
- Begin ${analysis.scalingPlan.scalingMilestones[0].dependencies.slice(0, 2).join(' and ')}
- Launch ${analysis.growthExperiments[0]?.experimentName || 'first growth experiment'}
- Set up monitoring for key metrics
` : 'Initiate foundational activities'}

### Next 90 Days
- Complete growth readiness gap closure
- Execute primary growth experiments
- Begin scaling team and operations

### Next 12 Months
- Achieve first scaling milestone
- Optimize based on experiment results
- Prepare for next growth phase

---
*Analysis generated on ${analysis.timestamp.toLocaleDateString()}*
*Growth Strategy Engine v1.0*
`;
  }
}

export const growthStrategyEngine = new GrowthStrategyEngine();