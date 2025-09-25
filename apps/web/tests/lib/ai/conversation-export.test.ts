import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConversationExporter } from '@/lib/ai/conversation-export'

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }))
}

// Mock data
const mockConversations = [
  {
    id: '1',
    title: 'Strategic Planning Session',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T01:00:00Z'
  }
]

const mockMessages = [
  {
    id: 'msg-1',
    conversation_id: '1',
    role: 'user',
    content: 'How can I improve my business strategy?',
    created_at: '2024-01-01T00:00:00Z',
    message_index: 0,
    token_usage: { input_tokens: 10, output_tokens: 0, total_tokens: 10, cost_estimate_usd: 0.001 }
  },
  {
    id: 'msg-2',
    conversation_id: '1',
    role: 'assistant',
    content: 'Let me help you explore strategic improvements...',
    created_at: '2024-01-01T00:05:00Z',
    message_index: 1,
    token_usage: { input_tokens: 15, output_tokens: 50, total_tokens: 65, cost_estimate_usd: 0.005 }
  }
]

const mockBookmarks = [
  {
    id: 'bm-1',
    message_id: 'msg-2',
    title: 'Key Strategic Insight',
    description: 'Important strategic framework discussion',
    tags: ['strategy', 'framework'],
    color: 'blue'
  }
]

