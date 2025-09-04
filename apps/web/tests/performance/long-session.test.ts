import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { performance } from 'perf_hooks'
import { ConversationPersistenceManager } from '@/lib/ai/conversation-persistence'
import { ContextWindowManager } from '@/lib/ai/context-manager'
import { ConversationSummarizer } from '@/lib/ai/conversation-summarizer'
import { ConversationSearchService } from '@/lib/ai/conversation-search'

// Mock Supabase for performance testing
const mockSupabase = {
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
          single: vi.fn(() => ({ data: { id: 'perf-test-record' }, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }))
  }))
}

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: vi.fn(() => mockSupabase)
}))

// Mock Claude API for performance testing
const mockClaudeResponse = {
  content: [{ text: 'This is a performance test response' }],
  usage: {
    input_tokens: 100,
    output_tokens: 200,
    total_tokens: 300
  }
}

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn(() => {
        // Simulate variable response times
        const delay = Math.random() * 200 + 100 // 100-300ms
        return new Promise(resolve => 
          setTimeout(() => resolve(mockClaudeResponse), delay)
        )
      })
    }
  }
}))

// Performance measurement utilities
class PerformanceMetrics {
  private metrics: Record<string, number[]> = {}

  record(name: string, value: number) {
    if (!this.metrics[name]) {
      this.metrics[name] = []
    }
    this.metrics[name].push(value)
  }

  getStats(name: string) {
    const values = this.metrics[name] || []
    if (values.length === 0) return { avg: 0, min: 0, max: 0, p95: 0, p99: 0 }

    const sorted = [...values].sort((a, b) => a - b)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    return { avg, min, max, p95, p99 }
  }

  getAllStats() {
    const result: Record<string, any> = {}
    Object.keys(this.metrics).forEach(name => {
      result[name] = this.getStats(name)
    })
    return result
  }
}

// Test data generators
function generateLongConversation(messageCount: number) {
  const messages = []
  const baseTimestamp = new Date('2024-01-01T10:00:00Z').getTime()

  for (let i = 0; i < messageCount; i++) {
    const isUser = i % 2 === 0
    const timestamp = new Date(baseTimestamp + i * 120000) // 2 minutes between messages

    messages.push({
      id: `msg-${i}`,
      conversation_id: 'perf-test-conv',
      role: isUser ? 'user' : 'assistant',
      content: generateMessageContent(i, isUser),
      message_index: i,
      created_at: timestamp.toISOString(),
      token_usage: {
        input_tokens: isUser ? 20 + Math.floor(Math.random() * 50) : 30,
        output_tokens: isUser ? 0 : 100 + Math.floor(Math.random() * 200),
        total_tokens: isUser ? 20 + Math.floor(Math.random() * 50) : 130 + Math.floor(Math.random() * 200),
        cost_estimate_usd: Math.random() * 0.01
      },
      coaching_context: isUser ? null : {
        userProfile: {
          experienceLevel: 'intermediate',
          industry: 'technology'
        },
        currentBmadSession: {
          sessionId: 'bmad-perf-test',
          pathway: 'strategic_analysis',
          phase: i < 10 ? 'diagnosis' : i < 20 ? 'evaluation' : 'planning'
        }
      },
      metadata: {}
    })
  }

  return messages
}

function generateMessageContent(index: number, isUser: boolean): string {
  if (isUser) {
    const userQuestions = [
      'How can we improve our market position?',
      'What are the key risks we should consider?',
      'Can you help me analyze our competitive advantage?',
      'What strategic options do we have for growth?',
      'How should we prioritize our initiatives?',
      'What market trends should we be aware of?',
      'Can you help me evaluate this business model?',
      'What are the implications of this decision?'
    ]
    return userQuestions[index % userQuestions.length] + ` (Message ${index})`
  } else {
    // Generate substantial assistant responses
    const baseResponse = 'Based on our strategic analysis, I recommend focusing on three key areas: market positioning, competitive differentiation, and operational efficiency.'
    const variations = [
      ' Let\'s explore each of these in detail...',
      ' Consider the following framework for evaluation...',
      ' This approach aligns with your business objectives...',
      ' Here are the specific steps I recommend...',
      ' This analysis reveals important insights...'
    ]
    return baseResponse + variations[index % variations.length] + ` This comprehensive response addresses your question from message ${index}.`
  }
}

