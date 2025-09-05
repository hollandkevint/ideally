import { z } from 'zod';

export interface CompetitorPricingData {
  competitorId: string;
  competitorName: string;
  pricingModel: string;
  basePlans: PricingPlan[];
  featureComparison: FeatureComparison[];
  marketPosition: 'budget' | 'mid-market' | 'premium' | 'luxury';
  targetSegments: string[];
  pricingStrategy: string;
  lastUpdated: Date;
  sourceConfidence: number; // 0-1
  marketShare?: number;
  revenueModel: string;
}

export interface PricingPlan {
  planId: string;
  planName: string;
  price: number;
  billingPeriod: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  currency: string;
  features: string[];
  userLimits?: number;
  usageLimits?: Record<string, number>;
  tierPosition: number;
  popularityRank?: number;
  conversionRate?: number;
}

export interface FeatureComparison {
  feature: string;
  ourOffering: string;
  competitorOffering: string;
  advantageScore: number; // -1 to 1, negative means competitor advantage
  importance: number; // 0-1
  category: string;
}

export interface CompetitivePricingAnalysisRequest {
  ourCurrentPricing: PricingPlan[];
  competitors: CompetitorPricingData[];
  targetMarketSegment: string;
  priceElasticity?: number;
  customerWillingness?: {
    tooExpensive: number;
    tooGreat: number;
    expensive: number;
    bargain: number;
  };
  analysisType: 'positioning' | 'gap-analysis' | 'optimization' | 'strategy-review';
  timeframe: '3-months' | '6-months' | '1-year' | '2-years';
}

export interface CompetitivePricingPosition {
  position: 'underpriced' | 'competitive' | 'premium' | 'overpriced';
  percentile: number;
  priceGapAnalysis: PriceGapAnalysis[];
  marketOpportunities: MarketOpportunity[];
  threatAssessment: CompetitiveThreat[];
}

export interface PriceGapAnalysis {
  segment: string;
  ourPrice: number;
  competitorAverage: number;
  competitorRange: { min: number; max: number };
  gap: number;
  gapPercentage: number;
  recommendation: string;
  confidence: number;
}

export interface MarketOpportunity {
  opportunityType: 'price-gap' | 'feature-gap' | 'segment-gap' | 'model-gap';
  description: string;
  potentialRevenue: number;
  effort: 'low' | 'medium' | 'high';
  timeToImplement: string;
  riskLevel: 'low' | 'medium' | 'high';
  competitiveResponse: string;
  confidence: number;
}

export interface CompetitiveThreat {
  threatType: 'price-war' | 'feature-parity' | 'new-entrant' | 'disruption';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedSegments: string[];
  timeframe: string;
  mitigationStrategies: string[];
  monitoringMetrics: string[];
}

export interface PricingRecommendation {
  recommendationType: 'raise-price' | 'lower-price' | 'restructure' | 'maintain';
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercentage: number;
  rationale: string;
  expectedImpact: {
    revenueChange: number;
    customerChange: number;
    marketShareChange: number;
  };
  implementation: {
    timeline: string;
    rolloutStrategy: string;
    communicationPlan: string;
    fallbackPlan: string;
  };
  risks: string[];
  success_metrics: string[];
}

export interface DetailedCompetitivePricingAnalysis {
  analysisId: string;
  timestamp: Date;
  request: CompetitivePricingAnalysisRequest;
  competitivePosition: CompetitivePricingPosition;
  pricingRecommendations: PricingRecommendation[];
  marketInsights: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    commonPricingModels: string[];
    pricingTrends: string[];
    disruptiveForces: string[];
  };
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    monitoring: string[];
  };
  confidence: number;
  limitations: string[];
  nextAnalysisDate: Date;
}

