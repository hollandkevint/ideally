# E2E Testing Strategy for ThinkHaven

*Created: 2025-12-27*

## Executive Summary

This document outlines a sustainable E2E testing strategy for ThinkHaven that:
- Tests the **actual current app**, not aspirational features
- Minimizes maintenance burden with self-healing test patterns
- Provides clear monitoring and alerting for test drift
- Makes updating tests easy when the app changes

---

## Part 1: Current State Analysis

### What Actually Exists (19 Routes)

| Route | Type | Status | Priority |
|-------|------|--------|----------|
| `/` | Landing Page | ✅ Functional | P1 |
| `/login` | Auth - Login | ✅ Functional | P1 |
| `/signup` | Auth - Signup | ✅ Functional | P1 |
| `/try` | Guest Chat (5 msg) | ✅ Functional | P1 |
| `/assessment` | Quiz | ✅ Functional | P2 |
| `/assessment/results` | Quiz Results | ✅ Functional | P2 |
| `/demo` | Demo Hub | ✅ Functional | P2 |
| `/demo/[scenario]` | Demo Viewer | ✅ Functional | P2 |
| `/app` | Dashboard | ✅ Functional | P1 |
| `/app/new` | Create Session | ✅ Functional | P1 |
| `/app/session/[id]` | Workspace | ✅ Functional | P1 |
| `/app/account` | Account Settings | ✅ Functional | P2 |
| `/auth/callback` | OAuth Callback | ✅ Functional | P1 |
| `/resend-confirmation` | Email Resend | ✅ Functional | P3 |
| `/validate/success` | Stripe Success | ✅ Functional | P3 |
| `/monitoring` | Admin Alerts | ✅ Functional | P3 |

### Existing Test Files (11 files)

| File | Tests | Status | Issue |
|------|-------|--------|-------|
| `simple-test.spec.ts` | 2 | ⚠️ Outdated | Wrong selectors for landing page |
| `auth.spec.ts` | 22 | ⚠️ Outdated | Uses `/dashboard` instead of `/app` |
| `dashboard.spec.ts` | 18 | ⚠️ Outdated | Uses `/dashboard` and `/workspace` |
| `mary-chat.spec.ts` | 18 | ⚠️ Outdated | Uses `/workspace` |
| `bmad-session.spec.ts` | 21 | ⚠️ Outdated | Uses `/workspace` |
| `assessment-quiz.spec.ts` | 3 | ✅ Works | Correct routes |
| `demo-readiness.spec.ts` | ? | Unknown | Needs audit |
| `analyst-scenarios.spec.ts` | ? | Unknown | Needs audit |
| `oauth-error-scenarios.spec.ts` | ? | Unknown | Uses OAuth mocks |
| `performance.spec.ts` | ? | Unknown | Needs audit |
| `visual-outputs.spec.ts` | ? | Unknown | Needs audit |

### Key Issues Identified

1. **Route Mismatch**: Tests use old routes (`/dashboard`, `/workspace/[id]`) but app uses new routes (`/app`, `/app/session/[id]`)
2. **Selector Drift**: CSS selectors don't match current Tailwind classes
3. **Missing Coverage**: No tests for `/try` guest flow, `/demo` pages
4. **Complex Helper Coupling**: Tests depend on helpers that assume old page structure

---

## Part 2: Recommended Test Architecture

### File Structure

