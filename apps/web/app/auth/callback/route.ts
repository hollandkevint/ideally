import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authLogger } from '@/lib/monitoring/auth-logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const error_code = requestUrl.searchParams.get('error_code')
  const state = requestUrl.searchParams.get('state')

  // Generate correlation ID for this authentication attempt
  const correlationId = `oauth_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  console.log('OAuth Callback: Received request with params:', {
    hasCode: !!code,
    hasError: !!error,
    error,
    error_description,
    error_code,
    state,
    correlationId
  })

  // Handle OAuth errors
  if (error) {
    const latencyMs = Date.now() - startTime

    // Determine error type for categorization
    let errorType = 'oauth_general_error'
    if (error === 'invalid_request' && error_description?.includes('code')) {
      errorType = 'pkce_verification_failed'
    } else if (error === 'invalid_request' && error_code === 'bad_oauth_state') {
      errorType = 'oauth_state_mismatch'
    } else if (error === 'access_denied') {
      errorType = 'user_denied_access'
    } else if (error === 'invalid_grant') {
      errorType = 'invalid_authorization_code'
    }

    // Log structured error
    await authLogger.logAuthFailure(
      'oauth_google',
      errorType,
      error_description || error,
      latencyMs,
      correlationId
    )

    // Enhanced OAuth state error handling
    const isStateError = error === 'invalid_request' && error_code === 'bad_oauth_state'

    if (isStateError) {
      console.error('OAuth state validation failed - implementing comprehensive recovery', {
        error,
        error_description,
        error_code,
        state,
        correlationId
      })

      const response = NextResponse.redirect(
        `${requestUrl.origin}/login?error=oauth_state_error&message=${encodeURIComponent('Authentication state validation failed. Please try signing in again.')}&retry=state_error`
      )

      return response
    }

    // Enhanced PKCE error handling with better detection and recovery
    const isPkceError = (
      error === 'invalid_request' && error_description?.includes('code')
    ) || (
      error_description?.toLowerCase().includes('code verifier') ||
      error_description?.toLowerCase().includes('code challenge') ||
      error_description?.toLowerCase().includes('pkce')
    )

    if (isPkceError) {
      console.error('PKCE verification failed - implementing comprehensive recovery', {
        error,
        error_description,
        error_code,
        state,
        correlationId
      })

      // Clear any stale auth cookies and session storage that might be causing issues
      const cookieStore = await cookies()
      const allCookies = cookieStore.getAll()

      // Clear all Supabase and auth-related cookies
      allCookies.forEach(cookie => {
        if (cookie.name.startsWith('sb-') ||
            cookie.name.includes('auth') ||
            cookie.name.includes('pkce') ||
            cookie.name.includes('oauth')) {
          cookieStore.delete(cookie.name)
        }
      })

      // Create response with additional instructions for user
      const response = NextResponse.redirect(
        `${requestUrl.origin}/login?error=pkce_mismatch&message=${encodeURIComponent('Authentication verification failed. Please clear your browser cookies and try again.')}`
      )

      // Ensure cookies are properly cleared in the response
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')

      return response
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error_description || error)}`
    )
  }

  if (code) {
    const cookieStore = await cookies()

    // Create Supabase client with proper cookie handling for OAuth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, {
                  ...options,
                  // Enhanced cookie settings for OAuth with proper domain handling
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                  httpOnly: true,
                  path: '/',
                  domain: process.env.NODE_ENV === 'production' ? '.thinkhaven.co' : undefined,
                  maxAge: 60 * 60 * 24 * 7 // 7 days
                })
              })
            } catch (error) {
              console.error('Error setting cookies in callback:', error)
            }
          }
        }
      }
    )

    try {
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        const latencyMs = Date.now() - startTime

        // Categorize error types
        let errorType = 'code_exchange_error'
        if (exchangeError.message?.includes('code verifier') ||
            exchangeError.message?.includes('code challenge')) {
          errorType = 'pkce_mismatch'
        } else if (exchangeError.message?.includes('expired')) {
          errorType = 'expired_authorization_code'
        } else if (exchangeError.message?.includes('invalid')) {
          errorType = 'invalid_authorization_code'
        } else if (exchangeError.message?.includes('network')) {
          errorType = 'network_error'
        }

        // Log structured error
        await authLogger.logAuthFailure(
          'oauth_google',
          errorType,
          exchangeError.message,
          latencyMs,
          correlationId
        )

        // Enhanced PKCE mismatch detection and recovery
        const isPkceExchangeError = exchangeError.message?.includes('code verifier') ||
                                   exchangeError.message?.includes('code challenge') ||
                                   exchangeError.message?.includes('PKCE verification failed') ||
                                   exchangeError.message?.toLowerCase().includes('pkce')

        if (isPkceExchangeError) {
          console.error('PKCE mismatch detected during code exchange - implementing full recovery', {
            errorMessage: exchangeError.message,
            correlationId,
            userAgent: request.headers.get('user-agent'),
            referer: request.headers.get('referer')
          })

          // Clear all auth-related state
          const cookieStore = await cookies()
          const allCookies = cookieStore.getAll()

          allCookies.forEach(cookie => {
            if (cookie.name.startsWith('sb-') ||
                cookie.name.includes('auth') ||
                cookie.name.includes('pkce') ||
                cookie.name.includes('oauth')) {
              cookieStore.delete(cookie.name)
            }
          })

          const response = NextResponse.redirect(
            `${requestUrl.origin}/login?error=pkce_mismatch&message=${encodeURIComponent('Authentication verification failed. Please clear your browser cookies and try again.')}&retry=true`
          )

          // Force clear critical cookies in response
          response.cookies.delete('sb-access-token', {
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? '.thinkhaven.co' : undefined
          })
          response.cookies.delete('sb-refresh-token', {
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? '.thinkhaven.co' : undefined
          })

          return response
        }

        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
        )
      }

      // Verify session was created successfully
      if (!data?.session || !data?.user) {
        const latencyMs = Date.now() - startTime

        await authLogger.logAuthFailure(
          'oauth_google',
          'session_creation_failed',
          'Session created but no user data received',
          latencyMs,
          correlationId
        )

        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent('Authentication session creation failed')}`
        )
      }

      // Successful authentication - log structured success
      const latencyMs = Date.now() - startTime
      await authLogger.logAuthSuccess(
        'oauth_google',
        data.user.id,
        data.user.email || '',
        latencyMs,
        correlationId,
        data.session.access_token.substring(0, 10) + '...',
        data.user.app_metadata?.provider
      )

      // Create response with proper redirect
      const response = NextResponse.redirect(`${requestUrl.origin}/dashboard?auth_success=true`)

      // Ensure cookies are properly set in the response
      const supabaseCookies = cookieStore.getAll().filter(cookie =>
        cookie.name.startsWith('sb-') || cookie.name.includes('auth')
      )

      supabaseCookies.forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          domain: process.env.NODE_ENV === 'production' ? '.thinkhaven.co' : undefined,
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
      })

      console.log('OAuth callback: Redirecting to dashboard with auth success flag')
      return response

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

      console.error('Unexpected error during code exchange:', err)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
      )
    }
  }

  // No code or error, redirect to login
  console.log('OAuth callback: No code or error parameter, redirecting to login')
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}