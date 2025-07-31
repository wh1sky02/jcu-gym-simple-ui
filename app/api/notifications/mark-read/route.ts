import { NextRequest, NextResponse } from "next/server"
import { getDatabaseAdapter } from "@/lib/database-adapter"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, notificationId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()

    if (notificationId) {
      // Mark specific notification as read
      await db.markNotificationAsRead(notificationId)
    } else {
      // Mark all notifications as read for user
      await db.markAllNotificationsAsRead(userId)
    }
    
    return NextResponse.json({
      success: true,
      message: notificationId ? "Notification marked as read" : "All notifications marked as read"
    })
    
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
} 