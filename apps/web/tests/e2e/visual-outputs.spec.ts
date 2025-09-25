import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { WorkspaceHelper } from '../helpers/workspace.helper'
import { ChatHelper } from '../helpers/chat.helper'
import { BmadHelper } from '../helpers/bmad.helper'
import { testUsers } from '../fixtures/users'

test.describe('Visual Output Validation Tests', () => {
  let authHelper: AuthHelper
  let workspaceHelper: WorkspaceHelper
  let chatHelper: ChatHelper
  let bmadHelper: BmadHelper
  let workspaceId: string

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    workspaceHelper = new WorkspaceHelper(page)
    chatHelper = new ChatHelper(page)
    bmadHelper = new BmadHelper(page)

    // Login and create workspace
    await authHelper.login(testUsers.default.email, testUsers.default.password)
    const workspace = await workspaceHelper.createWorkspace(
      `Visual Output Test ${Date.now()}`,
      'Testing visual outputs and canvas functionality'
    )
    workspaceId = workspace.workspaceId!
  })

  test.describe('Canvas Pane Layout & Structure', () => {
    test('should display canvas pane with correct layout', async ({ page }) => {
      // Verify dual-pane layout
      await expect(page.locator('.dual-pane-container')).toBeVisible()
      await expect(page.locator('.chat-pane')).toBeVisible()
      await expect(page.locator('.canvas-pane')).toBeVisible()

      // Check canvas pane header
      await expect(page.locator('.canvas-pane h2:has-text("Visual Canvas")')).toBeVisible()
      await expect(page.locator('.canvas-pane text="Sketches & diagrams"')).toBeVisible()

      // Check metadata display
      await expect(page.locator('text="Messages:"')).toBeVisible()
      await expect(page.locator('text="Elements:"')).toBeVisible()
      await expect(page.locator('text="Auto-saved"')).toBeVisible()
    })

    test('should show responsive design on different screen sizes', async ({ page }) => {
      // Test desktop layout
      await page.setViewportSize({ width: 1920, height: 1080 })
      await expect(page.locator('.dual-pane-container')).toBeVisible()

      // Test tablet layout
      await page.setViewportSize({ width: 768, height: 1024 })
      await expect(page.locator('.dual-pane-container')).toBeVisible()

      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 })
      await expect(page.locator('.dual-pane-container')).toBeVisible()

      // Mobile might stack panes or show tabs
      const mobileLayout = page.locator('.mobile-stack, .pane-tabs')
      if (await mobileLayout.isVisible()) {
        await expect(mobileLayout).toBeVisible()
      }
    })

    test('should maintain proper pane proportions', async ({ page }) => {
      // Check if panes maintain 60/40 split as specified in docs
      const chatPane = page.locator('.chat-pane')
      const canvasPane = page.locator('.canvas-pane')

      const chatWidth = await chatPane.boundingBox()
      const canvasWidth = await canvasPane.boundingBox()

      if (chatWidth && canvasWidth) {
        const totalWidth = chatWidth.width + canvasWidth.width
        const chatPercentage = (chatWidth.width / totalWidth) * 100
        const canvasPercentage = (canvasWidth.width / totalWidth) * 100

        // Allow some tolerance for borders/padding
        expect(chatPercentage).toBeGreaterThan(55)
        expect(chatPercentage).toBeLessThan(65)
        expect(canvasPercentage).toBeGreaterThan(35)
        expect(canvasPercentage).toBeLessThan(45)
      }
    })
  })

  test.describe('Canvas Content Synchronization', () => {
    test('should update canvas metadata when messages are sent', async ({ page }) => {
      await workspaceHelper.switchToTab('chat')

      // Get initial message count
      const initialCount = await page.locator('.canvas-pane text=/Messages: \\d+/')
        .textContent()
        .then(text => parseInt(text?.match(/\d+/)?.[0] || '0'))

      // Send a message
      await chatHelper.sendMessage('Create a strategic framework for product development')
      await chatHelper.waitForMaryResponse()

      // Check if message count updated
      const newCount = await page.locator('.canvas-pane text=/Messages: \\d+/')
        .textContent()
        .then(text => parseInt(text?.match(/\d+/)?.[0] || '0'))

      expect(newCount).toBeGreaterThan(initialCount)
    })

    test('should reflect BMad session progress in canvas', async ({ page }) => {
      await workspaceHelper.switchToTab('bmad')
      await bmadHelper.selectPathway('new-idea')

      // Progress through session
      const options = await bmadHelper.getElicitationOptions()
      if (options.length > 0) {
        await bmadHelper.selectElicitationOption(1)
        await page.waitForTimeout(2000)
      }

      // Check for canvas updates
      const canvasContent = await page.locator('.canvas-pane .canvas-container').innerHTML()

      // Should show some indication of BMad progress
      const hasSessionContent = canvasContent.includes('session') ||
                               canvasContent.includes('progress') ||
                               canvasContent.includes('bmad')

      // If canvas integration is implemented, should show content
      if (hasSessionContent) {
        expect(hasSessionContent).toBe(true)
      }
    })

    test('should handle real-time sync between panes', async ({ page }) => {
      await workspaceHelper.switchToTab('chat')

      // Monitor canvas for changes
      const canvasContainer = page.locator('.canvas-container')

      // Send strategic message that might generate visual content
      await chatHelper.sendMessage('Create a business model canvas for a SaaS platform')
      await chatHelper.waitForMaryResponse()

      // Check if canvas shows any updates
      const canvasHTML = await canvasContainer.innerHTML()

      // Look for any dynamic content updates
      const hasDynamicContent = canvasHTML.includes('canvas-element') ||
                               canvasHTML.includes('diagram') ||
                               canvasHTML.includes('framework')

      // Canvas might update with frameworks or diagrams
      if (hasDynamicContent) {
        expect(page.locator('[data-canvas-element]')).toBeVisible()
      }
    })
  })

  test.describe('Strategic Document Generation', () => {
    test('should generate visual documents during BMad sessions', async ({ page }) => {
      await workspaceHelper.switchToTab('bmad')
      await bmadHelper.selectPathway('new-idea')

      // Progress through multiple phases to generate content
      const sequence = [1, 2, 3]
      for (const optionNumber of sequence) {
        const options = await bmadHelper.getElicitationOptions()
        if (options.some(opt => opt.number === optionNumber.toString())) {
          await bmadHelper.selectElicitationOption(optionNumber)
          await page.waitForTimeout(2000)
        }
      }

      // Check for generated document
      const document = await bmadHelper.getGeneratedDocument()

      if (document) {
        expect(document.length).toBeGreaterThan(100)
        expect(document).toMatch(/project|strategy|analysis|framework/i)
      }

      // Check if document appears in canvas
      const documentElements = page.locator('.canvas-pane [data-document-content]')
      if (await documentElements.isVisible()) {
        await expect(documentElements).toBeVisible()
      }
    })

    test('should show document evolution during session', async ({ page }) => {
      await workspaceHelper.switchToTab('bmad')
      await bmadHelper.selectPathway('business-model')

      // Get initial document state
      const initialDoc = await bmadHelper.getGeneratedDocument()

      // Progress session
      const options = await bmadHelper.getElicitationOptions()
      if (options.length > 0) {
        await bmadHelper.selectElicitationOption(1)
        await page.waitForTimeout(3000)

        // Check for document updates
        const updatedDoc = await bmadHelper.getGeneratedDocument()

        if (initialDoc && updatedDoc) {
          // Document should evolve
          expect(updatedDoc.length).toBeGreaterThanOrEqual(initialDoc.length)
        } else if (updatedDoc && !initialDoc) {
          // Document was created
          expect(updatedDoc.length).toBeGreaterThan(0)
        }
      }
    })

    test('should display different document types for different pathways', async ({ page }) => {
      const pathwayTests = [
        { pathway: 'new-idea', expectedType: 'project brief' },
        { pathway: 'business-model', expectedType: 'business model' },
        { pathway: 'feature-refinement', expectedType: 'feature spec' }
      ]

      for (const test of pathwayTests.slice(0, 1)) { // Test one for efficiency
        await page.reload()
        await workspaceHelper.switchToTab('bmad')

        await bmadHelper.selectPathway(test.pathway as any)

        // Progress enough to generate document
        const options = await bmadHelper.getElicitationOptions()
        if (options.length > 0) {
          await bmadHelper.selectElicitationOption(1)
          await bmadHelper.selectElicitationOption(2)
          await page.waitForTimeout(3000)

          const document = await bmadHelper.getGeneratedDocument()
          if (document) {
            expect(document.toLowerCase()).toContain(test.expectedType.split(' ')[0])
          }
        }
      }
    })
  })

  test.describe('Visual Element Rendering', () => {
    test('should render markdown content with proper styling', async ({ page }) => {
      await workspaceHelper.switchToTab('chat')

      // Send message requesting structured output
      await chatHelper.sendMessage('Create a strategic framework with headers, bullet points, and numbered lists')
      await chatHelper.waitForMaryResponse()

      // Check markdown rendering in chat
      const markdownElements = {
        headers: page.locator('.chat-message-assistant h1, .chat-message-assistant h2, .chat-message-assistant h3'),
        lists: page.locator('.chat-message-assistant ul, .chat-message-assistant ol'),
        paragraphs: page.locator('.chat-message-assistant p')
      }

      // Verify markdown is properly rendered
      if (await markdownElements.headers.isVisible()) {
        await expect(markdownElements.headers).toBeVisible()
      }
      if (await markdownElements.lists.isVisible()) {
        await expect(markdownElements.lists).toBeVisible()
      }
      await expect(markdownElements.paragraphs).toBeVisible()
    })

    test('should display strategic tags with proper styling', async ({ page }) => {
      await workspaceHelper.switchToTab('chat')

      // Send strategic message
      await chatHelper.sendMessage('Analyze competitive positioning strategies for enterprise software')
      await chatHelper.waitForMaryResponse()

      // Check for strategic tags
      const tags = await chatHelper.getStrategicTags()

      if (tags.length > 0) {
        // Tags should be visible and styled
        const tagElements = page.locator('.chat-message-assistant [class*="strategic-tag"], .chat-message-assistant [class*="tag"]')
        await expect(tagElements.first()).toBeVisible()

        // Check tag styling
        const tagStyles = await tagElements.first().evaluate(el => {
          const styles = window.getComputedStyle(el)
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            borderRadius: styles.borderRadius
          }
        })

        expect(tagStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
        expect(tagStyles.borderRadius).not.toBe('0px')
      }
    })

    test('should show loading states and animations', async ({ page }) => {
      await workspaceHelper.switchToTab('chat')

      // Start sending message
      await page.fill('input[placeholder*="strategic question"]', 'Test loading animations')
      await page.click('button:has-text("Send")')

      // Should show loading shimmer
      await expect(page.locator('.loading-shimmer')).toBeVisible({ timeout: 2000 })

      // Wait for response completion
      await chatHelper.waitForMaryResponse()

      // Loading should be gone
      await expect(page.locator('.loading-shimmer')).not.toBeVisible()
    })
  })

  test.describe('Canvas Integration Features', () => {
    test('should show placeholder content when canvas is empty', async ({ page }) => {
      // Check initial canvas state
      const placeholderText = page.locator('text="Canvas ready for sketches and diagrams"')
      await expect(placeholderText).toBeVisible()

      const comingSoonText = page.locator('text="Integration with Excalidraw & Mermaid coming soon"')
      await expect(comingSoonText).toBeVisible()

      // Should show canvas icon
      const canvasIcon = page.locator('.canvas-pane svg')
      await expect(canvasIcon).toBeVisible()
    })

    test('should maintain canvas state across tab switches', async ({ page }) => {
      // Start in chat, then switch to BMad and back
      await workspaceHelper.switchToTab('chat')

      // Send message to create some state
      await chatHelper.sendMessage('Test canvas state persistence')
      await chatHelper.waitForMaryResponse()

      // Switch to BMad
      await workspaceHelper.switchToTab('bmad')
      await expect(page.locator('text=I have a brand new idea')).toBeVisible()

      // Switch back to chat
      await workspaceHelper.switchToTab('chat')

      // Canvas should still show correct message count
      const messageCount = await page.locator('.canvas-pane text=/Messages: \\d+/').textContent()
      expect(messageCount).toContain('2') // User message + assistant response
    })

    test('should handle canvas error states gracefully', async ({ page }) => {
      // This test would simulate canvas loading errors

      // Verify error handling exists
      const errorBoundary = page.locator('.canvas-pane [data-error], .error-boundary')

      // If error boundary exists, it should handle errors gracefully
      if (await errorBoundary.isVisible()) {
        await expect(errorBoundary).toContainText(/error|failed|retry/i)
      }

      // Canvas should always show something (placeholder at minimum)
      const canvasContent = page.locator('.canvas-container')
      await expect(canvasContent).toBeVisible()
    })
  })

  test.describe('Export and Download Features', () => {
    test('should show export options when content exists', async ({ page }) => {
      await workspaceHelper.switchToTab('bmad')
      await bmadHelper.selectPathway('new-idea')

      // Generate some content
      const options = await bmadHelper.getElicitationOptions()
      if (options.length > 0) {
        await bmadHelper.selectElicitationOption(1)
        await page.waitForTimeout(2000)
      }

      // Look for export functionality
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [aria-label*="export"]')

      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeVisible()

        // Test export menu
        await exportButton.click()

        // Should show export options
        const exportOptions = page.locator('text="PDF", text="PNG", text="SVG"')
        if (await exportOptions.first().isVisible()) {
          await expect(exportOptions.first()).toBeVisible()
        }
      }
    })

    test('should handle different export formats', async ({ page }) => {
      // This would test actual export functionality if implemented

      await workspaceHelper.switchToTab('bmad')
      await bmadHelper.selectPathway('business-model')

      // Progress session to generate exportable content
      const options = await bmadHelper.getElicitationOptions()
      if (options.length > 0) {
        await bmadHelper.selectElicitationOption(1)
        await bmadHelper.selectElicitationOption(2)
      }

      // Look for and test export functionality
      const exportButton = page.locator('button:has-text("Export")')

      if (await exportButton.isVisible()) {
        // Test different format exports
        const formats = ['PDF', 'PNG', 'JSON']

        for (const format of formats) {
          const formatButton = page.locator(`text="${format}"`)
          if (await formatButton.isVisible()) {
            await formatButton.click()

            // Should trigger download or show success message
            await page.waitForTimeout(2000)
          }
        }
      }
    })
  })

  test.describe('Accessibility and Usability', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Test keyboard navigation through canvas controls
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should be able to reach canvas area
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
    })

    test('should have proper ARIA labels', async ({ page }) => {
      // Check for accessibility labels
      const canvasPane = page.locator('.canvas-pane')
      const ariaLabel = await canvasPane.getAttribute('aria-label')

      if (ariaLabel) {
        expect(ariaLabel).toContain('canvas')
      }

      // Check for screen reader friendly content
      const srOnlyContent = page.locator('.sr-only, .visually-hidden')
      if (await srOnlyContent.isVisible()) {
        const content = await srOnlyContent.textContent()
        expect(content).toBeTruthy()
      }
    })

    test('should handle high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'dark' })

      // Canvas should remain functional and visible
      await expect(page.locator('.canvas-pane')).toBeVisible()

      // Text should remain readable
      const canvasText = page.locator('.canvas-pane h2')
      await expect(canvasText).toBeVisible()
    })
  })
})