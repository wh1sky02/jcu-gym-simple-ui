import { Pool, Client } from 'pg'

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
}

// Create a connection pool
let pool: Pool | null = null

function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig)
  }
  return pool
}

// Database adapter interface
export interface DatabaseAdapter {
  // User operations
  getUserById(userId: string): Promise<any>
  getUserByEmail(email: string): Promise<any>
  getUserByStudentId(studentId: string): Promise<any>
  createUser(userData: any): Promise<any>
  updateUser(userId: string, userData: any): Promise<any>
  getAllUsers(): Promise<any[]>
  getPendingUsers(): Promise<any[]>
  approveUser(userId: string): Promise<any>
  
  // Session operations
  getSessionsByDate(date: string): Promise<any[]>
  getAllSessions(): Promise<any[]>
  getSessionById(sessionId: string): Promise<any>
  createSession(sessionData: any): Promise<any>
  updateSession(sessionId: string, sessionData: any): Promise<any>
  deleteSession(sessionId: string): Promise<any>
  
  // Booking operations
  getUserBookings(userId: string): Promise<any[]>
  getAllBookings(): Promise<any[]>
  getSessionBookings(sessionId: string): Promise<any[]>
  createBooking(bookingData: any): Promise<any>
  updateBooking(bookingId: string, bookingData: any): Promise<any>
  cancelBooking(bookingId: string): Promise<any>
  checkUserBookingConflict(userId: string, sessionId: string): Promise<boolean>
  
  // Notification operations
  getUserNotifications(userId: string): Promise<any[]>
  getAllNotifications(): Promise<any[]>
  createNotification(notificationData: any): Promise<any>
  markNotificationAsRead(notificationId: string): Promise<any>
  markAllNotificationsAsRead(userId: string): Promise<any>
  deleteNotification(notificationId: string): Promise<any>
  deleteAllUserNotifications(userId: string): Promise<any>
  
  // Statistics operations
  getBookingStats(): Promise<any>
  getUserStats(userId: string): Promise<any>
  
  // General operations
  query(text: string, params?: any[]): Promise<any>
}

