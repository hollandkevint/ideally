import { Page, expect } from '@playwright/test'

export type PathwayType = 'new-idea' | 'business-model' | 'feature-refinement'

export class BmadHelper {
  constructor(private page: Page) {}

  async selectPathway(pathway: PathwayType) {
    // Switch to BMad Method tab
    await this.page.click('button:has-text("BMad Method")')

    // Select the appropriate pathway
    const pathwayTexts = {
      'new-idea': 'I have a brand new idea',
      'business-model': 'I\'m stuck on a business model problem',
      'feature-refinement': 'I need to refine a feature/concept'
    }

    await this.page.click(`text="${pathwayTexts[pathway]}"`)

    // Wait for session to start
    await this.page.waitForSelector('.bmad-session-active', { timeout: 10000 })
  }

  async selectElicitationOption(optionNumber: number) {
    // Click on numbered option (1-9)
    await this.page.click(`button:has-text("${optionNumber}")`);

    // Wait for response
    await this.page.waitForTimeout(1000)
  }

  async getSessionStatus() {
    const timer = await this.page.locator('[data-testid="session-timer"]').textContent()
    const phase = await this.page.locator('[data-testid="session-phase"]').textContent()
    const progress = await this.page.locator('[data-testid="session-progress"]').getAttribute('data-progress')

    return {
      timer,
      phase,
      progress: progress ? parseInt(progress) : 0
    }
  }

  async pauseSession() {
    await this.page.click('button:has-text("Pause Session")')
    await expect(this.page.locator('button:has-text("Resume Session")')).toBeVisible()
  }

  async resumeSession() {
    await this.page.click('button:has-text("Resume Session")')
    await expect(this.page.locator('button:has-text("Pause Session")')).toBeVisible()
  }

  async completeSession() {
    // Click complete session if available
    const completeButton = this.page.locator('button:has-text("Complete Session")')

    if (await completeButton.isVisible()) {
      await completeButton.click()
      await this.page.waitForSelector('[data-testid="session-summary"]', { timeout: 10000 })
    }
  }

  async getElicitationOptions() {
    const options = await this.page.$$eval(
      '.elicitation-panel button[data-option-number]',
      elements => elements.map(el => ({
        number: el.getAttribute('data-option-number'),
        text: el.textContent?.replace(/^\d+\.\s*/, '').trim()
      }))
    )

    return options
  }

  async verifySessionTimer() {
    // Check if timer is running
    const initialTime = await this.page.locator('[data-testid="session-timer"]').textContent()

    // Wait 2 seconds
    await this.page.waitForTimeout(2000)

    const newTime = await this.page.locator('[data-testid="session-timer"]').textContent()

    return initialTime !== newTime
  }

  async getGeneratedDocument() {
    // Get content from canvas pane
    const document = await this.page.locator('.canvas-pane [data-document-content]').textContent()
    return document
  }

  async verifyPhaseProgression(expectedPhase: string) {
    const phase = await this.page.locator('[data-testid="session-phase"]').textContent()
    return phase?.toLowerCase().includes(expectedPhase.toLowerCase())
  }

  async checkSessionHistory() {
    // Click on session history if available
    const historyButton = this.page.locator('button:has-text("Session History")')

    if (await historyButton.isVisible()) {
      await historyButton.click()

      const sessions = await this.page.$$eval(
        '[data-session-history-item]',
        elements => elements.map(el => ({
          pathway: el.querySelector('[data-pathway]')?.textContent,
          date: el.querySelector('[data-date]')?.textContent,
          status: el.querySelector('[data-status]')?.textContent
        }))
      )

      return sessions
    }

    return []
  }

  async inputCustomText(text: string) {
    // For free-form input during BMad session
    const inputField = this.page.locator('textarea[placeholder*="your thoughts"], input[placeholder*="your answer"]')

    if (await inputField.isVisible()) {
      await inputField.fill(text)
      await this.page.click('button:has-text("Submit")')
    }
  }

  async verifyTemplateExecution(templateName: string) {
    // Check if specific template is being executed
    const templateIndicator = await this.page.locator(`[data-template="${templateName}"]`).isVisible()
    return templateIndicator
  }

  async getSessionMetrics() {
    const metrics = await this.page.evaluate(() => {
      // Get session metrics from the page
      const metricsElement = document.querySelector('[data-session-metrics]')
      if (!metricsElement) return null

      return {
        duration: metricsElement.getAttribute('data-duration'),
        interactions: metricsElement.getAttribute('data-interactions'),
        completionRate: metricsElement.getAttribute('data-completion-rate')
      }
    })

    return metrics
  }
}