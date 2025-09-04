import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/bmad/route';

// Mock all dependencies
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    })
  }
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient))
}));

const mockSession = {
  id: 'session-123',
  userId: 'user-123',
  workspaceId: 'workspace-123',
  pathway: 'new_idea',
  status: 'active'
};

vi.mock('@/lib/bmad/session-orchestrator', () => ({
  sessionOrchestrator: {
    createSession: vi.fn().mockResolvedValue(mockSession),
    getSession: vi.fn().mockResolvedValue(mockSession),
    advanceSession: vi.fn().mockResolvedValue({ nextStep: 'analysis' })
  }
}));

vi.mock('@/lib/bmad/database', () => ({
  BmadDatabase: {
    getUserSessions: vi.fn().mockResolvedValue([mockSession])
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