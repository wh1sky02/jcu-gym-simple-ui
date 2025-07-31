import { NextRequest, NextResponse } from "next/server"
import { getDatabaseAdapter } from "@/lib/database-adapter"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "user"
    const limit = parseInt(searchParams.get("limit") || "50")
    const userId = searchParams.get("userId")

    const db = getDatabaseAdapter()

    if (type === "all") {
      // Admin fetching all notifications (for admin dashboard history)
      const notifications = await (db as any).getAllNotifications()
      return NextResponse.json(notifications.slice(0, limit))
    } else {
      // User fetching their notifications
      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required for user notifications" },
          { status: 400 }
        )
      }
      
      const notifications = await (db as any).getUserNotifications(userId)
      return NextResponse.json(notifications.slice(0, limit))
    }
    
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, message, type, priority, actionUrl } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()
    
    // Create notification in database
    const notification = await (db as any).createNotification({
      user_id: userId || null, // null for global notifications
      title,
      message,
      type: type || 'info',
      priority: priority || 'normal',
      action_url: actionUrl || null
    })
    
    return NextResponse.json({
      success: true,
      message: "Notification created successfully",
      notification
    })
    
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    )
  }
} 