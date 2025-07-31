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

async function testConnection() {
  console.log('🔄 Testing database connection...')
  
  try {
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Database connected successfully!')
    console.log('📅 Server time:', result.rows[0].now)
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection() 