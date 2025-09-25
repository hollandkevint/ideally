'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import { authLogger } from '../monitoring/auth-logger'
import { OAuthStateManager } from './oauth-state-manager'
import { OAuthValidator } from './oauth-validation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithGoogleIdToken: (idToken: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session?.user?.email || 'No user')
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: Auth state change:', {
        event,
        user: session?.user?.email || 'No user',
        provider: session?.user?.app_metadata?.provider,
        timestamp: new Date().toISOString()
      })

      // Do not set loading to false on initial session load without a user.
      // This can happen during an OAuth redirect before the session is fully established.
      const isInitialSessionWithNoUser = event === 'INITIAL_SESSION' && !session?.user;
      if (!isInitialSessionWithNoUser) {
        setLoading(false);
      }
      
      setUser(session?.user ?? null)
      
      // Handle authentication events with structured logging
      if (event === 'SIGNED_IN' && session) {
        const authMethod = session.user.app_metadata?.provider === 'google' ? 'oauth_google' : 'email_password'

        // This success event is already logged in the callback for OAuth
        // Only log if it's email/password authentication
        if (authMethod === 'email_password') {
          authLogger.logAuthSuccess(
            authMethod,
            session.user.id,
            session.user.email || '',
            0, // Latency not tracked for context events
            `context_signin_${Date.now()}`,
            session.access_token.substring(0, 10) + '...'
          )
        }
      } else if (event === 'SIGNED_OUT') {
        if (session?.user) {
          authLogger.logLogout(
            session.user.id,
            session.access_token?.substring(0, 10) + '...'
          )
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        authLogger.logSessionRefresh(
          session.user.id,
          session.access_token.substring(0, 10) + '...'
        )
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async () => {
    const startTime = Date.now()
    const correlationId = await authLogger.logAuthInitiation('oauth_google')

    try {
      console.log('AuthContext: Starting Google OAuth signin flow')

      // Validate OAuth configuration before starting
      const validationResult = OAuthValidator.validateAndLog()
      if (!validationResult.isValid) {
        throw new Error(`OAuth configuration error: ${validationResult.errors.join(', ')}`)
      }

      // Prepare for OAuth using state manager to prevent PKCE conflicts
      OAuthStateManager.prepareForNewOAuth()

      const redirectUrl = OAuthValidator.getRedirectUrl()
      console.log('AuthContext: Redirect URL:', redirectUrl)

      // Generate unique state parameter for our own tracking
      const authState = OAuthStateManager.generateState()

      // Store the state but let Supabase handle the OAuth state parameter
      console.log('AuthContext: Generated OAuth tracking state:', authState)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            // Remove custom state parameter - let Supabase handle OAuth state internally
          },
          // Explicitly enable PKCE flow
          skipBrowserRedirect: false,
          // Ensure proper scopes are requested
          scopes: 'email profile openid',
        },
      })

      if (error) {
        const latencyMs = Date.now() - startTime

        // Categorize error types
        let errorType = 'oauth_initiation_error'
        if (error.message?.includes('code') || error.message?.includes('PKCE')) {
          errorType = 'pkce_initiation_error'
        } else if (error.message?.includes('network')) {
          errorType = 'network_error'
        } else if (error.message?.includes('popup')) {
          errorType = 'popup_blocked'
        }

        await authLogger.logAuthFailure(
          'oauth_google',
          errorType,
          error.message || 'Google signin failed',
          latencyMs,
          correlationId
        )

        // Check for PKCE-specific errors
        if (error.message?.includes('code') || error.message?.includes('PKCE')) {
          console.error('AuthContext: PKCE flow error detected')
          throw new Error('Authentication verification error. Please clear your browser cookies and try again.')
        }

        throw new Error(error.message || 'Google signin failed')
      }

      if (data?.url) {
        console.log('AuthContext: Google OAuth redirect URL generated successfully')
        // Ensure we're redirecting to the OAuth URL
        window.location.href = data.url
      } else {
        console.error('AuthContext: No OAuth URL received from Supabase')
        throw new Error('Failed to initiate Google signin - no redirect URL received')
      }

    } catch (err) {
      const latencyMs = Date.now() - startTime
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      await authLogger.logAuthFailure(
        'oauth_google',
        'unexpected_error',
        errorMessage,
        latencyMs,
        correlationId
      )

      console.error('AuthContext: Unexpected error during Google signin:', {
        error: err,
        timestamp: new Date().toISOString()
      })
      throw err
    }
  }

  const signInWithGoogleIdToken = async (idToken: string) => {
    try {
      console.log('AuthContext: Starting Google ID token signin flow')
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken
      })
      
      if (error) {
        console.error('AuthContext: Google ID token signin error:', {
          message: error.message,
          status: error.status,
          name: error.name,
          timestamp: new Date().toISOString()
        })
        
        // Provide specific error messages based on error type
        let userMessage = 'Google signin failed'
        if (error.message?.includes('Invalid token')) {
          userMessage = 'Google signin token is invalid or expired'
        } else if (error.message?.includes('Network')) {
          userMessage = 'Network error during Google signin. Please try again.'
        } else if (error.message?.includes('Provider')) {
          userMessage = 'Google signin is not properly configured'
        }
        
        throw new Error(userMessage)
      }
      
      if (!data.user) {
        console.error('AuthContext: No user data received from Google signin')
        throw new Error('No user information received from Google')
      }
      
      console.log('AuthContext: Google signin successful:', {
        email: data.user.email,
        id: data.user.id,
        provider: data.user.app_metadata?.provider,
        timestamp: new Date().toISOString()
      })
      
    } catch (err) {
      console.error('AuthContext: Unexpected error during Google signin:', {
        error: err,
        timestamp: new Date().toISOString()
      })
      throw err
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const startTime = Date.now()
    const correlationId = await authLogger.logAuthInitiation('email_password')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      const latencyMs = Date.now() - startTime

      if (error) {
        // Categorize email auth errors
        let errorType = 'email_auth_error'
        if (error.message?.includes('Invalid login credentials')) {
          errorType = 'invalid_credentials'
        } else if (error.message?.includes('Email not confirmed')) {
          errorType = 'email_not_confirmed'
        } else if (error.message?.includes('Too many requests')) {
          errorType = 'rate_limited'
        } else if (error.message?.includes('network')) {
          errorType = 'network_error'
        }

        await authLogger.logAuthFailure(
          'email_password',
          errorType,
          error.message,
          latencyMs,
          correlationId,
          undefined // No user ID available for failed auth
        )
      } else if (data?.user) {
        await authLogger.logAuthSuccess(
          'email_password',
          data.user.id,
          data.user.email || '',
          latencyMs,
          correlationId,
          data.session?.access_token?.substring(0, 10) + '...'
        )
      }

      return { error }
    } catch (err) {
      const latencyMs = Date.now() - startTime
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      await authLogger.logAuthFailure(
        'email_password',
        'unexpected_error',
        errorMessage,
        latencyMs,
        correlationId
      )

      throw err
    }
  }

  const value = {
    user,
    loading,
    signOut,
    signInWithGoogle,
    signInWithGoogleIdToken,
    signInWithEmail,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}