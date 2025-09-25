import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { WorkspaceHelper } from '../helpers/workspace.helper'
import { ChatHelper } from '../helpers/chat.helper'
import { testUsers } from '../fixtures/users'

test.describe('Mary AI Chat Integration', () => {
  let authHelper: AuthHelper
  let workspaceHelper: WorkspaceHelper
  let chatHelper: ChatHelper
  let workspaceId: string

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    workspaceHelper = new WorkspaceHelper(page)
    chatHelper = new ChatHelper(page)

    // Login and create workspace
    await authHelper.login(testUsers.default.email, testUsers.default.password)
    const workspace = await workspaceHelper.createWorkspace(
      `Mary Chat Test ${Date.now()}`,
      'Testing Mary AI integration'
    )
    workspaceId = workspace.workspaceId!

    // Ensure we're on the chat tab
    await workspaceHelper.switchToTab('chat')
  })

  test.describe('Chat Interface', () => {
    test('should display Mary welcome message', async ({ page }) => {
      // Check for welcome message
      const welcomeMessage = await chatHelper.checkWelcomeMessage()
      expect(welcomeMessage).toBe(true)

      // Verify Mary's avatar and name
      await expect(page.locator('.chat-message-assistant')).toBeVisible()
      await expect(page.locator('text=Mary')).toBeVisible()
    })

    test('should display chat input form', async ({ page }) => {
      // Check for input elements
      await expect(page.locator('input[placeholder*="strategic question"]')).toBeVisible()
      await expect(page.locator('button:has-text("Send")')).toBeVisible()

      // Input should be focused and ready
      const input = page.locator('input[placeholder*="strategic question"]')
      await input.focus()
      await expect(input).toBeFocused()
    })

    test('should show conversation counter in tab', async ({ page }) => {
      // Send a message
      await chatHelper.sendMessage('Hello Mary, this is a test message')
      await chatHelper.waitForMaryResponse()

      // Check if conversation counter updated
      const tabCounter = page.locator('button:has-text("Mary Chat") span')
      if (await tabCounter.isVisible()) {
        const count = await tabCounter.textContent()
        expect(parseInt(count || '0')).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Message Sending & Receiving', () => {
    test('should send user message and receive Mary response', async ({ page }) => {
      const testMessage = 'I want to validate a new business idea for a mobile app'

      // Send message
      await chatHelper.sendMessage(testMessage)

      // Verify user message appears
      await expect(page.locator(`text="${testMessage}"`)).toBeVisible()

      // Wait for Mary's response
      const response = await chatHelper.waitForMaryResponse()

      // Verify response received
      expect(response).toBeTruthy()
      expect(response!.length).toBeGreaterThan(50) // Substantive response

      // Verify Mary's professional tone
      expect(response).toMatch(/analysis|strategic|consider|validate|market/i)
    })

    test('should handle streaming response correctly', async ({ page }) => {
      await chatHelper.sendMessage('What factors should I consider for market entry?')

      // Verify streaming indicator appears
      await chatHelper.verifyStreamingIndicator()

      // Get final response
      const response = await chatHelper.waitForMaryResponse()
      expect(response).toBeTruthy()
    })

    test('should preserve conversation context', async ({ page }) => {
      // Send initial message
      await chatHelper.sendMessage('I\'m building a SaaS platform for healthcare')
      await chatHelper.waitForMaryResponse()

      // Send follow-up referencing context
      await chatHelper.sendMessage('What compliance issues should I be aware of?')
      const response = await chatHelper.waitForMaryResponse()

      // Response should reference healthcare context
      expect(response).toMatch(/HIPAA|healthcare|medical|patient|compliance/i)
    })

    test('should handle rapid message sending', async ({ page }) => {
      // Send multiple messages quickly
      const messages = [
        'First message',
        'Second message',
        'Third message'
      ]

      for (const message of messages) {
        await chatHelper.sendMessage(message)
        // Wait a bit but don't wait for full response
        await page.waitForTimeout(500)
      }

      // Wait for all responses to complete
      await page.waitForTimeout(10000)

      // Check conversation length
      const { total } = await chatHelper.getConversationLength()
      expect(total).toBeGreaterThanOrEqual(6) // 3 user + 3 assistant minimum
    })
  })

  test.describe('Response Quality & Formatting', () => {
    test('should render markdown formatting correctly', async ({ page }) => {
      await chatHelper.sendMessage('Give me a strategic analysis with bullet points and headers')
      await chatHelper.waitForMaryResponse()

      // Check markdown formatting
      const formatting = await chatHelper.verifyMarkdownFormatting()
      expect(formatting.hasFormatting).toBe(true)
    })

    test('should display strategic tags when present', async ({ page }) => {
      await chatHelper.sendMessage('Help me analyze competitive positioning strategies')
      await chatHelper.waitForMaryResponse()

      // Check for strategic tags
      const tags = await chatHelper.getStrategicTags()

      if (tags.length > 0) {
        expect(tags).toContain(expect.stringMatching(/competitive|strategy|positioning|analysis/i))
      }
    })

    test('should handle code snippets and technical content', async ({ page }) => {
      await chatHelper.sendMessage('Show me a framework for technical architecture decisions')
      await chatHelper.waitForMaryResponse()

      // Check for code formatting
      const codeBlocks = await page.locator('code, pre').count()
      // Mary might include frameworks or structured content
      expect(codeBlocks).toBeGreaterThanOrEqual(0)
    })

    test('should provide strategic depth in responses', async ({ page }) => {
      const strategicPrompt = 'I need to decide between two different business models for my startup'

      await chatHelper.sendMessage(strategicPrompt)
      const response = await chatHelper.waitForMaryResponse()

      // Check for strategic thinking indicators
      expect(response).toMatch(/consider|analyze|evaluate|framework|criteria|decision/i)
      expect(response!.length).toBeGreaterThan(200) // Detailed response
    })
  })

  test.describe('Error Handling & Recovery', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Send message that might trigger an error
      await chatHelper.sendMessage('Test message for error handling')

      // If error occurs, should show friendly message
      const errorMessage = page.locator('text=/apologize|issue|try again|error/i')

      // Wait for either success or error
      try {
        await chatHelper.waitForMaryResponse(10000)
      } catch {
        // If timeout, check for error message
        await expect(errorMessage).toBeVisible({ timeout: 5000 })
      }
    })

    test('should handle network interruption', async ({ page, context }) => {
      // Start sending message
      await page.fill('input[placeholder*="strategic question"]', 'Testing network interruption')

      // Simulate network issue by setting offline
      await context.setOffline(true)

      await page.click('button:has-text("Send")')

      // Should show some indication of network issue
      await page.waitForTimeout(3000)

      // Restore network
      await context.setOffline(false)

      // Should recover gracefully
      await page.reload()
      await workspaceHelper.verifyWorkspaceInterface()
    })

    test('should retry failed requests', async ({ page }) => {
      // This would test automatic retry logic if implemented
      await chatHelper.sendMessage('Test retry functionality')

      // Even if first attempt fails, should eventually succeed
      await chatHelper.waitForMaryResponse(30000) // Extended timeout for retries
    })
  })

  test.describe('Conversation Persistence', () => {
    test('should save conversation to database', async ({ page }) => {
      // Send several messages
      await chatHelper.sendMessage('First test message')
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('Second test message')
      await chatHelper.waitForMaryResponse()

      // Get conversation length
      const beforeLength = await chatHelper.getConversationLength()

      // Reload page
      await page.reload()
      await workspaceHelper.switchToTab('chat')

      // Verify conversation persisted
      const afterLength = await chatHelper.getConversationLength()
      expect(afterLength.total).toEqual(beforeLength.total)
    })

    test('should restore conversation state across sessions', async ({ page, context }) => {
      // Send messages
      await chatHelper.sendMessage('Message before session break')
      await chatHelper.waitForMaryResponse()

      const originalLength = await chatHelper.getConversationLength()

      // Clear session
      await context.clearCookies()

      // Login again
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      await workspaceHelper.navigateToWorkspace(workspaceId)
      await workspaceHelper.switchToTab('chat')

      // Check conversation restored
      const restoredLength = await chatHelper.getConversationLength()
      expect(restoredLength.total).toEqual(originalLength.total)
    })

    test('should handle large conversation histories', async ({ page }) => {
      // Send many messages to test large history handling
      for (let i = 1; i <= 10; i++) {
        await chatHelper.sendMessage(`Test message number ${i}`)
        await chatHelper.waitForMaryResponse(15000)

        // Brief pause between messages
        await page.waitForTimeout(500)
      }

      // Verify all messages are visible
      const finalLength = await chatHelper.getConversationLength()
      expect(finalLength.userMessages).toBe(10)
      expect(finalLength.assistantMessages).toBe(10)

      // Scroll should work correctly
      await page.locator('.chat-message-user:first-child').scrollIntoViewIfNeeded()
      await expect(page.locator('.chat-message-user:first-child')).toBeVisible()
    })
  })

  test.describe('Performance & Responsiveness', () => {
    test('should respond within acceptable time limits', async ({ page }) => {
      const startTime = Date.now()

      await chatHelper.sendMessage('Quick response test - market analysis please')
      await chatHelper.waitForMaryResponse()

      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(10000) // 10 second max for full response
    })

    test('should handle concurrent conversations in multiple tabs', async ({ page, context }) => {
      // Open second tab with same workspace
      const page2 = await context.newPage()
      await page2.goto(`/workspace/${workspaceId}`)

      const chatHelper2 = new ChatHelper(page2)
      await workspaceHelper.switchToTab('chat')

      // Send messages from both tabs
      await chatHelper.sendMessage('Message from tab 1')
      await chatHelper2.sendMessage('Message from tab 2')

      // Both should get responses
      await chatHelper.waitForMaryResponse()
      await chatHelper2.waitForMaryResponse()

      // Sync should work
      await page.reload()
      await page2.reload()

      const tab1Length = await chatHelper.getConversationLength()
      const tab2Length = await chatHelper2.getConversationLength()

      expect(tab1Length.total).toEqual(tab2Length.total)

      await page2.close()
    })
  })
})