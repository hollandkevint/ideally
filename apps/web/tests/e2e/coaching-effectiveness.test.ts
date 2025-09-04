import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CoachingPersona, CoachingContext, generateCoachingResponse } from '@/lib/ai/mary-persona'
import { ConversationPersistenceManager } from '@/lib/ai/conversation-persistence'

// Mock dependencies
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({ error: null }))
    }))
  }))
}))

// Mock Claude API with realistic coaching responses
const mockClaudeResponses = {
  strategic_analysis: {
    diagnosis: 'Let\'s start by understanding your current strategic position. What specific challenges are you facing in your market?',
    evaluation: 'Based on what you\'ve shared, I see several strategic options. Let\'s evaluate each one systematically...',
    planning: 'Now that we\'ve analyzed your options, let\'s create a concrete action plan with clear priorities.'
  },
  business_model_design: {
    diagnosis: 'To design an effective business model, we need to understand your value proposition. Who are your target customers?',
    evaluation: 'I\'m seeing some interesting patterns in your business model. Let\'s test these assumptions against market realities.',
    planning: 'Let\'s structure your business model into a clear framework that you can execute and iterate on.'
  },
  market_validation: {
    diagnosis: 'Market validation starts with understanding customer problems. What evidence do you have about customer needs?',
    evaluation: 'Your market research shows promising signals. Let\'s dig deeper into the validation methodology.',
    planning: 'Based on your validation results, here\'s how I recommend structuring your market entry strategy.'
  }
}

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn(({ messages }) => {
        const lastMessage = messages[messages.length - 1]
        const context = lastMessage.content.includes('strategic') ? 'strategic_analysis' :
                        lastMessage.content.includes('business model') ? 'business_model_design' :
                        'market_validation'
        
        const phase = lastMessage.content.includes('challenge') || lastMessage.content.includes('problem') ? 'diagnosis' :
                      lastMessage.content.includes('option') || lastMessage.content.includes('evaluate') ? 'evaluation' :
                      'planning'

        return Promise.resolve({
          content: [{ text: mockClaudeResponses[context][phase] }],
          usage: {
            input_tokens: 150,
            output_tokens: 200,
            total_tokens: 350
          }
        })
      })
    }
  }
}))

// Coaching effectiveness metrics
interface CoachingMetrics {
  questionQuality: number // 0-10 scale
  contextRelevance: number // 0-10 scale
  actionableAdvice: number // 0-10 scale
  bmadAlignment: number // 0-10 scale
  personaConsistency: number // 0-10 scale
  strategicDepth: number // 0-10 scale
}

class CoachingEffectivenessAnalyzer {
  analyzeResponse(
    userInput: string,
    assistantResponse: string,
    context: CoachingContext
  ): CoachingMetrics {
    return {
      questionQuality: this.assessQuestionQuality(assistantResponse),
      contextRelevance: this.assessContextRelevance(userInput, assistantResponse, context),
      actionableAdvice: this.assessActionableAdvice(assistantResponse),
      bmadAlignment: this.assessBmadAlignment(assistantResponse, context),
      personaConsistency: this.assessPersonaConsistency(assistantResponse),
      strategicDepth: this.assessStrategicDepth(assistantResponse)
    }
  }

  private assessQuestionQuality(response: string): number {
    const questionPatterns = [
      /what.*?\?/gi,
      /how.*?\?/gi,
      /why.*?\?/gi,
      /when.*?\?/gi,
      /where.*?\?/gi,
      /which.*?\?/gi
    ]

    let score = 5 // Base score
    const questionCount = questionPatterns.reduce((count, pattern) => 
      count + (response.match(pattern)?.length || 0), 0)

    // Good coaching should ask 1-3 questions
    if (questionCount >= 1 && questionCount <= 3) {
      score += 3
    }

    // Look for open-ended questions
    if (response.includes('tell me more') || response.includes('describe') || response.includes('explain')) {
      score += 2
    }

    return Math.min(score, 10)
  }

