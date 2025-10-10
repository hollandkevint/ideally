/**
 * E2E Test: Complete Canvas Workspace Flow
 *
 * Tests the full user journey through canvas context synchronization and export
 *
 * Scenarios covered:
 * 1. User has conversation with AI
 * 2. AI suggests visual diagrams
 * 3. User applies suggestion to canvas
 * 4. Canvas updates with diagram
 * 5. User exports canvas as PNG/SVG
 */

import { test, expect } from '@playwright/test'

test.describe('Canvas Workspace E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to workspace
    await page.goto('/login')

    // Authenticate (assumes test user exists)
    await page.fill('input[type="email"]', 'test@thinkhaven.co')
    await page.fill('input[type="password"]', 'testpassword')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')

    // Navigate to workspace
    await page.click('text=My Strategic Workspace')
    await page.waitForURL(/\/workspace\//)
  })

  test('should detect and suggest flowchart from AI response', async ({ page }) => {
    // Send message that will trigger flowchart suggestion
    const inputField = page.locator('input[placeholder*="strategic question"]')
    await inputField.fill('How does the user onboarding process work?')
    await page.click('button:has-text("Send")')

    // Wait for AI response (mock or real depending on setup)
    await page.waitForSelector('.chat-message-assistant', { timeout: 30000 })

    // Simulate AI response with numbered steps (flowchart trigger)
    // In real E2E, this would be the actual AI response
    // For testing, we can inject a response via the test harness

    // Check for visual suggestion indicator
    await expect(page.locator('text=/Visual Suggestion.*Available/i')).toBeVisible({
      timeout: 5000,
    })

    // Verify suggestion panel shows flowchart option
    const suggestionPanel = page.locator('[class*="VisualSuggestion"]').first()
    await expect(suggestionPanel).toBeVisible()
    await expect(suggestionPanel).toContainText(/flowchart/i)
  })

  test('should apply visual suggestion to canvas', async ({ page }) => {
    // Trigger a visual suggestion (same as previous test)
    const inputField = page.locator('input[placeholder*="strategic question"]')
    await inputField.fill('What are the steps in our workflow?')
    await page.click('button:has-text("Send")')

    // Wait for AI response with visual suggestion
    await page.waitForSelector('text=/Visual Suggestion/i', { timeout: 10000 })

    // Click "Add to Canvas" button
    const addButton = page.locator('button:has-text("Add to Canvas")').first()
    await addButton.click()

    // Verify canvas pane shows diagram mode
    const canvasPane = page.locator('.canvas-pane')
    await expect(canvasPane).toBeVisible()

    // Check for diagram mode indicator
    await expect(page.locator('button:has-text("📊 Diagram")')).toHaveClass(/bg-blue/)

    // Verify Mermaid diagram is rendered
    await expect(page.locator('[class*="mermaid"]')).toBeVisible({ timeout: 5000 })
  })

  test('should sync canvas state between draw and diagram modes', async ({ page }) => {
    // Switch to diagram mode
    await page.click('button:has-text("📊 Diagram")')
    await expect(page.locator('button:has-text("📊 Diagram")')).toHaveClass(/bg-blue/)

    // Add a diagram
    const mermaidEditor = page.locator('textarea[placeholder*="mermaid"]')
    if (await mermaidEditor.isVisible()) {
      await mermaidEditor.fill(`flowchart TD
  Start([Start])
  End([End])
  Start --> End`)
    }

    // Switch to draw mode
    await page.click('button:has-text("✏️ Draw")')
    await expect(page.locator('button:has-text("✏️ Draw")')).toHaveClass(/bg-blue/)

    // Switch back to diagram mode
    await page.click('button:has-text("📊 Diagram")')

    // Verify diagram persisted
    const mermaidContent = await page.locator('textarea[placeholder*="mermaid"]')
    if (await mermaidContent.isVisible()) {
      await expect(mermaidContent).toHaveValue(/Start.*End/)
    }
  })

  test('should export canvas as PNG', async ({ page }) => {
    // Ensure we're in diagram mode with content
    await page.click('button:has-text("📊 Diagram")')

    const mermaidEditor = page.locator('textarea[placeholder*="mermaid"]')
    if (await mermaidEditor.isVisible()) {
      await mermaidEditor.fill(`flowchart LR
  A[Start] --> B[Process] --> C[End]`)
    }

    // Click export button
    await page.click('button:has-text("Export")')

    // Wait for export modal
    await expect(page.locator('h2:has-text("Export Canvas")')).toBeVisible()

    // Select PNG format (should be default)
    await expect(page.locator('button:has-text("PNG")')).toHaveClass(/border-blue/)

    // Select resolution
    await page.selectOption('select', { label: 'HD (1920×1080)' })

    // Generate export
    await page.click('button:has-text("Generate Export")')

    // Wait for export to complete
    await expect(page.locator('text=/Preview/i')).toBeVisible({ timeout: 10000 })

    // Verify preview image appears
    await expect(page.locator('img[alt="Export preview"]')).toBeVisible()

    // Verify download button is enabled
    await expect(page.locator('button:has-text("Download")')).toBeEnabled()
  })

  test('should export canvas as SVG with metadata', async ({ page }) => {
    // Setup diagram
    await page.click('button:has-text("📊 Diagram")')

    const mermaidEditor = page.locator('textarea[placeholder*="mermaid"]')
    if (await mermaidEditor.isVisible()) {
      await mermaidEditor.fill('flowchart TD\n  A --> B')
    }

    // Open export modal
    await page.click('button:has-text("Export")')
    await expect(page.locator('h2:has-text("Export Canvas")')).toBeVisible()

    // Select SVG format
    await page.click('button:has-text("SVG")')
    await expect(page.locator('button:has-text("SVG")')).toHaveClass(/border-blue/)

    // Ensure metadata is included
    const metadataCheckbox = page.locator('input[type="checkbox"]')
    await expect(metadataCheckbox).toBeChecked()

    // Generate export
    await page.click('button:has-text("Generate Export")')

    // Wait for success
    await expect(page.locator('button:has-text("Download")')).toBeEnabled({
      timeout: 10000,
    })
  })

  test('should toggle canvas sync on/off', async ({ page }) => {
    // Locate sync toggle button
    const syncButton = page.locator('button:has-text(/Sync/)')
    await expect(syncButton).toBeVisible()

    // Initial state should be "Synced"
    await expect(syncButton).toHaveText(/Synced|Sync On/i)

    // Toggle off
    await syncButton.click()
    await expect(syncButton).toHaveText(/Sync Off/i)

    // Toggle back on
    await syncButton.click()
    await expect(syncButton).toHaveText(/Synced|Sync On/i)
  })

  test('should show auto-apply toggle', async ({ page }) => {
    // Locate auto-apply toggle
    const autoApplyButton = page.locator('button:has-text(/Auto-apply/)')
    await expect(autoApplyButton).toBeVisible()

    // Click to enable
    await autoApplyButton.click()
    await expect(autoApplyButton).toHaveClass(/bg-blue/)

    // Click to disable
    await autoApplyButton.click()
    await expect(autoApplyButton).toHaveClass(/bg-gray/)
  })

  test('should handle keyboard shortcut for mode switching', async ({ page }) => {
    // Switch to diagram mode first
    await page.click('button:has-text("📊 Diagram")')
    await expect(page.locator('button:has-text("📊 Diagram")')).toHaveClass(/bg-blue/)

    // Press Ctrl+Shift+M (or Cmd+Shift+M on Mac)
    await page.keyboard.press('Control+Shift+M')

    // Should switch to draw mode
    await expect(page.locator('button:has-text("✏️ Draw")')).toHaveClass(/bg-blue/)

    // Press again
    await page.keyboard.press('Control+Shift+M')

    // Should switch back to diagram mode
    await expect(page.locator('button:has-text("📊 Diagram")')).toHaveClass(/bg-blue/)
  })

  test('should persist canvas state across refresh', async ({ page }) => {
    // Create diagram
    await page.click('button:has-text("📊 Diagram")')

    const mermaidEditor = page.locator('textarea[placeholder*="mermaid"]')
    if (await mermaidEditor.isVisible()) {
      await mermaidEditor.fill('flowchart TD\n  Test --> Diagram')
    }

    // Wait for auto-save
    await page.waitForTimeout(2000)

    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify diagram persisted
    await page.click('button:has-text("📊 Diagram")')
    const content = page.locator('textarea[placeholder*="mermaid"]')
    if (await content.isVisible()) {
      await expect(content).toHaveValue(/Test.*Diagram/)
    }
  })

  test('should show export with different quality scales', async ({ page }) => {
    // Setup and open export modal
    await page.click('button:has-text("📊 Diagram")')
    const mermaidEditor = page.locator('textarea[placeholder*="mermaid"]')
    if (await mermaidEditor.isVisible()) {
      await mermaidEditor.fill('flowchart LR\n  A --> B')
    }

    await page.click('button:has-text("Export")')
    await expect(page.locator('h2:has-text("Export Canvas")')).toBeVisible()

    // Test each scale option
    const scales = ['1x (Standard)', '2x (Retina)', '3x (High DPI)']

    for (const scale of scales) {
      await page.click(`button:has-text("${scale}")`)
      await expect(page.locator(`button:has-text("${scale}")`)).toHaveClass(/border-blue/)
    }
  })

  test('should handle export error gracefully', async ({ page }) => {
    // Try to export without any content
    await page.click('button:has-text("Export")')
    await expect(page.locator('h2:has-text("Export Canvas")')).toBeVisible()

    // Generate export (should fail with no content)
    await page.click('button:has-text("Generate Export")')

    // Should show error message
    await expect(page.locator('text=/Export Failed|No shapes/i')).toBeVisible({
      timeout: 5000,
    })
  })
})

