#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function showStats() {
  console.log('📊 Fetching database statistics...')
  
  try {
    // Get table counts
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM gym_sessions) as sessions,
        (SELECT COUNT(*) FROM bookings) as bookings,
        (SELECT COUNT(*) FROM notifications) as notifications,
        (SELECT COUNT(*) FROM billing_transactions) as transactions
    `)
    
    // Get user distribution
    const userStats = await pool.query(`
      SELECT 
        role,
        status,
        COUNT(*) as count
      FROM users 
      GROUP BY role, status
      ORDER BY role, status
    `)
    
    // Get session stats
    const sessionStats = await pool.query(`
      SELECT 
        DATE_TRUNC('day', date) as day,
        COUNT(*) as sessions,
        SUM(current_bookings) as total_bookings,
        AVG(current_bookings::float / capacity::float * 100)::integer as avg_utilization
      FROM gym_sessions
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY day
      ORDER BY day DESC
    `)

    // Print statistics
    console.log('\n📈 Database Overview:')
    console.log('-------------------')
    console.log('Total Users:', counts.rows[0].users)
    console.log('Total Sessions:', counts.rows[0].sessions)
    console.log('Total Bookings:', counts.rows[0].bookings)
    console.log('Total Notifications:', counts.rows[0].notifications)
    console.log('Total Transactions:', counts.rows[0].transactions)

    console.log('\n👥 User Distribution:')
    console.log('-------------------')
    userStats.rows.forEach(stat => {
      console.log(`${stat.role} (${stat.status}):`, stat.count)
    })

    console.log('\n📅 Last 7 Days Sessions:')
    console.log('-------------------')
    sessionStats.rows.forEach(stat => {
      console.log(
        new Date(stat.day).toLocaleDateString(),
        `- Sessions: ${stat.sessions},`,
        `Bookings: ${stat.total_bookings},`,
        `Utilization: ${stat.avg_utilization}%`
      )
    })

  } catch (error) {
    console.error('❌ Error fetching statistics:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

showStats() 