import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseAdapter } from '@/lib/database-adapter'

export async function GET(request: NextRequest) {
  try {
    const db = getDatabaseAdapter()
    
    // Check if essential tables exist
    const tableChecks = [
      { name: 'users', description: 'User accounts and authentication' },
      { name: 'gym_sessions', description: 'Gym session schedules' },
      { name: 'bookings', description: 'User bookings and reservations' },
      { name: 'notifications', description: 'System notifications' },
      { name: 'billing_transactions', description: 'Payment and billing records' },
      { name: 'user_achievements', description: 'User achievements and points' }
    ]
    
    const results = []
    
    for (const table of tableChecks) {
      try {
        const result = await db.query(`SELECT COUNT(*) FROM ${table.name}`)
        results.push({
          table: table.name,
          description: table.description,
          exists: true,
          count: parseInt(result.rows[0].count),
          status: 'ok'
        })
      } catch (error) {
        results.push({
          table: table.name,
          description: table.description,
          exists: false,
          count: 0,
          status: 'missing',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Check if there's at least one admin user
    let adminCheck = null
    try {
      const adminResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'")
      const adminCount = parseInt(adminResult.rows[0].count)
      adminCheck = {
        exists: adminCount > 0,
        count: adminCount,
        status: adminCount > 0 ? 'ok' : 'warning'
      }
    } catch (error) {
      adminCheck = {
        exists: false,
        count: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    // Overall system health
    const allTablesExist = results.every(r => r.exists)
    const hasAdmin = adminCheck?.exists === true
    
    return NextResponse.json({
      success: true,
      systemHealth: {
        status: allTablesExist && hasAdmin ? 'healthy' : 'needs_setup',
        allTablesExist,
        hasAdmin,
        timestamp: new Date().toISOString()
      },
      tables: results,
      adminUsers: adminCheck,
      recommendations: [
        ...(allTablesExist ? [] : ['Run database schema setup to create missing tables']),
        ...(hasAdmin ? [] : ['Create at least one admin user account']),
        ...(allTablesExist && hasAdmin ? ['System is ready for use'] : [])
      ]
    })
    
  } catch (error) {
    console.error('Database health check error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'setup_schema') {
      // This would run the database schema setup
      // For now, just return a message
      return NextResponse.json({
        success: true,
        message: 'Schema setup would be triggered here. Please run the SQL schema file manually.',
        recommendation: 'Execute the neon-schema.sql file in your database to create all required tables.'
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json(
      { error: 'Setup failed' },
      { status: 500 }
    )
  }
}
