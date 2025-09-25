import { describe, it, expect, beforeEach } from 'vitest'
import { useDualPaneStore } from '../../lib/stores/dualPaneStore'

// Mock crypto.randomUUID for testing
global.crypto = {
  randomUUID: () => Math.random().toString(36).substring(2, 15)
} as Crypto

describe('DualPaneStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDualPaneStore.getState().clearAll()
  })

  describe('Chat Actions', () => {
    it('should add chat messages', () => {
      const { addChatMessage } = useDualPaneStore.getState()
      
      addChatMessage({
        role: 'user',
        content: 'Test message'
      })
      
      const messages = useDualPaneStore.getState().chat.messages
      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('Test message')
      expect(messages[0].role).toBe('user')
      expect(messages[0].id).toBeDefined()
      expect(messages[0].timestamp).toBeDefined()
    })

    it('should update chat messages', () => {
      const { addChatMessage, updateChatMessage } = useDualPaneStore.getState()
      
      addChatMessage({
        role: 'user',
        content: 'Original message'
      })
      
      const messageId = useDualPaneStore.getState().chat.messages[0].id
      
      updateChatMessage(messageId, {
        content: 'Updated message'
      })
      
      const messages = useDualPaneStore.getState().chat.messages
      expect(messages[0].content).toBe('Updated message')
    })
  })

  describe('Canvas Actions', () => {
    it('should add canvas elements', () => {
      const { addCanvasElement } = useDualPaneStore.getState()
      
      const elementId = addCanvasElement({
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: { shape: 'circle', color: 'blue' }
      })
      
      const elements = useDualPaneStore.getState().canvas.elements
      expect(elements).toHaveLength(1)
      expect(elements[0].id).toBe(elementId)
      expect(elements[0].type).toBe('shape')
      expect(elements[0].position).toEqual({ x: 100, y: 100 })
    })

    it('should update canvas elements', () => {
      const { addCanvasElement, updateCanvasElement } = useDualPaneStore.getState()
      
      const elementId = addCanvasElement({
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: { color: 'blue' }
      })
      
      updateCanvasElement(elementId, {
        position: { x: 200, y: 200 },
        properties: { color: 'red' }
      })
      
      const elements = useDualPaneStore.getState().canvas.elements
      expect(elements[0].position).toEqual({ x: 200, y: 200 })
      expect(elements[0].properties.color).toBe('red')
    })

    it('should remove canvas elements', () => {
      const { addCanvasElement, removeCanvasElement } = useDualPaneStore.getState()
      
      const elementId = addCanvasElement({
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {}
      })
      
      removeCanvasElement(elementId)
      
      const elements = useDualPaneStore.getState().canvas.elements
      expect(elements).toHaveLength(0)
    })
  })

  describe('State Synchronization', () => {
    it('should create context bridges', () => {
      const { addChatMessage, addCanvasElement, createContextBridge } = useDualPaneStore.getState()
      
      addChatMessage({
        role: 'user',
        content: 'Test message'
      })
      
      const messageId = useDualPaneStore.getState().chat.messages[0].id
      
      const elementId = addCanvasElement({
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {}
      })
      
      createContextBridge(messageId, elementId, 'suggestion')
      
      const bridges = useDualPaneStore.getState().sync.contextBridges
      expect(bridges).toHaveLength(1)
      expect(bridges[0].chatMessageId).toBe(messageId)
      expect(bridges[0].canvasElementId).toBe(elementId)
      expect(bridges[0].bridgeType).toBe('suggestion')
    })

    it('should sync chat to canvas', () => {
      const { addChatMessage, syncChatToCanvas } = useDualPaneStore.getState()
      
      addChatMessage({
        role: 'user',
        content: 'I need to create a process flow diagram'
      })
      
      const messageId = useDualPaneStore.getState().chat.messages[0].id
      
      syncChatToCanvas(messageId)
      
      const elements = useDualPaneStore.getState().canvas.elements
      const bridges = useDualPaneStore.getState().sync.contextBridges
      
      expect(elements.length).toBeGreaterThan(0)
      expect(bridges.length).toBeGreaterThan(0)
      expect(elements[0].properties.suggested).toBe(true)
    })

    it('should handle auto sync toggle', () => {
      const { toggleAutoSync } = useDualPaneStore.getState()
      
      expect(useDualPaneStore.getState().sync.isAutoSyncEnabled).toBe(true)
      
      toggleAutoSync()
      
      expect(useDualPaneStore.getState().sync.isAutoSyncEnabled).toBe(false)
      
      toggleAutoSync()
      
      expect(useDualPaneStore.getState().sync.isAutoSyncEnabled).toBe(true)
    })
  })

  describe('State Management', () => {
    it('should clear all state', () => {
      const { addChatMessage, addCanvasElement, clearAll } = useDualPaneStore.getState()
      
      addChatMessage({ role: 'user', content: 'Test' })
      addCanvasElement({
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {}
      })
      
      expect(useDualPaneStore.getState().chat.messages).toHaveLength(1)
      expect(useDualPaneStore.getState().canvas.elements).toHaveLength(1)
      
      clearAll()
      
      expect(useDualPaneStore.getState().chat.messages).toHaveLength(0)
      expect(useDualPaneStore.getState().canvas.elements).toHaveLength(0)
      expect(useDualPaneStore.getState().sync.contextBridges).toHaveLength(0)
    })

    it('should load partial state', () => {
      const { loadState } = useDualPaneStore.getState()
      
      loadState({
        chat: {
          currentPhase: 'validation'
        }
      })
      
      expect(useDualPaneStore.getState().chat.currentPhase).toBe('validation')
    })
  })
})