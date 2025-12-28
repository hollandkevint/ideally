# ThinkHaven - Project Overview

**AI-Powered Strategic Thinking Workspace**

## Quick Start

```bash
# Clone and setup
cd apps/web
npm install
cp .env.example .env.local  # Add your keys

# Development
npm run dev                 # http://localhost:3000

# Testing
npm test                    # Unit tests
npm run test:e2e           # E2E tests

# Deploy
vercel --prod              # Deploy to production
```

## Project Structure

```
ideally/
├── apps/
│   └── web/               # Main Next.js application
│       ├── app/           # Next.js App Router pages
│       ├── lib/           # Core business logic
│       │   ├── bmad/      # BMad Method engine
│       │   ├── ai/        # AI integration (Claude)
│       │   ├── auth/      # Supabase authentication
│       │   └── monetization/ # Stripe + credits
│       ├── components/    # React components
│       └── tests/         # Test suites
├── docs/                  # Documentation
└── CLAUDE.md             # Development guide
```

## Core Features

### 1. BMad Method Engine
Strategic thinking framework with AI-powered analysis
- **Location**: `apps/web/lib/bmad/`
- **Key files**: session-orchestrator.ts, pathway-router.ts
- **Pathways**: New idea, business model, feature refinement

### 2. AI Integration
Claude-powered conversations with streaming responses
- **Location**: `apps/web/lib/ai/`
- **API**: Anthropic Claude (Sonnet 4)
- **Persona**: Mary (business analyst)

### 3. Credit System
Session-based monetization with Stripe integration
- **Location**: `apps/web/lib/monetization/`
- **Trial**: 2 free credits on signup
- **Transactions**: Atomic with row-level locking

### 4. Canvas Workspace
Visual thinking with tldraw and Mermaid diagrams
- **Location**: `apps/web/lib/canvas/`
- **Features**: Real-time AI sync, export to PNG/SVG

## Tech Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, tldraw
- **Backend**: Next.js API routes, Supabase
- **AI**: Anthropic Claude API
- **Payments**: Stripe
- **Deployment**: Vercel (project: `thinkhaven`)

## Environment Setup

Required services:
1. **Supabase** - Database and authentication
   - Create project at supabase.com
   - Run migrations from `apps/web/supabase/migrations/`

2. **Anthropic** - AI API
   - Get API key from console.anthropic.com

3. **Stripe** - Payments (optional for development)
   - Get keys from dashboard.stripe.com

See `apps/web/.env.example` for complete list of environment variables.

## Development Workflow

### Local Development
```bash
cd apps/web
npm run dev              # Start with Turbopack
npm run lint             # Check code quality
npm run build            # Test production build
```

### Testing
```bash
npm test                 # Unit tests (Vitest)
npm run test:e2e         # E2E tests (7 smoke tests)
```

### Deployment
```bash
# Production deployment
cd apps/web
vercel link              # Link to thinkhaven project
vercel --prod            # Deploy to production
```

## Database

**Platform**: Supabase (PostgreSQL)

**Key Tables**:
- `bmad_sessions` - User sessions and progress
- `conversations` / `messages` - Chat history
- `user_credits` / `credit_transactions` - Monetization
- `credit_packages` / `payment_history` - Stripe integration

**Migrations**: Run in order (001 → 006) from `apps/web/supabase/migrations/`

## Active Vercel Projects

1. **thinkhaven** - This project (ideally repository)
   - URL: https://thinkhaven-hollandkevints-projects.vercel.app

2. **neurobot** - Separate project
   - URL: https://neurobot-delta.vercel.app

3. **pmarchetype** - Separate project
   - URL: https://www.pmarchetype.com

## Key Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `vercel --prod` | Deploy to production |

## Documentation

- **CLAUDE.md** - Comprehensive development guide for AI assistants
- **docs/stories/** - Feature requirements and stories
- **docs/architecture/** - System architecture documentation
- **apps/web/tests/README.md** - Testing infrastructure guide

## Support

- **Repository**: https://github.com/hollandkevint/ideally
- **Vercel Dashboard**: https://vercel.com/hollandkevints-projects/thinkhaven
- **Issues**: Create GitHub issues for bugs/features

---

*Last Updated: December 28, 2025*
