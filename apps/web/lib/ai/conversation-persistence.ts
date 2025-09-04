import { ConversationQueries } from '@/lib/supabase/conversation-queries'
import { ConversationRow, ConversationInsert, MessageInsert } from '@/lib/supabase/conversation-schema'
import { createContextWindow } from './context-manager'
import { createConversationSummarizer } from './conversation-summarizer'

export interface ConversationSession {
  conversationId: string
  workspaceId: string
  bmadSessionId?: string
  lastActivity: Date
  messageCount: number
  isActive: boolean
}

export interface PersistenceOptions {
  autoSave?: boolean
  saveInterval?: number // milliseconds
  maxInactivityTime?: number // milliseconds before marking inactive
}

export class ConversationPersistenceManager {
  private static readonly DEFAULT_SAVE_INTERVAL = 30000 // 30 seconds
  private static readonly DEFAULT_INACTIVITY_TIME = 300000 // 5 minutes
  
  private saveTimer: NodeJS.Timeout | null = null
  private lastActivity: Date = new Date()
  private pendingMessages: MessageInsert[] = []

  constructor(
    private conversationId: string,
    private userId: string,
    private workspaceId: string,
    private options: PersistenceOptions = {}
  ) {
    this.startAutoSave()
  }

  /**
   * Start auto-save timer for conversation persistence
   */
  private startAutoSave(): void {
    if (this.options.autoSave === false) return

    const interval = this.options.saveInterval || ConversationPersistenceManager.DEFAULT_SAVE_INTERVAL

    this.saveTimer = setInterval(async () => {
      await this.saveConversationState()
    }, interval)
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
      this.saveTimer = null
    }
  }

  /**
   * Initialize or restore a conversation session
   */
  static async initializeConversation(
    userId: string,
    workspaceId: string,
    bmadSessionId?: string,
    existingConversationId?: string
  ): Promise<ConversationPersistenceManager> {
    let conversationId: string

    if (existingConversationId) {
      // Restore existing conversation
      const conversation = await ConversationQueries.getConversation(existingConversationId)
      if (!conversation) {
        throw new Error('Conversation not found')
      }
      conversationId = existingConversationId
    } else {
      // Create new conversation
      const newConversation: ConversationInsert = {
        user_id: userId,
        workspace_id: workspaceId,
        bmad_session_id: bmadSessionId,
        title: 'Strategic Coaching Session',
        message_count: 0,
        total_tokens: 0
      }
      
      const conversation = await ConversationQueries.createConversation(newConversation)
      conversationId = conversation.id
    }

    return new ConversationPersistenceManager(conversationId, userId, workspaceId)
  }

  /**
   * Add message to conversation (queued for batch save)
   */
  async addMessage(
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ): Promise<void> {
    // Get current message count for indexing
    const conversation = await ConversationQueries.getConversation(this.conversationId)
    const messageIndex = (conversation?.message_count || 0) + this.pendingMessages.length

    const message: MessageInsert = {
      conversation_id: this.conversationId,
      role,
      content,
      metadata: metadata || {},
      message_index: messageIndex
    }

    this.pendingMessages.push(message)
    this.markActivity()

    // Save immediately for assistant messages (end of exchange)
    if (role === 'assistant') {
      await this.savePendingMessages()
    }
  }

  /**
   * Save pending messages to database
   */
  async savePendingMessages(): Promise<void> {
    if (this.pendingMessages.length === 0) return

    try {
      // Save all pending messages
      for (const message of this.pendingMessages) {
        await ConversationQueries.addMessage(message)
      }

      this.pendingMessages = []
      
      // Update conversation metadata
      await this.updateConversationMetadata()
      
    } catch (error) {
      console.error('Failed to save pending messages:', error)
      throw error
    }
  }

  /**
   * Save complete conversation state
   */
  async saveConversationState(): Promise<void> {
    try {
      // Save any pending messages first
      await this.savePendingMessages()
      
      // Update last activity timestamp
      await ConversationQueries.updateConversation(this.conversationId, {
        updated_at: this.lastActivity.toISOString()
      })

      // Check if conversation needs summarization
      const summarizer = createConversationSummarizer(this.conversationId)
      if (await summarizer.needsSummarization()) {
        await summarizer.autoSummarize()
      }

    } catch (error) {
      console.error('Failed to save conversation state:', error)
    }
  }

  /**
   * Restore conversation from database
   */
  async restoreConversation(): Promise<{
    messages: any[]
    context: any
    metadata: ConversationRow
  }> {
    const conversation = await ConversationQueries.getConversation(this.conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Get optimized context window
    const contextManager = createContextWindow(this.conversationId)
    const contextWindow = await contextManager.getContextWindow()

    return {
      messages: contextWindow.messages,
      context: {
        summaries: contextWindow.contextSummaries,
        totalTokens: contextWindow.totalTokens,
        truncated: contextWindow.truncated
      },
      metadata: conversation
    }
  }

  /**
   * Get active conversation sessions for a user
   */
  static async getActiveSessions(
    userId: string,
    workspaceId?: string
  ): Promise<ConversationSession[]> {
    const conversations = await ConversationQueries.getUserConversations(
      userId,
      workspaceId,
      20
    )

    const inactivityThreshold = new Date(
      Date.now() - ConversationPersistenceManager.DEFAULT_INACTIVITY_TIME
    )

    return conversations.map(conv => ({
      conversationId: conv.id,
      workspaceId: conv.workspace_id,
      bmadSessionId: conv.bmad_session_id || undefined,
      lastActivity: new Date(conv.updated_at),
      messageCount: conv.message_count,
      isActive: new Date(conv.updated_at) > inactivityThreshold
    }))
  }

  /**
   * Archive old conversation
   */
  static async archiveConversation(conversationId: string): Promise<void> {
    // Update conversation title to include archive status
    const conversation = await ConversationQueries.getConversation(conversationId)
    if (conversation) {
      await ConversationQueries.updateConversation(conversationId, {
        title: `[Archived] ${conversation.title || 'Strategic Coaching Session'}`
      })
    }
  }

  /**
   * Delete conversation and all associated data
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    await ConversationQueries.deleteConversation(conversationId)
  }

  /**
   * Export conversation data
   */
  async exportConversation(): Promise<{
    metadata: ConversationRow
    messages: any[]
    contextSummaries: any[]
  }> {
    const conversation = await ConversationQueries.getConversation(this.conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    const messages = await ConversationQueries.getConversationMessages(this.conversationId)
    const contextSummaries = await ConversationQueries.getConversationContext(this.conversationId)

    return {
      metadata: conversation,
      messages,
      contextSummaries
    }
  }

  /**
   * Import conversation data (for migration or backup restore)
   */
  static async importConversation(
    conversationData: any,
    userId: string,
    workspaceId: string
  ): Promise<string> {
    // Create new conversation
    const conversationInsert: ConversationInsert = {
      user_id: userId,
      workspace_id: workspaceId,
      title: conversationData.metadata.title || 'Imported Conversation',
      bmad_session_id: conversationData.metadata.bmad_session_id,
      message_count: conversationData.messages.length,
      total_tokens: conversationData.metadata.total_tokens || 0
    }

    const conversation = await ConversationQueries.createConversation(conversationInsert)

    // Import messages
    for (const messageData of conversationData.messages) {
      const message: MessageInsert = {
        conversation_id: conversation.id,
        role: messageData.role,
        content: messageData.content,
        metadata: messageData.metadata,
        message_index: messageData.message_index
      }

      await ConversationQueries.addMessage(message)
    }

    // Import context summaries
    for (const contextData of conversationData.contextSummaries) {
      await ConversationQueries.addConversationContext({
        conversation_id: conversation.id,
        context_type: contextData.context_type,
        content: contextData.content,
        tokens_saved: contextData.tokens_saved || 0,
        message_range_start: contextData.message_range_start,
        message_range_end: contextData.message_range_end
      })
    }

    return conversation.id
  }

  /**
   * Mark activity to track conversation usage
   */
  markActivity(): void {
    this.lastActivity = new Date()
  }

  /**
   * Update conversation metadata
   */
  private async updateConversationMetadata(): Promise<void> {
    const conversation = await ConversationQueries.getConversation(this.conversationId)
    if (!conversation) return

    // Calculate total tokens from messages if needed
    const messages = await ConversationQueries.getConversationMessages(this.conversationId)
    const totalTokens = messages.reduce((sum, msg) => {
      return sum + (msg.metadata?.tokens_used || 0)
    }, 0)

    await ConversationQueries.updateConversation(this.conversationId, {
      message_count: messages.length,
      total_tokens: totalTokens,
      updated_at: this.lastActivity.toISOString()
    })
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(): Promise<{
    messageCount: number
    totalTokens: number
    duration: number
    lastActivity: Date
    contextSummaries: number
  }> {
    const stats = await ConversationQueries.getConversationStats(this.conversationId)
    const contextSummaries = await ConversationQueries.getConversationContext(this.conversationId)

    return {
      messageCount: stats.messageCount,
      totalTokens: stats.totalTokens,
      duration: stats.duration,
      lastActivity: this.lastActivity,
      contextSummaries: contextSummaries.length
    }
  }

  /**
   * Check if conversation is active
   */
  isActive(): boolean {
    const inactivityThreshold = this.options.maxInactivityTime || 
                              ConversationPersistenceManager.DEFAULT_INACTIVITY_TIME
    
    return (Date.now() - this.lastActivity.getTime()) < inactivityThreshold
  }

  /**
   * Cleanup - save final state and stop auto-save
   */
  async cleanup(): Promise<void> {
    await this.saveConversationState()
    this.stopAutoSave()
  }

  // Getters
  get id(): string {
    return this.conversationId
  }

  get workspace(): string {
    return this.workspaceId
  }

  get user(): string {
    return this.userId
  }
}

/**
 * Browser session storage utilities for offline resilience
 */
export class ConversationSessionStorage {
  private static readonly STORAGE_KEY_PREFIX = 'conversation_'

  /**
   * Save conversation state to browser storage
   */
  static saveToSessionStorage(
    conversationId: string,
    state: any
  ): void {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}${conversationId}`
      sessionStorage.setItem(key, JSON.stringify({
        ...state,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn('Failed to save conversation to session storage:', error)
    }
  }

  /**
   * Load conversation state from browser storage
   */
  static loadFromSessionStorage(conversationId: string): any | null {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}${conversationId}`
      const data = sessionStorage.getItem(key)
      
      if (!data) return null
      
      const state = JSON.parse(data)
      
      // Check if data is not too old (1 hour)
      const oneHour = 60 * 60 * 1000
      if (Date.now() - state.timestamp > oneHour) {
        this.clearSessionStorage(conversationId)
        return null
      }
      
      return state
    } catch (error) {
      console.warn('Failed to load conversation from session storage:', error)
      return null
    }
  }

  /**
   * Clear conversation from session storage
   */
  static clearSessionStorage(conversationId: string): void {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}${conversationId}`
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to clear conversation session storage:', error)
    }
  }

  /**
   * Get all stored conversation IDs
   */
  static getStoredConversationIds(): string[] {
    try {
      const conversationIds: string[] = []
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
          conversationIds.push(key.replace(this.STORAGE_KEY_PREFIX, ''))
        }
      }
      
      return conversationIds
    } catch (error) {
      console.warn('Failed to get stored conversation IDs:', error)
      return []
    }
  }
}

/**
 * Factory function for conversation persistence
 */
export function createConversationPersistence(
  conversationId: string,
  userId: string,
  workspaceId: string,
  options?: PersistenceOptions
): ConversationPersistenceManager {
  return new ConversationPersistenceManager(conversationId, userId, workspaceId, options)
}