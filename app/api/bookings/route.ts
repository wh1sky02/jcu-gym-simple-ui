import { NextRequest, NextResponse } from "next/server"
import { getDatabaseAdapter } from "@/lib/database-adapter"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "jcu-gym-secret-key-change-in-production"

export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token (check both Authorization header and cookie)
    const authHeader = request.headers.get('Authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let userId = null
    let token = null
    
    // Try Authorization header first
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
    // Fall back to cookie
    else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userId = decoded.userId
      } catch (error) {
        console.log('JWT verification error:', error)
        // Try to get from body if no valid token
      }
    }

    const body = await request.json()
    const { sessionId } = body
    
    // If no user from token, try from body (fallback)
    if (!userId) {
      userId = body.userId
    }

    console.log('Booking request data:', {
      userId,
      sessionId,
      hasToken: !!token,
      bodyData: body
    })

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: "User ID and Session ID are required. Please ensure you are logged in." },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()
    
    // Check if session exists and has capacity
          const session = await db.getSessionById(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    if ((session as any).current_bookings >= (session as any).capacity) {
      return NextResponse.json(
        { error: "Session is fully booked" },
        { status: 400 }
      )
    }

    // Check if user already has a booking for this session
    const existingBookings = await db.getUserBookings(userId)
    const hasExistingBooking = existingBookings.some((booking: any) => 
      booking.session_id === sessionId && booking.status === 'confirmed'
    )
    
    if (hasExistingBooking) {
      return NextResponse.json(
        { error: "You already have a booking for this session" },
        { status: 400 }
      )
    }

    // Create the booking
    const booking = await db.createBooking({
      userId: userId,
      sessionId: sessionId,
      status: "confirmed"
    })

    return NextResponse.json({
      success: true,
      message: "Session booked successfully",
      booking: {
        id: booking.id || booking.lastInsertRowid,
        userId: userId,
        sessionId: sessionId,
        status: "confirmed",
        bookedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    )
  }
}
