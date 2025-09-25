# thinkhaven Brownfield Architecture Document

## Introduction

This document captures the **CURRENT STATE** of the thinkhaven AI Product Coaching Platform codebase, including technical debt, implementation patterns, and real-world constraints. It serves as a reference for AI agents working on the evolution from Strategic Workspace to full AI Product Coaching Platform.

### Document Scope

**Focused on areas relevant to**: AI Product Coaching Platform evolution (PRD v5.1) - specifically Canvas Implementation, BMad Method Frontend Integration, and Advanced Coaching Workflows.

### Change Log

| Date       | Version | Description                    | Author    |
| ---------- | ------- | ------------------------------ | --------- |
| 2025-09-05 | 1.0     | Initial brownfield analysis    | Mary (Analyst) |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `apps/web/app/page.tsx` (Next.js 15 App Router)
- **Workspace Core**: `apps/web/app/workspace/[id]/page.tsx` - Dual-pane chat interface
- **Claude Integration**: `apps/web/app/api/chat/stream/route.ts` - Complete AI streaming
- **AI Coaching System**: `apps/web/lib/ai/mary-persona.ts` - Mary coaching persona
- **Database Models**: `apps/web/lib/supabase/conversation-schema.ts` - Conversation persistence
- **BMad Framework**: `apps/web/lib/bmad/` directory - Strategic thinking framework
- **State Management**: `apps/web/lib/stores/dualPaneStore.ts` - Zustand dual-pane state

### Enhancement Impact Areas (PRD v5.1 Focus)

**Canvas Implementation** (Phase 3 - Partial):
- `apps/web/app/components/dual-pane/` - CSS framework ready, needs drawing tools
- `apps/web/lib/stores/dualPaneStore.ts` - Canvas state management foundation

**BMad Method Integration** (Phase 3 - Partial):
- `apps/web/lib/bmad/` - Complete business analysis engine, needs UI integration
- `apps/web/app/components/bmad/BmadInterface.tsx` - Requires chat system connection

**Advanced Coaching Workflows** (Ready for Enhancement):
- `apps/web/lib/ai/mary-persona.ts` - Persona system ready for coaching templates
- `apps/web/lib/ai/context-manager.ts` - Context bridging between chat and BMad

## High Level Architecture

### Technical Summary

**Status**: MVP Production Ready (September 2025) - Claude Sonnet 4 integration complete, Canvas and deep BMad integration pending.

### Actual Tech Stack (from package.json)

| Category        | Technology            | Version | Notes                                |
| --------------- | --------------------- | ------- | ------------------------------------ |
| Runtime         | Node.js               | 20+     | Next.js 15 requirement               |
| Framework       | Next.js               | 15.5.0  | App Router + Turbopack               |
| UI              | React                 | 19.1.0  | Latest with concurrent features      |
| Database        | Supabase              | 2.56.0  | PostgreSQL with real-time features   |
| AI Integration  | Anthropic Claude      | 0.27.3  | Sonnet 4 with streaming              |
| State Mgmt      | Zustand               | 5.0.8   | Lightweight, used for dual-pane      |
| Styling         | Tailwind CSS          | 4.0     | Latest version with container queries |
| Testing         | Vitest                | 3.2.4   | Modern test runner, 13 test files    |
| Type Safety     | TypeScript            | 5.x     | Strict mode enabled                  |

### Repository Structure Reality Check

- **Type**: Monorepo with npm workspaces
- **Package Manager**: npm (not yarn/pnpm)
- **Notable**: Clean separation between web app and packages, ready for multi-app expansion

## Source Tree and Module Organization

### Project Structure (Actual)

