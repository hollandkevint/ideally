import { Page, expect } from '@playwright/test'
import { ROUTES, ROUTE_PATTERNS } from './routes'
import { SELECTORS } from './selectors'

export class WorkspaceHelper {
  constructor(private page: Page) {}

  async createWorkspace(name: string, description: string) {
    // Navigate to dashboard if not already there
    if (!this.page.url().includes('/app')) {
      await this.page.goto(ROUTES.app)
    }

    // Click create new workspace/session button
    await this.page.click(SELECTORS.dashboard.newSessionButton)

    // The new session flow auto-creates and redirects to /app/session/[id]
    // Wait for redirect to session workspace
    await this.page.waitForURL(ROUTE_PATTERNS.appSession, { timeout: 15000 })

    // Extract session ID from URL
    const url = this.page.url()
    const workspaceId = url.match(/\/app\/session\/([a-f0-9-]+)/)?.[1]

    return { workspaceId, url }
  }

  async navigateToWorkspace(workspaceId: string) {
    await this.page.goto(ROUTES.appSession(workspaceId))
    await this.page.waitForSelector(SELECTORS.workspace.container, { timeout: 10000 })
  }

  async deleteWorkspace(workspaceId: string) {
    await this.page.goto(ROUTES.app)

    // Find session card and click delete
    const sessionCard = this.page.locator(`[data-session-id="${workspaceId}"]`)
    await sessionCard.locator('button[aria-label*="Delete"], button[aria-label*="delete"]').click()

    // Confirm deletion
    await this.page.click('button:has-text("Confirm"), button:has-text("Delete")')

    // Wait for session to be removed
    await expect(sessionCard).not.toBeVisible({ timeout: 5000 })
  }

  async getWorkspaceList() {
    await this.page.goto(ROUTES.app)

    // Wait for sessions to load (or empty state)
    try {
      await this.page.waitForSelector('[data-session-id]', { timeout: 5000 })
    } catch {
      // No sessions found - return empty array
      return []
    }

    const workspaces = await this.page.$$eval('[data-session-id]', elements =>
      elements.map(el => ({
        id: el.getAttribute('data-session-id'),
        name: el.querySelector('h3')?.textContent || '',
        description: el.querySelector('p')?.textContent || ''
      }))
    )

    return workspaces
  }

  async verifyWorkspaceInterface() {
    // Check for workspace container
    await expect(this.page.locator(SELECTORS.workspace.container)).toBeVisible()

    // Check for tabs
    await expect(this.page.locator(SELECTORS.workspace.chatTab)).toBeVisible()
    await expect(this.page.locator(SELECTORS.workspace.bmadTab)).toBeVisible()
  }

  async switchToTab(tab: 'chat' | 'bmad') {
    if (tab === 'chat') {
      await this.page.click(SELECTORS.workspace.chatTab)
    } else {
      await this.page.click(SELECTORS.workspace.bmadTab)
    }

    // Wait for tab content to load
    await this.page.waitForTimeout(500)
  }

  async getConversationHistory() {
    const messages = await this.page.$$eval(`${SELECTORS.workspace.userMessage}, ${SELECTORS.workspace.assistantMessage}`, elements =>
      elements.map(el => ({
        role: el.classList.contains('chat-message-user') || el.getAttribute('data-role') === 'user' ? 'user' : 'assistant',
        content: el.textContent || ''
      }))
    )

    return messages
  }

  async checkCanvasContent() {
    const canvasElements = await this.page.$$eval(`${SELECTORS.workspace.canvasPane} [data-canvas-element]`, elements =>
      elements.map(el => ({
        type: el.getAttribute('data-element-type'),
        content: el.textContent || ''
      }))
    )

    return canvasElements
  }
}
