import { NextRequest, NextResponse } from "next/server"
import { getDatabaseAdapter } from "@/lib/database-adapter"

interface GymSession {
  id: string
  type: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  currentBookings: number
  availableSpots: number
  instructor: string
  location: string
  description: string
}

// Convert database session to API format
function formatSessionForAPI(dbSession: any): GymSession {
  return {
    id: dbSession.id,
    type: dbSession.type === 'general' ? 'Gym Access' : dbSession.type,
    date: dbSession.date,
    startTime: dbSession.start_time,
    endTime: dbSession.end_time,
    capacity: dbSession.capacity,
    currentBookings: dbSession.current_bookings,
    availableSpots: dbSession.capacity - dbSession.current_bookings,
    instructor: dbSession.instructor || "Self-guided",
    location: "Main Gym Floor",
    description: dbSession.description || "Open gym access with full equipment availability"
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const showAll = searchParams.get("showAll") === "true" // For admin use

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()
    const dbSessions = await db.getSessionsByDate(date)
    
    // Convert to API format
    let sessions = dbSessions.map(formatSessionForAPI)
    
    // Filter out full sessions for students (unless showAll is true for admin)
    if (!showAll) {
      sessions = sessions.filter(session => session.availableSpots > 0)
    }
    
    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, action } = await request.json()

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: "User ID and Session ID are required" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()

    if (action === "book") {
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
        id: booking.id || booking.lastInsertRowid,
        userId: userId,
        sessionId: sessionId,
        status: "confirmed",
        bookedAt: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error processing session request:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
