import { Page, expect } from '@playwright/test'

export class ChatHelper {
  constructor(private page: Page) {}

  async sendMessage(message: string) {
    // Type message
    await this.page.fill('input[placeholder*="strategic question"]', message)

    // Send message
    await this.page.click('button:has-text("Send")')

    // Wait for message to appear in chat
    await this.page.waitForSelector(`text="${message}"`, { timeout: 5000 })
  }

  async waitForMaryResponse(timeout = 30000) {
    // Wait for Mary's response to start streaming
    await this.page.waitForSelector('.chat-message-assistant:last-child', { timeout })

    // Wait for streaming to complete (no more shimmer effects)
    await this.page.waitForFunction(
      () => !document.querySelector('.chat-message-assistant:last-child .loading-shimmer'),
      { timeout }
    )

    // Get the response content
    const response = await this.page.locator('.chat-message-assistant:last-child').textContent()
    return response
  }

  async sendAndWaitForResponse(message: string) {
    await this.sendMessage(message)
    const response = await this.waitForMaryResponse()
    return response
  }

  async verifyMarkdownFormatting() {
    const lastMessage = this.page.locator('.chat-message-assistant:last-child')

    // Check for various markdown elements
    const hasHeadings = await lastMessage.locator('h1, h2, h3').count() > 0
    const hasParagraphs = await lastMessage.locator('p').count() > 0
    const hasLists = await lastMessage.locator('ul, ol').count() > 0

    return {
      hasHeadings,
      hasParagraphs,
      hasLists,
      hasFormatting: hasHeadings || hasLists
    }
  }

  async getStrategicTags() {
    const tags = await this.page.$$eval(
      '.chat-message-assistant:last-child [class*="strategic-tag"]',
      elements => elements.map(el => el.textContent?.trim())
    )
    return tags.filter(Boolean)
  }

  async verifyStreamingIndicator() {
    // Check if streaming indicator appears
    const shimmer = this.page.locator('.loading-shimmer')
    await expect(shimmer).toBeVisible({ timeout: 5000 })

    // Wait for it to disappear (streaming complete)
    await expect(shimmer).not.toBeVisible({ timeout: 30000 })
  }

  async getConversationLength() {
    const userMessages = await this.page.locator('.chat-message-user').count()
    const assistantMessages = await this.page.locator('.chat-message-assistant').count()

    return {
      userMessages,
      assistantMessages,
      total: userMessages + assistantMessages
    }
  }

  async clearChat() {
    // Look for clear chat button if it exists
    const clearButton = this.page.locator('button:has-text("Clear Chat")')

    if (await clearButton.isVisible()) {
      await clearButton.click()
      await this.page.click('button:has-text("Confirm")')
    }
  }

  async checkWelcomeMessage() {
    const welcomeMessage = await this.page.locator('text=Welcome to your Strategic Session').isVisible()
    return welcomeMessage
  }

  async verifyConversationPersistence(expectedMessageCount: number) {
    // Refresh the page
    await this.page.reload()

    // Wait for messages to load
    await this.page.waitForSelector('.chat-message-user, .chat-message-assistant', {
      timeout: 10000
    })

    // Count messages after reload
    const { total } = await this.getConversationLength()

    return total === expectedMessageCount
  }
}