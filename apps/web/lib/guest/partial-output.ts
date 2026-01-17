/**
 * Partial Output Generator
 * Story 6.5: Generates preview data for trial gate modal
 *
 * Creates a "teaser" of what the user has built to encourage signup:
 * - Lean Canvas preview (problem, solution, UVP)
 * - PRD outline (headers only)
 * - Viability score teaser
 */

import type { GuestMessage } from './session-store'

export interface PartialOutput {
  leanCanvasPreview: LeanCanvasPreview
  prdOutline: string[]
  viabilityTeaser: ViabilityTeaser
  conversationHighlights: string[]
}

export interface LeanCanvasPreview {
  problem: string | null
  solution: string | null
  uniqueValueProposition: string | null
  targetCustomer: string | null
  // Rest shown as "Sign up to see more..."
  additionalSectionsCount: number
}

export interface ViabilityTeaser {
  score: number // 1-10
  topStrength: string
  topIssue: string
  message: string
}

/**
 * Generate partial output preview from guest conversation
 * Story 6.5: Creates compelling preview for trial gate modal
 */
export function generatePartialOutput(messages: GuestMessage[]): PartialOutput {
  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  const allContent = messages.map(m => m.content).join('\n')

  return {
    leanCanvasPreview: extractLeanCanvasPreview(allContent, userMessages),
    prdOutline: generatePRDOutline(allContent),
    viabilityTeaser: generateViabilityTeaser(allContent, userMessages.length),
    conversationHighlights: extractHighlights(messages)
  }
}

/**
 * Extract Lean Canvas preview sections from conversation
 */
function extractLeanCanvasPreview(content: string, userMessages: GuestMessage[]): LeanCanvasPreview {
  const lowerContent = content.toLowerCase()

  // Try to extract problem
  let problem: string | null = null
  const problemPatterns = [
    /(?:problem|challenge|pain point|struggle|issue)[:\s]+([^.!?]+[.!?])/gi,
    /(?:trying to|need to|want to|looking for)[:\s]+([^.!?]+[.!?])/gi
  ]
  for (const pattern of problemPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      problem = match[1].trim().slice(0, 150)
      break
    }
  }
  // Fallback: first substantial user message often describes the problem
  if (!problem && userMessages[0]) {
    const firstMessage = userMessages[0].content
    if (firstMessage.length > 30) {
      problem = firstMessage.slice(0, 150) + (firstMessage.length > 150 ? '...' : '')
    }
  }

  // Try to extract solution
  let solution: string | null = null
  const solutionPatterns = [
    /(?:solution|idea|concept|product|app|tool|service)[:\s]+([^.!?]+[.!?])/gi,
    /(?:building|creating|developing|making)[:\s]+([^.!?]+[.!?])/gi
  ]
  for (const pattern of solutionPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      solution = match[1].trim().slice(0, 150)
      break
    }
  }

  // Try to extract UVP
  let uniqueValueProposition: string | null = null
  const uvpPatterns = [
    /(?:unique|different|better|special)[:\s]+([^.!?]+[.!?])/gi,
    /(?:value proposition|uvp|differentiator)[:\s]+([^.!?]+[.!?])/gi
  ]
  for (const pattern of uvpPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      uniqueValueProposition = match[1].trim().slice(0, 150)
      break
    }
  }

  // Try to extract target customer
  let targetCustomer: string | null = null
  const customerPatterns = [
    /(?:target|customer|user|audience|market)[:\s]+([^.!?]+[.!?])/gi,
    /(?:for|designed for|built for|made for)[:\s]+([^.!?]+[.!?])/gi
  ]
  for (const pattern of customerPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      targetCustomer = match[1].trim().slice(0, 100)
      break
    }
  }

  // Calculate how many additional sections could be filled
  const potentialSections = ['keyMetrics', 'channels', 'costStructure', 'revenueStreams', 'unfairAdvantage']
  let additionalSectionsCount = 0
  for (const section of potentialSections) {
    if (lowerContent.includes(section.toLowerCase().replace(/([A-Z])/g, ' $1').trim())) {
      additionalSectionsCount++
    }
  }
  // Estimate based on conversation length
  additionalSectionsCount = Math.max(additionalSectionsCount, Math.min(5, Math.floor(userMessages.length / 2)))

  return {
    problem,
    solution,
    uniqueValueProposition,
    targetCustomer,
    additionalSectionsCount
  }
}

/**
 * Generate PRD outline (headers only)
 */