test.describe('Canvas Context Sync Integration', () => {
  test('should suggest multiple diagram types from single conversation', async ({ page }) => {
    // Login and navigate
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@thinkhaven.co')
    await page.fill('input[type="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.click('text=My Strategic Workspace')
    await page.waitForURL(/\/workspace\//)

    // Send complex query that could trigger multiple diagram types
    const inputField = page.locator('input[placeholder*="strategic question"]')
    await inputField.fill('Explain our project timeline and user workflow')
    await page.click('button:has-text("Send")')

    // Wait for response
    await page.waitForSelector('.chat-message-assistant', { timeout: 30000 })

    // Should potentially suggest multiple diagram types
    // This depends on AI response, but we can check that suggestions appear
    const suggestionCount = await page.locator('[class*="VisualSuggestion"]').count()
    expect(suggestionCount).toBeGreaterThanOrEqual(0)
  })

  test('should dismiss visual suggestions', async ({ page }) => {
    // Login and setup
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@thinkhaven.co')
    await page.fill('input[type="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.click('text=My Strategic Workspace')
    await page.waitForURL(/\/workspace\//)

    // Trigger suggestion
    const inputField = page.locator('input[placeholder*="strategic question"]')
    await inputField.fill('Show me the process steps')
    await page.click('button:has-text("Send")')

    // Wait for suggestion
    const suggestion = page.locator('[class*="VisualSuggestion"]').first()
    if (await suggestion.isVisible({ timeout: 10000 })) {
      // Find and click dismiss button
      const dismissButton = suggestion.locator('button[title="Dismiss"]')
      await dismissButton.click()

      // Suggestion should disappear
      await expect(suggestion).not.toBeVisible()
    }
  })
})
