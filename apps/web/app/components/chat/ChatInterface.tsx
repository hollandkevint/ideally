'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CoachingContext } from '@/lib/ai/mary-persona'
import { WorkspaceContextBuilder } from '@/lib/ai/workspace-context'
import { StreamConnectionManager } from '@/lib/ai/streaming'
import StreamingMessage from './StreamingMessage'
import MessageInput from './MessageInput'
import QuickActions from './QuickActions'
import TypingIndicator from './TypingIndicator'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  tokenUsage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    cost_estimate_usd: number
  }
  coachingContext?: CoachingContext
}

interface ChatInterfaceProps {
  workspaceId: string
  userId?: string
  initialContext?: CoachingContext
  bmadSessionData?: any
  onContextUpdate?: (context: CoachingContext) => void
  className?: string
}

export default function ChatInterface({
  workspaceId,
  userId,
  initialContext,
  bmadSessionData,
  onContextUpdate,
  className = ''
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [coachingContext, setCoachingContext] = useState<CoachingContext | undefined>(initialContext)
  const [error, setError] = useState<string | null>(null)
  const [totalTokens, setTotalTokens] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'retrying'>('connected')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const connectionManager = useRef(new StreamConnectionManager())
  const currentStreamRef = useRef<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Build coaching context on mount or when session data changes
  useEffect(() => {
    const buildContext = async () => {
      try {
        const context = await WorkspaceContextBuilder.buildCoachingContext(
          workspaceId,
          userId,
          bmadSessionData
        )
        setCoachingContext(context)
        onContextUpdate?.(context)
      } catch (error) {
        console.error('Failed to build coaching context:', error)
      }
    }

    if (!initialContext) {
      buildContext()
    }
  }, [workspaceId, userId, bmadSessionData, initialContext, onContextUpdate])

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0 && coachingContext) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(coachingContext),
        timestamp: new Date(),
        coachingContext
      }
      setMessages([welcomeMessage])
    }
  }, [coachingContext, messages.length])

  const getWelcomeMessage = (context: CoachingContext): string => {
    const hasSession = context.currentBmadSession
    const userName = context.userProfile?.role || 'there'
    
    if (hasSession) {
      const session = context.currentBmadSession!
      return `👋 Hi ${userName}! I'm Mary, your AI business strategist. I see you're working on the **${session.pathway.replace('-', ' ')}** pathway and you're currently in the **${session.phase}** phase (${session.progress}% complete).

I'm here to help you think through strategic challenges, validate your assumptions, and develop actionable insights. 

**What's on your mind today?** You can use the quick actions below or just tell me what you'd like to explore.`
    }

    return `👋 Hi ${userName}! I'm Mary, your AI business strategist. I'm here to help you think through strategic challenges, validate assumptions, and develop actionable insights.

**How can I help you today?** You can use the quick actions below to get started, or simply tell me what's on your mind.`
  }

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return

    // Clear any existing error
    setError(null)
    setConnectionStatus('connecting')

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentInput('')
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      coachingContext
    }

    setMessages(prev => [...prev, assistantMessage])
    currentStreamRef.current = assistantMessage.id

    try {
      // Use connection manager with retry logic
      await connectionManager.current.connectWithRetry(
        async (signal) => {
          setConnectionStatus('connected')
          
          // Prepare conversation history
          const conversationHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))

          // Call streaming API
          const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: messageContent,
              workspaceId,
              conversationHistory,
              coachingContext
            }),
            signal
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          if (!response.body) {
            throw new Error('No response body received')
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let fullContent = ''
          let currentMetadata: any = null

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  
                  if (data === '[DONE]') {
                    // Stream completed
                    setMessages(prev => 
                      prev.map(msg => 
                        msg.id === assistantMessage.id 
                          ? { ...msg, isStreaming: false }
                          : msg
                      )
                    )
                    setIsLoading(false)
                    setConnectionStatus('connected')
                    return
                  }

                  try {
                    const parsed = JSON.parse(data)
                    
                    // Handle different chunk types
                    switch (parsed.type) {
                      case 'metadata':
                        currentMetadata = parsed.metadata
                        if (parsed.metadata?.coachingContext) {
                          setCoachingContext(parsed.metadata.coachingContext)
                        }
                        break
                        
                      case 'content':
                        if (parsed.content) {
                          fullContent += parsed.content
                          
                          // Update streaming message
                          setMessages(prev => 
                            prev.map(msg => 
                              msg.id === assistantMessage.id 
                                ? { ...msg, content: fullContent }
                                : msg
                            )
                          )
                        }
                        break
                        
                      case 'complete':
                        if (parsed.usage) {
                          // Update token usage
                          setMessages(prev => 
                            prev.map(msg => 
                              msg.id === assistantMessage.id 
                                ? { ...msg, tokenUsage: parsed.usage, isStreaming: false }
                                : msg
                            )
                          )
                          
                          setTotalTokens(prev => prev + parsed.usage.total_tokens)
                          setTotalCost(prev => prev + parsed.usage.cost_estimate_usd)
                        }
                        setIsLoading(false)
                        setConnectionStatus('connected')
                        break
                        
                      case 'error':
                        throw new Error(parsed.error || 'Unknown streaming error')
                    }
                  } catch (e) {
                    // Skip malformed JSON chunks
                    continue
                  }
                }
              }
            }
          } finally {
            reader.releaseLock()
          }
        },
        // Retry callback
        (attempt, error) => {
          setConnectionStatus('retrying')
          setRetryCount(attempt)
          console.log(`Retry attempt ${attempt}:`, error.message)
        }
      )
    } catch (error: any) {
      setConnectionStatus('disconnected')
      
      if (error.name === 'AbortError') {
        // Request was cancelled
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id))
      } else {
        // Handle error
        const isRetryable = !error.message.toLowerCase().includes('unauthorized') && 
                          !error.message.toLowerCase().includes('forbidden')
        
        setError(`Failed to send message: ${error.message}${isRetryable ? ' (Click to retry)' : ''}`)
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { 
                  ...msg, 
                  content: '⚠️ I encountered an error processing your message. Please try again.',
                  isStreaming: false
                }
              : msg
          )
        )
      }
    } finally {
      setIsLoading(false)
      currentStreamRef.current = null
    }
  }

  const handleQuickAction = (action: string) => {
    sendMessage(action)
  }

  const handleMessageComplete = () => {
    // Called when streaming message completes typing animation
    scrollToBottom()
  }

  const clearConversation = () => {
    // Cancel any ongoing streams
    connectionManager.current.abort()
    
    setMessages([])
    setError(null)
    setTotalTokens(0)
    setTotalCost(0)
    setRetryCount(0)
    setConnectionStatus('connected')
    
    // Re-add welcome message
    if (coachingContext) {
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: getWelcomeMessage(coachingContext),
        timestamp: new Date(),
        coachingContext
      }
      setMessages([welcomeMessage])
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      connectionManager.current.abort()
    }
  }, [])

  return (
    <div className={`chat-interface flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-divider">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Mary</h1>
              <p className="text-sm text-secondary">AI Business Strategist</p>
            </div>
            {coachingContext?.currentBmadSession && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-blue-700 font-medium capitalize">
                  {coachingContext.currentBmadSession.pathway.replace('-', ' ')} • {coachingContext.currentBmadSession.phase}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                connectionStatus === 'retrying' ? 'bg-orange-500 animate-pulse' :
                'bg-red-500'
              }`} />
              <span className="text-xs text-secondary capitalize">
                {connectionStatus === 'retrying' ? `Retrying (${retryCount}/3)` : connectionStatus}
              </span>
            </div>
            
            {/* Token Usage Display */}
            {totalTokens > 0 && (
              <div className="text-xs text-secondary bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="font-mono">{totalTokens.toLocaleString()}</span> tokens • 
                <span className="font-mono ml-1">
                  ${totalCost.toFixed(4)}
                </span>
              </div>
            )}
            
            {/* Clear Chat Button */}
            {messages.length > 1 && (
              <button
                onClick={clearConversation}
                className="text-secondary hover:text-primary p-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((message) => (
          <StreamingMessage
            key={message.id}
            {...message}
            onComplete={handleMessageComplete}
          />
        ))}
        
        {/* Typing Indicator */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <TypingIndicator 
            isTyping={isLoading}
            userName="Mary"
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <div className="flex-1">
                <h4 className="text-red-800 font-medium mb-1">Connection Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
                <div className="mt-3 flex items-center gap-3">
                  {error.includes('(Click to retry)') && (
                    <button
                      onClick={() => {
                        const lastUserMessage = messages.filter(m => m.role === 'user').pop()
                        if (lastUserMessage) {
                          setError(null)
                          sendMessage(lastUserMessage.content)
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      disabled={isLoading}
                    >
                      Retry Message
                    </button>
                  )}
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-divider">
        <QuickActions
          onActionSelect={handleQuickAction}
          coachingContext={coachingContext}
          disabled={isLoading}
        />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-divider">
        <MessageInput
          value={currentInput}
          onChange={setCurrentInput}
          onSubmit={sendMessage}
          disabled={isLoading}
          placeholder="Ask Mary for strategic guidance..."
          maxLength={4000}
        />
      </div>
    </div>
  )
}