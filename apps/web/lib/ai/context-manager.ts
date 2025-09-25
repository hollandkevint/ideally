import { MessageRow, ConversationContextRow } from '@/lib/supabase/conversation-schema'
import { ConversationQueries } from '@/lib/supabase/conversation-queries'

export interface ContextWindow {
  messages: MessageRow[]
  contextSummaries: ConversationContextRow[]
  totalTokens: number
  truncated: boolean
}

export interface ContextWindowOptions {
  maxTokens?: number
  maxMessages?: number
  keepRecentCount?: number
  includeSystemPrompt?: boolean
}

export class ContextWindowManager {
  private static readonly DEFAULT_MAX_TOKENS = 180000 // Leave buffer for response
  private static readonly DEFAULT_MAX_MESSAGES = 100
  private static readonly DEFAULT_KEEP_RECENT = 20
  private static readonly TOKENS_PER_MESSAGE_ESTIMATE = 150 // Conservative estimate

  constructor(
    private conversationId: string,
    private options: ContextWindowOptions = {}
  ) {}

  /**
   * Get optimized context window for the conversation
   */
  async getContextWindow(): Promise<ContextWindow> {
    const maxTokens = this.options.maxTokens || ContextWindowManager.DEFAULT_MAX_TOKENS
    const maxMessages = this.options.maxMessages || ContextWindowManager.DEFAULT_MAX_MESSAGES
    const keepRecentCount = this.options.keepRecentCount || ContextWindowManager.DEFAULT_KEEP_RECENT

    // Get recent messages first (most important)
    const recentMessages = await ConversationQueries.getRecentMessages(
      this.conversationId, 
      keepRecentCount
    )

    // Get available context summaries
    const contextSummaries = await ConversationQueries.getConversationContext(
      this.conversationId
    )

    // Calculate token usage
    let currentTokens = this.estimateTokens(recentMessages, contextSummaries)
    let messages = recentMessages
    let truncated = false

    // If we're over the limit, we need to manage the context
    if (currentTokens > maxTokens || messages.length > maxMessages) {
      const optimizedWindow = await this.optimizeContextWindow(
        recentMessages,
        contextSummaries,
        maxTokens,
        maxMessages
      )
      
      messages = optimizedWindow.messages
      currentTokens = optimizedWindow.totalTokens
      truncated = optimizedWindow.truncated
    }

    return {
      messages,
      contextSummaries: contextSummaries.filter(ctx => 
        ctx.context_type === 'summary' || ctx.context_type === 'key_insight'
      ),
      totalTokens: currentTokens,
      truncated
    }
  }

  /**
   * Optimize context window when over limits
   */
  private async optimizeContextWindow(
    recentMessages: MessageRow[],
    contextSummaries: ConversationContextRow[],
    maxTokens: number,
    maxMessages: number
  ): Promise<{messages: MessageRow[], totalTokens: number, truncated: boolean}> {
    
    // Strategy 1: Use recent messages + summaries
    const summaryTokens = this.estimateContextTokens(contextSummaries)
    const availableForMessages = maxTokens - summaryTokens
    
    let selectedMessages: MessageRow[] = []
    let runningTokens = 0
    let truncated = false

    // Always include the most recent messages (reverse iterate to keep newest)
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const message = recentMessages[i]
      const messageTokens = this.estimateMessageTokens(message)
      
      if (runningTokens + messageTokens <= availableForMessages && 
          selectedMessages.length < maxMessages) {
        selectedMessages.unshift(message)
        runningTokens += messageTokens
      } else {
        truncated = true
        break
      }
    }

    // If we have very few messages, try to get more from history
    if (selectedMessages.length < 10 && !truncated) {
      const olderMessages = await this.getOlderMessages(
        selectedMessages[0]?.message_index || 0,
        availableForMessages - runningTokens,
        maxMessages - selectedMessages.length
      )
      
      selectedMessages = [...olderMessages, ...selectedMessages]
      runningTokens += this.estimateTokens(olderMessages, [])
    }

