# Frontend Architecture

## Component Architecture

### Component Organization
```
apps/web/app/components/
├── ui/                    # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── chat/                  # AI conversation components
│   ├── ChatInterface.tsx
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   └── StreamingMessage.tsx
├── workspace/             # Workspace management
│   ├── WorkspaceList.tsx
│   ├── WorkspaceHeader.tsx
│   └── WorkspaceSettings.tsx
├── dual-pane/            # Dual-pane layout system
│   ├── DualPaneLayout.tsx
│   ├── PaneResizer.tsx
│   └── PaneErrorBoundary.tsx
├── bmad/                 # Strategic framework UI
│   ├── BmadInterface.tsx
│   ├── TemplateSelector.tsx
│   └── AnalysisDisplay.tsx
└── canvas/               # Visual workspace (planned)
    ├── CanvasWorkspace.tsx
    ├── DrawingTools.tsx
    └── ElementManager.tsx
```

### Component Template
```typescript
'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import type { ComponentProps } from '@/types/components'

interface ExampleComponentProps {
  workspaceId: string
  onUpdate?: (data: any) => void
}

export default function ExampleComponent({ 
  workspaceId, 
  onUpdate 
}: ExampleComponentProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleAction = useCallback(async () => {
    setLoading(true)
    try {
      // Component logic
      onUpdate?.(result)
    } catch (error) {
      console.error('Component error:', error)
    } finally {
      setLoading(false)
    }
  }, [onUpdate])

  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  )
}
```

## State Management Architecture

### State Structure
```typescript
// Zustand store for dual-pane coordination
interface DualPaneStore {
  // Layout state
  chatWidth: number
  canvasWidth: number
  activPane: 'chat' | 'canvas'
  collapsed: boolean
  
  // Workspace state
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  
  // Chat state
  activeConversation: Conversation | null
  messages: Message[]
  streamingMessage: string
  
  // Canvas state (planned)
  canvasElements: CanvasElement[]
  selectedElements: string[]
  
  // Actions
  setWorkspace: (workspace: Workspace) => void
  updateLayout: (layout: LayoutConfig) => void
  addMessage: (message: Message) => void
  updateStreamingMessage: (content: string) => void
}
```

### State Management Patterns
- **Zustand for UI State:** Dual-pane layout, active workspace, streaming messages
- **React Query for Server State:** Conversations, workspaces, BMad templates
- **Local State for Component State:** Form inputs, loading states, UI interactions
- **Supabase Real-time for Live Data:** Conversation updates, workspace collaboration

## Routing Architecture

### Route Organization
```
apps/web/app/
├── page.tsx                    # Landing page
├── login/
│   └── page.tsx               # Authentication
├── dashboard/
│   └── page.tsx               # Workspace dashboard
├── workspace/
│   └── [id]/
│       └── page.tsx           # Main dual-pane interface
└── api/
    ├── chat/
    │   ├── stream/
    │   │   └── route.ts       # AI streaming endpoint
    │   └── summarize/
    │       └── route.ts       # Conversation summarization
    ├── workspaces/
    │   └── route.ts           # Workspace CRUD
    └── bmad/
        ├── templates/
        │   └── route.ts       # Template management
        └── analysis/
            └── route.ts       # Strategic analysis
```

### Protected Route Pattern
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div>
      {/* Protected content */}
    </div>
  )
}
```

## Frontend Services Layer

### API Client Setup
```typescript
// lib/api/client.ts
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  async streamConversation(
    message: string, 
    workspaceId: string,
    conversationHistory: ConversationMessage[] = []
  ): Promise<ReadableStream> {
    const response = await fetch(`${this.baseUrl}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, workspaceId, conversationHistory })
    })

    if (!response.body) {
      throw new Error('Streaming not supported')
    }

    return response.body
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const response = await fetch(`${this.baseUrl}/workspaces`)
    return response.json()
  }
}

export const apiClient = new ApiClient()
```

### Service Example
```typescript
// lib/services/conversationService.ts
import { apiClient } from '@/lib/api/client'
import { useCallback, useState } from 'react'

export function useConversationStreaming() {
  const [streaming, setStreaming] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')

  const streamMessage = useCallback(async (
    message: string,
    workspaceId: string,
    onChunk: (chunk: string) => void
  ) => {
    setStreaming(true)
    setCurrentMessage('')
    
    try {
      const stream = await apiClient.streamConversation(message, workspaceId)
      const reader = stream.getReader()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = new TextDecoder().decode(value)
        setCurrentMessage(prev => prev + chunk)
        onChunk(chunk)
      }
    } finally {
      setStreaming(false)
    }
  }, [])

  return { streamMessage, streaming, currentMessage }
}
```
