#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function setupSchema() {
  console.log('🔄 Setting up database schema...')
  
  try {
    // Test connection first
    console.log('📡 Testing database connection...')
    await pool.query('SELECT NOW()')
    console.log('✅ Database connected successfully!')
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'neon-schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📄 Executing schema file...')
    
    // Execute the schema SQL
    await pool.query(schemaSQL)
    
    console.log('✅ Database schema created successfully!')
    console.log('🎉 Your database is now ready to use!')
    
    // Test if tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log('\n📋 Created tables:')
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`)
    })
    
  } catch (error) {
    console.error('❌ Schema setup error:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupSchema()
