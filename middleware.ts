import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add no-cache headers for admin routes and auth routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    const response = NextResponse.next()
    
    // Prevent caching of sensitive routes
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/auth/:path*',
    '/api/auth/:path*'
  ]
}