```text
thinkhaven/
├── apps/web/                    # Main Next.js application
│   ├── app/
│   │   ├── workspace/[id]/      # ✅ PRODUCTION: Dual-pane workspace with Claude integration
│   │   ├── components/
│   │   │   ├── chat/            # ✅ COMPLETE: Real-time streaming chat interface
│   │   │   ├── bmad/            # ⚠️ PARTIAL: Framework exists, needs UI integration
│   │   │   ├── workspace/       # ✅ PRODUCTION: Workspace management components
│   │   │   └── dual-pane/       # ✅ CSS READY: Responsive layout, needs canvas tools
│   │   └── api/
│   │       ├── chat/stream/     # ✅ PRODUCTION: Claude Sonnet 4 streaming endpoint
│   │       ├── chat/summarize/  # ✅ COMPLETE: Conversation summarization
│   │       ├── bookmarks/       # ✅ COMPLETE: Message bookmarking system
│   │       └── bmad/            # ⚠️ BASIC: API routes exist, limited functionality
│   ├── lib/
│   │   ├── ai/                  # ✅ PRODUCTION: Complete Claude integration suite
│   │   │   ├── claude-client.ts      # Anthropic API client with error handling
│   │   │   ├── mary-persona.ts       # Mary coaching persona system
│   │   │   ├── streaming.ts          # Server-sent events for real-time chat
│   │   │   ├── context-manager.ts    # Conversation context management
│   │   │   └── conversation-*.ts     # Persistence, search, export, branching
│   │   ├── bmad/                # ✅ COMPLETE ENGINE: Full business analysis framework
│   │   │   ├── analysis/             # 12+ analysis engines (CLV, CAC, pricing, etc.)
│   │   │   ├── templates/            # Business model and idea templates
│   │   │   ├── pathways/             # Strategic thinking pathways
│   │   │   └── generators/           # Document generators (Lean Canvas, etc.)
│   │   ├── supabase/            # ✅ PRODUCTION: Database client + auth
│   │   └── stores/              # ✅ WORKING: Zustand state management
│   └── tests/                   # ✅ COMPREHENSIVE: 13 test files, quality score 92/100
├── packages/                    # Ready for shared components/utils
└── .bmad-core/                  # BMad Method framework definitions
    ├── agents/                  # AI agent personas and configurations
    ├── tasks/                   # Structured task workflows
    └── templates/               # Strategic document templates
```

### Key Modules and Their Purpose

**AI Coaching System** (`lib/ai/`):
- **Primary**: Real-time Claude integration with Mary coaching persona
- **Status**: Production ready with streaming, context management, persistence
- **Integration Point**: Ready for BMad template injection

**BMad Strategic Framework** (`lib/bmad/`):
- **Primary**: Complete business analysis and strategic thinking engine
- **Status**: Backend complete, frontend integration minimal
- **Critical**: 40+ TypeScript modules providing structured strategic analysis

**Dual-Pane Interface** (`components/dual-pane/`):
- **Primary**: Chat (left) + Canvas (right) responsive layout
- **Status**: CSS framework complete, canvas tools missing
- **Pattern**: Error boundaries, loading states, offline handling

**Database Integration** (`lib/supabase/`):
- **Primary**: User auth, workspace management, conversation persistence
- **Status**: Production ready with Row Level Security
- **Schema**: Optimized for AI conversation storage and BMad data

## Data Models and APIs

### Data Models

**Live Models** (see source files):
- **User/Auth**: Supabase Auth integration (`lib/supabase/client.ts`)
- **Workspaces**: `apps/web/lib/supabase/conversation-schema.ts`
- **Conversations**: Full chat persistence with search and bookmarking
- **BMad Data**: Strategic analysis data models (`lib/bmad/types.ts`)

### API Specifications

**Production Endpoints**:
- **`/api/chat/stream`**: ✅ Claude streaming with Server-Sent Events
- **`/api/chat/summarize`**: ✅ Conversation summarization
- **`/api/chat/search`**: ✅ Semantic conversation search
- **`/api/bookmarks`**: ✅ Message bookmarking and reference system
- **`/api/bmad`**: ⚠️ Basic endpoints, needs expanded functionality

