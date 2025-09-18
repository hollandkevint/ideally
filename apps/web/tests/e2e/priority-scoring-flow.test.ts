import { test, expect } from '@playwright/test';

test.describe('Priority Scoring Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the priority scoring test page
    await page.goto('/test-priority-scoring');
  });

  test('should display priority scoring interface correctly', async ({ page }) => {
    // Check main heading
    await expect(page.locator('h2').filter({ hasText: 'Priority Scoring' })).toBeVisible();

    // Check description
    await expect(page.locator('text=Rate your feature on effort and impact')).toBeVisible();

    // Check sliders are present
    await expect(page.locator('text=Development Effort')).toBeVisible();
    await expect(page.locator('text=User & Business Impact')).toBeVisible();

    // Check progress indicator
    await expect(page.locator('text=Step 2 of 4 - Priority Scoring')).toBeVisible();
    await expect(page.locator('text=Time remaining: ~4 minutes')).toBeVisible();
  });

  test('should show initial priority calculation with default values', async ({ page }) => {
    // Initial values should be 5/5, resulting in priority score of 1
    await expect(page.locator('text=Priority Assessment Results')).toBeVisible();
    await expect(page.locator('text=1').first()).toBeVisible();
    await expect(page.locator('text=Medium')).toBeVisible();
    await expect(page.locator('text=Time Wasters')).toBeVisible();
  });

  test('should update priority calculation when sliders change', async ({ page }) => {
    // Get the effort slider (first slider)
    const effortSlider = page.locator('input[type="range"]').first();

    // Change effort to 2 (keeping impact at 5, so priority becomes 2.5)
    await effortSlider.fill('2');

    // Should see updated priority score
    await expect(page.locator('text=2.5')).toBeVisible();
    await expect(page.locator('text=Critical')).toBeVisible();
    await expect(page.locator('text=Fill-ins')).toBeVisible();
  });

  test('should display appropriate recommendations for each quadrant', async ({ page }) => {
    const effortSlider = page.locator('input[type="range"]').first();
    const impactSlider = page.locator('input[type="range"]').nth(1);

    // Test Quick Wins (High Impact, Low Effort)
    await impactSlider.fill('8');
    await effortSlider.fill('3');

    await expect(page.locator('text=Quick Wins')).toBeVisible();
    await expect(page.locator('text=High priority! This feature offers maximum value')).toBeVisible();

    // Test Major Projects (High Impact, High Effort)
    await impactSlider.fill('8');
    await effortSlider.fill('7');

    await expect(page.locator('text=Major Projects')).toBeVisible();
    await expect(page.locator('text=Strategic initiative. High impact but requires')).toBeVisible();

    // Test Fill-ins (Low Impact, Low Effort)
    await impactSlider.fill('4');
    await effortSlider.fill('3');

    await expect(page.locator('text=Fill-ins')).toBeVisible();
    await expect(page.locator('text=Nice-to-have improvement')).toBeVisible();

    // Test Time Wasters (Low Impact, High Effort)
    await impactSlider.fill('3');
    await effortSlider.fill('8');

    await expect(page.locator('text=Time Wasters')).toBeVisible();
    await expect(page.locator('text=Question this feature')).toBeVisible();
  });

  test('should display priority matrix with correct quadrants', async ({ page }) => {
    // Check that priority matrix is visible
    await expect(page.locator('text=Priority Matrix')).toBeVisible();
    await expect(page.locator('text=Visual representation of your feature\'s position')).toBeVisible();

    // Check all quadrant labels in matrix
    const quickWinsInMatrix = page.locator('.grid-cols-2').locator('text=Quick Wins');
    const majorProjectsInMatrix = page.locator('.grid-cols-2').locator('text=Major Projects');
    const fillInsInMatrix = page.locator('.grid-cols-2').locator('text=Fill-ins');
    const timeWastersInMatrix = page.locator('.grid-cols-2').locator('text=Time Wasters');

    await expect(quickWinsInMatrix).toBeVisible();
    await expect(majorProjectsInMatrix).toBeVisible();
    await expect(fillInsInMatrix).toBeVisible();
    await expect(timeWastersInMatrix).toBeVisible();

    // Check quadrant descriptions in matrix
    await expect(page.locator('text=High Impact, Low Effort')).toBeVisible();
    await expect(page.locator('text=High Impact, High Effort')).toBeVisible();
    await expect(page.locator('text=Low Impact, Low Effort')).toBeVisible();
    await expect(page.locator('text=Low Impact, High Effort')).toBeVisible();
  });

  test('should show feature position in matrix', async ({ page }) => {
    const effortSlider = page.locator('input[type="range"]').first();
    const impactSlider = page.locator('input[type="range"]').nth(1);

    // Set specific values
    await impactSlider.fill('8');
    await effortSlider.fill('3');

    // Check feature position summary
    await expect(page.locator('text=Your Feature Position')).toBeVisible();
    await expect(page.locator('text=Impact: 8/10 • Effort: 3/10')).toBeVisible();
  });

  test('should show guidance when requested', async ({ page }) => {
    // Click show guidance for effort scoring
    const effortGuidanceButton = page.locator('text=Show guidance').first();
    await effortGuidanceButton.click();

    // Should show effort guidance
    await expect(page.locator('text=Development Effort Assessment')).toBeVisible();
    await expect(page.locator('text=Rate the development complexity and time required')).toBeVisible();
    await expect(page.locator('text=Trivial')).toBeVisible();
    await expect(page.locator('text=Few hours of work')).toBeVisible();

    // Click hide guidance
    await page.locator('text=Hide guidance').first().click();

    // Guidance should be hidden
    await expect(page.locator('text=Development Effort Assessment')).not.toBeVisible();
  });

  test('should handle slider interactions correctly', async ({ page }) => {
    const effortSlider = page.locator('input[type="range"]').first();
    const impactSlider = page.locator('input[type="range"]').nth(1);

    // Test minimum values
    await effortSlider.fill('1');
    await impactSlider.fill('1');

    await expect(page.locator('text=1 - Very Low').first()).toBeVisible();
    await expect(page.locator('text=1.00')).toBeVisible(); // Priority score

    // Test maximum values
    await effortSlider.fill('10');
    await impactSlider.fill('10');

    await expect(page.locator('text=10 - Very High').first()).toBeVisible();
    await expect(page.locator('text=1.00')).toBeVisible(); // Priority score (10/10 = 1)

    // Test edge case for high priority
    await effortSlider.fill('1');
    await impactSlider.fill('10');

    await expect(page.locator('text=10.00')).toBeVisible(); // Priority score (10/1 = 10)
    await expect(page.locator('text=Critical')).toBeVisible();
  });

  test('should display correct color coding for priority categories', async ({ page }) => {
    const effortSlider = page.locator('input[type="range"]').first();
    const impactSlider = page.locator('input[type="range"]').nth(1);

    // Test Critical priority (red)
    await impactSlider.fill('10');
    await effortSlider.fill('2');

    const criticalBadge = page.locator('text=Critical').locator('xpath=..');
    await expect(criticalBadge).toHaveClass(/text-red-600/);

    // Test Quick Wins quadrant (green)
    const quickWinsBadge = page.locator('text=Quick Wins').filter({ hasNot: page.locator('.grid-cols-2') }).locator('xpath=..');
    await expect(quickWinsBadge).toHaveClass(/text-green-700/);
  });

  test('should maintain responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that components are still visible and functional
    await expect(page.locator('h2').filter({ hasText: 'Priority Scoring' })).toBeVisible();
    await expect(page.locator('text=Development Effort')).toBeVisible();
    await expect(page.locator('text=User & Business Impact')).toBeVisible();
    await expect(page.locator('text=Priority Matrix')).toBeVisible();

    // Test slider functionality on mobile
    const effortSlider = page.locator('input[type="range"]').first();
    await effortSlider.fill('3');

    // Should still update correctly
    await expect(page.locator('text=1.67')).toBeVisible();
  });

  test('should handle rapid slider changes without errors', async ({ page }) => {
    const effortSlider = page.locator('input[type="range"]').first();
    const impactSlider = page.locator('input[type="range"]').nth(1);

    // Rapidly change values
    for (let i = 1; i <= 10; i++) {
      await effortSlider.fill(i.toString());
      await impactSlider.fill((11 - i).toString());
    }

    // Should still show valid results
    await expect(page.locator('text=Priority Assessment Results')).toBeVisible();
    await expect(page.locator('text=Priority Matrix')).toBeVisible();

    // Final values should be effort=10, impact=1, priority=0.1
    await expect(page.locator('text=0.1')).toBeVisible();
    await expect(page.locator('text=Low')).toBeVisible();
  });

  test('should persist state during page interaction', async ({ page }) => {
    const effortSlider = page.locator('input[type="range"]').first();
    const impactSlider = page.locator('input[type="range"]').nth(1);

    // Set specific values
    await effortSlider.fill('4');
    await impactSlider.fill('7');

    // Interact with other elements (show/hide guidance)
    await page.locator('text=Show guidance').first().click();
    await page.locator('text=Hide guidance').first().click();

    // Slider values should be preserved
    await expect(effortSlider).toHaveValue('4');
    await expect(impactSlider).toHaveValue('7');
    await expect(page.locator('text=1.75')).toBeVisible(); // 7/4 = 1.75
  });
});