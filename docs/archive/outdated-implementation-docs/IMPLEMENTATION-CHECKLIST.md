# Implementation Checklist - Claude Sonnet 4 Integration

## Document Information

| Field | Value |
|-------|-------|
| **Document Type** | Developer Implementation Checklist |
| **Version** | 1.0 |
| **Date** | 2025-08-25 |
| **Based On** | PRD-Claude-Sonnet-4-Integration.md |
| **Target** | Transform hardcoded AI to real Claude integration |

---

## Prerequisites & Setup

### ✅ Already Complete
- [x] Next.js 15 application running
- [x] Supabase authentication working
- [x] Database schema designed
- [x] Dual-pane interface foundation
- [x] Development environment stable

### 🔧 Required Before Starting

#### Environment Setup
- [ ] **Create Supabase Project**
  - Go to [supabase.com](https://supabase.com) 
  - Create new project
  - Note Project URL and anon key
  - Apply schema from `supabase/schema.sql`
  
- [ ] **Get Claude API Access**
  - Sign up at [console.anthropic.com](https://console.anthropic.com)
  - Generate API key
  - Verify access to Claude 3.5 Sonnet

- [ ] **Configure Environment Variables**
  ```bash
  # Create apps/web/.env.local
  ANTHROPIC_API_KEY=your_anthropic_api_key
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url  
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

---

## Phase 1: Core AI Integration (MVP)

### 📦 1. Install Dependencies

**Location:** `apps/web/package.json`

**Action:**
```bash
cd apps/web
npm install @anthropic-ai/sdk@^0.17.0
```

**Verification:**
```bash
npm list @anthropic-ai/sdk
```

---

### 🤖 2. Create AI Service Layer

#### 2.1 Claude API Client

**Create File:** `apps/web/lib/ai/claude-client.ts`

**Implementation:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface StreamingResponse {
  id: string;
  content: AsyncIterable<string>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeClient {
  async sendMessage(
    message: string, 
    conversationHistory: any[] = [],
    persona: string = 'mary'
  ): Promise<StreamingResponse> {
    try {
      const stream = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.7,
        system: this.getPersonaPrompt(persona),
        messages: [...conversationHistory, { role: 'user', content: message }],
        stream: true,
      });

      return this.processStream(stream);
    } catch (error) {
      throw new ClaudeApiError(`Failed to send message: ${error.message}`);
    }
  }

  private getPersonaPrompt(persona: string): string {
    // Implementation from PRD Mary persona specification
    return `You are Mary, a seasoned AI Business Analyst...`;
  }

  private async processStream(stream: any): Promise<StreamingResponse> {
    // Process Claude streaming response
    // Implementation details in PRD
  }
}

export class ClaudeApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeApiError';
  }
}

export const claudeClient = new ClaudeClient();
```

**Acceptance Criteria:**
- [ ] File created with complete TypeScript interface
- [ ] Error handling for API failures
- [ ] Streaming response processing
- [ ] Environment variable integration
- [ ] Proper export for application use

#### 2.2 Mary Persona Configuration

**Create File:** `apps/web/lib/ai/mary-persona.ts`

**Implementation:** Based on PRD specification (section 2.2)

**Acceptance Criteria:**
- [ ] Mary's strategic coaching prompt implemented
- [ ] Adaptive communication style logic
- [ ] Strategic expertise domains configured
- [ ] Conversation context management

#### 2.3 Streaming Utilities

**Create File:** `apps/web/lib/ai/streaming.ts`

**Implementation:** Server-Sent Events handling utilities

**Acceptance Criteria:**
- [ ] SSE encoding/decoding utilities
- [ ] Error handling for connection issues
- [ ] Reconnection logic implementation
- [ ] Message chunking for UI updates

---

### 🔌 3. Create API Routes

#### 3.1 Streaming Chat Endpoint

**Create File:** `apps/web/app/api/chat/stream/route.ts`

**Implementation:**
```typescript
import { NextRequest } from 'next/server';
import { claudeClient } from '@/lib/ai/claude-client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, workspaceId } = await request.json();
    
    // Validate request
    if (!message || !workspaceId) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Get user context
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get conversation history
    const conversationHistory = await getConversationHistory(conversationId);
    
    // Stream Claude response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await claudeClient.sendMessage(
            message, 
            conversationHistory,
            'mary'
          );
          
          const encoder = new TextEncoder();
          
          for await (const chunk of response.content) {
            const data = JSON.stringify({ 
              type: 'content', 
              content: chunk 
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          
          // Send completion
          const completion = JSON.stringify({ 
            type: 'complete',
            usage: response.usage 
          });
          controller.enqueue(encoder.encode(`data: ${completion}\n\n`));
          controller.close();
          
        } catch (error) {
          const errorData = JSON.stringify({ 
            type: 'error', 
            error: error.message 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function getConversationHistory(conversationId: string) {
  // Implementation to fetch from database
}
```

**Acceptance Criteria:**
- [ ] POST endpoint handles streaming requests
- [ ] User authentication verification
- [ ] Conversation history retrieval
- [ ] Server-Sent Events streaming
- [ ] Error handling and status codes
- [ ] Database integration for persistence

#### 3.2 Conversation Management Endpoint

**Create File:** `apps/web/app/api/conversations/route.ts`

**Implementation:** CRUD operations for conversation management

**Acceptance Criteria:**
- [ ] Create new conversation
- [ ] Retrieve conversation history
- [ ] Update conversation metadata
- [ ] Delete conversation with cleanup

---

### 🖥️ 4. Replace Hardcoded Responses

#### 4.1 Update Workspace Page

**Modify File:** `apps/web/app/workspace/[id]/page.tsx`

**Current Issue (Lines 104-110):**
```typescript
// REMOVE THIS HARDCODED SIMULATION
setTimeout(async () => {
  await addChatMessage({
    role: 'assistant',
    content: "I understand you're working on: \"" + messageInput + "\". Let me help you think through this strategically. What specific aspect would you like to explore first?"
  })
}, 1000)
```

**Replace With:**
```typescript
// Real Claude streaming integration
const sendMessageToAI = async (userMessage: string) => {
  try {
    setSendingMessage(true);
    
    // Add user message immediately
    await addChatMessage({
      role: 'user',
      content: userMessage
    });
    
    // Create conversation if needed
    const conversationId = await ensureConversation(workspace.id);
    
    // Stream Claude response
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        conversationId,
        workspaceId: workspace.id
      })
    });
    
    if (!response.body) throw new Error('No response stream');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let assistantMessage = '';
    const messageId = crypto.randomUUID();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          if (data.type === 'content') {
            assistantMessage += data.content;
            // Update UI with streaming content
            updateStreamingMessage(messageId, assistantMessage);
          } else if (data.type === 'complete') {
            // Finalize message in database
            await finalizeMessage(messageId, assistantMessage, data.usage);
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('AI response error:', error);
    await addChatMessage({
      role: 'assistant', 
      content: 'I apologize, but I encountered an issue. Please try again.'
    });
  } finally {
    setSendingMessage(false);
  }
};
```

**Acceptance Criteria:**
- [ ] Hardcoded setTimeout removed completely
- [ ] Real Claude API integration implemented
- [ ] Streaming UI updates working
- [ ] Error handling for API failures
- [ ] Message persistence to database
- [ ] Loading states updated appropriately

#### 4.2 Add Streaming UI Components

**Create File:** `apps/web/components/chat/StreamingMessage.tsx`

**Implementation:**
```typescript
interface StreamingMessageProps {
  messageId: string;
  content: string;
  isComplete: boolean;
}

export function StreamingMessage({ messageId, content, isComplete }: StreamingMessageProps) {
  return (
    <div className="chat-message-assistant">
      <p>
        <strong>Mary:</strong> {content}
        {!isComplete && <span className="animate-pulse">|</span>}
      </p>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Real-time content updates
- [ ] Loading indicator while streaming
- [ ] Proper styling integration
- [ ] TypeScript interfaces defined

---

### 🗄️ 5. Database Integration

#### 5.1 Update Database Schema Usage

**Current:** Application uses simplified `workspaces` table
**Target:** Use comprehensive schema from `supabase/schema.sql`

**Migration Steps:**
1. [ ] Backup existing workspace data
2. [ ] Apply comprehensive schema to Supabase project
3. [ ] Migrate data to new structure
4. [ ] Update application code to use new tables
5. [ ] Test data integrity

**Key Tables to Integrate:**
- [ ] `chat_conversations` - Replace workspace.chat_context
- [ ] `chat_messages` - Individual message storage
- [ ] `strategic_insights` - AI-extracted insights
- [ ] `user_workspace` - Replace simplified workspaces

#### 5.2 Conversation Persistence

**Implementation:** Service layer for database operations

**Create File:** `apps/web/lib/database/conversations.ts`

**Acceptance Criteria:**
- [ ] Create conversation records
- [ ] Save messages with metadata
- [ ] Retrieve conversation history
- [ ] Update conversation state
- [ ] Handle user permissions (RLS)

---

### ✅ 6. Testing & Validation

#### 6.1 Manual Testing Checklist

**Environment Test:**
- [ ] Development server starts without errors
- [ ] Environment variables loaded correctly
- [ ] Claude API connectivity working
- [ ] Supabase connection established

**Authentication Flow:**
- [ ] User can sign up/login
- [ ] Protected routes working
- [ ] Session persistence across refreshes

**AI Integration:**
- [ ] User can send message in workspace
- [ ] Claude response streams in real-time
- [ ] Messages persist to database
- [ ] Error handling works for API failures
- [ ] Loading states display appropriately

**Core Functionality:**
- [ ] Conversation history displays correctly
- [ ] Multiple conversations can be managed
- [ ] Mary persona responds consistently
- [ ] Response times under 2 seconds
- [ ] No hardcoded responses remain

#### 6.2 Performance Validation

**Metrics to Verify:**
- [ ] Initial response time < 2 seconds
- [ ] Streaming latency < 100ms per chunk
- [ ] Database queries < 500ms
- [ ] Memory usage stable during streaming
- [ ] No memory leaks in long conversations

#### 6.3 Error Scenarios

**Test Cases:**
- [ ] Network interruption during streaming
- [ ] Claude API rate limit exceeded
- [ ] Invalid API key handling
- [ ] Database connection failures
- [ ] User session expiration during chat

---

## Phase 2: Enhanced Features (Post-MVP)

### 📝 Rich Message Formatting

**Target:** Markdown rendering, collapsible sections, action items

**Implementation Files:**
- [ ] Install `react-markdown` dependency
- [ ] Create rich message components
- [ ] Add syntax highlighting for code blocks
- [ ] Implement collapsible sections
- [ ] Add interactive checkboxes for action items

### 🎯 Strategic Framework Templates

**Target:** SWOT analysis, Porter's Five Forces integration

**Implementation:**
- [ ] Create framework template system
- [ ] Add guided conversation flows
- [ ] Integrate with Mary persona prompts
- [ ] Add progress indicators
- [ ] Create export functionality

### 🔗 Context Bridging Foundation

**Target:** Chat-canvas integration preparation

**Implementation:**
- [ ] Design context bridge data structure
- [ ] Create reference system between chat/canvas
- [ ] Add visual connection indicators
- [ ] Implement bidirectional context flow
- [ ] Foundation for advanced canvas features

---

## Rollback Procedures

### If Issues Arise

#### 1. Revert to Hardcoded Responses
```typescript
// Temporary fallback if Claude integration fails
const fallbackResponse = {
  role: 'assistant',
  content: 'AI service temporarily unavailable. Please try again shortly.'
};
```

#### 2. Database Rollback
- [ ] Keep backup of original workspace data
- [ ] Revert to simplified table structure if needed
- [ ] Restore from migration backup

#### 3. Environment Recovery
- [ ] Document working environment variables
- [ ] Keep backup of package.json versions
- [ ] Have rollback commit ready

---

## Acceptance Criteria Summary

### MVP Success Criteria ✅

- [ ] **All hardcoded AI responses removed**
- [ ] **Real Claude Sonnet 4 integration working**
- [ ] **Streaming chat interface functional** 
- [ ] **Conversation persistence implemented**
- [ ] **Error handling for all failure modes**
- [ ] **Performance targets met** (<2s response time)
- [ ] **Authentication integration maintained**
- [ ] **Database schema utilized properly**

### Post-MVP Enhancement Criteria

- [ ] **Markdown rendering in messages**
- [ ] **Strategic framework templates**
- [ ] **Context bridging foundation**
- [ ] **Export functionality**
- [ ] **Mobile optimization**

---

## Support Resources

### Documentation References
- **Technical Guide:** `docs/TECHNICAL-GUIDE.md` - Master architecture reference  
- **PRD Specification:** `docs/PRD-Claude-Sonnet-4-Integration.md` - Complete requirements
- **Story Details:** `docs/stories/1.4.conversational-ai-coaching.md` - Implementation specifics

### External Resources
- **Claude API Docs:** https://docs.anthropic.com/claude/reference
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Streaming:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming

### Emergency Contacts
- **API Issues:** Anthropic support via console
- **Database Issues:** Supabase support via dashboard
- **Deployment Issues:** Vercel support via dashboard

---

**This checklist provides step-by-step instructions for transforming thinkhaven from hardcoded AI simulation to real Claude Sonnet 4 powered strategic coaching platform.**