```
apps/web/tests/
├── e2e/
│   ├── core/                    # Critical user flows (P1)
│   │   ├── landing.spec.ts      # Homepage renders, CTAs work
│   │   ├── auth-flow.spec.ts    # Login, signup, logout
│   │   ├── guest-flow.spec.ts   # /try → 5 messages → signup prompt
│   │   └── workspace.spec.ts    # Create session, chat, export
│   │
│   ├── features/                # Feature-specific tests (P2)
│   │   ├── assessment.spec.ts   # Quiz completion
│   │   ├── demo.spec.ts         # Demo playback
│   │   ├── chat-export.spec.ts  # Export formats
│   │   └── account.spec.ts      # Account settings
│   │
│   ├── integrations/            # External integrations (P3)
│   │   ├── oauth.spec.ts        # OAuth flows
│   │   └── stripe.spec.ts       # Checkout flows (mocked)
│   │
│   └── smoke/                   # Fast sanity checks
│       └── health.spec.ts       # All routes render
│
├── helpers/
│   ├── selectors.ts             # Centralized selectors (single source of truth)
│   ├── routes.ts                # Route constants
│   ├── auth.helper.ts           # Auth utilities
│   └── workspace.helper.ts      # Workspace utilities
│
├── fixtures/
│   └── test-data.ts             # Test data constants
│
└── config/
    ├── test-env.ts              # Environment config
    └── global-setup.ts          # Before all tests
```

### Key Principles

1. **Centralized Selectors**: All selectors in one file → update once, fix everywhere
2. **Route Constants**: All routes in one file → route changes don't break tests
3. **Resilient Selectors**: Use `data-testid` > role > text > class
4. **Smoke Tests First**: Fast health checks catch 80% of issues

---

## Part 3: Implementation Plan

### Phase 1: Foundation (Week 1)

#### Task 1.1: Create Selector Registry
```typescript
// apps/web/tests/helpers/selectors.ts
export const SELECTORS = {
  // Landing Page
  landing: {
    hero: 'h1:has-text("waste 6 months")',
    ctaValidate: 'a[href*="validate"], button:has-text("Validate My Idea")',
    ctaAssessment: 'a[href="/assessment"]',
    loginButton: 'button:has-text("Email & Password Login")',
  },

  // Auth
  auth: {
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    submitButton: 'button[type="submit"]',
    googleOAuth: 'button:has-text("Continue with Google")',
    errorMessage: '[role="alert"], .text-red-500',
  },

  // Dashboard
  dashboard: {
    welcomeHeading: 'h1:has-text("Welcome")',
    newSessionButton: 'button:has-text("New Session")',
    sessionCard: '[data-session-id]',
    userEmail: '[data-user-email]',
  },

  // Workspace
  workspace: {
    chatTab: 'button:has-text("Mary Chat")',
    bmadTab: 'button:has-text("BMad Method")',
    chatInput: 'textarea[placeholder]',
    sendButton: 'button:has-text("Send")',
    exportDropdown: 'button:has-text("Export")',
  },

  // Guest Flow
  guest: {
    messageCounter: '.message-counter, [data-messages-remaining]',
    signupPrompt: '[role="dialog"]:has-text("Sign Up")',
    saveBanner: '.save-progress-banner',
  },
};
```

#### Task 1.2: Create Route Constants
```typescript
// apps/web/tests/helpers/routes.ts
export const ROUTES = {
  // Public
  landing: '/',
  login: '/login',
  signup: '/signup',
  try: '/try',
  assessment: '/assessment',
  assessmentResults: '/assessment/results',
  demo: '/demo',
  demoScenario: (id: string) => `/demo/${id}`,

  // Protected (require auth)
  app: '/app',
  appNew: '/app/new',
  appSession: (id: string) => `/app/session/${id}`,
  appAccount: '/app/account',

  // Legacy redirects (test these redirect correctly)
  legacy: {
    dashboard: '/dashboard',      // → /app
    workspace: (id: string) => `/workspace/${id}`, // → /app/session/${id}
    account: '/account',          // → /app/account
  },
};
```

#### Task 1.3: Add data-testid Attributes to App
Add resilient test hooks to critical elements:

**Dashboard (`apps/web/app/app/page.tsx`)**:
- `data-testid="dashboard-welcome"`
- `data-testid="new-session-button"`
- `data-testid="session-card"` + `data-session-id="..."`

**Workspace (`apps/web/app/app/session/[id]/page.tsx`)**:
- `data-testid="chat-tab"`
- `data-testid="bmad-tab"`
- `data-testid="chat-input"`
- `data-testid="send-button"`

**Guest Flow (`apps/web/app/try/page.tsx`)**:
- `data-testid="message-counter"`
- `data-testid="signup-prompt"`

