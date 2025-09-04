// Enhanced error handling utilities for BMad Method components

export interface UserFriendlyError {
  title: string
  message: string
  actionableSteps: string[]
  severity: 'low' | 'medium' | 'high'
  category: 'session' | 'pathway' | 'network' | 'database' | 'validation' | 'system'
  retryable: boolean
  supportCode?: string
}

export class BmadErrorHandler {
  /**
   * Converts any error into a user-friendly error with actionable guidance
   */
  static handleError(error: unknown, context?: string): UserFriendlyError {
    // If error is already a UserFriendlyError, return it
    if (this.isUserFriendlyError(error)) {
      return error
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorContext = context || 'general'

    // Database/Storage errors
    if (this.isDatabaseError(errorMessage)) {
      return this.createDatabaseError(errorMessage, errorContext)
    }

    // Network/Connection errors  
    if (this.isNetworkError(errorMessage)) {
      return this.createNetworkError(errorMessage, errorContext)
    }

    // Session-related errors
    if (this.isSessionError(errorMessage, errorContext)) {
      return this.createSessionError(errorMessage, errorContext)
    }

    // Pathway analysis errors
    if (this.isPathwayError(errorMessage, errorContext)) {
      return this.createPathwayError(errorMessage, errorContext)
    }

    // Validation errors
    if (this.isValidationError(errorMessage)) {
      return this.createValidationError(errorMessage, errorContext)
    }

    // API/Service errors
    if (this.isApiError(errorMessage)) {
      return this.createApiError(errorMessage, errorContext)
    }

    // Generic fallback with better messaging
    return this.createGenericError(errorMessage, errorContext)
  }

  private static isUserFriendlyError(error: unknown): error is UserFriendlyError {
    return typeof error === 'object' && error !== null && 'title' in error && 'message' in error
  }

  private static isDatabaseError(message: string): boolean {
    const dbKeywords = ['database', 'db', 'storage', 'persist', 'save', 'retrieve', 'record', 'query', 'sql', 'supabase']
    return dbKeywords.some(keyword => message.toLowerCase().includes(keyword))
  }

  private static isNetworkError(message: string): boolean {
    const networkKeywords = ['network', 'connection', 'fetch', 'request', 'timeout', 'offline', 'unreachable', 'cors']
    return networkKeywords.some(keyword => message.toLowerCase().includes(keyword))
  }

  private static isSessionError(message: string, context: string): boolean {
    const sessionKeywords = ['session', 'bmad', 'workspace']
    return sessionKeywords.some(keyword => message.toLowerCase().includes(keyword)) || 
           context.includes('session') || context.includes('bmad')
  }

  private static isPathwayError(message: string, context: string): boolean {
    const pathwayKeywords = ['pathway', 'analysis', 'intent', 'recommendation']
    return pathwayKeywords.some(keyword => message.toLowerCase().includes(keyword)) ||
           context.includes('pathway') || context.includes('analysis')
  }

  private static isValidationError(message: string): boolean {
    const validationKeywords = ['validation', 'invalid', 'required', 'format', 'length', 'missing']
    return validationKeywords.some(keyword => message.toLowerCase().includes(keyword))
  }

  private static isApiError(message: string): boolean {
    const apiKeywords = ['api', 'service', 'endpoint', 'server', 'response', 'status']
    return apiKeywords.some(keyword => message.toLowerCase().includes(keyword))
  }

  private static createDatabaseError(message: string, context: string): UserFriendlyError {
    if (message.includes('create') || context.includes('create')) {
      return {
        title: 'Unable to Save Your Work',
        message: 'We\'re having trouble saving your strategic session data. Your progress may not be preserved.',
        actionableSteps: [
          'Try your action again - it may work on the second attempt',
          'Copy any important insights to save externally',
          'Refresh the page and try creating a new session',
          'Contact support if you continue having issues'
        ],
        severity: 'high',
        category: 'database',
        retryable: true,
        supportCode: 'DB_CREATE_001'
      }
    }

    if (message.includes('retrieve') || message.includes('load')) {
      return {
        title: 'Cannot Load Your Session',
        message: 'We can\'t access your saved session data right now. This might be a temporary issue.',
        actionableSteps: [
          'Wait a moment and try refreshing the page',
          'Check if you can access other parts of the workspace',
          'Try starting a new session if this one won\'t load',
          'Your previous work should still be saved'
        ],
        severity: 'medium',
        category: 'database',
        retryable: true,
        supportCode: 'DB_RETRIEVE_001'
      }
    }

    return {
      title: 'Data Storage Issue',
      message: 'We\'re experiencing temporary issues with data storage that may affect saving your work.',
      actionableSteps: [
        'Try again - database issues are often temporary',
        'Make note of important insights in case they\'re not saved',
        'Check if the issue resolves after refreshing',
        'Contact support if this continues'
      ],
      severity: 'medium',
      category: 'database',
      retryable: true,
      supportCode: 'DB_GENERIC_001'
    }
  }

  private static createNetworkError(message: string, context: string): UserFriendlyError {
    return {
      title: 'Connection Problem',
      message: 'We can\'t reach our servers right now. This might be a network connectivity issue.',
      actionableSteps: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a few minutes and try again',
        'If you\'re on a corporate network, check if it blocks our service'
      ],
      severity: 'medium',
      category: 'network',
      retryable: true,
      supportCode: 'NET_CONNECTION_001'
    }
  }

