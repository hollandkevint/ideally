/**
 * Feature Brief Templates and Quality Standards
 * Story 2.4c: Defines templates, examples, and validation rules for feature briefs
 */

/**
 * Quality standards for feature brief sections
 */
export const BRIEF_QUALITY_STANDARDS = {
  title: {
    minWords: 3,
    maxWords: 8,
    requiredPatterns: [
      /^(Add|Enable|Improve|Create|Build|Implement|Enhance|Develop|Integrate|Optimize|Automate|Streamline)/i
    ],
    examples: {
      good: [
        'Enable Real-time Collaboration in Documents',
        'Add Advanced Search Filtering',
        'Improve Mobile Navigation Experience'
      ],
      bad: [
        'Feature', // Too short
        'Add some new functionality to make things better', // Too long
        'The dashboard thing' // Doesn't start with action verb
      ]
    }
  },

  description: {
    minSentences: 2,
    maxSentences: 3,
    minLength: 50,
    maxLength: 400,
    examples: {
      good: [
        'Users need to collaborate on documents simultaneously to improve productivity and reduce version control issues. This feature enables real-time editing with presence indicators and conflict resolution. It provides immediate value through reduced email back-and-forth and faster decision-making.',
        'Current search functionality lacks advanced filtering, making it difficult for users to find specific records quickly. Enhanced search with filters, saved searches, and intelligent suggestions will reduce time-to-find by 80%.'
      ],
      bad: [
        'Good feature.', // Too short
        'This is a really important feature that we need to build because customers have been asking for it and it will help them do their work better and faster.', // Single run-on sentence, too long
        'Add search filters, sorting, saved searches, tags, categories, and smart suggestions.' // Lists features instead of business value
      ]
    }
  },

  userStories: {
    minCount: 3,
    maxCount: 5,
    format: /^As a .+, I want .+ so that .+$/i,
    examples: {
      good: [
        'As a content editor, I want to see who else is editing the document so that I can avoid conflicting changes',
        'As a team manager, I want to review collaboration analytics so that I can understand team productivity patterns',
        'As a mobile user, I want offline editing with sync so that I can work without internet connectivity'
      ],
      bad: [
        'Users want to collaborate', // Doesn't follow format
        'As a user, I want collaboration', // Missing "so that" clause
        'As a developer, I want to use WebSockets for real-time data', // Implementation detail, not user value
        'As a user, I want to edit documents' // Too generic, no benefit
      ]
    }
  },

  acceptanceCriteria: {
    minCount: 5,
    maxCount: 7,
    minLength: 20,
    examples: {
      good: [
        'Given two users are editing the same document, when one user makes a change, then the other user sees the update within 2 seconds',
        'The feature must support keyboard-only navigation for accessibility',
        'Error messages must clearly indicate the issue and suggest a resolution',
        'Feature must maintain 99.9% uptime during business hours',
        'Data must be validated before submission with clear error feedback'
      ],
      bad: [
        'Works well', // Not specific
        'Is fast', // Not measurable
        'User likes it', // Not testable
        'Should be good' // Vague
      ]
    }
  },

  successMetrics: {
    minCount: 3,
    maxCount: 5,
    requiresTimeframe: true,
    requiresNumber: true,
    examples: {
      good: [
        'Increase user engagement by 15% within 60 days of launch',
        'Reduce support tickets related to collaboration by 20% in first quarter',
        'Achieve 80% feature adoption among active users within 30 days',
        'Improve task completion rate from 65% to 85% within 90 days',
        'Decrease average time-to-completion by 30% within first month'
      ],
      bad: [
        'Make users happy', // Not measurable
        'Increase engagement', // No target or timeframe
        'Better performance', // Vague
        'More users adopt the feature' // No specific target
      ]
    }
  },

  implementationNotes: {
    minCount: 3,
    maxCount: 5,
    examples: {
      good: [
        'This is a Quick Wins feature (high impact, low effort) - prioritize for immediate development',
        'Requires real-time infrastructure setup before implementation',
        'Consider phased rollout starting with 10% of users',
        'Security review required for data synchronization approach',
        'Plan for 2 weeks development + 1 week testing'
      ],
      bad: [
        'Build it', // Not helpful
        'Use React', // Too specific/implementation detail
        'Important feature' // Obvious, not actionable
      ]
    }
  }
};

/**
 * Brief section templates with guidance
 */