  private assessContextRelevance(userInput: string, response: string, context: CoachingContext): number {
    let score = 5

    // Check if response acknowledges user's specific situation
    const userKeywords = userInput.toLowerCase().split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5)

    const responseKeywords = response.toLowerCase()
    const contextMatches = userKeywords.filter(keyword => 
      responseKeywords.includes(keyword)
    ).length

    score += Math.min(contextMatches, 3)

    // Check BMad session context relevance
    if (context.currentBmadSession) {
      const { pathway, phase } = context.currentBmadSession
      
      if (response.toLowerCase().includes(pathway.replace('_', ' '))) {
        score += 1
      }
      
      if (response.toLowerCase().includes(phase)) {
        score += 1
      }
    }

    return Math.min(score, 10)
  }

  private assessActionableAdvice(response: string): number {
    const actionPatterns = [
      /let's/gi,
      /start by/gi,
      /next step/gi,
      /recommend/gi,
      /suggest/gi,
      /try/gi,
      /consider/gi,
      /focus on/gi,
      /begin with/gi
    ]

    let score = 3
    const actionCount = actionPatterns.reduce((count, pattern) => 
      count + (response.match(pattern)?.length || 0), 0)

    score += Math.min(actionCount * 2, 5)

    // Look for specific frameworks or methodologies
    const frameworkPatterns = [
      /framework/gi,
      /model/gi,
      /analysis/gi,
      /approach/gi,
      /methodology/gi
    ]

    const frameworkCount = frameworkPatterns.reduce((count, pattern) => 
      count + (response.match(pattern)?.length || 0), 0)

    score += Math.min(frameworkCount, 2)

    return Math.min(score, 10)
  }

  private assessBmadAlignment(response: string, context: CoachingContext): number {
    if (!context.currentBmadSession) return 5

    const { pathway, phase } = context.currentBmadSession
    let score = 5

    // Phase-specific language alignment
    const phaseKeywords = {
      diagnosis: ['understand', 'identify', 'analyze', 'assess', 'explore'],
      evaluation: ['compare', 'evaluate', 'options', 'alternatives', 'trade-offs'],
      planning: ['plan', 'action', 'implement', 'execute', 'next steps']
    }

    const expectedKeywords = phaseKeywords[phase] || []
    const responseWords = response.toLowerCase()
    
    const alignmentCount = expectedKeywords.filter(keyword => 
      responseWords.includes(keyword)
    ).length

    score += Math.min(alignmentCount, 3)

    // Pathway-specific alignment
    const pathwayKeywords = {
      strategic_analysis: ['strategy', 'competitive', 'market', 'positioning'],
      business_model_design: ['value', 'customers', 'revenue', 'model'],
      market_validation: ['validation', 'customers', 'evidence', 'testing']
    }

    const expectedPathwayKeywords = pathwayKeywords[pathway] || []
    const pathwayAlignment = expectedPathwayKeywords.filter(keyword => 
      responseWords.includes(keyword)
    ).length

    score += Math.min(pathwayAlignment, 2)

    return Math.min(score, 10)
  }

  private assessPersonaConsistency(response: string): number {
    let score = 5

    // Mary persona characteristics
    const maryTraits = {
      collaborative: ['let\'s', 'we can', 'together', 'our'],
      supportive: ['help', 'support', 'guide', 'assist'],
      experienced: ['experience', 'typically', 'often', 'usually'],
      systematic: ['step', 'first', 'then', 'framework', 'process']
    }

    Object.entries(maryTraits).forEach(([trait, keywords]) => {
      const hasTraitLanguage = keywords.some(keyword => 
        response.toLowerCase().includes(keyword)
      )
      if (hasTraitLanguage) score += 1
    })

    // Avoid overly academic or impersonal language
    const impersonalPatterns = [
      /one should/gi,
      /it is recommended/gi,
      /according to research/gi,
      /studies show/gi
    ]

    const impersonalCount = impersonalPatterns.reduce((count, pattern) => 
      count + (response.match(pattern)?.length || 0), 0)

    score -= impersonalCount

    return Math.max(Math.min(score, 10), 0)
  }

  private assessStrategicDepth(response: string): number {
    let score = 3

    // Look for strategic concepts
    const strategicConcepts = [
      'competitive advantage',
      'value proposition',
      'market opportunity',
      'strategic position',
      'business model',
      'differentiation',
      'market dynamics',
      'stakeholder',
      'ecosystem',
      'sustainability'
    ]

    const conceptCount = strategicConcepts.filter(concept => 
      response.toLowerCase().includes(concept)
    ).length

    score += Math.min(conceptCount * 2, 5)

    // Look for systems thinking
    const systemsPatterns = [
      /interconnected/gi,
      /relationship/gi,
      /impact/gi,
      /consequence/gi,
      /dependencies/gi
    ]

    const systemsCount = systemsPatterns.reduce((count, pattern) => 
      count + (response.match(pattern)?.length || 0), 0)

    score += Math.min(systemsCount, 2)

    return Math.min(score, 10)
  }

  calculateOverallScore(metrics: CoachingMetrics): number {
    const weights = {
      questionQuality: 0.2,
      contextRelevance: 0.2,
      actionableAdvice: 0.2,
      bmadAlignment: 0.15,
      personaConsistency: 0.15,
      strategicDepth: 0.1
    }

    return Object.entries(metrics).reduce((total, [metric, score]) => {
      return total + (score * weights[metric as keyof CoachingMetrics])
    }, 0)
  }
}

