const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function cleanupDuplicateTransactions() {
  console.log('🧹 Cleaning up duplicate transactions...')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  try {
    // Show current transactions
    const allTransactions = await pool.query('SELECT * FROM billing_transactions ORDER BY created_at DESC')
    console.log('\nCurrent transactions:')
    allTransactions.rows.forEach(t => {
      console.log(`${t.id.slice(0, 8)}... - ${t.status} - S$${t.amount} - ${t.description}`)
    })
    
    // Remove duplicate pending transactions (keep only completed ones)
    const deleteResult = await pool.query(`
      DELETE FROM billing_transactions 
      WHERE status = 'pending' 
      AND description IN (
        SELECT description 
        FROM billing_transactions 
        WHERE status = 'completed'
        GROUP BY description
        HAVING COUNT(*) > 1
      )
      RETURNING *
    `)
    
    console.log(`\n✅ Removed ${deleteResult.rowCount} duplicate pending transactions`)
    
    // Show final transactions and calculate revenue
    const finalTransactions = await pool.query('SELECT * FROM billing_transactions ORDER BY created_at DESC')
    const completedTransactions = finalTransactions.rows.filter(t => t.status === 'completed')
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
    
    console.log('\nFinal transactions:')
    finalTransactions.rows.forEach(t => {
      console.log(`${t.id.slice(0, 8)}... - ${t.status} - S$${t.amount} - ${t.description}`)
    })
    
    console.log(`\n💰 Final total revenue: S$${totalRevenue.toFixed(2)}`)
    
  } catch (error) {
    console.error('❌ Error cleaning up transactions:', error)
    process.exit(1)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

cleanupDuplicateTransactions()