class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool

  constructor() {
    this.pool = getPool()
  }

  async query(text: string, params?: any[]) {
    try {
      const result = await this.pool.query(text, params)
      return result
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  // User operations
  async getUserById(userId: string) {
    const result = await this.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    )
    return result.rows[0]
  }

  async getUserByEmail(email: string) {
    const result = await this.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    return result.rows[0]
  }

  async getUserByStudentId(studentId: string) {
    const result = await this.query(
      'SELECT * FROM users WHERE student_id = $1',
      [studentId]
    )
    return result.rows[0]
  }

  async createUser(userData: any) {
    const {
      id,
      email,
      password_hash,
      first_name,
      last_name,
      student_id,
      role = 'student',
      phone,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      membership_type = 'basic',
      status = 'pending',
      expiry_date,
      payment_status,
      payment_method,
      payment_amount,
      payment_reference,
      billing_address
    } = userData

    const result = await this.query(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, student_id, role, phone,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        membership_type, status, expiry_date, payment_status, payment_method, 
        payment_amount, payment_reference, billing_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        id, email, password_hash, first_name, last_name, student_id, role, phone,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        membership_type, status, expiry_date, payment_status, payment_method,
        payment_amount, payment_reference, billing_address
      ]
    )
    return result.rows[0]
  }

  async updateUser(userId: string, userData: any) {
    const keys = Object.keys(userData)
    const values = Object.values(userData)
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')
    
    const result = await this.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [userId, ...values]
    )
    return result.rows[0]
  }

  async getAllUsers() {
    const result = await this.query('SELECT * FROM users ORDER BY created_at DESC')
    return result.rows
  }

  async getPendingUsers() {
    const result = await this.query(
      "SELECT * FROM users WHERE status = 'pending' ORDER BY created_at ASC"
    )
    return result.rows
  }

  async approveUser(userId: string) {
    const result = await this.query(
      "UPDATE users SET status = 'approved', approval_date = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *",
      [userId]
    )
    return result.rows[0]
  }

  // Session operations
  async getSessionsByDate(date: string) {
    const result = await this.query(
      `SELECT gs.*, 
              COUNT(b.id) as current_bookings,
              gs.capacity - COUNT(b.id) as available_spots
       FROM gym_sessions gs
       LEFT JOIN bookings b ON gs.id = b.session_id 
                              AND b.status IN ('confirmed', 'completed')
       WHERE gs.date = $1 AND gs.is_active = true
       GROUP BY gs.id
       ORDER BY gs.start_time`,
      [date]
    )
    return result.rows
  }

  async getAllSessions() {
    const result = await this.query(
      `SELECT gs.*, 
              COUNT(b.id) as current_bookings,
              gs.capacity - COUNT(b.id) as available_spots
       FROM gym_sessions gs
       LEFT JOIN bookings b ON gs.id = b.session_id 
                              AND b.status IN ('confirmed', 'completed')
       WHERE gs.is_active = true
       GROUP BY gs.id
       ORDER BY gs.date DESC, gs.start_time`
    )
    return result.rows
  }

  async getSessionById(sessionId: string) {
    const result = await this.query(
      'SELECT * FROM gym_sessions WHERE id = $1',
      [sessionId]
    )
    return result.rows[0]
  }

  async createSession(sessionData: any) {
    const {
      date, startTime, endTime, start_time, end_time, capacity, type, instructor, description, difficulty, price
    } = sessionData

    // Handle both camelCase and snake_case property names
    const startTimeValue = startTime || start_time
    const endTimeValue = endTime || end_time

    console.log('Creating session with values:', {
      date,
      startTimeValue,
      endTimeValue,
      capacity,
      type,
      instructor,
      description,
      difficulty,
      price
    })

    const result = await this.query(
      `INSERT INTO gym_sessions (
        date, start_time, end_time, capacity, type, instructor, description, difficulty, price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [date, startTimeValue, endTimeValue, capacity, type, instructor, description, difficulty, price]
    )
    return result.rows[0]
  }

  async updateSession(sessionId: string, sessionData: any) {
    const keys = Object.keys(sessionData)
    const values = Object.values(sessionData)
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')
    
    const result = await this.query(
      `UPDATE gym_sessions SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [sessionId, ...values]
    )
    return result.rows[0]
  }

  async deleteSession(sessionId: string) {
    const result = await this.query(
      'DELETE FROM gym_sessions WHERE id = $1 RETURNING *',
      [sessionId]
    )
    return result.rows[0]
  }

  // Booking operations
  async getUserBookings(userId: string) {
    const result = await this.query(
      `SELECT b.*, gs.date, gs.start_time, gs.end_time, gs.type, gs.instructor, gs.description
       FROM bookings b
       JOIN gym_sessions gs ON b.session_id = gs.id
       WHERE b.user_id = $1
       ORDER BY gs.date DESC, gs.start_time DESC`,
      [userId]
    )
    return result.rows
  }

  async getAllBookings() {
    const result = await this.query(
      `SELECT b.*, 
              gs.date, gs.start_time, gs.end_time, gs.type, gs.instructor, gs.description,
              u.first_name, u.last_name, u.email, u.student_id,
              gs.date as session_date
       FROM bookings b
       JOIN gym_sessions gs ON b.session_id = gs.id
       JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
    )
    return result.rows
  }

  async getSessionBookings(sessionId: string) {
    const result = await this.query(
      `SELECT b.*, u.first_name, u.last_name, u.email, u.student_id
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.session_id = $1 AND b.status IN ('confirmed', 'completed')
       ORDER BY b.booking_date`,
      [sessionId]
    )
    return result.rows
  }

  async createBooking(bookingData: any) {
    const { user_id, session_id, userId, sessionId, status = 'confirmed', notes } = bookingData

    // Handle both camelCase and snake_case property names
    const userIdValue = userId || user_id
    const sessionIdValue = sessionId || session_id

    console.log('Creating booking with values:', {
      userIdValue,
      sessionIdValue,
      status,
      notes
    })

    const result = await this.query(
      `INSERT INTO bookings (user_id, session_id, status, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userIdValue, sessionIdValue, status, notes]
    )
    return result.rows[0]
  }

  async updateBooking(bookingId: string, bookingData: any) {
    const keys = Object.keys(bookingData)
    const values = Object.values(bookingData)
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')
    
    const result = await this.query(
      `UPDATE bookings SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [bookingId, ...values]
    )
    return result.rows[0]
  }

  async cancelBooking(bookingId: string) {
    const result = await this.query(
      "UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *",
      [bookingId]
    )
    return result.rows[0]
  }

  async checkUserBookingConflict(userId: string, sessionId: string) {
    const result = await this.query(
      `SELECT COUNT(*) as count
       FROM bookings b
       JOIN gym_sessions gs ON b.session_id = gs.id
       JOIN gym_sessions target_gs ON target_gs.id = $2
       WHERE b.user_id = $1 
         AND b.status IN ('confirmed', 'completed')
         AND gs.date = target_gs.date
         AND (
           (gs.start_time <= target_gs.start_time AND gs.end_time > target_gs.start_time)
           OR (gs.start_time < target_gs.end_time AND gs.end_time >= target_gs.end_time)
           OR (gs.start_time >= target_gs.start_time AND gs.end_time <= target_gs.end_time)
         )`,
      [userId, sessionId]
    )
    return result.rows[0].count > 0
  }

  // Notification operations
  async getUserNotifications(userId: string) {
    const result = await this.query(
      'SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC',
      [userId]
    )
    return result.rows
  }

  async getAllNotifications() {
    const result = await this.query(
      'SELECT * FROM notifications ORDER BY created_at DESC'
    )
    return result.rows
  }

  async createNotification(notificationData: any) {
    const { user_id, title, message, type = 'info', priority = 'normal', action_url } = notificationData

    const result = await this.query(
      `INSERT INTO notifications (user_id, title, message, type, priority, action_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, title, message, type, priority, action_url]
    )
    return result.rows[0]
  }

  async markNotificationAsRead(notificationId: string) {
    const result = await this.query(
      'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 RETURNING *',
      [notificationId]
    )
    return result.rows[0]
  }

  async deleteNotification(notificationId: string) {
    const result = await this.query(
      'DELETE FROM notifications WHERE id = $1 RETURNING *',
      [notificationId]
    )
    return result.rows[0]
  }

  async markAllNotificationsAsRead(userId: string) {
    const result = await this.query(
      'UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false',
      [userId]
    )
    return result.rowCount
  }

  async deleteAllUserNotifications(userId: string) {
    const result = await this.query(
      'DELETE FROM notifications WHERE user_id = $1',
      [userId]
    )
    return result.rowCount
  }

  // Statistics operations
  async getBookingStats() {
    const result = await this.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'no-show' THEN 1 END) as no_show_bookings
      FROM bookings
    `)
    return result.rows[0]
  }

  async getUserStats(userId: string) {
    const result = await this.query(`
      SELECT 
        u.points,
        u.streak,
        u.total_workouts,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_workouts,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COUNT(CASE WHEN b.status = 'no-show' THEN 1 END) as no_show_count
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.points, u.streak, u.total_workouts
    `, [userId])
    
    return result.rows[0]
  }
}

// Singleton instance
let dbAdapter: DatabaseAdapter | null = null

export function getDatabaseAdapter(): DatabaseAdapter {
  if (!dbAdapter) {
    dbAdapter = new PostgreSQLAdapter()
  }
  return dbAdapter
}

export default getDatabaseAdapter
