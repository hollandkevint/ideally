# ideally.co Technical Guide - Master Reference

## Document Information

| Field | Value |
|-------|-------|
| **Document Type** | Master Technical Reference |
| **Version** | 1.0 |
| **Date** | 2025-08-25 |
| **Status** | Current Implementation State |
| **Scope** | Brownfield Claude Sonnet 4 Integration |

---

## Executive Summary

**Current Reality:** ideally.co is a sophisticated Next.js 15 application with working authentication, comprehensive database schema, and dual-pane interface foundation. The critical gap is the absence of actual Claude Sonnet 4 integration - current "Mary" AI responses are hardcoded simulations requiring replacement with real AI capabilities.

**Enhancement Goal:** Transform from foundation state to fully functional AI-powered strategic coaching platform through Claude Sonnet 4 integration with streaming responses and intelligent conversation management.

---

## Current System Architecture

### Technology Stack (Implemented)

| Component | Technology | Version | Status | Purpose |
|-----------|------------|---------|--------|---------|
| **Frontend** | Next.js | 15.5.0 | ✅ Working | App Router, Turbopack, TypeScript |
| **Authentication** | Supabase Auth | 2.56.0 | ✅ Working | User management, session handling |
| **Database** | PostgreSQL (Supabase) | Latest | ✅ Schema Ready | Comprehensive AI-ready schema |
| **Styling** | Tailwind CSS | ^4 | ✅ Working | Dual-pane design system |
| **State Management** | React State | Native | ✅ Working | Component and context state |
| **API Layer** | Next.js API Routes | 15.5.0 | ❌ Missing | Need Claude integration routes |
| **AI Integration** | None | N/A | ❌ Critical Gap | Need @anthropic-ai/sdk |

### Repository Structure (Actual)

```
/Users/kthkellogg/Documents/GitHub/ideally.co/
├── apps/web/                           # Next.js frontend application
│   ├── app/                            # Next.js 15 App Router
│   │   ├── layout.tsx                  # Root layout with AuthProvider
│   │   ├── page.tsx                    # Landing page
│   │   ├── login/, signup/             # Authentication pages ✅
│   │   ├── dashboard/                  # User dashboard ✅
│   │   ├── workspace/[id]/             # Main workspace (NEEDS AI) ⚠️
│   │   └── account/                    # Account management ✅
│   ├── lib/
│   │   ├── auth/AuthContext.tsx        # Supabase auth context ✅
│   │   ├── supabase/                   # Supabase client ✅
│   │   └── workspace/                  # Workspace context (basic) ⚠️
│   ├── middleware.ts                   # Auth middleware ✅
│   └── package.json                    # Dependencies (missing Claude SDK) ❌
├── supabase/
│   ├── schema.sql                      # Comprehensive DB schema ✅
│   └── migrations/                     # Basic migration ⚠️
├── docs/                               # Documentation
└── scripts/                            # Setup scripts
```

### Database Architecture (Implemented)

**Status:** Comprehensive schema exists and is AI-ready

**Key Tables:**
- `users` - Authentication and profiles ✅
- `user_workspace` - Single workspace per user ✅
- `chat_conversations` - AI conversation storage ✅ (schema only)
- `chat_messages` - Message persistence ✅ (schema only)
- `strategic_insights` - AI-extracted insights ✅ (schema only)
- `context_bridges` - Chat-canvas connections ✅ (schema only)
- `canvas_annotations`, `mermaid_diagrams` - Visual elements ✅ (schema only)

**Current Reality:** Schema comprehensive but application uses simplified `workspaces` table

---

## Critical Integration Points

### Files Requiring AI Enhancement

#### **CRITICAL: workspace/[id]/page.tsx**
**Location:** `/Users/kthkellogg/Documents/GitHub/ideally.co/apps/web/app/workspace/[id]/page.tsx`

**Current Issue (Lines 104-110):**
```typescript
// Simulate Mary's response (for now)
setTimeout(async () => {
  await addChatMessage({
    role: 'assistant',
    content: "I understand you're working on: \"" + messageInput + "\". Let me help you think through this strategically. What specific aspect would you like to explore first?"
  })
}, 1000)
```

**Required Transformation:**
- Replace setTimeout simulation with real Claude API streaming
- Implement Server-Sent Events for real-time responses
- Add proper error handling and retry logic
- Integrate with conversation persistence system

