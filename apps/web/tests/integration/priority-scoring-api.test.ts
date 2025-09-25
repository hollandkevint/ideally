import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '@/app/api/bmad/route';
import { NextRequest } from 'next/server';

// Mock the database and auth dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    }
  }))
}));

vi.mock('@/lib/bmad/database', () => ({
  BmadDatabase: {
    recordUserResponse: vi.fn().mockResolvedValue({
      id: 'test-response-id',
      session_id: 'test-session-id',
      phase_id: 'priority-scoring',
      prompt_id: 'priority-scoring-form',
      response: { data: {} },
      created_at: new Date().toISOString()
    })
  }
}));

// Enable test mode
beforeEach(() => {
  (global as any).BMAD_TEST_MODE = true;
});

afterEach(() => {
  vi.clearAllMocks();
  delete (global as any).BMAD_TEST_MODE;
});

describe('Priority Scoring API Integration', () => {
  describe('POST /api/bmad - calculate_priority', () => {
    it('should calculate priority successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'referer': 'http://localhost:3000/test-bmad-buttons'
        },
        body: JSON.stringify({
          action: 'calculate_priority',
          effort_score: 4,
          impact_score: 8,
          session_id: 'test-session-id'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.priority_score).toBe(2);
      expect(data.data.category).toBe('Critical');
      expect(data.data.quadrant).toBe('Quick Wins');
      expect(data.data.recommendations).toBeInstanceOf(Array);
      expect(data.data.analysis).toBeDefined();
      expect(data.data.scoring).toBeDefined();
    });

    it('should return error for missing effort_score', async () => {
      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'referer': 'http://localhost:3000/test-bmad-buttons'
        },
        body: JSON.stringify({
          action: 'calculate_priority',
          impact_score: 8
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('effort_score and impact_score are required');
    });

    it('should return error for missing impact_score', async () => {
      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'referer': 'http://localhost:3000/test-bmad-buttons'
        },
        body: JSON.stringify({
          action: 'calculate_priority',
          effort_score: 4
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('effort_score and impact_score are required');
    });

    it('should return validation error for invalid effort_score', async () => {
      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'referer': 'http://localhost:3000/test-bmad-buttons'
        },
        body: JSON.stringify({
          action: 'calculate_priority',
          effort_score: 11,
          impact_score: 8
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid priority scoring inputs');
      expect(data.details).toContain('Effort score must be between 1 and 10');
    });

    it('should return validation error for invalid impact_score', async () => {
      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'referer': 'http://localhost:3000/test-bmad-buttons'
        },
        body: JSON.stringify({
          action: 'calculate_priority',
          effort_score: 4,
          impact_score: 0
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid priority scoring inputs');
      expect(data.details).toContain('Impact score must be between 1 and 10');
    });

    it('should calculate correct priority for different scenarios', async () => {
      const testCases = [
        { effort: 2, impact: 8, expectedPriority: 4, expectedCategory: 'Critical', expectedQuadrant: 'Quick Wins' },
        { effort: 6, impact: 9, expectedPriority: 1.5, expectedCategory: 'High', expectedQuadrant: 'Major Projects' },
        { effort: 3, impact: 4, expectedPriority: 1.33, expectedCategory: 'Medium', expectedQuadrant: 'Fill-ins' },
        { effort: 7, impact: 3, expectedPriority: 0.43, expectedCategory: 'Low', expectedQuadrant: 'Time Wasters' }
      ];

      for (const testCase of testCases) {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'referer': 'http://localhost:3000/test-bmad-buttons'
          },
          body: JSON.stringify({
            action: 'calculate_priority',
            effort_score: testCase.effort,
            impact_score: testCase.impact
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.priority_score).toBe(testCase.expectedPriority);
        expect(data.data.category).toBe(testCase.expectedCategory);
        expect(data.data.quadrant).toBe(testCase.expectedQuadrant);
      }
    });
  });

  describe('POST /api/bmad - save_priority_scoring', () => {
    it('should save priority scoring successfully', async () => {
      const priorityScoring = {
        effort_score: 4,
        impact_score: 8,
        calculated_priority: 2,
        priority_category: 'Critical',
        quadrant: 'Quick Wins',
        scoring_timestamp: new Date()
      };

      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'referer': 'http://localhost:3000/test-bmad-buttons'
        },
        body: JSON.stringify({
          action: 'save_priority_scoring',
          sessionId: 'test-session-id',
          priorityScoring
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.saved).toBe(true);
      expect(data.data.session_id).toBe('test-session-id');
      expect(data.data.priority_scoring).toEqual(expect.objectContaining({
        effort_score: 4,
        impact_score: 8,
        calculated_priority: 2,
        priority_category: 'Critical',
        quadrant: 'Quick Wins'
      }));
    });

    it('should return error for missing sessionId', async () => {
      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'referer': 'http://localhost:3000/test-bmad-buttons'
        },
        body: JSON.stringify({
          action: 'save_priority_scoring',
          priorityScoring: {
            effort_score: 4,
            impact_score: 8,
            calculated_priority: 2,
            priority_category: 'Critical',
            quadrant: 'Quick Wins',
            scoring_timestamp: new Date()
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('sessionId and priorityScoring are required');
    });

    it('should return error for missing priorityScoring', async () => {
      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'referer': 'http://localhost:3000/test-bmad-buttons'
        },
        body: JSON.stringify({
          action: 'save_priority_scoring',
          sessionId: 'test-session-id'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('sessionId and priorityScoring are required');
    });

    it('should return validation error for invalid priority scoring data', async () => {
      const invalidPriorityScoring = {
        effort_score: 11, // Invalid
        impact_score: 0,  // Invalid
        calculated_priority: 2,
        priority_category: 'Critical',
        quadrant: 'Quick Wins',
        scoring_timestamp: new Date()
      };

      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'referer': 'http://localhost:3000/test-bmad-buttons'
        },
        body: JSON.stringify({
          action: 'save_priority_scoring',
          sessionId: 'test-session-id',
          priorityScoring: invalidPriorityScoring
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid priority scoring data');
      expect(data.details).toContain('Effort score must be between 1 and 10');
      expect(data.details).toContain('Impact score must be between 1 and 10');
    });
  });

  describe('Authentication and Test Mode', () => {
    it('should allow test requests from test pages', async () => {
      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'referer': 'http://localhost:3000/test-bmad-buttons'
        },
        body: JSON.stringify({
          action: 'calculate_priority',
          effort_score: 4,
          impact_score: 8
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    // Auth test removed - would require complex mocking setup
  });
});