function generatePRDOutline(content: string): string[] {
  const outline = [
    'Executive Summary',
    'Problem Statement',
    'Target Users'
  ]

  const lowerContent = content.toLowerCase()

  // Add more sections based on what was discussed
  if (lowerContent.includes('solution') || lowerContent.includes('feature') || lowerContent.includes('product')) {
    outline.push('Proposed Solution')
  }
  if (lowerContent.includes('metric') || lowerContent.includes('success') || lowerContent.includes('goal')) {
    outline.push('Success Criteria')
  }
  if (lowerContent.includes('risk') || lowerContent.includes('challenge') || lowerContent.includes('concern')) {
    outline.push('Risks & Mitigations')
  }
  if (lowerContent.includes('timeline') || lowerContent.includes('roadmap') || lowerContent.includes('phase')) {
    outline.push('Timeline')
  }

  // Always add viability at the end
  outline.push('Viability Assessment')

  return outline
}

/**
 * Generate viability teaser based on conversation content
 */
function generateViabilityTeaser(content: string, messageCount: number): ViabilityTeaser {
  const lowerContent = content.toLowerCase()

  // Calculate a rough viability score based on discussion depth
  let score = 5 // Start neutral

  // Positive signals
  if (lowerContent.includes('customer') || lowerContent.includes('user')) score += 0.5
  if (lowerContent.includes('problem') || lowerContent.includes('pain')) score += 0.5
  if (lowerContent.includes('solution') || lowerContent.includes('feature')) score += 0.5
  if (lowerContent.includes('revenue') || lowerContent.includes('business model')) score += 0.5
  if (lowerContent.includes('competitive') || lowerContent.includes('differentiate')) score += 0.5
  if (lowerContent.includes('validate') || lowerContent.includes('research')) score += 0.5

  // Conversation depth bonus
  if (messageCount >= 8) score += 0.5
  if (messageCount >= 10) score += 0.5

  // Cap at reasonable range
  score = Math.min(8, Math.max(3, score))

  // Determine top strength and issue based on content
  let topStrength = 'Clear problem identification'
  let topIssue = 'Market validation needed'

  if (lowerContent.includes('unique') || lowerContent.includes('different')) {
    topStrength = 'Strong differentiation potential'
  } else if (lowerContent.includes('user') && lowerContent.includes('need')) {
    topStrength = 'Clear user needs identified'
  }

  if (!lowerContent.includes('revenue') && !lowerContent.includes('monetize')) {
    topIssue = 'Revenue model needs definition'
  } else if (!lowerContent.includes('competitive') && !lowerContent.includes('competitor')) {
    topIssue = 'Competitive analysis recommended'
  }

  // Generate encouraging message
  const messages = [
    `Your idea shows ${score >= 6 ? 'strong' : 'good'} potential. Continue refining to unlock the full analysis.`,
    `You've covered key foundations. Sign up to see the complete viability breakdown.`,
    `Good progress! Your session has identified ${score >= 6 ? 'promising' : 'interesting'} opportunities.`
  ]

  return {
    score: Math.round(score),
    topStrength,
    topIssue,
    message: messages[Math.floor(Math.random() * messages.length)]
  }
}

/**
 * Extract conversation highlights (key topics discussed)
 */
function extractHighlights(messages: GuestMessage[]): string[] {
  const highlights: string[] = []
  const seenTopics = new Set<string>()

  for (const message of messages) {
    const lowerContent = message.content.toLowerCase()

    // Look for topic indicators
    const topicMap: Record<string, string> = {
      'problem': 'Identified core problem',
      'customer': 'Defined target customer',
      'solution': 'Outlined solution approach',
      'feature': 'Discussed key features',
      'revenue': 'Explored revenue model',
      'competitive': 'Analyzed competition',
      'risk': 'Identified potential risks',
      'validate': 'Discussed validation approach'
    }

    for (const [keyword, highlight] of Object.entries(topicMap)) {
      if (lowerContent.includes(keyword) && !seenTopics.has(keyword)) {
        highlights.push(highlight)
        seenTopics.add(keyword)
      }
    }

    // Limit to top 5 highlights
    if (highlights.length >= 5) break
  }

  // Ensure we have at least some highlights
  if (highlights.length === 0) {
    highlights.push('Started strategic exploration')
  }

  return highlights
}

/**
 * Get formatted summary for display
 */
export function formatPartialOutputSummary(partialOutput: PartialOutput): string {
  let summary = '## Your Session Progress\n\n'

  // Highlights
  summary += '### Topics Covered\n'
  partialOutput.conversationHighlights.forEach(h => {
    summary += `- ${h}\n`
  })
  summary += '\n'

  // Viability teaser
  summary += `### Viability Preview\n`
  summary += `Score: ${partialOutput.viabilityTeaser.score}/10\n`
  summary += `Strength: ${partialOutput.viabilityTeaser.topStrength}\n`
  summary += `Area to explore: ${partialOutput.viabilityTeaser.topIssue}\n\n`

  summary += `*${partialOutput.viabilityTeaser.message}*\n`

  return summary
}
