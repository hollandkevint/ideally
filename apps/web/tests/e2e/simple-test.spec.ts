import { test, expect } from '@playwright/test'

test.describe('Simple App Test', () => {
  test('should load homepage without errors', async ({ page }) => {
    // Go to homepage
    await page.goto('/')

    // Check that page loaded and has ThinkHaven branding
    await expect(page).toHaveTitle(/Thinkhaven/)

    // Check that main heading is visible
    await expect(page.locator('h1')).toContainText('Transform Strategic Analysis')

    console.log('✅ Homepage loaded successfully!')
  })

  test('should be able to navigate to login page', async ({ page }) => {
    // Go to homepage
    await page.goto('/')

    // Look for login-related button or link
    const loginButton = page.locator('button:has-text("Email & Password Login")')
    await expect(loginButton).toBeVisible()

    // Click login button
    await loginButton.click()

    // Check that we're on login page
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('h2')).toContainText('Sign in to your account')

    console.log('✅ Navigation to login page works!')
  })
})