#### **MISSING: API Routes**
**Location:** Need to create `/Users/kthkellogg/Documents/GitHub/ideally.co/apps/web/app/api/`

**Required API Endpoints:**
```
/app/api/
├── chat/
│   └── stream/route.ts     # Streaming Claude responses
├── conversations/
│   └── route.ts            # Conversation management
└── ai/
    └── persona/route.ts    # Mary persona configuration
```

#### **MISSING: AI Service Layer**
**Location:** Need to create `/Users/kthkellogg/Documents/GitHub/ideally.co/apps/web/lib/ai/`

**Required Services:**
```
/lib/ai/
├── claude-client.ts        # Claude API wrapper
├── mary-persona.ts         # AI persona configuration
└── streaming.ts            # Server-Sent Events handling
```

### Database Integration Points

**Current State:** Application uses simplified structure
**Target State:** Utilize comprehensive schema

**Migration Required:**
1. Setup actual Supabase project (currently missing)
2. Apply comprehensive schema from `supabase/schema.sql`
3. Migrate from simplified `workspaces` table to `user_workspace` + conversation tables
4. Update application code to use new structure

---

## Authentication System (Working)

### Current Implementation ✅

**Auth Provider:** Supabase Auth with email/password
**Session Management:** JWT tokens with automatic refresh
**Protected Routes:** Middleware with smart redirects
**User Context:** React context with user state

**Key Files:**
- `lib/auth/AuthContext.tsx` - Authentication context provider
- `middleware.ts` - Route protection and redirects
- `lib/supabase/client.ts` - Supabase client configuration

**Integration Point:** Auth system ready for Claude user context

---

## User Interface Architecture

### Dual-Pane Design (Implemented) ✅

**Layout:** 60% chat pane / 40% canvas pane
**Responsive:** Mobile-friendly with pane stacking
**State Management:** React context with workspace persistence
**Styling:** Custom Tailwind CSS design system

**Components Working:**
- Dual-pane layout container
- Chat message display and input
- Loading states and error handling
- Professional design system

**Integration Point:** UI ready for streaming message updates

---

## Development Environment

### Current Setup ✅

**Development Server:** `npm run dev` (running on port 3000)
**Build System:** Next.js with Turbopack
**TypeScript:** Full type safety implemented
**Hot Reload:** Working with Turbopack

**Prerequisites Met:**
- Node.js 18+ ✅
- npm workspaces ✅
- TypeScript configuration ✅
- Development environment stable ✅

---

## Claude Sonnet 4 Integration Requirements

### Missing Dependencies

**Critical Addition Required:**
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.17.0"
  }
}
```

### Environment Variables Needed

**File:** `/Users/kthkellogg/Documents/GitHub/ideally.co/apps/web/.env.local`
```bash
# Claude Integration (MISSING)
ANTHROPIC_API_KEY=your_anthropic_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096

# Supabase (EXISTING but need actual project)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### API Integration Architecture

