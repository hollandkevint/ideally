# thinkhaven Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the thinkhaven Next.js project, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on Claude Sonnet 4 coaching integration enhancements.

### Document Scope

**Focused on areas relevant to:** bMAD Method Analyst Web Platform with Claude Sonnet 4 AI coaching integration enhancement (dual-pane strategic workspace with conversational AI and visual canvas)

### Change Log

| Date       | Version | Description                 | Author      |
| ---------- | ------- | --------------------------- | ----------- |
| 2025-08-25 | 1.0     | Initial brownfield analysis | Claude Code |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `/Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web/app/layout.tsx` (Next.js App Router entry point)
- **Configuration**: `/Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web/package.json`, `.env.local` (not yet created)
- **Core Business Logic**: `/Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web/app/workspace/[id]/page.tsx` (main workspace interface)
- **API Definitions**: Next.js API routes (not yet implemented for Claude integration)
- **Database Models**: `/Users/kthkellogg/Documents/GitHub/thinkhaven/supabase/schema.sql`, `/Users/kthkellogg/Documents/GitHub/thinkhaven/supabase/migrations/001_add_multiple_workspaces.sql`
- **Key Components**: `/Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web/lib/auth/AuthContext.tsx` (authentication context)

### Claude Sonnet 4 Enhancement Impact Areas

Based on the PRD requirements, these files/modules will be affected by the AI coaching enhancement:

- **NEW: API Routes** - Need to create `/apps/web/app/api/` for Claude Sonnet 4 integration
- **NEW: AI Services** - Need to create `/apps/web/lib/ai/` for Claude client and Mary persona
- **MODIFY: Workspace Page** - `/apps/web/app/workspace/[id]/page.tsx` needs real AI integration
- **MODIFY: Database Schema** - Current schema has AI-ready tables but needs refinement
- **NEW: Streaming Components** - Need real-time chat interface with Server-Sent Events
- **NEW: Context Bridging** - Integration between chat and canvas (currently placeholder)

## High Level Architecture

### Technical Summary

The thinkhaven platform is currently a **partially implemented Next.js 15 monorepo** with foundational authentication and dual-pane interface. The system uses **Supabase** for backend services and is structured as a **strategic thinking workspace** with chat and canvas panes. **Critical Gap:** No actual Claude Sonnet 4 integration exists yet - the current "Mary" responses are hardcoded simulations.

### Actual Tech Stack (from package.json analysis)

| Category       | Technology            | Version | Notes                                      |
| -------------- | --------------------- | ------- | ------------------------------------------ |
| Runtime        | Node.js               | 18+     | Required for Next.js 15                    |
| Frontend       | Next.js               | 15.5.0  | Latest with Turbopack enabled              |
| React          | React                 | 19.1.0  | Latest version with concurrent features    |
| TypeScript     | TypeScript            | ^5      | Full type safety implemented               |
| Styling        | Tailwind CSS          | ^4      | Custom design system for dual-pane layout |
| Database       | PostgreSQL (Supabase) | Latest  | Schema designed but needs Supabase setup  |
| Authentication | Supabase Auth         | 2.56.0  | Implemented and working                    |
| **AI (Missing)**   | **None**                  | **N/A**     | **CRITICAL: No Claude integration exists**    |

### Repository Structure Reality Check

- **Type**: Monorepo using npm workspaces
- **Package Manager**: npm (standard)
- **Current State**: Foundation complete, AI integration missing
- **Notable**: Sophisticated database schema exists but no AI service layer

## Source Tree and Module Organization

### Project Structure (Actual)

```text
/Users/kthkellogg/Documents/GitHub/thinkhaven/
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── app/                # Next.js 15 App Router
│       │   ├── layout.tsx      # Root layout with AuthProvider
│       │   ├── page.tsx        # Landing page
│       │   ├── login/          # Authentication pages
│       │   ├── signup/
│       │   ├── dashboard/      # User dashboard
│       │   ├── workspace/[id]/ # Main strategic workspace (NEEDS AI)
│       │   └── account/        # User account management
│       ├── lib/
│       │   ├── auth/           # Supabase auth context (WORKING)
│       │   ├── supabase/       # Supabase client (WORKING)
│       │   └── workspace/      # Workspace context (BASIC)
│       ├── middleware.ts       # Auth middleware (WORKING)
│       ├── globals.css         # Custom dual-pane design system
│       └── package.json        # Dependencies (MISSING: Claude SDK)
├── supabase/
│   ├── schema.sql              # Comprehensive DB schema (AI-READY)
│   └── migrations/             # Database migrations
├── docs/                       # Documentation and PRD
│   ├── prd-bmad.md            # Product requirements (COMPREHENSIVE)
│   ├── architecture.md        # Aspirational architecture
│   └── stories/               # User stories for implementation
├── scripts/                    # Setup scripts
└── package.json               # Root workspace config
```

