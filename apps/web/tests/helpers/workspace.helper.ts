import { Page, expect } from '@playwright/test'

export class WorkspaceHelper {
  constructor(private page: Page) {}

  async createWorkspace(name: string, description: string) {
    // Navigate to dashboard if not already there
    if (!this.page.url().includes('/dashboard')) {
      await this.page.goto('/dashboard')
    }

    // Click create new workspace button
    await this.page.click('button:has-text("Create New Workspace")')

    // Fill in workspace details
    await this.page.fill('input[placeholder*="workspace name"]', name)
    await this.page.fill('textarea[placeholder*="description"]', description)

    // Submit form
    await this.page.click('button:has-text("Create Workspace")')

    // Wait for redirect to workspace
    await this.page.waitForURL(/\/workspace\/[a-f0-9-]+/, { timeout: 10000 })

    // Extract workspace ID from URL
    const url = this.page.url()
    const workspaceId = url.match(/\/workspace\/([a-f0-9-]+)/)?.[1]

    return { workspaceId, url }
  }

  async navigateToWorkspace(workspaceId: string) {
    await this.page.goto(`/workspace/${workspaceId}`)
    await this.page.waitForSelector('.dual-pane-container', { timeout: 10000 })
  }

  async deleteWorkspace(workspaceId: string) {
    await this.page.goto('/dashboard')

    // Find workspace card and click delete
    const workspaceCard = this.page.locator(`[data-workspace-id="${workspaceId}"]`)
    await workspaceCard.locator('button[aria-label="Delete workspace"]').click()

    // Confirm deletion
    await this.page.click('button:has-text("Confirm Delete")')

    // Wait for workspace to be removed
    await expect(workspaceCard).not.toBeVisible({ timeout: 5000 })
  }

  async getWorkspaceList() {
    await this.page.goto('/dashboard')
    await this.page.waitForSelector('[data-workspace-id]', { timeout: 10000 })

    const workspaces = await this.page.$$eval('[data-workspace-id]', elements =>
      elements.map(el => ({
        id: el.getAttribute('data-workspace-id'),
        name: el.querySelector('h3')?.textContent || '',
        description: el.querySelector('p')?.textContent || ''
      }))
    )

    return workspaces
  }

  async verifyWorkspaceInterface() {
    // Check for dual pane layout
    await expect(this.page.locator('.dual-pane-container')).toBeVisible()
    await expect(this.page.locator('.chat-pane')).toBeVisible()
    await expect(this.page.locator('.canvas-pane')).toBeVisible()

    // Check for tabs
    await expect(this.page.locator('button:has-text("Mary Chat")')).toBeVisible()
    await expect(this.page.locator('button:has-text("BMad Method")')).toBeVisible()
  }

  async switchToTab(tab: 'chat' | 'bmad') {
    if (tab === 'chat') {
      await this.page.click('button:has-text("Mary Chat")')
    } else {
      await this.page.click('button:has-text("BMad Method")')
    }

    // Wait for tab content to load
    await this.page.waitForTimeout(500)
  }

  async getConversationHistory() {
    const messages = await this.page.$$eval('.chat-message-user, .chat-message-assistant', elements =>
      elements.map(el => ({
        role: el.classList.contains('chat-message-user') ? 'user' : 'assistant',
        content: el.textContent || ''
      }))
    )

    return messages
  }

  async checkCanvasContent() {
    const canvasElements = await this.page.$$eval('.canvas-pane [data-canvas-element]', elements =>
      elements.map(el => ({
        type: el.getAttribute('data-element-type'),
        content: el.textContent || ''
      }))
    )

    return canvasElements
  }
}