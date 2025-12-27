# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

*Last Updated: 2025-12-27*

## Project Context
**ThinkHaven** - AI-powered strategic thinking workspace with the BMad Method
- **Tech Stack**: Next.js 15.5, React 19, TypeScript, Supabase, Stripe, tldraw, Anthropic Claude
- **Architecture**: Monorepo with Next.js app in `apps/web/`
- **Deployment**: Vercel project `thinkhaven` (https://thinkhaven-hollandkevints-projects.vercel.app)

## Essential Commands

### Development
```bash
cd apps/web
npm run dev              # Start dev server (localhost:3000, uses Turbopack)
npm run build            # Production build
npm run build:prod       # Production build (alias)
npm run lint             # Run ESLint
```

### Testing
```bash
# Unit tests (Vitest)
npm test                 # Run unit tests in watch mode
npm run test:run         # Run unit tests once

# E2E tests (Playwright)
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:oauth       # Run OAuth tests only
npm run test:oauth:ui    # Run OAuth tests with UI
npm run test:oauth:report # Generate OAuth test report
```

### Database Migrations
```bash
# Migrations are in apps/web/supabase/migrations/
# Run in order: 001 → 002 → 003 → 004 → 005 → 006
# Use Supabase dashboard or CLI to apply
```

## Architecture Overview

### Core Systems

**BMad Method Engine** (`apps/web/lib/bmad/`)
- **session-orchestrator.ts**: Central session lifecycle manager with credit system integration
- **pathway-router.ts**: Routes users to appropriate strategic pathways
- **template-engine.ts**: Loads and executes BMad templates
- **analysis/**: Domain-specific analysis frameworks (market positioning, pricing, revenue optimization)
- **pathways/**: Pathway implementations (new-idea-pathway, business-model-pathway, feature-input)
- **generators/**: Document generators (concept documents, lean canvas, feature briefs)

**AI Integration** (`apps/web/lib/ai/`)
- **claude-client.ts**: Anthropic Claude API integration
- **mary-persona.ts**: Mary AI business analyst persona definition
- **streaming.ts**: Server-sent events for real-time AI responses
- **context-manager.ts**: Manages session context and conversation history
- **conversation-persistence.ts**: Database persistence for conversations

**Session Credit System** (`apps/web/lib/monetization/`)
- **credit-manager.ts**: Credit operations (balance, deduction, purchase)
- **stripe-service.ts**: Stripe integration for payments
- **Migration 005**: user_credits, credit_transactions, credit_packages, payment_history tables
- **Trial**: 2 free credits on signup (grant_free_credit trigger)
- **Atomic deductions**: Row-level locking prevents race conditions

**Canvas Workspace** (`apps/web/lib/canvas/`)
- **canvas-manager.ts**: Manages tldraw canvas instances with pooling
- **visual-suggestion-parser.ts**: Parses AI suggestions into Mermaid diagrams
- **canvas-export.ts**: Export to PNG (5 resolutions) and SVG with metadata
- **useCanvasSync.ts**: Bidirectional AI↔Canvas synchronization

**Authentication** (`apps/web/lib/auth/`)
- **AuthContext.tsx**: Simplified auth context (32% code reduction vs previous)
- **apps/web/app/auth/callback/route.ts**: OAuth callback handler
- **Note**: Middleware disabled (middleware.ts.disabled) due to Edge Runtime incompatibility
- **Session management**: API routes handle sessions, not middleware

**Export System** (`apps/web/lib/export/`)
- **pdf-generator.ts**: @react-pdf/renderer integration
- **pdf-templates/FeatureBriefPDF.tsx**: Professional PDF layouts with branding
- **chat-export.ts**: Chat conversation export (Markdown, Text, JSON, clipboard)
- **Markdown**: Enhanced GFM with tables, emojis, copy-to-clipboard

**Guest Session System** (`apps/web/lib/guest/`)
- **session-store.ts**: LocalStorage-based session persistence (no DB writes)
- **session-migration.ts**: Migrates guest session to user account on signup
- **5-message limit**: Triggers signup modal, preserves conversation context
- **Flow**: `/try` → guest chat → message limit → signup → `/app/session/[id]`

**Structured Output Generators** (`apps/web/lib/bmad/generators/`)
- **ConceptDocumentGenerator**: Business concept documents from New Idea pathway
- **LeanCanvasGenerator**: Lean Canvas and Business Model Canvas formats
- **BrainstormSummaryGenerator**: Extract insights, action items, decisions from chat
- **ProductBriefGenerator**: Comprehensive product documentation with features, users, timeline
- **ProjectBriefGenerator**: Formal project documentation with scope, milestones, stakeholders
- **FeatureBriefGenerator**: Feature specification documents
- **index.ts**: Unified exports for all generators

### Database Schema (Supabase)

**Core Tables**:
- `bmad_sessions`: Session state and progress tracking
- `conversations`: AI conversation history
- `messages`: Individual message storage
- `user_workspace`: Workspace auto-save data
- `user_credits`: Credit balance tracking
- `credit_transactions`: Complete audit trail
- `credit_packages`: Pricing tiers (starter/professional/business)
- `payment_history`: Stripe payment records

**Key Functions**:
- `grant_free_credit()`: Auto-grants 2 credits on signup
- `deduct_credit_transaction()`: Atomic credit deduction with row locking
- `add_credits_transaction()`: Purchase/grant handling with idempotency

### Route Architecture

**Protected App Routes** (`/app/*` - requires authentication):
- `/app` - Dashboard (main hub after login)
- `/app/new` - New session creation with loading animation
- `/app/session/[id]` - Workspace for active sessions
- `/app/account` - Account settings and preferences

**Public Routes**:
- `/` - Landing page (open to all, shows "Open App" for authenticated users)
- `/try` - Guest session (5 free messages, localStorage-based, migrates on signup)
- `/demo` - Demo hub with pre-configured scenarios
- `/assessment` - Free strategic assessment quiz

**Legacy Redirects** (backwards compatibility):
- `/dashboard` → `/app`
- `/bmad` → `/app/new`
- `/workspace/[id]` → `/app/session/[id]`
- `/account` → `/app/account`

### API Routes

**AI Endpoints**:
- `/api/chat/stream` - Streaming Claude responses (authenticated)
- `/api/chat/guest` - Guest streaming (no auth, 5 message limit)
- `/api/chat/export` - Chat export service (Markdown, Text, JSON)
- `/api/bmad` - BMad Method session operations

**Monetization**:
- `/api/credits/balance` - Get user credit balance
- `/api/feedback/trial` - Trial feedback collection

**Monitoring**:
- `/api/monitoring/alerts` - System alerts
- `/api/monitoring/auth-metrics` - Authentication metrics

### Key Components

**BMad Interface** (`apps/web/app/components/bmad/`)
- `BmadInterface.tsx`: Main BMad Method UI
- `SessionManager.tsx`: Session creation and navigation
- `PathwaySelector.tsx`: Pathway selection interface
- `pathways/NewIdeaPathway.tsx`: New idea strategic pathway
- `pathways/FeatureBriefGenerator.tsx`: Feature brief generation
- `pathways/ExportOptions.tsx`: PDF/Markdown export UI

**Canvas** (`apps/web/app/components/canvas/`)
- `DualPaneLayout.tsx`: Two-pane workspace layout
- `TldrawCanvas.tsx`: tldraw integration
- `MermaidRenderer.tsx`: Mermaid diagram rendering
- `EnhancedCanvasWorkspace.tsx`: Full canvas with AI sync

**Monetization** (`apps/web/app/components/monetization/`)
- `CreditGuard.tsx`: Credit requirement enforcement
- `FeedbackForm.tsx`: Trial feedback collection

**Guest Session** (`apps/web/app/components/guest/`)
- `GuestChatInterface.tsx`: Guest chat UI with message counter
- `SignupPromptModal.tsx`: 5-message limit modal with signup CTA

**Workspace** (`apps/web/app/components/workspace/`)
- `ExportPanel.tsx`: Chat export dropdown (Markdown, Text, JSON, clipboard)

**UI Components** (`apps/web/app/components/ui/`)
- `AnimatedLoader.tsx`: Loading animation with rotating messages and progress bar
- `navigation.tsx`: Responsive navigation with auth state

**Output Selection** (`apps/web/app/components/bmad/`)
- `OutputTypeSelector.tsx`: Structured output format selector with message counter hook

## Development Patterns

### Session Creation Flow
1. User selects pathway → `SessionManager.tsx`
2. `session-orchestrator.ts` checks credits via `credit-manager.ts`
3. If sufficient credits, create session in database
4. Atomically deduct credit via `deduct_credit_transaction()`
5. If deduction fails, rollback session creation
6. Return session object to UI

### Credit Management
```typescript
// Check credits before action
const hasCredits = await hasCredits(userId, 1);
if (!hasCredits) {
  throw new Error('Insufficient credits');
}

// Deduct credit atomically
const result = await deductCredit(userId, sessionId);
if (!result.success) {
  // Handle failure (e.g., rollback)
}
```

### AI Streaming Response
```typescript
// Server-side (route.ts)
import { streamClaudeResponse } from '@/lib/ai/streaming';
return streamClaudeResponse(messages, systemPrompt);

// Client-side (component)
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  body: JSON.stringify({ messages })
});
const reader = response.body.getReader();
// Process stream...
```

### Canvas Synchronization
- AI sends `<diagram type="...">...</diagram>` in responses
- `visual-suggestion-parser.ts` extracts and validates Mermaid syntax
- `useCanvasSync` hook updates canvas in real-time
- Canvas changes can trigger AI re-analysis

## Testing Strategy

### Unit Tests (Vitest)
- Located in `**/*.test.{ts,tsx}` files
- Setup: `apps/web/tests/setup.ts`
- Coverage: Canvas parsers, utility functions, business logic
- Run: `npm test` (watch) or `npm run test:run` (once)

### E2E Tests (Playwright)
- Located in `apps/web/tests/e2e/`
- Config: `apps/web/playwright.config.ts`
- Projects: Desktop Chrome, Mobile Chrome
- OAuth testing: 66 tests with custom reporter (infrastructure complete)
- Run: `npm run test:e2e` or `npm run test:e2e:ui`

**OAuth Test Infrastructure (TD-001 - RESOLVED Dec 2025):**
- ✅ Base URL aligned to port 3000 across all configs
- ✅ Mock OAuth provider using regex route patterns (`/\/auth\/v1\//`)
- ✅ Auto-loads `.env.test` via `global-setup.ts`
- ✅ Environment validation before tests run
- ✅ Proper state cleanup between tests
- Tests require `.env.test` with Supabase credentials
- See `apps/web/tests/README.md` for OAuth troubleshooting

### Test Patterns
```typescript
// Unit test example
import { describe, it, expect } from 'vitest';
import { parseVisualSuggestion } from '@/lib/canvas/visual-suggestion-parser';

describe('parseVisualSuggestion', () => {
  it('should extract Mermaid diagrams', () => {
    const result = parseVisualSuggestion('<diagram type="flowchart">...</diagram>');
    expect(result.type).toBe('flowchart');
  });
});

// E2E test example
import { test, expect } from '@playwright/test';

test('user can start new session', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=New Session');
  await expect(page).toHaveURL(/\/workspace\/[a-z0-9-]+/);
});
```

## Configuration Files

- `next.config.ts`: Next.js configuration (root directory: apps/web)
- `tailwind.config.js`: Tailwind CSS setup
- `playwright.config.ts`: E2E test configuration
- `vitest.config.ts`: Unit test configuration
- `eslint.config.mjs`: Linting rules

## Environment Variables

Required for development (see `.env.example` for template):
```bash
# Supabase (get from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (get from console.anthropic.com)
ANTHROPIC_API_KEY=

# Stripe (get from dashboard.stripe.com)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Never commit actual keys to version control. Use Vercel dashboard or CLI for production secrets.

## Common Pitfalls

1. **Middleware Edge Runtime**: Do NOT use Node.js APIs in middleware - it runs on Edge Runtime
2. **Credit Deduction**: ALWAYS use `deduct_credit_transaction()` for atomicity, never manual UPDATE
3. **File-System Routing**: Every route reference needs a corresponding `page.tsx` file
4. **Migration Order**: Run migrations sequentially (001 → 006), never skip
5. **Stripe Webhooks**: Verify signatures with `stripe-service.ts.constructWebhookEvent()`
6. **Tldraw v4 API**: Use `getSnapshot(store)` and `loadSnapshot(store, data)` - NOT `store.getSnapshot()` or `store.loadSnapshot()`
7. **OAuth E2E Tests**: Require `.env.test` file with Supabase credentials - auto-loaded by `global-setup.ts`
8. **Playwright Route Mocking**: Use regex patterns (`/\/path\//`) not glob (`**/path**`) for reliability

## Production Deployment

- **Platform**: Vercel
- **Project Name**: `thinkhaven`
- **Root Directory**: Leave blank (deploy from `apps/web/` locally)
- **Production URL**: https://thinkhaven-hollandkevints-projects.vercel.app
- **Environment**: Set via Vercel dashboard (Settings → Environment Variables)
- **Builds**: Automatic on push to main branch
- **Deploy manually**: `cd apps/web && vercel --prod`

## Recent Major Changes

- **Dec 27, 2025**:
  - GitHub Actions workflow fixes - Added OIDC permissions (`id-token: write`) for Claude Code Action
  - Fixed 5 workflow files: claude-code-review, claude-daily-digest, claude-security-scan, e2e-tests, oauth-e2e-tests
  - All workflows now have proper permissions blocks for GitHub API access
- **Dec 23, 2025**:
  - Route restructuring to `/app/*` path-based architecture with auth protection
  - Guest session flow (`/try`) - 5 free messages, localStorage-based, migrates on signup
  - Chat export enhancements - Markdown, Text, JSON formats with clipboard support
  - Loading animations - AnimatedLoader with rotating messages and progress bar
  - Structured output generators - BrainstormSummary, ProductBrief, ProjectBrief
  - OutputTypeSelector component with message counter hook (triggers at ~20 messages)
- **Dec 22, 2025**:
  - Vercel project cleanup - Consolidated to 3 active projects (thinkhaven, neurobot, pmarchetype)
  - E2E test fixes - Updated all test selectors to match dashboard UI redesign
  - OAuth E2E infrastructure fix (TD-001) - All 66 tests can run
  - Demo page UX improvements - Fixed contrast issues in CTA section
  - Created `/bmad` route to fix production 404 error
- **Oct 28**: Canvas tldraw v4 API fix - Updated snapshot methods to use standalone functions
- **Oct 14**: Epic 4 Monetization (30% complete) - Credit system, Stripe integration
- **Oct 13**: Middleware disabled, route fixes, production stabilization
- **Oct 9**: Epic 2 & 3 complete - Canvas workspace, PDF/Markdown export
- **Sept 29**: OAuth simplification - 60% code reduction

## Documentation

- `/docs/stories/`: Feature stories and requirements
- `/docs/milestones/`: Implementation summaries
- `/docs/architecture/`: Architecture documentation
- `IMPLEMENTATION-ROADMAP.md`: Epic 4 implementation guide (1,050 lines)

---
*This file is automatically used by Claude Code. Keep it updated with critical project patterns.*
