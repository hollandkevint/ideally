export const FEATURE_INPUT_GUIDANCE = {
  featureDescription: {
    placeholder: "Describe your feature idea in detail. What does it do? Who is it for? What problem does it solve?",
    helpText: "Be specific about functionality, target users, and the problem you're solving. The more detail you provide, the better guidance you'll receive.",
    examples: [
      "A mobile app feature that allows users to schedule recurring grocery deliveries with smart recommendations based on past purchases and dietary preferences.",
      "An integration that automatically syncs customer support tickets with our CRM system and creates follow-up tasks based on issue severity.",
      "A dashboard widget that shows real-time team productivity metrics with customizable goals and progress tracking."
    ]
  },
  targetUsers: {
    placeholder: "Who will use this feature? Describe your target user groups or personas.",
    helpText: "Consider demographics, behavior patterns, technical skill level, and specific needs.",
    examples: [
      "Busy working parents who value convenience and healthy eating",
      "Customer support managers who need visibility into team performance",
      "Small business owners who want to track employee productivity"
    ]
  },
  currentProblems: {
    placeholder: "What specific problems or pain points does this feature address?",
    helpText: "Focus on the current user frustrations or business inefficiencies this feature will solve.",
    examples: [
      "Users forget to order groceries and end up with empty fridges",
      "Support tickets get lost between systems causing customer frustration",
      "Managers have no visibility into which projects are blocking team progress"
    ]
  },
  successDefinition: {
    placeholder: "How will you know this feature is successful? What metrics or outcomes matter?",
    helpText: "Think about both user behavior changes and business metrics that would indicate success.",
    examples: [
      "20% increase in repeat grocery orders and 90% schedule adherence rate",
      "50% reduction in lost tickets and 2x faster resolution times",
      "Managers check dashboard daily and team productivity increases 15%"
    ]
  }
}

export const VALIDATION_MESSAGES = {
  required: "This field is required to generate quality analysis questions",
  tooShort: "Please provide more detail for better analysis",
  tooLong: "Please keep this within the character limit for optimal processing",
  goodLength: "Great! This level of detail will help generate focused questions"
}

export const PROGRESS_GUIDANCE = {
  step1: {
    title: "Feature Input & Validation",
    description: "Describe your feature concept and get AI-generated validation questions",
    timeEstimate: "3-5 minutes",
    tips: [
      "Be specific about what the feature does",
      "Include target user information when possible",
      "Describe the problem being solved",
      "Think about how success would be measured"
    ]
  }
}

export const CLAUDE_PROMPT_TEMPLATES = {
  featureAnalysis: `
Analyze this feature idea and generate 3-5 focused questions that help the product manager validate:
1. User value and need
2. Basic feasibility considerations
3. Success measurement approach

Feature Details:
{{feature_description}}
{{#target_users}}Target Users: {{target_users}}{{/target_users}}
{{#current_problems}}Current Problems: {{current_problems}}{{/current_problems}}
{{#success_definition}}Success Definition: {{success_definition}}{{/success_definition}}

Generate practical, actionable questions that guide feature refinement. Each question should:
- Be specific and actionable
- Help validate key assumptions
- Guide toward measurable outcomes
- Consider both user and business perspectives
- Be answerable through research or testing

Return only a JSON array of question strings.
`,

  contextualAnalysis: `
Based on this feature description, identify key validation areas and generate targeted questions:

{{feature_description}}

Focus on:
- Critical assumptions that need validation
- Potential technical or user experience challenges
- Success metrics and measurement approaches
- User research needs

Return 4-5 specific, actionable validation questions as a JSON array.
`
}

export function formatPromptTemplate(template: string, data: Record<string, any>): string {
  let formatted = template

  // Replace variables
  Object.entries(data).forEach(([key, value]) => {
    if (value) {
      formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), value)
      formatted = formatted.replace(new RegExp(`{{#${key}}}.*?{{/${key}}}`, 'g'), (match) => {
        return match.replace(`{{#${key}}}`, '').replace(`{{/${key}}}`, '')
      })
    } else {
      // Remove conditional blocks if value is empty
      formatted = formatted.replace(new RegExp(`{{#${key}}}.*?{{/${key}}}`, 'g'), '')
    }
  })

  // Clean up any remaining template syntax
  formatted = formatted.replace(/\{\{[^}]+\}\}/g, '')
  formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks

  return formatted.trim()
}