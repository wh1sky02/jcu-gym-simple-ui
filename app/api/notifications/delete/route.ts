import { NextRequest, NextResponse } from "next/server"
import { getDatabaseAdapter } from "@/lib/database-adapter"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const notificationId = searchParams.get("notificationId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()

    if (notificationId) {
      // Delete specific notification
      await db.deleteNotification(notificationId)
    } else {
      // Delete all notifications for user
      await db.deleteAllUserNotifications(userId)
    }
    
    return NextResponse.json({
      success: true,
      message: notificationId ? "Notification deleted" : "All notifications deleted"
    })
    
  } catch (error) {
    console.error("Error deleting notifications:", error)
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    )
  }
} 