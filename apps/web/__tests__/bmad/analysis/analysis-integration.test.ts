import { describe, it, expect, beforeEach } from 'vitest';
import { 
  runCompleteMonetizationAnalysis,
  runQuickRevenueOptimization,
  runCompetitiveIntelligence,
  runGrowthStrategyPlanning,
  validateAnalysisEngines
} from '@/lib/bmad/analysis';

describe('Analysis Engine Integration', () => {
  let mockBusinessData: any;
  let mockCompetitorData: any[];

  beforeEach(() => {
    mockBusinessData = {
      sessionType: 'Business Model Analysis',
      customerSegments: [{
        id: 'segment-1',
        name: 'Small Business',
        painPoints: ['High costs', 'Complex processes'],
        jobsToBeDone: ['Reduce overhead', 'Improve efficiency'],
        size: 10000
      }],
      revenueStreams: [{
        id: 'revenue-1',
        name: 'SaaS Subscription',
        description: 'Monthly software subscription',
        pricing: {
          amount: 99,
          currency: 'USD',
          frequency: 'monthly'
        },
        targetSegments: ['segment-1']
      }]
    };

    mockCompetitorData = [{
      competitorId: 'comp-1',
      competitorName: 'Competitor A',
      pricingModel: 'subscription',
      basePlans: [{
        planId: 'basic',
        planName: 'Basic Plan',
        price: 79,
        billingPeriod: 'monthly' as const,
        currency: 'USD',
        features: ['Feature A', 'Feature B'],
        tierPosition: 1
      }],
      featureComparison: [{
        feature: 'Advanced Analytics',
        ourOffering: 'Full suite',
        competitorOffering: 'Basic only',
        advantageScore: 0.5,
        importance: 0.8,
        category: 'analytics'
      }],
      marketPosition: 'mid-market' as const,
      targetSegments: ['Small Business'],
      pricingStrategy: 'Value-based pricing',
      lastUpdated: new Date(),
      sourceConfidence: 0.9,
      revenueModel: 'SaaS'
    }];
  });

  describe('runCompleteMonetizationAnalysis', () => {
    it('should execute full analysis pipeline successfully', async () => {
      const result = await runCompleteMonetizationAnalysis(
        mockBusinessData,
        mockCompetitorData
      );

      expect(result).toHaveProperty('pricing');
      expect(result).toHaveProperty('competitive');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('growth');
      expect(result).toHaveProperty('summary');

      // Validate summary metrics
      expect(result.summary.analysisId).toContain('complete-monetization-');
      expect(result.summary.enginesExecuted).toBe(4);
      expect(result.summary.totalRecommendations).toBeGreaterThan(0);
      expect(result.summary.totalInvestmentRequired).toBeGreaterThan(0);
    });

    it('should handle missing competitor data gracefully', async () => {
      const result = await runCompleteMonetizationAnalysis(
        mockBusinessData
      );

      expect(result.pricing).toBeDefined();
      expect(result.competitive).toBeUndefined();
      expect(result.revenue).toBeDefined();
      expect(result.growth).toBeDefined();
      expect(result.summary.enginesExecuted).toBe(3);
    });

    it('should validate input requirements', async () => {
      const invalidBusinessData = {
        customerSegments: [],
        revenueStreams: []
      };

      await expect(runCompleteMonetizationAnalysis(invalidBusinessData))
        .rejects.toThrow('Business data must include at least one customer segment and revenue stream');
    });

    it('should integrate data between engines', async () => {
      const result = await runCompleteMonetizationAnalysis(
        mockBusinessData,
        mockCompetitorData
      );

      // Competitive data should influence revenue optimization
      expect(result.revenue.optimizationOpportunities.some(opp => 
        opp.opportunityId?.includes('comp-') || opp.title?.includes('Competitive')
      )).toBe(true);

      // Growth strategy should consider revenue optimization insights
      expect(result.growth.currentGrowthProfile.growthMetrics.expansionRevenue)
        .toBeGreaterThan(0);
    });
  });

  describe('runQuickRevenueOptimization', () => {
    it('should identify quick wins and immediate opportunities', () => {
      const result = runQuickRevenueOptimization(mockBusinessData);

      expect(result).toHaveProperty('quickWins');
      expect(result).toHaveProperty('immediateOpportunities');
      expect(result).toHaveProperty('totalPotentialRevenue');
      expect(result).toHaveProperty('implementationPriority');

      expect(result.quickWins).toBeInstanceOf(Array);
      expect(result.immediateOpportunities).toBeInstanceOf(Array);
      expect(result.totalPotentialRevenue).toBeGreaterThanOrEqual(0);
      expect(result.implementationPriority).toBeInstanceOf(Array);
    });

    it('should prioritize by revenue potential', () => {
      const result = runQuickRevenueOptimization(mockBusinessData);

      if (result.implementationPriority.length > 1) {
        // Should be sorted by potential revenue (descending)
        for (let i = 1; i < result.implementationPriority.length; i++) {
          expect(result.implementationPriority[i-1].potentialRevenue || 0)
            .toBeGreaterThanOrEqual(result.implementationPriority[i].potentialRevenue || 0);
        }
      }
    });
  });

  describe('runCompetitiveIntelligence', () => {
    it('should analyze competitive position and provide actionable insights', async () => {
      const ourPricing = [{
        planId: 'our-basic',
        planName: 'Basic Plan',
        price: 99,
        billingPeriod: 'monthly' as const,
        currency: 'USD',
        features: ['Feature A', 'Feature B', 'Feature C'],
        tierPosition: 1
      }];

      const result = await runCompetitiveIntelligence(
        ourPricing,
        mockCompetitorData,
        'SMB'
      );

      expect(result).toHaveProperty('position');
      expect(result).toHaveProperty('percentile');
      expect(result).toHaveProperty('opportunities');
      expect(result).toHaveProperty('threats');
      expect(result).toHaveProperty('priceRecommendations');
      expect(result).toHaveProperty('report');
      expect(result).toHaveProperty('actionItems');

      expect(['underpriced', 'competitive', 'premium', 'overpriced'])
        .toContain(result.position);
      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
      expect(result.opportunities).toBeInstanceOf(Array);
      expect(result.threats).toBeInstanceOf(Array);
      expect(result.actionItems).toBeInstanceOf(Array);
    });

    it('should filter significant price recommendations', async () => {
      const ourPricing = [{
        planId: 'our-basic',
        planName: 'Basic Plan',
        price: 99,
        billingPeriod: 'monthly' as const,
        currency: 'USD',
        features: ['Feature A'],
        tierPosition: 1
      }];

      const result = await runCompetitiveIntelligence(
        ourPricing,
        mockCompetitorData
      );

      // Should only include recommendations with significant changes (>5%)
      result.priceRecommendations.forEach(rec => {
        expect(Math.abs(rec.priceChangePercentage)).toBeGreaterThan(5);
      });
    });
  });

  describe('runGrowthStrategyPlanning', () => {
    it('should develop comprehensive growth strategy', async () => {
      const mockMetrics = {
        revenueGrowthRate: 0.3,
        customerGrowthRate: 0.25,
        marketShareGrowth: 0.02,
        productMarketFit: 0.7,
        customerSatisfactionScore: 0.8,
        netPromoterScore: 35,
        churnRate: 0.05,
        expansionRevenue: 50000,
        timeToPayback: 18
      };

      const result = await runGrowthStrategyPlanning(
        mockBusinessData,
        mockMetrics,
        '1-year',
        'moderate'
      );

      expect(result).toHaveProperty('readinessScore');
      expect(result).toHaveProperty('topOpportunities');
      expect(result).toHaveProperty('primaryStrategy');
      expect(result).toHaveProperty('keyExperiments');
      expect(result).toHaveProperty('scalingMilestones');
      expect(result).toHaveProperty('resourceNeeds');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('report');

      expect(result.readinessScore).toBeGreaterThanOrEqual(0);
      expect(result.readinessScore).toBeLessThanOrEqual(100);
      expect(result.topOpportunities).toBeInstanceOf(Array);
      expect(result.topOpportunities.length).toBeLessThanOrEqual(5);
      expect(['low', 'medium', 'high']).toContain(result.riskLevel);
    });

    it('should adapt to different timeframes and aggressiveness', async () => {
      const conservativeResult = await runGrowthStrategyPlanning(
        mockBusinessData,
        undefined,
        '1-year',
        'conservative'
      );

      const aggressiveResult = await runGrowthStrategyPlanning(
        mockBusinessData,
        undefined,
        '2-year',
        'aggressive'
      );

      // Aggressive strategies should typically have higher investment requirements
      expect(aggressiveResult.resourceNeeds.totalInvestment)
        .toBeGreaterThanOrEqual(conservativeResult.resourceNeeds.totalInvestment);
    });
  });

  describe('validateAnalysisEngines', () => {
    it('should validate all engines are loaded and healthy', () => {
      const validation = validateAnalysisEngines();

      expect(validation).toHaveProperty('healthy');
      expect(validation).toHaveProperty('allEnginesLoaded');
      expect(validation).toHaveProperty('loadedEngines');
      expect(validation).toHaveProperty('missingEngines');
      expect(validation).toHaveProperty('version');
      expect(validation).toHaveProperty('lastUpdated');

      expect(validation.healthy).toBe(true);
      expect(validation.allEnginesLoaded).toBe(true);
      expect(validation.loadedEngines).toContain('pricing');
      expect(validation.loadedEngines).toContain('competitive');
      expect(validation.loadedEngines).toContain('revenue');
      expect(validation.loadedEngines).toContain('growth');
      expect(validation.missingEngines).toEqual([]);
    });
  });

  describe('error handling and resilience', () => {
    it('should handle partial engine failures gracefully', async () => {
      // Test with minimal data that might cause some engines to have issues
      const minimalBusinessData = {
        customerSegments: [{
          id: 'seg-1',
          name: 'Test Segment',
          painPoints: [],
          jobsToBeDone: [],
          size: 1
        }],
        revenueStreams: [{
          id: 'rev-1',
          name: 'Test Revenue',
          description: 'Test',
          pricing: undefined,
          targetSegments: ['seg-1']
        }]
      };

      // Should not throw errors even with minimal data
      await expect(runCompleteMonetizationAnalysis(minimalBusinessData))
        .resolves.toBeDefined();
    });

    it('should provide meaningful error messages for invalid inputs', async () => {
      const emptyBusinessData = {
        customerSegments: [],
        revenueStreams: []
      };

      await expect(runCompleteMonetizationAnalysis(emptyBusinessData))
        .rejects.toThrow(/Business data must include/);
    });
  });

  describe('performance and scalability', () => {
    it('should complete analysis within reasonable time limits', async () => {
      const startTime = Date.now();
      
      await runCompleteMonetizationAnalysis(
        mockBusinessData,
        mockCompetitorData
      );
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should handle large datasets efficiently', async () => {
      const largeBusinessData = {
        ...mockBusinessData,
        customerSegments: Array(10).fill(null).map((_, i) => ({
          id: `segment-${i}`,
          name: `Segment ${i}`,
          painPoints: [`Pain Point ${i}`],
          jobsToBeDone: [`Job ${i}`],
          size: 1000 * (i + 1)
        })),
        revenueStreams: Array(5).fill(null).map((_, i) => ({
          id: `revenue-${i}`,
          name: `Revenue Stream ${i}`,
          description: `Description ${i}`,
          pricing: { amount: 100 + i * 50, currency: 'USD', frequency: 'monthly' },
          targetSegments: [`segment-${i}`]
        }))
      };

      const largeCompetitorData = Array(20).fill(null).map((_, i) => ({
        ...mockCompetitorData[0],
        competitorId: `comp-${i}`,
        competitorName: `Competitor ${i}`,
        basePlans: [{
          ...mockCompetitorData[0].basePlans[0],
          price: 50 + i * 10
        }]
      }));

      await expect(runCompleteMonetizationAnalysis(
        largeBusinessData,
        largeCompetitorData
      )).resolves.toBeDefined();
    });
  });

  describe('data consistency and validation', () => {
    it('should maintain data consistency across engines', async () => {
      const result = await runCompleteMonetizationAnalysis(
        mockBusinessData,
        mockCompetitorData
      );

      // Validate that customer segment names are consistent
      const segmentName = mockBusinessData.customerSegments[0].name;
      expect(result.pricing.customerSegment).toBe(segmentName);
      
      // Validate that pricing data flows between engines
      if (result.competitive) {
        const ourPrice = result.competitive.request.ourCurrentPricing[0].price;
        expect(ourPrice).toBe(mockBusinessData.revenueStreams[0].pricing.amount);
      }
    });

    it('should validate output data structures', async () => {
      const result = await runCompleteMonetizationAnalysis(
        mockBusinessData,
        mockCompetitorData
      );

      // All analysis results should have required properties
      expect(result.pricing).toHaveProperty('analysisId');
      expect(result.competitive).toHaveProperty('analysisId');
      expect(result.revenue).toHaveProperty('currentPerformance');
      expect(result.growth).toHaveProperty('currentGrowthProfile');

      // Summary should accurately reflect the analysis
      expect(result.summary.timestamp).toBeInstanceOf(Date);
      expect(result.summary.totalInvestmentRequired).toBeGreaterThanOrEqual(0);
    });
  });
});