export const BRIEF_SECTION_TEMPLATES = {
  title: {
    prompt: 'Generate a concise, action-oriented feature title (3-8 words)',
    requirements: [
      'Start with an action verb (Add, Enable, Improve, Create, etc.)',
      'Focus on user benefit, not implementation',
      'Be specific about what changes',
      'Use professional PM language',
      'Avoid jargon and technical terms'
    ]
  },

  description: {
    prompt: 'Write a 2-3 sentence executive summary',
    requirements: [
      'First sentence: What and why',
      'Second sentence: Key benefit',
      'Third sentence (optional): Business value',
      'Focus on outcomes, not implementation',
      'Use clear, professional language'
    ]
  },

  userStories: {
    prompt: 'Generate 3-5 user stories in standard format',
    requirements: [
      'Format: "As a [user type], I want [capability] so that [benefit]"',
      'Cover main user workflows',
      'Focus on user value, not features',
      'Be specific and testable',
      'Order by importance'
    ]
  },

  acceptanceCriteria: {
    prompt: 'Generate 5-7 acceptance criteria',
    requirements: [
      'Be specific and measurable',
      'Testable by QA/dev team',
      'Cover happy path and edge cases',
      'Clear pass/fail conditions',
      'Use "Given/When/Then" format where helpful'
    ]
  },

  successMetrics: {
    prompt: 'Define 3-5 measurable success metrics',
    requirements: [
      'Quantifiable with specific targets',
      'Include timeframes (e.g., "within 30 days")',
      'Mix of leading and lagging indicators',
      'Realistic and achievable',
      'Business-focused'
    ]
  },

  implementationNotes: {
    prompt: 'Create implementation notes highlighting priority and effort',
    requirements: [
      'Recommended implementation approach',
      'Risk factors to consider',
      'Resource requirements',
      'Timeline suggestions',
      'Dependencies to address'
    ]
  }
};

/**
 * Priority-based guidance for implementation notes
 */
export const PRIORITY_IMPLEMENTATION_GUIDANCE = {
  'Quick Wins': {
    approach: 'Fast-track for immediate implementation',
    timeline: '1-2 weeks development',
    resources: 'Single developer or small team',
    risks: 'Minimal - focus on quick delivery',
    notes: [
      'Prioritize for immediate development sprint',
      'Consider MVP approach to ship faster',
      'Plan for rapid user feedback collection',
      'Document learnings for future features'
    ]
  },

  'Major Projects': {
    approach: 'Strategic planning with phased delivery',
    timeline: '4-8 weeks with milestones',
    resources: 'Full team with dedicated PM',
    risks: 'High complexity - plan carefully',
    notes: [
      'Break into smaller deliverable phases',
      'Assign dedicated project manager',
      'Plan comprehensive testing strategy',
      'Consider beta program for early feedback',
      'Document architecture decisions'
    ]
  },

  'Fill-ins': {
    approach: 'Fit into available capacity',
    timeline: 'Flexible - when team has bandwidth',
    resources: 'Use available developer time',
    risks: 'Low priority - may be deprioritized',
    notes: [
      'Schedule when team has available capacity',
      'Consider as learning opportunity for junior developers',
      'Batch with similar low-effort features',
      'Re-evaluate priority if requirements change'
    ]
  },

  'Time Wasters': {
    approach: 'Reconsider or defer indefinitely',
    timeline: 'Do not schedule',
    resources: 'None - avoid investment',
    risks: 'Poor ROI - diverts from high-value work',
    notes: [
      'Defer indefinitely unless requirements change dramatically',
      'Document reasoning for future reference',
      'Propose alternative approaches that improve ROI',
      'Consider if problem can be solved differently'
    ]
  }
};

/**
 * Category-based implementation guidance
 */
export const CATEGORY_IMPLEMENTATION_GUIDANCE = {
  'Critical': {
    timeline: 'Immediate - current sprint',
    testing: 'Comprehensive testing required',
    review: 'Executive and stakeholder review',
    monitoring: 'Real-time monitoring post-launch',
    rollout: 'Phased rollout with kill switch'
  },

  'High': {
    timeline: '1-2 sprints',
    testing: 'Standard QA process',
    review: 'PM and tech lead review',
    monitoring: 'Daily metrics review for first week',
    rollout: 'Standard deployment process'
  },

  'Medium': {
    timeline: 'Next quarter planning',
    testing: 'Standard testing',
    review: 'PM review',
    monitoring: 'Weekly metrics',
    rollout: 'Standard deployment'
  },

  'Low': {
    timeline: 'Backlog - revisit quarterly',
    testing: 'Basic testing',
    review: 'Developer review',
    monitoring: 'Monthly metrics',
    rollout: 'Batch deployment'
  }
};