describe('Long Session Performance Tests', () => {
  let performanceMetrics: PerformanceMetrics
  let persistenceManager: ConversationPersistenceManager
  let contextManager: ContextWindowManager
  let searchService: ConversationSearchService

  beforeEach(async () => {
    vi.clearAllMocks()
    performanceMetrics = new PerformanceMetrics()
    
    // Initialize services
    persistenceManager = await ConversationPersistenceManager.initializeConversation()
    contextManager = new ContextWindowManager(mockSupabase, 'perf-test-conv')
    searchService = new ConversationSearchService(mockSupabase, 'perf-user', 'perf-workspace')
  })

  afterEach(() => {
    console.log('Performance Metrics:', performanceMetrics.getAllStats())
  })

  describe('Message Processing Performance', () => {
    it('should maintain consistent message processing times over 100 messages', async () => {
      const messageCount = 100
      const maxProcessingTime = 500 // 500ms per message max

      for (let i = 0; i < messageCount; i++) {
        const startTime = performance.now()
        
        await persistenceManager.addMessage(
          i % 2 === 0 ? 'user' : 'assistant',
          `Performance test message ${i} with substantial content to simulate real conversation flow`
        )
        
        const processingTime = performance.now() - startTime
        performanceMetrics.record('message_processing', processingTime)

        expect(processingTime).toBeLessThan(maxProcessingTime)
      }

      const stats = performanceMetrics.getStats('message_processing')
      expect(stats.avg).toBeLessThan(250) // Average should be under 250ms
      expect(stats.p95).toBeLessThan(400) // 95th percentile under 400ms
    })

    it('should handle rapid message sequences without performance degradation', async () => {
      const burstCount = 20
      const maxBurstTime = 5000 // 5 seconds for 20 messages

      const startTime = performance.now()
      
      const promises = []
      for (let i = 0; i < burstCount; i++) {
        promises.push(
          persistenceManager.addMessage(
            i % 2 === 0 ? 'user' : 'assistant',
            `Burst message ${i}`
          )
        )
      }

      await Promise.all(promises)
      
      const totalTime = performance.now() - startTime
      performanceMetrics.record('burst_processing', totalTime)

      expect(totalTime).toBeLessThan(maxBurstTime)
    })
  })

  describe('Context Window Management Performance', () => {
    it('should efficiently manage context window with large conversation history', async () => {
      const longConversation = generateLongConversation(150) // ~5 hours of conversation

      // Mock the database to return our long conversation
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ data: longConversation, error: null }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const startTime = performance.now()
      const contextWindow = await contextManager.getContextWindow()
      const processingTime = performance.now() - startTime

      performanceMetrics.record('context_window_processing', processingTime)

      expect(processingTime).toBeLessThan(2000) // Should complete within 2 seconds
      expect(contextWindow.messages.length).toBeGreaterThan(0)
      expect(contextWindow.totalTokens).toBeLessThan(180000) // Within Claude's context limit
    })

    it('should handle context optimization efficiently', async () => {
      const veryLongConversation = generateLongConversation(300) // ~10 hours

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ data: veryLongConversation, error: null }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const startTime = performance.now()
      const optimizedContext = await contextManager.getContextWindow()
      const optimizationTime = performance.now() - startTime

      performanceMetrics.record('context_optimization', optimizationTime)

      expect(optimizationTime).toBeLessThan(3000) // Should optimize within 3 seconds
      expect(optimizedContext.truncated).toBe(true) // Should have been truncated
      expect(optimizedContext.totalTokens).toBeLessThan(180000)
    })
  })

  describe('Search Performance with Large Datasets', () => {
    it('should maintain search performance with thousands of messages', async () => {
      const largeMessageSet = generateLongConversation(1000)

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                textSearch: vi.fn(() => ({
                  limit: vi.fn(() => {
                    // Simulate database search delay
                    return new Promise(resolve => {
                      setTimeout(() => {
                        const filteredResults = largeMessageSet
                          .filter(msg => msg.content.includes('strategic'))
                          .slice(0, 10)
                        resolve({ data: filteredResults, error: null })
                      }, 50)
                    })
                  })
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const searchQueries = [
        'strategic analysis',
        'market position',
        'competitive advantage',
        'business model',
        'growth strategy'
      ]

      for (const query of searchQueries) {
        const startTime = performance.now()
        
        const results = await searchService.search({
          query,
          limit: 10
        })
        
        const searchTime = performance.now() - startTime
        performanceMetrics.record('search_time', searchTime)

        expect(searchTime).toBeLessThan(1000) // Should complete within 1 second
        expect(results.results).toBeDefined()
      }

      const stats = performanceMetrics.getStats('search_time')
      expect(stats.avg).toBeLessThan(500) // Average search time under 500ms
    })

    it('should handle complex search queries efficiently', async () => {
      const complexQueries = [
        'strategic planning framework market analysis competitive positioning',
        'business model innovation customer segments value proposition',
        'operational efficiency cost optimization resource allocation',
        'risk management market trends industry dynamics competitive intelligence'
      ]

      for (const query of complexQueries) {
        const startTime = performance.now()
        
        await searchService.search({
          query,
          limit: 20,
          filters: {
            dateRange: {
              start: new Date('2024-01-01'),
              end: new Date('2024-12-31')
            },
            messageTypes: ['assistant'],
            hasBookmarks: true
          }
        })
        
        const queryTime = performance.now() - startTime
        performanceMetrics.record('complex_search', queryTime)

        expect(queryTime).toBeLessThan(1500) // Complex queries under 1.5 seconds
      }
    })
  })

  describe('Memory Usage and Garbage Collection', () => {
    it('should not have memory leaks during long sessions', async () => {
      // Monitor memory usage during extended operations
      const initialMemory = process.memoryUsage()

      // Simulate 2 hours of intensive conversation processing
      for (let session = 0; session < 10; session++) {
        const sessionMessages = generateLongConversation(50)
        
        for (const message of sessionMessages) {
          await persistenceManager.addMessage(
            message.role as 'user' | 'assistant',
            message.content
          )
        }

        // Force garbage collection periodically
        if (global.gc) {
          global.gc()
        }

        const currentMemory = process.memoryUsage()
        const memoryGrowth = currentMemory.heapUsed - initialMemory.heapUsed
        
        performanceMetrics.record('memory_usage', memoryGrowth)

        // Memory growth should be reasonable (< 100MB)
        expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024)
      }
    })

    it('should clean up resources properly after conversation completion', async () => {
      const beforeCleanup = process.memoryUsage()

      // Create and complete multiple conversation sessions
      for (let i = 0; i < 5; i++) {
        const sessionManager = await ConversationPersistenceManager.initializeConversation()
        const sessionMessages = generateLongConversation(30)

        for (const message of sessionMessages) {
          await sessionManager.addMessage(
            message.role as 'user' | 'assistant',
            message.content
          )
        }

        await sessionManager.saveConversationState()
      }

      // Force cleanup
      if (global.gc) {
        global.gc()
      }

      const afterCleanup = process.memoryUsage()
      const memoryDifference = afterCleanup.heapUsed - beforeCleanup.heapUsed

      // Should not retain excessive memory
      expect(memoryDifference).toBeLessThan(50 * 1024 * 1024) // < 50MB
    })
  })

  describe('Database Connection Pool Performance', () => {
    it('should handle concurrent database operations efficiently', async () => {
      const concurrentOperations = 20
      const maxOperationTime = 2000 // 2 seconds for all operations

      const startTime = performance.now()
      
      const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
        return persistenceManager.addMessage(
          i % 2 === 0 ? 'user' : 'assistant',
          `Concurrent operation message ${i}`
        )
      })

      await Promise.all(operations)
      
      const totalTime = performance.now() - startTime
      performanceMetrics.record('concurrent_operations', totalTime)

      expect(totalTime).toBeLessThan(maxOperationTime)
    })

    it('should maintain performance under high load', async () => {
      const highLoadOperations = 100
      const batchSize = 10

      for (let batch = 0; batch < highLoadOperations / batchSize; batch++) {
        const batchStartTime = performance.now()
        
        const batchOperations = Array.from({ length: batchSize }, async (_, i) => {
          const messageIndex = batch * batchSize + i
          return persistenceManager.addMessage(
            messageIndex % 2 === 0 ? 'user' : 'assistant',
            `High load message ${messageIndex}`
          )
        })

        await Promise.all(batchOperations)
        
        const batchTime = performance.now() - batchStartTime
        performanceMetrics.record('high_load_batch', batchTime)

        expect(batchTime).toBeLessThan(1000) // Each batch under 1 second
      }

      const stats = performanceMetrics.getStats('high_load_batch')
      expect(stats.avg).toBeLessThan(500) // Average batch time under 500ms
    })
  })

  describe('Long Session Scenarios', () => {
    it('should simulate and measure 30-minute coaching session performance', async () => {
      const sessionStartTime = performance.now()
      
      // Simulate a 30-minute session with realistic message frequency
      // Assuming 1 exchange (user + assistant) every 2 minutes = 15 exchanges
      const exchangeCount = 15
      const messagesPerExchange = 2

      for (let exchange = 0; exchange < exchangeCount; exchange++) {
        const exchangeStart = performance.now()
        
        // User message
        await persistenceManager.addMessage(
          'user',
          `This is exchange ${exchange + 1}. ${generateMessageContent(exchange * 2, true)}`
        )

        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 100))

        // Assistant response
        await persistenceManager.addMessage(
          'assistant',
          `Response to exchange ${exchange + 1}. ${generateMessageContent(exchange * 2 + 1, false)}`
        )

        const exchangeTime = performance.now() - exchangeStart
        performanceMetrics.record('exchange_time', exchangeTime)

        // Simulate user reading/thinking time
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      await persistenceManager.saveConversationState()
      
      const totalSessionTime = performance.now() - sessionStartTime
      performanceMetrics.record('total_session_time', totalSessionTime)

      // Verify session completed efficiently
      expect(totalSessionTime).toBeLessThan(30000) // Should complete within 30 seconds test time
      
      const exchangeStats = performanceMetrics.getStats('exchange_time')
      expect(exchangeStats.avg).toBeLessThan(1000) // Average exchange under 1 second
      expect(exchangeStats.p95).toBeLessThan(1500) // 95% of exchanges under 1.5 seconds
    })

    it('should handle session context management over extended time', async () => {
      // Simulate context management challenges in long sessions
      const longSessionMessages = generateLongConversation(60) // 2-hour session

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ data: longSessionMessages, error: null }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      // Test context window management at different points in the session
      const testPoints = [10, 20, 30, 40, 50, 60] // Minutes into session

      for (const point of testPoints) {
        const startTime = performance.now()
        
        const contextWindow = await contextManager.getContextWindow()
        
        const processingTime = performance.now() - startTime
        performanceMetrics.record(`context_at_${point}min`, processingTime)

        expect(processingTime).toBeLessThan(2000) // Context processing under 2 seconds
        expect(contextWindow.totalTokens).toBeLessThan(180000) // Within limits
      }

      // Verify context management doesn't degrade over time
      const contextTimes = testPoints.map(point => 
        performanceMetrics.getStats(`context_at_${point}min`).avg
      )

      const maxContextTime = Math.max(...contextTimes)
      const minContextTime = Math.min(...contextTimes)
      const performanceDegradation = (maxContextTime - minContextTime) / minContextTime

      expect(performanceDegradation).toBeLessThan(0.5) // Less than 50% degradation
    })
  })
})