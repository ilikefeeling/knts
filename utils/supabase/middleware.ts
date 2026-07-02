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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 보호할 라우트 설정
  const isProtectedRoute = !request.nextUrl.pathname.startsWith('/login') && 
                           !request.nextUrl.pathname.startsWith('/auth') && 
                           !request.nextUrl.pathname.startsWith('/api/auth') && 
                           !request.nextUrl.pathname.startsWith('/api/share-target') && 
                           !request.nextUrl.pathname.startsWith('/api/restore-notices') && 
                           !request.nextUrl.pathname.startsWith('/guide') && 
                           !request.nextUrl.pathname.startsWith('/ios-guide') &&
                           !request.nextUrl.pathname.startsWith('/start') &&
                           !request.nextUrl.pathname.startsWith('/pricing') &&
                           request.nextUrl.pathname !== '/'

  // Landing page is now public, so no redirect on root.

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    if (request.nextUrl.pathname.startsWith('/admin')) {
      url.pathname = '/login/admin'
    } else {
      url.pathname = '/login'
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
