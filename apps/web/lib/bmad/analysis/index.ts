/**
 * BMad Analysis Engines - Consolidated Exports
 * 
 * This file provides a single entry point for all BMad analysis engines,
 * making it easy to import and use the complete Monetization Strategy Engine suite.
 * 
 * Usage:
 *   import { pricingModelAnalyzer, revenueOptimizationEngine } from '@/lib/bmad/analysis';
 * 
 * Or import everything:
 *   import * as BmadAnalysis from '@/lib/bmad/analysis';
 */

// Core Analysis Engines
export { 
  PricingModelAnalyzer,
  pricingModelAnalyzer
} from './pricing-model-analyzer';

export { 
  RevenueOptimizationEngine,
  revenueOptimizationEngine
} from './revenue-optimization-engine';

export { 
  CompetitivePricingAnalyzer,
  competitivePricingAnalyzer
} from './competitive-pricing-analyzer';

export { 
  GrowthStrategyEngine,
  growthStrategyEngine
} from './growth-strategy-engine';

// Previous Analysis Engines (if they exist)
export * from './customer-segmentation-analyzer';
export * from './value-proposition-mapper';
export * from './clv-estimation-engine';
export * from './cac-analysis-framework';

// === PRICING MODEL ANALYZER EXPORTS ===
export type {
  PricingModelAnalysis,
  PricingModel,
  PricingModelType,
  PricingModelRecommendation,
  PriceOptimization,
  PricingSensitivityAnalysis,
  CompetitivePricingAnalysis,
  PricingImplementationPlan,
  PricingStructure,
  PricingMetrics,
  ModelSuitability,
  PriceRange,
  PriceTest,
  CompetitorPrice,
  MarketPosition,
  PricingGap,
  CompetitiveAdvantage,
  PriceElasticityAnalysis,
  ValueBasedPricingAnalysis,
  BehavioralPricingFactors,
  PricingRisk
} from './pricing-model-analyzer';

// === REVENUE OPTIMIZATION ENGINE EXPORTS ===
export type {
  RevenueOptimizationAnalysis,
  RevenuePerformanceSnapshot,
  OptimizationOpportunity,
  RevenueRecommendation,
  QuickWin,
  StrategicInitiative,
  OptimizationRoadmap,
  OptimizationResults,
  RevenueStreamPerformance,
  SegmentRevenue,
  RevenueMetrics,
  BenchmarkComparison,
  RevenueTrends,
  EfficiencyMetrics,
  RevenueHistoryData,
  OpportunityCategory,
  RoadmapPhase,
  ImplementationStep,
  ResultsProjection,
  OptimizationRisk
} from './revenue-optimization-engine';

// === COMPETITIVE PRICING ANALYZER EXPORTS ===
export type {
  DetailedCompetitivePricingAnalysis,
  CompetitorPricingData,
  CompetitivePricingAnalysisRequest,
  CompetitivePricingPosition,
  PricingRecommendation,
  MarketOpportunity,
  CompetitiveThreat,
  PricingPlan,
  FeatureComparison,
  PriceGapAnalysis
} from './competitive-pricing-analyzer';

// === GROWTH STRATEGY ENGINE EXPORTS ===
export type {
  GrowthStrategyAnalysis,
  GrowthProfile,
  GrowthOpportunity,
  GrowthStrategy,
  GrowthExperiment,
  ScalingPlan,
  GrowthStrategyRequest,
  BusinessStage,
  GrowthMetrics,
  GrowthConstraint,
  MarketPositioning,
  GrowthReadinessAssessment,
  GrowthOpportunityType,
  GrowthStrategyType,
  GrowthTactic,
  GrowthTimeline,
  GrowthBudget,
  GrowthResults,
  ResourceRequirements,
  GrowthRiskAssessment,
  GrowthProjection,
  ReadinessGap,
  ScalingMilestone,
  OperationalRequirement,
  TechnologyRequirement,
  TalentRequirement,
  FinancialRequirement,
  GrowthRiskFactor,
  RiskMitigation,
  ContingencyPlan
} from './growth-strategy-engine';

// === SHARED UTILITY FUNCTIONS ===

/**
 * Complete Monetization Analysis Pipeline
 * Executes all four analysis engines in the optimal sequence
 */