  private static createSessionError(message: string, context: string): UserFriendlyError {
    if (message.includes('create') || message.includes('creation')) {
      return {
        title: 'Session Creation Failed',
        message: 'We couldn\'t start your strategic thinking session. This might be due to server overload or a technical issue.',
        actionableSteps: [
          'Wait a moment and try again',
          'Make sure you have a stable internet connection',
          'Try choosing a different pathway if available',
          'Refresh the page if the problem persists'
        ],
        severity: 'high',
        category: 'session',
        retryable: true,
        supportCode: 'SESSION_CREATE_001'
      }
    }

    if (message.includes('advance') || message.includes('progress')) {
      return {
        title: 'Session Progress Issue',
        message: 'We couldn\'t advance your session to the next step. Your current progress should be preserved.',
        actionableSteps: [
          'Try submitting your response again',
          'Check if your input meets any requirements (length, format)',
          'Refresh the page and continue from where you left off',
          'Your session progress is automatically saved'
        ],
        severity: 'medium',
        category: 'session',
        retryable: true,
        supportCode: 'SESSION_ADVANCE_001'
      }
    }

    return {
      title: 'Session Error',
      message: 'Something went wrong with your BMad Method session, but your progress should be preserved.',
      actionableSteps: [
        'Try refreshing the page to reload your session',
        'Your work is automatically saved as you progress',
        'Start a new session if this one won\'t recover',
        'Contact support if you notice missing work'
      ],
      severity: 'medium',
      category: 'session',
      retryable: true,
      supportCode: 'SESSION_GENERIC_001'
    }
  }

  private static createPathwayError(message: string, context: string): UserFriendlyError {
    if (message.includes('analysis') || message.includes('intent')) {
      return {
        title: 'Pathway Analysis Failed',
        message: 'We couldn\'t analyze your input to recommend the best strategic pathway for your needs.',
        actionableSteps: [
          'Try describing your challenge in different words',
          'Provide more details about your specific situation',
          'Choose a pathway manually if the analysis isn\'t working',
          'All pathways can help - don\'t worry about picking the "perfect" one'
        ],
        severity: 'low',
        category: 'pathway',
        retryable: true,
        supportCode: 'PATHWAY_ANALYSIS_001'
      }
    }

    return {
      title: 'Pathway Recommendation Issue',
      message: 'We\'re having trouble with the pathway selection system, but you can still proceed.',
      actionableSteps: [
        'Choose any pathway that seems relevant to your challenge',
        'You can always switch pathways later if needed',
        'Try the analysis again with a simpler description',
        'All BMad pathways are designed to provide value'
      ],
      severity: 'low',
      category: 'pathway',
      retryable: true,
      supportCode: 'PATHWAY_GENERIC_001'
    }
  }

  private static createValidationError(message: string, context: string): UserFriendlyError {
    return {
      title: 'Input Validation Error',
      message: 'There\'s an issue with the information you provided. Please check the requirements.',
      actionableSteps: [
        'Review any field requirements or character limits',
        'Make sure all required fields are filled out',
        'Check that your input doesn\'t contain special characters',
        'Try shortening your response if it\'s very long'
      ],
      severity: 'low',
      category: 'validation',
      retryable: true,
      supportCode: 'VALIDATION_001'
    }
  }

  private static createApiError(message: string, context: string): UserFriendlyError {
    return {
      title: 'Service Temporarily Unavailable',
      message: 'Our strategic analysis service is experiencing issues. This should resolve shortly.',
      actionableSteps: [
        'Wait a few minutes and try again',
        'Check if other features are working normally',
        'Try refreshing the page if the issue persists',
        'Your session data should be preserved during the outage'
      ],
      severity: 'medium',
      category: 'system',
      retryable: true,
      supportCode: 'API_SERVICE_001'
    }
  }

  private static createGenericError(message: string, context: string): UserFriendlyError {
    // Try to extract useful information from the error message
    const hasTimeout = message.toLowerCase().includes('timeout')
    const hasPermission = message.toLowerCase().includes('permission') || message.toLowerCase().includes('unauthorized')
    
    if (hasTimeout) {
      return {
        title: 'Request Timed Out',
        message: 'The operation took too long and was cancelled. This might be due to high server load.',
        actionableSteps: [
          'Try the operation again - it might work faster this time',
          'Check your internet connection stability',
          'Try breaking large operations into smaller steps',
          'Wait a few minutes if the servers seem overloaded'
        ],
        severity: 'medium',
        category: 'system',
        retryable: true,
        supportCode: 'TIMEOUT_001'
      }
    }

    if (hasPermission) {
      return {
        title: 'Access Permission Issue',
        message: 'You may not have permission to perform this action, or your session may have expired.',
        actionableSteps: [
          'Try refreshing the page to renew your session',
          'Make sure you\'re logged in properly',
          'Check if you have the necessary permissions for this workspace',
          'Contact your workspace admin if this continues'
        ],
        severity: 'medium',
        category: 'system',
        retryable: false,
        supportCode: 'PERMISSION_001'
      }
    }

    return {
      title: 'Unexpected Error',
      message: 'Something unexpected happened, but it\'s likely temporary. Your work should be preserved.',
      actionableSteps: [
        'Try the action again - many issues resolve on retry',
        'Refresh the page if the problem continues',
        'Check if other features are working normally',
        'Your progress is automatically saved, so you shouldn\'t lose work'
      ],
      severity: 'medium',
      category: 'system',
      retryable: true,
      supportCode: 'GENERIC_001'
    }
  }

  /**
   * Creates a formatted error message for logging/debugging
   */
  static formatErrorForLogging(error: unknown, context?: string): string {
    const userError = this.handleError(error, context)
    const originalError = error instanceof Error ? error.message : String(error)
    
    return `[${userError.supportCode || 'UNKNOWN'}] ${userError.title}: ${userError.message} | Original: ${originalError} | Context: ${context || 'none'}`
  }

  /**
   * Determines if an error should be retried automatically
   */
  static shouldRetry(error: unknown): boolean {
    const userError = this.handleError(error)
    return userError.retryable && userError.severity !== 'high'
  }
}