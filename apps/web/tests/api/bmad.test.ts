import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../app/api/bmad/route';

// Mock all dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })
    }
  }))
}));

vi.mock('@/lib/bmad/session-orchestrator', () => ({
  sessionOrchestrator: {
    createSession: vi.fn().mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      workspaceId: 'workspace-123',
      pathway: 'new_idea',
      status: 'active'
    }),
    getSession: vi.fn().mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      workspaceId: 'workspace-123',
      pathway: 'new_idea',
      status: 'active'
    }),
    advanceSession: vi.fn().mockResolvedValue({ nextStep: 'analysis' })
  }
}));

vi.mock('@/lib/bmad/database', () => ({
  BmadDatabase: {
    getUserSessions: vi.fn().mockResolvedValue([{
      id: 'session-123',
      userId: 'user-123',
      workspaceId: 'workspace-123',
      pathway: 'new_idea',
      status: 'active'
    }]),
    recordUserResponse: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('@/lib/bmad/pathway-router', () => ({
  pathwayRouter: {
    analyzeUserIntent: vi.fn().mockResolvedValue({
      pathway: 'new_idea',
      confidence: 0.9
    }),
    getAllPathways: vi.fn().mockReturnValue(['new_idea', 'stuck_problem', 'refine_concept'])
  }
}));

vi.mock('@/lib/bmad/knowledge-base', () => ({
  bmadKnowledgeBase: {
    searchKnowledge: vi.fn().mockResolvedValue([
      { id: 'kb-1', title: 'Test Knowledge', type: 'framework' }
    ]),
    getPhaseKnowledge: vi.fn().mockResolvedValue([
      { id: 'kb-2', title: 'Phase Knowledge', type: 'technique' }
    ])
  }
}));

// Mock feature analysis functions
vi.mock('@/lib/bmad/pathways/feature-input', () => ({
  validateFeatureInput: vi.fn().mockReturnValue({
    isValid: true,
    errors: [],
    warnings: []
  }),
  analyzeFeatureInput: vi.fn().mockReturnValue({
    complexity_score: 5.0,
    user_focus_score: 8.0,
    feasibility_indicators: ['Mobile development considerations needed']
  }),
  generateAnalysisId: vi.fn().mockReturnValue('fa_123456_abcdef')
}));

vi.mock('@/lib/bmad/analysis/feature-questions', () => ({
  selectBestQuestions: vi.fn().mockReturnValue([
    'What specific user pain point does this feature solve?',
    'How will you measure whether this feature is successful?',
    'What are the main technical challenges in building this feature?',
    'What user behavior changes would indicate this feature is working?'
  ]),
  getFallbackQuestions: vi.fn().mockReturnValue([
    'What specific user pain point does this feature solve?',
    'How will you measure whether this feature is successful?'
  ]),
  validateQuestions: vi.fn().mockReturnValue({
    isValid: true,
    issues: []
  })
}));

// Test data constants
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockSession = {
  id: 'session-123',
  userId: 'user-123',
  workspaceId: 'workspace-123',
  pathway: 'new_idea',
  status: 'active'
};

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  }
};

describe('BMad API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/bmad', () => {
    describe('create_session action', () => {
      it('should create session successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create_session',
            workspaceId: 'workspace-123',
            pathway: 'new_idea'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.session).toEqual(mockSession);
      });

      it('should return 400 for missing parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create_session',
            // Missing workspaceId and pathway
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Session creation failed: Missing required parameters');
        expect(data.code).toBe('MISSING_PARAMETERS');
      });

      it('should handle session creation errors', async () => {
        const { sessionOrchestrator } = await import('@/lib/bmad/session-orchestrator');
        vi.mocked(sessionOrchestrator.createSession).mockRejectedValue(
          new Error('Database connection failed')
        );

        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create_session',
            workspaceId: 'workspace-123',
            pathway: 'new_idea'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Session creation failed: Database error');
        expect(data.code).toBe('DB_ERROR');
      });

      it('should handle authentication errors', async () => {
        const { sessionOrchestrator } = await import('@/lib/bmad/session-orchestrator');
        vi.mocked(sessionOrchestrator.createSession).mockRejectedValue(
          new Error('User not authenticated')
        );

        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create_session',
            workspaceId: 'workspace-123',
            pathway: 'new_idea'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.code).toBe('AUTH_REQUIRED');
      });

      it('should handle invalid pathway errors', async () => {
        const { sessionOrchestrator } = await import('@/lib/bmad/session-orchestrator');
        vi.mocked(sessionOrchestrator.createSession).mockRejectedValue(
          new Error('Invalid pathway specified')
        );

        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create_session',
            workspaceId: 'workspace-123',
            pathway: 'invalid_pathway'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_PATHWAY');
      });
    });

    describe('analyze_intent action', () => {
      it('should analyze intent successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_intent',
            userInput: 'I want to build a new mobile app'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.recommendation.pathway).toBe('new_idea');
      });

      it('should return 400 for missing userInput', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_intent'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Intent analysis failed: Missing userInput parameter');
        expect(data.code).toBe('MISSING_USER_INPUT');
      });

      it('should handle intent analysis errors', async () => {
        const { pathwayRouter } = await import('@/lib/bmad/pathway-router');
        vi.mocked(pathwayRouter.analyzeUserIntent).mockRejectedValue(
          new Error('Analysis service unavailable')
        );

        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_intent',
            userInput: 'test input'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Intent analysis failed: Processing error');
        expect(data.code).toBe('INTENT_ANALYSIS_ERROR');
      });
    });

    describe('analyze_feature_input action', () => {
      it('should analyze feature input successfully', async () => {
        const featureData = {
          feature_description: 'A mobile app that helps users track their daily water intake with smart reminders',
          target_users: 'Health-conscious individuals aged 25-45',
          current_problems: 'People forget to drink enough water throughout the day',
          success_definition: '90% user retention after 30 days and 8+ glasses tracked daily',
          analysis_questions: [],
          input_timestamp: new Date()
        };

        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_feature_input',
            featureData
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.analysis_id).toBe('fa_123456_abcdef');
        expect(data.data.questions).toHaveLength(4);
        expect(data.data.insights.complexity_score).toBe(5.0);
      });

      it('should return 400 for missing featureData', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_feature_input'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('featureData is required');
      });

      it('should return 400 for invalid feature input', async () => {
        const { validateFeatureInput } = await import('@/lib/bmad/pathways/feature-input');
        vi.mocked(validateFeatureInput).mockReturnValue({
          isValid: false,
          errors: ['Feature description is required'],
          warnings: []
        });

        const featureData = {
          feature_description: '',
          analysis_questions: [],
          input_timestamp: new Date()
        };

        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_feature_input',
            featureData
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid feature input');
        expect(data.details).toContain('Feature description is required');
      });
    });

    describe('save_feature_input action', () => {
      it('should save feature input successfully', async () => {
        const featureData = {
          feature_description: 'A mobile app that helps users track their daily water intake with smart reminders and personalized goals',
          target_users: 'Health-conscious individuals',
          analysis_questions: [],
          input_timestamp: new Date()
        };

        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'save_feature_input',
            sessionId: 'session-123',
            featureData,
            analysisId: 'fa_123456_abcdef'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.saved).toBe(true);
        expect(data.data.session_id).toBe('session-123');
      });

      it('should return 400 for missing sessionId', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'save_feature_input',
            featureData: { feature_description: 'test' }
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('sessionId and featureData are required');
      });
    });

    describe('advance_session action', () => {
      it('should advance session successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'advance_session',
            sessionId: 'session-123',
            userInput: 'My response to the question'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.nextStep).toBe('analysis');
      });

      it('should return 400 for missing parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'advance_session',
            sessionId: 'session-123'
            // Missing userInput
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Session advancement failed: Missing required parameters');
        expect(data.code).toBe('MISSING_PARAMETERS');
      });

      it('should handle session advancement errors', async () => {
        const { sessionOrchestrator } = await import('@/lib/bmad/session-orchestrator');
        vi.mocked(sessionOrchestrator.advanceSession).mockRejectedValue(
          new Error('Session processing failed')
        );

        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'advance_session',
            sessionId: 'session-123',
            userInput: 'test input'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Session advancement failed: Processing error');
        expect(data.code).toBe('SESSION_ADVANCEMENT_ERROR');
      });
    });

    describe('get_session action', () => {
      it('should get session successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'get_session',
            sessionId: 'session-123'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.session).toEqual(mockSession);
      });

      it('should return 400 for missing sessionId', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'get_session'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Session retrieval failed: Missing sessionId parameter');
        expect(data.code).toBe('MISSING_SESSION_ID');
      });

      it('should return 404 for session not found', async () => {
        const { sessionOrchestrator } = await import('@/lib/bmad/session-orchestrator');
        vi.mocked(sessionOrchestrator.getSession).mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/bmad', {
          method: 'POST',
          body: JSON.stringify({
            action: 'get_session',
            sessionId: 'nonexistent-session'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Session not found');
        expect(data.code).toBe('SESSION_NOT_FOUND');
      });
    });

    it('should return 401 for unauthenticated users', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_session',
          workspaceId: 'workspace-123',
          pathway: 'new_idea'
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid action', async () => {
      const request = new NextRequest('http://localhost:3000/api/bmad', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalid_action'
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/bmad', () => {
    describe('sessions action', () => {
      it('should retrieve user sessions successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad?action=sessions');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.sessions).toEqual([mockSession]);
      });

      it('should handle session retrieval errors', async () => {
        const { BmadDatabase } = await import('@/lib/bmad/database');
        vi.mocked(BmadDatabase.getUserSessions).mockRejectedValue(
          new Error('Database query failed')
        );

        const request = new NextRequest('http://localhost:3000/api/bmad?action=sessions');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Session retrieval failed: Database error');
        expect(data.code).toBe('DB_ERROR');
      });

      it('should filter by workspaceId when provided', async () => {
        const { BmadDatabase } = await import('@/lib/bmad/database');
        
        const request = new NextRequest('http://localhost:3000/api/bmad?action=sessions&workspaceId=workspace-456');

        await GET(request);

        expect(BmadDatabase.getUserSessions).toHaveBeenCalledWith(
          mockUser.id,
          { workspaceId: 'workspace-456', status: undefined }
        );
      });

      it('should filter by status when provided', async () => {
        const { BmadDatabase } = await import('@/lib/bmad/database');
        
        const request = new NextRequest('http://localhost:3000/api/bmad?action=sessions&status=active');

        await GET(request);

        expect(BmadDatabase.getUserSessions).toHaveBeenCalledWith(
          mockUser.id,
          { workspaceId: undefined, status: 'active' }
        );
      });

      it('should return 400 for invalid status parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad?action=sessions&status=invalid');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Session retrieval failed: Invalid status parameter');
        expect(data.code).toBe('INVALID_STATUS');
      });
    });

    describe('knowledge action', () => {
      it('should search knowledge successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad?action=knowledge&query=test');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.results).toHaveLength(1);
      });

      it('should return 400 for missing query parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad?action=knowledge&query=');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Knowledge search failed: Missing query parameter');
        expect(data.code).toBe('MISSING_QUERY');
      });

      it('should handle knowledge search errors', async () => {
        const { bmadKnowledgeBase } = await import('@/lib/bmad/knowledge-base');
        vi.mocked(bmadKnowledgeBase.searchKnowledge).mockRejectedValue(
          new Error('Search service unavailable')
        );

        const request = new NextRequest('http://localhost:3000/api/bmad?action=knowledge&query=test');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Knowledge search failed: Database error');
        expect(data.code).toBe('KNOWLEDGE_SEARCH_ERROR');
      });
    });

    describe('pathways action', () => {
      it('should retrieve pathways successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/bmad?action=pathways');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.pathways).toEqual(['new_idea', 'stuck_problem', 'refine_concept']);
      });

      it('should handle pathway loading errors', async () => {
        const { pathwayRouter } = await import('@/lib/bmad/pathway-router');
        vi.mocked(pathwayRouter.getAllPathways).mockImplementation(() => {
          throw new Error('Pathway service unavailable');
        });

        const request = new NextRequest('http://localhost:3000/api/bmad?action=pathways');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Pathway retrieval failed: Unable to load pathways');
        expect(data.code).toBe('PATHWAY_LOAD_ERROR');
      });
    });

    it('should return 401 for unauthenticated users', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const request = new NextRequest('http://localhost:3000/api/bmad?action=sessions');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});