import { NextRequest, NextResponse } from "next/server"
import { getDatabaseAdapter } from "@/lib/database-adapter"

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required" },
        { status: 400 }
      )
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()
    
    // Use the cloud database approve user method
    await (db as any).approveUser(userId, action)

    return NextResponse.json({ 
      success: true, 
      message: `User ${action}d successfully`
    })
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    )
  }
}