const CompetitorPricingDataSchema = z.object({
  competitorId: z.string(),
  competitorName: z.string(),
  pricingModel: z.string(),
  basePlans: z.array(z.object({
    planId: z.string(),
    planName: z.string(),
    price: z.number(),
    billingPeriod: z.enum(['monthly', 'quarterly', 'annual', 'one-time']),
    currency: z.string(),
    features: z.array(z.string()),
    userLimits: z.number().optional(),
    usageLimits: z.record(z.number()).optional(),
    tierPosition: z.number(),
    popularityRank: z.number().optional(),
    conversionRate: z.number().optional(),
  })),
  featureComparison: z.array(z.object({
    feature: z.string(),
    ourOffering: z.string(),
    competitorOffering: z.string(),
    advantageScore: z.number(),
    importance: z.number(),
    category: z.string(),
  })),
  marketPosition: z.enum(['budget', 'mid-market', 'premium', 'luxury']),
  targetSegments: z.array(z.string()),
  pricingStrategy: z.string(),
  lastUpdated: z.date(),
  sourceConfidence: z.number(),
  marketShare: z.number().optional(),
  revenueModel: z.string(),
});

const CompetitivePricingAnalysisRequestSchema = z.object({
  ourCurrentPricing: z.array(z.object({
    planId: z.string(),
    planName: z.string(),
    price: z.number(),
    billingPeriod: z.enum(['monthly', 'quarterly', 'annual', 'one-time']),
    currency: z.string(),
    features: z.array(z.string()),
    userLimits: z.number().optional(),
    usageLimits: z.record(z.number()).optional(),
    tierPosition: z.number(),
    popularityRank: z.number().optional(),
    conversionRate: z.number().optional(),
  })),
  competitors: z.array(CompetitorPricingDataSchema),
  targetMarketSegment: z.string(),
  priceElasticity: z.number().optional(),
  customerWillingness: z.object({
    tooExpensive: z.number(),
    tooGreat: z.number(),
    expensive: z.number(),
    bargain: z.number(),
  }).optional(),
  analysisType: z.enum(['positioning', 'gap-analysis', 'optimization', 'strategy-review']),
  timeframe: z.enum(['3-months', '6-months', '1-year', '2-years']),
});

export class CompetitivePricingAnalyzer {
  private generateAnalysisPrompt(request: CompetitivePricingAnalysisRequest): string {
    return `# Competitive Pricing Analysis

## Context
Business Model: Revenue analysis for pricing optimization
Target Market: ${request.targetMarketSegment}
Analysis Type: ${request.analysisType}
Planning Timeframe: ${request.timeframe}

## Our Current Pricing
${request.ourCurrentPricing.map(plan => `
**${plan.planName}**
- Price: ${plan.currency} ${plan.price}/${plan.billingPeriod}
- Tier Position: ${plan.tierPosition}
- Features: ${plan.features.join(', ')}
${plan.userLimits ? `- User Limits: ${plan.userLimits}` : ''}
${plan.conversionRate ? `- Conversion Rate: ${(plan.conversionRate * 100).toFixed(1)}%` : ''}
`).join('\n')}

## Competitive Landscape
${request.competitors.map(comp => `
**${comp.competitorName}** (${comp.marketPosition})
- Pricing Model: ${comp.pricingModel}
- Market Share: ${comp.marketShare ? `${(comp.marketShare * 100).toFixed(1)}%` : 'Unknown'}
- Target Segments: ${comp.targetSegments.join(', ')}
- Strategy: ${comp.pricingStrategy}

**Plans:**
${comp.basePlans.map(plan => `
  • ${plan.planName}: ${plan.currency} ${plan.price}/${plan.billingPeriod}
    Features: ${plan.features.slice(0, 3).join(', ')}${plan.features.length > 3 ? '...' : ''}
`).join('')}

**Feature Comparison:**
${comp.featureComparison.filter(f => Math.abs(f.advantageScore) > 0.3).map(f => `
  • ${f.feature}: ${f.advantageScore > 0 ? 'Our advantage' : 'Their advantage'} (${f.advantageScore.toFixed(2)})
`).join('')}
`).join('\n')}

${request.priceElasticity ? `
## Price Sensitivity
Price Elasticity: ${request.priceElasticity}
` : ''}

${request.customerWillingness ? `
## Customer Price Perception (Van Westendorp)
- Too Expensive: ${request.customerWillingness.tooExpensive}
- Expensive (but acceptable): ${request.customerWillingness.expensive}
- Bargain: ${request.customerWillingness.bargain}
- Too Great (suspicious): ${request.customerWillingness.tooGreat}
` : ''}

## Analysis Requirements

Please analyze our competitive positioning and provide:

1. **Market Position Assessment**
   - Where do we sit in the competitive landscape?
   - Are we underpriced, competitively priced, or overpriced?
   - What percentile do we occupy?

2. **Price Gap Analysis**
   - Detailed comparison vs. competitors by tier/segment
   - Identify pricing gaps and opportunities
   - Calculate average competitor pricing and ranges

3. **Market Opportunities**
   - Pricing gaps we could exploit
   - Underserved segments
   - Feature/price mismatches
   - New pricing model opportunities

4. **Threat Assessment**
   - Competitive threats to our pricing
   - Risk of price wars
   - New entrant threats
   - Disruption risks

5. **Strategic Recommendations**
   - Should we raise, lower, or maintain prices?
   - Specific price recommendations with rationale
   - Implementation timeline and strategy
   - Risk mitigation approaches

6. **Action Plan**
   - Immediate actions (next 30 days)
   - Short-term initiatives (3-6 months)
   - Long-term strategic moves (6+ months)
   - Monitoring and measurement plan

Focus on ${request.analysisType} analysis with actionable insights for the ${request.timeframe} timeframe.`;
  }

