export interface DemoMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    strategic_tags?: string[]
  }
}

export interface DemoScenario {
  name: string
  description: string
  chat_context: DemoMessage[]
}

export interface DemoScenarios {
  scenarios: DemoScenario[]
}

export interface ScenarioCardProps {
  scenario: DemoScenario
  scenarioIndex: number
  onSelect: (index: number) => void
}