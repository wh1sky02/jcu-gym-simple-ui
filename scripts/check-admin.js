const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function checkAdminUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  try {
    const result = await pool.query("SELECT email, role, status FROM users WHERE role = 'admin'")
    console.log('Admin users:', result.rows)
    
    const allUsers = await pool.query("SELECT email, role, status FROM users")
    console.log('All users:', allUsers.rows)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

checkAdminUsers()
