import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDatabaseAdapter } from "@/lib/database-adapter"

const JWT_SECRET = process.env.JWT_SECRET || "jcu-gym-secret-key-change-in-production"

export async function PUT(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      if (decoded.role !== 'admin') {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const { type, currentPassword, newEmail, newPassword } = await request.json()

    if (!type || !currentPassword) {
      return NextResponse.json(
        { error: "Type and current password are required" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()
    
    // Get current admin user from token
    const decoded = jwt.verify(token, JWT_SECRET) as any
          const currentUser = await db.getUserById(decoded.userId)
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, (currentUser as any).password_hash)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    if (type === 'email') {
      if (!newEmail) {
        return NextResponse.json(
          { error: "New email is required" },
          { status: 400 }
        )
      }

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@my\.jcu\.edu\.au$/
      if (!emailRegex.test(newEmail)) {
        return NextResponse.json(
          { error: "Please use a valid JCU email address (@my.jcu.edu.au)" },
          { status: 400 }
        )
      }

      // Check if email already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [newEmail, decoded.userId]
      )
      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }

      // Update email
      await db.query(`
        UPDATE users 
        SET email = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newEmail, decoded.userId])

      return NextResponse.json({ 
        success: true, 
        message: "Email updated successfully",
        newEmail 
      })

    } else if (type === 'password') {
      if (!newPassword) {
        return NextResponse.json(
          { error: "New password is required" },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        )
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)

      // Update password
      await db.query(`
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [hashedPassword, decoded.userId])

      return NextResponse.json({ 
        success: true, 
        message: "Password updated successfully" 
      })

    } else {
      return NextResponse.json(
        { error: "Invalid update type. Use 'email' or 'password'" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error updating admin profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      if (decoded.role !== 'admin') {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        )
      }

      const db = getDatabaseAdapter()
      const user = db.getUserById(decoded.userId)
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }

      // Return admin profile info (without password)
      const adminInfo = {
        id: (user as any).id,
        email: (user as any).email,
        firstName: (user as any).first_name,
        lastName: (user as any).last_name,
        role: (user as any).role,
        createdAt: (user as any).created_at
      }

      return NextResponse.json({ success: true, admin: adminInfo })

    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error("Error fetching admin profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
} 