  async analyzeCompetitivePricing(
    request: CompetitivePricingAnalysisRequest
  ): Promise<DetailedCompetitivePricingAnalysis> {
    try {
      CompetitivePricingAnalysisRequestSchema.parse(request);

      const competitivePosition = this.assessCompetitivePosition(request);
      const pricingRecommendations = this.generatePricingRecommendations(request, competitivePosition);
      const marketInsights = this.generateMarketInsights(request);
      const actionPlan = this.createActionPlan(request, pricingRecommendations);

      const analysis: DetailedCompetitivePricingAnalysis = {
        analysisId: `competitive-pricing-${Date.now()}`,
        timestamp: new Date(),
        request,
        competitivePosition,
        pricingRecommendations,
        marketInsights,
        actionPlan,
        confidence: this.calculateConfidence(request),
        limitations: this.identifyLimitations(request),
        nextAnalysisDate: this.getNextAnalysisDate(request.timeframe),
      };

      return analysis;
    } catch (error) {
      throw new Error(`Competitive pricing analysis failed: ${error.message}`);
    }
  }

  private assessCompetitivePosition(request: CompetitivePricingAnalysisRequest): CompetitivePricingPosition {
    const competitorPrices = request.competitors.flatMap(c => c.basePlans.map(p => p.price));
    const ourPrices = request.ourCurrentPricing.map(p => p.price);
    
    const avgOurPrice = ourPrices.reduce((a, b) => a + b, 0) / ourPrices.length;
    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    
    const sortedPrices = [...competitorPrices, ...ourPrices].sort((a, b) => a - b);
    const ourPercentile = sortedPrices.findIndex(p => p >= avgOurPrice) / sortedPrices.length;
    
    let position: 'underpriced' | 'competitive' | 'premium' | 'overpriced';
    if (ourPercentile < 0.25) position = 'underpriced';
    else if (ourPercentile < 0.75) position = 'competitive';
    else if (ourPercentile < 0.9) position = 'premium';
    else position = 'overpriced';

    const priceGapAnalysis = this.analyzePriceGaps(request);
    const marketOpportunities = this.identifyMarketOpportunities(request);
    const threatAssessment = this.assessCompetitiveThreats(request);

    return {
      position,
      percentile: ourPercentile,
      priceGapAnalysis,
      marketOpportunities,
      threatAssessment,
    };
  }

