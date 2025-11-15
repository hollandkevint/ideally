# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

*Last Updated: 2025-11-15*

## Project Context
**ThinkHaven** - AI-powered strategic thinking workspace with the BMad Method
- **Tech Stack**: Next.js 15.5, React 19, TypeScript, Supabase, Stripe, tldraw, Anthropic Claude
- **Architecture**: Monorepo with Next.js app in `apps/web/`
- **Deployment**: Vercel (production: https://thinkhaven.co)

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
# Run in order: 001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009
# Migration 008: Message limits for launch mode (APPLIED ✅)
# Migration 009: Markdown output for text-only UX (PENDING - in feature branch)
# Use Supabase dashboard or CLI to apply
```

### Feature Flags
```bash
# .env.local / Vercel environment variables
LAUNCH_MODE=true          # Server-only: Bypass credit system for SLC launch (100 sessions)
ENABLE_CANVAS=false       # Feature flag: Restore canvas workspace (default: false)
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

**Launch Mode (SLC Testing Period)** (`LAUNCH_MODE=true` - ACTIVE ✅)
- **Purpose**: Enable 100-session testing period before Stripe integration
- **Credit Bypass**: `hasCredits()` and `deductCredit()` return true when LAUNCH_MODE enabled
- **Message Limits**: 20-message session limits enforced via database tracking
- **Migration 008**: Adds message_count, message_limit, limit_reached_at to bmad_sessions
- **Message Limit Manager** (`lib/bmad/message-limit-manager.ts`): Business logic for limits
- **Warning UI** (`components/chat/MessageLimitWarning.tsx`): Yellow/orange/red warnings
- **Security Fix**: Changed NEXT_PUBLIC_LAUNCH_MODE → LAUNCH_MODE (server-only)
- **Race Condition Fix**: Atomic increment-first pattern prevents concurrent message exploits
- **Rollback**: Migration 008_rollback available if needed

**Text-Only Markdown UX** (🚧 IN PROGRESS - feature/text-only-markdown branch)
- **Status**: Part 1/3 complete (foundation), Part 2/3 next (integration)
- **Migration 009**: Adds markdown_output, output_metadata to user_workspace
- **MarkdownOutputPane** (`components/markdown/MarkdownOutputPane.tsx`): Edit/preview toggle, export .md
- **OutputSuggestionBar** (`components/markdown/OutputSuggestionBar.tsx`): Generate summary/lean canvas
- **Replaces**: Canvas workspace (tldraw, Mermaid) with simple text-based markdown
- **Auto-Generation**: After 2/5/10 questions → Summary/Business Model/Lean Canvas
- **Feature Flag**: `ENABLE_CANVAS=false` allows instant rollback to canvas
- **Code Removal**: ~2,000 lines of canvas code to be commented out (Part 3/3)

**Canvas Workspace** (`apps/web/lib/canvas/`) - ⚠️ DEPRECATED (feature-flagged)
- **Status**: Being replaced by text-only markdown UX (see above)
- **Feature Flag**: `ENABLE_CANVAS=false` disables canvas, `true` restores it
- **canvas-manager.ts**: Manages tldraw canvas instances with pooling
- **visual-suggestion-parser.ts**: Parses AI suggestions into Mermaid diagrams
- **canvas-export.ts**: Export to PNG (5 resolutions) and SVG with metadata
- **useCanvasSync.ts**: Bidirectional AI↔Canvas synchronization
- **Future**: Will be commented out (not deleted) for rollback capability

**Authentication** (`apps/web/lib/auth/`)
- **AuthContext.tsx**: Simplified auth context (32% code reduction vs previous)
- **apps/web/app/auth/callback/route.ts**: OAuth callback handler
- **Note**: Middleware disabled (middleware.ts.disabled) due to Edge Runtime incompatibility
- **Session management**: API routes handle sessions, not middleware

**Toast Notifications** (`sonner`)
- **Library**: Sonner v1.7.3 - Modern, accessible toast notifications
- **Setup**: `<Toaster position="bottom-right" richColors />` in root layout (`apps/web/app/layout.tsx`)
- **Usage**:
  ```typescript
  import { toast } from 'sonner';

  // Success notification
  toast.success('File downloaded successfully');

  // Error notification
  toast.error('Failed to save changes');
  ```
- **When to Use**:
  - ✅ User-facing success/error feedback (copy, download, save operations)
  - ✅ Brief status updates that auto-dismiss
  - ❌ Critical errors (use error boundaries instead)
  - ❌ Debug logging (use `console.error()` instead)
- **Examples**: MarkdownOutputPane (copy, export, save), form submissions, API errors
- **Styling**: Automatically themed with `richColors` for success (green), error (red)

**Export System** (`apps/web/lib/export/`)
- **pdf-generator.ts**: @react-pdf/renderer integration
- **pdf-templates/FeatureBriefPDF.tsx**: Professional PDF layouts with branding
- **Markdown**: Enhanced GFM with tables, emojis, copy-to-clipboard

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

### API Routes

**AI Endpoints**:
- `/api/chat/stream` - Streaming Claude responses
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

⚠️ **KNOWN ISSUES**: Test suite has infrastructure problems affecting 260+ tests. See [`apps/web/tests/TEST-INFRASTRUCTURE-ISSUES.md`](apps/web/tests/TEST-INFRASTRUCTURE-ISSUES.md) for details. Tests are informational only until infrastructure is fixed. **Build success and TypeScript checking are the validation gates.**

### Unit Tests (Vitest)
- Located in `**/*.test.{ts,tsx}` files
- Setup: `apps/web/tests/setup.ts`
- Coverage: Canvas parsers, utility functions, business logic
- Run: `npm test` (watch) or `npm run test:run` (once)
- **Status**: 260+ failures due to jsdom/environment setup (NOT code issues)

### E2E Tests (Playwright)
- Located in `apps/web/tests/e2e/`
- Config: `apps/web/playwright.config.ts`
- Projects: Desktop Chrome, Mobile Chrome
- OAuth testing: 39+ scenarios with custom reporter
- Run: `npm run test:e2e` or `npm run test:e2e:ui`

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

Required for development:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Pitfalls

1. **Middleware Edge Runtime**: Do NOT use Node.js APIs in middleware - it runs on Edge Runtime
2. **Credit Deduction**: ALWAYS use `deduct_credit_transaction()` for atomicity, never manual UPDATE
3. **File-System Routing**: Every route reference needs a corresponding `page.tsx` file
4. **Migration Order**: Run migrations sequentially (001 → 006), never skip
5. **Stripe Webhooks**: Verify signatures with `stripe-service.ts.constructWebhookEvent()`
6. **Tldraw v4 API**: Use `getSnapshot(store)` and `loadSnapshot(store, data)` - NOT `store.getSnapshot()` or `store.loadSnapshot()`

## Production Deployment

- **Platform**: Vercel
- **Root Directory**: `apps/web` (configured in Vercel dashboard)
- **Current URL**: https://thinkhaven.co
- **Environment**: Set via Vercel CLI (`vercel env ls`, `vercel env add`)
- **Builds**: Automatic on push to main branch

## Recent Major Changes

- **Nov 15**: ✅ QA Cleanup - Toast notifications (sonner), TypeScript fixes (TypingIndicator), test infrastructure docs
- **Nov 15**: 🚧 Text-only markdown UX (Part 1/3) - Replaced canvas with markdown output pane (in progress)
- **Nov 15**: 🔒 Security fixes DEPLOYED - Fixed race condition, server-only LAUNCH_MODE, rollback migration
- **Nov 14-15**: 🚀 Launch mode implementation DEPLOYED - 20-message limits, credit bypass, message warnings
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
