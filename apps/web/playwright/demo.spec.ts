import { test, expect } from '@playwright/test'

test.describe('Demo Flow', () => {
  
  test('should navigate from landing page to demo hub', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to load
    await expect(page).toHaveTitle(/Strategic Thinking Workspace/)
    
    // Click the main demo CTA button
    await page.click('button:has-text("View Live Demo - No Signup Required")')
    
    // Should navigate to demo hub
    await expect(page).toHaveURL('/demo')
    await expect(page.locator('h1')).toContainText('Strategic Analysis Demo')
  })

  test('should display all 3 demo scenarios in hub', async ({ page }) => {
    await page.goto('/demo')
    
    // Check for all 3 scenario cards
    const scenarioCards = page.locator('[data-testid="scenario-card"], .cursor-pointer:has(h3)')
    await expect(scenarioCards).toHaveCount(3)
    
    // Check for specific scenario titles
    await expect(page.locator('text=AnalyticsPro - Market Entry Strategy')).toBeVisible()
    await expect(page.locator('text=Fintech Startup - Competitive Analysis')).toBeVisible()
    await expect(page.locator('text=New Business Model Exploration')).toBeVisible()
  })

  test('should navigate to individual scenario viewer', async ({ page }) => {
    await page.goto('/demo')
    
    // Click on first scenario
    await page.click('text=AnalyticsPro - Market Entry Strategy')
    
    // Should navigate to scenario/0 page
    await expect(page).toHaveURL('/demo/0')
    await expect(page.locator('h1')).toContainText('AnalyticsPro - Market Entry Strategy')
  })

  test('should display conversation messages in scenario viewer', async ({ page }) => {
    await page.goto('/demo/0')
    
    // Check that messages are displayed
    const messages = page.locator('[class*="bg-blue-50"], [class*="bg-green-50"]')
    await expect(messages).toHaveCount.toBeGreaterThan(0)
    
    // Check for user and assistant messages
    await expect(page.locator('text=You')).toBeVisible()
    await expect(page.locator('text=Mary (Strategic AI)')).toBeVisible()
  })

  test('should show strategic insights panel', async ({ page }) => {
    await page.goto('/demo/0')
    
    // Check for BMad Method tracker
    await expect(page.locator('text=BMad Method')).toBeVisible()
    await expect(page.locator('text=Structured Inquiry')).toBeVisible()
    await expect(page.locator('text=Evidence-Based')).toBeVisible()
    await expect(page.locator('text=Numbered Options')).toBeVisible()
  })

  test('should handle continue session functionality', async ({ page }) => {
    await page.goto('/demo/0')
    
    // Look for continue button if messages are limited
    const continueButton = page.locator('button:has-text("Continue Session")')
    const messageCount = await page.locator('[class*="bg-blue-50"], [class*="bg-green-50"]').count()
    
    if (await continueButton.isVisible()) {
      await continueButton.click()
      
      // Should show more messages
      const newMessageCount = await page.locator('[class*="bg-blue-50"], [class*="bg-green-50"]').count()
      expect(newMessageCount).toBeGreaterThan(messageCount)
    }
  })

  test('should navigate back to demo hub from scenario', async ({ page }) => {
    await page.goto('/demo/0')
    
    // Click back to demo hub
    await page.click('button:has-text("Demo Hub")')
    
    // Should navigate back to demo hub
    await expect(page).toHaveURL('/demo')
  })

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/demo')
    
    // Check that demo hub is mobile responsive
    await expect(page.locator('h1')).toBeVisible()
    
    // Navigate to a scenario
    await page.click('text=AnalyticsPro - Market Entry Strategy')
    await expect(page).toHaveURL('/demo/0')
    
    // Check that conversation is readable on mobile
    await expect(page.locator('text=You')).toBeVisible()
    await expect(page.locator('text=Mary (Strategic AI)')).toBeVisible()
  })

  test('should show conversion prompts at appropriate times', async ({ page }) => {
    await page.goto('/demo/0')
    
    // Continue through most of the conversation to trigger conversion
    let continueButton = page.locator('button:has-text("Continue Session")')
    
    // Keep clicking continue until we reach the end or conversion appears
    let attempts = 0
    while (await continueButton.isVisible() && attempts < 10) {
      await continueButton.click()
      await page.waitForTimeout(1000) // Wait for new messages to load
      attempts++
    }
    
    // Look for conversion modal or CTA
    const conversionModal = page.locator('text=Ready for Your Session?', 'text=Begin Strategic Session')
    const conversionCTA = page.locator('button:has-text("Start My Strategic Session")', 'button:has-text("Begin Strategic Session")')
    
    // At least one conversion element should be visible
    await expect(conversionModal.or(conversionCTA)).toBeVisible()
  })
})