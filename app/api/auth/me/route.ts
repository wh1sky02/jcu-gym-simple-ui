import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabaseAdapter } from "@/lib/database-adapter"

const JWT_SECRET = process.env.JWT_SECRET || "jcu-gym-secret-key-change-in-production"

export async function GET(request: NextRequest) {
  try {
    // Check for auth token in multiple places:
    // 1. Authorization header (for localStorage-based auth)
    // 2. Cookie (for cookie-based auth)
    const authHeader = request.headers.get('Authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    
    // Try Authorization header first (Bearer token)
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
    // Fall back to cookie
    else if (cookieToken) {
      token = cookieToken
    }
    
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    // Get user from database
    const db = getDatabaseAdapter()
    const user = await db.getUserById(userId)

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Return user data (same format as login)
    return NextResponse.json({
      success: true,
      user: {
        id: (user as any).id,
        email: (user as any).email,
        firstName: (user as any).first_name,
        lastName: (user as any).last_name,
        studentId: (user as any).student_id,
        role: (user as any).role,
        membershipType: (user as any).membership_type,
        status: (user as any).status,
        expiryDate: (user as any).expiry_date
      }
    })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json(
      { error: "Invalid authentication" },
      { status: 401 }
    )
  }
} 