/**
 * Validation message templates
 */
export const VALIDATION_MESSAGES = {
  title: {
    tooShort: (count: number) => `Title is too short (${count} words). Aim for 3-8 words.`,
    tooLong: (count: number) => `Title is too long (${count} words). Keep it to 3-8 words for clarity.`,
    noActionVerb: 'Title should start with an action verb (Add, Enable, Improve, etc.)',
    example: 'Example: "Enable Real-time Collaboration in Documents"'
  },

  description: {
    tooShort: 'Description is too short. Aim for 2-3 sentences (minimum 50 characters).',
    tooLong: 'Description may be too long. Keep it concise (maximum 400 characters).',
    example: 'Example: "Users need X to achieve Y. This feature provides Z. It delivers value through A, B, and C."'
  },

  userStory: {
    wrongFormat: (index: number) => `User story ${index + 1} doesn't follow standard format: "As a [user], I want [capability] so that [benefit]"`,
    tooFew: 'Add at least 3 user stories to cover main workflows',
    example: 'Example: "As a content editor, I want to see who else is editing so that I can avoid conflicting changes"'
  },

  acceptanceCriteria: {
    tooShort: (index: number) => `Acceptance criterion ${index + 1} is too brief. Be more specific (minimum 20 characters).`,
    tooFew: 'Add at least 5 acceptance criteria for comprehensive coverage',
    example: 'Example: "Given two users are editing, when one makes a change, then the other sees it within 2 seconds"'
  },

  successMetric: {
    notMeasurable: (index: number) => `Success metric ${index + 1} may not be measurable. Include specific numbers and timeframes.`,
    tooFew: 'Add at least 3 success metrics to track feature impact',
    example: 'Example: "Increase user engagement by 15% within 60 days of launch"'
  }
};

/**
 * Generate contextual implementation notes based on priority scoring
 */
export function generateImplementationGuidance(
  quadrant: string,
  category: string,
  effortScore: number,
  impactScore: number
): string[] {
  const quadrantGuidance = PRIORITY_IMPLEMENTATION_GUIDANCE[quadrant as keyof typeof PRIORITY_IMPLEMENTATION_GUIDANCE];
  const categoryGuidance = CATEGORY_IMPLEMENTATION_GUIDANCE[category as keyof typeof CATEGORY_IMPLEMENTATION_GUIDANCE];

  const notes: string[] = [];

  // Quadrant-specific guidance
  if (quadrantGuidance) {
    notes.push(`This is a ${quadrant} feature - ${quadrantGuidance.approach.toLowerCase()}`);
    notes.push(`Timeline: ${quadrantGuidance.timeline}`);
    notes.push(`Resources: ${quadrantGuidance.resources}`);
  }

  // Category-specific guidance
  if (categoryGuidance) {
    notes.push(`Priority: ${category} - ${categoryGuidance.timeline}`);
    notes.push(`Testing: ${categoryGuidance.testing}`);
    notes.push(`Rollout: ${categoryGuidance.rollout}`);
  }

  // Effort-based guidance
  if (effortScore >= 8) {
    notes.push('High effort required - plan for extended development timeline and comprehensive testing');
  } else if (effortScore >= 5) {
    notes.push('Moderate effort - standard development sprint with normal QA process');
  } else {
    notes.push('Low effort - can be completed quickly with minimal resources');
  }

  // Impact-based guidance
  if (impactScore >= 8) {
    notes.push('High impact - plan for user training, documentation, and change management');
  } else if (impactScore >= 5) {
    notes.push('Moderate impact - standard rollout communication and user guidance');
  } else {
    notes.push('Low impact - minimal user communication required');
  }

  return notes.slice(0, 5); // Limit to 5 notes
}

/**
 * Brief template export formats
 */
export const EXPORT_FORMATS = {
  markdown: {
    extension: '.md',
    mimeType: 'text/markdown',
    name: 'Markdown'
  },
  text: {
    extension: '.txt',
    mimeType: 'text/plain',
    name: 'Plain Text'
  },
  pdf: {
    extension: '.pdf',
    mimeType: 'application/pdf',
    name: 'PDF Document'
  }
};