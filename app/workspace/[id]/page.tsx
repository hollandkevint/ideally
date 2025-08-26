'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../lib/auth/AuthContext'
import { supabase } from '../../../lib/supabase/client'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

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

export default function WorkspacePage() {
  const params = useParams()
  const { user, loading: authLoading, signOut } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (user && params.id) {
      fetchWorkspace()
    }
  }, [user, params.id])

  const fetchWorkspace = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setWorkspace(data)
    } catch (error) {
      console.error('Error fetching workspace:', error)
      setError('Workspace not found or you do not have access to it')
    } finally {
      setLoading(false)
    }
  }

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
        .from('workspaces')
        .update({ 
          chat_context: updatedChatContext,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspace.id)

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
      console.error('Error sending message:', err)
      // Add error message for user
      await addChatMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an issue. Please try again shortly.'
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const streamClaudeResponse = async (message: string) => {
    try {
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
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response stream available')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      let assistantContent = ''
      const assistantMessageId = crypto.randomUUID()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'content') {
                assistantContent += data.content
                // Update streaming message in UI
                updateStreamingMessage(assistantMessageId, assistantContent)
              } else if (data.type === 'complete') {
                // Finalize the message in database
                await finalizeAssistantMessage(assistantContent)
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (parseError) {
              console.error('Failed to parse stream data:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      throw error
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

  const finalizeAssistantMessage = async (content: string) => {
    if (!workspace) return
    
    await addChatMessage({
      role: 'assistant',
      content: content
    })
  }

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
      {/* Chat Pane - 60% */}
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
            <p className="text-secondary">AI-powered coaching with Mary</p>
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
        
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {workspace.chat_context.length === 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">M</span>
                </div>
                <div>
                  <p className="font-medium text-blue-900 mb-1">Welcome to your Strategic Session!</p>
                  <p className="text-blue-700 text-sm">
                    I&apos;m Mary, your AI strategic advisor. I&apos;m here to help you think through ideas, validate concepts, 
                    and develop actionable plans. What challenge would you like to explore today?
                  </p>
                </div>
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
      </div>

      {/* Canvas Pane - 40% */}
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
          <div className="h-full flex items-center justify-center text-secondary">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-canvas-grid flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <p>Canvas ready for sketches and diagrams</p>
              <p className="text-sm mt-2">Integration with Excalidraw & Mermaid coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}