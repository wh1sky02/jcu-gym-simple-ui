const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function removePendingDuplicate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  try {
    const result = await pool.query(
      'DELETE FROM billing_transactions WHERE status = $1 AND description LIKE $2',
      ['pending', '%1-trimester%']
    )
    console.log('Deleted', result.rowCount, 'pending transactions')
    
    // Show remaining transactions
    const remaining = await pool.query('SELECT * FROM billing_transactions ORDER BY created_at DESC')
    console.log('Remaining transactions:', remaining.rows.length)
    remaining.rows.forEach(t => {
      console.log(`${t.status} - S$${t.amount} - ${t.description}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

removePendingDuplicate()
