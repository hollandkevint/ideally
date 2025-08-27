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

  // Check for manual auth cookies first, fallback to default getUser
  const accessToken = request.cookies.get('sb-access-token')?.value
  let user = null
  
  if (accessToken) {
    try {
      const { data, error } = await supabase.auth.getUser(accessToken)
      if (!error && data.user) {
        user = data.user
      }
    } catch (_err) {
      // Auth cookie verification failed, fallback to default method
    }
  }
  
  // Fallback to default getUser if no manual cookies
  if (!user) {
    const {
      data: { user: defaultUser },
    } = await supabase.auth.getUser()
    user = defaultUser
  }


  // Public routes and assets that don't require authentication
  const publicRoutes = ['/login', '/signup', '/resend-confirmation', '/.well-known']
  const staticAssets = ['.css', '.js', '.map', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  const isStaticAsset = staticAssets.some(ext => 
    request.nextUrl.pathname.includes(ext)
  )
  
  const shouldSkipAuth = isPublicRoute || isStaticAsset

  // If user is not authenticated and trying to access protected route
  if (!user && !shouldSkipAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Store the attempted URL to redirect after login
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access login/signup, redirect to workspace
  if (user && isPublicRoute && !isStaticAsset) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

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