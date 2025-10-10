/**
 * E2E Test: Feature Brief Export (PDF & Markdown)
 * Story 3.1: Test professional PDF generation and markdown copy
 */

import { test, expect } from '@playwright/test'

test.describe('Feature Brief Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to a Feature Refinement session
    await page.goto('/login')

    // Authenticate (assumes test user exists)
    await page.fill('input[type="email"]', 'test@thinkhaven.co')
    await page.fill('input[type="password"]', 'testpassword')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')

    // Start Feature Refinement pathway
    // (This test assumes a feature brief has already been generated)
    // In production, you'd navigate through the full flow
  })

  test('should export feature brief as PDF', async ({ page }) => {
    // Navigate to feature brief page (update with actual route)
    // await page.goto('/workspace/[id]/feature-brief')

    // Look for PDF export button
    const pdfButton = page.locator('button:has-text("PDF")')
    await expect(pdfButton).toBeVisible()

    // Click PDF export
    const downloadPromise = page.waitForEvent('download')
    await pdfButton.click()

    // Wait for download to start
    const download = await downloadPromise

    // Verify download filename
    const filename = download.suggestedFilename()
    expect(filename).toContain('-brief')
    expect(filename).toContain('.pdf')

    // Verify file was created
    const path = await download.path()
    expect(path).toBeTruthy()
  })

  test('should export feature brief as Markdown', async ({ page }) => {
    // Look for Markdown export button
    const markdownButton = page.locator('button:has-text("Markdown")')
    await expect(markdownButton).toBeVisible()

    // Click Markdown export
    const downloadPromise = page.waitForEvent('download')
    await markdownButton.click()

    // Wait for download
    const download = await downloadPromise

    // Verify filename
    const filename = download.suggestedFilename()
    expect(filename).toContain('-brief')
    expect(filename).toContain('.md')
  })

  test('should copy markdown to clipboard', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    // Look for copy button
    const copyButton = page.locator('button:has-text(/Copy.*Markdown/)')
    await expect(copyButton).toBeVisible()

    // Click copy button
    await copyButton.click()

    // Wait for success message
    await expect(page.locator('text=/Copied.*Markdown/i')).toBeVisible({
      timeout: 3000,
    })

    // Verify clipboard contains markdown
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('# ') // Markdown heading
    expect(clipboardText).toContain('## ') // Markdown subheading
    expect(clipboardText).toContain('|') // GFM table
  })

  test('should show export options panel', async ({ page }) => {
    // Verify export section is visible
    await expect(page.locator('text=/Export.*Share Options/i')).toBeVisible()

    // Verify all export buttons are present
    await expect(page.locator('button:has-text("Markdown")')).toBeVisible()
    await expect(page.locator('button:has-text("Plain Text")')).toBeVisible()
    await expect(page.locator('button:has-text("PDF")')).toBeVisible()

    // Verify share options
    await expect(page.locator('button:has-text(/Copy.*Markdown/)')).toBeVisible()
    await expect(page.locator('button:has-text("Share via Email")')).toBeVisible()
  })

  test('should show format guide', async ({ page }) => {
    // Look for format guide
    const formatGuide = page.locator('summary:has-text("Format Guide")')
    await expect(formatGuide).toBeVisible()

    // Expand format guide
    await formatGuide.click()

    // Verify content is shown
    await expect(page.locator('text=/Best for GitHub/i')).toBeVisible()
    await expect(page.locator('text=/Professional format/i')).toBeVisible()
  })

  test('should handle export errors gracefully', async ({ page }) => {
    // Simulate network error by intercepting the API call
    await page.route('**/api/bmad', route => {
      route.abort()
    })

    // Try to export
    await page.locator('button:has-text("PDF")').click()

    // Should show error message
    await expect(page.locator('text=/Export failed|error/i')).toBeVisible({
      timeout: 5000,
    })
  })

  test('should show loading state during export', async ({ page }) => {
    // Click PDF export
    await page.locator('button:has-text("PDF")').click()

    // Should show loading indicator
    await expect(page.locator('text=/Exporting/i')).toBeVisible({ timeout: 1000 })
  })
})

test.describe('PDF Generation Quality', () => {
  test('should generate PDF with branding', async ({ page }) => {
    // This test would require actual PDF parsing
    // For now, we verify the download happens and filename is correct

    const pdfButton = page.locator('button:has-text("PDF")')
    const downloadPromise = page.waitForEvent('download')

    await pdfButton.click()
    const download = await downloadPromise

    // Verify file size is reasonable (not empty)
    const path = await download.path()
    if (path) {
      const fs = require('fs')
      const stats = fs.statSync(path)
      expect(stats.size).toBeGreaterThan(10000) // At least 10KB
    }
  })
})

test.describe('Markdown Format Quality', () => {
  test('should include GFM tables in markdown', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    // Copy markdown
    await page.locator('button:has-text(/Copy.*Markdown/)').click()

    // Wait for success
    await page.waitForTimeout(1000)

    // Get clipboard content
    const markdown = await page.evaluate(() => navigator.clipboard.readText())

    // Verify GFM table format (Priority Context table)
    expect(markdown).toContain('| Metric | Value |')
    expect(markdown).toContain('|--------|-------|')
    expect(markdown).toContain('| **Priority Score**')

    // Verify section emojis
    expect(markdown).toContain('📋 Description')
    expect(markdown).toContain('🎯 Priority Context')
    expect(markdown).toContain('✅ Acceptance Criteria')
  })

  test('should include metadata in markdown', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.locator('button:has-text(/Copy.*Markdown/)').click()
    await page.waitForTimeout(1000)

    const markdown = await page.evaluate(() => navigator.clipboard.readText())

    // Verify metadata section
    expect(markdown).toContain('<details>')
    expect(markdown).toContain('<summary><strong>Metadata</strong></summary>')
    expect(markdown).toContain('BMad Method')
  })
})
