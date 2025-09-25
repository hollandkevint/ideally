import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { WorkspaceHelper } from '../helpers/workspace.helper'
import { ChatHelper } from '../helpers/chat.helper'
import { testUsers } from '../fixtures/users'
import { analystScenarios } from '../fixtures/test-scenarios'

test.describe('Five Analyst Chat Scenarios', () => {
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
  })

  async function setupScenarioWorkspace(scenarioName: string) {
    const workspace = await workspaceHelper.createWorkspace(
      `${scenarioName} Analysis`,
      `Testing ${scenarioName} scenario with Mary AI`
    )
    workspaceId = workspace.workspaceId!
    await workspaceHelper.switchToTab('chat')
  }

  test.describe('Scenario 1: Healthcare Data Platform', () => {
    const scenario = analystScenarios.healthcareDataPlatform

    test('should provide comprehensive healthcare data analysis', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      // Initial prompt
      await chatHelper.sendMessage(scenario.initialPrompt)
      const response = await chatHelper.waitForMaryResponse()

      // Validate key topics are addressed
      const responseText = response!.toLowerCase()
      scenario.expectedTopics.forEach(topic => {
        expect(responseText).toContain(topic.toLowerCase())
      })

      // Validate strategic depth
      expect(response!.length).toBeGreaterThan(300)
    })

    test('should ask relevant follow-up questions', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      const initialResponse = await chatHelper.waitForMaryResponse()

      // Mary should ask strategic questions
      const hasQuestions = /\?/.test(initialResponse!)
      expect(hasQuestions).toBe(true)

      // Test follow-up interaction
      await chatHelper.sendMessage('We plan to integrate with Epic, Cerner, and MEDITECH EHR systems')
      const followUpResponse = await chatHelper.waitForMaryResponse()

      // Should address interoperability and technical challenges
      expect(followUpResponse).toMatch(/interoperability|integration|API|FHIR|HL7/i)
    })

    test('should validate regulatory compliance focus', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      // Ask about compliance
      await chatHelper.sendMessage('What compliance requirements should we prioritize?')
      const complianceResponse = await chatHelper.waitForMaryResponse()

      // Should mention key healthcare regulations
      expect(complianceResponse).toMatch(/HIPAA|HITECH|FDA|compliance|regulation/i)
      expect(complianceResponse!.length).toBeGreaterThan(200)
    })

    test('should provide market analysis insights', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      // Ask about market opportunity
      await chatHelper.sendMessage('What\'s the market opportunity for healthcare analytics?')
      const marketResponse = await chatHelper.waitForMaryResponse()

      // Should provide market insights
      expect(marketResponse).toMatch(/market|opportunity|competition|value proposition|ROI/i)
    })

    test('should address technical architecture considerations', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      // Ask about technical implementation
      await chatHelper.sendMessage('How should we architect this platform for scalability?')
      const techResponse = await chatHelper.waitForMaryResponse()

      // Should address technical considerations
      expect(techResponse).toMatch(/architecture|scalability|cloud|security|database/i)
    })
  })

  test.describe('Scenario 2: E-commerce Optimization', () => {
    const scenario = analystScenarios.ecommerceOptimization

    test('should analyze conversion funnel systematically', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      const response = await chatHelper.waitForMaryResponse()

      // Should ask for specific metrics
      expect(response).toMatch(/rate|percentage|metric|current|baseline/i)

      // Follow up with metrics
      await chatHelper.sendMessage('Our cart abandonment rate is 73% and overall conversion is 2.1%')
      const analysisResponse = await chatHelper.waitForMaryResponse()

      // Should provide specific analysis
      expect(analysisResponse).toMatch(/73%|high|above average|optimization|improvement/i)
    })

    test('should suggest A/B testing strategies', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('What should we test first to improve conversions?')
      const testingResponse = await chatHelper.waitForMaryResponse()

      // Should mention A/B testing and specific tests
      expect(testingResponse).toMatch(/A\/B|test|experiment|checkout|button|form/i)
    })

    test('should analyze customer journey touchpoints', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('Where in our funnel are users dropping off the most?')
      const journeyResponse = await chatHelper.waitForMaryResponse()

      // Should address customer journey analysis
      expect(journeyResponse).toMatch(/journey|touchpoint|drop.?off|abandon|checkout|payment/i)
    })

    test('should recommend trust and security improvements', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('How can we build more trust with our customers?')
      const trustResponse = await chatHelper.waitForMaryResponse()

      // Should address trust factors
      expect(trustResponse).toMatch(/trust|security|reviews|testimonials|guarantee|SSL/i)
    })
  })

  test.describe('Scenario 3: SaaS Pricing Strategy', () => {
    const scenario = analystScenarios.saasPricing

    test('should analyze value proposition thoroughly', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      const response = await chatHelper.waitForMaryResponse()

      // Should ask about value proposition
      expect(response).toMatch(/value|benefit|unique|differentiation|customer|problem/i)

      // Provide value prop details
      await chatHelper.sendMessage('We help enterprises reduce compliance costs by 40% through automated reporting')
      const valueResponse = await chatHelper.waitForMaryResponse()

      // Should connect value to pricing
      expect(valueResponse).toMatch(/40%|savings|ROI|price.*value|cost.*reduction/i)
    })

    test('should provide competitive analysis framework', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('How should we price against competitors like Workday and SAP?')
      const competitiveResponse = await chatHelper.waitForMaryResponse()

      // Should address competitive positioning
      expect(competitiveResponse).toMatch(/competitive|position|differentiate|market|benchmark/i)
    })

    test('should recommend tiered pricing structure', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('Should we use a tiered pricing model?')
      const tieringResponse = await chatHelper.waitForMaryResponse()

      // Should discuss pricing tiers
      expect(tieringResponse).toMatch(/tier|plan|basic|professional|enterprise|feature/i)
    })

    test('should address enterprise sales considerations', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('What pricing factors matter most for enterprise buyers?')
      const enterpriseResponse = await chatHelper.waitForMaryResponse()

      // Should address enterprise-specific factors
      expect(enterpriseResponse).toMatch(/enterprise|procurement|budget|ROI|contract|negotiation/i)
    })
  })

  test.describe('Scenario 4: European Market Entry', () => {
    const scenario = analystScenarios.marketEntry

    test('should analyze regulatory landscape comprehensively', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      const response = await chatHelper.waitForMaryResponse()

      // Should address regulatory considerations
      expect(response).toMatch(/GDPR|regulation|compliance|European|legal|data.*privacy/i)

      // Follow up on specific regulations
      await chatHelper.sendMessage('We offer digital payment solutions for small businesses')
      const regulatoryResponse = await chatHelper.waitForMaryResponse()

      // Should mention payment regulations
      expect(regulatoryResponse).toMatch(/PCI|DSS|PSD2|payment|banking|license/i)
    })

    test('should provide market sizing and opportunity analysis', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('What\'s the market size for fintech in Europe?')
      const marketResponse = await chatHelper.waitForMaryResponse()

      // Should discuss market analysis
      expect(marketResponse).toMatch(/market.*size|opportunity|TAM|growth|segment/i)
    })

    test('should recommend go-to-market strategy', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('How should we approach European market entry?')
      const gtmResponse = await chatHelper.waitForMaryResponse()

      // Should provide go-to-market strategy
      expect(gtmResponse).toMatch(/strategy|entry|partner|local|launch|pilot|country/i)
    })

    test('should address localization requirements', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('What localization challenges should we expect?')
      const localizationResponse = await chatHelper.waitForMaryResponse()

      // Should address localization
      expect(localizationResponse).toMatch(/language|currency|local|culture|adapt|translate/i)
    })
  })

  test.describe('Scenario 5: Product Pivot Decision', () => {
    const scenario = analystScenarios.productPivot

    test('should conduct systematic root cause analysis', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      const response = await chatHelper.waitForMaryResponse()

      // Should ask diagnostic questions
      expect(response).toMatch(/metric|measure|sign|indicate|why|cause|data/i)

      // Provide metrics
      await chatHelper.sendMessage('Monthly active users dropped 30%, churn increased to 15%, and NPS is -10')
      const analysisResponse = await chatHelper.waitForMaryResponse()

      // Should analyze the metrics
      expect(analysisResponse).toMatch(/30%|15%|negative.*NPS|concerning|root.*cause/i)
    })

    test('should evaluate product-market fit', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('How do we know if we have product-market fit?')
      const pmfResponse = await chatHelper.waitForMaryResponse()

      // Should explain product-market fit indicators
      expect(pmfResponse).toMatch(/product.*market.*fit|retention|organic.*growth|referral|satisfaction/i)
    })

    test('should present pivot options with frameworks', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('What are our pivot options?')
      const pivotResponse = await chatHelper.waitForMaryResponse()

      // Should present structured pivot options
      expect(pivotResponse).toMatch(/pivot|option|alternative|customer.*segment|problem|solution/i)
    })

    test('should provide decision-making framework', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('How should we decide between pivoting and persevering?')
      const decisionResponse = await chatHelper.waitForMaryResponse()

      // Should provide decision criteria
      expect(decisionResponse).toMatch(/criteria|framework|decide|consider|runway|resource|time/i)
    })

    test('should consider resource and timeline implications', async ({ page }) => {
      await setupScenarioWorkspace(scenario.name)

      await chatHelper.sendMessage(scenario.initialPrompt)
      await chatHelper.waitForMaryResponse()

      await chatHelper.sendMessage('We have 8 months of runway left and a team of 12 people')
      const resourceResponse = await chatHelper.waitForMaryResponse()

      // Should address resource constraints
      expect(resourceResponse).toMatch(/8.*month|runway|team|resource|constraint|timeline/i)
    })
  })

  test.describe('Cross-Scenario Validation', () => {
    test('should maintain consistent analytical quality across scenarios', async ({ page }) => {
      const scenarios = Object.values(analystScenarios)
      const responses: string[] = []

      for (const scenario of scenarios.slice(0, 3)) { // Test 3 for time efficiency
        await page.reload()
        await setupScenarioWorkspace(scenario.name)

        await chatHelper.sendMessage(scenario.initialPrompt)
        const response = await chatHelper.waitForMaryResponse()

        responses.push(response!)

        // Each response should meet quality standards
        expect(response!.length).toBeGreaterThan(200)
        expect(response).toMatch(/analy|strateg|consider|evaluat|framework/i)

        // Should ask strategic questions
        expect(response).toMatch(/\?/)
      }

      // All responses should be substantive and strategic
      responses.forEach(response => {
        expect(response.split('.').length).toBeGreaterThan(3) // Multiple sentences
      })
    })

    test('should demonstrate domain expertise across different industries', async ({ page }) => {
      const domainTests = [
        {
          scenario: analystScenarios.healthcareDataPlatform,
          domainTerms: ['HIPAA', 'healthcare', 'clinical', 'patient', 'EHR']
        },
        {
          scenario: analystScenarios.ecommerceOptimization,
          domainTerms: ['conversion', 'cart', 'checkout', 'funnel', 'ecommerce']
        }
      ]

      for (const test of domainTests) {
        await page.reload()
        await setupScenarioWorkspace(test.scenario.name)

        await chatHelper.sendMessage(test.scenario.initialPrompt)
        const response = await chatHelper.waitForMaryResponse()

        // Should demonstrate domain knowledge
        const hasdomainExpertise = test.domainTerms.some(term =>
          response!.toLowerCase().includes(term.toLowerCase())
        )
        expect(hasdomainExpertise).toBe(true)
      }
    })

    test('should provide actionable recommendations in all scenarios', async ({ page }) => {
      const actionableTests = [
        analystScenarios.saasPricing,
        analystScenarios.marketEntry
      ]

      for (const scenario of actionableTests) {
        await page.reload()
        await setupScenarioWorkspace(scenario.name)

        await chatHelper.sendMessage(scenario.initialPrompt)
        await chatHelper.waitForMaryResponse()

        await chatHelper.sendMessage('What should be my next steps?')
        const actionResponse = await chatHelper.waitForMaryResponse()

        // Should provide actionable guidance
        expect(actionResponse).toMatch(/step|action|recommend|should|consider|start|begin/i)
        expect(actionResponse!.length).toBeGreaterThan(150)
      }
    })
  })
})