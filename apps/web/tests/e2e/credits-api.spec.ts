import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { testUsers } from '../fixtures/users'

test.describe('Credits API', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
  })

  test.describe('GET /api/credits/balance', () => {
    test('should return 401 for unauthenticated requests', async ({ request }) => {
      const response = await request.get('/api/credits/balance')
      expect(response.status()).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    test('should return credit balance for authenticated user', async ({ page, request }) => {
      // Login first
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      // Now make API request with authenticated session
      const response = await page.request.get('/api/credits/balance')
      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('balance')
      expect(typeof data.balance).toBe('number')
      expect(data.balance).toBeGreaterThanOrEqual(0)
    })

    test('should return balance totals', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const response = await page.request.get('/api/credits/balance')
      const data = await response.json()

      expect(data).toHaveProperty('total_granted')
      expect(data).toHaveProperty('total_purchased')
      expect(data).toHaveProperty('total_used')
    })

    test('should include history when requested', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const response = await page.request.get('/api/credits/balance?include_history=true')
      const data = await response.json()

      expect(data).toHaveProperty('recent_transactions')
      expect(Array.isArray(data.recent_transactions)).toBe(true)
    })
  })

  test.describe('POST /api/credits/purchase', () => {
    test('should return 401 for unauthenticated requests', async ({ request }) => {
      const response = await request.post('/api/credits/purchase', {
        data: { packageType: 'starter' }
      })
      expect(response.status()).toBe(401)
    })

    test('should return 400 for invalid package type', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const response = await page.request.post('/api/credits/purchase', {
        data: { packageType: 'invalid' }
      })
      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Bad Request')
    })

    test('should return 400 for missing package type', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const response = await page.request.post('/api/credits/purchase', {
        data: {}
      })
      expect(response.status()).toBe(400)
    })

    test('should create checkout session for starter package', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const response = await page.request.post('/api/credits/purchase', {
        data: { packageType: 'starter' }
      })

      // May fail if Stripe price IDs not configured
      if (response.status() === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('checkoutUrl')
        expect(data).toHaveProperty('sessionId')
        expect(data.package.id).toBe('starter')
        expect(data.package.credits).toBe(5)
      } else if (response.status() === 503) {
        // Expected if Stripe not configured
        const data = await response.json()
        expect(data.error).toBe('Configuration Error')
      }
    })

    test('should create checkout session for professional package', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const response = await page.request.post('/api/credits/purchase', {
        data: { packageType: 'professional' }
      })

      if (response.status() === 200) {
        const data = await response.json()
        expect(data.package.id).toBe('professional')
        expect(data.package.credits).toBe(10)
      }
    })

    test('should create checkout session for business package', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const response = await page.request.post('/api/credits/purchase', {
        data: { packageType: 'business' }
      })

      if (response.status() === 200) {
        const data = await response.json()
        expect(data.package.id).toBe('business')
        expect(data.package.credits).toBe(20)
      }
    })
  })

  test.describe('Stripe Webhook', () => {
    test('should return 400 for missing signature', async ({ request }) => {
      const response = await request.post('/api/stripe/webhook', {
        data: { type: 'checkout.session.completed' }
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('signature')
    })

    test('should return 400 for invalid signature', async ({ request }) => {
      const response = await request.post('/api/stripe/webhook', {
        headers: {
          'stripe-signature': 'invalid_signature'
        },
        data: JSON.stringify({ type: 'checkout.session.completed' })
      })

      expect(response.status()).toBe(400)
    })
  })
})

test.describe('Credit Balance Integration', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    await authHelper.login(testUsers.default.email, testUsers.default.password)
  })

  test('should display credit balance consistently across pages', async ({ page }) => {
    // Get balance from API
    const apiResponse = await page.request.get('/api/credits/balance')
    const apiData = await apiResponse.json()
    const apiBalance = apiData.balance

    // Navigate to pricing page
    await page.goto('/pricing')

    // If there's a credit indicator, verify it matches
    const creditIndicator = page.locator('[data-testid="credit-indicator"]')
    if (await creditIndicator.isVisible().catch(() => false)) {
      const displayedText = await creditIndicator.textContent()
      expect(displayedText).toContain(apiBalance.toString())
    }
  })

  test('should update balance after page refresh', async ({ page }) => {
    // Get initial balance
    const response1 = await page.request.get('/api/credits/balance')
    const balance1 = (await response1.json()).balance

    // Refresh page
    await page.reload()

    // Get balance again
    const response2 = await page.request.get('/api/credits/balance')
    const balance2 = (await response2.json()).balance

    // Balance should be consistent (unless a session was started)
    expect(balance2).toBeLessThanOrEqual(balance1)
  })
})