**Missing Endpoints** (needed for PRD v5.1):
- **`/api/canvas/*`**: Canvas element persistence and collaboration
- **`/api/bmad/templates`**: Dynamic template loading and customization
- **`/api/bmad/analysis`**: Real-time strategic analysis endpoints

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Canvas Placeholder**: Dual-pane right side has CSS layout but no drawing tools
   - **File**: `components/dual-pane/` directory
   - **Impact**: Blocks visual workspace functionality
   - **Note**: Foundation CSS is solid, needs library integration

2. **BMad-Chat Disconnect**: Strategic framework exists independently of chat system
   - **Files**: `lib/bmad/` vs `lib/ai/` modules
   - **Impact**: No dynamic template injection during coaching sessions
   - **Solution Needed**: Bridge layer between coaching context and BMad templates

3. **Limited Template Integration**: BMad templates are not dynamically loaded
   - **File**: `components/bmad/BmadInterface.tsx`
   - **Impact**: Static interface, no persona-driven template selection
   - **Pattern Exists**: Template engine at `lib/bmad/template-engine.ts`

### Medium Priority Issues

- **Test Coverage Gaps**: Canvas and BMad integration areas lack comprehensive tests
- **Performance**: No optimization for large conversation history rendering
- **Accessibility**: BMad interface needs ARIA labeling and keyboard navigation
- **Bundle Size**: BMad analysis engines could be code-split for better loading

### Low Priority Issues

- **Code Organization**: Some duplication between BMad and AI module types
- **Development Tooling**: No specific debugging tools for coaching session analysis
- **Documentation**: API documentation needs OpenAPI spec generation

## Integration Points and External Dependencies

### External Services

| Service    | Purpose         | Integration Type | Key Files                            |
| ---------- | --------------- | ---------------- | ------------------------------------ |
| Anthropic  | AI Coaching     | REST API + SSE   | `lib/ai/claude-client.ts`            |
| Supabase   | Database + Auth | SDK              | `lib/supabase/client.ts`, `server.ts` |

### Internal Integration Points

**Chat ↔ BMad Bridge**: 
- **Current**: `lib/ai/context-bridge.ts` (basic implementation)
- **Needed**: Dynamic template injection based on coaching context
- **Pattern**: Observer pattern for real-time template suggestions

**Dual-Pane State Sync**:
- **Current**: `lib/stores/dualPaneStore.ts` (Zustand)
- **Status**: Chat state managed, canvas state placeholder
- **Needed**: Canvas element persistence and cross-pane communication

**Workspace Context**:
- **Current**: `lib/ai/workspace-context.ts`
- **Status**: Manages coaching session context
- **Enhancement**: BMad template and analysis state integration

## Development and Deployment

### Local Development Setup

**Actual Working Steps**:
1. `npm install` (workspace installation)
2. Copy `apps/web/.env.example` to `.env.local`
3. Set Supabase URL, Anon Key, and Anthropic API key
4. `npm run dev` (starts Next.js with Turbopack)

**Known Setup Issues**:
- Requires Anthropic API key for chat functionality
- Supabase local development not configured (uses hosted instance)
- Canvas components will render but have no functionality

### Build and Deployment Process

- **Build Command**: `npm run build` (Turbopack + Next.js optimizations)
- **Type Checking**: `npm run type-check` (strict TypeScript validation)
- **Testing**: `npm run test` (Vitest with 13 test files)
- **Linting**: `npm run lint` (ESLint with Next.js config)

### Environment Configuration

