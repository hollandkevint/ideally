import { describe, it, expect, beforeEach } from 'vitest';
import { 
  PricingModelAnalyzer, 
  PricingModelType,
  type PricingModelAnalysis 
} from '@/lib/bmad/analysis/pricing-model-analyzer';
import type { CustomerSegment, RevenueStream } from '@/lib/bmad/templates/business-model-templates';

describe('PricingModelAnalyzer', () => {
  let analyzer: PricingModelAnalyzer;
  let mockSegment: CustomerSegment;
  let mockRevenueStream: RevenueStream;

  beforeEach(() => {
    analyzer = new PricingModelAnalyzer();
    
    mockSegment = {
      id: 'segment-1',
      name: 'Small Business',
      painPoints: ['High costs', 'Complex processes'],
      jobsToBeDone: ['Reduce operational overhead', 'Improve efficiency'],
      size: 10000,
      characteristics: ['Price-sensitive', 'Simple solutions']
    };

    mockRevenueStream = {
      id: 'revenue-1',
      name: 'SaaS Subscription',
      description: 'Monthly software subscription',
      pricing: {
        amount: 99,
        currency: 'USD',
        frequency: 'monthly'
      },
      targetSegments: ['segment-1']
    };
  });

  describe('analyzePricingModels', () => {
    it('should analyze pricing models successfully', () => {
      const result = analyzer.analyzePricingModels(mockSegment, mockRevenueStream);

      expect(result).toHaveProperty('analysisId');
      expect(result.customerSegment).toBe('Small Business');
      expect(result.currentPricing).toBeDefined();
      expect(result.recommendedModels).toBeInstanceOf(Array);
      expect(result.priceOptimization).toBeDefined();
      expect(result.competitiveAnalysis).toBeDefined();
      expect(result.sensitivityAnalysis).toBeDefined();
      expect(result.implementationPlan).toBeDefined();
    });

    it('should recommend subscription model for recurring revenue stream', () => {
      const result = analyzer.analyzePricingModels(mockSegment, mockRevenueStream);

      const subscriptionModel = result.recommendedModels.find(
        model => model.modelType === PricingModelType.SUBSCRIPTION
      );
      
      expect(subscriptionModel).toBeDefined();
      expect(subscriptionModel?.suitabilityScore).toBeGreaterThan(0.7);
    });

    it('should handle missing pricing data gracefully', () => {
      const streamWithoutPricing = {
        ...mockRevenueStream,
        pricing: undefined
      };

      const result = analyzer.analyzePricingModels(mockSegment, streamWithoutPricing);
      
      expect(result).toBeDefined();
      expect(result.currentPricing).toBeDefined();
    });

    it('should integrate competitive data when provided', () => {
      const competitorData = [{
        competitorId: 'comp-1',
        competitorName: 'Competitor A',
        pricingModel: 'subscription',
        basePlans: [{
          planId: 'basic',
          planName: 'Basic Plan',
          price: 79,
          billingPeriod: 'monthly' as const,
          currency: 'USD',
          features: ['Basic features'],
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

      const result = analyzer.analyzePricingModels(
        mockSegment, 
        mockRevenueStream, 
        undefined, 
        undefined, 
        competitorData
      );

      expect(result.competitiveAnalysis).toBeDefined();
      expect(result.competitiveAnalysis.competitorPricing).toHaveLength(1);
      expect(result.competitiveAnalysis.competitorPricing[0].competitorName).toBe('Competitor A');
    });
  });

  describe('price optimization', () => {
    it('should provide price optimization recommendations', () => {
      const result = analyzer.analyzePricingModels(mockSegment, mockRevenueStream);

      expect(result.priceOptimization).toHaveProperty('optimalPriceRange');
      expect(result.priceOptimization).toHaveProperty('vanWestendorpAnalysis');
      expect(result.priceOptimization).toHaveProperty('priceTestRecommendations');
      expect(result.priceOptimization.revenueMaximizingPrice).toBeGreaterThan(0);
      expect(result.priceOptimization.profitMaximizingPrice).toBeGreaterThan(0);
    });

    it('should calculate price ranges within reasonable bounds', () => {
      const result = analyzer.analyzePricingModels(mockSegment, mockRevenueStream);
      const priceRange = result.priceOptimization.optimalPriceRange;

      expect(priceRange.minimum).toBeLessThan(priceRange.optimal);
      expect(priceRange.optimal).toBeLessThan(priceRange.maximum);
      expect(priceRange.confidence).toBeGreaterThan(0);
      expect(priceRange.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('competitive analysis', () => {
    it('should analyze competitive positioning', () => {
      const result = analyzer.analyzePricingModels(mockSegment, mockRevenueStream);

      expect(result.competitiveAnalysis.marketPositioning).toBeDefined();
      expect(result.competitiveAnalysis.pricingGaps).toBeInstanceOf(Array);
      expect(result.competitiveAnalysis.competitiveAdvantage).toBeInstanceOf(Array);
    });

    it('should identify pricing gaps', () => {
      const result = analyzer.analyzePricingModels(mockSegment, mockRevenueStream);
      const gaps = result.competitiveAnalysis.pricingGaps;

      gaps.forEach(gap => {
        expect(gap).toHaveProperty('gapType');
        expect(gap).toHaveProperty('description');
        expect(gap).toHaveProperty('opportunity');
        expect(gap).toHaveProperty('potentialImpact');
      });
    });
  });

  describe('implementation planning', () => {
    it('should provide implementation roadmap', () => {
      const result = analyzer.analyzePricingModels(mockSegment, mockRevenueStream);

      expect(result.implementationPlan).toHaveProperty('phases');
      expect(result.implementationPlan).toHaveProperty('timeline');
      expect(result.implementationPlan).toHaveProperty('risks');
      expect(result.implementationPlan.phases).toBeInstanceOf(Array);
    });

    it('should include risk assessment in implementation plan', () => {
      const result = analyzer.analyzePricingModels(mockSegment, mockRevenueStream);
      const risks = result.implementationPlan.risks;

      risks.forEach(risk => {
        expect(risk).toHaveProperty('risk');
        expect(risk).toHaveProperty('probability');
        expect(risk).toHaveProperty('impact');
        expect(risk).toHaveProperty('mitigation');
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid segment data', () => {
      const invalidSegment = {
        ...mockSegment,
        size: -1 // Invalid size
      };

      expect(() => {
        analyzer.analyzePricingModels(invalidSegment, mockRevenueStream);
      }).not.toThrow();
    });

    it('should handle empty revenue stream', () => {
      const emptyRevenueStream = {
        id: '',
        name: '',
        description: '',
        pricing: undefined,
        targetSegments: []
      };

      expect(() => {
        analyzer.analyzePricingModels(mockSegment, emptyRevenueStream);
      }).not.toThrow();
    });
  });

  describe('pricing model recommendations', () => {
    it('should recommend appropriate models based on segment characteristics', () => {
      const priceConsciousSegment = {
        ...mockSegment,
        characteristics: ['Price-sensitive', 'Cost-conscious']
      };

      const result = analyzer.analyzePricingModels(priceConsciousSegment, mockRevenueStream);
      
      // Should recommend value-oriented pricing models
      const valueBasedModel = result.recommendedModels.find(
        model => model.modelType === PricingModelType.VALUE_BASED
      );
      const freemiumModel = result.recommendedModels.find(
        model => model.modelType === PricingModelType.FREEMIUM
      );
      
      expect(valueBasedModel || freemiumModel).toBeDefined();
    });

    it('should provide model suitability scores', () => {
      const result = analyzer.analyzePricingModels(mockSegment, mockRevenueStream);
      
      result.recommendedModels.forEach(model => {
        expect(model.suitabilityScore).toBeGreaterThanOrEqual(0);
        expect(model.suitabilityScore).toBeLessThanOrEqual(1);
        expect(model.rationale).toBeDefined();
        expect(model.rationale.length).toBeGreaterThan(0);
      });
    });
  });

  describe('performance', () => {
    it('should complete analysis within reasonable time', () => {
      const startTime = Date.now();
      
      analyzer.analyzePricingModels(mockSegment, mockRevenueStream);
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large competitor datasets', () => {
      const largeCompetitorDataset = Array(50).fill(null).map((_, index) => ({
        competitorId: `comp-${index}`,
        competitorName: `Competitor ${index}`,
        pricingModel: 'subscription',
        basePlans: [{
          planId: 'basic',
          planName: 'Basic Plan',
          price: 50 + index * 2,
          billingPeriod: 'monthly' as const,
          currency: 'USD',
          features: ['Basic features'],
          tierPosition: 1
        }],
        featureComparison: [],
        marketPosition: 'mid-market' as const,
        targetSegments: ['Small Business'],
        pricingStrategy: 'Competitive pricing',
        lastUpdated: new Date(),
        sourceConfidence: 0.8,
        revenueModel: 'SaaS'
      }));

      expect(() => {
        analyzer.analyzePricingModels(
          mockSegment, 
          mockRevenueStream, 
          undefined, 
          undefined, 
          largeCompetitorDataset
        );
      }).not.toThrow();
    });
  });
});