import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Check if Supabase environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables in middleware')
      // Return response without auth checks if env vars are missing
      return NextResponse.next()
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            } catch (error) {
              // Ignore cookie setting errors in middleware
              console.error('Error setting cookies in middleware:', error)
            }
          },
        },
      }
    )

    // Refresh session if expired (with error handling)
    try {
      await supabase.auth.getUser()
    } catch (error) {
      console.error('Error refreshing session in middleware:', error)
      // Continue with request even if session refresh fails
    }

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          const url = request.nextUrl.clone()
          url.pathname = '/login'
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.error('Error checking user in dashboard route:', error)
        // Redirect to login on error
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
    }

    // Redirect authenticated users away from login
    if (request.nextUrl.pathname === '/login') {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.error('Error checking user in login route:', error)
        // Continue to login page on error
      }
    }

    return response
  } catch (error) {
    // Catch any unexpected errors and log them
    console.error('Middleware error:', error)
    // Return a response to prevent middleware from crashing
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|api/telegram|api/cron).*)',
  ],
}

