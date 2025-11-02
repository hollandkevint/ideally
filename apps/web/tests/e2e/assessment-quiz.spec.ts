import { test, expect } from '@playwright/test';

test.describe('Assessment Quiz Flow', () => {
  test('should load assessment page', async ({ page }) => {
    await page.goto('/assessment');

    await expect(page.getByText(/Strategic Thinking Assessment/i)).toBeVisible();
    await expect(page.getByText(/Question 1 of 15/i)).toBeVisible();
  });

  test('should advance when answering questions', async ({ page }) => {
    await page.goto('/assessment');

    const firstOption = page.getByRole('button').filter({ hasText: /Always/i }).first();
    await firstOption.click();

    await page.waitForTimeout(500);
    await expect(page.getByText(/Question 2 of 15/i)).toBeVisible();
  });

  test('should complete quiz and show email capture', async ({ page }) => {
    await page.goto('/assessment');

    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(300);
      const options = page.getByRole('button').filter({ has: page.locator('span.font-medium') });
      await options.nth(2).click();
    }

    await expect(page.getByText(/Assessment Complete/i)).toBeVisible();
    await expect(page.getByPlaceholder(/your@email.com/i)).toBeVisible();
  });
});