**Streaming Response Pattern:**
```typescript
// Required implementation pattern
export async function POST(request: Request) {
  const { message, conversationId } = await request.json()
  
  const stream = new ReadableStream({
    async start(controller) {
      // Claude API streaming implementation
      for await (const chunk of claudeStream) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

---

## Mary AI Persona Specification

### Strategic Coaching Persona

**Identity:** Mary - seasoned AI Business Analyst with 15+ years strategic consulting experience

**Personality Traits:**
- Professional yet approachable
- Action-oriented with practical implementation focus
- Expert in business strategy and problem-solving frameworks
- Adapts communication style to user context

**Implementation Pattern:**
```typescript
const MARY_BASE_PROMPT = `
You are Mary, a seasoned AI Business Analyst with 15+ years of strategic consulting experience.

PERSONALITY TRAITS:
- Professional yet approachable, insightful without being overwhelming
- Action-oriented with bias toward practical implementation
- Expert in business strategy, problem-solving frameworks, executive coaching

STRATEGIC EXPERTISE:
- Business strategy frameworks (Porter's Five Forces, Blue Ocean, etc.)
- Problem-solving methodologies (5 Whys, Root Cause Analysis)
- Strategic planning and execution frameworks

CONVERSATION STYLE:
- Ask probing questions revealing underlying assumptions
- Offer multiple perspectives on strategic challenges
- Provide actionable recommendations with clear next steps
`;
```

---

## Implementation Phases

### Phase 1: Core AI Integration (MVP)

**Target:** Replace hardcoded responses with real Claude streaming

**Key Tasks:**
1. Install `@anthropic-ai/sdk` dependency
2. Create Claude API client service
3. Build streaming API routes
4. Replace hardcoded responses in workspace page
5. Setup environment variables

**Success Criteria:**
- Real Claude responses instead of simulation
- Streaming interface with <2s response time
- Error handling for API failures
- Conversation persistence working

### Phase 2: Enhanced Features

**Target:** Rich formatting, strategic frameworks, context bridging foundation

**Key Tasks:**
1. Implement Markdown rendering
2. Add strategic framework templates  
3. Build export functionality
4. Create context bridging system
5. Mobile optimization

**Success Criteria:**
- Rich message formatting
- Strategic coaching templates
- Context bridging between chat and canvas
- Export functionality working

---

## Security & Performance

### Security Implementation

**API Key Management:** Server-side environment variables only
**User Data Protection:** Existing RLS policies in database
**Error Handling:** No sensitive data exposure
**Rate Limiting:** Claude API limits with queue management

### Performance Targets

**Response Times:**
- Initial Claude response: <2 seconds
- Streaming latency: <100ms per chunk
- Database queries: <500ms
- Page load: <2 seconds

---

## Testing Strategy

### Current Test Coverage
**Status:** No tests implemented yet

### Required Testing
**Unit Tests:** AI service layer, API routes
**Integration Tests:** Database operations, Claude API
**E2E Tests:** Full conversation flows
**Performance Tests:** Response time validation

---

## Deployment Architecture

### Current Deployment
**Status:** Local development only

### Production Target
**Frontend:** Vercel with Edge Network
**Backend:** Vercel Edge Functions  
**Database:** Supabase managed PostgreSQL
**Monitoring:** Vercel Analytics + error tracking

---

## Known Issues & Technical Debt

### Critical Issues

1. **No AI Integration:** Hardcoded responses in `workspace/[id]/page.tsx:104-110`
2. **Missing Database Project:** Schema exists but no Supabase project configured
3. **Environment Configuration:** No `.env.local` with API keys
4. **Dependency Gaps:** Missing `@anthropic-ai/sdk`

### Database Schema Mismatch

**Current Code:** Uses simplified `workspaces` table from migration
**Available Schema:** Comprehensive `schema.sql` with AI-ready structure
**Resolution:** Need migration strategy to comprehensive schema

### Canvas Placeholder

**Current State:** "Integration with Excalidraw & Mermaid coming soon"
**Status:** Deferred to Phase 2 (post-MVP)

---

## File Reference Map

### Current Working Files ✅
- `apps/web/app/layout.tsx` - Root layout with auth
- `apps/web/lib/auth/AuthContext.tsx` - Authentication system
- `apps/web/app/login/page.tsx`, `apps/web/app/signup/page.tsx` - Auth pages
- `apps/web/app/dashboard/page.tsx` - User dashboard
- `apps/web/middleware.ts` - Route protection
- `supabase/schema.sql` - Comprehensive database schema

### Files Needing Modification ⚠️
- `apps/web/app/workspace/[id]/page.tsx` - Replace lines 104-110 with real AI
- `apps/web/package.json` - Add @anthropic-ai/sdk dependency

### Files Needing Creation ❌
- `apps/web/.env.local` - Environment variables
- `apps/web/app/api/chat/stream/route.ts` - Streaming endpoint
- `apps/web/lib/ai/claude-client.ts` - Claude API service
- `apps/web/lib/ai/mary-persona.ts` - AI persona configuration

---

## Next Steps Priority

### Immediate (Critical Path)
1. **Setup Supabase Project** - Configure actual backend
2. **Install Claude SDK** - Add @anthropic-ai/sdk dependency
3. **Create API Routes** - Build streaming endpoints
4. **Replace Hardcoded Responses** - Implement real AI integration

### Short Term (Enhancement)
1. **Database Migration** - Move to comprehensive schema
2. **Rich Formatting** - Markdown and strategic frameworks
3. **Error Handling** - Production-ready error management
4. **Performance Optimization** - Response time improvements

### Long Term (Advanced Features)
1. **Context Bridging** - Chat-canvas integration
2. **Canvas Implementation** - Interactive visual workspace
3. **Export Functionality** - Document generation
4. **Collaboration Features** - Multi-user support

---

**This technical guide serves as the master reference for all development work on the ideally.co platform. It reflects the current implementation reality and provides clear guidance for the Claude Sonnet 4 integration enhancement.**