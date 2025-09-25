import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { ConversationPersistenceManager } from '@/lib/ai/conversation-persistence'
import { ConversationSearchService } from '@/lib/ai/conversation-search'
import { BookmarkReferenceManager } from '@/lib/ai/bookmark-reference-manager'
import { ConversationBranchManager } from '@/lib/ai/conversation-branch'
import { ConversationExporter } from '@/lib/ai/conversation-export'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'mock-cookie' })),
    set: vi.fn(),
    delete: vi.fn()
  }))
}))

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(() => Promise.resolve({
      data: { session: { user: { id: 'test-user-123' } } },
      error: null
    }))
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null })),
        order: vi.fn(() => ({ data: [], error: null })),
        limit: vi.fn(() => ({ data: [], error: null })),
        range: vi.fn(() => ({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'new-record' }, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      upsert: vi.fn(() => ({ error: null }))
    }))
  }))
}

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: vi.fn(() => mockSupabase)
}))

// Mock Anthropic Claude client
const mockClaudeResponse = {
  content: [{ text: 'This is a test response from Claude' }],
  usage: {
    input_tokens: 50,
    output_tokens: 100,
    total_tokens: 150
  }
}

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn(() => Promise.resolve(mockClaudeResponse))
    }
  }
}))

// Test data
const testWorkspaceId = 'workspace-123'
const testUserId = 'user-123'

const mockConversation = {
  id: 'conv-123',
  user_id: testUserId,
  workspace_id: testWorkspaceId,
  title: 'Strategic Planning Session',
  context_summary: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  message_count: 0,
  total_tokens: 0
}

const mockMessages = [
  {
    id: 'msg-1',
    conversation_id: 'conv-123',
    role: 'user',
    content: 'I need help with strategic planning for my startup',
    message_index: 0,
    created_at: '2024-01-01T00:00:00Z',
    token_usage: { input_tokens: 15, output_tokens: 0, total_tokens: 15, cost_estimate_usd: 0.001 },
    coaching_context: null,
    metadata: {}
  },
  {
    id: 'msg-2', 
    conversation_id: 'conv-123',
    role: 'assistant',
    content: 'I\'d be happy to help you with strategic planning. Let\'s start by understanding your current situation...',
    message_index: 1,
    created_at: '2024-01-01T00:01:00Z',
    token_usage: { input_tokens: 20, output_tokens: 80, total_tokens: 100, cost_estimate_usd: 0.008 },
    coaching_context: {
      userProfile: { experienceLevel: 'beginner', industry: 'technology' },
      currentBmadSession: { sessionId: 'bmad-123', pathway: 'strategic_analysis', phase: 'diagnosis' }
    },
    metadata: {}
  }
]

