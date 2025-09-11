import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // DISABLED: Complex manual auth cookie checking - simplified for Story 0.1
  // const accessToken = request.cookies.get('sb-access-token')?.value
  // let user = null
  
  // if (accessToken) {
  //   try {
  //     const { data, error } = await supabase.auth.getUser(accessToken)
  //     if (!error && data.user) {
  //       user = data.user
  //     }
  //   } catch (_err) {
  //     // Auth cookie verification failed, fallback to default method
  //   }
  // }
  
  // Simplified: Use default getUser only
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('Middleware: Processing request to:', request.nextUrl.pathname, 'User:', user?.email || 'No user')

  // Story 0.1: Temporary auth bypass for development - prevents redirect loops
  const isDevelopment = process.env.NODE_ENV === 'development'
  if (isDevelopment) {
    console.log('Middleware: Development mode - allowing all requests without auth checks')
    return supabaseResponse
  }


  // Public routes and assets that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/resend-confirmation', '/.well-known', '/test-dual-pane', '/test-bmad-buttons', '/demo']
  
  // Allow API access from test pages
  const referer = request.headers.get('referer') || '';
  const isTestApiRequest = request.nextUrl.pathname.startsWith('/api/bmad') && referer.includes('/test-bmad-buttons');
  const staticAssets = ['.css', '.js', '.map', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  const isStaticAsset = staticAssets.some(ext => 
    request.nextUrl.pathname.includes(ext)
  )
  
  const shouldSkipAuth = isPublicRoute || isStaticAsset || isTestApiRequest

  // DISABLED: Redirect logic causing loops - simplified for Story 0.1
  // if (!user && !shouldSkipAuth) {
  //   console.log('Middleware: Redirecting unauthenticated user to login from:', request.nextUrl.pathname)
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/login'
  //   // Store the attempted URL to redirect after login
  //   url.searchParams.set('redirect', request.nextUrl.pathname)
  //   return NextResponse.redirect(url)
  // }

  // TEMPORARILY DISABLE: If user is authenticated and trying to access login/signup (but not home page or demo), redirect to dashboard
  // const allowedAuthenticatedRoutes = ['/', '/demo']
  // if (user && isPublicRoute && !isStaticAsset && !allowedAuthenticatedRoutes.includes(request.nextUrl.pathname)) {
  //   console.log('Middleware: Redirecting authenticated user to dashboard from:', request.nextUrl.pathname)
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/dashboard'
  //   return NextResponse.redirect(url)
  // }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object if needed, but avoid changing the
  //    cookies!

  return supabaseResponse
}