describe('ConversationExporter', () => {
  let exporter: ConversationExporter

  beforeEach(() => {
    vi.clearAllMocks()
    exporter = new ConversationExporter(mockSupabase as any, 'user-123', 'workspace-456')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('JSON Export', () => {
    it('should export conversations as JSON with all metadata', async () => {
      // Mock the database queries
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: mockConversations,
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
                  data: mockMessages,
                  error: null
                }))
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }
      })

      const options = {
        format: 'json' as const,
        includeMetadata: true,
        includeBookmarks: true,
        includeReferences: true,
        includeContext: true
      }

      const result = await exporter.exportConversations(options)

      expect(result.success).toBe(true)
      expect(result.format).toBe('json')
      expect(result.filename).toMatch(/conversations_.*\.json/)
      
      const content = JSON.parse(result.content as string)
      expect(content.conversations).toHaveLength(1)
      expect(content.conversations[0].id).toBe('1')
      expect(content.conversations[0].messages).toHaveLength(2)
      expect(content.metadata).toBeDefined()
      expect(content.metadata.totalConversations).toBe(1)
      expect(content.metadata.totalMessages).toBe(2)
    })

    it('should handle empty conversation data gracefully', async () => {
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

      const options = {
        format: 'json' as const,
        includeMetadata: true
      }

      const result = await exporter.exportConversations(options)

      expect(result.success).toBe(true)
      const content = JSON.parse(result.content as string)
      expect(content.conversations).toHaveLength(0)
      expect(content.metadata.totalConversations).toBe(0)
      expect(content.metadata.totalMessages).toBe(0)
    })
  })

  describe('CSV Export', () => {
    it('should export conversations as CSV with proper formatting', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: mockConversations,
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
                  data: mockMessages,
                  error: null
                }))
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }
      })

      const options = {
        format: 'csv' as const,
        includeMetadata: true
      }

      const result = await exporter.exportConversations(options)

      expect(result.success).toBe(true)
      expect(result.format).toBe('csv')
      expect(result.filename).toMatch(/conversations_.*\.csv/)
      
      const content = result.content as string
      expect(content).toContain('conversation_id,message_id,role,content,timestamp')
      expect(content).toContain('How can I improve my business strategy?')
      expect(content).toContain('Let me help you explore strategic improvements...')
    })

    it('should properly escape CSV special characters', async () => {
      const messagesWithSpecialChars = [
        {
          ...mockMessages[0],
          content: 'Question with "quotes" and, commas'
        },
        {
          ...mockMessages[1],
          content: 'Response with\nnewlines and "quotes"'
        }
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: messagesWithSpecialChars,
                  error: null
                }))
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: table === 'conversations' ? mockConversations : [],
                error: null
              }))
            }))
          }))
        }
      })

      const options = {
        format: 'csv' as const,
        includeMetadata: true
      }

      const result = await exporter.exportConversations(options)
      const content = result.content as string
      
      // Check that quotes are properly escaped
      expect(content).toContain('\"Question with \"\"quotes\"\" and, commas\"')
      expect(content).toContain('\"Response with\nnewlines and \"\"quotes\"\"\"')
    })
  })

  describe('Markdown Export', () => {
    it('should export conversations as properly formatted Markdown', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: mockConversations,
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
                  data: mockMessages,
                  error: null
                }))
              }))
            }))
          }
        }
        if (table === 'message_bookmarks') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: mockBookmarks,
                error: null
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }
      })

      const options = {
        format: 'markdown' as const,
        includeMetadata: true,
        includeBookmarks: true
      }

      const result = await exporter.exportConversations(options)

      expect(result.success).toBe(true)
      expect(result.format).toBe('markdown')
      expect(result.filename).toMatch(/conversations_.*\.md/)
      
      const content = result.content as string
      expect(content).toContain('# Strategic Planning Session')
      expect(content).toContain('## User')
      expect(content).toContain('## Mary (Assistant)')
      expect(content).toContain('**🔖 Key Strategic Insight**')
      expect(content).toContain('How can I improve my business strategy?')
    })
  })

  describe('Export Preview', () => {
    it('should generate accurate export preview statistics', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: mockConversations,
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
                data: mockMessages,
                error: null,
                count: mockMessages.length
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }
      })

      const options = {
        format: 'json' as const,
        includeMetadata: true
      }

      const preview = await exporter.getExportPreview(options)

      expect(preview.conversationCount).toBe(1)
      expect(preview.messageCount).toBe(2)
      expect(preview.estimatedSize).toBeDefined()
      expect(preview.dateRange).toBeDefined()
      expect(new Date(preview.dateRange!.start)).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(new Date(preview.dateRange!.end)).toEqual(new Date('2024-01-01T00:05:00Z'))
    })

    it('should calculate estimated file sizes accurately', async () => {
      const largeMessages = Array.from({ length: 100 }, (_, i) => ({
        ...mockMessages[0],
        id: `msg-${i}`,
        content: 'A'.repeat(1000), // 1KB per message
        message_index: i
      }))

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: largeMessages,
                error: null,
                count: largeMessages.length
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: table === 'conversations' ? mockConversations : [],
                error: null
              }))
            }))
          }))
        }
      })

      const options = {
        format: 'json' as const,
        includeMetadata: true
      }

      const preview = await exporter.getExportPreview(options)

      expect(preview.messageCount).toBe(100)
      expect(preview.estimatedSize).toMatch(/\d+\.?\d*\s*(KB|MB)/)
      
      // Should be at least 100KB given the content size
      const sizeMatch = preview.estimatedSize.match(/(\d+\.?\d*)\s*(KB|MB)/)
      if (sizeMatch) {
        const [, size, unit] = sizeMatch
        const sizeInKB = unit === 'MB' ? parseFloat(size) * 1024 : parseFloat(size)
        expect(sizeInKB).toBeGreaterThan(50) // Allow for JSON overhead
      }
    })
  })

  describe('Date Range Filtering', () => {
    it('should filter conversations by date range', async () => {
      const messagesWithDifferentDates = [
        {
          ...mockMessages[0],
          created_at: '2024-01-01T00:00:00Z' // Include
        },
        {
          ...mockMessages[1],
          created_at: '2024-01-05T00:00:00Z' // Exclude
        }
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      data: [messagesWithDifferentDates[0]], // Only the first message
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockConversations,
                error: null
              }))
            }))
          }))
        }
      })

      const options = {
        format: 'json' as const,
        includeMetadata: true,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-02')
        }
      }

      const result = await exporter.exportConversations(options)

      expect(result.success).toBe(true)
      const content = JSON.parse(result.content as string)
      expect(content.conversations[0].messages).toHaveLength(1)
      expect(content.conversations[0].messages[0].created_at).toBe('2024-01-01T00:00:00Z')
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: null,
              error: { message: 'Database connection failed' }
            }))
          }))
        }))
      })

      const options = {
        format: 'json' as const,
        includeMetadata: true
      }

      const result = await exporter.exportConversations(options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database connection failed')
    })

    it('should validate export options', async () => {
      const options = {
        format: 'invalid' as any,
        includeMetadata: true
      }

      const result = await exporter.exportConversations(options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unsupported export format')
    })

    it('should handle missing conversation data', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'conversations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [],
                  error: null
                }))
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }
      })

      const options = {
        format: 'json' as const,
        includeMetadata: true
      }

      const result = await exporter.exportConversations(options)

      expect(result.success).toBe(true)
      const content = JSON.parse(result.content as string)
      expect(content.conversations).toHaveLength(0)
      expect(content.metadata.exportedAt).toBeDefined()
    })
  })
})