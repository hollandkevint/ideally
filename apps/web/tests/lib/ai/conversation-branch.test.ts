import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConversationBranchManager, BranchOptions } from '@/lib/ai/conversation-branch'

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        })),
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      lte: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'branch-123' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      }))
    }))
  }))
}

// Mock ConversationQueries
vi.mock('@/lib/supabase/conversation-queries', () => ({
  ConversationQueries: {
    createConversation: vi.fn(() => Promise.resolve({ id: 'new-conversation-123' })),
    addMessage: vi.fn(() => Promise.resolve({ id: 'new-message-123' }))
  }
}))

const mockSourceMessage = {
  id: 'msg-123',
  content: 'This is the branch point message',
  created_at: '2024-01-01T12:00:00Z',
  conversation: {
    id: 'conv-123',
    title: 'Original Conversation',
    workspace_id: 'workspace-456',
    context_summary: 'Strategic planning discussion',
    bmad_session_id: 'bmad-789',
    metadata: {}
  }
}

const mockMessagesUpToBranch = [
  {
    id: 'msg-1',
    conversation_id: 'conv-123',
    role: 'user',
    content: 'Initial question',
    created_at: '2024-01-01T11:00:00Z',
    message_index: 0,
    token_usage: null,
    coaching_context: null,
    metadata: {}
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-123',
    role: 'assistant', 
    content: 'Initial response',
    created_at: '2024-01-01T11:30:00Z',
    message_index: 1,
    token_usage: null,
    coaching_context: null,
    metadata: {}
  },
  mockSourceMessage
]

