import { NextRequest, NextResponse } from "next/server"
import { getDatabaseAdapter } from "@/lib/database-adapter"

export async function GET(request: NextRequest) {
  try {
    const db = getDatabaseAdapter()
    const pendingUsers = await db.getPendingUsers()
    return NextResponse.json(pendingUsers)
  } catch (error) {
    console.error("Error fetching pending users:", error)
    return NextResponse.json(
      { error: "Failed to fetch pending users" },
      { status: 500 }
    )
  }
}
