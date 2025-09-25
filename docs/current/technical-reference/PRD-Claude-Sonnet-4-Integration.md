# Product Requirements Document: Claude Sonnet 4 AI Coaching Integration

## Document Information

| Field | Value |
|-------|-------|
| **Product** | thinkhaven Strategic Workspace |
| **Document Type** | Brownfield Enhancement PRD |
| **Version** | 1.0 |
| **Date** | 2025-08-25 |
| **Author** | Product Management Team |
| **Status** | Draft |

---

## Executive Summary

### Project Overview

The thinkhaven platform currently exists as a sophisticated Next.js 15 application with foundational dual-pane workspace architecture, working Supabase authentication, and comprehensive database schema designed for AI integration. However, **the critical gap is the absence of actual Claude Sonnet 4 integration** - current "Mary" AI responses are hardcoded simulations requiring replacement with real AI capabilities.

This PRD defines the brownfield enhancement to transform thinkhaven from its current foundation state into a fully functional AI-powered strategic coaching platform by integrating Claude Sonnet 4 API with streaming responses, intelligent conversation management, and real-time coaching features.

### Business Context

- **Current State**: Working Next.js foundation with simulated AI responses
- **Critical Gap**: No actual Claude integration (hardcoded responses in `workspace/[id]/page.tsx:104-110`)
- **Target**: Production-ready AI coaching platform with real Claude Sonnet 4 integration
- **Market Position**: Strategic thinking workspace powered by advanced AI coaching

### Success Metrics

- **Technical**: <2s AI response time, >95% API reliability, seamless streaming interface
- **Business**: >80% session completion rate, >10min average session duration
- **User Experience**: Intuitive dual-pane interaction with context bridging

---

## Current State Analysis

### Existing System Strengths

| Component | Status | Details |
|-----------|--------|---------|
| **Next.js 15 Foundation** | ✅ Complete | App Router, Turbopack, TypeScript integration |
| **Authentication System** | ✅ Working | Supabase Auth with user management |
| **Database Schema** | ✅ Comprehensive | AI-ready schema with conversation/context tables |
| **Dual-Pane Interface** | ✅ Designed | CSS system supporting chat and canvas panes |
| **Project Structure** | ✅ Professional | Monorepo with proper module organization |

### Critical Gaps Requiring Enhancement

| Gap | Impact | Current Implementation |
|-----|--------|----------------------|
| **No Claude Integration** | 🔴 Critical | Hardcoded "Mary" responses with setTimeout |
| **Missing API Layer** | 🔴 Critical | No `/app/api/` routes for AI streaming |
| **Incomplete Database Setup** | 🟡 High | Schema exists but no Supabase project configured |
| **Canvas Placeholder** | 🟡 Medium | "Integration coming soon" message only |
| **No Streaming Interface** | 🔴 Critical | Static message display without real-time updates |

### Technical Debt Assessment

1. **Simulated AI Responses**: Lines 104-110 in `workspace/[id]/page.tsx` contain hardcoded responses
2. **Environment Configuration**: Missing `.env.local` with required API keys
3. **Database Migration Gap**: Code uses simplified `workspaces` table vs comprehensive schema
4. **Dependency Gaps**: Missing `@anthropic-ai/sdk` and streaming utilities

---

## Functional Requirements

### 1. Claude Sonnet 4 API Integration

**Requirement ID**: FR-001
**Priority**: P0 (Critical)

#### Acceptance Criteria

- **API Client Implementation**
  - Integrate `@anthropic-ai/sdk` for Claude Sonnet 4 access
  - Implement retry logic with exponential backoff (3 attempts, 2^n delay)
  - Token usage tracking with cost estimation display
  - Context window management (200k tokens) with intelligent truncation
  - Comprehensive error handling with graceful degradation

- **Rate Limiting & Performance**
  - Handle 4,000 requests per minute rate limits
  - Queue management system for concurrent requests
  - Response time target: <2 seconds for coaching interactions
  - Streaming response latency: <100ms per message chunk

#### Technical Implementation

```typescript
// Core API service structure
interface ClaudeApiService {
  sendMessage(message: string, conversationId: string): Promise<StreamingResponse>
  getTokenUsage(conversationId: string): Promise<TokenUsageMetrics>
  handleRateLimit(): Promise<QueueStatus>
}

// Required environment variables
ANTHROPIC_API_KEY=your_anthropic_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096
```

### 2. Mary AI Persona Implementation

