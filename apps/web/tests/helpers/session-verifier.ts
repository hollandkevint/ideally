import { Page, expect } from '@playwright/test'

export interface SessionInfo {
  isAuthenticated: boolean
  userId?: string
  email?: string
  provider?: string
  sessionExpiry?: number
  cookieData: {
    sessionCookie?: string
    refreshCookie?: string
    authCookie?: string
  }
}

export class SessionVerifier {
  constructor(private page: Page) {}

  async getSessionInfo(): Promise<SessionInfo> {
    const cookies = await this.page.context().cookies()

    // Look for Supabase auth cookies
    const authTokenCookie = cookies.find(c => c.name.includes('supabase-auth-token'))
    const sessionCookie = cookies.find(c => c.name.includes('session'))
    const refreshCookie = cookies.find(c => c.name.includes('refresh'))

    const isAuthenticated = !!(authTokenCookie || sessionCookie)

    // Extract session data from localStorage/sessionStorage if available
    const sessionData = await this.page.evaluate(() => {
      const localStorageAuth = localStorage.getItem('supabase.auth.token')
      const sessionStorageAuth = sessionStorage.getItem('supabase.auth.token')

      try {
        const authData = localStorageAuth || sessionStorageAuth
        return authData ? JSON.parse(authData) : null
      } catch {
        return null
      }
    })

    return {
      isAuthenticated,
      userId: sessionData?.user?.id,
      email: sessionData?.user?.email,
      provider: sessionData?.user?.app_metadata?.provider,
      sessionExpiry: sessionData?.expires_at,
      cookieData: {
        sessionCookie: sessionCookie?.value,
        refreshCookie: refreshCookie?.value,
        authCookie: authTokenCookie?.value
      }
    }
  }

  async verifyAuthenticatedState() {
    const sessionInfo = await this.getSessionInfo()
    expect(sessionInfo.isAuthenticated).toBe(true)

    // Verify we have essential session data
    expect(sessionInfo.cookieData.authCookie || sessionInfo.cookieData.sessionCookie).toBeTruthy()

    return sessionInfo
  }

  async verifyUnauthenticatedState() {
    const sessionInfo = await this.getSessionInfo()
    expect(sessionInfo.isAuthenticated).toBe(false)

    // Verify no auth cookies exist
    expect(sessionInfo.cookieData.authCookie).toBeFalsy()
    expect(sessionInfo.cookieData.sessionCookie).toBeFalsy()

    return sessionInfo
  }

  async verifySessionPersistence() {
    // Get session before refresh
    const beforeRefresh = await this.getSessionInfo()
    expect(beforeRefresh.isAuthenticated).toBe(true)

    // Refresh the page
    await this.page.reload()
    await this.page.waitForLoadState('networkidle')

    // Get session after refresh
    const afterRefresh = await this.getSessionInfo()
    expect(afterRefresh.isAuthenticated).toBe(true)

    // Verify session data is preserved
    expect(afterRefresh.userId).toBe(beforeRefresh.userId)
    expect(afterRefresh.email).toBe(beforeRefresh.email)

    return {
      beforeRefresh,
      afterRefresh,
      sessionPersisted: beforeRefresh.userId === afterRefresh.userId
    }
  }

  async verifySessionExpiry() {
    const sessionInfo = await this.getSessionInfo()

    if (sessionInfo.sessionExpiry) {
      const expiryTime = new Date(sessionInfo.sessionExpiry * 1000)
      const currentTime = new Date()

      return {
        isExpired: currentTime > expiryTime,
        expiryTime,
        currentTime,
        timeUntilExpiry: expiryTime.getTime() - currentTime.getTime()
      }
    }

    return {
      isExpired: false,
      expiryTime: null,
      currentTime: new Date(),
      timeUntilExpiry: null
    }
  }

  async verifyOAuthProviderData(expectedProvider: string = 'google') {
    const sessionInfo = await this.getSessionInfo()
    expect(sessionInfo.isAuthenticated).toBe(true)
    expect(sessionInfo.provider).toBe(expectedProvider)

    return {
      provider: sessionInfo.provider,
      email: sessionInfo.email,
      userId: sessionInfo.userId
    }
  }

  async clearSessionData() {
    // Clear all cookies
    await this.page.context().clearCookies()

    // Clear browser storage
    await this.page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Verify session is cleared
    const sessionInfo = await this.getSessionInfo()
    expect(sessionInfo.isAuthenticated).toBe(false)
  }

  async waitForSessionEstablishment(timeoutMs: number = 10000) {
    let attempts = 0
    const maxAttempts = timeoutMs / 500 // Check every 500ms

    while (attempts < maxAttempts) {
      const sessionInfo = await this.getSessionInfo()

      if (sessionInfo.isAuthenticated && sessionInfo.userId) {
        return sessionInfo
      }

      await this.page.waitForTimeout(500)
      attempts++
    }

    throw new Error(`Session was not established within ${timeoutMs}ms`)
  }

  async verifyRedirectAfterAuth(expectedPath: string = '/dashboard') {
    // Wait for navigation after authentication
    await this.page.waitForURL((url) => {
      return url.pathname === expectedPath
    }, { timeout: 15000 })

    const currentUrl = this.page.url()
    expect(new URL(currentUrl).pathname).toBe(expectedPath)

    // Verify we're authenticated at the target page
    const sessionInfo = await this.getSessionInfo()
    expect(sessionInfo.isAuthenticated).toBe(true)

    return {
      currentUrl,
      sessionInfo,
      redirectedCorrectly: new URL(currentUrl).pathname === expectedPath
    }
  }

  async monitorSessionChanges() {
    const changes: Array<{
      timestamp: number
      action: string
      sessionInfo: SessionInfo
    }> = []

    // Set up page listeners for navigation and storage changes
    this.page.on('framenavigated', async () => {
      const sessionInfo = await this.getSessionInfo()
      changes.push({
        timestamp: Date.now(),
        action: 'navigation',
        sessionInfo
      })
    })

    // Monitor storage changes
    await this.page.evaluate(() => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = function(key, value) {
        if (key.includes('auth') || key.includes('session')) {
          window.dispatchEvent(new CustomEvent('authStorageChange', {
            detail: { key, value, type: 'localStorage' }
          }))
        }
        return originalSetItem.call(this, key, value)
      }
    })

    this.page.on('console', async (msg) => {
      if (msg.text().includes('authStorageChange')) {
        const sessionInfo = await this.getSessionInfo()
        changes.push({
          timestamp: Date.now(),
          action: 'storage_change',
          sessionInfo
        })
      }
    })

    return {
      getChanges: () => changes,
      clear: () => changes.length = 0
    }
  }
}

// Helper function to validate session structure
export function validateSessionStructure(sessionInfo: SessionInfo) {
  const issues: string[] = []

  if (sessionInfo.isAuthenticated) {
    if (!sessionInfo.userId) {
      issues.push('Authenticated session missing userId')
    }

    if (!sessionInfo.email) {
      issues.push('Authenticated session missing email')
    }

    if (!sessionInfo.cookieData.authCookie && !sessionInfo.cookieData.sessionCookie) {
      issues.push('Authenticated session missing auth cookies')
    }
  } else {
    if (sessionInfo.cookieData.authCookie || sessionInfo.cookieData.sessionCookie) {
      issues.push('Unauthenticated session still has auth cookies')
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}