  private analyzePriceGaps(request: CompetitivePricingAnalysisRequest): PriceGapAnalysis[] {
    const gaps: PriceGapAnalysis[] = [];
    
    const segments = [...new Set(request.competitors.flatMap(c => c.targetSegments))];
    
    for (const segment of segments) {
      const competitorsInSegment = request.competitors.filter(c => 
        c.targetSegments.includes(segment)
      );
      
      if (competitorsInSegment.length === 0) continue;
      
      const competitorPrices = competitorsInSegment.flatMap(c => c.basePlans.map(p => p.price));
      const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
      const minPrice = Math.min(...competitorPrices);
      const maxPrice = Math.max(...competitorPrices);
      
      const ourRelevantPlans = request.ourCurrentPricing.filter((_, idx) => idx === 0); // Simplified
      const avgOurPrice = ourRelevantPlans.reduce((a, p) => a + p.price, 0) / ourRelevantPlans.length;
      
      const gap = avgOurPrice - avgCompetitorPrice;
      const gapPercentage = (gap / avgCompetitorPrice) * 100;
      
      let recommendation = '';
      if (gapPercentage > 20) recommendation = 'Consider price reduction or value justification';
      else if (gapPercentage < -20) recommendation = 'Opportunity to increase prices';
      else recommendation = 'Pricing is competitive';
      
      gaps.push({
        segment,
        ourPrice: avgOurPrice,
        competitorAverage: avgCompetitorPrice,
        competitorRange: { min: minPrice, max: maxPrice },
        gap,
        gapPercentage,
        recommendation,
        confidence: 0.8,
      });
    }
    
    return gaps;
  }

  private identifyMarketOpportunities(request: CompetitivePricingAnalysisRequest): MarketOpportunity[] {
    const opportunities: MarketOpportunity[] = [];
    
    // Price gap opportunities
    const competitorPrices = request.competitors.flatMap(c => c.basePlans.map(p => p.price));
    const ourPrices = request.ourCurrentPricing.map(p => p.price);
    const minCompPrice = Math.min(...competitorPrices);
    const maxCompPrice = Math.max(...competitorPrices);
    const minOurPrice = Math.min(...ourPrices);
    const maxOurPrice = Math.max(...ourPrices);
    
    if (minOurPrice > maxCompPrice * 1.2) {
      opportunities.push({
        opportunityType: 'price-gap',
        description: 'Create entry-level tier to compete with budget alternatives',
        potentialRevenue: minOurPrice * 0.7 * 100, // Estimate
        effort: 'medium',
        timeToImplement: '3-6 months',
        riskLevel: 'medium',
        competitiveResponse: 'Competitors may further reduce prices',
        confidence: 0.7,
      });
    }
    
    if (maxOurPrice < minCompPrice * 0.8) {
      opportunities.push({
        opportunityType: 'price-gap',
        description: 'Premium tier opportunity exists above current market',
        potentialRevenue: maxOurPrice * 1.5 * 50, // Estimate
        effort: 'high',
        timeToImplement: '6-12 months',
        riskLevel: 'low',
        competitiveResponse: 'Limited immediate response expected',
        confidence: 0.8,
      });
    }
    
    // Feature gap opportunities
    const allCompetitorFeatures = request.competitors.flatMap(c => 
      c.featureComparison.filter(f => f.advantageScore < -0.5).map(f => f.feature)
    );
    
    const missingFeatures = [...new Set(allCompetitorFeatures)];
    if (missingFeatures.length > 0) {
      opportunities.push({
        opportunityType: 'feature-gap',
        description: `Add missing features: ${missingFeatures.slice(0, 3).join(', ')}`,
        potentialRevenue: 50000, // Estimate
        effort: 'high',
        timeToImplement: '9-18 months',
        riskLevel: 'medium',
        competitiveResponse: 'Feature parity race likely',
        confidence: 0.6,
      });
    }
    
    return opportunities;
  }

