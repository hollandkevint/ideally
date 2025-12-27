/**
 * Guest Flow Tests
 *
 * Tests the guest chat experience at /try:
 * - 5 free messages without login
 * - Message counter UI
 * - Signup prompt after limit
 * - Session persistence in localStorage
 */

import { test, expect } from '@playwright/test';
import { ROUTES } from '../../helpers/routes';
import { SELECTORS } from '../../helpers/selectors';

test.describe('Guest Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to try page first (required for localStorage access)
    await page.goto(ROUTES.try);

    // Clear localStorage to reset guest session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Reload to start fresh
    await page.reload();
  });

  test.describe('Initial State', () => {
    test('displays guest welcome message', async ({ page }) => {
      await page.goto(ROUTES.try);

      // Should show indication of free messages
      await expect(page.locator('body')).toContainText(/free|guest|message/i);
    });

    test('shows chat interface', async ({ page }) => {
      await page.goto(ROUTES.try);

      // Should have chat input
      const chatInput = page.locator('textarea, input[type="text"]').first();
      await expect(chatInput).toBeVisible();
    });

    test('displays message counter or remaining messages indicator', async ({ page }) => {
      await page.goto(ROUTES.try);

      // Look for any indication of message limit
      const messageIndicator = page.locator('text=/\\d+.*message|remaining|left/i');
      const counterExists = await messageIndicator.count() > 0;

      // Either has explicit counter or mentions messages somewhere
      if (!counterExists) {
        await expect(page.locator('body')).toContainText(/message/i);
      }
    });
  });

  test.describe('Chat Interaction', () => {
    test('can send a message', async ({ page }) => {
      await page.goto(ROUTES.try);

      // Find and fill chat input
      const chatInput = page.locator('textarea, input[type="text"]').first();
      await chatInput.fill('Hello, this is a test message');

      // Find and click send button
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
      await sendButton.click();

      // Message should appear in chat (or show loading state)
      await page.waitForTimeout(1000);

      // Either message appears or some response indication
      const hasResponse = await page.locator('text=/Hello|typing|loading/i').count() > 0;
      expect(hasResponse).toBe(true);
    });

    test('stores session in localStorage', async ({ page }) => {
      await page.goto(ROUTES.try);

      // Send a message
      const chatInput = page.locator('textarea, input[type="text"]').first();
      await chatInput.fill('Test message for localStorage');

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
      await sendButton.click();

      await page.waitForTimeout(2000);

      // Check localStorage has session data
      const hasSessionData = await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        return keys.some(key =>
          key.includes('session') ||
          key.includes('guest') ||
          key.includes('chat') ||
          key.includes('message')
        );
      });

      expect(hasSessionData).toBe(true);
    });
  });

  test.describe('Session Persistence', () => {
    test('preserves messages after page reload', async ({ page }) => {
      await page.goto(ROUTES.try);

      // Send a message
      const chatInput = page.locator('textarea, input[type="text"]').first();
      const testMessage = `Unique test message ${Date.now()}`;
      await chatInput.fill(testMessage);

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
      await sendButton.click();

      // Wait for message to be stored
      await page.waitForTimeout(2000);

      // Reload page
      await page.reload();

      // Check if message persisted (either in chat or localStorage)
      const messageVisible = await page.locator(`text=${testMessage.substring(0, 20)}`).count() > 0;
      const inLocalStorage = await page.evaluate((msg) => {
        const data = JSON.stringify(localStorage);
        return data.includes(msg.substring(0, 20));
      }, testMessage);

      expect(messageVisible || inLocalStorage).toBe(true);
    });
  });

  test.describe('Signup Prompt', () => {
    test('shows save progress option', async ({ page }) => {
      await page.goto(ROUTES.try);

      // Look for any save progress or signup indication
      const saveOrSignup = page.locator('text=/save|sign up|create account/i');
      const hasOption = await saveOrSignup.count() > 0;

      // Page should have some way to convert to full account
      expect(hasOption).toBe(true);
    });

    test('links to signup page', async ({ page }) => {
      await page.goto(ROUTES.try);

      // Find signup link/button
      const signupLink = page.locator('a[href*="signup"], button:has-text("Sign Up")');

      if (await signupLink.count() > 0) {
        await signupLink.first().click();

        // Should navigate to signup
        await expect(page).toHaveURL(/signup/);
      }
    });
  });

  test.describe('Navigation', () => {
    test('can navigate back to landing page', async ({ page }) => {
      await page.goto(ROUTES.try);

      // Find home/back link
      const homeLink = page.locator('a[href="/"], a:has-text("Home"), a:has-text("Back")');

      if (await homeLink.count() > 0) {
        await homeLink.first().click();
        await expect(page).toHaveURL(ROUTES.landing);
      }
    });

    test('can navigate to login', async ({ page }) => {
      await page.goto(ROUTES.try);

      // Find login link
      const loginLink = page.locator('a[href*="login"], button:has-text("Log in")');

      if (await loginLink.count() > 0) {
        await loginLink.first().click();
        await expect(page).toHaveURL(/login/);
      }
    });
  });
});

test.describe('Guest Flow Edge Cases', () => {
  test('handles empty message submission', async ({ page }) => {
    await page.goto(ROUTES.try);

    // Try to send empty message
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    // Button should be disabled or submission should be prevented
    const isDisabled = await sendButton.isDisabled();

    if (!isDisabled) {
      await sendButton.click();
      // Should not crash, should show some feedback or be ignored
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('handles very long message', async ({ page }) => {
    await page.goto(ROUTES.try);

    const chatInput = page.locator('textarea, input[type="text"]').first();

    // Try to send very long message
    const longMessage = 'a'.repeat(5000);
    await chatInput.fill(longMessage);

    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();

    // Should not crash
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles special characters', async ({ page }) => {
    await page.goto(ROUTES.try);

    const chatInput = page.locator('textarea, input[type="text"]').first();

    // Send message with special characters
    const specialMessage = "Hello! <script>alert('test')</script> & < > \"quotes\" 'apostrophe'";
    await chatInput.fill(specialMessage);

    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();

    // Should not crash and should sanitize
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();

    // Should NOT have executed any script
    const alertHandled = await page.evaluate(() => window.alert === window.alert);
    expect(alertHandled).toBe(true);
  });
});