### Phase 2: Core Tests (Week 1-2)

#### Task 2.1: Smoke Test (All Routes Render)
```typescript
// apps/web/tests/e2e/smoke/health.spec.ts
import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/routes';

test.describe('Smoke Tests - All Routes Render', () => {
  const publicRoutes = [
    { name: 'Landing', path: ROUTES.landing },
    { name: 'Login', path: ROUTES.login },
    { name: 'Signup', path: ROUTES.signup },
    { name: 'Try', path: ROUTES.try },
    { name: 'Assessment', path: ROUTES.assessment },
    { name: 'Demo', path: ROUTES.demo },
  ];

  for (const route of publicRoutes) {
    test(`${route.name} page renders`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
```

#### Task 2.2: Auth Flow Tests
```typescript
// apps/web/tests/e2e/core/auth-flow.spec.ts
import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { ROUTES } from '../helpers/routes';

test.describe('Authentication Flows', () => {
  test('login page displays correctly', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.locator(SELECTORS.auth.emailInput)).toBeVisible();
    await expect(page.locator(SELECTORS.auth.passwordInput)).toBeVisible();
    await expect(page.locator(SELECTORS.auth.googleOAuth)).toBeVisible();
  });

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto(ROUTES.app);
    await expect(page).toHaveURL(new RegExp(ROUTES.login));
  });

  test('legacy /dashboard redirects to /app', async ({ page }) => {
    // First login...
    await page.goto(ROUTES.legacy.dashboard);
    await expect(page).toHaveURL(new RegExp(ROUTES.app));
  });
});
```

#### Task 2.3: Guest Flow Tests (NEW)
```typescript
// apps/web/tests/e2e/core/guest-flow.spec.ts
import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { ROUTES } from '../helpers/routes';

test.describe('Guest Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset guest session
    await page.goto(ROUTES.try);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows 5 message allowance banner', async ({ page }) => {
    await page.goto(ROUTES.try);
    await expect(page.getByText(/5 free messages/i)).toBeVisible();
  });

  test('displays message counter', async ({ page }) => {
    await page.goto(ROUTES.try);
    await expect(page.getByText(/remaining/i)).toBeVisible();
  });

  test('shows signup prompt after message limit', async ({ page }) => {
    await page.goto(ROUTES.try);

    // Send 5 messages (or mock the counter)
    // After 5 messages, signup modal should appear
    // This tests the core guest → signup conversion flow
  });
});
```

### Phase 3: Monitoring & Maintenance (Week 2-3)

#### Task 3.1: Test Health Dashboard Workflow
```yaml
# .github/workflows/e2e-health.yml
name: E2E Test Health Check

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch:

jobs:
  test-health:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run smoke tests
        run: |
          cd apps/web
          npm ci
          npx playwright install chromium
          npx playwright test tests/e2e/smoke/ --reporter=json > smoke-results.json

      - name: Analyze test drift
        run: |
          # Compare selectors with actual DOM
          # Flag tests that might be stale
          node scripts/analyze-test-drift.js

      - name: Create issue if tests fail
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🔴 E2E Smoke Tests Failing',
              body: `Daily smoke tests failed.\n\nRun: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
              labels: ['bug', 'testing', 'automated']
            })
```

#### Task 3.2: Selector Drift Detection Script
```typescript
// apps/web/scripts/analyze-test-drift.ts
import * as fs from 'fs';
import * as path from 'path';

interface DriftReport {
  file: string;
  line: number;
  selector: string;
  issue: string;
}