  private assessCompetitiveThreats(request: CompetitivePricingAnalysisRequest): CompetitiveThreat[] {
    const threats: CompetitiveThreat[] = [];
    
    // Price war threat
    const budgetCompetitors = request.competitors.filter(c => c.marketPosition === 'budget');
    if (budgetCompetitors.length >= 2) {
      threats.push({
        threatType: 'price-war',
        threatLevel: 'medium',
        description: 'Multiple budget competitors could trigger race to bottom',
        affectedSegments: ['price-sensitive', 'small-business'],
        timeframe: '6-12 months',
        mitigationStrategies: [
          'Focus on value differentiation',
          'Create budget tier with limited features',
          'Lock in customers with annual contracts'
        ],
        monitoringMetrics: ['Competitor pricing changes', 'Market share shifts', 'Customer churn rate'],
      });
    }
    
    // New entrant threat
    const avgMarketPrice = request.competitors.flatMap(c => c.basePlans.map(p => p.price))
      .reduce((a, b) => a + b, 0) / request.competitors.flatMap(c => c.basePlans).length;
    
    const ourAvgPrice = request.ourCurrentPricing.reduce((a, p) => a + p.price, 0) / request.ourCurrentPricing.length;
    
    if (ourAvgPrice > avgMarketPrice * 1.3) {
      threats.push({
        threatType: 'new-entrant',
        threatLevel: 'high',
        description: 'High margins attract new competitors with disruptive pricing',
        affectedSegments: ['all'],
        timeframe: '12-24 months',
        mitigationStrategies: [
          'Build customer loyalty programs',
          'Invest in product innovation',
          'Create switching costs'
        ],
        monitoringMetrics: ['New competitor announcements', 'VC funding in space', 'Customer acquisition trends'],
      });
    }
    
    return threats;
  }

  private generatePricingRecommendations(
    request: CompetitivePricingAnalysisRequest,
    position: CompetitivePricingPosition
  ): PricingRecommendation[] {
    const recommendations: PricingRecommendation[] = [];
    
    for (const plan of request.ourCurrentPricing) {
      const competitorPrices = request.competitors.flatMap(c => 
        c.basePlans.filter(p => p.tierPosition === plan.tierPosition).map(p => p.price)
      );
      
      const avgCompPrice = competitorPrices.length > 0 
        ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length 
        : plan.price;
      
      let recommendationType: 'raise-price' | 'lower-price' | 'restructure' | 'maintain';
      let recommendedPrice = plan.price;
      let rationale = '';
      
      const priceDiff = (plan.price - avgCompPrice) / avgCompPrice;
      
      if (priceDiff > 0.3) {
        recommendationType = 'lower-price';
        recommendedPrice = avgCompPrice * 1.1;
        rationale = 'Significantly overpriced compared to competitors, reducing conversion';
      } else if (priceDiff < -0.3) {
        recommendationType = 'raise-price';
        recommendedPrice = avgCompPrice * 0.9;
        rationale = 'Underpriced vs competitors, leaving money on table';
      } else {
        recommendationType = 'maintain';
        rationale = 'Competitively positioned, maintain current pricing';
      }
      
      recommendations.push({
        recommendationType,
        currentPrice: plan.price,
        recommendedPrice,
        priceChange: recommendedPrice - plan.price,
        priceChangePercentage: ((recommendedPrice - plan.price) / plan.price) * 100,
        rationale,
        expectedImpact: {
          revenueChange: (recommendedPrice - plan.price) * (plan.conversionRate || 0.1) * 1000,
          customerChange: recommendationType === 'lower-price' ? 20 : -10,
          marketShareChange: recommendationType === 'lower-price' ? 5 : -2,
        },
        implementation: {
          timeline: '6-8 weeks',
          rolloutStrategy: 'Gradual rollout with A/B testing',
          communicationPlan: 'Emphasize value improvements and market positioning',
          fallbackPlan: 'Revert to current pricing if metrics decline >15%',
        },
        risks: [
          recommendationType === 'raise-price' ? 'Customer churn increase' : 'Margin compression',
          'Competitive response',
          'Customer perception issues'
        ],
        success_metrics: ['Revenue per customer', 'Conversion rate', 'Customer lifetime value'],
      });
    }
    
    return recommendations;
  }

