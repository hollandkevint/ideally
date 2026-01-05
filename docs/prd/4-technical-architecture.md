# Technical Architecture

*Updated January 2026 - Aligned with Strategic Direction*

## Technology Stack

**Current Implementation:**
- **Languages**: TypeScript, JavaScript (ES2023), CSS3
- **Frontend Framework**: React 19.1.0 with Next.js 15.5.0
- **Build System**: Turbopack for fast development builds
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Authentication**: Supabase Auth with Row Level Security
- **Database**: PostgreSQL with comprehensive schema
- **AI Integration**: Anthropic Claude with streaming responses
- **Infrastructure**: Vercel deployment with Edge functions
- **Development**: Monorepo structure with npm workspaces

## Integration Approach

### Claude API Integration with Sub-Persona System
**Implementation Strategy:**
- **API Client**: Anthropic SDK (@anthropic-ai/sdk) for Claude integration
- **Streaming Responses**: Server-Sent Events for real-time AI conversation
- **Sub-Persona Weights**: System prompt injection with pathway-specific mode weights
- **Dynamic Mode Shifting**: Detect user state and adjust active mode
- **Kill Recommendation**: Escalation sequence for anti-sycophancy

### Database Integration Strategy
**Schema Components:**
- Conversation tables for AI message storage
- Session state management with pathway and mode tracking
- Credit system tables for monetization
- Output generation state for Lean Canvas and PRD/Spec

### API Architecture
**Endpoint Structure:**
```
/api/chat/stream - Claude streaming with sub-persona weights
/api/chat/guest - Guest streaming (10 message limit)
/api/bmad - Session management with pathway configuration
/api/credits/balance - Credit system endpoints
```

## Code Organization and Standards

### File Structure Approach
- **AI Integration**: `lib/ai/` for Claude client, Mary persona, sub-persona system
- **Session Management**: `lib/bmad/` for pathway routing and session orchestration
- **Output Generation**: `lib/bmad/generators/` for Lean Canvas and PRD/Spec generation
- **UI Components**: `components/` with chat, output preview, and export panels
- **API Routes**: `api/` with streaming chat and session management endpoints

### Key Files for MVP
- **mary-persona.ts**: Base persona + sub-persona weights
- **session-orchestrator.ts**: Pathway configuration and session lifecycle
- **pathway-router.ts**: Pathway selection with weight configuration
- **LeanCanvasGenerator.ts**: Output generation from session insights
- **PRDSpecGenerator.ts**: PRD/Spec document generation

### Coding Standards
- **TypeScript First**: Strong typing for all AI integration interfaces
- **Sub-Persona Types**: Explicit typing for mode weights and transitions
- **Error Boundaries**: React error boundaries for AI component failures
- **Testing**: Unit tests for sub-persona logic, E2E for session flows

## Deployment and Operations

### Build Process Integration
- **Environment Variables**: Secure Claude API key management
- **Build Optimization**: Bundle splitting for AI features
- **Type Safety**: Compile-time validation for Claude API integration

### Configuration Management
- **Development**: Local environment with Claude API keys
- **Production**: Secure key management via Vercel environment variables