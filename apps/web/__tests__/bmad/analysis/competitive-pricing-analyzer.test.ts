import { describe, it, expect, beforeEach } from 'vitest';
import { 
  CompetitivePricingAnalyzer,
  type CompetitivePricingAnalysisRequest,
  type DetailedCompetitivePricingAnalysis 
} from '@/lib/bmad/analysis/competitive-pricing-analyzer';

describe('CompetitivePricingAnalyzer', () => {
  let analyzer: CompetitivePricingAnalyzer;
  let mockRequest: CompetitivePricingAnalysisRequest;

  beforeEach(() => {
    analyzer = new CompetitivePricingAnalyzer();
    
    mockRequest = {
      ourCurrentPricing: [{
        planId: 'our-basic',
        planName: 'Basic Plan',
        price: 99,
        billingPeriod: 'monthly',
        currency: 'USD',
        features: ['Feature A', 'Feature B', 'Feature C'],
        tierPosition: 1
      }],
      competitors: [{
        competitorId: 'comp-1',
        competitorName: 'Competitor A',
        pricingModel: 'subscription',
        basePlans: [{
          planId: 'comp-basic',
          planName: 'Basic',
          price: 79,
          billingPeriod: 'monthly',
          currency: 'USD',
          features: ['Feature A', 'Feature B'],
          tierPosition: 1
        }],
        featureComparison: [{
          feature: 'Feature C',
          ourOffering: 'Full implementation',
          competitorOffering: 'Not available',
          advantageScore: 0.8,
          importance: 0.9,
          category: 'core'
        }],
        marketPosition: 'mid-market',
        targetSegments: ['SMB', 'Enterprise'],
        pricingStrategy: 'Competitive pricing',
        lastUpdated: new Date(),
        sourceConfidence: 0.9,
        revenueModel: 'SaaS'
      }],
      targetMarketSegment: 'SMB',
      analysisType: 'positioning',
      timeframe: '1-year'
    };
  });

  describe('analyzeCompetitivePricing', () => {
    it('should complete competitive analysis successfully', async () => {
      const result = await analyzer.analyzeCompetitivePricing(mockRequest);

      expect(result).toHaveProperty('analysisId');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('competitivePosition');
      expect(result).toHaveProperty('pricingRecommendations');
      expect(result).toHaveProperty('marketInsights');
      expect(result).toHaveProperty('actionPlan');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should assess competitive position correctly', async () => {
      const result = await analyzer.analyzeCompetitivePricing(mockRequest);
      const position = result.competitivePosition;

      expect(['underpriced', 'competitive', 'premium', 'overpriced']).toContain(position.position);
      expect(position.percentile).toBeGreaterThanOrEqual(0);
      expect(position.percentile).toBeLessThanOrEqual(1);
      expect(position.priceGapAnalysis).toBeInstanceOf(Array);
      expect(position.marketOpportunities).toBeInstanceOf(Array);
      expect(position.threatAssessment).toBeInstanceOf(Array);
    });

    it('should identify pricing gaps accurately', async () => {
      const result = await analyzer.analyzeCompetitivePricing(mockRequest);
      const gaps = result.competitivePosition.priceGapAnalysis;

      gaps.forEach(gap => {
        expect(gap).toHaveProperty('segment');
        expect(gap).toHaveProperty('ourPrice');
        expect(gap).toHaveProperty('competitorAverage');
        expect(gap).toHaveProperty('gap');
        expect(gap).toHaveProperty('gapPercentage');
        expect(gap).toHaveProperty('recommendation');
        expect(gap.confidence).toBeGreaterThan(0);
      });
    });

    it('should provide market opportunities', async () => {
      const result = await analyzer.analyzeCompetitivePricing(mockRequest);
      const opportunities = result.competitivePosition.marketOpportunities;

      opportunities.forEach(opp => {
        expect(opp).toHaveProperty('opportunityType');
        expect(opp).toHaveProperty('description');
        expect(opp).toHaveProperty('potentialRevenue');
        expect(opp).toHaveProperty('timeToImplement');
        expect(opp).toHaveProperty('riskLevel');
        expect(opp.confidence).toBeGreaterThan(0);
        expect(opp.potentialRevenue).toBeGreaterThan(0);
      });
    });

    it('should generate pricing recommendations', async () => {
      const result = await analyzer.analyzeCompetitivePricing(mockRequest);
      const recommendations = result.pricingRecommendations;

      recommendations.forEach(rec => {
        expect(['raise-price', 'lower-price', 'restructure', 'maintain']).toContain(rec.recommendationType);
        expect(rec).toHaveProperty('currentPrice');
        expect(rec).toHaveProperty('recommendedPrice');
        expect(rec).toHaveProperty('rationale');
        expect(rec).toHaveProperty('expectedImpact');
        expect(rec).toHaveProperty('implementation');
        expect(rec.implementation).toHaveProperty('timeline');
        expect(rec.implementation).toHaveProperty('rolloutStrategy');
      });
    });

    it('should assess competitive threats', async () => {
      const result = await analyzer.analyzeCompetitivePricing(mockRequest);
      const threats = result.competitivePosition.threatAssessment;

      threats.forEach(threat => {
        expect(['price-war', 'feature-parity', 'new-entrant', 'disruption']).toContain(threat.threatType);
        expect(['low', 'medium', 'high', 'critical']).toContain(threat.threatLevel);
        expect(threat).toHaveProperty('description');
        expect(threat).toHaveProperty('affectedSegments');
        expect(threat).toHaveProperty('mitigationStrategies');
        expect(threat.mitigationStrategies).toBeInstanceOf(Array);
        expect(threat.mitigationStrategies.length).toBeGreaterThan(0);
      });
    });
  });

  describe('market insights', () => {
    it('should provide comprehensive market insights', async () => {
      const result = await analyzer.analyzeCompetitivePricing(mockRequest);
      const insights = result.marketInsights;

      expect(insights).toHaveProperty('averagePrice');
      expect(insights).toHaveProperty('priceRange');
      expect(insights).toHaveProperty('commonPricingModels');
      expect(insights).toHaveProperty('pricingTrends');
      expect(insights).toHaveProperty('disruptiveForces');
      
      expect(insights.averagePrice).toBeGreaterThan(0);
      expect(insights.priceRange.min).toBeGreaterThan(0);
      expect(insights.priceRange.max).toBeGreaterThan(insights.priceRange.min);
      expect(insights.commonPricingModels).toBeInstanceOf(Array);
      expect(insights.pricingTrends).toBeInstanceOf(Array);
    });
  });

  describe('action plan', () => {
    it('should provide actionable implementation plan', async () => {
      const result = await analyzer.analyzeCompetitivePricing(mockRequest);
      const actionPlan = result.actionPlan;

      expect(actionPlan).toHaveProperty('immediate');
      expect(actionPlan).toHaveProperty('shortTerm');
      expect(actionPlan).toHaveProperty('longTerm');
      expect(actionPlan).toHaveProperty('monitoring');

      expect(actionPlan.immediate).toBeInstanceOf(Array);
      expect(actionPlan.shortTerm).toBeInstanceOf(Array);
      expect(actionPlan.longTerm).toBeInstanceOf(Array);
      expect(actionPlan.monitoring).toBeInstanceOf(Array);

      // Each array should have actionable items
      expect(actionPlan.immediate.length).toBeGreaterThan(0);
      expect(actionPlan.shortTerm.length).toBeGreaterThan(0);
      expect(actionPlan.longTerm.length).toBeGreaterThan(0);
      expect(actionPlan.monitoring.length).toBeGreaterThan(0);
    });
  });

  describe('different analysis types', () => {
    it('should handle positioning analysis', async () => {
      const positioningRequest = { ...mockRequest, analysisType: 'positioning' as const };
      const result = await analyzer.analyzeCompetitivePricing(positioningRequest);
      
      expect(result.competitivePosition.position).toBeDefined();
      expect(result.competitivePosition.percentile).toBeDefined();
    });

    it('should handle gap analysis', async () => {
      const gapRequest = { ...mockRequest, analysisType: 'gap-analysis' as const };
      const result = await analyzer.analyzeCompetitivePricing(gapRequest);
      
      expect(result.competitivePosition.priceGapAnalysis.length).toBeGreaterThan(0);
    });

    it('should handle optimization analysis', async () => {
      const optimizationRequest = { ...mockRequest, analysisType: 'optimization' as const };
      const result = await analyzer.analyzeCompetitivePricing(optimizationRequest);
      
      expect(result.pricingRecommendations.length).toBeGreaterThan(0);
    });

    it('should handle strategy review', async () => {
      const strategyRequest = { ...mockRequest, analysisType: 'strategy-review' as const };
      const result = await analyzer.analyzeCompetitivePricing(strategyRequest);
      
      expect(result.actionPlan).toBeDefined();
      expect(result.competitivePosition.threatAssessment).toBeDefined();
    });
  });

  describe('generateCompetitorComparisonReport', () => {
    it('should generate comprehensive comparison report', async () => {
      const analysis = await analyzer.analyzeCompetitivePricing(mockRequest);
      const report = await analyzer.generateCompetitorComparisonReport(analysis);

      expect(typeof report).toBe('string');
      expect(report).toContain('Competitive Pricing Analysis Report');
      expect(report).toContain('Executive Summary');
      expect(report).toContain('Market Overview');
      expect(report).toContain('Competitive Position Analysis');
      expect(report).toContain('Pricing Recommendations');
      expect(report).toContain('Action Plan');
    });

    it('should include key metrics in report', async () => {
      const analysis = await analyzer.analyzeCompetitivePricing(mockRequest);
      const report = await analyzer.generateCompetitorComparisonReport(analysis);

      expect(report).toContain(analysis.competitivePosition.position.toUpperCase());
      expect(report).toContain(`${Math.round(analysis.competitivePosition.percentile * 100)}th percentile`);
      expect(report).toContain(`${Math.round(analysis.confidence * 100)}%`);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty competitor data', async () => {
      const emptyRequest = { ...mockRequest, competitors: [] };
      
      await expect(analyzer.analyzeCompetitivePricing(emptyRequest)).rejects.toThrow();
    });

    it('should handle invalid pricing data', async () => {
      const invalidRequest = {
        ...mockRequest,
        ourCurrentPricing: [{
          ...mockRequest.ourCurrentPricing[0],
          price: -1 // Invalid price
        }]
      };

      // Should handle gracefully or provide meaningful error
      await expect(async () => {
        await analyzer.analyzeCompetitivePricing(invalidRequest);
      }).not.toThrow();
    });

    it('should handle missing feature comparison data', async () => {
      const noFeatureRequest = {
        ...mockRequest,
        competitors: [{
          ...mockRequest.competitors[0],
          featureComparison: []
        }]
      };

      const result = await analyzer.analyzeCompetitivePricing(noFeatureRequest);
      expect(result).toBeDefined();
    });

    it('should validate request schema', async () => {
      const invalidRequest = {
        ourCurrentPricing: [],
        competitors: mockRequest.competitors,
        targetMarketSegment: '',
        analysisType: 'invalid-type' as any,
        timeframe: '1-year'
      };

      await expect(analyzer.analyzeCompetitivePricing(invalidRequest))
        .rejects.toThrow();
    });
  });

  describe('confidence scoring', () => {
    it('should calculate confidence based on data quality', async () => {
      // High confidence scenario
      const highConfidenceRequest = {
        ...mockRequest,
        competitors: Array(5).fill(null).map((_, i) => ({
          ...mockRequest.competitors[0],
          competitorId: `comp-${i}`,
          competitorName: `Competitor ${i}`,
          lastUpdated: new Date(),
          sourceConfidence: 0.9
        }))
      };

      const result = await analyzer.analyzeCompetitivePricing(highConfidenceRequest);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should lower confidence for outdated data', async () => {
      const outdatedRequest = {
        ...mockRequest,
        competitors: [{
          ...mockRequest.competitors[0],
          lastUpdated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days old
          sourceConfidence: 0.5
        }]
      };

      const result = await analyzer.analyzeCompetitivePricing(outdatedRequest);
      expect(result.confidence).toBeLessThan(0.8);
    });
  });

  describe('timeframe considerations', () => {
    it('should adjust recommendations based on timeframe', async () => {
      const shortTermRequest = { ...mockRequest, timeframe: '3-months' as const };
      const longTermRequest = { ...mockRequest, timeframe: '2-years' as const };

      const [shortResult, longResult] = await Promise.all([
        analyzer.analyzeCompetitivePricing(shortTermRequest),
        analyzer.analyzeCompetitivePricing(longTermRequest)
      ]);

      // Short-term should have more immediate actions
      expect(shortResult.actionPlan.immediate.length).toBeGreaterThanOrEqual(
        longResult.actionPlan.immediate.length
      );
    });
  });
});