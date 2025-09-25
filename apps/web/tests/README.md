# ThinkHaven E2E Testing Suite

Comprehensive end-to-end testing ensuring production readiness with complete user journey coverage.

## 📋 Test Coverage

- **Authentication**: OAuth, registration, session management (39+ OAuth tests)
- **Dashboard**: Workspace CRUD, navigation, persistence
- **Mary AI**: Chat integration, streaming responses, quality validation
- **BMad Method**: 3 pathways, sessions, document generation
- **Analyst Scenarios**: 5 professional scenarios (Healthcare, E-commerce, SaaS, Market Entry, Product Pivot)
- **Performance**: Load times, API response monitoring
- **Demo Readiness**: Public demonstration validation

## 🚀 Quick Start

```bash
# Setup
npm install
npx playwright install

# Environment (copy .env.example to .env.test and configure)
ANTHROPIC_API_KEY=your_test_api_key
SUPABASE_URL=your_test_supabase_url
SUPABASE_ANON_KEY=your_test_supabase_key

# Run Tests
npm run test:e2e                              # All tests
npm run test:oauth                            # OAuth tests only
npx playwright test tests/e2e/demo-readiness.spec.ts  # Demo validation
```

## 📊 Test Categories

### 1. Authentication Tests (`auth.spec.ts`)
- User registration, OAuth flow, session management
- **OAuth E2E Suite**: 39 tests covering PKCE validation, error scenarios, performance monitoring
- Password reset, security validation, concurrent access

### 2. Dashboard Tests (`dashboard.spec.ts`)
- Workspace CRUD, navigation, search, responsive design, data persistence

### 3. Mary AI Chat Tests (`mary-chat.spec.ts`)
- Streaming messages, response quality, markdown rendering, strategic analysis

### 4. BMad Method Tests (`bmad-session.spec.ts`)
- 3 pathway selections, session timers, elicitation interactions, document generation

### 5. Analyst Scenarios (`analyst-scenarios.spec.ts`)
Professional scenarios: Healthcare Data Platform, E-commerce Optimization, SaaS Pricing Strategy, European Market Entry, Product Pivot Decision

### 6. Visual Outputs (`visual-outputs.spec.ts`)
- Canvas layout, real-time sync, document generation, export functionality

### 7. Demo Showcase (`demo-showcase.spec.ts`)
- Landing page flow, demo sessions, mobile responsive, content quality

### 8. Performance Tests (`performance.spec.ts`)
- Page load (< 3s), Claude API (< 10s), streaming latency, memory management

### 9. Demo Readiness (`demo-readiness.spec.ts`)
- Complete user journey, all scenarios, demo performance, visual quality

## 🎯 Demo Validation

### Critical Requirements
- Landing page < 3s, Authentication works, Dashboard/workspace creation
- Mary AI < 10s response, BMad sessions start reliably
- Visual outputs render, Mobile responsive, Demo mode accessible

### Quality Standards
- Healthcare: HIPAA awareness | E-commerce: Conversion insights
- SaaS: Pricing expertise | Market entry: Regulatory requirements
- Product pivot: Decision frameworks

### Reliability
- 100% success rate, handles Q&A, recovers from failures

## 🛠 Test Infrastructure

**Helper Classes**: AuthHelper, WorkspaceHelper, ChatHelper, BmadHelper
**Test Fixtures**: Pre-configured users, analyst scenarios, BMad pathways
**CI/CD**: GitHub Actions, parallel execution, performance gates, nightly suite

## 📈 Performance Targets

**Response Times**: Landing < 3s, Dashboard < 2s, Claude API < 10s, Streaming < 2s
**Quality Standards**: Mary responses > 200 chars, strategic depth, domain expertise

## 🐛 Debugging

**Common Issues**: Environment vars, API rate limits, database state, network timeouts

```bash
# Debug Commands
DEBUG=playwright:api npx playwright test --headed
npx playwright test --trace on tests/e2e/demo-readiness.spec.ts
npx playwright show-report
```

## 🚀 Deployment Readiness

```bash
# Pre-Deployment Validation
npm run test:e2e                              # Full validation
npx playwright test tests/e2e/demo-readiness.spec.ts  # Demo readiness
npx playwright test --project="Mobile Chrome" # Mobile compatibility
```

**Success Criteria**: All E2E tests pass, demo validation passes, performance requirements met

## 📝 Adding Tests

```typescript
import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'

test.describe('Your Test Suite', () => {
  test('should do something specific', async ({ page }) => {
    // Test implementation with helper classes
  })
})
```

## 🔄 CI/CD Integration

**GitHub Actions**: PR validation, deployment gates, nightly validation, performance monitoring
**Configuration**: Parallel execution across 4 shards, multiple browsers, mobile testing

## 🎉 Production Ready

ThinkHaven is validated and ready for public demos with comprehensive test coverage ensuring:
- Complete user journey from registration to strategic insights
- Professional Mary AI strategic analysis quality
- Reliable BMad Method pathways and document generation
- Performance standards for live demonstrations