    return {
      messages: selectedMessages,
      totalTokens: runningTokens + summaryTokens,
      truncated: truncated || selectedMessages.length < recentMessages.length
    }
  }

  /**
   * Get older messages to fill context window
   */
  private async getOlderMessages(
    beforeIndex: number,
    availableTokens: number,
    maxCount: number
  ): Promise<MessageRow[]> {
    const messages = await ConversationQueries.getConversationMessages(
      this.conversationId,
      maxCount * 2, // Get extra to have selection room
      beforeIndex
    )

    const selected: MessageRow[] = []
    let runningTokens = 0

    // Select messages that fit in available tokens
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      const messageTokens = this.estimateMessageTokens(message)
      
      if (runningTokens + messageTokens <= availableTokens && 
          selected.length < maxCount) {
        selected.unshift(message)
        runningTokens += messageTokens
      }
    }

    return selected
  }

  /**
   * Estimate token count for messages and context
   */
  private estimateTokens(messages: MessageRow[], contextSummaries: ConversationContextRow[]): number {
    const messageTokens = messages.reduce((sum, msg) => 
      sum + this.estimateMessageTokens(msg), 0
    )
    const contextTokens = this.estimateContextTokens(contextSummaries)
    return messageTokens + contextTokens
  }

  /**
   * Estimate tokens for a single message
   */
  private estimateMessageTokens(message: MessageRow): number {
    // Use actual token count from metadata if available
    if (message.metadata?.tokens_used) {
      return message.metadata.tokens_used
    }
    
    // Fallback to character-based estimation
    // Roughly 4 characters per token for English text
    const characterCount = message.content.length + (message.role === 'user' ? 20 : 30) // Role overhead
    return Math.ceil(characterCount / 4)
  }

  /**
   * Estimate tokens for context summaries
   */
  private estimateContextTokens(contextSummaries: ConversationContextRow[]): number {
    return contextSummaries.reduce((sum, ctx) => {
      const characterCount = ctx.content.length + 50 // Metadata overhead
      return sum + Math.ceil(characterCount / 4)
    }, 0)
  }

  /**
   * Check if context window needs optimization
   */
  async needsOptimization(): Promise<boolean> {
    const conversation = await ConversationQueries.getConversation(this.conversationId)
    if (!conversation) return false

    const maxTokens = this.options.maxTokens || ContextWindowManager.DEFAULT_MAX_TOKENS
    const maxMessages = this.options.maxMessages || ContextWindowManager.DEFAULT_MAX_MESSAGES

    return conversation.total_tokens > maxTokens || 
           conversation.message_count > maxMessages
  }

  /**
   * Get context window statistics
   */
  async getStats(): Promise<{
    totalMessages: number
    totalTokens: number
    contextSummaries: number
    estimatedWindowTokens: number
    needsOptimization: boolean
  }> {
    const conversation = await ConversationQueries.getConversation(this.conversationId)
    const contextSummaries = await ConversationQueries.getConversationContext(this.conversationId)
    const contextWindow = await this.getContextWindow()

    return {
      totalMessages: conversation?.message_count || 0,
      totalTokens: conversation?.total_tokens || 0,
      contextSummaries: contextSummaries.length,
      estimatedWindowTokens: contextWindow.totalTokens,
      needsOptimization: await this.needsOptimization()
    }
  }
}

/**
 * Factory function for creating context window managers
 */
export function createContextWindow(
  conversationId: string, 
  options?: ContextWindowOptions
): ContextWindowManager {
  return new ContextWindowManager(conversationId, options)
}

/**
 * Utility function to format context window for Claude API
 */
export function formatContextForClaude(contextWindow: ContextWindow): Array<{
  role: 'user' | 'assistant'
  content: string
}> {
  const claudeMessages: Array<{role: 'user' | 'assistant', content: string}> = []

  // Add context summaries as system context
  if (contextWindow.contextSummaries.length > 0) {
    const summaryContent = contextWindow.contextSummaries
      .map(ctx => `[${ctx.context_type.toUpperCase()}] ${ctx.content}`)
      .join('\n\n')
    
    claudeMessages.push({
      role: 'assistant',
      content: `Previous conversation context:\n\n${summaryContent}`
    })
  }

  // Add conversation messages
  contextWindow.messages.forEach(message => {
    claudeMessages.push({
      role: message.role,
      content: message.content
    })
  })

  return claudeMessages
}