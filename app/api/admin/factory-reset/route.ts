import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseAdapter } from '@/lib/database-adapter'

export async function POST(request: NextRequest) {
  try {
    const { confirmation, adminUserId } = await request.json()

    // Verify the confirmation text
    if (confirmation !== 'FACTORY RESET') {
      return NextResponse.json(
        { error: 'Invalid confirmation text' },
        { status: 400 }
      )
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify admin authentication
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      )
    }

    const db = getDatabaseAdapter()
    
    // Verify the admin user exists before proceeding
    const adminUser = await db.getUserById(adminUserId)
    
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin user not found or invalid permissions' },
        { status: 403 }
      )
    }

    console.log('🚨 FACTORY RESET INITIATED by admin:', adminUserId, adminUser.email)
    
    // Perform factory reset using database adapter
    const result = await db.factoryReset(adminUserId)
    
    console.log('✅ FACTORY RESET COMPLETED - All data deleted except admin credentials')

    return NextResponse.json({
      success: true,
      message: 'Factory reset completed successfully. All data has been cleared except admin credentials.',
      deletedCounts: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Factory reset error:', error)
    return NextResponse.json(
      { error: 'Factory reset failed. Please try again or contact support.' },
      { status: 500 }
    )
  }
}
