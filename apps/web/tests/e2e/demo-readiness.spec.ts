import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { WorkspaceHelper } from '../helpers/workspace.helper'
import { ChatHelper } from '../helpers/chat.helper'
import { BmadHelper } from '../helpers/bmad.helper'
import { testUsers } from '../fixtures/users'
import { analystScenarios } from '../fixtures/test-scenarios'

test.describe('Demo Readiness Validation', () => {
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

  test.describe('Complete User Journey - New User to Strategic Session', () => {
    test('should complete full journey from landing to session completion', async ({ page }) => {
      // Step 1: Landing Page
      await page.goto('/')
      await expect(page).toHaveTitle(/ThinkHaven|Strategic Thinking/i)

      // Step 2: Registration/Login
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      // Step 3: Dashboard Navigation
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('h1:has-text("Your Strategic Workspaces")')).toBeVisible()

      // Step 4: Workspace Creation
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Demo Readiness Validation',
        'Complete end-to-end journey test'
      )

      // Step 5: Mary Chat Interaction
      await workspaceHelper.switchToTab('chat')
      await chatHelper.sendMessage('I need help validating a new product idea for the healthcare market')
      const response = await chatHelper.waitForMaryResponse()

      expect(response).toBeTruthy()
      expect(response!.length).toBeGreaterThan(100)
      expect(response).toMatch(/healthcare|market|validation|product/i)

      // Step 6: BMad Method Session
      await workspaceHelper.switchToTab('bmad')
      await bmadHelper.selectPathway('new-idea')

      // Progress through session
      const options = await bmadHelper.getElicitationOptions()
      expect(options.length).toBeGreaterThan(0)

      if (options.length > 0) {
        await bmadHelper.selectElicitationOption(1)
        await page.waitForTimeout(2000)

        // Verify session progression
        const status = await bmadHelper.getSessionStatus()
        expect(status.timer).toBeTruthy()
        expect(status.phase).toBeTruthy()
      }

      // Step 7: Canvas/Visual Output Verification
      const document = await bmadHelper.getGeneratedDocument()
      if (document) {
        expect(document.length).toBeGreaterThan(50)
      }

      // Step 8: Session Management
      await bmadHelper.pauseSession()
      await expect(page.locator('button:has-text("Resume Session")')).toBeVisible()

      await bmadHelper.resumeSession()
      await expect(page.locator('button:has-text("Pause Session")')).toBeVisible()

      // Journey completed successfully
      expect(true).toBe(true) // Placeholder for journey completion
    })
  })

  test.describe('Five Strategic Analysis Scenarios - Demo Quality', () => {
    test('should execute all five analyst scenarios with professional quality', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      const scenarios = Object.values(analystScenarios)
      const results: Array<{
        scenario: string
        responseTime: number
        responseQuality: number
        hasStrategicDepth: boolean
      }> = []

      for (const scenario of scenarios) {
        // Create dedicated workspace for each scenario
        const { workspaceId } = await workspaceHelper.createWorkspace(
          `Demo: ${scenario.name}`,
          'Analyst scenario for demo validation'
        )
        await workspaceHelper.switchToTab('chat')

        const startTime = Date.now()

        // Execute scenario
        await chatHelper.sendMessage(scenario.initialPrompt)
        const response = await chatHelper.waitForMaryResponse()

        const responseTime = Date.now() - startTime

        // Analyze response quality
        const responseQuality = analyzeResponseQuality(response!, scenario)
        const hasStrategicDepth = response!.length > 300 &&
                                /analy|strateg|framework|consider|evaluat/i.test(response!)

        results.push({
          scenario: scenario.name,
          responseTime,
          responseQuality,
          hasStrategicDepth
        })

        // Execute follow-up to test depth
        if (scenario.followUpQuestions.length > 0) {
          await chatHelper.sendMessage(scenario.followUpQuestions[0])
          const followUp = await chatHelper.waitForMaryResponse()

          expect(followUp).toBeTruthy()
          expect(followUp!.length).toBeGreaterThan(100)
        }

        // Navigate back to dashboard for next scenario
        await page.goto('/dashboard')
      }

      // Validate overall results
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      const avgQuality = results.reduce((sum, r) => sum + r.responseQuality, 0) / results.length
      const strategicDepthCount = results.filter(r => r.hasStrategicDepth).length

      expect(avgResponseTime).toBeLessThan(15000) // Average under 15 seconds
      expect(avgQuality).toBeGreaterThan(7) // Quality score out of 10
      expect(strategicDepthCount).toEqual(scenarios.length) // All should have strategic depth
    })

    function analyzeResponseQuality(response: string, scenario: any): number {
      let score = 5 // Base score

      // Check for expected topics
      const topicsFound = scenario.expectedTopics.filter((topic: string) =>
        response.toLowerCase().includes(topic.toLowerCase())
      ).length
      score += (topicsFound / scenario.expectedTopics.length) * 3

      // Check for validation points
      const validationPointsMet = scenario.validationPoints.filter((point: string) => {
        const keywords = point.toLowerCase().split(' ')
        return keywords.some(keyword => response.toLowerCase().includes(keyword))
      }).length
      score += (validationPointsMet / scenario.validationPoints.length) * 2

      return Math.min(score, 10)
    }
  })

  test.describe('Performance Under Demo Conditions', () => {
    test('should maintain performance during demo presentation', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      // Simulate demo conditions - rapid interactions
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Demo Performance Test',
        'Testing performance under demo conditions'
      )

      // Test rapid tab switching (common during demos)
      const switchTimes: number[] = []

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now()

        await workspaceHelper.switchToTab('chat')
        await workspaceHelper.switchToTab('bmad')

        const switchTime = Date.now() - startTime
        switchTimes.push(switchTime)

        await page.waitForTimeout(500)
      }

      const avgSwitchTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length
      expect(avgSwitchTime).toBeLessThan(2000) // Tab switching under 2 seconds

      // Test multiple rapid messages (Q&A session simulation)
      await workspaceHelper.switchToTab('chat')

      const rapidMessages = [
        'What markets should we consider?',
        'How do we price this competitively?',
        'What are the key risks?',
        'When should we launch?'
      ]

      const messageTimes: number[] = []

      for (const message of rapidMessages) {
        const startTime = Date.now()
        await chatHelper.sendMessage(message)
        await chatHelper.waitForMaryResponse()
        const messageTime = Date.now() - startTime
        messageTimes.push(messageTime)
      }

      const avgMessageTime = messageTimes.reduce((a, b) => a + b, 0) / messageTimes.length
      expect(avgMessageTime).toBeLessThan(12000) // Messages under 12 seconds average
    })

    test('should handle presenter mistakes gracefully', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Error Handling Demo',
        'Testing error recovery during demos'
      )

      // Test common presenter mistakes

      // 1. Rapid clicking
      await workspaceHelper.switchToTab('chat')
      const sendButton = page.locator('button:has-text("Send")')

      await page.fill('input[placeholder*="strategic question"]', 'Test rapid clicking behavior')

      // Click multiple times rapidly
      await sendButton.click()
      await sendButton.click()
      await sendButton.click()

      // Should handle gracefully without duplicates
      await chatHelper.waitForMaryResponse()
      const messageCount = await chatHelper.getConversationLength()
      expect(messageCount.userMessages).toBe(1) // Should not duplicate

      // 2. Page refresh during interaction
      await chatHelper.sendMessage('Test page refresh recovery')
      await page.reload()
      await workspaceHelper.verifyWorkspaceInterface()

      // Should recover conversation state
      const recoveredCount = await chatHelper.getConversationLength()
      expect(recoveredCount.total).toBeGreaterThan(0)

      // 3. Network interruption simulation
      await page.context().setOffline(true)
      await page.fill('input[placeholder*="strategic question"]', 'Test offline handling')
      await page.click('button:has-text("Send")')

      await page.context().setOffline(false)
      await page.reload()
      await workspaceHelper.verifyWorkspaceInterface() // Should recover
    })
  })

  test.describe('Visual Quality for Public Demonstration', () => {
    test('should display professionally on projection screens', async ({ page }) => {
      // Test various screen sizes/resolutions common for presentations
      const presentationSizes = [
        { width: 1920, height: 1080 }, // Full HD projector
        { width: 1366, height: 768 },  // Common laptop/projector
        { width: 1024, height: 768 }   // Older projectors
      ]

      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Visual Quality Test',
        'Testing presentation display quality'
      )

      for (const size of presentationSizes) {
        await page.setViewportSize(size)

        // Verify interface remains usable
        await workspaceHelper.verifyWorkspaceInterface()

        // Check text readability
        const heading = page.locator('h1').first()
        const headingSize = await heading.evaluate(el => {
          const styles = window.getComputedStyle(el)
          return {
            fontSize: styles.fontSize,
            lineHeight: styles.lineHeight,
            color: styles.color
          }
        })

        expect(parseInt(headingSize.fontSize)).toBeGreaterThan(16) // Readable heading size

        // Test chat interface visibility
        await workspaceHelper.switchToTab('chat')
        await expect(page.locator('input[placeholder*="strategic question"]')).toBeVisible()
        await expect(page.locator('button:has-text("Send")')).toBeVisible()

        // Test BMad interface visibility
        await workspaceHelper.switchToTab('bmad')
        await expect(page.locator('text=I have a brand new idea')).toBeVisible()
      }
    })

    test('should maintain branding consistency for public showcase', async ({ page }) => {
      await page.goto('/')

      // Check consistent branding across all pages
      const pages = ['/', '/demo', '/login']

      for (const pagePath of pages) {
        await page.goto(pagePath)

        // Check for consistent branding elements
        const title = await page.title()
        expect(title.toLowerCase()).toContain('thinkhaven')

        // Check for consistent color scheme
        const bodyStyles = await page.evaluate(() => {
          const body = document.body
          const styles = window.getComputedStyle(body)
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color
          }
        })

        expect(bodyStyles.backgroundColor).toBeTruthy()
        expect(bodyStyles.color).toBeTruthy()
      }
    })

    test('should show impressive visual outputs for analyst demos', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Visual Demo Test',
        'Testing visual outputs for demos'
      )

      // Test Mary chat visual quality
      await workspaceHelper.switchToTab('chat')
      await chatHelper.sendMessage('Create a comprehensive market analysis framework with structured outputs')
      const response = await chatHelper.waitForMaryResponse()

      // Check markdown rendering quality
      const formatting = await chatHelper.verifyMarkdownFormatting()
      expect(formatting.hasFormatting).toBe(true)

      // Test BMad visual progression
      await workspaceHelper.switchToTab('bmad')
      await bmadHelper.selectPathway('new-idea')

      // Verify visual session elements
      await expect(page.locator('[data-testid="session-timer"]')).toBeVisible()
      await expect(page.locator('.elicitation-panel')).toBeVisible()

      // Check progress visualization
      const sessionStatus = await bmadHelper.getSessionStatus()
      expect(sessionStatus.progress).toBeGreaterThanOrEqual(0)

      // Test canvas pane visual quality
      await expect(page.locator('.canvas-pane')).toBeVisible()
      const canvasContent = await page.locator('.canvas-container').innerHTML()
      expect(canvasContent.length).toBeGreaterThan(100) // Has meaningful content
    })
  })

  test.describe('Reliability for Live Demonstrations', () => {
    test('should work consistently across multiple demo runs', async ({ page }) => {
      const demoRuns = 3
      const results: boolean[] = []

      for (let run = 1; run <= demoRuns; run++) {
        try {
          // Fresh session for each run
          await page.context().clearCookies()
          await authHelper.login(testUsers.default.email, testUsers.default.password)

          const { workspaceId } = await workspaceHelper.createWorkspace(
            `Demo Run ${run}`,
            'Consistency testing'
          )

          // Execute core demo flow
          await workspaceHelper.switchToTab('chat')
          await chatHelper.sendMessage('Demonstrate strategic analysis capabilities')
          await chatHelper.waitForMaryResponse()

          await workspaceHelper.switchToTab('bmad')
          await bmadHelper.selectPathway('business-model')

          const options = await bmadHelper.getElicitationOptions()
          if (options.length > 0) {
            await bmadHelper.selectElicitationOption(1)
          }

          results.push(true)
        } catch (error) {
          console.error(`Demo run ${run} failed:`, error)
          results.push(false)
        }
      }

      const successRate = results.filter(r => r).length / results.length
      expect(successRate).toBe(1.0) // 100% success rate required for demos
    })

    test('should handle audience questions flow', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Audience Q&A Test',
        'Testing audience interaction scenarios'
      )

      await workspaceHelper.switchToTab('chat')

      // Simulate various audience question types
      const audienceQuestions = [
        'How does this compare to ChatGPT?',
        'What makes your AI different?',
        'Can it help with technical product decisions?',
        'How accurate are the strategic recommendations?',
        'What about data privacy and security?'
      ]

      for (const question of audienceQuestions) {
        await chatHelper.sendMessage(question)
        const response = await chatHelper.waitForMaryResponse()

        expect(response).toBeTruthy()
        expect(response!.length).toBeGreaterThan(100)

        // Should provide substantive, professional responses
        expect(response).toMatch(/strategic|analysis|business|framework|consider/i)
      }

      // Test ability to handle follow-up questions
      await chatHelper.sendMessage('Can you elaborate on that last point?')
      const followUp = await chatHelper.waitForMaryResponse()

      expect(followUp).toBeTruthy()
      expect(followUp!.length).toBeGreaterThan(50)
    })

    test('should recover from common demo failures', async ({ page, context }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Failure Recovery Test',
        'Testing recovery from demo failures'
      )

      // Test recovery from browser tab closure
      const newPage = await context.newPage()
      await newPage.goto(`/workspace/${workspaceId}`)
      await page.close()

      // Should continue on new page
      const newWorkspaceHelper = new WorkspaceHelper(newPage)
      await newWorkspaceHelper.verifyWorkspaceInterface()

      // Test recovery from accidental navigation
      await newPage.goto('/')
      await newPage.goto(`/workspace/${workspaceId}`)
      await newWorkspaceHelper.verifyWorkspaceInterface()

      // Test recovery from API timeout
      await newWorkspaceHelper.switchToTab('chat')
      const newChatHelper = new ChatHelper(newPage)

      // Send message that might timeout
      await newChatHelper.sendMessage('Test recovery from potential timeout scenarios')

      try {
        await newChatHelper.waitForMaryResponse(30000)
      } catch {
        // If timeout, interface should still be functional
        await expect(newPage.locator('input[placeholder*="strategic question"]')).toBeVisible()
        await expect(newPage.locator('button:has-text("Send")')).toBeVisible()
      }

      await newPage.close()
    })
  })

  test.describe('Final Demo Validation Checklist', () => {
    test('should pass all critical demo requirements', async ({ page }) => {
      const validationChecklist = {
        landingPageLoads: false,
        authenticationWorks: false,
        dashboardDisplays: false,
        workspaceCreation: false,
        maryChatResponds: false,
        bmadSessionStarts: false,
        visualOutputsWork: false,
        performanceAcceptable: false,
        mobileResponsive: false,
        demoModeAccessible: false
      }

      // 1. Landing page loads
      await page.goto('/')
      await expect(page).toHaveTitle(/ThinkHaven|Strategic/i)
      validationChecklist.landingPageLoads = true

      // 2. Authentication works
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      await expect(page).toHaveURL('/dashboard')
      validationChecklist.authenticationWorks = true

      // 3. Dashboard displays
      await expect(page.locator('h1:has-text("Your Strategic Workspaces")')).toBeVisible()
      validationChecklist.dashboardDisplays = true

      // 4. Workspace creation
      const { workspaceId } = await workspaceHelper.createWorkspace(
        'Final Validation',
        'Complete demo validation test'
      )
      validationChecklist.workspaceCreation = true

      // 5. Mary chat responds
      await workspaceHelper.switchToTab('chat')
      await chatHelper.sendMessage('Final validation test message')
      const response = await chatHelper.waitForMaryResponse()
      expect(response).toBeTruthy()
      validationChecklist.maryChatResponds = true

      // 6. BMad session starts
      await workspaceHelper.switchToTab('bmad')
      await bmadHelper.selectPathway('new-idea')
      await expect(page.locator('[data-testid="session-timer"]')).toBeVisible()
      validationChecklist.bmadSessionStarts = true

      // 7. Visual outputs work
      await expect(page.locator('.canvas-pane')).toBeVisible()
      await expect(page.locator('.dual-pane-container')).toBeVisible()
      validationChecklist.visualOutputsWork = true

      // 8. Performance acceptable
      const startTime = Date.now()
      await page.reload()
      await workspaceHelper.verifyWorkspaceInterface()
      const reloadTime = Date.now() - startTime
      expect(reloadTime).toBeLessThan(5000)
      validationChecklist.performanceAcceptable = true

      // 9. Mobile responsive
      await page.setViewportSize({ width: 375, height: 667 })
      await workspaceHelper.verifyWorkspaceInterface()
      validationChecklist.mobileResponsive = true

      // 10. Demo mode accessible
      await page.goto('/demo')
      await expect(page.locator('h1')).toBeVisible()
      validationChecklist.demoModeAccessible = true

      // Verify all items passed
      const allPassed = Object.values(validationChecklist).every(item => item === true)
      expect(allPassed).toBe(true)

      // Log results for visibility
      console.log('Demo Validation Checklist:', validationChecklist)
    })
  })
})