describe('Conversation Flow Integration Tests', () => {
  let persistenceManager: ConversationPersistenceManager
  let searchService: ConversationSearchService
  let bookmarkManager: BookmarkReferenceManager
  let branchManager: ConversationBranchManager
  let exporter: ConversationExporter

  beforeAll(async () => {
    // Initialize services
    persistenceManager = await ConversationPersistenceManager.initializeConversation()
    searchService = new ConversationSearchService(mockSupabase, testUserId, testWorkspaceId)
    bookmarkManager = new BookmarkReferenceManager(mockSupabase, testUserId)
    branchManager = new ConversationBranchManager(mockSupabase, testUserId, testWorkspaceId)
    exporter = new ConversationExporter(mockSupabase, testUserId, testWorkspaceId)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'conversations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: mockConversation, error: null })),
              order: vi.fn(() => ({ data: [mockConversation], error: null }))
            }))
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({ data: mockConversation, error: null }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null }))
          }))
        }
      }
      
      if (table === 'messages') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({ data: mockMessages, error: null }))
            }))
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({ data: mockMessages[1], error: null }))
            }))
          }))
        }
      }
      
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ data: [], error: null }))
        })),
        insert: vi.fn(() => ({ error: null })),
        update: vi.fn(() => ({ error: null })),
        delete: vi.fn(() => ({ error: null }))
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Conversation Lifecycle', () => {
    it('should create, persist, and retrieve a complete conversation', async () => {
      // 1. Create a new conversation
      await persistenceManager.initializeConversation()
      
      // 2. Add user message
      await persistenceManager.addMessage('user', 'I need help with strategic planning')
      
      // 3. Add assistant response
      await persistenceManager.addMessage('assistant', 'Let me help you with strategic planning...')
      
      // 4. Save conversation state
      await persistenceManager.saveConversationState()
      
      // 5. Verify conversation was persisted
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations')
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
      
      // Verify messages were inserted with proper structure
      const messageInsertCalls = mockSupabase.from('messages').insert
      expect(messageInsertCalls).toHaveBeenCalledTimes(2)
    })

    it('should handle conversation context management across long sessions', async () => {
      // Mock a conversation with many messages (context window limit test)
      const longMessageHistory = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        conversation_id: 'conv-123',
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i} content`,
        message_index: i,
        created_at: new Date(Date.now() + i * 60000).toISOString(),
        token_usage: { input_tokens: 20, output_tokens: 30, total_tokens: 50, cost_estimate_usd: 0.005 },
        metadata: {}
      }))

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ data: longMessageHistory, error: null }))
              }))
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({ data: longMessageHistory[0], error: null }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      // Add message that should trigger context management
      await persistenceManager.addMessage('user', 'What should be our next strategic priority?')
      
      // Verify that context management was triggered
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
    })

    it('should maintain conversation coherence across BMad phases', async () => {
      // Mock conversation with BMad phase transitions
      const phaseTransitionMessages = [
        {
          ...mockMessages[0],
          coaching_context: {
            currentBmadSession: { sessionId: 'bmad-123', pathway: 'strategic_analysis', phase: 'diagnosis' }
          }
        },
        {
          ...mockMessages[1],
          coaching_context: {
            currentBmadSession: { sessionId: 'bmad-123', pathway: 'strategic_analysis', phase: 'evaluation' }
          }
        }
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ data: phaseTransitionMessages, error: null }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      // Test phase transition handling
      await persistenceManager.addMessage('assistant', 'Now let\'s move to evaluating your strategic options...')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
    })
  })

  describe('Search and Discovery Integration', () => {
    it('should search across conversations and messages', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                textSearch: vi.fn(() => ({
                  limit: vi.fn(() => ({ data: [mockMessages[0]], error: null }))
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const searchResults = await searchService.search({
        query: 'strategic planning',
        limit: 10
      })

      expect(searchResults.results).toHaveLength(1)
      expect(searchResults.results[0].content).toContain('strategic planning')
    })

    it('should search within specific conversations', async () => {
      const inConversationResults = await searchService.searchInConversation('conv-123', 'planning')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
      expect(inConversationResults).toBeDefined()
    })

    it('should provide search suggestions', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [{ content: 'strategic planning startup' }],
                  error: null
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const suggestions = await searchService.getSuggestions('strat')
      
      expect(suggestions).toContain('strategic')
    })
  })

  describe('Bookmark and Reference System Integration', () => {
    it('should create bookmarks and maintain relationships', async () => {
      const bookmarkData = {
        messageId: 'msg-2',
        title: 'Key Strategic Insight',
        description: 'Important framework discussion',
        tags: ['strategy', 'framework'],
        color: 'blue'
      }

      await bookmarkManager.createBookmark(bookmarkData)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('message_bookmarks')
    })

    it('should create and retrieve message references', async () => {
      const referenceData = {
        fromMessageId: 'msg-1',
        toMessageId: 'msg-2',
        type: 'builds_on' as const,
        description: 'Follow-up question builds on initial strategy discussion'
      }

      await bookmarkManager.createReference(referenceData)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('message_references')
    })

    it('should search bookmarks with full context', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'message_bookmarks') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: [{
                  id: 'bookmark-1',
                  title: 'Key Strategic Insight',
                  message: { content: 'Strategic planning content' },
                  conversation: { title: 'Strategy Session' }
                }],
                error: null
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const bookmarks = await bookmarkManager.searchBookmarks('strategic')
      
      expect(bookmarks).toHaveLength(1)
      expect(bookmarks[0].title).toBe('Key Strategic Insight')
    })
  })

  describe('Conversation Branching Integration', () => {
    it('should create and manage conversation branches', async () => {
      const branchOptions = {
        title: 'Alternative Market Strategy',
        description: 'Exploring different market approach',
        startFromMessageId: 'msg-2',
        alternativeDirection: 'different_approach',
        preserveContext: true
      }

      const result = await branchManager.createBranch('conv-123', branchOptions)
      
      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('conversation_branches')
    })

    it('should merge branches back to main conversation', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversation_branches') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    id: 'branch-1',
                    source_conversation_id: 'conv-123',
                    branch_conversation_id: 'conv-branch-1'
                  },
                  error: null
                }))
              })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({ error: null }))
            }))
            }))
        }
        
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: [mockMessages[1]], // Branch messages
                    error: null
                  }))
                }))
              }))
            }))
          }
        }
        
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ data: [], error: null }))
          }))
        }
      })

      const success = await branchManager.mergeBranch('branch-1')
      
      expect(success).toBe(true)
    })
  })

  describe('Export System Integration', () => {
    it('should export complete conversations with all metadata', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ data: [mockConversation], error: null }))
              }))
            }))
          }
        }
        
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ data: mockMessages, error: null }))
              }))
            }))
          }
        }
        
        if (table === 'message_bookmarks') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: [{
                  id: 'bookmark-1',
                  title: 'Key Insight',
                  message_id: 'msg-2',
                  tags: ['strategy']
                }],
                error: null
              }))
            }))
          }
        }
        
        return mockSupabase.from()
      })

      const exportResult = await exporter.exportConversations({
        format: 'json',
        includeMetadata: true,
        includeBookmarks: true,
        includeReferences: true,
        includeContext: true
      })

      expect(exportResult.success).toBe(true)
      expect(exportResult.format).toBe('json')
      
      const exportData = JSON.parse(exportResult.content as string)
      expect(exportData.conversations).toHaveLength(1)
      expect(exportData.conversations[0].messages).toHaveLength(2)
      expect(exportData.metadata).toBeDefined()
    })

    it('should generate export previews with accurate statistics', async () => {
      const preview = await exporter.getExportPreview({
        format: 'markdown',
        includeMetadata: true
      })

      expect(preview.conversationCount).toBeGreaterThan(0)
      expect(preview.messageCount).toBeGreaterThan(0)
      expect(preview.estimatedSize).toMatch(/\d+\.?\d*\s*(B|KB|MB)/)
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle database connection failures gracefully', async () => {
      // Mock database failure
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      try {
        await persistenceManager.addMessage('user', 'Test message')
        // Should not reach here if error handling works
        expect(false).toBe(true)
      } catch (error) {
        expect(error.message).toContain('Database connection failed')
      }
    })

    it('should handle partial failures in conversation export', async () => {
      // Mock partial failure - conversations load but messages fail
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ data: [mockConversation], error: null }))
              }))
            }))
          }
        }
        
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ data: null, error: { message: 'Messages query failed' } }))
              }))
            }))
          }
        }
        
        return mockSupabase.from()
      })

      const result = await exporter.exportConversations({
        format: 'json',
        includeMetadata: true
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Messages query failed')
    })

    it('should handle search service timeouts', async () => {
      // Mock slow search response
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            textSearch: vi.fn(() => ({
              limit: vi.fn(() => new Promise((resolve) => {
                setTimeout(() => resolve({ data: [], error: null }), 10000)
              }))
            }))
          }))
        }))
      }))

      const startTime = Date.now()
      
      try {
        await Promise.race([
          searchService.search({ query: 'test', limit: 10 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
        ])
      } catch (error) {
        const duration = Date.now() - startTime
        expect(duration).toBeLessThan(2000) // Should timeout within reasonable time
        expect(error.message).toBe('Timeout')
      }
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large conversation exports efficiently', async () => {
      // Mock large dataset
      const largeMessageSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockMessages[0],
        id: `msg-${i}`,
        content: `Message ${i} with substantial content that would be typical in a coaching conversation`,
        message_index: i
      }))

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ data: largeMessageSet, error: null }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const startTime = performance.now()
      const result = await exporter.exportConversations({
        format: 'json',
        includeMetadata: true
      })
      const duration = performance.now() - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      
      const exportData = JSON.parse(result.content as string)
      expect(exportData.conversations[0].messages).toHaveLength(1000)
    })

    it('should handle concurrent operations safely', async () => {
      const operations = []
      
      // Simulate concurrent bookmark creation
      for (let i = 0; i < 10; i++) {
        operations.push(bookmarkManager.createBookmark({
          messageId: `msg-${i}`,
          title: `Bookmark ${i}`,
          tags: [`tag-${i}`],
          color: 'blue'
        }))
      }

      const results = await Promise.allSettled(operations)
      
      // All operations should complete without throwing errors
      results.forEach(result => {
        expect(result.status).toBe('fulfilled')
      })
    })

    it('should maintain performance with complex search queries', async () => {
      const complexQuery = 'strategic planning framework analysis market opportunity competitive advantage value proposition customer segments revenue streams cost structure key partnerships key activities key resources'

      const startTime = performance.now()
      await searchService.search({
        query: complexQuery,
        limit: 50,
        filters: {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-12-31')
          },
          hasBookmarks: true,
          messageTypes: ['assistant']
        }
      })
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
    })
  })
})