describe('ConversationBranchManager', () => {
  let branchManager: ConversationBranchManager

  beforeEach(() => {
    vi.clearAllMocks()
    branchManager = new ConversationBranchManager(mockSupabase as any, 'user-123', 'workspace-456')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createBranch', () => {
    const branchOptions: BranchOptions = {
      title: 'Alternative Strategy Branch',
      description: 'Exploring different market approach',
      startFromMessageId: 'msg-123',
      alternativeDirection: 'different_approach',
      preserveContext: true
    }

    it('should create a new branch successfully', async () => {
      // Mock successful message retrieval
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          const mockReturn = {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockSourceMessage,
                  error: null
                })),
                lte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: mockMessagesUpToBranch,
                    error: null
                  }))
                }))
              }))
            }))
          }
          return mockReturn
        }
        
        if (table === 'conversation_branches') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: { id: 'branch-123' },
                  error: null
                }))
              }))
            }))
          }
        }
        
        return mockSupabase.from()
      })

      const result = await branchManager.createBranch('conv-123', branchOptions)

      expect(result.success).toBe(true)
      expect(result.branchId).toBe('branch-123')
      expect(result.newConversationId).toBe('new-conversation-123')
      expect(result.branchPoint.messageId).toBe('msg-123')
      expect(result.branchPoint.messageIndex).toBe(3)
    })

    it('should handle missing source message', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: { message: 'Message not found' }
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const result = await branchManager.createBranch('conv-123', branchOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Source message not found')
    })

    it('should create branch with context preservation', async () => {
      const { ConversationQueries } = await import('@/lib/supabase/conversation-queries')
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          const mockChain = {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockSourceMessage,
                  error: null
                })),
                lte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: mockMessagesUpToBranch,
                    error: null
                  }))
                }))
              }))
            }))
          }
          return mockChain
        }
        
        if (table === 'conversation_branches') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: { id: 'branch-456' },
                  error: null
                }))
              }))
            }))
          }
        }
        
        return mockSupabase.from()
      })

      const result = await branchManager.createBranch('conv-123', {
        ...branchOptions,
        preserveContext: true
      })

      expect(result.success).toBe(true)
      
      // Should have called addMessage for each message to copy (excluding branch point)
      expect(ConversationQueries.addMessage).toHaveBeenCalledTimes(2)
      
      // Verify the messages were copied with correct metadata
      expect(ConversationQueries.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: 'new-conversation-123',
          role: 'user',
          content: 'Initial question',
          metadata: expect.objectContaining({
            copied_from_branch: true,
            original_message_id: 'msg-1'
          })
        })
      )
    })

    it('should create branch without context preservation', async () => {
      const { ConversationQueries } = await import('@/lib/supabase/conversation-queries')
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockSourceMessage,
                  error: null
                })),
                lte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: mockMessagesUpToBranch,
                    error: null
                  }))
                }))
              }))
            }))
          }
        }
        
        if (table === 'conversation_branches') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: { id: 'branch-789' },
                  error: null
                }))
              }))
            }))
          }
        }
        
        return mockSupabase.from()
      })

      const result = await branchManager.createBranch('conv-123', {
        ...branchOptions,
        preserveContext: false
      })

      expect(result.success).toBe(true)
      
      // Should not have copied any messages
      expect(ConversationQueries.addMessage).not.toHaveBeenCalled()
    })

    it('should handle branch creation errors', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockSourceMessage,
                  error: null
                })),
                lte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: mockMessagesUpToBranch,
                    error: null
                  }))
                }))
              }))
            }))
          }
        }
        
        if (table === 'conversation_branches') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: { message: 'Failed to create branch' }
                }))
              }))
            }))
          }
        }
        
        return mockSupabase.from()
      })

      const result = await branchManager.createBranch('conv-123', branchOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create branch record')
    })
  })

  describe('getBranches', () => {
    const mockBranches = [
      {
        id: 'branch-1',
        source_conversation_id: 'conv-123',
        branch_conversation_id: 'conv-branch-1',
        title: 'Alternative Approach',
        description: 'Exploring different strategy',
        alternative_direction: 'different_approach',
        created_at: '2024-01-01T13:00:00Z',
        branch_conversation: {
          id: 'conv-branch-1',
          title: 'Branch: Alternative Approach',
          updated_at: '2024-01-01T14:00:00Z'
        }
      }
    ]

    it('should retrieve branches for a conversation', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversation_branches') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: mockBranches,
                  error: null
                }))
              }))
            }))
          }
        }
        
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  single: vi.fn(() => ({
                    data: { content: 'Latest message preview', created_at: '2024-01-01T14:00:00Z' },
                    error: null
                  }))
                }))
              })),
              count: 5
            }))
          }
        }
        
        return mockSupabase.from()
      })

      const branches = await branchManager.getBranches('conv-123')

      expect(branches).toHaveLength(1)
      expect(branches[0].id).toBe('branch-1')
      expect(branches[0].title).toBe('Alternative Approach')
      expect(branches[0].messageCount).toBe(5)
      expect(branches[0].preview).toBe('Latest message preview')
      expect(branches[0].lastActivity).toEqual(new Date('2024-01-01T14:00:00Z'))
    })

    it('should handle empty branches list', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      })

      const branches = await branchManager.getBranches('conv-123')

      expect(branches).toHaveLength(0)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      })

      const branches = await branchManager.getBranches('conv-123')

      expect(branches).toHaveLength(0)
    })
  })

  describe('mergeBranch', () => {
    const mockBranch = {
      id: 'branch-1',
      source_conversation_id: 'conv-123',
      branch_conversation_id: 'conv-branch-1',
      metadata: {}
    }

    const mockBranchMessages = [
      {
        id: 'branch-msg-1',
        conversation_id: 'conv-branch-1',
        role: 'user',
        content: 'Branch message 1',
        token_usage: null,
        coaching_context: null,
        metadata: {},
        message_index: 0,
        created_at: '2024-01-01T15:00:00Z'
      },
      {
        id: 'branch-msg-2',
        conversation_id: 'conv-branch-1',
        role: 'assistant',
        content: 'Branch message 2',
        token_usage: null,
        coaching_context: null,
        metadata: {},
        message_index: 1,
        created_at: '2024-01-01T15:30:00Z'
      }
    ]

    it('should merge branch messages back to source conversation', async () => {
      const { ConversationQueries } = await import('@/lib/supabase/conversation-queries')
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversation_branches') {
          const mockChain = {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockBranch,
                  error: null
                }))
              }))
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                error: null
              }))
            }))
          }
          return mockChain
        }
        
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: mockBranchMessages,
                    error: null
                  }))
                }))
              }))
            }))
          }
        }
        
        return mockSupabase.from()
      })

      const success = await branchManager.mergeBranch('branch-1')

      expect(success).toBe(true)
      
      // Should have added each branch message to source conversation
      expect(ConversationQueries.addMessage).toHaveBeenCalledTimes(2)
      
      // Verify messages were added with merge metadata
      expect(ConversationQueries.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: 'conv-123',
          role: 'user',
          content: 'Branch message 1',
          metadata: expect.objectContaining({
            merged_from_branch: 'branch-1',
            original_branch_message_id: 'branch-msg-1'
          })
        })
      )
    })

    it('should handle missing branch during merge', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversation_branches') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: { message: 'Branch not found' }
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const success = await branchManager.mergeBranch('non-existent-branch')

      expect(success).toBe(false)
    })
  })

  describe('deleteBranch', () => {
    const mockBranch = {
      id: 'branch-1',
      branch_conversation_id: 'conv-branch-1'
    }

    it('should delete branch record only', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversation_branches') {
          const mockChain = {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockBranch,
                  error: null
                }))
              }))
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                error: null
              }))
            }))
          }
          return mockChain
        }
        return mockSupabase.from()
      })

      const success = await branchManager.deleteBranch('branch-1', false)

      expect(success).toBe(true)
      
      // Should not have deleted the conversation
      expect(mockSupabase.from).not.toHaveBeenCalledWith('conversations')
    })

    it('should delete branch and conversation', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversation_branches') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockBranch,
                  error: null
                }))
              }))
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                error: null
              }))
            }))
          }
        }
        
        if (table === 'conversations') {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                error: null
              }))
            }))
          }
        }
        
        return mockSupabase.from()
      })

      const success = await branchManager.deleteBranch('branch-1', true)

      expect(success).toBe(true)
    })

    it('should handle branch deletion errors', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversation_branches') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockBranch,
                  error: null
                }))
              }))
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                error: { message: 'Delete failed' }
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const success = await branchManager.deleteBranch('branch-1', false)

      expect(success).toBe(false)
    })
  })

  describe('getBranchStats', () => {
    const mockBranchesForStats = [
      { id: '1', metadata: {} },
      { id: '2', metadata: { merged: true, messages_merged: 5 } },
      { id: '3', metadata: {} },
      { id: '4', metadata: { merged: true, messages_merged: 3 } }
    ]

    it('should calculate accurate branch statistics', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: mockBranchesForStats,
            error: null
          }))
        }))
      })

      const stats = await branchManager.getBranchStats('conv-123')

      expect(stats.totalBranches).toBe(4)
      expect(stats.activeBranches).toBe(2)
      expect(stats.mergedBranches).toBe(2)
      expect(stats.totalMessages).toBe(8) // 5 + 3
    })

    it('should handle empty stats', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })

      const stats = await branchManager.getBranchStats('conv-123')

      expect(stats.totalBranches).toBe(0)
      expect(stats.activeBranches).toBe(0)
      expect(stats.mergedBranches).toBe(0)
      expect(stats.totalMessages).toBe(0)
    })
  })
})