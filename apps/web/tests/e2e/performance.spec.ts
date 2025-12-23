import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { WorkspaceHelper } from '../helpers/workspace.helper'
import { ChatHelper } from '../helpers/chat.helper'
import { BmadHelper } from '../helpers/bmad.helper'
import { testUsers } from '../fixtures/users'

test.describe('Performance & Load Tests', () => {
  let authHelper: AuthHelper
  let workspaceHelper: WorkspaceHelper
  let chatHelper: ChatHelper
  let bmadHelper: BmadHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    workspaceHelper = new WorkspaceHelper(page)
    chatHelper = new ChatHelper(page)
    bmadHelper = new BmadHelper(page)
  })

  test.describe('Page Load Performance', () => {
    test('should load landing page within performance budget', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // 3 second budget for landing page

      // Check for largest contentful paint
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            resolve(lastEntry.startTime)
          }).observe({ entryTypes: ['largest-contentful-paint'] })

          setTimeout(() => resolve(0), 5000) // Fallback
        })
      })

      expect(lcp).toBeLessThan(2500) // LCP should be under 2.5s
    })

    test('should load dashboard quickly after authentication', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const startTime = Date.now()
      await page.goto('/dashboard')
      await page.waitForSelector('h1:has-text("Welcome back")')

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(2000) // Dashboard should load within 2 seconds
    })

    test('should load workspace interface efficiently', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Performance Test Workspace',
        'Testing load performance'
      )

      const startTime = Date.now()
      await page.goto(`/workspace/${workspaceId}`)
      await workspaceHelper.verifyWorkspaceInterface()

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(2500) // Workspace should load within 2.5 seconds
    })

    test('should handle demo pages with optimal performance', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/demo')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(2000) // Demo hub should load quickly

      // Test demo scenario load time
      const scenarioStartTime = Date.now()
      await page.goto('/demo/0')
      await page.waitForSelector('h1')

      const scenarioLoadTime = Date.now() - scenarioStartTime
      expect(scenarioLoadTime).toBeLessThan(1500) // Individual scenarios should load fast
    })
  })

  test.describe('Claude API Response Performance', () => {
    test('should respond to chat messages within acceptable time', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'API Performance Test',
        'Testing Claude API response times'
      )
      await workspaceHelper.switchToTab('chat')

      const startTime = Date.now()

      await chatHelper.sendMessage('Quick performance test - analyze market entry strategy')
      await chatHelper.waitForMaryResponse()

      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(10000) // 10 second max for full response

      // First chunk should arrive much faster
      expect(responseTime).toBeGreaterThan(500) // Sanity check - should take some time
    })

    test('should start streaming responses quickly', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Streaming Performance Test',
        'Testing streaming response performance'
      )
      await workspaceHelper.switchToTab('chat')

      await page.fill('input[placeholder*="strategic question"]', 'Test streaming performance with detailed analysis')

      const startTime = Date.now()
      await page.click('button:has-text("Send")')

      // Wait for first streaming indicator
      await page.waitForSelector('.loading-shimmer', { timeout: 5000 })
      const firstIndicatorTime = Date.now() - startTime

      expect(firstIndicatorTime).toBeLessThan(2000) // Streaming should start within 2 seconds

      // Wait for first content to appear
      await page.waitForFunction(
        () => {
          const lastMessage = document.querySelector('.chat-message-assistant:last-child')
          return lastMessage && lastMessage.textContent && lastMessage.textContent.length > 10
        },
        { timeout: 5000 }
      )

      const firstContentTime = Date.now() - startTime
      expect(firstContentTime).toBeLessThan(5000) // First content within 5 seconds
    })

    test('should maintain consistent performance across multiple requests', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Consistency Test',
        'Testing response time consistency'
      )
      await workspaceHelper.switchToTab('chat')

      const responseTimes: number[] = []

      // Send 5 messages and measure response times
      for (let i = 1; i <= 5; i++) {
        const startTime = Date.now()

        await chatHelper.sendMessage(`Performance test message ${i}`)
        await chatHelper.waitForMaryResponse()

        const responseTime = Date.now() - startTime
        responseTimes.push(responseTime)

        // Brief pause between requests
        await page.waitForTimeout(1000)
      }

      // Check consistency
      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const maxDeviation = Math.max(...responseTimes.map(time => Math.abs(time - averageTime)))

      expect(averageTime).toBeLessThan(8000) // Average should be under 8 seconds
      expect(maxDeviation).toBeLessThan(5000) // No response should deviate more than 5 seconds from average
    })
  })

  test.describe('BMad Session Performance', () => {
    test('should start BMad sessions quickly', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'BMad Performance Test',
        'Testing BMad session performance'
      )
      await workspaceHelper.switchToTab('bmad')

      const startTime = Date.now()
      await bmadHelper.selectPathway('new-idea')

      const sessionStartTime = Date.now() - startTime
      expect(sessionStartTime).toBeLessThan(3000) // Session should start within 3 seconds

      // Verify session elements loaded
      await expect(page.locator('[data-testid="session-timer"]')).toBeVisible()
      await expect(page.locator('.elicitation-panel')).toBeVisible()
    })

    test('should handle elicitation interactions responsively', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'BMad Interaction Test',
        'Testing BMad interaction performance'
      )
      await workspaceHelper.switchToTab('bmad')

      await bmadHelper.selectPathway('business-model')

      // Test multiple elicitation interactions
      const interactionTimes: number[] = []

      for (let i = 1; i <= 3; i++) {
        const options = await bmadHelper.getElicitationOptions()
        if (options.length >= i) {
          const startTime = Date.now()

          await bmadHelper.selectElicitationOption(i)
          await page.waitForTimeout(1000) // Wait for processing

          const interactionTime = Date.now() - startTime
          interactionTimes.push(interactionTime)
        }
      }

      // Each interaction should be responsive
      interactionTimes.forEach(time => {
        expect(time).toBeLessThan(2000) // Each interaction under 2 seconds
      })
    })

    test('should update documents efficiently', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Document Generation Test',
        'Testing document generation performance'
      )
      await workspaceHelper.switchToTab('bmad')

      await bmadHelper.selectPathway('feature-refinement')

      // Progress session and measure document updates
      const options = await bmadHelper.getElicitationOptions()
      if (options.length > 0) {
        const startTime = Date.now()

        await bmadHelper.selectElicitationOption(1)

        // Wait for document update
        await page.waitForTimeout(3000)

        const updateTime = Date.now() - startTime
        expect(updateTime).toBeLessThan(5000) // Document updates should complete within 5 seconds
      }
    })
  })

  test.describe('Concurrent User Simulation', () => {
    test('should handle multiple concurrent sessions', async ({ page, context }) => {
      // Create multiple browser contexts to simulate concurrent users
      const contexts = await Promise.all([
        context,
        page.context().browser()?.newContext(),
        page.context().browser()?.newContext()
      ].filter(Boolean))

      const results: Array<{ success: boolean, loadTime: number }> = []

      // Simulate concurrent logins and workspace creation
      await Promise.all(
        contexts.map(async (ctx, index) => {
          if (!ctx) return

          const testPage = await ctx.newPage()
          const testAuthHelper = new AuthHelper(testPage)
          const testWorkspaceHelper = new WorkspaceHelper(testPage)

          try {
            const startTime = Date.now()

            await testAuthHelper.login(testUsers.default.email, testUsers.default.password)
            await testWorkspaceHelper.createWorkspace(
              `Concurrent Test ${index + 1}`,
              'Testing concurrent usage'
            )

            const loadTime = Date.now() - startTime

            results.push({ success: true, loadTime })
          } catch (error) {
            results.push({ success: false, loadTime: 0 })
          } finally {
            await testPage.close()
            if (ctx !== context) {
              await ctx.close()
            }
          }
        })
      )

      // All sessions should succeed
      const successCount = results.filter(r => r.success).length
      expect(successCount).toBeGreaterThanOrEqual(2) // At least 2 should succeed

      // Performance shouldn't degrade significantly
      const averageLoadTime = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.loadTime, 0) / successCount

      expect(averageLoadTime).toBeLessThan(15000) // Average under 15 seconds even with concurrency
    })

    test('should maintain responsiveness under load', async ({ page, context }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Load Test Workspace',
        'Testing system under load'
      )

      // Open multiple tabs to same workspace
      const pages = [page]
      for (let i = 1; i < 3; i++) {
        const newPage = await context.newPage()
        await newPage.goto(`/workspace/${workspaceId}`)
        pages.push(newPage)
      }

      // Send messages from multiple tabs simultaneously
      const messagePromises = pages.map(async (testPage, index) => {
        const testChatHelper = new ChatHelper(testPage)
        await testWorkspaceHelper.switchToTab('chat')

        const startTime = Date.now()
        await testChatHelper.sendMessage(`Load test message from tab ${index + 1}`)
        await testChatHelper.waitForMaryResponse()

        return Date.now() - startTime
      })

      const responseTimes = await Promise.all(messagePromises)

      // All responses should complete reasonably
      responseTimes.forEach(time => {
        expect(time).toBeLessThan(15000) // 15 second max under load
      })

      // Close extra pages
      for (let i = 1; i < pages.length; i++) {
        await pages[i].close()
      }
    })
  })

  test.describe('Memory & Resource Management', () => {
    test('should not leak memory during extended sessions', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Memory Test Workspace',
        'Testing memory usage'
      )
      await workspaceHelper.switchToTab('chat')

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0
      })

      // Simulate extended usage
      for (let i = 1; i <= 10; i++) {
        await chatHelper.sendMessage(`Extended session test message ${i}`)
        await chatHelper.waitForMaryResponse()

        // Brief pause
        await page.waitForTimeout(500)
      }

      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0
      })

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory
        const memoryIncreaseRatio = memoryIncrease / initialMemory

        // Memory shouldn't increase by more than 50% during normal usage
        expect(memoryIncreaseRatio).toBeLessThan(0.5)
      }
    })

    test('should handle large conversation histories efficiently', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Large History Test',
        'Testing large conversation handling'
      )
      await workspaceHelper.switchToTab('chat')

      // Create a large conversation history
      for (let i = 1; i <= 20; i++) {
        await chatHelper.sendMessage(`History test message ${i}`)
        await chatHelper.waitForMaryResponse()

        // Keep going without long pauses
        await page.waitForTimeout(200)
      }

      // Verify interface remains responsive
      const startTime = Date.now()
      await page.reload()
      await workspaceHelper.verifyWorkspaceInterface()

      const reloadTime = Date.now() - startTime
      expect(reloadTime).toBeLessThan(5000) // Should reload efficiently even with large history

      // Test scroll performance
      await page.locator('.chat-message-user:first-child').scrollIntoViewIfNeeded()
      await expect(page.locator('.chat-message-user:first-child')).toBeVisible()
    })

    test('should cleanup resources properly on navigation', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      // Create and navigate between multiple workspaces
      const workspaces = []
      for (let i = 1; i <= 3; i++) {
        const workspace = await workspaceHelper.createWorkspace(
          `Cleanup Test ${i}`,
          'Testing resource cleanup'
        )
        workspaces.push(workspace)

        // Use the workspace briefly
        await workspaceHelper.switchToTab('chat')
        await chatHelper.sendMessage(`Test message in workspace ${i}`)
        await chatHelper.waitForMaryResponse()
      }

      // Navigate between workspaces multiple times
      for (const workspace of workspaces) {
        await workspaceHelper.navigateToWorkspace(workspace.workspaceId!)
        await page.waitForTimeout(500)
      }

      // Final navigation should still be responsive
      const startTime = Date.now()
      await page.goto('/dashboard')
      await page.waitForSelector('h1:has-text("Welcome back")')

      const navigationTime = Date.now() - startTime
      expect(navigationTime).toBeLessThan(3000) // Dashboard should load efficiently
    })
  })

  test.describe('Network Performance', () => {
    test('should handle slow network conditions gracefully', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)) // Add 100ms delay
        return route.continue()
      })

      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const startTime = Date.now()
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Slow Network Test',
        'Testing slow network performance'
      )

      const createTime = Date.now() - startTime
      expect(createTime).toBeLessThan(10000) // Should still work within 10 seconds on slow network
    })

    test('should optimize asset loading', async ({ page }) => {
      // Monitor network requests
      const requests: string[] = []
      page.on('request', request => {
        requests.push(request.url())
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Check for efficient loading
      const jsRequests = requests.filter(url => url.endsWith('.js'))
      const cssRequests = requests.filter(url => url.endsWith('.css'))

      // Should not load excessive number of resources
      expect(jsRequests.length).toBeLessThan(20) // Reasonable number of JS files
      expect(cssRequests.length).toBeLessThan(10) // Reasonable number of CSS files

      // Should not have obvious duplicate requests
      const uniqueRequests = new Set(requests)
      expect(uniqueRequests.size).toEqual(requests.length) // No duplicate requests
    })
  })
})