**Requirement ID**: FR-002
**Priority**: P0 (Critical)

#### Acceptance Criteria

- **Persona Configuration**
  - System prompt defining Mary's strategic coaching personality
  - Consistent traits: professional, approachable, insightful, action-oriented
  - Domain expertise in business strategy and executive coaching
  - Adaptive communication style based on user context

- **Conversation Management**
  - Memory of conversation context (last 20 exchanges)
  - Strategic framework integration (SWOT, Porter's Five Forces)
  - Progress tracking for coaching sessions
  - Conversation summarization capabilities

#### Mary's Strategic Coaching Prompt

```typescript
const MARY_BASE_PROMPT = `
You are Mary, a seasoned AI Business Analyst with 15+ years of strategic consulting experience.

PERSONALITY TRAITS:
- Professional yet approachable, insightful without being overwhelming
- Action-oriented with bias toward practical implementation
- Expert in business strategy, problem-solving frameworks, executive coaching
- Adapts communication style to user's experience level and industry context

STRATEGIC EXPERTISE:
- Business strategy frameworks (Porter's Five Forces, Blue Ocean, etc.)
- Problem-solving methodologies (5 Whys, Root Cause Analysis)
- Strategic planning and execution frameworks
- Competitive analysis and market positioning

CONVERSATION STYLE:
- Ask probing questions revealing underlying assumptions
- Offer multiple perspectives on strategic challenges
- Provide actionable recommendations with clear next steps
- Reference established frameworks when relevant but don't over-complicate
`;
```

### 3. Real-Time Streaming Chat Interface

**Requirement ID**: FR-003
**Priority**: P0 (Critical)

#### Acceptance Criteria

- **Streaming Implementation**
  - Server-Sent Events for real-time message delivery
  - Progressive message rendering as tokens arrive
  - Loading states and error handling for connection issues
  - Message persistence during streaming interruptions

- **Rich Message Features**
  - Markdown rendering for formatted strategic insights
  - Collapsible sections for deep strategic exploration
  - Interactive elements: action item checkboxes, framework templates
  - Copy/export functionality for valuable insights

#### API Route Structure

```typescript
// /app/api/chat/stream/route.ts
export async function POST(request: Request) {
  const { message, conversationId } = await request.json() 
  
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Claude API streaming implementation
      for await (const chunk of claudeStream) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}

`))
      }
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
```

### 4. Database Integration & Persistence

**Requirement ID**: FR-004
**Priority**: P1 (High)

#### Acceptance Criteria

- **Conversation Storage**
  - Utilize existing comprehensive database schema
  - Auto-save conversation history with versioning
  - Strategic insights extraction and tagging
  - Full-text search across conversation history

- **Schema Integration**
  - Migrate from simplified `workspaces` table to comprehensive schema
  - Implement proper foreign key relationships
  - Enable Row Level Security policies for user isolation
  - Performance optimization through appropriate indexing

#### Database Migration Plan

1. **Phase 1**: Setup Supabase project and apply comprehensive schema
2. **Phase 2**: Migrate existing workspace data to new structure
3. **Phase 3**: Implement conversation and message persistence
4. **Phase 4**: Enable advanced features (insights, context bridging)

### 5. Context Bridging Foundation

**Requirement ID**: FR-005
**Priority**: P2 (Medium)

#### Acceptance Criteria

- **Chat-Canvas Integration**
  - Reference system linking chat messages to canvas elements
  - Visual indicators showing chat-canvas connections
  - Bidirectional context flow between panes
  - Foundation for advanced canvas features (Phase 2)

- **Strategic Workflow Support**
  - Framework template integration with visual representations
  - Progress tracking across multi-step strategic processes
  - Conversation branching for scenario exploration

---

## Technical Requirements

### System Architecture

#### Enhanced Application Structure

```
/apps/web/
├── app/
│   ├── api/                    # NEW: API routes for Claude integration
│   │   ├── chat/
│   │   │   └── stream/route.ts # Streaming chat endpoint
│   │   ├── conversations/
│   │   │   └── route.ts        # Conversation management
│   │   └── ai/
│   │       └── persona/route.ts # Mary persona configuration
│   └── workspace/[id]/
│       └── page.tsx            # MODIFY: Replace hardcoded responses
├── lib/
│   ├── ai/                     # NEW: AI service layer
│   │   ├── claude-client.ts    # Claude API wrapper
│   │   ├── mary-persona.ts     # Persona configuration
│   │   └── streaming.ts        # Server-Sent Events handling
│   └── components/
│       ├── chat/
│       │   └── StreamingMessage.tsx
│       └── workspace/
│           └── ContextBridge.tsx
└── package.json                # ADD: @anthropic-ai/sdk, streaming utilities
```

#### API Integration Points

| Component | Integration | Status |
|-----------|-------------|---------|
| **Authentication** | Existing Supabase auth → Claude user context | Ready |
| **Database** | Existing schema → conversation persistence | Needs setup |
| **Frontend** | Existing dual-pane → streaming interface | Needs enhancement |
| **Canvas** | Placeholder → context bridging foundation | Phase 2 |

### Performance Requirements

- **Response Time**: Initial Claude response <2 seconds
- **Streaming Latency**: Message chunk display <100ms
- **Database Query Time**: Conversation history <500ms
- **Page Load Time**: Workspace interface <2 seconds
- **API Reliability**: >99% uptime for Claude integration

### Security & Compliance

- **API Key Management**: Secure storage of Anthropic API key
- **User Data Protection**: Maintain existing RLS policies
- **Conversation Privacy**: User-isolated data access
- **Rate Limit Compliance**: Respect Anthropic API limits
- **Error Handling**: No sensitive data exposure in error messages

---

## Implementation Plan

### Phase 1: Core AI Integration (Weeks 1-3)

#### Week 1: Foundation Setup
- **Day 1-2**: Install and configure `@anthropic-ai/sdk`
- **Day 3-4**: Create Claude API client with basic error handling
- **Day 5-7**: Implement Mary persona configuration system

#### Week 2: Streaming Implementation
- **Day 1-3**: Build streaming API routes with Server-Sent Events
- **Day 4-5**: Create streaming chat interface components
- **Day 6-7**: Replace hardcoded responses in workspace page

#### Week 3: Database Integration
- **Day 1-2**: Setup Supabase project with comprehensive schema
- **Day 3-4**: Implement conversation persistence system
- **Day 5-7**: Add conversation history and search capabilities

### Phase 2: Enhanced Features (Weeks 4-6)

#### Week 4: Rich Interface
- **Day 1-3**: Implement Markdown rendering and rich formatting
- **Day 4-5**: Add strategic framework templates
- **Day 6-7**: Build export and sharing functionality

#### Week 5: Context Bridging
- **Day 1-3**: Create chat-canvas reference system
- **Day 4-5**: Implement visual connection indicators
- **Day 6-7**: Add bidirectional context flow

#### Week 6: Polish & Testing
- **Day 1-3**: Comprehensive testing and bug fixes
- **Day 4-5**: Performance optimization and monitoring
- **Day 6-7**: User acceptance testing and deployment preparation

---

## Risk Assessment & Mitigation

### High-Risk Areas

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|---------|-------------------|
| **Claude API Complexity** | Medium | High | Incremental implementation with fallback handling |
| **Streaming Performance** | Medium | High | Progressive enhancement with static fallback |
| **Database Migration** | Low | High | Comprehensive testing with rollback procedures |
| **Cost Management** | High | Medium | Token usage monitoring with user notifications |

### Technical Risks

1. **API Rate Limiting**
   - **Risk**: Exceeding Claude API rate limits during peak usage
   - **Mitigation**: Queue management system with user feedback

2. **Database Schema Migration**
   - **Risk**: Data loss during migration from simple to comprehensive schema
   - **Mitigation**: Backup procedures and incremental migration approach

3. **Streaming Reliability**
   - **Risk**: Connection interruptions affecting user experience
   - **Mitigation**: Robust reconnection logic and message persistence

### Business Risks

1. **User Adoption**
   - **Risk**: Users prefer simulated responses over real AI complexity
   - **Mitigation**: A/B testing and gradual feature rollout

2. **Performance Expectations**
   - **Risk**: Users expect instant responses like the current simulation
   - **Mitigation**: Clear loading indicators and performance optimization

---

## Success Criteria & Metrics

### Minimum Viable Product (MVP)

- **Functional AI Integration**: Replace all hardcoded responses with Claude API
- **Streaming Interface**: Real-time message display with <2s response time
- **Conversation Persistence**: Auto-save with conversation history
- **Error Handling**: Graceful degradation for API failures
- **Authentication Integration**: Seamless user context for AI coaching

### Enhanced Feature Success

- **Rich Formatting**: Markdown rendering with strategic insights formatting
- **Strategic Frameworks**: Template integration with guided conversations
- **Context Bridging**: Basic chat-canvas reference system
- **Export Functionality**: Shareable conversation summaries
- **Mobile Responsiveness**: Dual-pane layout adaptation for mobile devices

### User Acceptance Tests

1. **End-to-End Conversation Flow**
   - User logs in, navigates to workspace, sends message
   - Receives real-time streaming Claude response
   - Conversation persists across page refreshes

2. **Strategic Coaching Session**
   - User engages in multi-turn coaching conversation
   - Mary persona maintains consistency and context
   - Strategic insights are captured and accessible

3. **Error Handling**
   - System gracefully handles API failures
   - Users receive clear feedback on issues
   - Conversations resume after interruptions

### Performance Benchmarks

- **Claude API Response**: 95% of responses <2 seconds
- **Streaming Latency**: 99% of message chunks <100ms
- **Database Queries**: Conversation history retrieval <500ms
- **Error Rate**: <1% API failures with proper user notification

---

## Dependencies & Assumptions

### External Dependencies

| Dependency | Type | Risk Level | Mitigation |
|------------|------|------------|------------|
| **Anthropic Claude API** | Critical | Low | Established service with SLA |
| **Supabase Platform** | Critical | Low | Reliable managed service |
| **Next.js Framework** | Foundation | Low | Long-term support version |

### Technical Assumptions

- Existing Next.js 15 and Supabase architecture remains stable
- Users have modern browsers supporting Server-Sent Events
- Claude Sonnet 4 API maintains current capabilities and pricing
- Database schema comprehensive enough for future enhancements

### Business Assumptions

- Users value real AI coaching over simulated responses
- Strategic thinking market has demand for AI-enhanced tools
- Claude Sonnet 4 provides sufficient coaching quality
- Pricing model sustainable with Claude API costs

---

## Appendices

### Appendix A: File Modification List

#### Files Requiring Creation

```
/apps/web/lib/ai/claude-client.ts          # Claude API wrapper
/apps/web/lib/ai/mary-persona.ts           # AI persona configuration
/apps/web/lib/ai/streaming.ts              # Server-Sent Events handling
/apps/web/app/api/chat/stream/route.ts     # Streaming chat endpoint
/apps/web/app/api/conversations/route.ts   # Conversation management
/apps/web/components/chat/StreamingMessage.tsx    # Real-time chat UI
/apps/web/components/workspace/ContextBridge.tsx  # Chat-canvas linking
```

#### Files Requiring Modification

```
/apps/web/app/workspace/[id]/page.tsx      # Replace hardcoded responses (lines 104-110)
/apps/web/package.json                     # Add @anthropic-ai/sdk dependency
/apps/web/.env.local                       # Add Claude API configuration
```

### Appendix B: Environment Configuration

```bash
# Required environment variables for Claude integration
ANTHROPIC_API_KEY=your_anthropic_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7

