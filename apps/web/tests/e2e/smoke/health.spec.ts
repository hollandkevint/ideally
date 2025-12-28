/**
 * Smoke Tests - Health Check
 *
 * Fast tests that verify all routes render without errors.
 * Run these first to catch obvious issues before running full test suite.
 *
 * These tests:
 * - Check each route returns 200 (or 3xx for redirects)
 * - Verify basic page structure loads
 * - Complete in under 2 minutes total
 */

import { test, expect } from '@playwright/test';
import { ROUTES, PUBLIC_ROUTES, PROTECTED_ROUTES, ROUTE_PATTERNS, getLegacyRedirect } from '../../helpers/routes';
import { SELECTORS } from '../../helpers/selectors';

test.describe('Smoke Tests - Public Routes Render', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} page (${route.path}) renders`, async ({ page }) => {
      const response = await page.goto(route.path);

      // Should return 200 OK
      expect(response?.status()).toBeLessThan(400);

      // Page should have visible content
      await expect(page.locator('body')).toBeVisible();

      // Should have a page title or main heading
      const hasTitle = await page.title();
      expect(hasTitle.length).toBeGreaterThan(0);
    });
  }
});

test.describe('Smoke Tests - Protected Routes Redirect', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route.name} (${route.path}) redirects to login when unauthenticated`, async ({ page }) => {
      // Clear any auth state
      await page.context().clearCookies();

      await page.goto(route.path);

      // Should redirect to login
      await expect(page).toHaveURL(ROUTE_PATTERNS.login);
    });
  }
});

test.describe('Smoke Tests - Legacy Route Redirects', () => {
  test('/dashboard redirects away', async ({ page }) => {
    // This test works whether authenticated or not
    // If authenticated: should redirect /dashboard → /app
    // If not authenticated: should redirect /dashboard → /login
    await page.goto(ROUTES.legacy.dashboard);

    // Should not stay on /dashboard - should be on /app or /login
    const url = page.url();
    expect(url.includes('/app') || url.includes('/login')).toBe(true);
  });

  test('/bmad redirects away', async ({ page }) => {
    await page.goto(ROUTES.legacy.bmad);

    // Should redirect somewhere (either /app/new or /login)
    const url = page.url();
    expect(url.includes('/app') || url.includes('/login')).toBe(true);
  });
});

test.describe('Smoke Tests - Landing Page Content', () => {
  test('landing page has hero section', async ({ page }) => {
    await page.goto(ROUTES.landing);

    // Should have main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('landing page has login CTA', async ({ page }) => {
    await page.goto(ROUTES.landing);

    // Should have some way to log in
    const loginButton = page.locator(SELECTORS.landing.ctaLogin);
    await expect(loginButton).toBeVisible();
  });
});

test.describe('Smoke Tests - Auth Pages Content', () => {
  test('login page has form elements', async ({ page }) => {
    await page.goto(ROUTES.login);

    await expect(page.locator(SELECTORS.auth.emailInput)).toBeVisible();
    await expect(page.locator(SELECTORS.auth.passwordInput)).toBeVisible();
    await expect(page.locator(SELECTORS.auth.submitButton)).toBeVisible();
  });

  test('signup page has form elements', async ({ page }) => {
    await page.goto(ROUTES.signup);

    await expect(page.locator(SELECTORS.auth.emailInput)).toBeVisible();
    await expect(page.locator(SELECTORS.auth.passwordInput)).toBeVisible();
    await expect(page.locator(SELECTORS.auth.submitButton)).toBeVisible();
  });

  test('login page has Google OAuth option', async ({ page }) => {
    await page.goto(ROUTES.login);

    const googleButton = page.locator(SELECTORS.auth.googleOAuth);
    await expect(googleButton).toBeVisible();
  });
});

test.describe('Smoke Tests - Guest Flow', () => {
  test('try page loads guest chat interface', async ({ page }) => {
    await page.goto(ROUTES.try);

    // Should show some indication of guest mode
    await expect(page.locator('body')).toContainText(/free|message|chat/i);
  });
});

test.describe('Smoke Tests - Assessment Flow', () => {
  test('assessment page loads quiz interface', async ({ page }) => {
    await page.goto(ROUTES.assessment);

    // Should show assessment title
    await expect(page.locator(SELECTORS.assessment.title)).toBeVisible();

    // Should show first question
    await expect(page.locator(SELECTORS.assessment.questionNumber)).toBeVisible();
  });
});

test.describe('Smoke Tests - Demo Flow', () => {
  test('demo hub page loads scenario cards', async ({ page }) => {
    await page.goto(ROUTES.demo);

    // Should have demo title
    await expect(page.locator(SELECTORS.demo.title)).toBeVisible();

    // Should show at least one scenario
    const scenarioCards = page.locator(SELECTORS.demo.scenarioCard);
    const count = await scenarioCards.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Smoke Tests - No Console Errors', () => {
  const criticalRoutes = [ROUTES.landing, ROUTES.login, ROUTES.try];

  for (const route of criticalRoutes) {
    test(`${route} has no critical console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Filter out known acceptable errors (e.g., third-party scripts)
      const criticalErrors = consoleErrors.filter(
        (error) =>
          !error.includes('favicon') &&
          !error.includes('Google') &&
          !error.includes('analytics') &&
          !error.includes('third-party')
      );

      // Should have no critical errors
      expect(criticalErrors).toHaveLength(0);
    });
  }
});

test.describe('Smoke Tests - Page Load Performance', () => {
  test('landing page loads within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(ROUTES.landing);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test('login page loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(ROUTES.login);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });
});
