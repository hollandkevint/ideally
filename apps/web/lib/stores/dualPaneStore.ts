import { create } from 'zustand'

export interface CanvasElement {
  id: string
  type: 'shape' | 'text' | 'connector' | 'diagram'
  position: { x: number; y: number }
  properties: Record<string, unknown>
  sourceMessage?: string // Link to chat message that generated this element
}

export interface ContextBridge {
  id: string
  chatMessageId: string
  canvasElementId: string
  bridgeType: 'suggestion' | 'reference' | 'generated'
  timestamp: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  canvasElements?: string[] // IDs of related canvas elements
}

export interface DualPaneState {
  // Chat state
  chat: {
    messages: ChatMessage[]
    currentPhase: 'exploration' | 'validation' | 'planning'
    activeMessage?: string
  }
  
  // Canvas state
  canvas: {
    elements: CanvasElement[]
    viewport: { x: number; y: number; zoom: number }
    selectedElements: string[]
  }
  
  // Synchronization state
  sync: {
    contextBridges: ContextBridge[]
    lastUpdate: number
    isAutoSyncEnabled: boolean
  }
}

export interface DualPaneActions {
  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateChatMessage: (id: string, updates: Partial<ChatMessage>) => void
  setActiveMessage: (messageId?: string) => void
  setCurrentPhase: (phase: DualPaneState['chat']['currentPhase']) => void
  
  // Canvas actions
  addCanvasElement: (element: Omit<CanvasElement, 'id'>) => string
  updateCanvasElement: (id: string, updates: Partial<CanvasElement>) => void
  removeCanvasElement: (id: string) => void
  setSelectedElements: (elementIds: string[]) => void
  updateViewport: (viewport: Partial<DualPaneState['canvas']['viewport']>) => void
  
  // Sync actions
  createContextBridge: (chatMessageId: string, canvasElementId: string, bridgeType: ContextBridge['bridgeType']) => void
  removeContextBridge: (id: string) => void
  syncChatToCanvas: (messageId: string) => void
  syncCanvasToChat: (elementId: string) => void
  toggleAutoSync: () => void
  
  // Utility actions
  clearAll: () => void
  loadState: (state: Partial<DualPaneState>) => void
}

const initialState: DualPaneState = {
  chat: {
    messages: [],
    currentPhase: 'exploration'
  },
  canvas: {
    elements: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedElements: []
  },
  sync: {
    contextBridges: [],
    lastUpdate: Date.now(),
    isAutoSyncEnabled: true
  }
}

