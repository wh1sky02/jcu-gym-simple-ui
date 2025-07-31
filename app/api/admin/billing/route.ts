import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { getDatabaseAdapter } from "@/lib/database-adapter"

async function createSampleBillingData(db: any) {
  try {
    // Get some existing users to create transactions for
    const usersResult = await db.query('SELECT id, first_name, last_name FROM users WHERE role != $1 LIMIT 1', ['admin'])
    const users = usersResult.rows
    
    if (users.length === 0) {
      console.log('No users found to create sample billing data')
      return
    }

    const sampleTransactions = [
      {
        id: randomUUID(),
        user_id: users[0].id,
        transaction_type: 'payment',
        amount: 350.00,
        currency: 'SGD',
        payment_method: 'credit_card',
        payment_reference: 'TXN_' + randomUUID().slice(0, 8).toUpperCase(),
        description: '3-trimester gym membership',
        status: 'completed',
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]

    for (const transaction of sampleTransactions) {
      await db.query(`
        INSERT INTO billing_transactions (
          id, user_id, transaction_type, amount, currency, payment_method,
          payment_reference, description, status, completed_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        transaction.id,
        transaction.user_id,
        transaction.transaction_type,
        transaction.amount,
        transaction.currency,
        transaction.payment_method,
        transaction.payment_reference,
        transaction.description,
        transaction.status,
        transaction.completed_at,
        transaction.created_at
      ])
    }

    console.log(`Created ${sampleTransactions.length} sample billing transactions`)
  } catch (error) {
    console.error('Error creating sample billing data:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const search = searchParams.get('search')

    const db = getDatabaseAdapter()

    // Check if billing_transactions table has data
    const countResult = await db.query('SELECT COUNT(*) as count FROM billing_transactions')
    const transactionCount = countResult.rows[0]?.count || 0
    
    console.log(`Found ${transactionCount} billing transactions`)

    // If no transactions exist, create some sample data
    if (transactionCount == 0) {
      console.log('No billing transactions found, creating sample data...')
      await createSampleBillingData(db)
    }

    // Get all billing transactions with user information
    let query = `
      SELECT 
        bt.*,
        u.first_name,
        u.last_name,
        u.email,
        u.student_id,
        u.membership_type,
        u.expiry_date,
        u.payment_status
      FROM billing_transactions bt
      JOIN users u ON bt.user_id = u.id
      WHERE 1=1
    `

    const params = []
    let paramIndex = 1

    if (status) {
      query += ` AND bt.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }
    if (paymentMethod) {
      query += ` AND bt.payment_method = $${paramIndex}`
      params.push(paymentMethod)
      paramIndex++
    }
    if (search) {
      const searchTerm = `%${search}%`
      query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex+1} OR u.email ILIKE $${paramIndex+2} OR u.student_id ILIKE $${paramIndex+3})`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
      paramIndex += 4
    }

    query += ' ORDER BY bt.created_at DESC'

    console.log('Executing billing query:', query, 'with params:', params)

    // Execute the query to get billing transactions
    const result = await db.query(query, params)
    const rows = result.rows
    console.log(`Retrieved ${rows.length} billing transactions`)
    
    const transactions = rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      transactionType: row.transaction_type,
      amount: row.amount,
      currency: row.currency,
      paymentMethod: row.payment_method,
      paymentReference: row.payment_reference,
      description: row.description,
      status: row.status,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      user: {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        studentId: row.student_id,
        membershipType: row.membership_type,
        expiryDate: row.expiry_date,
        paymentStatus: row.payment_status
      }
    }))

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching billing data:", error)
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, transactionType, amount, paymentMethod, description, processedBy } = await request.json()

    if (!userId || !transactionType || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()
    const transactionId = randomUUID()
    const paymentReference = `${transactionType.toUpperCase()}_${randomUUID().slice(0, 8)}`

    const stmt = (db as any).db.prepare(`
      INSERT INTO billing_transactions (
        id, user_id, transaction_type, amount, payment_method, 
        payment_reference, description, status, processed_by, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      transactionId,
      userId,
      transactionType,
      amount,
      paymentMethod,
      paymentReference,
      description || null,
      'completed',
      processedBy,
      new Date().toISOString()
    )

    // Update user payment status if this is a payment
    if (transactionType === 'payment') {
      const updateUser = (db as any).db.prepare(`
        UPDATE users 
        SET payment_status = 'paid', payment_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      updateUser.run(userId)
    }

    return NextResponse.json({ 
      success: true, 
      transactionId,
      paymentReference,
      message: "Transaction created successfully" 
    })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { transactionId, status, processedBy } = await request.json()

    if (!transactionId || !status) {
      return NextResponse.json(
        { error: "Transaction ID and status are required" },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()

    const stmt = (db as any).db.prepare(`
      UPDATE billing_transactions 
      SET status = ?, processed_by = ?, processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    stmt.run(status, processedBy, transactionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    )
  }
} 