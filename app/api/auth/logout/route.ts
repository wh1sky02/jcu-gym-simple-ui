import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const isAdminLogout = request.headers.get('X-Admin-Logout') === 'true'
    
    // Create response confirming logout
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
      isAdmin: isAdminLogout
    })
    
    // Clear the HTTP-only session cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })
    
    // Add cache-control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    )
  }
} 