export async function runCompleteMonetizationAnalysis(
  businessData: any, // BusinessModelPhaseData
  competitorData?: any[], // CompetitorPricingData[]
  historicalData?: any[], // RevenueHistoryData[]
  clvData?: any, // CLVEstimation
  cacData?: any // CACAnalysis
) {
  const segment = businessData.customerSegments?.[0];
  const revenueStream = businessData.revenueStreams?.[0];

  if (!segment || !revenueStream) {
    throw new Error('Business data must include at least one customer segment and revenue stream');
  }

  // Step 1: Pricing Analysis
  const pricing = pricingModelAnalyzer.analyzePricingModels(
    segment, revenueStream, clvData, cacData, competitorData
  );

  // Step 2: Competitive Intelligence (if data available)
  let competitive;
  if (competitorData?.length > 0) {
    competitive = await competitivePricingAnalyzer.analyzeCompetitivePricing({
      ourCurrentPricing: [{
        planId: 'current',
        planName: segment.name + ' Plan',
        price: revenueStream.pricing?.amount || 0,
        billingPeriod: 'monthly' as const,
        currency: 'USD',
        features: [revenueStream.description || 'Core features'],
        tierPosition: 1
      }],
      competitors: competitorData,
      targetMarketSegment: segment.name,
      analysisType: 'optimization' as const,
      timeframe: '1-year' as const
    });
  }

  // Step 3: Revenue Optimization
  const revenue = revenueOptimizationEngine.analyzeRevenueOptimization(
    businessData, clvData, cacData, pricing, historicalData, competitive
  );

  // Step 4: Growth Strategy
  const growth = await growthStrategyEngine.analyzeGrowthStrategy({
    businessData,
    currentMetrics: {
      revenueGrowthRate: 0.3,
      customerGrowthRate: 0.25,
      marketShareGrowth: 0.02,
      productMarketFit: 0.7,
      customerSatisfactionScore: 0.8,
      netPromoterScore: 35,
      churnRate: 0.05,
      expansionRevenue: revenue.currentPerformance.totalRevenue * 0.15,
      timeToPayback: 18
    },
    timeframe: '1-year' as const,
    aggressiveness: 'moderate' as const
  });

  return {
    pricing,
    competitive,
    revenue,
    growth,
    summary: {
      analysisId: `complete-monetization-${Date.now()}`,
      timestamp: new Date(),
      enginesExecuted: competitive ? 4 : 3,
      totalRecommendations: [
        ...(pricing.recommendedModels || []),
        ...(revenue.prioritizedRecommendations || []),
        ...(growth.recommendedStrategies || [])
      ].length,
      totalInvestmentRequired: (
        (competitive?.pricingRecommendations[0]?.expectedImpact.revenueChange || 0) +
        (revenue.prioritizedRecommendations.reduce((sum, rec) => sum + (rec.investmentRequired || 0), 0)) +
        (growth.resourceRequirements?.totalInvestment || 0)
      ),
      estimatedROI: (
        (pricing.priceOptimization?.revenueMaximizingPrice || 0) +
        (revenue.expectedResults?.totalRevenueIncrease || 0) +
        (growth.resourceRequirements?.roi || 0)
      ) / 3
    }
  };
}

/**
 * Quick Revenue Optimization Analysis
 * Focused analysis for immediate revenue improvements
 */
export function runQuickRevenueOptimization(
  businessData: any,
  historicalData?: any[]
) {
  const optimization = revenueOptimizationEngine.analyzeRevenueOptimization(
    businessData, undefined, undefined, undefined, historicalData
  );

  // Extract actionable quick wins
  const quickWins = optimization.quickWins.filter(win => 
    win.effortRequired === 'low' && win.impactSize === 'high'
  );

  const immediateOpportunities = optimization.optimizationOpportunities.filter(opp =>
    opp.timeToRealize?.includes('month') && opp.probabilityOfSuccess > 0.7
  );

  return {
    quickWins,
    immediateOpportunities,
    totalPotentialRevenue: [...quickWins, ...immediateOpportunities]
      .reduce((sum, item) => sum + (item.potentialRevenue || 0), 0),
    implementationPriority: [...quickWins, ...immediateOpportunities]
      .sort((a, b) => (b.potentialRevenue || 0) - (a.potentialRevenue || 0))
      .slice(0, 5)
  };
}