const DANGEROUS_PATTERNS = [
  { pattern: /\.bg-\w+/, issue: 'Uses Tailwind background class - may break on style changes' },
  { pattern: /\.text-\w+/, issue: 'Uses Tailwind text class - may break on style changes' },
  { pattern: /data-workspace-id/, issue: 'Uses old data attribute - should use data-session-id' },
  { pattern: /\/dashboard/, issue: 'Uses deprecated /dashboard route - should use /app' },
  { pattern: /\/workspace\//, issue: 'Uses deprecated /workspace route - should use /app/session/' },
];

function analyzeFile(filepath: string): DriftReport[] {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  const reports: DriftReport[] = [];

  lines.forEach((line, index) => {
    for (const { pattern, issue } of DANGEROUS_PATTERNS) {
      if (pattern.test(line)) {
        reports.push({
          file: filepath,
          line: index + 1,
          selector: line.trim(),
          issue,
        });
      }
    }
  });

  return reports;
}

// Main execution
const testDir = path.join(__dirname, '../tests/e2e');
const specFiles = fs.readdirSync(testDir, { recursive: true })
  .filter(f => f.toString().endsWith('.spec.ts'));

let allDrift: DriftReport[] = [];
for (const file of specFiles) {
  allDrift = allDrift.concat(analyzeFile(path.join(testDir, file.toString())));
}

if (allDrift.length > 0) {
  console.log('\n⚠️  POTENTIAL TEST DRIFT DETECTED:\n');
  allDrift.forEach(d => {
    console.log(`${d.file}:${d.line}`);
    console.log(`  Issue: ${d.issue}`);
    console.log(`  Code: ${d.selector.substring(0, 80)}...`);
    console.log('');
  });
  process.exit(1);
}

console.log('✅ No test drift detected');
```

#### Task 3.3: Pre-Deploy Test Gate
```yaml
# In existing CI workflow, add before deploy
- name: Run core E2E tests
  run: |
    cd apps/web
    npx playwright test tests/e2e/core/ --project=chromium

- name: Block deploy if tests fail
  if: failure()
  run: |
    echo "❌ E2E tests failed - blocking deployment"
    exit 1
```

---

## Part 4: Maintenance Protocol

### When App Changes

| Change Type | Action | Who |
|-------------|--------|-----|
| Route change | Update `routes.ts` | Dev making change |
| Component rename | Update `selectors.ts` | Dev making change |
| New feature | Add tests to `features/` | Feature dev |
| UI redesign | Audit `selectors.ts`, add `data-testid` | QA/Dev |
| Breaking change | Run full test suite locally first | Dev |

### Monthly Maintenance Checklist

- [ ] Run `analyze-test-drift.ts` script
- [ ] Review failed daily smoke tests
- [ ] Update selectors for any new UI patterns
- [ ] Remove tests for deprecated features
- [ ] Add tests for new features

### Adding New Tests Checklist

1. **Use centralized selectors** - Import from `selectors.ts`
2. **Use route constants** - Import from `routes.ts`
3. **Prefer data-testid** - Ask dev to add if missing
4. **Keep tests focused** - One flow per test
5. **Add to correct folder** - core/ for P1, features/ for P2

---

## Part 5: Implementation Roadmap

### Immediate (This Week)

1. ✅ Delete broken test files (done)
2. Create `selectors.ts` and `routes.ts`
3. Fix `auth.spec.ts` routes (`/dashboard` → `/app`)
4. Add smoke tests for all routes
5. Add guest flow tests

### Short-term (Next 2 Weeks)

6. Add data-testid attributes to key components
7. Update remaining test files to use new selectors
8. Set up daily smoke test workflow
9. Create selector drift detection script

### Medium-term (Month 1)

10. Complete core test coverage (auth, guest, workspace)
11. Add feature tests (assessment, demo, export)
12. Set up pre-deploy test gate
13. Document maintenance protocol

---

## Appendix: Quick Reference

### Run Tests Locally
```bash
cd apps/web

# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/core/auth-flow.spec.ts

# Run with UI
npm run test:e2e:ui

# Run smoke tests only
npx playwright test tests/e2e/smoke/
```

### Debug Failing Tests
```bash
# Run with trace
npx playwright test --trace on

# Run headed (see browser)
npx playwright test --headed

# Run specific test
npx playwright test -g "login page displays"
```

### Update Selectors
1. Open `apps/web/tests/helpers/selectors.ts`
2. Find the selector that changed
3. Update with new selector
4. Run tests to verify