**Required Variables** (`.env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing Reality

### Current Test Coverage

**Comprehensive Areas**:
- **AI Integration**: Claude client, Mary persona, workspace context (5 test files)
- **Conversation Features**: Export, branching, search functionality (3 test files)
- **Performance**: Long session handling (1 test file)
- **Error Scenarios**: API failure recovery (1 test file)
- **Integration**: End-to-end coaching effectiveness (3 test files)

**Coverage Gaps**:
- Canvas functionality (no tests - no implementation yet)
- BMad-Chat integration (minimal tests)
- UI component interaction testing

### Running Tests

```bash
npm run test        # Vitest with watch mode
npm run test:run    # Single test run for CI
```

**Quality Score**: 92/100 (September 2025 assessment)

## Enhancement Impact Analysis (PRD v5.1)

### Files That Will Need Modification

**Phase 3: Canvas Implementation**
- `apps/web/app/components/dual-pane/Canvas.tsx` - Add drawing library integration
- `apps/web/lib/stores/dualPaneStore.ts` - Canvas element state management
- `apps/web/app/api/canvas/` - New API routes for element persistence
- Database schema - Canvas element storage tables

**Phase 3: BMad Method Frontend Integration**
- `apps/web/app/components/bmad/BmadInterface.tsx` - Dynamic template loading
- `apps/web/lib/ai/context-bridge.ts` - Real-time template suggestions
- `apps/web/lib/bmad/template-engine.ts` - Chat-driven template selection
- `apps/web/app/api/bmad/templates/` - Template API endpoints

**Advanced Coaching Workflows**
- `apps/web/lib/ai/mary-persona.ts` - Enhanced persona with BMad context
- `apps/web/lib/ai/workspace-context.ts` - Strategic session state management
- `apps/web/app/components/chat/ChatInterface.tsx` - Template injection UI

### New Files/Modules Needed

**Canvas System**:
- `lib/canvas/drawing-engine.ts` - Drawing tool abstraction
- `lib/canvas/element-manager.ts` - Canvas element CRUD operations
- `components/canvas/ToolPalette.tsx` - Drawing tools interface

**BMad Integration Bridge**:
- `lib/integrations/bmad-chat-bridge.ts` - Real-time coaching ↔ templates
- `lib/integrations/template-injection.ts` - Dynamic template suggestions
- `components/coaching/TemplateSidebar.tsx` - In-chat template interface

### Integration Considerations

**Must Follow Existing Patterns**:
- **Error Handling**: Use `PaneErrorBoundary` pattern from dual-pane components
- **State Management**: Extend `dualPaneStore.ts` rather than creating new stores
- **API Response Format**: Follow established pattern in `chat/stream/route.ts`
- **Authentication**: All new endpoints must use Supabase RLS pattern
- **TypeScript**: Maintain strict typing, extend existing type definitions in `bmad/types.ts`

**Critical Constraints**:
- Canvas integration must not break existing chat functionality
- BMad template injection must be non-intrusive to coaching flow
- All enhancements must maintain 90+ quality score
- Real-time features must use existing Server-Sent Events architecture

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
npm run dev         # Development server with Turbopack (port 3000)
npm run build       # Production build with optimizations
npm run type-check  # TypeScript validation
npm run test        # Test suite with Vitest
npm run lint        # Code linting with ESLint
```

### Debugging and Troubleshooting

**Logs and Debugging**:
- **Browser Console**: Client-side AI integration debugging
- **Network Tab**: Monitor Server-Sent Events for chat streaming
- **Supabase Dashboard**: Database queries and RLS policy testing
- **Next.js Dev Tools**: Component rendering and state inspection

**Common Issues**:
- **API Key Issues**: Check `.env.local` for Anthropic API key
- **Supabase Connection**: Verify URL and anon key configuration  
- **Chat Not Working**: Confirm Claude API key is valid and has credits
- **Canvas Blank**: Expected behavior - drawing tools not implemented yet
- **BMad Templates Static**: Expected behavior - dynamic loading not implemented

---

*This brownfield architecture document reflects the actual state of the thinkhaven codebase as of September 2025, focusing on areas relevant to the AI Product Coaching Platform evolution. It provides practical guidance for AI agents implementing Canvas functionality and BMad Method integration while respecting existing technical patterns and constraints.*