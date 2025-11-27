import { Page, expect } from '@playwright/test'

/**
 * Helper class for credit-related E2E test operations
 */
export class CreditsHelper {
  constructor(private page: Page) {}

  /**
   * Get current credit balance via API
   */
  async getBalance(): Promise<number> {
    const response = await this.page.request.get('/api/credits/balance')

    if (response.status() === 401) {
      throw new Error('Not authenticated - cannot fetch credit balance')
    }

    const data = await response.json()
    return data.balance ?? 0
  }

  /**
   * Navigate to pricing page
   */
  async goToPricing(): Promise<void> {
    await this.page.goto('/pricing')
    await expect(this.page.locator('h1:has-text("Unlock Strategic Thinking")')).toBeVisible()
  }

  /**
   * Initiate purchase for a specific package
   * Returns the checkout URL without navigating to it
   */
  async initiatePurchase(packageType: 'starter' | 'professional' | 'business'): Promise<{
    checkoutUrl: string
    sessionId: string
    credits: number
  }> {
    const buttonText = {
      starter: 'Get 5 Credits',
      professional: 'Get 10 Credits',
      business: 'Get 20 Credits',
    }

    const button = this.page.locator(`button:has-text("${buttonText[packageType]}")`)
    await expect(button).toBeVisible()

    const [response] = await Promise.all([
      this.page.waitForResponse(resp => resp.url().includes('/api/credits/purchase')),
      button.click()
    ])

    if (response.status() !== 200) {
      const error = await response.json()
      throw new Error(`Purchase initiation failed: ${error.message}`)
    }

    const data = await response.json()
    return {
      checkoutUrl: data.checkoutUrl,
      sessionId: data.sessionId,
      credits: data.package.credits,
    }
  }

  /**
   * Check if credit indicator is visible in the page
   */
  async isCreditIndicatorVisible(): Promise<boolean> {
    const indicator = this.page.locator('[data-testid="credit-indicator"]')
    return await indicator.isVisible().catch(() => false)
  }

  /**
   * Get displayed credit count from UI (if credit indicator is present)
   */
  async getDisplayedCredits(): Promise<number | null> {
    const indicator = this.page.locator('[data-testid="credit-indicator"]')
    if (await indicator.isVisible().catch(() => false)) {
      const text = await indicator.textContent()
      const match = text?.match(/(\d+)/)
      return match ? parseInt(match[1], 10) : null
    }
    return null
  }

  /**
   * Wait for credit balance to update to expected value
   * Useful after webhook processing
   */
  async waitForBalance(expectedBalance: number, timeout = 10000): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const balance = await this.getBalance()
      if (balance === expectedBalance) {
        return
      }
      await this.page.waitForTimeout(1000)
    }

    throw new Error(`Credit balance did not reach ${expectedBalance} within ${timeout}ms`)
  }

  /**
   * Verify pricing page displays correct package prices
   */
  async verifyPackagePrices(): Promise<void> {
    await expect(this.page.locator('text=$10')).toBeVisible()
    await expect(this.page.locator('text=$30')).toBeVisible()
    await expect(this.page.locator('text=$100')).toBeVisible()
  }

  /**
   * Verify all three package tiers are displayed
   */
  async verifyAllTiersDisplayed(): Promise<void> {
    await expect(this.page.locator('text=Starter')).toBeVisible()
    await expect(this.page.locator('text=Professional')).toBeVisible()
    await expect(this.page.locator('text=Business')).toBeVisible()
  }

  /**
   * Check if user has sufficient credits
   */
  async hasCredits(required: number = 1): Promise<boolean> {
    const balance = await this.getBalance()
    return balance >= required
  }

  /**
   * Navigate to success page (for testing success page UI)
   */
  async goToSuccessPage(sessionId?: string): Promise<void> {
    const url = sessionId
      ? `/pricing/success?session_id=${sessionId}`
      : '/pricing/success'
    await this.page.goto(url)
  }

  /**
   * Verify success page elements are displayed
   */
  async verifySuccessPage(): Promise<void> {
    await expect(this.page.locator('text=Purchase Successful')).toBeVisible()
    await expect(this.page.locator('text=credits have been added')).toBeVisible()
    await expect(this.page.locator('button:has-text("Go to Dashboard")')).toBeVisible()
  }
}

/**
 * Package pricing configuration for tests
 */
export const TEST_PACKAGES = {
  starter: {
    name: 'Starter',
    credits: 5,
    price: 10,
    pricePerCredit: 2.00,
  },
  professional: {
    name: 'Professional',
    credits: 10,
    price: 30,
    pricePerCredit: 3.00,
  },
  business: {
    name: 'Business',
    credits: 20,
    price: 100,
    pricePerCredit: 5.00,
  },
} as const

export type PackageType = keyof typeof TEST_PACKAGES
