import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDatabaseAdapter } from "@/lib/database-adapter"

const JWT_SECRET = process.env.JWT_SECRET || "jcu-gym-secret-key-change-in-production"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@my\.jcu\.edu\.au$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please use your JCU email address (@my.jcu.edu.au)" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()
    const user = await db.getUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, (user as any).password_hash)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const userStatus = (user as any).status
    const userRole = (user as any).role

    // Handle different user statuses
    if (userStatus === 'pending') {
      return NextResponse.json({
        success: false,
        status: 'pending',
        message: "Your account is awaiting admin approval",
        userInfo: {
          firstName: (user as any).first_name,
          lastName: (user as any).last_name,
          email: (user as any).email,
          membershipType: (user as any).membership_type,
          registrationDate: (user as any).created_at,
          paymentReference: (user as any).payment_reference
        }
      }, { status: 202 }) // 202 Accepted but pending
    }

    if (userStatus === 'suspended') {
      return NextResponse.json({
        success: false,
        status: 'suspended',
        message: "Your account has been suspended. Please contact support.",
        supportEmail: "support@fitness.jcu.edu.au"
      }, { status: 403 })
    }

    if (userStatus !== 'approved') {
      return NextResponse.json({
        success: false,
        status: 'unknown',
        message: "Account status unknown. Please contact support.",
        supportEmail: "support@fitness.jcu.edu.au"
      }, { status: 403 })
    }

    // Check if membership has expired
    const expiryDate = new Date((user as any).expiry_date)
    const today = new Date()
    if (expiryDate < today) {
      return NextResponse.json({
        success: false,
        status: 'expired',
        message: "Your membership has expired. Please renew to continue.",
        expiryDate: (user as any).expiry_date,
        renewalInfo: {
          membershipType: (user as any).membership_type,
          contactEmail: "support@fitness.jcu.edu.au"
        }
      }, { status: 403 })
    }

    // Generate JWT token for approved users (5-day session)
    const token = jwt.sign(
      { 
        userId: (user as any).id,
        email: (user as any).email,
        role: userRole 
      },
      JWT_SECRET,
      { expiresIn: '5d' }
    )

    // Create response with HTTP-only session cookie
    const response = NextResponse.json({
      success: true,
      status: 'approved',
      user: {
        id: (user as any).id,
        email: (user as any).email,
        firstName: (user as any).first_name,
        lastName: (user as any).last_name,
        studentId: (user as any).student_id,
        role: userRole,
        membershipType: (user as any).membership_type,
        status: userStatus,
        expiryDate: (user as any).expiry_date
      },
      token: token
    })

    // Set HTTP-only session cookie that expires in 5 days
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 24 * 60 * 60, // 5 days in seconds
      path: '/'
    })

    return response

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "An error occurred during login. Please try again." },
      { status: 500 }
    )
  }
}
