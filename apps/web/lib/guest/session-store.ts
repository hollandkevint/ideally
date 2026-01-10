/**
 * Guest Session Store
 *
 * Manages temporary guest sessions using localStorage.
 * No database writes - all data stored client-side.
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
}

const STORAGE_KEY = 'thinkhaven_guest_session'
const MAX_MESSAGES = 10

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
   * Check if message limit reached
   */
  static hasReachedLimit(): boolean {
    const session = this.getSession()
    if (!session) return false
    return session.messageCount >= MAX_MESSAGES
  }

  /**
   * Get remaining messages
   */
  static getRemainingMessages(): number {
    const session = this.getSession()
    if (!session) return MAX_MESSAGES
    return Math.max(0, MAX_MESSAGES - session.messageCount)
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
