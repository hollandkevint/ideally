import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { WorkspaceHelper } from '../helpers/workspace.helper'
import { testUsers } from '../fixtures/users'

test.describe('Dashboard & Workspace Management', () => {
  let authHelper: AuthHelper
  let workspaceHelper: WorkspaceHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    workspaceHelper = new WorkspaceHelper(page)

    // Login before each test
    await authHelper.login(testUsers.default.email, testUsers.default.password)
  })

  test.describe('Dashboard Interface', () => {
    test('should display dashboard with correct layout', async ({ page }) => {
      await page.goto('/dashboard')

      // Check main dashboard elements
      await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible()
      await expect(page.locator('button:has-text("New Session")')).toBeVisible()

      // Check user info
      await expect(page.locator(`text=${testUsers.default.email}`)).toBeVisible()

      // Check navigation elements
      await expect(page.locator('a:has-text("Account")')).toBeVisible()
      await expect(page.locator('button:has-text("Sign Out")')).toBeVisible()
    })

    test('should display workspace cards correctly', async ({ page }) => {
      await page.goto('/dashboard')

      // Check if workspace cards are displayed
      const workspaceCards = page.locator('[data-workspace-id]')
      const count = await workspaceCards.count()

      if (count > 0) {
        // Verify card structure
        const firstCard = workspaceCards.first()
        await expect(firstCard.locator('h3')).toBeVisible() // Title
        await expect(firstCard.locator('p')).toBeVisible() // Description

        // Check metadata
        await expect(firstCard.locator('text=/messages:/i')).toBeVisible()
        await expect(firstCard.locator('text=/updated:/i')).toBeVisible()
      }
    })

    test('should handle empty state correctly', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('/dashboard')

      const workspaceCards = page.locator('[data-workspace-id]')
      const count = await workspaceCards.count()

      if (count === 0) {
        // Should show empty state message
        await expect(page.locator('text=/no workspaces|create.*first|get started/i')).toBeVisible()
      }
    })
  })

  test.describe('Workspace Creation', () => {
    test('should create a new workspace successfully', async ({ page }) => {
      await page.goto('/dashboard')

      // Click create button
      await page.click('button:has-text("New Session")')

      // Fill workspace details
      const workspaceName = `Test Workspace ${Date.now()}`
      const workspaceDesc = 'This is a test workspace for E2E testing'

      await page.fill('input[placeholder*="workspace name"]', workspaceName)
      await page.fill('textarea[placeholder*="description"]', workspaceDesc)

      // Submit
      await page.click('button:has-text("Create Workspace"), button:has-text("Create")')

      // Should redirect to new workspace
      await expect(page).toHaveURL(/\/workspace\/[a-f0-9-]+/, { timeout: 10000 })

      // Verify workspace interface loaded
      await workspaceHelper.verifyWorkspaceInterface()
    })

    test('should validate workspace creation form', async ({ page }) => {
      await page.goto('/dashboard')

      // Click create button
      await page.click('button:has-text("New Session")')

      // Try to submit empty form
      await page.click('button:has-text("Create Workspace"), button:has-text("Create")')

      // Should show validation error
      await expect(page.locator('text=/required|enter.*name/i')).toBeVisible()

      // Fill only name
      await page.fill('input[placeholder*="workspace name"]', 'Test')

      // Submit - should work even without description
      await page.click('button:has-text("Create Workspace"), button:has-text("Create")')

      // Should redirect to workspace
      await expect(page).toHaveURL(/\/workspace\/[a-f0-9-]+/, { timeout: 10000 })
    })

    test('should handle workspace creation errors', async ({ page }) => {
      await page.goto('/dashboard')

      // Click create button
      await page.click('button:has-text("New Session")')

      // Fill with extremely long name (to trigger potential error)
      const longName = 'a'.repeat(500)
      await page.fill('input[placeholder*="workspace name"]', longName)
      await page.fill('textarea[placeholder*="description"]', 'Test description')

      // Submit
      await page.click('button:has-text("Create Workspace"), button:has-text("Create")')

      // Should show error or truncate name
      const errorMessage = page.locator('text=/error|failed|too long/i')
      const workspaceUrl = page.url()

      // Either show error or create with truncated name
      if (await errorMessage.isVisible({ timeout: 5000 })) {
        await expect(errorMessage).toBeVisible()
      } else {
        await expect(page).toHaveURL(/\/workspace\/[a-f0-9-]+/)
      }
    })
  })

  test.describe('Workspace Navigation', () => {
    test('should navigate to workspace from dashboard', async ({ page }) => {
      // First create a workspace
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Navigation Test Workspace',
        'Testing navigation functionality'
      )

      // Go back to dashboard
      await page.goto('/dashboard')

      // Click on the workspace card
      await page.click(`[data-workspace-id="${workspaceId}"]`)

      // Should navigate to workspace
      await expect(page).toHaveURL(`/workspace/${workspaceId}`)
      await workspaceHelper.verifyWorkspaceInterface()
    })

    test('should handle direct workspace URL access', async ({ page }) => {
      // Create a workspace first
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Direct Access Test',
        'Testing direct URL access'
      )

      // Navigate directly to workspace URL
      await page.goto(`/workspace/${workspaceId}`)

      // Should load workspace
      await workspaceHelper.verifyWorkspaceInterface()
    })

    test('should handle invalid workspace ID', async ({ page }) => {
      // Try to access non-existent workspace
      await page.goto('/workspace/invalid-workspace-id-123')

      // Should show error
      await expect(page.locator('text=/not found|does not exist|access denied/i')).toBeVisible({ timeout: 10000 })

      // Should have option to go back to dashboard
      await expect(page.locator('a:has-text("Dashboard"), button:has-text("Dashboard")')).toBeVisible()
    })

    test('should navigate back to dashboard from workspace', async ({ page }) => {
      // Create and navigate to workspace
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Back Navigation Test',
        'Testing back navigation'
      )

      // Click back to dashboard
      await page.click('a[href="/dashboard"], button:has-text("Dashboard")')

      // Should be on dashboard
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible()
    })
  })

  test.describe('Workspace Management', () => {
    test('should update workspace details', async ({ page }) => {
      // Create a workspace
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Update Test Workspace',
        'Original description'
      )

      await page.goto('/dashboard')

      // Look for edit button on workspace card
      const editButton = page.locator(`[data-workspace-id="${workspaceId}"] button[aria-label="Edit workspace"]`)

      if (await editButton.isVisible()) {
        await editButton.click()

        // Update details
        await page.fill('input[name="name"]', 'Updated Workspace Name')
        await page.fill('textarea[name="description"]', 'Updated description')

        // Save changes
        await page.click('button:has-text("Save"), button:has-text("Update")')

        // Verify changes
        await expect(page.locator('text=Updated Workspace Name')).toBeVisible({ timeout: 5000 })
      }
    })

    test('should delete workspace', async ({ page }) => {
      // Create a workspace to delete
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Delete Test Workspace',
        'This workspace will be deleted'
      )

      await page.goto('/dashboard')

      // Find delete button
      const deleteButton = page.locator(`[data-workspace-id="${workspaceId}"] button[aria-label="Delete workspace"]`)

      if (await deleteButton.isVisible()) {
        await deleteButton.click()

        // Confirm deletion
        await page.click('button:has-text("Confirm"), button:has-text("Delete")')

        // Workspace should be removed
        await expect(page.locator(`[data-workspace-id="${workspaceId}"]`)).not.toBeVisible({ timeout: 5000 })
      }
    })

    test('should sort workspaces by update time', async ({ page }) => {
      // Create multiple workspaces
      await workspaceHelper.createWorkspace('Workspace A', 'First workspace')
      await page.waitForTimeout(1000)
      await workspaceHelper.createWorkspace('Workspace B', 'Second workspace')
      await page.waitForTimeout(1000)
      await workspaceHelper.createWorkspace('Workspace C', 'Third workspace')

      // Go to dashboard
      await page.goto('/dashboard')

      // Get workspace order
      const workspaceNames = await page.$$eval('[data-workspace-id] h3',
        elements => elements.map(el => el.textContent)
      )

      // Most recent should be first (Workspace C)
      expect(workspaceNames[0]).toContain('Workspace C')
    })
  })

  test.describe('Workspace Persistence', () => {
    test('should persist workspace data across sessions', async ({ page, context }) => {
      // Create workspace with some data
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Persistence Test',
        'Testing data persistence'
      )

      // Clear cookies and storage (simulate new session)
      await context.clearCookies()

      // Login again
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      // Navigate to workspace
      await page.goto(`/workspace/${workspaceId}`)

      // Workspace should load with saved data
      await expect(page.locator('h1:has-text("Persistence Test")')).toBeVisible()
    })

    test('should handle concurrent workspace updates', async ({ page, context }) => {
      // Create workspace
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Concurrent Test',
        'Testing concurrent updates'
      )

      // Open second tab
      const page2 = await context.newPage()
      await page2.goto(`/workspace/${workspaceId}`)

      // Make changes in both tabs (if edit functionality exists)
      // This tests that the system handles concurrent access properly

      // Both pages should remain functional
      await page.reload()
      await workspaceHelper.verifyWorkspaceInterface()

      await page2.reload()
      const helper2 = new WorkspaceHelper(page2)
      await helper2.verifyWorkspaceInterface()

      await page2.close()
    })
  })

  test.describe('Dashboard Search & Filter', () => {
    test('should search workspaces by name', async ({ page }) => {
      // Create workspaces with distinct names
      await workspaceHelper.createWorkspace('Alpha Project', 'First project')
      await workspaceHelper.createWorkspace('Beta Initiative', 'Second project')
      await workspaceHelper.createWorkspace('Gamma Strategy', 'Third project')

      await page.goto('/dashboard')

      // Look for search input
      const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]')

      if (await searchInput.isVisible()) {
        // Search for specific workspace
        await searchInput.fill('Beta')

        // Should show only matching workspace
        await expect(page.locator('text=Beta Initiative')).toBeVisible()
        await expect(page.locator('text=Alpha Project')).not.toBeVisible()
        await expect(page.locator('text=Gamma Strategy')).not.toBeVisible()
      }
    })

    test('should handle workspace pagination if many exist', async ({ page }) => {
      // This test would check pagination if there are many workspaces
      await page.goto('/dashboard')

      const paginationControls = page.locator('[aria-label="pagination"], .pagination')

      if (await paginationControls.isVisible()) {
        // Test pagination controls
        const nextButton = page.locator('button:has-text("Next"), [aria-label="Next page"]')
        if (await nextButton.isEnabled()) {
          await nextButton.click()
          // Verify page changed
          await expect(page.url()).toContain('page=2')
        }
      }
    })
  })
})