import { describe, it, expect } from 'vitest';
import { PathwayRouter, IntentAnalysis, PathwayRecommendation } from '@/lib/bmad/pathway-router';
import { PathwayType } from '@/lib/bmad/types';

describe('PathwayRouter - Enhanced Intent Analysis (Story 2.1)', () => {
  let router: PathwayRouter;

  beforeEach(() => {
    router = new PathwayRouter();
  });

  describe('New Pathway Types Support', () => {
    it('should support NEW_IDEA pathway type', async () => {
      const userInput = "I have a new startup idea for a mobile app";
      const recommendation = await router.analyzeUserIntent(userInput);
      
      expect(recommendation).toBeDefined();
      expect(recommendation.primary).toBe(PathwayType.NEW_IDEA);
      expect(recommendation.confidence).toBeGreaterThan(0.5);
      expect(recommendation.reasoning).toContain('New Idea');
    });

    it('should support BUSINESS_MODEL_PROBLEM pathway type', async () => {
      const userInput = "I'm struggling with monetization and revenue streams for my business";
      const recommendation = await router.analyzeUserIntent(userInput);
      
      expect(recommendation).toBeDefined();
      expect(recommendation.primary).toBe(PathwayType.BUSINESS_MODEL_PROBLEM);
      expect(recommendation.confidence).toBeGreaterThan(0.5);
      expect(recommendation.reasoning).toContain('Business Model Problem');
    });

    it('should support FEATURE_REFINEMENT pathway type', async () => {
      const userInput = "I need to validate and improve the features in my product";
      const recommendation = await router.analyzeUserIntent(userInput);
      
      expect(recommendation).toBeDefined();
      expect(recommendation.primary).toBe(PathwayType.FEATURE_REFINEMENT);
      expect(recommendation.confidence).toBeGreaterThan(0.5);
      expect(recommendation.reasoning).toContain('Feature Refinement');
    });
  });

  describe('Enhanced Scoring Algorithm', () => {
    it('should provide meaningful confidence scores above 50% for good matches', async () => {
      const testCases = [
        "I have a creative new business idea",
        "My revenue model isn't working",
        "I need to test my product features"
      ];

      for (const input of testCases) {
        const recommendation = await router.analyzeUserIntent(input);
        expect(recommendation.confidence).toBeGreaterThan(0.5);
        expect(recommendation.confidence).toBeLessThanOrEqual(0.95);
      }
    });

    it('should return alternative pathways with valid scores', async () => {
      const userInput = "I need help with my business strategy";
      const recommendation = await router.analyzeUserIntent(userInput);
      
      expect(recommendation.alternatives).toBeDefined();
      expect(recommendation.alternatives.length).toBeGreaterThan(0);
      recommendation.alternatives.forEach(alt => {
        expect(alt.confidence).toBeGreaterThan(0);
        expect(alt.confidence).toBeLessThanOrEqual(1);
        expect(alt.reasoning).toBeTruthy();
      });
    });
  });

  describe('Pathway Configuration', () => {
    it('should have all new pathways properly configured', () => {
      const newIdeaPathway = router.getPathway(PathwayType.NEW_IDEA);
      const businessModelProblemPathway = router.getPathway(PathwayType.BUSINESS_MODEL_PROBLEM);
      const featureRefinementPathway = router.getPathway(PathwayType.FEATURE_REFINEMENT);

      expect(newIdeaPathway).toBeDefined();
      expect(newIdeaPathway?.name).toBe('New Idea Exploration');
      expect(newIdeaPathway?.templateSequence).toBeDefined();

      expect(businessModelProblemPathway).toBeDefined();
      expect(businessModelProblemPathway?.name).toBe('Business Model Problem Analysis');

      expect(featureRefinementPathway).toBeDefined();
      expect(featureRefinementPathway?.name).toBe('Feature Refinement & User-Centered Design');
    });

    it('should maintain backward compatibility with existing pathways', () => {
      const businessModelPathway = router.getPathway(PathwayType.BUSINESS_MODEL);
      const optimizationPathway = router.getPathway(PathwayType.STRATEGIC_OPTIMIZATION);

      expect(businessModelPathway).toBeDefined();
      expect(optimizationPathway).toBeDefined();
    });
  });

  describe('Intent Classification Edge Cases', () => {
    it('should handle ambiguous input gracefully', async () => {
      const ambiguousInput = "I need help";
      const recommendation = await router.analyzeUserIntent(ambiguousInput);
      
      expect(recommendation).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThan(0.3);
      expect(recommendation.alternatives.length).toBeGreaterThan(0);
    });

    it('should handle very specific domain language', async () => {
      const specificInput = "I need to analyze customer acquisition cost and lifetime value for my SaaS platform";
      const recommendation = await router.analyzeUserIntent(specificInput);
      
      expect(recommendation).toBeDefined();
      expect([PathwayType.BUSINESS_MODEL_PROBLEM, PathwayType.BUSINESS_MODEL]).toContain(recommendation.primary);
      expect(recommendation.confidence).toBeGreaterThan(0.6);
    });
  });
});