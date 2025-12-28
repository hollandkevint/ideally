import { test, expect } from '@playwright/test'
import { ROUTES } from '../helpers/routes'

test.describe('Simple App Test', () => {
  test('should load homepage without errors', async ({ page }) => {
    await page.goto(ROUTES.landing)

    // Check that page loaded and has ThinkHaven branding
    await expect(page).toHaveTitle(/Thinkhaven/i)

    // Check that main heading is visible (current landing page has idea validation pitch)
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
  })

  test('should be able to navigate to login page', async ({ page }) => {
    await page.goto(ROUTES.landing)

    // Look for login-related button or link
    const loginButton = page.locator('button:has-text("Email & Password Login"), a[href="/login"]')
    await expect(loginButton.first()).toBeVisible()

    // Click login button
    await loginButton.first().click()

    // Check that we're on login page
    await expect(page).toHaveURL(/\/login/)
  })
})