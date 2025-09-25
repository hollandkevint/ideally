import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BmadDatabase } from '@/lib/bmad/database';
import { BmadMethodError } from '@/lib/bmad/types';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn()
  }
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient))
}));

describe('BmadDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create session successfully with new_idea pathway', async () => {
      const mockData = { id: 'test-session-id' };
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      });

      const sessionData = {
        userId: 'user-123',
        workspaceId: 'workspace-123',
        pathway: 'new-idea' as const,
        templates: ['template-1'],
        currentPhase: 'context',
        currentTemplate: 'template-1'
      };

      const result = await BmadDatabase.createSession(sessionData);

      expect(result).toBe('test-session-id');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bmad_sessions');
    });

    it('should create session successfully with business_model pathway', async () => {
      const mockData = { id: 'business-session-id' };
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      });

      const sessionData = {
        userId: 'user-456',
        workspaceId: 'workspace-456',
        pathway: 'business-model' as const,
        templates: ['business-template'],
        currentPhase: 'analysis',
        currentTemplate: 'business-template'
      };

      const result = await BmadDatabase.createSession(sessionData);

      expect(result).toBe('business-session-id');
    });

    it('should create session successfully with strategic_optimization pathway', async () => {
      const mockData = { id: 'strategy-session-id' };
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      });

      const sessionData = {
        userId: 'user-789',
        workspaceId: 'workspace-789',
        pathway: 'strategic-optimization' as const,
        templates: ['optimization-template'],
        currentPhase: 'optimization',
        currentTemplate: 'optimization-template'
      };

      const result = await BmadDatabase.createSession(sessionData);

      expect(result).toBe('strategy-session-id');
    });

    it('should validate required fields - userId', async () => {
      const sessionData = {
        userId: '',
        workspaceId: 'workspace-123',
        pathway: 'new-idea' as const,
        templates: ['template-1'],
        currentPhase: 'context',
        currentTemplate: 'template-1'
      };

      await expect(BmadDatabase.createSession(sessionData)).rejects.toThrow(
        'userId and workspaceId are required for session creation'
      );
    });

    it('should validate required fields - pathway', async () => {
      const sessionData = {
        userId: 'user-123',
        workspaceId: 'workspace-123',
        pathway: '' as any,
        templates: ['template-1'],
        currentPhase: 'context',
        currentTemplate: 'template-1'
      };

      await expect(BmadDatabase.createSession(sessionData)).rejects.toThrow(
        'pathway is required for session creation'
      );
    });

    it('should validate required fields - currentPhase', async () => {
      const sessionData = {
        userId: 'user-123',
        workspaceId: 'workspace-123',
        pathway: 'new-idea' as const,
        templates: ['template-1'],
        currentPhase: '',
        currentTemplate: 'template-1'
      };

      await expect(BmadDatabase.createSession(sessionData)).rejects.toThrow(
        'currentPhase and currentTemplate are required for session creation'
      );
    });

    it('should handle empty templates array', async () => {
      const mockData = { id: 'test-session-id' };
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      });

      const sessionData = {
        userId: 'user-123',
        workspaceId: 'workspace-123',
        pathway: 'new-idea' as const,
        templates: [],
        currentPhase: 'context',
        currentTemplate: 'template-1'
      };

      const result = await BmadDatabase.createSession(sessionData);

      expect(result).toBe('test-session-id');
    });

    it('should throw BmadMethodError on database error', async () => {
      const dbError = new Error('Database connection failed');
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: dbError
            })
          })
        })
      });

      const sessionData = {
        userId: 'user-123',
        workspaceId: 'workspace-123',
        pathway: 'new_idea' as const,
        templates: ['template-1'],
        currentPhase: 'context',
        currentTemplate: 'template-1'
      };

      await expect(BmadDatabase.createSession(sessionData)).rejects.toThrow(BmadMethodError);
      await expect(BmadDatabase.createSession(sessionData)).rejects.toThrow('Failed to create BMad session');
    });

    it('should handle unknown errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue('Unknown error')
          })
        })
      });

      const sessionData = {
        userId: 'user-123',
        workspaceId: 'workspace-123', 
        pathway: 'new_idea' as const,
        templates: ['template-1'],
        currentPhase: 'context',
        currentTemplate: 'template-1'
      };

      await expect(BmadDatabase.createSession(sessionData)).rejects.toThrow(BmadMethodError);
    });
  });

  describe('getUserSessions', () => {
    it('should retrieve user sessions successfully', async () => {
      const mockSessions = [
        { id: 'session-1', user_id: 'user-123', status: 'active' },
        { id: 'session-2', user_id: 'user-123', status: 'paused' }
      ];

      // Mock authentication check
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockSessions,
            error: null
          })
        })
      });

      const result = await BmadDatabase.getUserSessions('user-123');

      expect(result).toEqual(mockSessions);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bmad_sessions');
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
    });

    it('should filter by workspaceId when provided', async () => {
      // Mock authentication check
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQueryChain)
      });

      await BmadDatabase.getUserSessions('user-123', 'workspace-123');

      expect(mockQueryChain.eq).toHaveBeenCalledWith('workspace_id', 'workspace-123');
    });

    it('should filter by status when provided', async () => {
      // Mock authentication check
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQueryChain)
      });

      await BmadDatabase.getUserSessions('user-123', undefined, 'active');

      expect(mockQueryChain.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should validate required userId parameter', async () => {
      await expect(BmadDatabase.getUserSessions('')).rejects.toThrow(BmadMethodError);
      await expect(BmadDatabase.getUserSessions('')).rejects.toThrow('Invalid parameters for session retrieval');
    });

    it('should throw authentication error on auth failure', async () => {
      // Mock authentication failure
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      await expect(BmadDatabase.getUserSessions('user-123')).rejects.toThrow(BmadMethodError);
      await expect(BmadDatabase.getUserSessions('user-123')).rejects.toThrow('Authentication required for session retrieval');
    });

    it('should throw RLS policy error on permission denied', async () => {
      // Mock authentication success
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const rlsError = { code: '42501', message: 'permission denied for table bmad_sessions' };
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnValue({
            data: null,
            error: rlsError
          })
        })
      });

      await expect(BmadDatabase.getUserSessions('user-123')).rejects.toThrow(BmadMethodError);
      await expect(BmadDatabase.getUserSessions('user-123')).rejects.toThrow('Database security policy prevented access');
    });

    it('should throw BmadMethodError on database error', async () => {
      // Mock authentication success
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const dbError = new Error('Database query failed');
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnValue({
            data: null,
            error: dbError
          })
        })
      });

      await expect(BmadDatabase.getUserSessions('user-123')).rejects.toThrow(BmadMethodError);
      await expect(BmadDatabase.getUserSessions('user-123')).rejects.toThrow('Failed to retrieve user sessions');
    });
  });
});