  private generateMarketInsights(request: CompetitivePricingAnalysisRequest) {
    const allPrices = request.competitors.flatMap(c => c.basePlans.map(p => p.price));
    const pricingModels = [...new Set(request.competitors.map(c => c.pricingModel))];
    const strategies = [...new Set(request.competitors.map(c => c.pricingStrategy))];
    
    return {
      averagePrice: allPrices.reduce((a, b) => a + b, 0) / allPrices.length,
      priceRange: { min: Math.min(...allPrices), max: Math.max(...allPrices) },
      commonPricingModels: pricingModels,
      pricingTrends: [
        'Move toward annual billing incentives',
        'Increased freemium adoption',
        'Usage-based components growing'
      ],
      disruptiveForces: [
        'AI-powered automation reducing costs',
        'Open source alternatives',
        'Consolidation pressure'
      ],
    };
  }

  private createActionPlan(
    request: CompetitivePricingAnalysisRequest,
    recommendations: PricingRecommendation[]
  ) {
    return {
      immediate: [
        'Set up competitive pricing monitoring dashboard',
        'Analyze current customer price sensitivity',
        'Review competitor feature parity gaps'
      ],
      shortTerm: [
        'Implement recommended pricing changes',
        'A/B test new pricing structures',
        'Enhance value proposition messaging'
      ],
      longTerm: [
        'Develop dynamic pricing capabilities',
        'Build customer segmentation-based pricing',
        'Expand into identified market opportunities'
      ],
      monitoring: [
        'Weekly competitor pricing checks',
        'Monthly conversion rate analysis',
        'Quarterly market position assessment'
      ],
    };
  }

  private calculateConfidence(request: CompetitivePricingAnalysisRequest): number {
    let confidence = 0.5;
    
    // Data quality factors
    const dataRecency = request.competitors.every(c => 
      (Date.now() - c.lastUpdated.getTime()) < 30 * 24 * 60 * 60 * 1000
    ) ? 0.2 : 0.1;
    
    const sourceReliability = request.competitors.reduce((sum, c) => sum + c.sourceConfidence, 0) 
      / request.competitors.length * 0.2;
    
    const sampleSize = request.competitors.length >= 5 ? 0.2 : request.competitors.length * 0.04;
    
    const customerDataAvailability = request.customerWillingness ? 0.1 : 0.05;
    
    return Math.min(1.0, confidence + dataRecency + sourceReliability + sampleSize + customerDataAvailability);
  }

  private identifyLimitations(request: CompetitivePricingAnalysisRequest): string[] {
    const limitations = [];
    
    if (request.competitors.length < 3) {
      limitations.push('Limited competitive sample size may reduce analysis accuracy');
    }
    
    if (!request.priceElasticity) {
      limitations.push('Missing price elasticity data limits optimization precision');
    }
    
    if (!request.customerWillingness) {
      limitations.push('No customer price perception data available');
    }
    
    const oldData = request.competitors.filter(c => 
      (Date.now() - c.lastUpdated.getTime()) > 60 * 24 * 60 * 60 * 1000
    );
    if (oldData.length > 0) {
      limitations.push('Some competitor data is outdated (>60 days)');
    }
    
    return limitations;
  }