### Key Modules and Their Purpose

- **Authentication System**: `apps/web/lib/auth/AuthContext.tsx` - COMPLETE: Working Supabase auth
- **Workspace Interface**: `apps/web/app/workspace/[id]/page.tsx` - INCOMPLETE: Simulated AI responses only
- **Database Layer**: `supabase/schema.sql` - COMPLETE: Comprehensive schema designed for AI integration
- ****AI Integration**: **MISSING** - No Claude Sonnet 4 client or API routes exist**
- **Canvas System**: Placeholder in workspace page - awaiting real implementation
- **Context Bridging**: Designed in schema but not implemented in code

## Technical Debt and Known Issues

### Critical Technical Debt

1. **No AI Integration**: Current system shows hardcoded "Mary" responses in `workspace/[id]/page.tsx:104-110`. No actual Claude Sonnet 4 API client exists.

2. **Incomplete Database Setup**: Schema exists but requires actual Supabase project creation and environment configuration.

3. **Canvas Placeholder**: Visual canvas shows "Integration with Excalidraw & Mermaid coming soon" message with no actual functionality.

4. **Missing API Layer**: No Next.js API routes exist for Claude integration, streaming responses, or AI coaching patterns.

### Workarounds and Gotchas

- **Simulated AI Responses**: Current Mary responses are hardcoded with 1-second setTimeout - this must be replaced with real Claude streaming.

- **Environment Variables**: System expects `.env.local` with Supabase credentials, but this file doesn't exist yet.

- **Database Schema Mismatch**: Code uses simplified `workspaces` table from migration, but comprehensive `schema.sql` has more complex structure for AI features.

- **Dual-Pane Layout**: CSS assumes specific component structure that isn't fully implemented in current workspace page.

## Integration Points and External Dependencies

### External Services (Required for Enhancement)

| Service          | Purpose          | Integration Type | Status                                             |
| ---------------- | ---------------- | ---------------- | -------------------------------------------------- |
| Claude Sonnet 4  | AI Coaching      | REST API         | **MISSING** - Primary enhancement requirement      |
| Supabase         | Backend Services | SDK              | **PARTIAL** - Auth working, DB needs setup        |
| Mermaid.js       | Diagram Rendering| CDN              | **PLANNED** - Referenced in code but not implemented |

### Internal Integration Points

- **Frontend-Backend**: Currently using Supabase client directly - needs API route layer for Claude integration
- **Chat-Canvas**: Context bridging system designed but not implemented
- **Real-time Features**: Schema supports WebSocket patterns but no implementation exists

## Development and Deployment

### Local Development Setup (Current Reality)

1. **Prerequisites Working**:
   - Node.js 18+ ✓
   - npm workspaces ✓
   - Next.js 15 development server ✓

2. **Current Limitations**:
   - No Supabase project configured
   - No Claude API key setup
   - Canvas functionality is placeholder
   - AI responses are hardcoded

3. **Required Environment Variables** (Missing):
```bash
# .env.local needed in apps/web/
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_claude_api_key
```

### Build and Deployment Process

- **Build Command**: `npm run build` (uses Turbopack) ✓
- **Development**: `npm run dev` (currently running) ✓
- **Deployment**: Designed for Vercel, not yet configured
- **Database**: Supabase migrations ready but not applied

## Testing Reality

### Current Test Coverage

- **Unit Tests**: None implemented yet
- **Integration Tests**: None implemented yet
- **E2E Tests**: None implemented yet
- **AI Testing**: Not applicable - no AI integration exists

### Testing Strategy for Claude Integration

When implementing Claude Sonnet 4 integration, will need:

