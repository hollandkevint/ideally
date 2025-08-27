'use client'

import { useState, useEffect } from 'react'
import StateBridge from '../components/dual-pane/StateBridge'
import { PaneErrorBoundary, LoadingPane, OfflineIndicator, useOnlineStatus } from '../components/dual-pane/PaneErrorBoundary'
import { useDualPaneStore } from '../../lib/stores/dualPaneStore'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    strategic_tags?: string[]
  }
}

type WorkspaceTab = 'chat' | 'canvas'

export default function TestDualPanePage() {
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chat')
  const [isLoading, setIsLoading] = useState(true)
  const isOnline = useOnlineStatus()

  // Initialize dual pane store with test data
  const { 
    chat, 
    canvas, 
    addChatMessage, 
    addCanvasElement, 
    setCurrentPhase,
    syncChatToCanvas 
  } = useDualPaneStore()

  useEffect(() => {
    // Simulate loading state
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    // Add some test data
    addChatMessage({
      role: 'assistant',
      content: 'Welcome to your dual-pane workspace! I\'m here to help you explore ideas and visualize concepts. What would you like to work on today?'
    })
  }, [addChatMessage])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || sendingMessage) return

    const userMessage = messageInput
    setSendingMessage(true)
    setMessageInput('')

    try {
      // Add user message
      addChatMessage({
        role: 'user',
        content: userMessage
      })
      
      // Simulate AI response
      setTimeout(() => {
        addChatMessage({
          role: 'assistant',
          content: `I understand you're interested in "${userMessage}". Let me help you explore this concept and create some visual representations. I'll suggest some canvas elements that might be helpful.`
        })
        setSendingMessage(false)
      }, 1000)
      
    } catch (err) {
      console.error('Error sending message:', err)
      setSendingMessage(false)
    }
  }

  if (isLoading) {
    return (
      <div className="dual-pane-container">
        <div className="chat-pane">
          <LoadingPane paneName="chat" message="Initializing strategic conversation..." />
        </div>
        <div className="canvas-pane">
          <LoadingPane paneName="canvas" message="Preparing visual canvas..." />
        </div>
      </div>
    )
  }

  return (
    <div className="dual-pane-container">
      {/* State Bridge Component for Sync */}
      <StateBridge workspaceId="test-workspace" className="hidden" />
      
      {/* Offline Indicator */}
      {!isOnline && <OfflineIndicator />}
      
      {/* Main Content Pane - 60% */}
      <PaneErrorBoundary paneName="chat">
        <div className="chat-pane">
        <header className="mb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-primary">Dual-Pane Test Workspace</h1>
            </div>
            <p className="text-secondary">Testing Story 1.3: Dual-Pane Interface Foundation</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-secondary mb-2">Test Environment</p>
            <div className="flex gap-2">
              <span className="text-xs px-3 py-1 bg-success/10 text-success border border-success/20 rounded">
                Story 1.3 Active
              </span>
            </div>
          </div>
        </header>
        
        {/* Tab Navigation */}
        <div className="mb-4 border-b border-divider">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('chat')}
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
                Strategic Chat
                {chat.messages.length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {chat.messages.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('canvas')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'canvas'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Visual Canvas
                {canvas.elements.length > 0 && (
                  <span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">
                    {canvas.elements.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                {chat.messages.length === 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">AI</span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-900 mb-1">Welcome to Dual-Pane Testing!</p>
                        <p className="text-blue-700 text-sm">
                          This is a test environment for Story 1.3. Start chatting to see the dual-pane synchronization in action.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {chat.messages.map((message) => (
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
                            <span className="text-white font-semibold text-sm">AI</span>
                          </div>
                          <strong className="text-blue-900">Strategic AI</strong>
                        </div>
                        <div className="ml-10">
                          <p className="leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      <p>
                        <strong>{message.role === 'user' ? 'You' : 'System'}:</strong> {message.content}
                      </p>
                    )}
                  </div>
                ))}
                
                {sendingMessage && (
                  <div className="chat-message-assistant opacity-50">
                    <p><strong>AI:</strong> <span className="loading-shimmer h-4 w-32 inline-block rounded"></span></p>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSendMessage} className="mt-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message to test dual-pane sync..."
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
              <div className="p-4 bg-canvas-grid rounded-lg h-full">
                <h3 className="text-lg font-semibold mb-4">Canvas View Testing</h3>
                <div className="space-y-2">
                  <p className="text-sm text-secondary">Canvas elements will appear here when synchronized from chat.</p>
                  {canvas.elements.length > 0 && (
                    <div className="space-y-2">
                      {canvas.elements.map((element) => (
                        <div key={element.id} className="p-2 bg-white rounded border border-divider">
                          <div className="text-xs font-semibold text-primary">{element.type}</div>
                          <div className="text-sm">{element.properties.title as string || 'Canvas Element'}</div>
                          {element.sourceMessage && (
                            <div className="text-xs text-secondary">Synced from chat message</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
            <p className="text-secondary">Real-time synchronization testing</p>
          </div>
          <div className="text-right text-xs">
            <div className="mb-1">
              <span className="text-secondary">Messages:</span> 
              <span className="font-medium ml-1">{chat.messages.length}</span>
            </div>
            <div className="mb-1">
              <span className="text-secondary">Elements:</span> 
              <span className="font-medium ml-1">{canvas.elements.length}</span>
            </div>
            <div className="mb-1">
              <span className="text-secondary">Phase:</span> 
              <span className="font-medium ml-1 capitalize">{chat.currentPhase}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-secondary">Auto-sync enabled</span>
            </div>
          </div>
        </header>
        
        <div className="canvas-container">
          <div className="h-full flex flex-col">
            {/* Canvas Toolbar */}
            <div className="flex gap-2 mb-4 p-2 bg-canvas-grid rounded">
              <button 
                onClick={() => addCanvasElement({
                  type: 'shape',
                  position: { x: Math.random() * 200, y: Math.random() * 200 },
                  properties: { shapeType: 'circle', title: 'Test Shape' }
                })}
                className="text-xs px-3 py-1 bg-primary text-white rounded hover:bg-primary-hover"
              >
                Add Shape
              </button>
              <button 
                onClick={() => addCanvasElement({
                  type: 'text',
                  position: { x: Math.random() * 200, y: Math.random() * 200 },
                  properties: { text: 'Sample Text', title: 'Text Element' }
                })}
                className="text-xs px-3 py-1 bg-accent text-white rounded hover:bg-accent/90"
              >
                Add Text
              </button>
              <button 
                onClick={() => setCurrentPhase(
                  chat.currentPhase === 'exploration' ? 'validation' : 
                  chat.currentPhase === 'validation' ? 'planning' : 'exploration'
                )}
                className="text-xs px-3 py-1 border border-divider rounded hover:bg-primary/5"
              >
                Phase: {chat.currentPhase}
              </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-white border border-divider rounded-lg p-4">
              {canvas.elements.length === 0 ? (
                <div className="h-full flex items-center justify-center text-secondary">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-canvas-grid flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <p>Canvas ready for elements</p>
                    <p className="text-sm mt-2">Type messages in chat to generate elements</p>
                  </div>
                </div>
              ) : (
                <div className="relative h-full">
                  {canvas.elements.map((element) => (
                    <div
                      key={element.id}
                      className="absolute bg-primary/10 border border-primary rounded p-2 cursor-move"
                      style={{
                        left: element.position.x,
                        top: element.position.y,
                        transform: `scale(${canvas.viewport.zoom})`
                      }}
                    >
                      <div className="text-xs font-semibold">{element.type}</div>
                      <div className="text-sm">{element.properties.title as string}</div>
                      {element.sourceMessage && (
                        <div className="text-xs text-primary">🔗 Synced</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </PaneErrorBoundary>
    </div>
  )
}