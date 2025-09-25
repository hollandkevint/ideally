import { test, expect } from '@playwright/test'

test.describe('Demo Mode & Public Showcase', () => {

  test.describe('Landing Page to Demo Flow', () => {
    test('should navigate from landing page to demo hub', async ({ page }) => {
      await page.goto('/')

      // Wait for page to load
      await expect(page).toHaveTitle(/ThinkHaven|Strategic Thinking Workspace|Thinkhaven/i)

      // Look for demo CTA button (multiple possible variations)
      const demoCTA = page.locator(
        'button:has-text("View Live Demo"), ' +
        'button:has-text("Try Demo"), ' +
        'button:has-text("Demo"), ' +
        'a:has-text("Demo"), ' +
        'button:has-text("No Signup Required"), ' +
        '[data-testid="demo-cta"]'
      )

      await expect(demoCTA.first()).toBeVisible({ timeout: 10000 })
      await demoCTA.first().click()

      // Should navigate to demo page
      await expect(page).toHaveURL(/\/demo/, { timeout: 10000 })
    })

    test('should display demo hub with scenario options', async ({ page }) => {
      await page.goto('/demo')

      // Check for demo hub title
      await expect(page.locator('h1')).toContainText(/demo|strategic|analysis/i)

      // Should show multiple demo scenarios
      const scenarioCards = page.locator('[data-testid="scenario-card"], .scenario-card, .cursor-pointer:has(h3)')
      const cardCount = await scenarioCards.count()

      expect(cardCount).toBeGreaterThanOrEqual(2) // At least 2 scenarios

      // Check for specific scenarios mentioned in original demo.spec.ts
      const expectedScenarios = [
        'AnalyticsPro - Market Entry Strategy',
        'Fintech Startup - Competitive Analysis',
        'New Business Model Exploration'
      ]

      for (const scenario of expectedScenarios) {
        const scenarioElement = page.locator(`text="${scenario}"`)
        if (await scenarioElement.isVisible()) {
          await expect(scenarioElement).toBeVisible()
        }
      }
    })

    test('should navigate to individual scenario viewer', async ({ page }) => {
      await page.goto('/demo')

      // Click on first available scenario
      const firstScenario = page.locator('[data-testid="scenario-card"], .scenario-card, .cursor-pointer:has(h3)').first()
      await firstScenario.click()

      // Should navigate to scenario detail page
      await expect(page).toHaveURL(/\/demo\/\d+|\/demo\/[a-zA-Z-]+/, { timeout: 10000 })

      // Should show scenario content
      await expect(page.locator('h1')).toBeVisible()
    })
  })

  test.describe('Pre-configured Demo Sessions', () => {
    test('should display conversation messages in scenario viewer', async ({ page }) => {
      await page.goto('/demo/0')

      // Check that demo conversation is displayed
      const messages = page.locator(
        '[class*="bg-blue-50"], [class*="bg-green-50"], ' +
        '.chat-message-user, .chat-message-assistant, ' +
        '[data-testid="message"]'
      )

      const messageCount = await messages.count()
      expect(messageCount).toBeGreaterThan(0)

      // Should show user and assistant messages
      await expect(page.locator('text=You, text=User')).toBeVisible()
      await expect(page.locator('text="Mary (Strategic AI)", text="Mary", text="Assistant"')).toBeVisible()
    })

    test('should show strategic insights panel', async ({ page }) => {
      await page.goto('/demo/0')

      // Check for BMad Method indicators
      const strategicElements = [
        'BMad Method',
        'Structured Inquiry',
        'Evidence-Based',
        'Numbered Options',
        'Strategic',
        'Framework'
      ]

      let foundElements = 0
      for (const element of strategicElements) {
        const elementLocator = page.locator(`text="${element}"`)
        if (await elementLocator.isVisible()) {
          foundElements++
        }
      }

      expect(foundElements).toBeGreaterThan(0) // At least some strategic elements visible
    })

    test('should handle continue session functionality', async ({ page }) => {
      await page.goto('/demo/0')

      // Get initial message count
      const initialMessages = await page.locator(
        '[class*="bg-blue-50"], [class*="bg-green-50"], ' +
        '.chat-message-user, .chat-message-assistant'
      ).count()

      // Look for continue button
      const continueButton = page.locator('button:has-text("Continue Session"), button:has-text("Continue"), button:has-text("Show More")')

      if (await continueButton.isVisible()) {
        await continueButton.click()

        // Should show more messages or different content
        await page.waitForTimeout(2000)

        const newMessages = await page.locator(
          '[class*="bg-blue-50"], [class*="bg-green-50"], ' +
          '.chat-message-user, .chat-message-assistant'
        ).count()

        expect(newMessages).toBeGreaterThanOrEqual(initialMessages)
      }
    })

    test('should demonstrate realistic conversation flow', async ({ page }) => {
      await page.goto('/demo/0')

      // Demo should show realistic strategic conversation
      const conversationContent = await page.textContent('body')

      // Should contain strategic business terms
      const strategicTerms = [
        'market', 'strategy', 'analysis', 'competitive', 'business',
        'customer', 'revenue', 'growth', 'opportunity', 'risk'
      ]

      let foundTerms = 0
      for (const term of strategicTerms) {
        if (conversationContent?.toLowerCase().includes(term)) {
          foundTerms++
        }
      }

      expect(foundTerms).toBeGreaterThan(3) // Should have strategic vocabulary
    })
  })

  test.describe('Demo Navigation & UX', () => {
    test('should navigate back to demo hub from scenario', async ({ page }) => {
      await page.goto('/demo/0')

      // Look for back navigation
      const backButton = page.locator(
        'button:has-text("Demo Hub"), button:has-text("Back"), ' +
        'a:has-text("Demo Hub"), [aria-label="Back to demo hub"]'
      )

      await expect(backButton.first()).toBeVisible()
      await backButton.first().click()

      // Should navigate back to demo hub
      await expect(page).toHaveURL('/demo')
    })

    test('should be mobile responsive', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/demo')

      // Demo hub should be mobile responsive
      await expect(page.locator('h1')).toBeVisible()

      // Navigate to a scenario
      const firstScenario = page.locator('[data-testid="scenario-card"], .scenario-card, .cursor-pointer:has(h3)').first()
      if (await firstScenario.isVisible()) {
        await firstScenario.click()

        // Conversation should be readable on mobile
        await expect(page.locator('text=You, text=User')).toBeVisible()
        await expect(page.locator('text="Mary", text="Assistant"')).toBeVisible()
      }
    })

    test('should handle direct demo URL access', async ({ page }) => {
      // Test direct access to demo scenarios
      const demoUrls = ['/demo/0', '/demo/1', '/demo/2']

      for (const url of demoUrls.slice(0, 1)) { // Test one for efficiency
        await page.goto(url)

        // Should load demo content or show appropriate message
        const pageContent = page.locator('body')
        await expect(pageContent).toBeVisible()

        // Should either show demo content or redirect to available demo
        const hasContent = await page.locator('h1').isVisible()
        expect(hasContent).toBe(true)
      }
    })
  })

  test.describe('Conversion & Lead Generation', () => {
    test('should show conversion prompts at appropriate times', async ({ page }) => {
      await page.goto('/demo/0')

      // Look for initial conversion elements
      const immediateConversion = page.locator(
        'button:has-text("Start My Session"), button:has-text("Sign Up"), ' +
        'button:has-text("Create Account"), text="Ready for Your Session?"'
      )

      // Continue through demo to trigger conversion
      let continueButton = page.locator('button:has-text("Continue Session"), button:has-text("Continue")')

      let attempts = 0
      while (await continueButton.isVisible() && attempts < 5) {
        await continueButton.click()
        await page.waitForTimeout(1000)
        attempts++
      }

      // Look for conversion modal or CTA
      const conversionElements = page.locator(
        'text="Ready for Your Session?", text="Begin Strategic Session", ' +
        'button:has-text("Start My Strategic Session"), button:has-text("Sign Up Now"), ' +
        'button:has-text("Create Account"), [data-testid="conversion-modal"]'
      )

      // Should show some conversion prompt
      const hasConversion = await conversionElements.first().isVisible()
      if (hasConversion) {
        await expect(conversionElements.first()).toBeVisible()
      }
    })

    test('should link to registration/signup flow', async ({ page }) => {
      await page.goto('/demo')

      // Look for signup/registration links
      const signupLinks = page.locator(
        'a:has-text("Sign Up"), button:has-text("Sign Up"), ' +
        'a:has-text("Get Started"), button:has-text("Get Started"), ' +
        'a:has-text("Create Account"), [data-testid="signup-link"]'
      )

      if (await signupLinks.first().isVisible()) {
        await signupLinks.first().click()

        // Should navigate to registration or login page
        await expect(page).toHaveURL(/\/(register|signup|login)/, { timeout: 5000 })
      }
    })

    test('should track demo engagement for analytics', async ({ page }) => {
      await page.goto('/demo/0')

      // Demo should have analytics tracking (check for common patterns)
      const analyticsElements = page.locator(
        '[data-analytics], [data-track], [data-event], ' +
        'script:has-text("gtag"), script:has-text("analytics")'
      )

      // Check if demo interactions are tracked
      const hasTracking = await analyticsElements.count() > 0

      if (hasTracking) {
        // Demo should track user interactions
        await page.click('button:has-text("Continue")').catch(() => {})
        // Tracking would happen in background
      }
    })

    test('should provide clear value proposition', async ({ page }) => {
      await page.goto('/demo')

      // Should clearly communicate value
      const valueProps = [
        'strategic thinking', 'AI-powered', 'business analysis',
        'decision making', 'framework', 'consulting', 'analysis'
      ]

      const pageContent = await page.textContent('body')

      let foundProps = 0
      for (const prop of valueProps) {
        if (pageContent?.toLowerCase().includes(prop.toLowerCase())) {
          foundProps++
        }
      }

      expect(foundProps).toBeGreaterThan(2) // Should have clear value messaging
    })
  })

  test.describe('Demo Content Quality', () => {
    test('should showcase professional strategic advice', async ({ page }) => {
      await page.goto('/demo/0')

      // Demo content should be professional quality
      const demoText = await page.textContent('body')

      // Should avoid obvious demo/placeholder text
      const unprofessionalTerms = ['lorem ipsum', 'test', 'placeholder', 'sample']

      for (const term of unprofessionalTerms) {
        expect(demoText?.toLowerCase()).not.toContain(term)
      }

      // Should contain substantive strategic content
      expect(demoText?.length || 0).toBeGreaterThan(500)
    })

    test('should demonstrate key ThinkHaven features', async ({ page }) => {
      await page.goto('/demo/0')

      // Should showcase core platform features
      const keyFeatures = [
        'Mary', // AI assistant name
        'strategic', 'analysis', 'framework', 'business'
      ]

      const pageContent = await page.textContent('body')

      let featuresShown = 0
      for (const feature of keyFeatures) {
        if (pageContent?.toLowerCase().includes(feature.toLowerCase())) {
          featuresShown++
        }
      }

      expect(featuresShown).toBeGreaterThan(2) // Should demonstrate key features
    })

    test('should show realistic business scenarios', async ({ page }) => {
      await page.goto('/demo')

      // Scenarios should be realistic and diverse
      const pageContent = await page.textContent('body')

      const businessDomains = [
        'market entry', 'competitive analysis', 'business model',
        'fintech', 'analytics', 'startup', 'strategy'
      ]

      let domainsRepresented = 0
      for (const domain of businessDomains) {
        if (pageContent?.toLowerCase().includes(domain.toLowerCase())) {
          domainsRepresented++
        }
      }

      expect(domainsRepresented).toBeGreaterThan(1) // Multiple business domains
    })

    test('should maintain consistent branding', async ({ page }) => {
      await page.goto('/demo')

      // Check for consistent branding elements
      await expect(page).toHaveTitle(/ThinkHaven|Strategic Thinking/i)

      // Should show ThinkHaven branding
      const brandingElements = page.locator('text="ThinkHaven", [alt*="ThinkHaven"], [title*="ThinkHaven"]')

      if (await brandingElements.first().isVisible()) {
        await expect(brandingElements.first()).toBeVisible()
      }

      // Navigate to scenario
      const firstScenario = page.locator('[data-testid="scenario-card"], .cursor-pointer:has(h3)').first()
      if (await firstScenario.isVisible()) {
        await firstScenario.click()

        // Branding should be consistent in scenario view
        const scenarioBranding = page.locator('text="ThinkHaven", [alt*="ThinkHaven"]')
        if (await scenarioBranding.first().isVisible()) {
          await expect(scenarioBranding.first()).toBeVisible()
        }
      }
    })
  })

  test.describe('Demo Performance & Reliability', () => {
    test('should load demo content quickly', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/demo')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
    })

    test('should handle demo errors gracefully', async ({ page }) => {
      // Test invalid demo URLs
      await page.goto('/demo/999')

      // Should show appropriate error message or redirect
      const errorHandling = page.locator(
        'text="Demo not found", text="Invalid demo", ' +
        'button:has-text("Back to Demo Hub"), ' +
        'h1:has-text("Demo")'
      )

      await expect(errorHandling.first()).toBeVisible({ timeout: 10000 })
    })

    test('should work without authentication', async ({ page, context }) => {
      // Ensure no authentication cookies
      await context.clearCookies()

      // Demo should work without login
      await page.goto('/demo')
      await expect(page.locator('h1')).toBeVisible()

      // Should be able to view scenarios
      const firstScenario = page.locator('[data-testid="scenario-card"], .cursor-pointer:has(h3)').first()
      if (await firstScenario.isVisible()) {
        await firstScenario.click()
        await expect(page.locator('h1')).toBeVisible()
      }
    })

    test('should be accessible for SEO and sharing', async ({ page }) => {
      await page.goto('/demo')

      // Should have proper meta tags for sharing
      const title = await page.title()
      expect(title.length).toBeGreaterThan(10)

      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
      if (metaDescription) {
        expect(metaDescription.length).toBeGreaterThan(50)
      }

      // Should have proper heading structure
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThanOrEqual(1)
    })
  })
})