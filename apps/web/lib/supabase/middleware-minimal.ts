import { NextResponse, type NextRequest } from 'next/server'

/**
 * Minimal Edge Runtime compatible middleware
 *
 * This version completely avoids @supabase/ssr which has Node.js dependencies.
 * Instead, it simply passes all Supabase cookies through without modification.
 * Session management is handled client-side and in API routes (Node.js runtime).
 */
export async function updateSession(request: NextRequest) {
  // Create response that allows the request to proceed
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Copy all existing cookies to the response to maintain sessions
  // This ensures Supabase auth cookies persist across requests
  request.cookies.getAll().forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, {
      path: '/',
      sameSite: 'lax' as const,
      secure: true,
      httpOnly: cookie.name.includes('auth-token'),
    })
  })

  return response
}
