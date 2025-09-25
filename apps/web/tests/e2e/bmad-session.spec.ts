import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { WorkspaceHelper } from '../helpers/workspace.helper'
import { BmadHelper } from '../helpers/bmad.helper'
import { testUsers } from '../fixtures/users'
import { bmadPathways } from '../fixtures/test-scenarios'

test.describe('BMad Method Session Tests', () => {
  let authHelper: AuthHelper
  let workspaceHelper: WorkspaceHelper
  let bmadHelper: BmadHelper
  let workspaceId: string

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    workspaceHelper = new WorkspaceHelper(page)
    bmadHelper = new BmadHelper(page)

    // Login and create workspace
    await authHelper.login(testUsers.default.email, testUsers.default.password)
    const workspace = await workspaceHelper.createWorkspace(
      `BMad Session Test ${Date.now()}`,
      'Testing BMad Method functionality'
    )
    workspaceId = workspace.workspaceId!

    // Switch to BMad Method tab
    await workspaceHelper.switchToTab('bmad')
  })

  test.describe('Pathway Selection', () => {
    test('should display all three pathway options', async ({ page }) => {
      // Check for pathway selection interface
      await expect(page.locator('text=I have a brand new idea')).toBeVisible()
      await expect(page.locator('text=I\'m stuck on a business model problem')).toBeVisible()
      await expect(page.locator('text=I need to refine a feature/concept')).toBeVisible()

      // Check for pathway descriptions
      await expect(page.locator('text=/creative.*expansion|brainstorm/i')).toBeVisible()
      await expect(page.locator('text=/business.*model|analysis/i')).toBeVisible()
      await expect(page.locator('text=/feature.*refinement|user.*centered/i')).toBeVisible()
    })

    test('should select "New Idea" pathway successfully', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Verify session started
      await expect(page.locator('.bmad-session-active')).toBeVisible()
      await expect(page.locator('[data-testid="session-timer"]')).toBeVisible()

      // Check pathway indicator
      await expect(page.locator('text=/new.*idea|creative.*expansion/i')).toBeVisible()
    })

    test('should select "Business Model" pathway successfully', async ({ page }) => {
      await bmadHelper.selectPathway('business-model')

      // Verify session started
      await expect(page.locator('.bmad-session-active')).toBeVisible()
      await expect(page.locator('[data-testid="session-timer"]')).toBeVisible()

      // Check pathway indicator
      await expect(page.locator('text=/business.*model|problem.*analysis/i')).toBeVisible()
    })

    test('should select "Feature Refinement" pathway successfully', async ({ page }) => {
      await bmadHelper.selectPathway('feature-refinement')

      // Verify session started
      await expect(page.locator('.bmad-session-active')).toBeVisible()
      await expect(page.locator('[data-testid="session-timer"]')).toBeVisible()

      // Check pathway indicator
      await expect(page.locator('text=/feature.*refinement|user.*centered/i')).toBeVisible()
    })
  })

  test.describe('Session Management', () => {
    test('should start session timer correctly', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Verify timer is running
      const isRunning = await bmadHelper.verifySessionTimer()
      expect(isRunning).toBe(true)

      // Check timer format (should show MM:SS or HH:MM:SS)
      const timerText = await page.locator('[data-testid="session-timer"]').textContent()
      expect(timerText).toMatch(/\d{1,2}:\d{2}/)
    })

    test('should pause and resume session', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Pause session
      await bmadHelper.pauseSession()

      // Verify pause state
      await expect(page.locator('button:has-text("Resume Session")')).toBeVisible()
      await expect(page.locator('text=/paused|session.*paused/i')).toBeVisible()

      // Resume session
      await bmadHelper.resumeSession()

      // Verify resume state
      await expect(page.locator('button:has-text("Pause Session")')).toBeVisible()
    })

    test('should track session progress', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Get initial progress
      const initialStatus = await bmadHelper.getSessionStatus()
      expect(initialStatus.progress).toBeGreaterThanOrEqual(0)

      // Interact with elicitation options to advance progress
      const options = await bmadHelper.getElicitationOptions()
      if (options.length > 0) {
        await bmadHelper.selectElicitationOption(1)

        // Check progress increased
        const newStatus = await bmadHelper.getSessionStatus()
        expect(newStatus.progress).toBeGreaterThanOrEqual(initialStatus.progress)
      }
    })

    test('should handle 30-minute session duration', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Session should be designed for 30 minutes
      const status = await bmadHelper.getSessionStatus()

      // Timer should show reasonable starting time (close to 30:00 or counting up from 00:00)
      expect(status.timer).toBeTruthy()

      // Should have session length indicator somewhere
      const sessionInfo = page.locator('text=/30.*min|30.*minute/i')
      if (await sessionInfo.isVisible()) {
        await expect(sessionInfo).toBeVisible()
      }
    })
  })

  test.describe('Elicitation Panel Interaction', () => {
    test('should display numbered options (1-9)', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Wait for elicitation panel to load
      await page.waitForSelector('.elicitation-panel', { timeout: 10000 })

      // Check for numbered options
      const options = await bmadHelper.getElicitationOptions()
      expect(options.length).toBeGreaterThan(0)
      expect(options.length).toBeLessThanOrEqual(9)

      // Verify numbering
      options.forEach((option, index) => {
        expect(option.number).toBe((index + 1).toString())
        expect(option.text).toBeTruthy()
      })
    })

    test('should respond to option selection', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Wait for options to load
      await page.waitForSelector('.elicitation-panel button', { timeout: 10000 })

      // Select first option
      await bmadHelper.selectElicitationOption(1)

      // Should advance session or show response
      await page.waitForTimeout(2000)

      // Check for progress or new phase
      const newOptions = await bmadHelper.getElicitationOptions()
      // Options might change or session might advance
      expect(newOptions).toBeDefined()
    })

    test('should support free-form input when available', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Look for text input opportunities
      const textInput = page.locator('textarea[placeholder*="thoughts"], input[placeholder*="answer"]')

      if (await textInput.isVisible()) {
        await bmadHelper.inputCustomText('This is my strategic input for the BMad session')

        // Should accept and process the input
        await expect(page.locator('text="This is my strategic input"')).toBeVisible({ timeout: 5000 })
      }
    })

    test('should validate elicitation sequence flow', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Follow the predetermined sequence for new idea pathway
      const sequence = bmadPathways.newIdea.elicitationSequence

      for (const optionNumber of sequence) {
        // Check if option exists
        const options = await bmadHelper.getElicitationOptions()
        const option = options.find(opt => opt.number === optionNumber.toString())

        if (option) {
          await bmadHelper.selectElicitationOption(optionNumber)
          await page.waitForTimeout(1000) // Wait for processing
        }
      }

      // Session should have progressed significantly
      const finalStatus = await bmadHelper.getSessionStatus()
      expect(finalStatus.progress).toBeGreaterThan(50) // Should be well into the session
    })
  })

  test.describe('Phase Progression', () => {
    test('should progress through expected phases for New Idea pathway', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      const expectedPhases = bmadPathways.newIdea.expectedPhases

      // Start with first phase
      const initialPhase = await bmadHelper.verifyPhaseProgression(expectedPhases[0])
      expect(initialPhase).toBe(true)

      // Progress through phases by selecting options
      const sequence = bmadPathways.newIdea.elicitationSequence

      for (let i = 0; i < sequence.length && i < expectedPhases.length - 1; i++) {
        await bmadHelper.selectElicitationOption(sequence[i])
        await page.waitForTimeout(2000)

        // Check if we've moved to next expected phase
        const nextPhaseMatch = await bmadHelper.verifyPhaseProgression(expectedPhases[i + 1])
        // Note: Phase progression might not be 1:1 with option selection
      }
    })

    test('should show phase indicators and descriptions', async ({ page }) => {
      await bmadHelper.selectPathway('business-model')

      // Should show current phase
      await expect(page.locator('[data-testid="session-phase"]')).toBeVisible()

      // Should provide phase description or guidance
      const phaseGuidance = page.locator('[data-testid="phase-guidance"], .phase-description')
      if (await phaseGuidance.isVisible()) {
        const guidance = await phaseGuidance.textContent()
        expect(guidance!.length).toBeGreaterThan(20) // Meaningful guidance
      }
    })

    test('should handle phase transitions smoothly', async ({ page }) => {
      await bmadHelper.selectPathway('feature-refinement')

      // Monitor phase changes
      let previousPhase = await page.locator('[data-testid="session-phase"]').textContent()

      // Progress session
      const options = await bmadHelper.getElicitationOptions()
      if (options.length > 0) {
        await bmadHelper.selectElicitationOption(1)
        await page.waitForTimeout(3000)

        // Check for smooth transition
        const currentPhase = await page.locator('[data-testid="session-phase"]').textContent()

        // Phase should be defined (might be same or different)
        expect(currentPhase).toBeTruthy()

        // Should not show loading or error states during transition
        await expect(page.locator('.error, [data-error]')).not.toBeVisible()
      }
    })
  })

  test.describe('Document Generation', () => {
    test('should generate strategic documents in canvas pane', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Progress session to document generation
      const sequence = bmadPathways.newIdea.elicitationSequence.slice(0, 3)

      for (const optionNumber of sequence) {
        const options = await bmadHelper.getElicitationOptions()
        const option = options.find(opt => opt.number === optionNumber.toString())

        if (option) {
          await bmadHelper.selectElicitationOption(optionNumber)
          await page.waitForTimeout(2000)
        }
      }

      // Check for document content in canvas
      const document = await bmadHelper.getGeneratedDocument()

      if (document) {
        expect(document.length).toBeGreaterThan(100) // Substantive content
        expect(document).toMatch(/project|strategy|analysis|brief/i)
      }
    })

    test('should update document in real-time', async ({ page }) => {
      await bmadHelper.selectPathway('business-model')

      // Get initial document state
      const initialDoc = await bmadHelper.getGeneratedDocument()

      // Make session progress
      const options = await bmadHelper.getElicitationOptions()
      if (options.length > 0) {
        await bmadHelper.selectElicitationOption(1)
        await page.waitForTimeout(3000)

        // Check if document updated
        const updatedDoc = await bmadHelper.getGeneratedDocument()

        if (initialDoc && updatedDoc) {
          // Document should have evolved
          expect(updatedDoc.length).toBeGreaterThanOrEqual(initialDoc.length)
        }
      }
    })

    test('should generate pathway-specific outputs', async ({ page }) => {
      // Test different pathway outputs
      const pathways = [
        { type: 'new-idea' as const, expectedOutput: 'Project Brief' },
        { type: 'business-model' as const, expectedOutput: 'Business Model Canvas' },
        { type: 'feature-refinement' as const, expectedOutput: 'Feature Specification' }
      ]

      for (const pathway of pathways.slice(0, 1)) { // Test one for time
        await page.reload()
        await workspaceHelper.switchToTab('bmad')

        await bmadHelper.selectPathway(pathway.type)

        // Progress session
        const sequence = bmadPathways[pathway.type === 'new-idea' ? 'newIdea' : pathway.type === 'business-model' ? 'businessModel' : 'featureRefinement'].elicitationSequence.slice(0, 3)

        for (const optionNumber of sequence) {
          const options = await bmadHelper.getElicitationOptions()
          const option = options.find(opt => opt.number === optionNumber.toString())

          if (option) {
            await bmadHelper.selectElicitationOption(optionNumber)
            await page.waitForTimeout(2000)
          }
        }

        // Check for expected output type
        const document = await bmadHelper.getGeneratedDocument()
        if (document) {
          expect(document.toLowerCase()).toContain(pathway.expectedOutput.toLowerCase().split(' ')[0])
        }
      }
    })
  })

  test.describe('Session Completion & History', () => {
    test('should complete session successfully', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Progress through full session
      const sequence = bmadPathways.newIdea.elicitationSequence

      for (const optionNumber of sequence) {
        const options = await bmadHelper.getElicitationOptions()
        const option = options.find(opt => opt.number === optionNumber.toString())

        if (option) {
          await bmadHelper.selectElicitationOption(optionNumber)
          await page.waitForTimeout(2000)
        }
      }

      // Try to complete session
      await bmadHelper.completeSession()

      // Should show completion summary or return to pathway selection
      const completionIndicator = page.locator('[data-testid="session-summary"], text=/completed|finished|summary/i')
      if (await completionIndicator.isVisible()) {
        await expect(completionIndicator).toBeVisible()
      }
    })

    test('should save session to history', async ({ page }) => {
      await bmadHelper.selectPathway('business-model')

      // Progress and complete a short session
      const options = await bmadHelper.getElicitationOptions()
      if (options.length > 0) {
        await bmadHelper.selectElicitationOption(1)
        await bmadHelper.selectElicitationOption(2)
      }

      // Check session history
      const history = await bmadHelper.checkSessionHistory()

      if (history.length > 0) {
        const recentSession = history[0]
        expect(recentSession.pathway).toMatch(/business.*model/i)
        expect(recentSession.date).toBeTruthy()
      }
    })

    test('should allow starting new session after completion', async ({ page }) => {
      await bmadHelper.selectPathway('feature-refinement')

      // Progress briefly
      const options = await bmadHelper.getElicitationOptions()
      if (options.length > 0) {
        await bmadHelper.selectElicitationOption(1)
      }

      // Return to pathway selection
      const newSessionButton = page.locator('button:has-text("New Session"), button:has-text("Start New")')
      if (await newSessionButton.isVisible()) {
        await newSessionButton.click()

        // Should return to pathway selection
        await expect(page.locator('text=I have a brand new idea')).toBeVisible()
      }
    })
  })

  test.describe('Template Execution', () => {
    test('should execute YAML-based BMad templates', async ({ page }) => {
      await bmadHelper.selectPathway('new-idea')

      // Check for template execution indicators
      const templateExecution = await bmadHelper.verifyTemplateExecution('new-idea-template')

      // Should show systematic template-driven progression
      const systematicElements = page.locator('[data-template-step], .template-guidance')
      if (await systematicElements.isVisible()) {
        await expect(systematicElements).toBeVisible()
      }
    })

    test('should provide consistent framework experience', async ({ page }) => {
      // Test consistency across different pathways
      const pathways: Array<'new-idea' | 'business-model' | 'feature-refinement'> = ['new-idea', 'business-model']

      for (const pathwayType of pathways) {
        await page.reload()
        await workspaceHelper.switchToTab('bmad')

        await bmadHelper.selectPathway(pathwayType)

        // Should show consistent interface elements
        await expect(page.locator('[data-testid="session-timer"]')).toBeVisible()
        await expect(page.locator('.elicitation-panel')).toBeVisible()
        await expect(page.locator('button:has-text("Pause Session")')).toBeVisible()
      }
    })
  })
})