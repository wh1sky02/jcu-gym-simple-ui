import { NextRequest, NextResponse } from "next/server"
import { getDatabaseAdapter } from "@/lib/database-adapter"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "jcu-gym-secret-key-change-in-production"

export async function GET(request: NextRequest) {
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
        // Try from query params as fallback
      }
    }

    const { searchParams } = new URL(request.url)
    
    // If no user from token, try from query params
    if (!userId) {
      userId = searchParams.get("userId")
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()
          const bookings = await db.getUserBookings(userId)
    
    // Format bookings for frontend
    const formattedBookings = bookings.map((booking: any) => ({
      id: booking.id,
      userId: booking.user_id,
      sessionId: booking.session_id,
      bookingDate: booking.booking_date,
      status: booking.status,
      checkInTime: booking.check_in_time,
      checkOutTime: booking.check_out_time,
      notes: booking.notes,
      rating: booking.rating,
      feedback: booking.feedback,
      isRecurring: booking.is_recurring,
      recurringId: booking.recurring_id,
      createdAt: booking.created_at,
      session: {
        id: booking.session_id,
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        type: booking.type,
        instructor: booking.instructor,
        description: booking.description
      }
    }))
    
    return NextResponse.json(formattedBookings)
  } catch (error) {
    console.error("Error fetching user bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { bookingId, status } = await request.json()

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: "Booking ID and status are required" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()
    
    // Update booking status using the database adapter
    await db.query(`
      UPDATE bookings 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [status, bookingId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    )
  }
}
