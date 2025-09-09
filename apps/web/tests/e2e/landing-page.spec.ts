import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Thinkhaven/i);
    
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should have working email capture form', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    // Wait for form submission with longer timeout
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});