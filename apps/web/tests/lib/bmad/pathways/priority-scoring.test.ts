import { describe, it, expect } from 'vitest';
import {
  calculatePriority,
  validatePriorityScoring,
  getPriorityRecommendations,
  analyzePriority
} from '@/lib/bmad/pathways/priority-scoring';

describe('Priority Scoring Logic', () => {
  describe('calculatePriority', () => {
    it('should calculate priority score correctly', () => {
      const result = calculatePriority(8, 2);

      expect(result.effort_score).toBe(2);
      expect(result.impact_score).toBe(8);
      expect(result.calculated_priority).toBe(4.0);
      expect(result.priority_category).toBe('Critical');
      expect(result.quadrant).toBe('Quick Wins');
      expect(result.scoring_timestamp).toBeInstanceOf(Date);
    });

    it('should categorize priorities correctly', () => {
      expect(calculatePriority(10, 5).priority_category).toBe('Critical'); // 2.0
      expect(calculatePriority(8, 5).priority_category).toBe('High'); // 1.6
      expect(calculatePriority(5, 4).priority_category).toBe('Medium'); // 1.25
      expect(calculatePriority(3, 5).priority_category).toBe('Low'); // 0.6
    });

    it('should assign quadrants correctly', () => {
      expect(calculatePriority(8, 3).quadrant).toBe('Quick Wins'); // High impact, low effort
      expect(calculatePriority(8, 7).quadrant).toBe('Major Projects'); // High impact, high effort
      expect(calculatePriority(4, 3).quadrant).toBe('Fill-ins'); // Low impact, low effort
      expect(calculatePriority(4, 7).quadrant).toBe('Time Wasters'); // Low impact, high effort
    });

    it('should handle edge cases', () => {
      // Boundary conditions for quadrants
      expect(calculatePriority(7, 4).quadrant).toBe('Quick Wins');
      expect(calculatePriority(7, 5).quadrant).toBe('Major Projects');
      expect(calculatePriority(6, 4).quadrant).toBe('Fill-ins');
      expect(calculatePriority(6, 5).quadrant).toBe('Time Wasters');
    });

    it('should throw error for invalid input ranges', () => {
      expect(() => calculatePriority(0, 5)).toThrow('Impact and effort scores must be between 1 and 10');
      expect(() => calculatePriority(11, 5)).toThrow('Impact and effort scores must be between 1 and 10');
      expect(() => calculatePriority(5, 0)).toThrow('Impact and effort scores must be between 1 and 10');
      expect(() => calculatePriority(5, 11)).toThrow('Impact and effort scores must be between 1 and 10');
    });

    it('should round priority score to 2 decimal places', () => {
      const result = calculatePriority(7, 3);
      expect(result.calculated_priority).toBe(2.33);
    });
  });

  describe('validatePriorityScoring', () => {
    it('should validate correct scoring data', () => {
      const validScoring = {
        effort_score: 5,
        impact_score: 7,
        calculated_priority: 1.4,
        priority_category: 'Medium' as const,
        quadrant: 'Quick Wins' as const,
        scoring_timestamp: new Date()
      };

      const errors = validatePriorityScoring(validScoring);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid effort scores', () => {
      const errors1 = validatePriorityScoring({ effort_score: 0, impact_score: 5 });
      expect(errors1).toContain('Effort score must be between 1 and 10');

      const errors2 = validatePriorityScoring({ effort_score: 11, impact_score: 5 });
      expect(errors2).toContain('Effort score must be between 1 and 10');
    });

    it('should return errors for invalid impact scores', () => {
      const errors1 = validatePriorityScoring({ effort_score: 5, impact_score: 0 });
      expect(errors1).toContain('Impact score must be between 1 and 10');

      const errors2 = validatePriorityScoring({ effort_score: 5, impact_score: 11 });
      expect(errors2).toContain('Impact score must be between 1 and 10');
    });

    it('should return errors for missing scores', () => {
      const errors = validatePriorityScoring({});
      expect(errors).toHaveLength(2);
      expect(errors).toContain('Effort score must be between 1 and 10');
      expect(errors).toContain('Impact score must be between 1 and 10');
    });
  });

  describe('getPriorityRecommendations', () => {
    it('should return Quick Wins recommendations', () => {
      const recommendations = getPriorityRecommendations('Quick Wins');
      expect(recommendations).toContain('Prioritize for immediate implementation');
      expect(recommendations).toContain('Consider as a quick prototype or MVP feature');
    });

    it('should return Major Projects recommendations', () => {
      const recommendations = getPriorityRecommendations('Major Projects');
      expect(recommendations).toContain('Plan carefully with proper resource allocation');
      expect(recommendations).toContain('Break down into smaller deliverable phases');
    });

    it('should return Fill-ins recommendations', () => {
      const recommendations = getPriorityRecommendations('Fill-ins');
      expect(recommendations).toContain('Good for junior developers or learning opportunities');
      expect(recommendations).toContain('Implement when team has available capacity');
    });

    it('should return Time Wasters recommendations', () => {
      const recommendations = getPriorityRecommendations('Time Wasters');
      expect(recommendations).toContain('Question whether this feature is truly necessary');
      expect(recommendations).toContain('Look for alternative approaches with lower effort');
    });

    it('should handle unknown quadrant', () => {
      const recommendations = getPriorityRecommendations('Unknown');
      expect(recommendations).toContain('Unable to provide recommendations for unknown quadrant');
    });
  });

  describe('analyzePriority', () => {
    it('should provide complete analysis for Quick Wins', () => {
      const analysis = analyzePriority(8, 3);

      expect(analysis.scoring.quadrant).toBe('Quick Wins');
      expect(analysis.scoring.priority_category).toBe('Critical');
      expect(analysis.recommendations).toContain('Prioritize for immediate implementation');
      expect(analysis.nextSteps).toContain('Move to development backlog immediately');
      expect(analysis.riskFactors).toHaveLength(0);
    });

    it('should provide complete analysis for Time Wasters', () => {
      const analysis = analyzePriority(3, 8);

      expect(analysis.scoring.quadrant).toBe('Time Wasters');
      expect(analysis.scoring.priority_category).toBe('Low');
      expect(analysis.recommendations).toContain('Question whether this feature is truly necessary');
      expect(analysis.riskFactors).toContain('High effort with low impact may not justify investment');
      expect(analysis.riskFactors).toContain('Consider opportunity cost of other features');
    });

    it('should provide complete analysis for Major Projects', () => {
      const analysis = analyzePriority(9, 6); // 9/6 = 1.5 (High category)

      expect(analysis.scoring.quadrant).toBe('Major Projects');
      expect(analysis.scoring.priority_category).toBe('High');
      expect(analysis.recommendations).toContain('Plan carefully with proper resource allocation');
      expect(analysis.riskFactors).toContain('Requires significant resource commitment');
      expect(analysis.riskFactors).toContain('May have longer time to value realization');
      expect(analysis.nextSteps).toContain('Include in next quarter planning');
    });

    it('should provide complete analysis for Fill-ins', () => {
      const analysis = analyzePriority(4, 3);

      expect(analysis.scoring.quadrant).toBe('Fill-ins');
      expect(analysis.scoring.priority_category).toBe('Medium');
      expect(analysis.recommendations).toContain('Good for junior developers or learning opportunities');
      expect(analysis.nextSteps).toContain('Monitor for changing conditions that might affect priority');
    });

    it('should provide correct next steps based on priority category', () => {
      const criticalAnalysis = analyzePriority(10, 2); // 10/2 = 5.0 (Critical)
      expect(criticalAnalysis.nextSteps).toContain('Move to development backlog immediately');

      const highAnalysis = analyzePriority(8, 5); // 8/5 = 1.6 (High)
      expect(highAnalysis.nextSteps).toContain('Include in next quarter planning');

      const mediumAnalysis = analyzePriority(5, 5); // 5/5 = 1.0 (Medium)
      expect(mediumAnalysis.nextSteps).toContain('Monitor for changing conditions that might affect priority');
    });
  });
});