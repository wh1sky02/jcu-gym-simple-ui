// Types for the JCU Gym Management System

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  studentId: string
  role: 'student' | 'admin'
  membershipType: 'basic' | 'premium' | '1-trimester' | '3-trimester'
  status: 'pending' | 'approved' | 'suspended' | 'expired'
  phone?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  createdAt: string
  updatedAt: string
  approvalDate?: string
  expiryDate?: string
  points: number
  streak: number
  totalWorkouts: number
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod?: string
  paymentAmount?: number
  paymentDate?: string
  paymentReference?: string
  billingAddress?: string
}

export interface Session {
  id: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  currentBookings: number
  availableSpots: number
  isActive: boolean
  type: string
  instructor?: string
  description?: string
  difficulty?: string
  waitlistCount: number
  price?: number
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  userId: string
  sessionId: string
  status: 'confirmed' | 'cancelled' | 'no-show' | 'completed'
  bookingDate: string
  checkInTime?: string
  checkOutTime?: string
  notes?: string
  rating?: number
  feedback?: string
  isRecurring: boolean
  recurringId?: string
  createdAt: string
  updatedAt: string
  session: Session
}

export interface Notification {
  id: string
  userId?: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl?: string
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  earnedAt: string
  points: number
  createdAt: string
}

export interface BillingTransaction {
  id: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface BookingStats {
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  completedBookings: number
  noShowBookings: number
}

export interface UserStats {
  points: number
  streak: number
  totalWorkouts: number
  totalBookings: number
  completedWorkouts: number
  cancelledBookings: number
  noShowCount: number
}
