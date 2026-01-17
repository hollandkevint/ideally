'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  GuestSessionStore,
  GuestMessage,
  TRIAL_CONFIG,
  type TrialStatus
} from '@/lib/guest/session-store'
import { generatePartialOutput, type PartialOutput } from '@/lib/guest/partial-output'
import SignupPromptModal from './SignupPromptModal'
import StreamingMessage from '../chat/StreamingMessage'
import MessageInput from '../chat/MessageInput'
import TypingIndicator from '../chat/TypingIndicator'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export default function GuestChatInterface() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({ status: 'active', remaining: TRIAL_CONFIG.softGate })
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [partialOutput, setPartialOutput] = useState<PartialOutput | null>(null)
  const [gateType, setGateType] = useState<'soft' | 'hard'>('soft')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load existing guest session on mount
  useEffect(() => {
    const session = GuestSessionStore.getOrCreateSession()

    if (session.messages.length > 0) {
      // Load existing messages
      const loadedMessages: Message[] = session.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }))
      setMessages(loadedMessages)
      setTrialStatus(GuestSessionStore.getTrialStatus())
    } else {
      // Show welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hey there! I'm Mary, your AI business strategist. I'm here to help you think through business challenges, validate ideas, and develop strategic insights.

**Try me out with ${TRIAL_CONFIG.softGate} free messages** - no signup required. After that, you can sign up to continue our conversation and unlock unlimited access.

**What would you like to explore today?**`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [])

  // Story 6.5: Check trial status and show appropriate gate
  const checkAndShowGate = useCallback((guestMessages: GuestMessage[]) => {
    const status = GuestSessionStore.getTrialStatus()
    setTrialStatus(status)

    if (status.status === 'hard_gate') {
      // Hard gate - must sign up
      setGateType('hard')
      setPartialOutput(generatePartialOutput(guestMessages))
      setShowSignupModal(true)
    } else if (status.status === 'soft_gate' && GuestSessionStore.isAtSoftGate()) {
      // First time at soft gate - show modal with dismiss option
      setGateType('soft')
      setPartialOutput(generatePartialOutput(guestMessages))
      setShowSignupModal(true)
    }
  }, [])

  // Story 6.5: Handle soft gate dismissal
  const handleSoftGateDismiss = useCallback(() => {
    GuestSessionStore.dismissSoftGate()
    setTrialStatus(GuestSessionStore.getTrialStatus())
  }, [])

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return

    // Check if hard limit reached
    if (GuestSessionStore.hasReachedLimit()) {
      const session = GuestSessionStore.getSession()
      if (session) {
        setGateType('hard')
        setPartialOutput(generatePartialOutput(session.messages))
        setShowSignupModal(true)
      }
      return
    }

    setError(null)

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

    // Save user message to guest session
    GuestSessionStore.addMessage('user', messageContent)
    setTrialStatus(GuestSessionStore.getTrialStatus())

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      // Call streaming API with guest-specific handling
      const response = await fetch('/api/chat/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body received')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

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

                // Save assistant response to guest session
                GuestSessionStore.addMessage('assistant', fullContent)

                // Get updated session and check gates
                const session = GuestSessionStore.getSession()
                if (session) {
                  checkAndShowGate(session.messages)
                }

                // Show save prompt if not at gate
                const currentStatus = GuestSessionStore.getTrialStatus()
                if (currentStatus.status === 'active') {
                  setShowSavePrompt(true)
                  setTimeout(() => setShowSavePrompt(false), 5000)
                }

                return
              }

              try {
                const parsed = JSON.parse(data)

                // Handle different chunk types
                switch (parsed.type) {
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
    } catch (error: any) {
      setError(`Failed to send message: ${error.message}`)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? {
              ...msg,
              content: 'I encountered an error processing your message. Please try again.',
              isStreaming: false
            }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleMessageComplete = () => {
    scrollToBottom()
  }

  const handleSignupClick = () => {
    router.push('/auth?mode=signup&from=guest')
  }

  // Calculate display values
  const displayRemaining = trialStatus.status === 'active'
    ? trialStatus.remaining
    : trialStatus.status === 'soft_gate'
      ? trialStatus.remaining
      : 0

  const isAtLimit = trialStatus.status === 'hard_gate'

  return (
    <div className="chat-interface flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-divider">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--terracotta)' }}>
              <span className="font-bold text-lg" style={{ color: 'var(--cream)' }}>M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Mary</h1>
              <p className="text-sm" style={{ color: 'var(--slate-blue)' }}>AI Business Strategist</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(212, 168, 75, 0.15)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--mustard)' }}>
                Guest Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Message Counter - Story 6.5: Updated display */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: displayRemaining <= 2
                  ? 'rgba(139, 77, 59, 0.1)'
                  : displayRemaining <= 4
                    ? 'rgba(212, 168, 75, 0.15)'
                    : 'rgba(74, 103, 65, 0.1)'
              }}
            >
              <span
                className="text-sm font-medium"
                style={{
                  color: displayRemaining <= 2
                    ? 'var(--rust)'
                    : displayRemaining <= 4
                      ? 'var(--mustard)'
                      : 'var(--forest)'
                }}
              >
                {trialStatus.status === 'soft_gate' && !GuestSessionStore.getSession()?.softGateDismissed
                  ? `${TRIAL_CONFIG.softGate} reached`
                  : trialStatus.status === 'hard_gate'
                    ? 'Trial complete'
                    : `${displayRemaining}/${TRIAL_CONFIG.softGate} messages`
                }
              </span>
            </div>

            {/* Sign Up Button */}
            <button
              onClick={handleSignupClick}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'var(--terracotta)',
                color: 'var(--cream)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--terracotta-hover)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--terracotta)'}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* Save Progress Banner */}
      {showSavePrompt && (
        <div className="flex-shrink-0 px-6 py-3" style={{ backgroundColor: 'var(--parchment)', borderBottom: '1px solid var(--divider)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--forest)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--ink)' }}>
                <strong>Great conversation!</strong> Sign up to save your progress and continue later.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSignupClick}
                className="px-3 py-1 text-sm font-medium rounded transition-colors"
                style={{ backgroundColor: 'var(--terracotta)', color: 'var(--cream)' }}
              >
                Save now
              </button>
              <button
                onClick={() => setShowSavePrompt(false)}
                className="text-sm"
                style={{ color: 'var(--slate-blue)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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
                <h4 className="text-red-800 font-medium mb-1">Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-divider">
        <MessageInput
          value={currentInput}
          onChange={setCurrentInput}
          onSubmit={sendMessage}
          disabled={isLoading || isAtLimit}
          placeholder={
            isAtLimit
              ? 'Sign up to continue chatting...'
              : `Ask Mary for strategic guidance... (${displayRemaining} messages left)`
          }
          maxLength={4000}
        />
      </div>

      {/* Signup Modal - Story 6.5: Enhanced with gate type and partial output */}
      <SignupPromptModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        gateType={gateType}
        partialOutput={partialOutput}
        onDismiss={gateType === 'soft' ? handleSoftGateDismiss : undefined}
      />
    </div>
  )
}
