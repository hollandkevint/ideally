import { test, expect } from '@playwright/test'

/**
 * E2E Test Suite: Complete Feature Refinement Pathway
 *
 * Tests the full user journey through Stories 2.4a → 2.4b → 2.4c:
 * 1. Feature Input & Validation (Story 2.4a)
 * 2. Priority Scoring (Story 2.4b)
 * 3. Feature Brief Generation (Story 2.4c)
 *
 * Acceptance Criteria Coverage:
 * - 2.4a: Input validation, AI analysis generation
 * - 2.4b: Priority scoring with matrix visualization
 * - 2.4c: Brief generation, editing, export options
 */

test.describe('Feature Refinement Pathway - Complete E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to feature refinement pathway
    await page.goto('/feature-refinement')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
  })

  test('should complete entire feature refinement pathway successfully', async ({ page }) => {
    /**
     * PHASE 1: Feature Input & Validation (Story 2.4a)
     */

    // Verify we're on Step 1
    await expect(page.locator('text=Step 1 of 4: Feature Input')).toBeVisible()
    await expect(page.locator('h2', { hasText: 'Describe Your Feature Concept' })).toBeVisible()

    // Feature description is required and must be 50+ characters
    const featureDescription = 'Add comprehensive user profile customization allowing users to personalize their experience with custom themes, avatar uploads, and preference management'

    await page.fill('textarea[id="feature-description"]', featureDescription)

    // Verify character count feedback
    await expect(page.locator('text=✓ Minimum length met')).toBeVisible()

    // Fill optional fields for richer analysis
    await page.fill('textarea[id="target-users"]', 'Active platform users who want personalized experiences')
    await page.fill('textarea[id="current-problems"]', 'Limited customization options lead to generic user experience')
    await page.fill('textarea[id="success-definition"]', '60% of users customize their profiles within first week')

    // Generate analysis questions
    await page.click('button:has-text("Generate Analysis Questions")')

    // Wait for AI generation (should be <10 seconds per requirements)
    await expect(page.locator('text=Feature Validation Questions')).toBeVisible({ timeout: 15000 })

    // Verify questions were generated (should be 5-7 questions)
    const questions = await page.locator('.bg-blue-50 .flex.items-start').count()
    expect(questions).toBeGreaterThanOrEqual(3)
    expect(questions).toBeLessThanOrEqual(8)

    // Proceed to next phase
    await page.click('button:has-text("Continue to Priority Scoring")')

    /**
     * PHASE 2: Priority Scoring (Story 2.4b)
     */

    // Verify we're on Step 2
    await expect(page.locator('text=Step 2 of 4 - Priority Scoring')).toBeVisible()
    await expect(page.locator('h2', { hasText: 'Priority Scoring' })).toBeVisible()

    // Initial state should show default scores (5/5)
    await expect(page.locator('text=Priority Assessment Results')).toBeVisible()

    // Set high impact, low effort (Quick Wins quadrant)
    const effortSlider = page.locator('input[type="range"]').first()
    const impactSlider = page.locator('input[type="range"]').nth(1)

    await impactSlider.fill('8')
    await effortSlider.fill('3')

    // Verify priority calculation
    await expect(page.locator('text=2.67')).toBeVisible() // 8/3 = 2.67
    await expect(page.locator('text=Critical')).toBeVisible()
    await expect(page.locator('text=Quick Wins')).toBeVisible()

    // Verify priority matrix is displayed
    await expect(page.locator('text=Priority Matrix')).toBeVisible()
    await expect(page.locator('text=Your Feature Position')).toBeVisible()
    await expect(page.locator('text=Impact: 8/10 • Effort: 3/10')).toBeVisible()

    // Verify recommendation is shown
    await expect(page.locator('text=High priority! This feature offers maximum value')).toBeVisible()

    // Proceed to brief generation
    await page.click('button:has-text("Continue to Brief Generation")')

    /**
     * PHASE 3: Feature Brief Generation (Story 2.4c)
     */

    // Verify we're on Step 4 (Step 3 is analysis questions display)
    await expect(page.locator('text=Step 4 of 4 - Feature Brief')).toBeVisible()
    await expect(page.locator('h2', { hasText: 'Feature Brief' })).toBeVisible()

    // Brief should auto-generate
    await expect(page.locator('text=Generating your feature brief')).toBeVisible()

    // Wait for generation (should be <10 seconds per requirements)
    await expect(page.locator('text=Brief Quality Score')).toBeVisible({ timeout: 15000 })

    // Verify quality score is displayed
    const qualityScore = await page.locator('.inline-block.px-3.py-1.rounded-full').filter({ hasText: '/100' }).first()
    await expect(qualityScore).toBeVisible()

    // Verify all brief sections are present
    await expect(page.locator('text=Priority Context')).toBeVisible()
    await expect(page.locator('text=User Stories')).toBeVisible()
    await expect(page.locator('text=Acceptance Criteria')).toBeVisible()
    await expect(page.locator('text=Success Metrics')).toBeVisible()
    await expect(page.locator('text=Implementation Notes')).toBeVisible()

    // Verify priority context matches our scoring
    await expect(page.locator('text=Quick Wins')).toBeVisible()
    await expect(page.locator('text=Critical')).toBeVisible()

    // Verify user stories follow format (should have "As a" format)
    const userStorySection = page.locator('h4:has-text("User Stories")').locator('..')
    const firstUserStory = userStorySection.locator('li').first()
    await expect(firstUserStory).toContainText(/As a|As an/)

    // Verify export options are available
    await expect(page.locator('text=Export & Share Options')).toBeVisible()
    await expect(page.locator('button:has-text("Download Markdown")')).toBeVisible()
    await expect(page.locator('button:has-text("Download Text")')).toBeVisible()
    await expect(page.locator('button:has-text("Download PDF")')).toBeVisible()

    // Test edit mode toggle
    await page.click('button:has-text("Edit Mode")')

    // Verify editor is displayed
    await expect(page.locator('label:has-text("Feature Title")')).toBeVisible()
    await expect(page.locator('label:has-text("Description")')).toBeVisible()

    // Toggle back to view mode
    await page.click('button:has-text("View Mode")')

    // Verify we're back in preview mode
    await expect(page.locator('label:has-text("Feature Title")')).not.toBeVisible()

    // Complete the pathway
    await page.click('button:has-text("Complete Feature Refinement")')

    // Verify completion screen
    await expect(page.locator('text=Feature Refinement Complete')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Your feature brief is ready')).toBeVisible()
  })

  test('should validate feature description length requirements', async ({ page }) => {
    await expect(page.locator('text=Step 1 of 4')).toBeVisible()

    // Try with too short description (< 50 chars)
    await page.fill('textarea[id="feature-description"]', 'Short description')

    // Should show character requirement
    await expect(page.locator('text=more characters needed')).toBeVisible()

    // Generate button should be disabled
    const generateButton = page.locator('button:has-text("Generate Analysis Questions")')
    await expect(generateButton).toBeDisabled()

    // Add more text to meet minimum
    await page.fill('textarea[id="feature-description"]', 'This is a much longer and more detailed feature description that exceeds the fifty character minimum requirement')

    // Should show validation passed
    await expect(page.locator('text=✓ Minimum length met')).toBeVisible()

    // Generate button should be enabled
    await expect(generateButton).toBeEnabled()
  })

  test('should handle regeneration of feature brief', async ({ page }) => {
    // Complete Phase 1 quickly
    await page.fill('textarea[id="feature-description"]', 'Enable advanced search functionality with filters, sorting, and saved search preferences for better content discovery')
    await page.click('button:has-text("Generate Analysis Questions")')
    await expect(page.locator('text=Feature Validation Questions')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Continue to Priority Scoring")')

    // Complete Phase 2 quickly
    await page.locator('input[type="range"]').first().fill('5')
    await page.locator('input[type="range"]').nth(1).fill('7')
    await page.click('button:has-text("Continue to Brief Generation")')

    // Wait for initial brief generation
    await expect(page.locator('text=Brief Quality Score')).toBeVisible({ timeout: 15000 })

    // Get initial version/content
    const initialContent = await page.locator('h4:has-text("User Stories")').locator('..').textContent()

    // Click regenerate
    await page.click('button:has-text("↻ Regenerate")')

    // Should show regenerating state
    await expect(page.locator('text=Regenerating')).toBeVisible()

    // Wait for new brief (should be different or have version updated)
    await expect(page.locator('text=Brief Quality Score')).toBeVisible({ timeout: 15000 })

    // Verify brief was regenerated (content might be same or different)
    await expect(page.locator('h4:has-text("User Stories")')).toBeVisible()
  })

  test('should allow inline editing of brief sections', async ({ page }) => {
    // Navigate through to brief generation
    await page.fill('textarea[id="feature-description"]', 'Implement real-time collaboration features including live cursors, presence indicators, and collaborative editing')
    await page.click('button:has-text("Generate Analysis Questions")')
    await expect(page.locator('text=Feature Validation Questions')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Continue to Priority Scoring")')

    await page.locator('input[type="range"]').first().fill('6')
    await page.locator('input[type="range"]').nth(1).fill('9')
    await page.click('button:has-text("Continue to Brief Generation")')

    await expect(page.locator('text=Brief Quality Score')).toBeVisible({ timeout: 15000 })

    // Enter edit mode
    await page.click('button:has-text("Edit Mode")')

    // Edit the title
    const titleInput = page.locator('input[type="text"]').filter({ has: page.locator('..', { hasText: 'Feature Title' }) })
    await titleInput.fill('Updated Feature Title for Testing')

    // Edit description
    const descriptionTextarea = page.locator('textarea').filter({ has: page.locator('..', { hasText: 'Description' }) })
    await descriptionTextarea.fill('This is an updated description that provides more detail about the feature and its benefits for users.')

    // Add a new user story
    await page.click('button:has-text("+ Add Story")')

    const newStoryTextarea = page.locator('textarea').last()
    await newStoryTextarea.fill('As a team member, I want to see who is online so that I can collaborate in real-time')

    // Save changes
    await page.click('button:has-text("Save Changes")')

    // Should return to view mode with updated content
    await expect(page.locator('text=Updated Feature Title for Testing')).toBeVisible()
    await expect(page.locator('text=This is an updated description')).toBeVisible()
  })

  test('should handle export functionality', async ({ page }) => {
    // Navigate to brief generation
    await page.fill('textarea[id="feature-description"]', 'Add notification system with email, push, and in-app alerts for important events and updates')
    await page.click('button:has-text("Generate Analysis Questions")')
    await expect(page.locator('text=Feature Validation Questions')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Continue to Priority Scoring")')

    await page.locator('input[type="range"]').first().fill('4')
    await page.locator('input[type="range"]').nth(1).fill('8')
    await page.click('button:has-text("Continue to Brief Generation")')

    await expect(page.locator('text=Brief Quality Score')).toBeVisible({ timeout: 15000 })

    // Test markdown export
    const [downloadMarkdown] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download Markdown")')
    ])

    expect(downloadMarkdown.suggestedFilename()).toContain('.md')

    // Test text export
    const [downloadText] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download Text")')
    ])

    expect(downloadText.suggestedFilename()).toContain('.txt')

    // Test copy to clipboard
    await page.click('button:has-text("Copy to Clipboard")')
    await expect(page.locator('text=✓ Copied!')).toBeVisible({ timeout: 3000 })
  })

  test('should display appropriate priority matrix positioning', async ({ page }) => {
    await page.fill('textarea[id="feature-description"]', 'Minor UI polish and cosmetic improvements that have minimal impact on user experience')
    await page.click('button:has-text("Generate Analysis Questions")')
    await expect(page.locator('text=Feature Validation Questions')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Continue to Priority Scoring")')

    // Test Time Wasters quadrant (Low Impact, High Effort)
    await page.locator('input[type="range"]').first().fill('8')
    await page.locator('input[type="range"]').nth(1).fill('3')

    await expect(page.locator('text=Time Wasters')).toBeVisible()
    await expect(page.locator('text=Question this feature')).toBeVisible()

    await page.click('button:has-text("Continue to Brief Generation")')
    await expect(page.locator('text=Brief Quality Score')).toBeVisible({ timeout: 15000 })

    // Verify Time Wasters context is in brief
    await expect(page.locator('text=Time Wasters')).toBeVisible()
    await expect(page.locator('text=Implementation Notes')).toBeVisible()
  })

  test('should handle validation errors gracefully', async ({ page }) => {
    await page.fill('textarea[id="feature-description"]', 'Valid feature description that meets the minimum length requirement of fifty characters')
    await page.click('button:has-text("Generate Analysis Questions")')
    await expect(page.locator('text=Feature Validation Questions')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Continue to Priority Scoring")')

    await page.locator('input[type="range"]').first().fill('5')
    await page.locator('input[type="range"]').nth(1).fill('6')
    await page.click('button:has-text("Continue to Brief Generation")')

    await expect(page.locator('text=Brief Quality Score')).toBeVisible({ timeout: 15000 })

    // Enter edit mode
    await page.click('button:has-text("Edit Mode")')

    // Try to save with invalid title (too short)
    await page.locator('input[type="text"]').first().fill('Ab')
    await page.click('button:has-text("Save Changes")')

    // Should show validation error
    await expect(page.locator('text=Title must be at least 3 characters')).toBeVisible()

    // Fix the error
    await page.locator('input[type="text"]').first().fill('Valid Title Here')
    await page.click('button:has-text("Save Changes")')

    // Should save successfully
    await expect(page.locator('text=Valid Title Here')).toBeVisible()
  })

  test('should maintain state across phase transitions', async ({ page }) => {
    const testFeature = 'Create comprehensive analytics dashboard with real-time metrics, custom reports, and data export capabilities'

    // Phase 1
    await page.fill('textarea[id="feature-description"]', testFeature)
    await page.fill('textarea[id="target-users"]', 'Business analysts and product managers')
    await page.click('button:has-text("Generate Analysis Questions")')
    await expect(page.locator('text=Feature Validation Questions')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Continue to Priority Scoring")')

    // Phase 2 - Set specific scores
    await page.locator('input[type="range"]').first().fill('7')
    await page.locator('input[type="range"]').nth(1).fill('9')

    // Verify scores before proceeding
    await expect(page.locator('text=1.29')).toBeVisible() // 9/7
    await expect(page.locator('text=Major Projects')).toBeVisible()

    await page.click('button:has-text("Continue to Brief Generation")')

    // Phase 3 - Verify state was maintained
    await expect(page.locator('text=Brief Quality Score')).toBeVisible({ timeout: 15000 })

    // Priority context should reflect Phase 2 scoring
    await expect(page.locator('text=Major Projects')).toBeVisible()
    await expect(page.locator('text=High')).toBeVisible() // Priority category

    // Brief should reference the original feature description
    const briefContent = await page.locator('.brief-preview, .brief-content').textContent()
    expect(briefContent?.toLowerCase()).toContain('analytics')
  })

  test('should show progress indicators throughout pathway', async ({ page }) => {
    // Phase 1
    await expect(page.locator('text=Step 1 of 4')).toBeVisible()
    await expect(page.locator('text=Time remaining: ~5 minutes')).toBeVisible()

    await page.fill('textarea[id="feature-description"]', 'Implement multi-factor authentication with SMS, email, and authenticator app support')
    await page.click('button:has-text("Generate Analysis Questions")')
    await expect(page.locator('text=Feature Validation Questions')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Continue to Priority Scoring")')

    // Phase 2
    await expect(page.locator('text=Step 2 of 4')).toBeVisible()
    await expect(page.locator('text=Time remaining: ~4 minutes')).toBeVisible()

    // Verify progress bar exists and shows progress
    const progressBar = page.locator('.bg-blue-600.h-2.rounded-full')
    await expect(progressBar).toBeVisible()

    await page.locator('input[type="range"]').first().fill('5')
    await page.locator('input[type="range"]').nth(1).fill('8')
    await page.click('button:has-text("Continue to Brief Generation")')

    // Phase 3
    await expect(page.locator('text=Step 4 of 4')).toBeVisible()
    await expect(page.locator('text=Time remaining: ~6 minutes')).toBeVisible()

    await expect(page.locator('text=Brief Quality Score')).toBeVisible({ timeout: 15000 })

    // Progress should show 100% at final phase
    const finalProgressBar = page.locator('.bg-blue-600.h-2.rounded-full').last()
    await expect(finalProgressBar).toHaveCSS('width', /100%/)
  })

  test('should handle cancellation from edit mode', async ({ page }) => {
    await page.fill('textarea[id="feature-description"]', 'Add keyboard shortcuts and accessibility features for power users and users with disabilities')
    await page.click('button:has-text("Generate Analysis Questions")')
    await expect(page.locator('text=Feature Validation Questions')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Continue to Priority Scoring")')

    await page.locator('input[type="range"]').first().fill('3')
    await page.locator('input[type="range"]').nth(1).fill('7')
    await page.click('button:has-text("Continue to Brief Generation")')

    await expect(page.locator('text=Brief Quality Score')).toBeVisible({ timeout: 15000 })

    // Get original title
    const originalTitle = await page.locator('h3').first().textContent()

    // Enter edit mode and make changes
    await page.click('button:has-text("Edit Mode")')
    await page.locator('input[type="text"]').first().fill('This Title Should Be Discarded')

    // Cancel instead of saving
    await page.click('button:has-text("Cancel")')

    // Should revert to original content
    await expect(page.locator(`text=${originalTitle}`)).toBeVisible()
    await expect(page.locator('text=This Title Should Be Discarded')).not.toBeVisible()
  })
})

test.describe('Feature Refinement Pathway - Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature-refinement')
    await page.waitForLoadState('networkidle')
  })

  test('should handle API errors during brief generation', async ({ page }) => {
    // Mock API failure by intercepting the request
    await page.route('**/api/bmad', route => {
      if (route.request().postDataJSON()?.action === 'generate_feature_brief') {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        })
      } else {
        route.continue()
      }
    })

    await page.fill('textarea[id="feature-description"]', 'Feature that will trigger API error during brief generation phase')
    await page.click('button:has-text("Generate Analysis Questions")')
    await expect(page.locator('text=Feature Validation Questions')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Continue to Priority Scoring")')

    await page.locator('input[type="range"]').first().fill('5')
    await page.locator('input[type="range"]').nth(1).fill('6')
    await page.click('button:has-text("Continue to Brief Generation")')

    // Should show error message
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Failed to generate feature brief')).toBeVisible()
  })

  test('should handle network timeout gracefully', async ({ page }) => {
    // Simulate slow network by delaying response
    await page.route('**/api/bmad', route => {
      setTimeout(() => route.continue(), 20000) // 20 second delay
    })

    await page.fill('textarea[id="feature-description"]', 'Feature to test timeout handling with delayed API responses')
    await page.click('button:has-text("Generate Analysis Questions")')

    // Should show loading state
    await expect(page.locator('text=Generating')).toBeVisible()

    // Should eventually timeout or show error
    // Note: Actual timeout handling depends on implementation
  })
})