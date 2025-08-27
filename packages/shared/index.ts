// Shared TypeScript interfaces and utilities for Ideally.co platform

// Core user and workspace types
export interface User {
  id: string;
  email: string;
  created_at: Date;
}

export interface WorkspaceState {
  chat_context: ChatMessage[];
  canvas_elements: CanvasElement[];
  last_session_progress: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens_used?: number;
    strategic_tags?: string[];
  };
}

export interface CanvasElement {
  id: string;
  type: 'excalidraw' | 'mermaid';
  data: any;
  position: { x: number; y: number };
  created_at: Date;
}

// Strategic coaching types
export interface CoachingSession {
  id: string;
  workspace_id: string;
  session_type: 'exploration' | 'validation' | 'planning';
  started_at: Date;
  completed_at?: Date;
}

// Utility types
export type ApiResponse<T> = {
  data: T;
  error?: string;
  success: boolean;
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';