export const useDualPaneStore = create<DualPaneState & DualPaneActions>((set, get) => ({
  ...initialState,
  
  // Chat actions
  addChatMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }
    
    set((state) => ({
      chat: {
        ...state.chat,
        messages: [...state.chat.messages, newMessage]
      },
      sync: {
        ...state.sync,
        lastUpdate: Date.now()
      }
    }))
    
    // Auto-sync to canvas if enabled
    if (get().sync.isAutoSyncEnabled && message.role === 'user') {
      get().syncChatToCanvas(newMessage.id)
    }
  },
  
  updateChatMessage: (id, updates) => {
    set((state) => ({
      chat: {
        ...state.chat,
        messages: state.chat.messages.map(msg => 
          msg.id === id ? { ...msg, ...updates } : msg
        )
      },
      sync: {
        ...state.sync,
        lastUpdate: Date.now()
      }
    }))
  },
  
  setActiveMessage: (messageId) => {
    set((state) => ({
      chat: {
        ...state.chat,
        activeMessage: messageId
      }
    }))
  },
  
  setCurrentPhase: (phase) => {
    set((state) => ({
      chat: {
        ...state.chat,
        currentPhase: phase
      },
      sync: {
        ...state.sync,
        lastUpdate: Date.now()
      }
    }))
  },
  
  // Canvas actions
  addCanvasElement: (element) => {
    const newElement: CanvasElement = {
      ...element,
      id: crypto.randomUUID()
    }
    
    set((state) => ({
      canvas: {
        ...state.canvas,
        elements: [...state.canvas.elements, newElement]
      },
      sync: {
        ...state.sync,
        lastUpdate: Date.now()
      }
    }))
    
    return newElement.id
  },
  
  updateCanvasElement: (id, updates) => {
    set((state) => ({
      canvas: {
        ...state.canvas,
        elements: state.canvas.elements.map(el => 
          el.id === id ? { ...el, ...updates } : el
        )
      },
      sync: {
        ...state.sync,
        lastUpdate: Date.now()
      }
    }))
  },
  
  removeCanvasElement: (id) => {
    set((state) => ({
      canvas: {
        ...state.canvas,
        elements: state.canvas.elements.filter(el => el.id !== id),
        selectedElements: state.canvas.selectedElements.filter(sel => sel !== id)
      },
      sync: {
        ...state.sync,
        contextBridges: state.sync.contextBridges.filter(bridge => bridge.canvasElementId !== id),
        lastUpdate: Date.now()
      }
    }))
  },
  
  setSelectedElements: (elementIds) => {
    set((state) => ({
      canvas: {
        ...state.canvas,
        selectedElements: elementIds
      }
    }))
  },
  
  updateViewport: (viewport) => {
    set((state) => ({
      canvas: {
        ...state.canvas,
        viewport: { ...state.canvas.viewport, ...viewport }
      }
    }))
  },
  
  // Sync actions
  createContextBridge: (chatMessageId, canvasElementId, bridgeType) => {
    const bridge: ContextBridge = {
      id: crypto.randomUUID(),
      chatMessageId,
      canvasElementId,
      bridgeType,
      timestamp: new Date().toISOString()
    }
    
    set((state) => ({
      sync: {
        ...state.sync,
        contextBridges: [...state.sync.contextBridges, bridge],
        lastUpdate: Date.now()
      }
    }))
  },
  
  removeContextBridge: (id) => {
    set((state) => ({
      sync: {
        ...state.sync,
        contextBridges: state.sync.contextBridges.filter(bridge => bridge.id !== id),
        lastUpdate: Date.now()
      }
    }))
  },
  
  syncChatToCanvas: (messageId) => {
    const state = get()
    const message = state.chat.messages.find(m => m.id === messageId)
    
    if (!message || message.role !== 'user') return
    
    // Simple sync logic: suggest canvas elements based on message content
    const content = message.content.toLowerCase()
    
    // Detect if user is describing processes, structures, or concepts
    if (content.includes('process') || content.includes('flow') || content.includes('step')) {
      const elementId = get().addCanvasElement({
        type: 'diagram',
        position: { x: 100, y: 100 },
        properties: {
          diagramType: 'flowchart',
          title: 'Process Flow',
          suggested: true
        },
        sourceMessage: messageId
      })
      
      get().createContextBridge(messageId, elementId, 'suggestion')
    }
    
    if (content.includes('idea') || content.includes('concept') || content.includes('brainstorm')) {
      const elementId = get().addCanvasElement({
        type: 'shape',
        position: { x: 150, y: 150 },
        properties: {
          shapeType: 'bubble',
          text: 'New Idea',
          suggested: true
        },
        sourceMessage: messageId
      })
      
      get().createContextBridge(messageId, elementId, 'suggestion')
    }
  },
  
  syncCanvasToChat: (elementId) => {
    const state = get()
    const element = state.canvas.elements.find(el => el.id === elementId)
    
    if (!element) return
    
    // Create reference in chat context for AI to use
    set((state) => ({
      chat: {
        ...state.chat,
        messages: state.chat.messages.map(msg => {
          if (msg.id === state.chat.activeMessage) {
            return {
              ...msg,
              canvasElements: [...(msg.canvasElements || []), elementId]
            }
          }
          return msg
        })
      }
    }))
  },
  
  toggleAutoSync: () => {
    set((state) => ({
      sync: {
        ...state.sync,
        isAutoSyncEnabled: !state.sync.isAutoSyncEnabled
      }
    }))
  },
  
  // Utility actions
  clearAll: () => {
    set(initialState)
  },
  
  loadState: (partialState) => {
    set((state) => ({
      ...state,
      ...partialState,
      sync: {
        ...state.sync,
        lastUpdate: Date.now()
      }
    }))
  }
}))

// Selectors for common patterns
export const useChatMessages = () => useDualPaneStore(state => state.chat.messages)
export const useCanvasElements = () => useDualPaneStore(state => state.canvas.elements)
export const useContextBridges = () => useDualPaneStore(state => state.sync.contextBridges)
export const useCurrentPhase = () => useDualPaneStore(state => state.chat.currentPhase)
export const useSelectedElements = () => useDualPaneStore(state => state.canvas.selectedElements)