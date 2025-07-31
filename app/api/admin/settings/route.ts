import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Retrieve admin settings
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authorization = request.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (!decoded.userId || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // For now, we'll store settings in a simple way
    // In production, you might want to store this in a database
    const defaultSettings = {
      systemMaintenance: false,
      allowNewRegistrations: true,
      maxSessionCapacity: 20
    }

    return NextResponse.json({
      success: true,
      settings: defaultSettings
    })

  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' }, 
      { status: 500 }
    )
  }
}

// PUT - Update admin settings
export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authorization = request.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (!decoded.userId || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { setting, value } = body

    if (!setting) {
      return NextResponse.json({ error: 'Setting name is required' }, { status: 400 })
    }

    // Validate setting names
    const validSettings = ['systemMaintenance', 'allowNewRegistrations', 'maxSessionCapacity']
    if (!validSettings.includes(setting)) {
      return NextResponse.json({ error: 'Invalid setting name' }, { status: 400 })
    }

    // In a real application, you would save this to a database
    // For now, we'll just return success
    console.log(`Admin setting updated: ${setting} = ${value}`)

    return NextResponse.json({
      success: true,
      message: `Setting ${setting} updated successfully`,
      setting,
      value
    })

  } catch (error) {
    console.error('Error updating admin setting:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' }, 
      { status: 500 }
    )
  }
}
