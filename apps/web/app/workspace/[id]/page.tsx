'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../lib/auth/AuthContext'
import { supabase } from '../../../lib/supabase/client'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import BmadInterface from '../../components/bmad/BmadInterface'
import StateBridge from '../../components/dual-pane/StateBridge'
import { PaneErrorBoundary, LoadingPane, OfflineIndicator, useOnlineStatus } from '../../components/dual-pane/PaneErrorBoundary'
import { useSharedInput } from '../../components/workspace/useSharedInput'
import CanvasContextSync from '../../../components/canvas/CanvasContextSync'
import { MessageLimitWarning } from '../../components/chat/MessageLimitWarning'
import type { MessageLimitStatus } from '../../../lib/bmad/message-limit-manager'
import dynamic from 'next/dynamic'

// Dynamically import canvas components (SSR-safe)
const EnhancedCanvasWorkspace = dynamic(
  () => import('../../../app/components/canvas/EnhancedCanvasWorkspace'),
  { ssr: false }
)

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    strategic_tags?: string[]
  }
}

interface Workspace {
  id: string
  name: string
  description: string
  chat_context: ChatMessage[]
  canvas_elements: Array<Record<string, unknown>>
  user_id: string
}

type WorkspaceTab = 'chat' | 'bmad'

export default function WorkspacePage() {
  const params = useParams()
  const { user, loading: authLoading, signOut } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chat')
  const [canvasState, setCanvasState] = useState<{
    mode: 'draw' | 'diagram'
    diagramCode?: string
    diagramType?: string
    drawingSnapshot?: string
    lastModified: Date
  } | null>(null)
  const [limitStatus, setLimitStatus] = useState<MessageLimitStatus | null>(null)
  const isOnline = useOnlineStatus()
  const { preserveInput, hasPreservedInput, peekPreservedInput, clearPreservedInput } = useSharedInput(params.id as string)

  const fetchWorkspace = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_workspace')
        .select('user_id, workspace_state, updated_at')
        .eq('user_id', params.id)
        .single()

      if (error) throw error

      // Transform user_workspace data to Workspace format
      const transformedWorkspace: Workspace = {
        id: data.user_id,
        name: data.workspace_state?.name || 'My Strategic Workspace',
        description: data.workspace_state?.description || 'Strategic thinking workspace',
        chat_context: data.workspace_state?.chat_context || [],
        canvas_elements: data.workspace_state?.canvas_elements || [],
        user_id: data.user_id
      }

      setWorkspace(transformedWorkspace)
    } catch (error) {
      console.error('Error fetching workspace:', error)
      setError('Workspace not found or you do not have access to it')
    } finally {
      setLoading(false)
    }
  }, [params.id, user?.id])

  useEffect(() => {
    if (user && params.id) {
      fetchWorkspace()
    }
  }, [user, params.id, fetchWorkspace])

  const addChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!workspace) return

    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }

    const updatedChatContext = [...workspace.chat_context, newMessage]

    try {
      const { error } = await supabase
        .from('user_workspace')
        .update({
          workspace_state: {
            name: workspace.name,
            description: workspace.description,
            chat_context: updatedChatContext,
            canvas_elements: workspace.canvas_elements,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', workspace.id)

      if (error) throw error

      setWorkspace({
        ...workspace,
        chat_context: updatedChatContext
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || sendingMessage) return

    const userMessage = messageInput
    setSendingMessage(true)
    setMessageInput('')

    try {
      // Add user message immediately
      await addChatMessage({
        role: 'user',
        content: userMessage
      })
      
      // Stream Mary's response from Claude API
      await streamClaudeResponse(userMessage)
      
    } catch (err) {
      console.error('[Workspace] Error sending message:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });

      // Add detailed error message for user
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      await addChatMessage({
        role: 'system',
        content: `❌ **Error:** ${errorMessage}\n\n**Troubleshooting:**\n- Check your internet connection\n- Verify you're signed in\n- Try refreshing the page\n- If the problem persists, contact support`
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const streamClaudeResponse = async (message: string) => {
    try {
      console.log('[Workspace] Sending message to Claude:', {
        messageLength: message.length,
        workspaceId: workspace?.id,
        historyLength: workspace?.chat_context?.length || 0
      });

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          workspaceId: workspace?.id,
          conversationHistory: workspace?.chat_context?.slice(-10) || [] // Last 10 messages for context
        }),
      });

      console.log('[Workspace] Got response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        // Try to parse error details from response
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.details || errorData?.error || response.statusText || 'Unknown error';
        const errorHint = errorData?.hint || 'Please try again';

        console.error('[Workspace] HTTP error:', {
          status: response.status,
          message: errorMessage,
          hint: errorHint
        });

        throw new Error(`${errorMessage} (${errorHint})`);
      }

      if (!response.body) {
        throw new Error('No response stream available')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      let assistantContent = ''
      const assistantMessageId = crypto.randomUUID()
      let chunkCount = 0;

      console.log('[Workspace] Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('[Workspace] Stream complete, received', chunkCount, 'chunks');
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()

            // Skip [DONE] signal
            if (dataStr === '[DONE]') {
              console.log('[Workspace] Received [DONE] signal');
              continue
            }

            try {
              const data = JSON.parse(dataStr)

              if (data.type === 'content') {
                assistantContent += data.content
                // Update streaming message in UI
                updateStreamingMessage(assistantMessageId, assistantContent)
              } else if (data.type === 'complete') {
                console.log('[Workspace] Stream marked complete');
                // Extract limitStatus from completion metadata
                if (data.limitStatus) {
                  setLimitStatus(data.limitStatus);
                }
                // Finalize the message in database (pass the messageId)
                await finalizeAssistantMessage(assistantContent, assistantMessageId)
              } else if (data.type === 'error') {
                console.error('[Workspace] Received error from stream:', data);
                throw new Error(data.error || 'Stream error')
              } else if (data.type === 'metadata') {
                console.log('[Workspace] Received metadata:', data);
              }
            } catch (parseError) {
              console.error('[Workspace] Failed to parse stream data:', {
                dataStr: dataStr.substring(0, 100),
                error: parseError instanceof Error ? parseError.message : 'Unknown error'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[Workspace] Streaming error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  const updateStreamingMessage = (messageId: string, content: string) => {
    if (!workspace) return
    
    // Update the workspace state with streaming content
    const updatedChatContext = [...workspace.chat_context]
    const existingIndex = updatedChatContext.findIndex(msg => msg.id === messageId)
    
    if (existingIndex >= 0) {
      updatedChatContext[existingIndex] = {
        ...updatedChatContext[existingIndex],
        content: content
      }
    } else {
      updatedChatContext.push({
        id: messageId,
        role: 'assistant',
        content: content,
        timestamp: new Date().toISOString()
      })
    }
    
    setWorkspace({
      ...workspace,
      chat_context: updatedChatContext
    })
  }

  const finalizeAssistantMessage = async (content: string, messageId: string) => {
    if (!workspace) return

    // Find the existing streaming message in chat_context
    const existingMessageIndex = workspace.chat_context.findIndex(msg => msg.id === messageId)

    if (existingMessageIndex === -1) {
      console.error('[Workspace] Could not find streaming message to finalize:', messageId)
      // Fallback: add as new message
      await addChatMessage({
        role: 'assistant',
        content: content
      })
      return
    }

    // The message is already in the state from streaming, just save it to database
    const updatedChatContext = [...workspace.chat_context]

    try {
      const { error } = await supabase
        .from('user_workspace')
        .update({
          workspace_state: {
            name: workspace.name,
            description: workspace.description,
            chat_context: updatedChatContext,
            canvas_elements: workspace.canvas_elements,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', workspace.id)

      if (error) throw error

      console.log('[Workspace] Finalized assistant message:', messageId)
    } catch (error) {
      console.error('[Workspace] Error finalizing message:', error)
    }
  }

  const handleTabSwitch = (tab: WorkspaceTab) => {
    // Preserve input when switching from chat to BMad Method
    if (activeTab === 'chat' && tab === 'bmad' && messageInput.trim()) {
      preserveInput(messageInput)
    }
    
    setActiveTab(tab)
  }

  // Restore preserved input when returning to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && hasPreservedInput() && !messageInput) {
      setMessageInput(peekPreservedInput())
    }
  }, [activeTab, hasPreservedInput, peekPreservedInput, messageInput])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-secondary">Loading your strategic workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Access Required</h1>
          <p className="text-secondary mb-4">Please sign in to access your workspace.</p>
          <Link href="/login" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Workspace Not Found</h1>
          <p className="text-secondary mb-4">{error}</p>
          <Link href="/dashboard" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="dual-pane-container">
      {/* State Bridge Component for Sync */}
      <StateBridge workspaceId={workspace.id} className="hidden" />
      
      {/* Offline Indicator */}
      {!isOnline && <OfflineIndicator />}
      
      {/* Main Content Pane - 60% */}
      <PaneErrorBoundary paneName="chat">
        <div className="chat-pane">
        <header className="mb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard" className="text-primary hover:text-primary-hover transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-primary">{workspace.name}</h1>
            </div>
            <p className="text-secondary">AI-powered strategic workspace</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-secondary mb-2">Welcome, {user.email}</p>
            <div className="flex gap-2">
              <Link
                href="/account"
                className="text-xs px-3 py-1 border border-divider rounded hover:bg-primary/5 transition-colors"
              >
                Account
              </Link>
              <button
                onClick={signOut}
                className="text-xs px-3 py-1 border border-divider rounded hover:bg-primary/5 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>
        
        {/* Tab Navigation */}
        <div className="mb-4 border-b border-divider">
          <div className="flex gap-4">
            <button
              onClick={() => handleTabSwitch('chat')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Mary Chat
                {workspace.chat_context.length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {workspace.chat_context.length}
                  </span>
                )}
              </div>
            </button>
            {/* BMad Method tab temporarily disabled - database setup pending */}
            {/* <button
              onClick={() => handleTabSwitch('bmad')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bmad'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">B</span>
                </div>
                BMad Method
                <span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">
                  NEW
                </span>
              </div>
            </button> */}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                {workspace.chat_context.length === 0 && (
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold">M</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900 text-lg mb-2">Welcome to your Strategic Session!</p>
                        <p className="text-blue-700 mb-4">
                          I&apos;m Mary, your AI strategic advisor. I&apos;m here to help you think through ideas, validate concepts,
                          and develop actionable plans using the proven bMAD Method.
                        </p>
                        <p className="font-medium text-blue-900 mb-3">Try asking me about:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setMessageInput("I have a new product idea I want to validate")
                              setTimeout(() => {
                                const input = document.querySelector('input[type="text"]') as HTMLInputElement
                                input?.focus()
                                input?.select()
                              }, 100)
                            }}
                            className="text-left px-4 py-3 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800 hover:text-blue-900 transition-colors"
                          >
                            💡 Validate a new product idea
                          </button>
                          <button
                            onClick={() => {
                              setMessageInput("I need help analyzing my competitive landscape")
                              setTimeout(() => {
                                const input = document.querySelector('input[type="text"]') as HTMLInputElement
                                input?.focus()
                                input?.select()
                              }, 100)
                            }}
                            className="text-left px-4 py-3 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800 hover:text-blue-900 transition-colors"
                          >
                            📊 Analyze competitive landscape
                          </button>
                          <button
                            onClick={() => {
                              setMessageInput("I'm stuck on my business model and need guidance")
                              setTimeout(() => {
                                const input = document.querySelector('input[type="text"]') as HTMLInputElement
                                input?.focus()
                                input?.select()
                              }, 100)
                            }}
                            className="text-left px-4 py-3 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800 hover:text-blue-900 transition-colors"
                          >
                            🎯 Refine business model
                          </button>
                          <button
                            onClick={() => {
                              setMessageInput("Help me prioritize my product features")
                              setTimeout(() => {
                                const input = document.querySelector('input[type="text"]') as HTMLInputElement
                                input?.focus()
                                input?.select()
                              }, 100)
                            }}
                            className="text-left px-4 py-3 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800 hover:text-blue-900 transition-colors"
                          >
                            ⚡ Prioritize features
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💬 <strong>Tip:</strong> Click a suggestion above to populate the input field, then press <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">Send</kbd> or <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">Enter</kbd> to chat with Mary!
                      </p>
                    </div>
                  </div>
                )}
                
                {workspace.chat_context.map((message) => (
                  <div 
                    key={message.id} 
                    className={
                      message.role === 'user' 
                        ? 'chat-message-user' 
                        : message.role === 'assistant' 
                          ? 'chat-message-assistant' 
                          : 'chat-message-system'
                    }
                  >
                    {message.role === 'assistant' ? (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">M</span>
                          </div>
                          <strong className="text-blue-900">Mary</strong>
                        </div>
                        <div className="ml-10 prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="mb-3 ml-4 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-3 ml-4 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                              h1: ({ children }) => <h1 className="text-lg font-semibold mb-2 text-blue-900">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-md font-semibold mb-2 text-blue-800">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-blue-700">{children}</h3>,
                              strong: ({ children }) => <strong className="font-semibold text-blue-900">{children}</strong>,
                              code: ({ children }) => <code className="bg-blue-50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-300 pl-4 italic my-2">{children}</blockquote>
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <p>
                        <strong>{message.role === 'user' ? 'You' : 'System'}:</strong> {message.content}
                      </p>
                    )}
                    {message.metadata?.strategic_tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.metadata.strategic_tags.map((tag, i) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {sendingMessage && (
                  <div className="chat-message-assistant opacity-50">
                    <p><strong>Mary:</strong> <span className="loading-shimmer h-4 w-32 inline-block rounded"></span></p>
                  </div>
                )}
              </div>

              {/* Canvas Context Sync */}
              <div className="mt-4">
                <CanvasContextSync
                  workspaceId={workspace.id}
                  messages={workspace.chat_context.map(msg => ({
                    id: msg.id,
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
                    timestamp: new Date(msg.timestamp)
                  }))}
                  canvasState={canvasState}
                  onCanvasUpdate={(diagramCode, type) => {
                    setCanvasState({
                      mode: 'diagram',
                      diagramCode,
                      diagramType: type,
                      lastModified: new Date()
                    })
                  }}
                  autoPopulate={false}
                />
              </div>

              {/* Message Limit Warning */}
              <MessageLimitWarning
                limitStatus={limitStatus}
                onExport={() => {
                  // TODO: Implement export functionality
                  alert('Export functionality coming soon!')
                }}
                onNewSession={() => {
                  window.location.href = '/dashboard'
                }}
              />

              <form onSubmit={handleSendMessage} className="mt-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your strategic question or challenge..."
                    disabled={sendingMessage}
                    className="flex-1 px-4 py-2 border border-divider rounded-lg focus:border-primary focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sendingMessage}
                    className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <BmadInterface 
                workspaceId={workspace.id} 
                className="w-full"
                preservedInput={hasPreservedInput() ? peekPreservedInput() : undefined}
                onInputConsumed={clearPreservedInput}
              />
            </div>
          )}
        </div>
        </div>
      </PaneErrorBoundary>

      {/* Canvas Pane - 40% */}
      <PaneErrorBoundary paneName="canvas">
        <div className="canvas-pane">
        <header className="mb-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-primary">Visual Canvas</h2>
            <p className="text-secondary">Sketches & diagrams</p>
          </div>
          <div className="text-right text-xs">
            <div className="mb-1">
              <span className="text-secondary">Messages:</span> 
              <span className="font-medium ml-1">{workspace.chat_context.length}</span>
            </div>
            <div className="mb-1">
              <span className="text-secondary">Elements:</span> 
              <span className="font-medium ml-1">{workspace.canvas_elements.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-secondary">Auto-saved</span>
            </div>
          </div>
        </header>
        
        <div className="canvas-container">
          <EnhancedCanvasWorkspace
            workspaceId={workspace.id}
            initialMode={canvasState?.mode || 'draw'}
            initialDiagramCode={canvasState?.diagramCode}
            initialDiagramType={canvasState?.diagramType as any}
            onStateChange={(newState) => {
              setCanvasState({
                ...newState,
                lastModified: new Date()
              })
            }}
          />
        </div>
        </div>
      </PaneErrorBoundary>
    </div>
  )
}