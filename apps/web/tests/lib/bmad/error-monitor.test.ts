import { BmadErrorMonitor, errorMonitor } from '@/lib/bmad/error-monitor'

describe('BmadErrorMonitor', () => {
  beforeEach(() => {
    // Clear error log before each test
    errorMonitor.clearErrorLog()
    jest.clearAllMocks()
  })

  describe('capturePathwayError', () => {
    it('captures pathway selection errors with context', () => {
      const error = new Error('Pathway selection failed')
      const context = {
        workspaceId: 'workspace-123',
        pathway: 'new-idea',
        action: 'select-pathway' as const
      }

      const errorId = BmadErrorMonitor.capturePathwayError(error, context)

      expect(errorId).toMatch(/^error_\d+_[a-z0-9]+$/)

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors).toHaveLength(1)
      expect(recentErrors[0]).toMatchObject({
        id: errorId,
        error,
        context: expect.objectContaining({
          component: 'PathwaySelector',
          workspaceId: 'workspace-123',
          pathway: 'new-idea',
          action: 'select-pathway'
        }),
        severity: 'medium',
        userImpact: 'major'
      })
    })

    it('captures intent analysis errors with user input context', () => {
      const error = 'Intent analysis API failure'
      const context = {
        workspaceId: 'workspace-456',
        userInput: 'I want to build a mobile app',
        action: 'analyze-intent' as const
      }

      BmadErrorMonitor.capturePathwayError(error, context)

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0].context.userInput).toBe('I want to build a mobile app')
    })
  })

  describe('captureSessionError', () => {
    it('captures session creation errors with high severity', () => {
      const error = new Error('Session creation failed')
      const context = {
        sessionId: 'session-789',
        workspaceId: 'workspace-123',
        action: 'create-session' as const
      }

      BmadErrorMonitor.captureSessionError(error, context)

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0]).toMatchObject({
        severity: 'high',
        userImpact: 'blocking'
      })
    })

    it('captures session advance errors with medium severity', () => {
      const error = new Error('Session advance failed')
      const context = {
        sessionId: 'session-789',
        action: 'advance-session' as const
      }

      BmadErrorMonitor.captureSessionError(error, context)

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0]).toMatchObject({
        severity: 'medium',
        userImpact: 'major'
      })
    })
  })

  describe('captureElicitationError', () => {
    it('captures elicitation submission errors', () => {
      const error = new Error('Elicitation submission failed')
      const context = {
        sessionId: 'session-123',
        phaseId: 'discovery',
        selectedOption: 2,
        action: 'submit-response' as const
      }

      BmadErrorMonitor.captureElicitationError(error, context)

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0].context).toMatchObject({
        component: 'ElicitationPanel',
        sessionId: 'session-123',
        phaseId: 'discovery',
        selectedOption: 2
      })
    })
  })

  describe('captureApiError', () => {
    it('captures API errors with appropriate severity based on status code', () => {
      const error = new Error('Internal server error')
      const context = {
        endpoint: '/api/bmad',
        method: 'POST',
        statusCode: 500,
        action: 'create-session'
      }

      BmadErrorMonitor.captureApiError(error, context)

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0]).toMatchObject({
        severity: 'high', // 500 status code
        userImpact: 'major'
      })
    })

    it('captures service unavailable errors with blocking impact', () => {
      const error = new Error('Service unavailable')
      const context = {
        endpoint: '/api/bmad',
        statusCode: 503,
        action: 'fetch-pathways'
      }

      BmadErrorMonitor.captureApiError(error, context)

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0]).toMatchObject({
        userImpact: 'blocking' // 503 status code
      })
    })
  })

  describe('captureBoundaryError', () => {
    it('captures React error boundary errors', () => {
      const error = new Error('Component crashed')
      const errorInfo = {
        componentStack: 'in PathwaySelector\n  in ErrorBoundary'
      }

      BmadErrorMonitor.captureBoundaryError(error, errorInfo, 'PathwaySelector')

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0]).toMatchObject({
        context: {
          component: 'ErrorBoundary-PathwaySelector',
          action: 'component-crash',
          stack: 'in PathwaySelector\n  in ErrorBoundary'
        },
        severity: 'high',
        userImpact: 'major'
      })
    })
  })

  describe('getMetrics', () => {
    beforeEach(() => {
      // Add some test errors
      BmadErrorMonitor.capturePathwayError(new Error('Test 1'), { action: 'select-pathway' })
      BmadErrorMonitor.capturePathwayError(new Error('Test 2'), { action: 'analyze-intent' })
      BmadErrorMonitor.captureSessionError(new Error('Critical test'), { action: 'create-session' })
      BmadErrorMonitor.captureElicitationError(new Error('Test 3'), { action: 'submit-response' })
    })

    it('provides comprehensive error metrics', () => {
      const metrics = BmadErrorMonitor.getMetrics()

      expect(metrics.totalErrors).toBe(4)
      expect(metrics.criticalErrors).toBe(0) // create-session is high, not critical
      expect(metrics.errorsByComponent).toEqual({
        PathwaySelector: 2,
        SessionManager: 1,
        ElicitationPanel: 1
      })
      expect(metrics.errorsByAction).toEqual({
        'select-pathway': 1,
        'analyze-intent': 1,
        'create-session': 1,
        'submit-response': 1
      })
      expect(metrics.errorTrends).toHaveLength(7) // Last 7 days
    })

    it('calculates error trends correctly', () => {
      const metrics = BmadErrorMonitor.getMetrics()
      const today = metrics.errorTrends[metrics.errorTrends.length - 1]
      
      expect(today.count).toBe(4) // All errors added today
      expect(today.date).toBe(new Date().toISOString().split('T')[0])
    })
  })

  describe('getRecentErrors', () => {
    it('returns limited number of recent errors', () => {
      // Add more errors than limit
      for (let i = 0; i < 15; i++) {
        BmadErrorMonitor.capturePathwayError(new Error(`Test ${i}`), { action: 'select-pathway' })
      }

      const recentErrors = BmadErrorMonitor.getRecentErrors(10)
      expect(recentErrors).toHaveLength(10)
      
      // Should be in reverse chronological order (most recent first)
      expect(recentErrors[0].error).toEqual(new Error('Test 14'))
      expect(recentErrors[9].error).toEqual(new Error('Test 5'))
    })
  })

  describe('markResolved', () => {
    it('marks errors as resolved', () => {
      const errorId = BmadErrorMonitor.capturePathwayError(new Error('Test error'), { action: 'select-pathway' })
      
      expect(BmadErrorMonitor.markResolved(errorId)).toBe(true)
      
      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0].resolved).toBe(true)
    })

    it('returns false for non-existent error IDs', () => {
      expect(BmadErrorMonitor.markResolved('non-existent-id')).toBe(false)
    })
  })

  describe('error context enrichment', () => {
    it('automatically adds browser context in browser environment', () => {
      // Mock browser environment
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost:3000/workspace/123' },
        writable: true
      })
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Test Browser)',
        writable: true
      })

      BmadErrorMonitor.capturePathwayError(new Error('Test'), { action: 'select-pathway' })

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0].context.url).toBe('http://localhost:3000/workspace/123')
      expect(recentErrors[0].context.userAgent).toBe('Mozilla/5.0 (Test Browser)')
    })

    it('includes stack traces for Error objects', () => {
      const error = new Error('Test error with stack')
      error.stack = 'Error: Test error\n  at test (test.js:1:1)'

      BmadErrorMonitor.capturePathwayError(error, { action: 'select-pathway' })

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0].context.stack).toContain('Error: Test error')
    })
  })

  describe('error log management', () => {
    it('limits log size to prevent memory issues', () => {
      // Add many errors to test log size limit
      for (let i = 0; i < 1050; i++) {
        BmadErrorMonitor.capturePathwayError(new Error(`Test ${i}`), { action: 'select-pathway' })
      }

      const recentErrors = BmadErrorMonitor.getRecentErrors(2000)
      expect(recentErrors.length).toBeLessThanOrEqual(1000) // Max log size
    })

    it('maintains most recent errors when trimming', () => {
      for (let i = 0; i < 1050; i++) {
        BmadErrorMonitor.capturePathwayError(new Error(`Test ${i}`), { action: 'select-pathway' })
      }

      const recentErrors = BmadErrorMonitor.getRecentErrors(1)
      expect(recentErrors[0].error).toEqual(new Error('Test 1049')) // Most recent
    })
  })
})