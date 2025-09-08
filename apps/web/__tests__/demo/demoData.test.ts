import { describe, it, expect } from 'vitest'
import { demoScenarios, getScenarioByIndex, getScenarioCount, getScenarioSlugs } from '../../lib/demo/demoData'

describe('Demo Data Utils', () => {
  it('should have 3 demo scenarios', () => {
    expect(demoScenarios).toHaveLength(3)
    expect(getScenarioCount()).toBe(3)
  })

  it('should return correct scenario by index', () => {
    const scenario0 = getScenarioByIndex(0)
    expect(scenario0).toBeDefined()
    expect(scenario0?.name).toBe('AnalyticsPro - Market Entry Strategy')
    
    const scenario1 = getScenarioByIndex(1)
    expect(scenario1?.name).toBe('Fintech Startup - Competitive Analysis')
    
    const scenario2 = getScenarioByIndex(2)
    expect(scenario2?.name).toBe('New Business Model Exploration')
  })

  it('should return null for invalid scenario index', () => {
    expect(getScenarioByIndex(10)).toBeNull()
    expect(getScenarioByIndex(-1)).toBeNull()
  })

  it('should generate correct scenario slugs', () => {
    const slugs = getScenarioSlugs()
    expect(slugs).toEqual(['0', '1', '2'])
  })

  it('should have valid message structure for each scenario', () => {
    demoScenarios.forEach(scenario => {
      expect(scenario.name).toBeTruthy()
      expect(scenario.description).toBeTruthy()
      expect(scenario.chat_context).toBeInstanceOf(Array)
      expect(scenario.chat_context.length).toBeGreaterThan(0)
      
      scenario.chat_context.forEach(message => {
        expect(message.id).toBeTruthy()
        expect(['user', 'assistant']).toContain(message.role)
        expect(message.content).toBeTruthy()
        expect(message.timestamp).toBeTruthy()
        expect(() => new Date(message.timestamp)).not.toThrow()
      })
    })
  })

  it('should have strategic tags where expected', () => {
    const scenario0 = demoScenarios[0]
    const assistantMessages = scenario0.chat_context.filter(msg => 
      msg.role === 'assistant' && msg.metadata?.strategic_tags
    )
    
    expect(assistantMessages.length).toBeGreaterThan(0)
    
    assistantMessages.forEach(message => {
      expect(message.metadata?.strategic_tags).toBeInstanceOf(Array)
      expect(message.metadata!.strategic_tags!.length).toBeGreaterThan(0)
    })
  })
})