```bash
# Testing commands to implement
npm run test           # Unit tests for AI services
npm run test:integration  # API route testing
npm run test:ai        # Claude API mocking
```

## Claude Sonnet 4 Enhancement Impact Analysis

### Files That Will Need Creation

Based on the PRD requirements and current gaps:

1. **AI Service Layer**:
   - `apps/web/lib/ai/claude-client.ts` - Claude API wrapper
   - `apps/web/lib/ai/mary-persona.ts` - AI persona configuration
   - `apps/web/lib/ai/streaming.ts` - Server-Sent Events handling

2. **API Routes**:
   - `apps/web/app/api/chat/route.ts` - Chat endpoint with streaming
   - `apps/web/app/api/sessions/route.ts` - Session management
   - `apps/web/app/api/coaching-patterns/route.ts` - bMAD Method patterns

3. **Enhanced Components**:
   - `apps/web/components/chat/StreamingMessage.tsx` - Real-time chat
   - `apps/web/components/canvas/CanvasEngine.tsx` - Interactive canvas
   - `apps/web/components/workspace/ContextBridge.tsx` - Chat-canvas linking

### Files That Will Need Modification

1. **Main Workspace**: `apps/web/app/workspace/[id]/page.tsx` 
   - Replace hardcoded responses with real Claude streaming
   - Implement proper message persistence
   - Add context bridging with canvas

2. **Database Schema**: Choose between existing `schema.sql` (comprehensive) or current migration approach

3. **Dependencies**: `apps/web/package.json`
   - Add `@anthropic-ai/sdk` for Claude integration
   - Add canvas libraries (Excalidraw, Mermaid.js)
   - Add streaming utilities

### Integration Considerations

- **Authentication**: Existing Supabase auth system will work with Claude API (user context for coaching)
- **Database**: Current schema designed for AI features but needs setup/migration
- **Real-time**: WebSocket patterns in schema support dual-pane synchronization
- **Responsive Design**: Existing CSS system supports dual-pane layout

## Implementation Priority for Claude Enhancement

### Phase 1: Core AI Integration (MVP)
1. **Claude API Client Setup** - Basic Claude Sonnet 4 integration
2. **Mary Persona Implementation** - Replace hardcoded responses
3. **Streaming Chat Interface** - Real-time conversation flow
4. **Database Connection** - Connect to actual Supabase project

### Phase 2: Advanced Features
1. **Context Bridging** - Chat-canvas integration
2. **bMAD Method Patterns** - Structured coaching workflows  
3. **Canvas Implementation** - Interactive visual workspace
4. **Export/Collaboration** - Document generation and sharing

## Appendix - Useful Commands and Scripts

### Currently Working Commands

```bash
npm run dev         # Start development server (running)
npm run build       # Production build with Turbopack
npm run lint        # ESLint checking
npm run type-check  # TypeScript validation
```

### Commands Needed for Enhancement

```bash
npm run setup:supabase     # Supabase project setup (needs creation)
npm run setup:claude       # Claude API configuration (needs creation)
npm run test:ai           # AI integration testing (needs creation)
npm run deploy:staging     # Staging deployment (needs creation)
```

### Debugging and Troubleshooting

- **Current Logs**: Next.js development console shows auth and database operations
- **AI Debug**: Will need structured logging for Claude API calls and token usage
- **Database Issues**: Supabase dashboard will be primary debugging tool
- **Canvas Issues**: Browser DevTools for canvas rendering and interaction

## Success Metrics for Claude Enhancement

### Technical Metrics
- **AI Response Time**: Target <2 seconds for coaching responses
- **Context Preservation**: Maintain conversation history across sessions  
- **Streaming Performance**: <100ms latency for message chunks
- **Error Rate**: <1% Claude API failures with graceful degradation

### Business Metrics
- **Session Completion**: >80% of coaching sessions reach conclusion
- **User Engagement**: Average session duration >10 minutes
- **Feature Adoption**: >50% users utilize both chat and canvas
- **Export Usage**: >30% sessions generate shareable documents

---

*This brownfield analysis provides the foundation for Claude Sonnet 4 AI coaching integration. The existing architecture is well-designed for the enhancement, requiring primarily the addition of AI services and completion of planned features rather than major restructuring.*