import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // In this implementation, we're using client-side token storage
    // so there's no server-side session to clear.
    // This endpoint serves as a confirmation that logout was successful
    // and could be extended to handle server-side session management if needed
    
    // Create response confirming logout
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    })
    
    // Clear the HTTP-only session cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    )
  }
} 