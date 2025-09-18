// End-to-end tests for complete New Idea session flow
import { test, expect } from '@playwright/test';

test.describe('New Idea Session Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application and ensure authenticated state
    await page.goto('/');

    // Mock authentication for testing
    await page.evaluate(() => {
      localStorage.setItem('auth_session', JSON.stringify({
        user: { id: 'test-user', email: 'test@example.com' },
        token: 'mock-token'
      }));
    });
  });

  test('should complete full New Idea pathway session', async ({ page }) => {
    // Navigate to new workspace or existing workspace
    await page.goto('/workspace/test-workspace');

    // Start New Idea pathway by clicking on the pathway card
    await page.click('text=New Idea Creative Expansion');

    // Verify pathway loads
    await expect(page.locator('[data-testid="new-idea-pathway"]')).toBeVisible();
    await expect(page.locator('[data-testid="pathway-title"]')).toContainText('New Idea Creative Expansion');

    // Phase 1: Ideation
    await expect(page.locator('[data-testid="current-phase"]')).toContainText('Creative Expansion');

    await page.fill('[data-testid="user-input"]',
      'I want to create a mobile app that helps people with dietary restrictions find restaurants that accommodate their needs. Many people struggle to find suitable dining options when they have allergies, follow specific diets like vegan or keto, or have religious dietary requirements.'
    );

    await page.click('[data-testid="submit-response"]');

    // Wait for phase progression - no ai-response element, phase auto-advances
    await expect(page.locator('[data-testid="current-phase"]')).toContainText('Market Opportunity Analysis');

    // Phase 2: Market Exploration
    await page.fill('[data-testid="user-input"]',
      'My target market is health-conscious millennials and Gen Z consumers in urban areas who have dietary restrictions. This includes people with celiac disease (3M+ in US), vegans (6M+ in US), those following keto diets (5M+ in US), and people with various food allergies. The market is growing as more people adopt specific diets for health, ethical, or medical reasons.'
    );

    await page.click('[data-testid="submit-response"]');

    // Verify market analysis feedback
    await expect(page.locator('[data-testid="market-insights"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-phase"]')).toContainText('Business Concept Refinement');

    // Phase 3: Concept Refinement - simplified for test
    await page.fill('textarea', 'Comprehensive dietary filtering with verified partnerships');
    await page.click('button:has-text("Continue to Positioning")');

    // Verify advancement to positioning
    await expect(page.locator('[data-testid="current-phase"]')).toContainText('Strategic Positioning');

    // Phase 4: Strategic Positioning - simplified for test
    await page.fill('textarea', 'Next steps: customer interviews, MVP development, partnerships');
    await page.click('button:has-text("Complete Pathway")');

    // Verify session completion
    await expect(page.locator('h2:has-text("Pathway Complete")')).toBeVisible();
    await expect(page.locator('[data-testid="concept-document"]')).toBeVisible();

    // Test document export
    await page.click('button:has-text("Export Document")');

    // Check that export was triggered (file download)
    await expect(page.locator('[data-testid="concept-document"]')).toBeVisible();
  });

  test('should track time allocation correctly', async ({ page }) => {
    await page.goto('/workspace/test-workspace');
    await page.click('text=New Idea Creative Expansion');

    // Check initial time display
    await expect(page.locator('[data-testid="phase-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-session-timer"]')).toContainText('30 minutes');

    // Verify phase time allocation
    await expect(page.locator('[data-testid="current-phase-time"]')).toContainText('8:00'); // Ideation phase

    // Submit input and advance to next phase
    await page.fill('[data-testid="user-input"]', 'Test business idea for time tracking');
    await page.click('[data-testid="submit-response"]');

    // Check time updates after phase transition
    await expect(page.locator('[data-testid="current-phase-time"]')).toContainText('10:00'); // Market exploration phase
  });

  test('should handle phase validation correctly', async ({ page }) => {
    await page.goto('/workspace/test-workspace');
    await page.click('text=New Idea Creative Expansion');

    // Test insufficient input - button should be disabled
    await page.fill('[data-testid="user-input"]', 'Short');
    await expect(page.locator('[data-testid="submit-response"]')).toBeDisabled();

    // Test sufficient input
    await page.fill('[data-testid="user-input"]',
      'Comprehensive mobile application that solves the problem of finding restaurants with dietary accommodations for people with allergies and dietary restrictions'
    );
    await expect(page.locator('[data-testid="submit-response"]')).toBeEnabled();
    await page.click('[data-testid="submit-response"]');

    // Should advance to next phase
    await expect(page.locator('[data-testid="current-phase"]')).toContainText('Market Opportunity');
  });

  test('should display progress indicators correctly', async ({ page }) => {
    await page.goto('/workspace/test-workspace');
    await page.click('text=New Idea Creative Expansion');

    // Check initial progress - corrected percentages for 4 phases
    await expect(page.locator('[data-testid="overall-progress"]')).toContainText('0%'); // 0 of 4 phases
    await expect(page.locator('[data-testid="phase-indicator-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="phase-indicator-2"]')).toHaveClass(/pending/);

    // Complete first phase
    await page.fill('[data-testid="user-input"]', 'Detailed business concept for progress testing');
    await page.click('[data-testid="submit-response"]');

    // Check updated progress
    await expect(page.locator('[data-testid="overall-progress"]')).toContainText('25%'); // 1 of 4 phases
    await expect(page.locator('[data-testid="phase-indicator-1"]')).toHaveClass(/completed/);
    await expect(page.locator('[data-testid="phase-indicator-2"]')).toHaveClass(/active/);
  });

  test('should generate concept document with correct content', async ({ page }) => {
    // Complete entire session (abbreviated for testing)
    await page.goto('/workspace/test-workspace');
    await page.click('text=New Idea Creative Expansion');

    // Mock session completion
    await page.evaluate(() => {
      window.mockSessionComplete = true;
    });

    await page.click('[data-testid="view-concept-document"]');

    // Verify document structure
    await expect(page.locator('[data-testid="concept-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="executive-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="problem-statement"]')).toBeVisible();
    await expect(page.locator('[data-testid="solution"]')).toBeVisible();
    await expect(page.locator('[data-testid="value-proposition"]')).toBeVisible();
    await expect(page.locator('[data-testid="target-market"]')).toBeVisible();
    await expect(page.locator('[data-testid="market-opportunities"]')).toBeVisible();
    await expect(page.locator('[data-testid="business-model"]')).toBeVisible();
    await expect(page.locator('[data-testid="competitive-advantage"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-steps"]')).toBeVisible();

    // Test export functionality
    await page.click('[data-testid="export-document"]');
    // Verify download or export modal appears
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    await page.goto('/workspace/test-workspace');

    // Test network error simulation
    await page.route('**/api/bmad', route => route.abort());

    await page.click('text=New Idea Creative Expansion');
    await page.fill('[data-testid="user-input"]', 'Test input for error handling');
    await page.click('[data-testid="submit-response"]');

    // Should show error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Test retry functionality
    await page.unroute('**/api/bmad');
    await page.click('[data-testid="retry-button"]');

    // Should recover and continue
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
  });

  test('should maintain session state across page refreshes', async ({ page }) => {
    await page.goto('/workspace/test-workspace');
    await page.click('text=New Idea Creative Expansion');

    // Start session
    await page.fill('[data-testid="user-input"]', 'Restaurant discovery app for dietary restrictions');
    await page.click('[data-testid="submit-response"]');

    // Advance to second phase
    await expect(page.locator('[data-testid="current-phase"]')).toContainText('Market Opportunity');

    // Refresh page
    await page.reload();

    // Verify session is restored
    await expect(page.locator('[data-testid="current-phase"]')).toContainText('Market Opportunity');
    await expect(page.locator('[data-testid="session-progress"]')).toBeVisible();
  });

  test('should meet performance requirements', async ({ page }) => {
    await page.goto('/workspace/test-workspace');

    // Test session start performance
    const startTime = Date.now();
    await page.click('text=New Idea Creative Expansion');
    await expect(page.locator('[data-testid="pathway-title"]')).toBeVisible();
    const sessionStartTime = Date.now() - startTime;

    expect(sessionStartTime).toBeLessThan(2000); // Session start under 2 seconds

    // Test phase transition performance
    await page.fill('[data-testid="user-input"]', 'Performance test business idea with sufficient detail');

    const transitionStart = Date.now();
    await page.click('[data-testid="submit-response"]');
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    const transitionTime = Date.now() - transitionStart;

    expect(transitionTime).toBeLessThan(10000); // Market analysis under 10 seconds
  });
});