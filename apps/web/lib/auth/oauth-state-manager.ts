/**
 * OAuth State Management Utilities
 *
 * Provides utilities to manage OAuth state isolation and prevent PKCE verification conflicts
 * across multiple authentication attempts or browser sessions.
 */

export interface OAuthState {
  state: string
  codeVerifier?: string
  timestamp: number
  attempt: number
}

export class OAuthStateManager {
  private static readonly STORAGE_KEY = 'thinkhaven_oauth_state'
  private static readonly MAX_ATTEMPTS = 3
  private static readonly STATE_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

  /**
   * Clear all OAuth-related state from browser storage
   */
  static clearOAuthState(): void {
    try {
      // Clear session storage
      sessionStorage.removeItem(this.STORAGE_KEY)
      sessionStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.pkce')

      // Clear local storage auth tokens that might conflict
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.pkce')

      // Clear any other OAuth-related storage
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('oauth') || key.includes('pkce') || key.includes('auth')) {
          sessionStorage.removeItem(key)
        }
      })

      console.log('OAuthStateManager: Cleared all OAuth-related state')
    } catch (error) {
      console.warn('OAuthStateManager: Error clearing OAuth state:', error)
    }
  }

  /**
   * Generate a new OAuth state with collision prevention
   */
  static generateState(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 12)
    const state = `oauth_${timestamp}_${random}`

    try {
      const oauthState: OAuthState = {
        state,
        timestamp,
        attempt: 1
      }

      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(oauthState))
      console.log('OAuthStateManager: Generated new OAuth state:', state)
    } catch (error) {
      console.warn('OAuthStateManager: Could not store OAuth state:', error)
    }

    return state
  }

  /**
   * Validate OAuth state and check for conflicts
   */
  static validateState(receivedState: string | null): {
    isValid: boolean
    shouldRetry: boolean
    error?: string
  } {
    if (!receivedState) {
      return {
        isValid: false,
        shouldRetry: false,
        error: 'No OAuth state received'
      }
    }

    try {
      const storedStateData = sessionStorage.getItem(this.STORAGE_KEY)
      if (!storedStateData) {
        return {
          isValid: false,
          shouldRetry: true,
          error: 'No stored OAuth state found - possible session conflict'
        }
      }

      const oauthState: OAuthState = JSON.parse(storedStateData)
      const now = Date.now()

      // Check if state has expired
      if (now - oauthState.timestamp > this.STATE_TIMEOUT_MS) {
        this.clearOAuthState()
        return {
          isValid: false,
          shouldRetry: true,
          error: 'OAuth state expired'
        }
      }

      // Check if state matches
      if (oauthState.state !== receivedState) {
        return {
          isValid: false,
          shouldRetry: oauthState.attempt < this.MAX_ATTEMPTS,
          error: 'OAuth state mismatch - possible PKCE conflict'
        }
      }

      // State is valid
      return {
        isValid: true,
        shouldRetry: false
      }

    } catch (error) {
      console.error('OAuthStateManager: Error validating state:', error)
      return {
        isValid: false,
        shouldRetry: true,
        error: 'Error validating OAuth state'
      }
    }
  }

  /**
   * Increment attempt counter for retry logic
   */
  static incrementAttempt(): number {
    try {
      const storedStateData = sessionStorage.getItem(this.STORAGE_KEY)
      if (storedStateData) {
        const oauthState: OAuthState = JSON.parse(storedStateData)
        oauthState.attempt += 1
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(oauthState))
        return oauthState.attempt
      }
    } catch (error) {
      console.warn('OAuthStateManager: Error incrementing attempt:', error)
    }
    return 1
  }

  /**
   * Check if maximum attempts have been reached
   */
  static hasExceededMaxAttempts(): boolean {
    try {
      const storedStateData = sessionStorage.getItem(this.STORAGE_KEY)
      if (storedStateData) {
        const oauthState: OAuthState = JSON.parse(storedStateData)
        return oauthState.attempt >= this.MAX_ATTEMPTS
      }
    } catch (error) {
      console.warn('OAuthStateManager: Error checking max attempts:', error)
    }
    return false
  }

  /**
   * Get current OAuth state information for debugging
   */
  static getStateInfo(): OAuthState | null {
    try {
      const storedStateData = sessionStorage.getItem(this.STORAGE_KEY)
      if (storedStateData) {
        return JSON.parse(storedStateData)
      }
    } catch (error) {
      console.warn('OAuthStateManager: Error getting state info:', error)
    }
    return null
  }

  /**
   * Perform comprehensive OAuth cleanup before new attempt
   */
  static prepareForNewOAuth(): void {
    console.log('OAuthStateManager: Preparing for new OAuth attempt')

    // Clear all OAuth state
    this.clearOAuthState()

    // Force garbage collection of any pending promises or timers
    if (typeof window !== 'undefined') {
      // Clear any pending OAuth-related intervals or timeouts
      const highestId = setTimeout(() => {}, 0)
      for (let i = 0; i < highestId; i++) {
        clearTimeout(i)
        clearInterval(i)
      }
    }
  }
}