/**
 * Competitive Intelligence Analysis
 * Focused competitive positioning and threat analysis
 */
export async function runCompetitiveIntelligence(
  currentPricing: any[], // PricingPlan[]
  competitors: any[], // CompetitorPricingData[]
  targetSegment: string = 'mid-market'
) {
  const analysis = await competitivePricingAnalyzer.analyzeCompetitivePricing({
    ourCurrentPricing: currentPricing,
    competitors,
    targetMarketSegment: targetSegment,
    analysisType: 'positioning' as const,
    timeframe: '1-year' as const
  });

  const report = await competitivePricingAnalyzer.generateCompetitorComparisonReport(analysis);

  return {
    position: analysis.competitivePosition.position,
    percentile: Math.round(analysis.competitivePosition.percentile * 100),
    opportunities: analysis.competitivePosition.marketOpportunities
      .sort((a, b) => b.potentialRevenue - a.potentialRevenue)
      .slice(0, 3),
    threats: analysis.competitivePosition.threatAssessment
      .filter(threat => threat.threatLevel === 'high' || threat.threatLevel === 'critical'),
    priceRecommendations: analysis.pricingRecommendations
      .filter(rec => Math.abs(rec.priceChangePercentage) > 5), // Significant changes only
    report,
    actionItems: analysis.actionPlan.immediate
  };
}

/**
 * Growth Strategy Planning
 * Comprehensive growth planning with scaling framework
 */
export async function runGrowthStrategyPlanning(
  businessData: any,
  currentMetrics?: any, // GrowthMetrics
  timeframe: '1-year' | '2-year' | '3-year' | '5-year' = '1-year',
  aggressiveness: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
) {
  const analysis = await growthStrategyEngine.analyzeGrowthStrategy({
    businessData,
    currentMetrics,
    timeframe,
    aggressiveness
  });

  const report = await growthStrategyEngine.generateGrowthStrategyReport(analysis);

  return {
    readinessScore: Math.round(analysis.currentGrowthProfile.growthReadiness.overallReadiness * 100),
    topOpportunities: analysis.growthOpportunities
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5),
    primaryStrategy: analysis.recommendedStrategies[0],
    keyExperiments: analysis.growthExperiments
      .filter(exp => exp.riskLevel === 'low')
      .slice(0, 3),
    scalingMilestones: analysis.scalingPlan.scalingMilestones,
    resourceNeeds: {
      totalInvestment: analysis.resourceRequirements.totalInvestment,
      keyHires: analysis.resourceRequirements.humanResources
        .filter(role => role.priority === 'high'),
      criticalTech: analysis.resourceRequirements.technologyResources
        .filter(tech => tech.priority === 'high')
    },
    riskLevel: analysis.riskAssessment.overallRiskLevel,
    report
  };
}

/**
 * Analysis Engine Health Check
 * Validates that all engines are properly configured and operational
 */
export function validateAnalysisEngines() {
  const engines = {
    pricing: !!pricingModelAnalyzer,
    competitive: !!competitivePricingAnalyzer,
    revenue: !!revenueOptimizationEngine,
    growth: !!growthStrategyEngine
  };

  const status = {
    allEnginesLoaded: Object.values(engines).every(Boolean),
    loadedEngines: Object.entries(engines)
      .filter(([_, loaded]) => loaded)
      .map(([name, _]) => name),
    missingEngines: Object.entries(engines)
      .filter(([_, loaded]) => !loaded)
      .map(([name, _]) => name)
  };

  return {
    healthy: status.allEnginesLoaded,
    ...status,
    version: '1.0.0',
    lastUpdated: '2025-09-05'
  };
}

// Default export for convenience
export default {
  // Engines
  pricingModelAnalyzer,
  competitivePricingAnalyzer,
  revenueOptimizationEngine,
  growthStrategyEngine,
  
  // Utility functions
  runCompleteMonetizationAnalysis,
  runQuickRevenueOptimization,
  runCompetitiveIntelligence,
  runGrowthStrategyPlanning,
  validateAnalysisEngines,
  
  // Health check
  isHealthy: () => validateAnalysisEngines().healthy
};