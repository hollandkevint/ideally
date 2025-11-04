/**
 * Canvas State Manager
 * Handles canvas state persistence and synchronization
 */

import { BmadDatabase } from '../bmad/database';

export interface CanvasState {
  sessionId: string;
  elements: CanvasElement[];
  mermaidDiagrams: MermaidDiagram[];
  viewport: Viewport;
  version: number;
  lastModified: Date;
}

export interface CanvasElement {
  id: string;
  type: 'shape' | 'text' | 'connector' | 'image';
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
  style: ElementStyle;
  data: any;
  linkedToConversation?: string;
}

export interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
}

export interface MermaidDiagram {
  id: string;
  code: string;
  type: 'flowchart' | 'sequence' | 'gantt' | 'class' | 'state' | 'canvas';
  position: { x: number; y: number };
  scale: number;
}

export interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * Canvas Manager
 * Manages canvas state persistence and recovery
 */
export class CanvasManager {
  private stateCache = new Map<string, CanvasState>();
  private autoSaveTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    // Database methods are now static, no need to store instance
  }

  /**
   * Save canvas state
   */
  async saveState(sessionId: string, state: Partial<CanvasState>): Promise<void> {
    try {
      const currentState = await this.loadState(sessionId) || this.createDefaultState(sessionId);

      const updatedState: CanvasState = {
        ...currentState,
        ...state,
        sessionId,
        version: currentState.version + 1,
        lastModified: new Date()
      };

      // Update cache
      this.stateCache.set(sessionId, updatedState);

      // Save to database using static method
      await BmadDatabase.saveCanvasState(sessionId, {
        canvas_data: updatedState,
        canvas_version: updatedState.version,
        canvas_updated_at: updatedState.lastModified
      });

    } catch (error) {
      throw new Error(`Failed to save canvas state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load canvas state
   */
  async loadState(sessionId: string): Promise<CanvasState | null> {
    try {
      // Check cache first
      const cachedState = this.stateCache.get(sessionId);
      if (cachedState) {
        return cachedState;
      }

      // Load from database using static method
      const canvasData = await BmadDatabase.getCanvasState(sessionId);
      if (!canvasData) {
        return null;
      }

      const state: CanvasState = {
        sessionId,
        elements: canvasData.canvas_data?.elements || [],
        mermaidDiagrams: canvasData.canvas_data?.mermaidDiagrams || [],
        viewport: canvasData.canvas_data?.viewport || { zoom: 1, pan: { x: 0, y: 0 } },
        version: canvasData.canvas_version || 0,
        lastModified: new Date(canvasData.canvas_updated_at || Date.now())
      };

      // Cache the loaded state
      this.stateCache.set(sessionId, state);

      return state;

    } catch (error) {
      throw new Error(`Failed to load canvas state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add element to canvas
   */
  async addElement(sessionId: string, element: Omit<CanvasElement, 'id'>): Promise<CanvasElement> {
    try {
      const state = await this.loadState(sessionId) || this.createDefaultState(sessionId);

      const newElement: CanvasElement = {
        ...element,
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      state.elements.push(newElement);

      await this.saveState(sessionId, { elements: state.elements });

      return newElement;

    } catch (error) {
      throw new Error(`Failed to add element: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update element
   */
  async updateElement(sessionId: string, elementId: string, updates: Partial<CanvasElement>): Promise<void> {
    try {
      const state = await this.loadState(sessionId);
      if (!state) {
        throw new Error('Canvas state not found');
      }

      state.elements = state.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      );

      await this.saveState(sessionId, { elements: state.elements });

    } catch (error) {
      throw new Error(`Failed to update element: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete element
   */
  async deleteElement(sessionId: string, elementId: string): Promise<void> {
    try {
      const state = await this.loadState(sessionId);
      if (!state) {
        throw new Error('Canvas state not found');
      }

      state.elements = state.elements.filter(el => el.id !== elementId);

      await this.saveState(sessionId, { elements: state.elements });

    } catch (error) {
      throw new Error(`Failed to delete element: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add Mermaid diagram
   */
  async addMermaidDiagram(sessionId: string, diagram: Omit<MermaidDiagram, 'id'>): Promise<MermaidDiagram> {
    try {
      const state = await this.loadState(sessionId) || this.createDefaultState(sessionId);

      const newDiagram: MermaidDiagram = {
        ...diagram,
        id: `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      state.mermaidDiagrams.push(newDiagram);

      await this.saveState(sessionId, { mermaidDiagrams: state.mermaidDiagrams });

      return newDiagram;

    } catch (error) {
      throw new Error(`Failed to add Mermaid diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update viewport
   */
  async updateViewport(sessionId: string, viewport: Partial<Viewport>): Promise<void> {
    try {
      const state = await this.loadState(sessionId) || this.createDefaultState(sessionId);

      state.viewport = {
        ...state.viewport,
        ...viewport
      };

      await this.saveState(sessionId, { viewport: state.viewport });

    } catch (error) {
      throw new Error(`Failed to update viewport: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear canvas
   */
  async clearCanvas(sessionId: string): Promise<void> {
    try {
      const defaultState = this.createDefaultState(sessionId);
      await this.saveState(sessionId, defaultState);
      this.stateCache.delete(sessionId);

    } catch (error) {
      throw new Error(`Failed to clear canvas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start auto-save for session
   */
  startAutoSave(sessionId: string, interval: number = 30000): void {
    // Clear existing timer
    this.stopAutoSave(sessionId);

    const timer = setInterval(async () => {
      const state = this.stateCache.get(sessionId);
      if (state) {
        try {
          await this.saveState(sessionId, state);
        } catch (error) {
          console.error(`Auto-save failed for session ${sessionId}:`, error);
        }
      }
    }, interval);

    this.autoSaveTimers.set(sessionId, timer);
  }

  /**
   * Stop auto-save for session
   */
  stopAutoSave(sessionId: string): void {
    const timer = this.autoSaveTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(sessionId);
    }
  }

  /**
   * Create default canvas state
   */
  private createDefaultState(sessionId: string): CanvasState {
    return {
      sessionId,
      elements: [],
      mermaidDiagrams: [],
      viewport: {
        zoom: 1,
        pan: { x: 0, y: 0 }
      },
      version: 0,
      lastModified: new Date()
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(sessionId?: string): void {
    if (sessionId) {
      this.stopAutoSave(sessionId);
      this.stateCache.delete(sessionId);
    } else {
      // Cleanup all sessions
      this.autoSaveTimers.forEach((timer, sid) => {
        this.stopAutoSave(sid);
      });
      this.stateCache.clear();
    }
  }
}

// Export singleton instance
export const canvasManager = new CanvasManager();