describe('Coaching Persona Effectiveness', () => {
  let analyzer: CoachingEffectivenessAnalyzer
  let persistenceManager: ConversationPersistenceManager

  beforeEach(async () => {
    vi.clearAllMocks()
    analyzer = new CoachingEffectivenessAnalyzer()
    persistenceManager = await ConversationPersistenceManager.initializeConversation()
  })

  describe('Strategic Coaching Scenarios', () => {
    it('should provide effective coaching for strategic analysis pathway - diagnosis phase', async () => {
      const context: CoachingContext = {
        userProfile: {
          experienceLevel: 'intermediate',
          industry: 'technology',
          role: 'ceo'
        },
        currentBmadSession: {
          sessionId: 'session-1',
          pathway: 'strategic_analysis',
          phase: 'diagnosis'
        },
        previousInsights: []
      }

      const userInput = 'I\'m struggling to understand our competitive position in the SaaS market. We have decent product features but our growth is stagnating.'

      const response = await generateCoachingResponse(userInput, [], context)
      const metrics = analyzer.analyzeResponse(userInput, response, context)
      const overallScore = analyzer.calculateOverallScore(metrics)

      expect(metrics.questionQuality).toBeGreaterThanOrEqual(6)
      expect(metrics.contextRelevance).toBeGreaterThanOrEqual(7)
      expect(metrics.actionableAdvice).toBeGreaterThanOrEqual(6)
      expect(metrics.bmadAlignment).toBeGreaterThanOrEqual(7)
      expect(metrics.personaConsistency).toBeGreaterThanOrEqual(6)
      expect(overallScore).toBeGreaterThanOrEqual(6.5)

      // Verify response contains diagnostic elements
      expect(response.toLowerCase()).toMatch(/understand|analyze|assess|identify/)
      expect(response).toMatch(/\?/) // Should ask questions
    })

    it('should provide effective coaching for business model design pathway - evaluation phase', async () => {
      const context: CoachingContext = {
        userProfile: {
          experienceLevel: 'beginner',
          industry: 'healthcare',
          role: 'founder'
        },
        currentBmadSession: {
          sessionId: 'session-2',
          pathway: 'business_model_design',
          phase: 'evaluation'
        },
        previousInsights: [
          { insight: 'Customer segments identified', confidence: 0.8 }
        ]
      }

      const userInput = 'We\'ve identified three potential customer segments: hospitals, clinics, and individual practitioners. How do we evaluate which one to focus on first?'

      const response = await generateCoachingResponse(userInput, [], context)
      const metrics = analyzer.analyzeResponse(userInput, response, context)
      const overallScore = analyzer.calculateOverallScore(metrics)

      expect(metrics.contextRelevance).toBeGreaterThanOrEqual(8) // Should reference the three segments
      expect(metrics.actionableAdvice).toBeGreaterThanOrEqual(7)
      expect(metrics.bmadAlignment).toBeGreaterThanOrEqual(7)
      expect(overallScore).toBeGreaterThanOrEqual(6.5)

      // Should reference the user's specific segments
      expect(response.toLowerCase()).toMatch(/hospital|clinic|practitioner/)
      expect(response.toLowerCase()).toMatch(/evaluate|compare|assess/)
    })

    it('should provide effective coaching for market validation pathway - planning phase', async () => {
      const context: CoachingContext = {
        userProfile: {
          experienceLevel: 'advanced',
          industry: 'fintech',
          role: 'product_manager'
        },
        currentBmadSession: {
          sessionId: 'session-3',
          pathway: 'market_validation',
          phase: 'planning'
        },
        previousInsights: [
          { insight: 'Strong product-market fit signals', confidence: 0.9 },
          { insight: 'Customer acquisition cost validated', confidence: 0.7 }
        ]
      }

      const userInput = 'Our validation tests show strong demand. Customer interviews are positive and our landing page conversion is 12%. What\'s our next step for market entry?'

      const response = await generateCoachingResponse(userInput, [], context)
      const metrics = analyzer.analyzeResponse(userInput, response, context)
      const overallScore = analyzer.calculateOverallScore(metrics)

      expect(metrics.actionableAdvice).toBeGreaterThanOrEqual(8) // Should be very actionable in planning phase
      expect(metrics.contextRelevance).toBeGreaterThanOrEqual(7) // Should reference the validation results
      expect(metrics.bmadAlignment).toBeGreaterThanOrEqual(7)
      expect(overallScore).toBeGreaterThanOrEqual(7.0)

      // Should provide concrete next steps
      expect(response.toLowerCase()).toMatch(/plan|next|step|action|implement/)
      expect(response.toLowerCase()).toMatch(/12%|conversion|validation/) // Reference specific data
    })
  })

  describe('Persona Consistency Across Sessions', () => {
    it('should maintain Mary persona characteristics throughout conversation', async () => {
      const context: CoachingContext = {
        userProfile: {
          experienceLevel: 'intermediate',
          industry: 'retail',
          role: 'ceo'
        },
        currentBmadSession: {
          sessionId: 'consistency-test',
          pathway: 'strategic_analysis',
          phase: 'diagnosis'
        },
        previousInsights: []
      }

      const conversationFlow = [
        'I need help with our retail strategy',
        'How do we handle seasonal fluctuations?',
        'What about our online vs physical store balance?',
        'Should we expand to new markets?',
        'How do we measure success?'
      ]

      const responses = []
      const metrics = []

      for (const userInput of conversationFlow) {
        const response = await generateCoachingResponse(userInput, [], context)
        responses.push(response)
        
        const responseMetrics = analyzer.analyzeResponse(userInput, response, context)
        metrics.push(responseMetrics)
      }

      // Calculate consistency scores
      const consistencyScores = metrics.map(m => m.personaConsistency)
      const avgConsistency = consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length
      const consistencyVariance = consistencyScores.reduce((variance, score) => 
        variance + Math.pow(score - avgConsistency, 2), 0) / consistencyScores.length

      expect(avgConsistency).toBeGreaterThanOrEqual(6.5)
      expect(consistencyVariance).toBeLessThanOrEqual(2) // Low variance indicates consistency

      // All responses should use collaborative language
      responses.forEach(response => {
        expect(response.toLowerCase()).toMatch(/let's|we|our|together/)
      })
    })

    it('should adapt communication style based on user experience level', async () => {
      const scenarios = [
        {
          experienceLevel: 'beginner',
          expectedLanguage: ['simple', 'basic', 'foundation', 'start'],
          avoidLanguage: ['leverage', 'optimize', 'sophisticated', 'complex']
        },
        {
          experienceLevel: 'intermediate',
          expectedLanguage: ['expand', 'develop', 'enhance', 'improve'],
          avoidLanguage: ['elementary', 'basic', 'simple', 'introduction']
        },
        {
          experienceLevel: 'advanced',
          expectedLanguage: ['optimize', 'sophisticated', 'strategic', 'nuanced'],
          avoidLanguage: ['basic', 'simple', 'introduction', 'elementary']
        }
      ]

      for (const scenario of scenarios) {
        const context: CoachingContext = {
          userProfile: {
            experienceLevel: scenario.experienceLevel as any,
            industry: 'technology',
            role: 'founder'
          },
          currentBmadSession: {
            sessionId: `level-test-${scenario.experienceLevel}`,
            pathway: 'strategic_analysis',
            phase: 'diagnosis'
          },
          previousInsights: []
        }

        const response = await generateCoachingResponse(
          'I need help with strategic planning for my startup',
          [],
          context
        )

        // Check for appropriate language complexity
        const responseWords = response.toLowerCase().split(' ')
        
        // Should avoid inappropriate language for experience level
        scenario.avoidLanguage.forEach(word => {
          expect(responseWords).not.toContain(word)
        })
      }
    })

    it('should maintain context awareness across conversation turns', async () => {
      const context: CoachingContext = {
        userProfile: {
          experienceLevel: 'intermediate',
          industry: 'e-commerce',
          role: 'founder'
        },
        currentBmadSession: {
          sessionId: 'context-awareness-test',
          pathway: 'business_model_design',
          phase: 'diagnosis'
        },
        previousInsights: []
      }

      // Simulate multi-turn conversation
      const conversationHistory = []
      
      // Turn 1
      let userInput = 'We\'re an e-commerce platform for handmade crafts'
      let response = await generateCoachingResponse(userInput, conversationHistory, context)
      conversationHistory.push({ role: 'user', content: userInput })
      conversationHistory.push({ role: 'assistant', content: response })

      // Turn 2 - Should reference previous context
      userInput = 'Our biggest challenge is connecting craftspeople with buyers'
      response = await generateCoachingResponse(userInput, conversationHistory, context)
      conversationHistory.push({ role: 'user', content: userInput })
      conversationHistory.push({ role: 'assistant', content: response })

      // Turn 3 - Should build on established context
      userInput = 'How do we scale this connection process?'
      response = await generateCoachingResponse(userInput, conversationHistory, context)

      const metrics = analyzer.analyzeResponse(userInput, response, context)

      expect(metrics.contextRelevance).toBeGreaterThanOrEqual(7)
      
      // Should reference established context (e-commerce, crafts, connection)
      expect(response.toLowerCase()).toMatch(/craft|handmade|connect|platform/)
    })
  })

  describe('BMad Method Integration', () => {
    it('should guide user through appropriate phase transitions', async () => {
      const context: CoachingContext = {
        userProfile: {
          experienceLevel: 'intermediate',
          industry: 'saas',
          role: 'founder'
        },
        currentBmadSession: {
          sessionId: 'phase-transition-test',
          pathway: 'strategic_analysis',
          phase: 'diagnosis'
        },
        previousInsights: [
          { insight: 'Market positioning challenges identified', confidence: 0.8 },
          { insight: 'Competitive landscape mapped', confidence: 0.9 }
        ]
      }

      // Simulate reaching readiness for phase transition
      const userInput = 'We\'ve identified our main challenges: unclear positioning and strong competition. We understand our competitive landscape well. What should we do next?'

      const response = await generateCoachingResponse(userInput, [], context)
      const metrics = analyzer.analyzeResponse(userInput, response, context)

      expect(metrics.bmadAlignment).toBeGreaterThanOrEqual(7)
      
      // Should suggest moving to evaluation phase
      expect(response.toLowerCase()).toMatch(/evaluate|options|alternatives|next step/)
    })

    it('should provide pathway-specific guidance', async () => {
      const pathwayTests = [
        {
          pathway: 'strategic_analysis',
          userInput: 'We need to improve our competitive position',
          expectedConcepts: ['position', 'competitive', 'advantage', 'market']
        },
        {
          pathway: 'business_model_design',
          userInput: 'We need to redesign how we create and capture value',
          expectedConcepts: ['value', 'customers', 'revenue', 'model']
        },
        {
          pathway: 'market_validation',
          userInput: 'We need to test our assumptions about customer demand',
          expectedConcepts: ['validation', 'test', 'evidence', 'customer']
        }
      ]

      for (const test of pathwayTests) {
        const context: CoachingContext = {
          userProfile: {
            experienceLevel: 'intermediate',
            industry: 'technology',
            role: 'founder'
          },
          currentBmadSession: {
            sessionId: `pathway-test-${test.pathway}`,
            pathway: test.pathway as any,
            phase: 'diagnosis'
          },
          previousInsights: []
        }

        const response = await generateCoachingResponse(test.userInput, [], context)
        const metrics = analyzer.analyzeResponse(test.userInput, response, context)

        expect(metrics.bmadAlignment).toBeGreaterThanOrEqual(6)
        
        // Should use pathway-appropriate language
        test.expectedConcepts.forEach(concept => {
          expect(response.toLowerCase()).toContain(concept)
        })
      }
    })

    it('should leverage previous insights appropriately', async () => {
      const context: CoachingContext = {
        userProfile: {
          experienceLevel: 'intermediate',
          industry: 'fintech',
          role: 'product_manager'
        },
        currentBmadSession: {
          sessionId: 'insights-test',
          pathway: 'market_validation',
          phase: 'evaluation'
        },
        previousInsights: [
          { insight: 'Strong demand validated in enterprise segment', confidence: 0.9 },
          { insight: 'Pricing sensitivity identified in SMB segment', confidence: 0.7 },
          { insight: 'Regulatory compliance is key differentiator', confidence: 0.8 }
        ]
      }

      const userInput = 'Based on our validation results, which customer segment should we prioritize?'

      const response = await generateCoachingResponse(userInput, [], context)
      const metrics = analyzer.analyzeResponse(userInput, response, context)

      expect(metrics.contextRelevance).toBeGreaterThanOrEqual(8)
      expect(metrics.strategicDepth).toBeGreaterThanOrEqual(7)
      
      // Should reference previous insights
      expect(response.toLowerCase()).toMatch(/enterprise|smb|compliance|demand/)
      // Should provide evaluation framework
      expect(response.toLowerCase()).toMatch(/evaluate|compare|prioritize|consider/)
    })
  })

  describe('Coaching Quality Benchmarks', () => {
    it('should meet minimum quality thresholds across all scenarios', async () => {
      const testScenarios = [
        {
          name: 'Early stage startup founder',
          context: {
            userProfile: { experienceLevel: 'beginner', industry: 'technology', role: 'founder' },
            currentBmadSession: { sessionId: 'test-1', pathway: 'business_model_design', phase: 'diagnosis' },
            previousInsights: []
          },
          userInput: 'I have an idea for a mobile app but don\'t know how to build a sustainable business around it'
        },
        {
          name: 'Experienced executive strategy challenge',
          context: {
            userProfile: { experienceLevel: 'advanced', industry: 'manufacturing', role: 'ceo' },
            currentBmadSession: { sessionId: 'test-2', pathway: 'strategic_analysis', phase: 'evaluation' },
            previousInsights: [{ insight: 'Digital transformation requirements identified', confidence: 0.8 }]
          },
          userInput: 'We\'ve identified the need for digital transformation but have three competing approaches. How do we evaluate them?'
        },
        {
          name: 'Product manager market validation',
          context: {
            userProfile: { experienceLevel: 'intermediate', industry: 'saas', role: 'product_manager' },
            currentBmadSession: { sessionId: 'test-3', pathway: 'market_validation', phase: 'planning' },
            previousInsights: [
              { insight: 'Product-market fit signals positive', confidence: 0.8 },
              { insight: 'Enterprise sales cycle understood', confidence: 0.7 }
            ]
          },
          userInput: 'Our validation shows good product-market fit for enterprise customers. What\'s our go-to-market plan?'
        }
      ]

      const minThresholds = {
        questionQuality: 5,
        contextRelevance: 6,
        actionableAdvice: 6,
        bmadAlignment: 5,
        personaConsistency: 6,
        strategicDepth: 5,
        overallScore: 5.5
      }

      for (const scenario of testScenarios) {
        const response = await generateCoachingResponse(
          scenario.userInput,
          [],
          scenario.context as CoachingContext
        )

        const metrics = analyzer.analyzeResponse(
          scenario.userInput,
          response,
          scenario.context as CoachingContext
        )

        const overallScore = analyzer.calculateOverallScore(metrics)

        // Assert minimum thresholds
        Object.entries(minThresholds).forEach(([metric, threshold]) => {
          if (metric === 'overallScore') {
            expect(overallScore).toBeGreaterThanOrEqual(threshold)
          } else {
            expect(metrics[metric as keyof CoachingMetrics]).toBeGreaterThanOrEqual(threshold)
          }
        })

        // Log metrics for analysis
        console.log(`Scenario: ${scenario.name}`)
        console.log('Metrics:', { ...metrics, overallScore })
        console.log('Response length:', response.length)
        console.log('---')
      }
    })

    it('should demonstrate coaching improvement over session duration', async () => {
      const context: CoachingContext = {
        userProfile: {
          experienceLevel: 'intermediate',
          industry: 'healthcare',
          role: 'founder'
        },
        currentBmadSession: {
          sessionId: 'improvement-test',
          pathway: 'strategic_analysis',
          phase: 'diagnosis'
        },
        previousInsights: []
      }

      const sessionProgress = [
        {
          turn: 1,
          userInput: 'I need help with healthcare startup strategy',
          expectedImprovement: 'baseline'
        },
        {
          turn: 5,
          userInput: 'We\'ve identified our target patient population and key pain points',
          expectedImprovement: 'context-building'
        },
        {
          turn: 10,
          userInput: 'Our analysis shows three strategic options for market entry. How do we evaluate them?',
          expectedImprovement: 'strategic-depth'
        }
      ]

      const sessionMetrics = []

      for (const progress of sessionProgress) {
        // Update context with accumulated insights
        if (progress.turn > 1) {
          context.previousInsights.push({
            insight: `Session insight from turn ${progress.turn - 1}`,
            confidence: 0.7
          })
        }

        const response = await generateCoachingResponse(progress.userInput, [], context)
        const metrics = analyzer.analyzeResponse(progress.userInput, response, context)
        const overallScore = analyzer.calculateOverallScore(metrics)

        sessionMetrics.push({
          turn: progress.turn,
          metrics,
          overallScore,
          responseLength: response.length
        })
      }

      // Should show improvement trends
      const scores = sessionMetrics.map(m => m.overallScore)
      
      // Later turns should generally score higher
      expect(scores[2]).toBeGreaterThanOrEqual(scores[0]) // Turn 10 >= Turn 1
      expect(scores[1]).toBeGreaterThanOrEqual(scores[0] * 0.9) // Turn 5 should be close to Turn 1

      // Strategic depth should improve as context builds
      const strategicDepthScores = sessionMetrics.map(m => m.metrics.strategicDepth)
      expect(strategicDepthScores[2]).toBeGreaterThan(strategicDepthScores[0])
    })
  })
})