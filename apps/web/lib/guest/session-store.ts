/**
 * Guest Session Store
 *
 * Manages temporary guest sessions using localStorage.
 * No database writes - all data stored client-side.
 *
 * Story 6.5: 10-Message Trial Gate with soft/hard gate system
 */

export interface GuestMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface GuestSession {
  id: string
  messages: GuestMessage[]
  messageCount: number
  createdAt: string
  lastActivityAt: string
  softGateDismissed?: boolean // Story 6.5: Track if user dismissed soft gate
}

// Story 6.5: Trial gate configuration
export const TRIAL_CONFIG = {
  softGate: 10,    // Show modal, allow dismiss for 2 more messages
  hardGate: 12,    // Must signup to continue
  partialOutputAt: 10 // Generate partial output preview at this point
} as const

export type TrialStatus =
  | { status: 'active'; remaining: number }
  | { status: 'soft_gate'; remaining: number }
  | { status: 'hard_gate'; remaining: 0 }

const STORAGE_KEY = 'thinkhaven_guest_session'
const MAX_MESSAGES = TRIAL_CONFIG.hardGate

export class GuestSessionStore {
  /**
   * Get current guest session from localStorage
   */
  static getSession(): GuestSession | null {
    if (typeof window === 'undefined') return null

    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return null

      const session = JSON.parse(data) as GuestSession
      return session
    } catch (error) {
      console.error('Failed to read guest session:', error)
      return null
    }
  }

  /**
   * Create new guest session
   */
  static createSession(): GuestSession {
    const session: GuestSession = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      messages: [],
      messageCount: 0,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    }

    this.saveSession(session)
    return session
  }

  /**
   * Get or create guest session
   */
  static getOrCreateSession(): GuestSession {
    const existing = this.getSession()
    if (existing) return existing
    return this.createSession()
  }

  /**
   * Save session to localStorage
   */
  static saveSession(session: GuestSession): void {
    if (typeof window === 'undefined') return

    try {
      session.lastActivityAt = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save guest session:', error)
    }
  }

  /**
   * Add message to session
   */
  static addMessage(role: 'user' | 'assistant', content: string): GuestSession {
    const session = this.getOrCreateSession()

    const message: GuestMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role,
      content,
      timestamp: new Date().toISOString()
    }

    session.messages.push(message)

    // Only increment count for user messages
    if (role === 'user') {
      session.messageCount++
    }

    this.saveSession(session)
    return session
  }

  /**
   * Check if message limit reached (hard gate)
   */
  static hasReachedLimit(): boolean {
    const session = this.getSession()
    if (!session) return false
    return session.messageCount >= TRIAL_CONFIG.hardGate
  }

  /**
   * Get remaining messages (to hard gate)
   */
  static getRemainingMessages(): number {
    const session = this.getSession()
    if (!session) return TRIAL_CONFIG.softGate
    return Math.max(0, TRIAL_CONFIG.hardGate - session.messageCount)
  }

  /**
   * Story 6.5: Get trial status with soft/hard gate distinction
   */
  static getTrialStatus(): TrialStatus {
    const session = this.getSession()
    if (!session) {
      return { status: 'active', remaining: TRIAL_CONFIG.softGate }
    }

    const { messageCount, softGateDismissed } = session

    if (messageCount >= TRIAL_CONFIG.hardGate) {
      return { status: 'hard_gate', remaining: 0 }
    }

    if (messageCount >= TRIAL_CONFIG.softGate) {
      // If soft gate was dismissed, they can continue to hard gate
      if (softGateDismissed) {
        return {
          status: 'soft_gate',
          remaining: TRIAL_CONFIG.hardGate - messageCount
        }
      }
      // First time hitting soft gate
      return { status: 'soft_gate', remaining: TRIAL_CONFIG.hardGate - messageCount }
    }

    return {
      status: 'active',
      remaining: TRIAL_CONFIG.softGate - messageCount
    }
  }

  /**
   * Story 6.5: Check if at soft gate (show modal)
   */
  static isAtSoftGate(): boolean {
    const session = this.getSession()
    if (!session) return false
    return session.messageCount >= TRIAL_CONFIG.softGate &&
           session.messageCount < TRIAL_CONFIG.hardGate &&
           !session.softGateDismissed
  }

  /**
   * Story 6.5: Dismiss soft gate (allow 2 more messages)
   */
  static dismissSoftGate(): void {
    const session = this.getSession()
    if (!session) return

    session.softGateDismissed = true
    this.saveSession(session)
  }

  /**
   * Story 6.5: Check if partial output should be generated
   */
  static shouldShowPartialOutput(): boolean {
    const session = this.getSession()
    if (!session) return false
    return session.messageCount >= TRIAL_CONFIG.partialOutputAt
  }

  /**
   * Clear guest session
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear guest session:', error)
    }
  }

  /**
   * Get session data for migration
   */
  static getSessionForMigration(): {
    sessionId: string
    messages: GuestMessage[]
    messageCount: number
  } | null {
    const session = this.getSession()
    if (!session) return null

    return {
      sessionId: session.id,
      messages: session.messages,
      messageCount: session.messageCount
    }
  }
}
