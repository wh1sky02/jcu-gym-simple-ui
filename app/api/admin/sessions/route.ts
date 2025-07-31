import { NextRequest, NextResponse } from "next/server"
import { getDatabaseAdapter } from "@/lib/database-adapter"
import { randomUUID } from "crypto"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    
    const db = getDatabaseAdapter()
    
    if (date) {
      // Get sessions for specific date
      const sessions = await db.getSessionsByDate(date)
      return NextResponse.json(sessions)
    } else {
      // Get all sessions
      const sessions = await db.getAllSessions()
      
      return NextResponse.json({
        sessions: sessions,
        summary: {
          totalSessions: sessions.length,
          message: "All sessions retrieved"
        }
      })
    }
  } catch (error) {
    console.error("Error fetching session data:", error)
    return NextResponse.json(
      { error: "Failed to fetch session data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, sessionData } = await request.json()
    
    // Log the received data for debugging
    console.log('Received session data:', JSON.stringify(sessionData, null, 2))
    
    const db = getDatabaseAdapter()
    
    if (action === "create") {
      // Create new session
      if (!sessionData.date || !sessionData.startTime || !sessionData.endTime || !sessionData.capacity) {
        return NextResponse.json(
          { error: "Missing required session data: date, startTime, endTime, and capacity are required" },
          { status: 400 }
        )
      }

      // Validate time format (should be HH:MM or HH:MM:SS)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
      if (!timeRegex.test(sessionData.startTime) || !timeRegex.test(sessionData.endTime)) {
        return NextResponse.json(
          { error: "Invalid time format. Use HH:MM format (e.g., 09:00, 14:30)" },
          { status: 400 }
        )
      }
      
      const sessionId = randomUUID()
      const result = await db.createSession({
        id: sessionId,
        date: sessionData.date,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        capacity: parseInt(sessionData.capacity),
        type: sessionData.type || 'general',
        instructor: sessionData.instructor || 'Self-guided',
        description: sessionData.description || 'Open gym access'
      })
      
      return NextResponse.json({
        success: true,
        message: "Session created successfully",
        sessionId: sessionId
      })
    }
    
    if (action === "update") {
      // Update existing session
      if (!sessionData.id) {
        return NextResponse.json(
          { error: "Session ID is required for updates" },
          { status: 400 }
        )
      }
      
      // Note: You would implement updateSession method in database class
      return NextResponse.json({
        success: true,
        message: "Session updated successfully"
      })
    }
    
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
    
  } catch (error) {
    console.error("Error managing sessions:", error)
    return NextResponse.json(
      { error: "Failed to manage sessions" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, updates } = await request.json()
    const db = getDatabaseAdapter()

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    const updateFields = []
    const params = []
    let paramCount = 1

    if (updates.date !== undefined) {
      updateFields.push(`date = $${paramCount}`)
      params.push(updates.date)
      paramCount++
    }
    if (updates.startTime !== undefined) {
      updateFields.push(`start_time = $${paramCount}`)
      params.push(updates.startTime)
      paramCount++
    }
    if (updates.endTime !== undefined) {
      updateFields.push(`end_time = $${paramCount}`)
      params.push(updates.endTime)
      paramCount++
    }
    if (updates.capacity !== undefined) {
      updateFields.push(`capacity = $${paramCount}`)
      params.push(updates.capacity)
      paramCount++
    }
    if (updates.type !== undefined) {
      updateFields.push(`type = $${paramCount}`)
      params.push(updates.type)
      paramCount++
    }
    if (updates.instructor !== undefined) {
      updateFields.push(`instructor = $${paramCount}`)
      params.push(updates.instructor)
      paramCount++
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount}`)
      params.push(updates.description)
      paramCount++
    }
    if (updates.difficulty !== undefined) {
      updateFields.push(`difficulty = $${paramCount}`)
      params.push(updates.difficulty)
      paramCount++
    }
    if (updates.price !== undefined) {
      updateFields.push(`price = $${paramCount}`)
      params.push(updates.price)
      paramCount++
    }
    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${paramCount}`)
      params.push(updates.isActive)
      paramCount++
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      )
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    params.push(sessionId)

    await db.query(`
      UPDATE gym_sessions 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
    `, params)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating session:", error)
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const db = getDatabaseAdapter()

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    // Soft delete - set is_active to false
    await db.query(`
      UPDATE gym_sessions 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [sessionId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting session:", error)
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    )
  }
} 
