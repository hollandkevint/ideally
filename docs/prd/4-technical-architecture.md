# Technical Architecture

## Existing Technology Stack

**Current Implementation Analysis:**
- **Languages**: TypeScript, JavaScript (ES2023), CSS3
- **Frontend Framework**: React 19.1.0 with Next.js 15.5.0
- **Build System**: Turbopack for fast development builds
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Authentication**: Supabase Auth with Row Level Security
- **Database**: PostgreSQL with comprehensive AI-ready schema
- **Infrastructure**: Next.js deployment (Vercel-compatible)
- **Development**: Monorepo structure with npm workspaces

## Integration Approach

### Claude Sonnet 4 API Integration
**Implementation Strategy:**
- **API Client**: Anthropic SDK (@anthropic-ai/sdk) for Claude Sonnet 4 integration
- **Streaming Responses**: WebSocket or Server-Sent Events for real-time AI conversation
- **Context Management**: Intelligent conversation history with sliding window context
- **Error Handling**: Graceful fallbacks and user-friendly error messaging

### Database Integration Strategy
**Current Schema Enhancement:**
- Extend existing conversation tables for AI message storage
- Add session state management for BMad Method progression
- Implement proper indexing for conversation history queries
- Maintain existing Supabase RLS policies for user data isolation

### API Architecture
**Endpoint Structure:**
```
/api/ai/conversation - Claude API integration endpoint
/api/ai/stream - Streaming conversation responses  
/api/session/bmad - BMad Method session management
/api/session/state - Session state persistence
```

## Code Organization and Standards

### File Structure Approach
- **AI Integration**: `lib/ai/` for Claude client and conversation management
- **Session Management**: `lib/bmad/` for strategic thinking workflow logic
- **UI Components**: Extend existing `components/` structure with AI-aware components
- **API Routes**: Enhance existing `api/` structure with Claude integration endpoints

### Naming Conventions
- **AI Components**: Prefix with `AI` or `Claude` (e.g., `AIConversation`, `ClaudeStreamClient`)
- **Session Components**: BMad prefix for strategic thinking components (e.g., `BMadSession`, `BMadProgress`)
- **Hook Patterns**: Follow existing React hook patterns (`useAIConversation`, `useBMadSession`)

### Coding Standards
- **TypeScript First**: Strong typing for all AI integration interfaces
- **Error Boundaries**: React error boundaries for AI component failures
- **Performance**: Memoization and optimization for conversation rendering
- **Testing**: Unit tests for AI logic, integration tests for API endpoints

## Deployment and Operations

### Build Process Integration
- **Environment Variables**: Secure Claude API key management
- **Build Optimization**: Bundle splitting for AI features to reduce initial load
- **Type Safety**: Compile-time validation for Claude API integration

### Configuration Management
- **Development**: Local environment with Claude API sandbox/development keys
- **Staging**: Full Claude integration testing with production-like configuration  
- **Production**: Secure key management with monitoring and rate limiting