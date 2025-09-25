import { SupabaseClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { 
  ConversationRow, 
  MessageRow, 
  ConversationInsert,
  ConversationQueries,
  ConversationBranchRow,
  ConversationBranchInsert
} from '@/lib/supabase/conversation-schema'

export interface BranchOptions {
  title?: string
  description?: string
  startFromMessageId: string
  alternativeDirection?: string
  preserveContext?: boolean
}

export interface BranchResult {
  branchId: string
  newConversationId: string
  branchPoint: {
    messageId: string
    messageIndex: number
  }
  success: boolean
  error?: string
}

export interface BranchInfo extends ConversationBranchRow {
  conversation: ConversationRow
  messageCount: number
  lastActivity: Date
  preview?: string
}

export class ConversationBranchManager {
  private supabase: SupabaseClient
  private userId: string
  private workspaceId?: string

  constructor(supabase: SupabaseClient, userId: string, workspaceId?: string) {
    this.supabase = supabase
    this.userId = userId
    this.workspaceId = workspaceId
  }

  static async create(userId: string, workspaceId?: string): Promise<ConversationBranchManager> {
    const supabase = createServerComponentClient({ cookies })
    return new ConversationBranchManager(supabase, userId, workspaceId)
  }

  /**
   * Create a new conversation branch from a specific message
   */
  async createBranch(
    sourceConversationId: string, 
    options: BranchOptions
  ): Promise<BranchResult> {
    try {
      // Get the source message and verify ownership
      const { data: sourceMessage, error: messageError } = await this.supabase
        .from('messages')
        .select(`
          *,
          conversation:conversations(*)
        `)
        .eq('id', options.startFromMessageId)
        .eq('conversation.user_id', this.userId)
        .single()

      if (messageError || !sourceMessage) {
        return {
          branchId: '',
          newConversationId: '',
          branchPoint: { messageId: options.startFromMessageId, messageIndex: 0 },
          success: false,
          error: 'Source message not found or access denied'
        }
      }

      // Get all messages up to the branch point
      const { data: messagesUpToBranch, error: messagesError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', sourceConversationId)
        .lte('created_at', sourceMessage.created_at)
        .order('created_at', { ascending: true })

      if (messagesError) {
        throw new Error('Failed to retrieve conversation history')
      }

      // Create new conversation for the branch
      const branchTitle = options.title || `Branch from "${sourceMessage.conversation.title || 'Untitled'}"`
      const newConversation: ConversationInsert = {
        user_id: this.userId,
        workspace_id: this.workspaceId || sourceMessage.conversation.workspace_id,
        title: branchTitle,
        context_summary: sourceMessage.conversation.context_summary,
        bmad_session_id: sourceMessage.conversation.bmad_session_id,
        metadata: {
          ...sourceMessage.conversation.metadata,
          branch_source: sourceConversationId,
          branch_point: options.startFromMessageId,
          branch_description: options.description
        }
      }

      const newConversationResult = await ConversationQueries.createConversation(newConversation)

      // Copy messages up to branch point if preserveContext is enabled
      if (options.preserveContext && messagesUpToBranch) {
        const messagesToCopy = messagesUpToBranch.slice(0, -1) // Exclude the branch point message

        for (const message of messagesToCopy) {
          await ConversationQueries.addMessage({
            conversation_id: newConversationResult.id,
            role: message.role,
            content: message.content,
            token_usage: message.token_usage,
            coaching_context: message.coaching_context,
            metadata: {
              ...message.metadata,
              copied_from_branch: true,
              original_message_id: message.id
            }
          })
        }
      }

      // Create branch record
      const branchData: ConversationBranchInsert = {
        source_conversation_id: sourceConversationId,
        branch_conversation_id: newConversationResult.id,
        branch_point_message_id: options.startFromMessageId,
        title: branchTitle,
        description: options.description,
        alternative_direction: options.alternativeDirection,
        created_by: this.userId,
        metadata: {
          preserve_context: options.preserveContext,
          messages_copied: options.preserveContext ? messagesUpToBranch?.length - 1 : 0
        }
      }

      const { data: branch, error: branchError } = await this.supabase
        .from('conversation_branches')
        .insert(branchData)
        .select()
        .single()

      if (branchError) {
        throw new Error('Failed to create branch record')
      }

      return {
        branchId: branch.id,
        newConversationId: newConversationResult.id,
        branchPoint: {
          messageId: options.startFromMessageId,
          messageIndex: messagesUpToBranch?.length || 0
        },
        success: true
      }

    } catch (error: any) {
      return {
        branchId: '',
        newConversationId: '',
        branchPoint: { messageId: options.startFromMessageId, messageIndex: 0 },
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get all branches for a conversation
   */
  async getBranches(conversationId: string): Promise<BranchInfo[]> {
    try {
      const { data: branches, error } = await this.supabase
        .from('conversation_branches')
        .select(`
          *,
          branch_conversation:branch_conversation_id(
            id,
            title,
            updated_at,
            context_summary
          )
        `)
        .eq('source_conversation_id', conversationId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const branchInfos: BranchInfo[] = []

      for (const branch of branches || []) {
        // Get message count for the branch
        const { count: messageCount } = await this.supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', branch.branch_conversation_id)

        // Get latest message for preview
        const { data: latestMessage } = await this.supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', branch.branch_conversation_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        branchInfos.push({
          ...branch,
          conversation: branch.branch_conversation,
          messageCount: messageCount || 0,
          lastActivity: latestMessage?.created_at ? new Date(latestMessage.created_at) : new Date(branch.created_at),
          preview: latestMessage?.content?.substring(0, 100)
        })
      }

      return branchInfos

    } catch (error: any) {
      console.error('Failed to get branches:', error)
      return []
    }
  }

  /**
   * Get branches where a conversation was branched from
   */
  async getSourceBranches(conversationId: string): Promise<BranchInfo[]> {
    try {
      const { data: branches, error } = await this.supabase
        .from('conversation_branches')
        .select(`
          *,
          source_conversation:source_conversation_id(
            id,
            title,
            updated_at,
            context_summary
          )
        `)
        .eq('branch_conversation_id', conversationId)

      if (error) throw error

      const branchInfos: BranchInfo[] = []

      for (const branch of branches || []) {
        // Get message count for the source
        const { count: messageCount } = await this.supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', branch.source_conversation_id)

        branchInfos.push({
          ...branch,
          conversation: branch.source_conversation,
          messageCount: messageCount || 0,
          lastActivity: new Date(branch.created_at),
          preview: branch.description
        })
      }

      return branchInfos

    } catch (error: any) {
      console.error('Failed to get source branches:', error)
      return []
    }
  }

  /**
   * Delete a branch (removes branch record but preserves the conversation)
   */
  async deleteBranch(branchId: string, deleteConversation: boolean = false): Promise<boolean> {
    try {
      // Get branch info first
      const { data: branch, error: branchError } = await this.supabase
        .from('conversation_branches')
        .select('*')
        .eq('id', branchId)
        .eq('created_by', this.userId)
        .single()

      if (branchError || !branch) {
        return false
      }

      // Delete the branch conversation if requested
      if (deleteConversation) {
        const { error: conversationError } = await this.supabase
          .from('conversations')
          .delete()
          .eq('id', branch.branch_conversation_id)
          .eq('user_id', this.userId)

        if (conversationError) {
          console.error('Failed to delete branch conversation:', conversationError)
          return false
        }
      }

      // Delete the branch record
      const { error: deleteError } = await this.supabase
        .from('conversation_branches')
        .delete()
        .eq('id', branchId)

      return !deleteError

    } catch (error: any) {
      console.error('Failed to delete branch:', error)
      return false
    }
  }

  /**
   * Merge a branch back into the source conversation
   */
  async mergeBranch(branchId: string): Promise<boolean> {
    try {
      // Get branch info
      const { data: branch, error: branchError } = await this.supabase
        .from('conversation_branches')
        .select('*')
        .eq('id', branchId)
        .eq('created_by', this.userId)
        .single()

      if (branchError || !branch) {
        return false
      }

      // Get messages from branch that aren't already in source
      const { data: branchMessages, error: messagesError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', branch.branch_conversation_id)
        .is('metadata->>copied_from_branch', null)
        .order('created_at', { ascending: true })

      if (messagesError) {
        throw new Error('Failed to get branch messages')
      }

      // Add messages to source conversation with merge metadata
      for (const message of branchMessages || []) {
        await ConversationQueries.addMessage({
          conversation_id: branch.source_conversation_id,
          role: message.role,
          content: message.content,
          token_usage: message.token_usage,
          coaching_context: message.coaching_context,
          metadata: {
            ...message.metadata,
            merged_from_branch: branchId,
            original_branch_message_id: message.id
          }
        })
      }

      // Update branch status
      const { error: updateError } = await this.supabase
        .from('conversation_branches')
        .update({ 
          metadata: { 
            ...branch.metadata,
            merged: true,
            merged_at: new Date().toISOString(),
            messages_merged: branchMessages?.length || 0
          }
        })
        .eq('id', branchId)

      return !updateError

    } catch (error: any) {
      console.error('Failed to merge branch:', error)
      return false
    }
  }

  /**
   * Get branch statistics for a conversation
   */
  async getBranchStats(conversationId: string): Promise<{
    totalBranches: number
    activeBranches: number
    mergedBranches: number
    totalMessages: number
  }> {
    try {
      const { data: branches, error } = await this.supabase
        .from('conversation_branches')
        .select('metadata')
        .eq('source_conversation_id', conversationId)

      if (error) throw error

      const stats = {
        totalBranches: branches?.length || 0,
        activeBranches: 0,
        mergedBranches: 0,
        totalMessages: 0
      }

      for (const branch of branches || []) {
        if (branch.metadata?.merged) {
          stats.mergedBranches++
          stats.totalMessages += branch.metadata.messages_merged || 0
        } else {
          stats.activeBranches++
        }
      }

      return stats

    } catch (error: any) {
      console.error('Failed to get branch stats:', error)
      return { totalBranches: 0, activeBranches: 0, mergedBranches: 0, totalMessages: 0 }
    }
  }
}