# Supabase configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature flags
NEXT_PUBLIC_ENABLE_STREAMING=true
NEXT_PUBLIC_ENABLE_STRATEGIC_FRAMEWORKS=true
NEXT_PUBLIC_MAX_CONVERSATION_LENGTH=50
```

### Appendix C: Database Migration Script

```sql
-- Migration from simple workspaces to comprehensive schema
-- Run after setting up Supabase project with schema.sql

BEGIN;

-- Migrate existing workspace data
INSERT INTO user_workspace (user_id, workspace_state)
SELECT user_id, 
       jsonb_build_object(
         'name', name,
         'description', description,
         'migrated_from_workspaces', true,
         'migration_date', NOW()
       )
FROM workspaces
WHERE NOT EXISTS (
  SELECT 1 FROM user_workspace WHERE user_id = workspaces.user_id
);

-- Migrate existing chat context to new conversation structure
INSERT INTO chat_conversations (workspace_id, mary_persona_config)
SELECT user_id, 
       jsonb_build_object(
         'version', '1.0',
         'base_prompt', 'Mary Strategic Coach',
         'migrated', true
       )
FROM workspaces 
WHERE jsonb_array_length(chat_context) > 0;

COMMIT;
```

---

**Document End**

*This PRD provides comprehensive guidance for transforming thinkhaven from its current foundation state into a fully functional Claude Sonnet 4-powered strategic coaching platform. The brownfield approach leverages existing strengths while systematically addressing the critical gap of AI integration.*