  private getNextAnalysisDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '3-months': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Monthly
      case '6-months': return new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // 6 weeks
      case '1-year': return new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 2 months
      case '2-years': return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // Quarterly
      default: return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  async generateCompetitorComparisonReport(
    analysis: DetailedCompetitivePricingAnalysis
  ): Promise<string> {
    return `# Competitive Pricing Analysis Report

## Executive Summary
**Market Position**: ${analysis.competitivePosition.position.toUpperCase()} (${Math.round(analysis.competitivePosition.percentile * 100)}th percentile)
**Analysis Confidence**: ${Math.round(analysis.confidence * 100)}%
**Key Recommendation**: ${analysis.pricingRecommendations[0]?.recommendationType.replace('-', ' ').toUpperCase() || 'MAINTAIN CURRENT PRICING'}

## Market Overview
- **Average Market Price**: $${analysis.marketInsights.averagePrice.toLocaleString()}
- **Price Range**: $${analysis.marketInsights.priceRange.min.toLocaleString()} - $${analysis.marketInsights.priceRange.max.toLocaleString()}
- **Common Models**: ${analysis.marketInsights.commonPricingModels.join(', ')}

## Competitive Position Analysis
${analysis.competitivePosition.priceGapAnalysis.map(gap => `
### ${gap.segment} Segment
- **Our Price**: $${gap.ourPrice.toLocaleString()}
- **Competitor Average**: $${gap.competitorAverage.toLocaleString()}
- **Gap**: ${gap.gapPercentage > 0 ? '+' : ''}${gap.gapPercentage.toFixed(1)}%
- **Recommendation**: ${gap.recommendation}
`).join('')}

## Market Opportunities
${analysis.competitivePosition.marketOpportunities.map(opp => `
### ${opp.opportunityType.replace('-', ' ').toUpperCase()}
**Description**: ${opp.description}
**Potential Revenue**: $${opp.potentialRevenue.toLocaleString()}
**Effort**: ${opp.effort} | **Risk**: ${opp.riskLevel} | **Timeline**: ${opp.timeToImplement}
`).join('')}

## Pricing Recommendations
${analysis.pricingRecommendations.map(rec => `
### ${rec.recommendationType.replace('-', ' ').toUpperCase()}
**Current**: $${rec.currentPrice} → **Recommended**: $${rec.recommendedPrice}
**Change**: ${rec.priceChangePercentage > 0 ? '+' : ''}${rec.priceChangePercentage.toFixed(1)}%
**Rationale**: ${rec.rationale}
**Expected Impact**: ${rec.expectedImpact.revenueChange > 0 ? '+' : ''}$${rec.expectedImpact.revenueChange.toLocaleString()} revenue
`).join('')}

## Threat Assessment
${analysis.competitivePosition.threatAssessment.map(threat => `
### ${threat.threatType.toUpperCase()} - ${threat.threatLevel.toUpperCase()} RISK
${threat.description}
**Mitigation**: ${threat.mitigationStrategies.slice(0, 2).join('; ')}
`).join('')}

## Action Plan

### Immediate (Next 30 Days)
${analysis.actionPlan.immediate.map(action => `- ${action}`).join('\n')}

### Short-term (3-6 Months)
${analysis.actionPlan.shortTerm.map(action => `- ${action}`).join('\n')}

### Long-term (6+ Months)
${analysis.actionPlan.longTerm.map(action => `- ${action}`).join('\n')}

## Monitoring Plan
${analysis.actionPlan.monitoring.map(metric => `- ${metric}`).join('\n')}

---
*Analysis generated on ${analysis.timestamp.toLocaleDateString()}*
*Next review scheduled: ${analysis.nextAnalysisDate.toLocaleDateString()}*
*Confidence Level: ${Math.round(analysis.confidence * 100)}%*
`;
  }
}

export const competitivePricingAnalyzer = new CompetitivePricingAnalyzer();