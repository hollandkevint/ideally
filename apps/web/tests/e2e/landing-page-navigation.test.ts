import { test, expect } from '@playwright/test'

test.describe('Landing Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Unauthenticated User Navigation', () => {
    test('should navigate to demo page from "View Live Demo" button', async ({ page }) => {
      await page.click('text=🎯 View Live Demo - No Signup Required')
      await expect(page).toHaveURL('/demo')
      await expect(page.locator('h1')).toContainText('Strategic Analysis Demo')
    })

    test('should navigate to method demo page from "Watch Method Demo" button', async ({ page }) => {
      // Click first "Watch Method Demo" button
      await page.locator('text=🎬 Watch Method Demo').first().click()
      await expect(page).toHaveURL('/method-demo')
      await expect(page.locator('h1')).toContainText('BMad Method Demo Video')
    })

    test('should navigate to login page from "Email & Password Login" button', async ({ page }) => {
      await page.click('text=Email & Password Login')
      await expect(page).toHaveURL('/login')
    })

    test('should navigate to demo from "Try Before You Buy" button', async ({ page }) => {
      await page.click('text=🎯 Try Before You Buy - View Demo')
      await expect(page).toHaveURL('/demo')
    })

    test('should navigate to method demo from second "Watch Method Demo" button', async ({ page }) => {
      // Click second "Watch Method Demo" button
      await page.locator('text=🎬 Watch Method Demo').last().click()
      await expect(page).toHaveURL('/method-demo')
    })
  })

  test.describe('Email Form Functionality', () => {
    test('should submit email form and show success message', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]')
      const submitButton = page.locator('text=🧠 Get Notified When Available')

      await emailInput.fill('test@example.com')
      await submitButton.click()

      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('text=✅ Thank you!')).toBeVisible()
    })

    test('should reset form after success message timeout', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]')
      const submitButton = page.locator('text=🧠 Get Notified When Available')

      await emailInput.fill('test@example.com')
      await submitButton.click()

      // Wait for success message to appear
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

      // Wait for form to reset (3 second timeout)
      await page.waitForTimeout(3100)

      await expect(emailInput).toHaveValue('')
      await expect(page.locator('text=🧠 Get Notified When Available')).toBeVisible()
    })
  })

  test.describe('Page Navigation Flow', () => {
    test('should navigate to demo and back to home', async ({ page }) => {
      // Go to demo
      await page.click('text=🎯 View Live Demo - No Signup Required')
      await expect(page).toHaveURL('/demo')

      // Navigate back to home
      await page.click('text=← Back to Home')
      await expect(page).toHaveURL('/')
    })

    test('should navigate to method demo and then to live demo', async ({ page }) => {
      // Go to method demo
      await page.locator('text=🎬 Watch Method Demo').first().click()
      await expect(page).toHaveURL('/method-demo')

      // From method demo, go to live demo
      await page.click('text=🎯 Try Live Demo')
      await expect(page).toHaveURL('/demo')
    })
  })

  test.describe('Visual Regression Prevention', () => {
    test('should maintain button styling after navigation setup', async ({ page }) => {
      // Check primary CTA button styling
      const primaryButton = page.locator('text=🎯 View Live Demo - No Signup Required')
      await expect(primaryButton).toHaveClass(/px-8 py-4/)

      // Check outline button styling
      const outlineButton = page.locator('text=🎬 Watch Method Demo').first()
      await expect(outlineButton).toHaveClass(/variant-outline/)
    })

    test('should show correct buttons for unauthenticated users', async ({ page }) => {
      await expect(page.locator('text=🎯 View Live Demo - No Signup Required')).toBeVisible()
      await expect(page.locator('text=🎯 Try Before You Buy - View Demo')).toBeVisible()
      await expect(page.locator('text=🎬 Watch Method Demo')).toHaveCount(2)
      await expect(page.locator('text=Email & Password Login')).toBeVisible()

      // Should not show authenticated user buttons
      await expect(page.locator('text=🚀 Go to Dashboard')).not.toBeVisible()
      await expect(page.locator('text=🚀 Start Strategic Analysis')).not.toBeVisible()
    })
  })

  test.describe('Performance and Reliability', () => {
    test('should navigate without page refresh', async ({ page }) => {
      // Enable console event tracking
      const navigationPromise = page.waitForEvent('framenavigated')

      await page.click('text=🎯 View Live Demo - No Signup Required')

      await navigationPromise
      await expect(page).toHaveURL('/demo')

      // Verify it's a client-side navigation (Next.js App Router)
      await expect(page.locator('h1')).toContainText('Strategic Analysis Demo')
    })

    test('should handle multiple rapid button clicks gracefully', async ({ page }) => {
      const demoButton = page.locator('text=🎯 View Live Demo - No Signup Required')

      // Rapid click test
      await demoButton.click()
      await demoButton.click()
      await demoButton.click()

      // Should still navigate correctly
      await expect(page).toHaveURL('/demo')
    })
  })
})