"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { 
  BarChart3, 
  Calendar, 
  Users, 
  Clock, 
  Settings, 
  LogOut, 
  Crown,
  UserCheck,
  AlertCircle,
  CheckCircle,
  UserX,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Download,
  Eye,
  EyeOff,
  Mail,
  Key,
  Save,
  Bell,
  XCircle,
  TrendingUp,
  Shield,
  User
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  student_id: string
  role: string
  membership_type: string
  status: string
  created_at: string
  approval_date?: string
  expiry_date: string
  payment_status: string
  payment_method: string
  payment_amount: number
}

interface BillingTransaction {
  id: string
  userId: string
  transactionType: string
  amount: number
  currency: string
  paymentMethod: string
  paymentReference: string
  description: string
  status: string
  processedBy: string
  processedAt: string
  createdAt: string
  user: {
    firstName: string
    lastName: string
    email: string
    studentId: string
    membershipType: string
    expiryDate: string
    paymentStatus: string
  }
}

export default function AdminDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Main data state
  const [users, setUsers] = useState<User[]>([])
  const [billingTransactions, setBillingTransactions] = useState<BillingTransaction[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [sessions, setSessions] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [weekSessions, setWeekSessions] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])

  
  // Stats and filters
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    todayBookings: 0,
    totalRevenue: 0
  })
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Modals and editing state
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSessionListModal, setShowSessionListModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingSession, setEditingSession] = useState<any>(null)
  const [showEditSessionModal, setShowEditSessionModal] = useState(false)
  
  // New session form state
  const [newSession, setNewSession] = useState({
    date: '',
    startTime: '',
    endTime: '',
    capacity: '',
    type: 'general'
  })
  
  // Loading states
  const [sessionLoading, setSessionLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(false)
  const [weeklyLoading, setWeeklyLoading] = useState(false)
  
  // Booking filters
  const [bookingDate, setBookingDate] = useState('')
  const [selectedBookingDate, setSelectedBookingDate] = useState(new Date().toISOString().split('T')[0])
  const [bookingFilter, setBookingFilter] = useState('all')
  
  // Profile update states
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false)
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false)
  const [emailChangeData, setEmailChangeData] = useState({
    currentPassword: '',
    newEmail: '',
    showPassword: false
  })
  const [passwordChangeData, setPasswordChangeData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  })

  // Add new state for notifications management

  const [notificationForm, setNotificationForm] = useState({
    type: 'announcement',
    priority: 'normal',
    target: '',
    title: '',
    message: '',
    actionUrl: ''
  })
  const [notificationHistory, setNotificationHistory] = useState<any[]>([])
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Helper functions for gym schedule validation
  const isValidGymDay = (date: string): boolean => {
    if (!date) return false
    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 6 // Monday (1) to Saturday (6)
  }

  const isValidGymTime = (time: string): boolean => {
    if (!time) return false
    const [hours, minutes] = time.split(':').map(Number)
    const timeInMinutes = hours * 60 + minutes
    const gymOpenTime = 7 * 60 // 7:00 AM in minutes
    const gymCloseTime = 21 * 60 // 9:00 PM in minutes
    return timeInMinutes >= gymOpenTime && timeInMinutes <= gymCloseTime
  }

  const getMinDateForBooking = (): string => {
    const today = new Date()
    // If today is Sunday, start from Monday
    if (today.getDay() === 0) {
      today.setDate(today.getDate() + 1)
    }
    return today.toISOString().split('T')[0]
  }

  const generateTimeSlots = (): string[] => {
    const slots = []
    // Generate 1-hour time slots from 7:00 AM to 9:00 PM
    for (let hour = 7; hour <= 20; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`
      slots.push(timeString)
      // Add 30-minute slots for popular times (8 AM - 6 PM)
      if (hour >= 8 && hour <= 17) {
        const halfHourString = `${hour.toString().padStart(2, '0')}:30`
        slots.push(halfHourString)
      }
    }
    // Add final slot for 9:00 PM
    slots.push('21:00')
    return slots
  }

  const getRecommendedEndTime = (startTime: string): string => {
    if (!startTime) return ''
    const [hours, minutes] = startTime.split(':').map(Number)
    let endHour = hours + 1 // Default 1-hour session
    let endMinute = minutes
    
    // If it would go beyond 9 PM, cap it at 9 PM
    if (endHour > 21) {
      endHour = 21
      endMinute = 0
    }
    
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
  }

  const validateSessionTime = (startTime: string, endTime: string): string | null => {
    if (!startTime || !endTime) return 'Please select both start and end times'
    
    if (!isValidGymTime(startTime)) {
      return 'Start time must be between 7:00 AM and 9:00 PM'
    }
    
    if (!isValidGymTime(endTime)) {
      return 'End time must be between 7:00 AM and 9:00 PM'
    }
    
    const startMinutes = startTime.split(':').map(Number).reduce((h, m) => h * 60 + m)
    const endMinutes = endTime.split(':').map(Number).reduce((h, m) => h * 60 + m)
    
    if (endMinutes <= startMinutes) {
      return 'End time must be after start time'
    }
    
    const durationMinutes = endMinutes - startMinutes
    if (durationMinutes < 30) {
      return 'Session must be at least 30 minutes long'
    }
    
    if (durationMinutes > 180) {
      return 'Session cannot be longer than 3 hours'
    }
    
    return null
  }

  const getDayName = (date: string): string => {
    if (!date) return ''
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return dayNames[new Date(date).getDay()]
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch users
      const usersResponse = await fetch('/api/admin/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
        
        // Update stats from real data
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.length,
          activeUsers: usersData.filter((u: any) => u.status === 'approved').length,
          pendingUsers: usersData.filter((u: any) => u.status === 'pending').length,
          todayBookings: 0, // Will be updated from bookings data
        }))
      }

      // Fetch billing transactions
      const billingResponse = await fetch('/api/admin/billing')
      if (billingResponse.ok) {
        const billingData = await billingResponse.json()
        console.log('Billing data received:', billingData)
        const transactions = Array.isArray(billingData) ? billingData : []
        setBillingTransactions(transactions)
        
        // Calculate total revenue from completed transactions
        const totalRevenue = transactions
          .filter((t: any) => t.status === 'completed')
          .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0)
        
        setStats(prev => ({
          ...prev,
          totalRevenue: totalRevenue
        }))
      } else {
        console.error('Failed to fetch billing data:', billingResponse.status, billingResponse.statusText)
        const errorText = await billingResponse.text()
        console.error('Billing API error:', errorText)
        setBillingTransactions([])
      }



      // Fetch all sessions
      await fetchSessions()
      
      // Fetch bookings
      await fetchBookings()
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async (date?: string) => {
    try {
      setSessionLoading(true)
      const url = date ? `/api/admin/sessions?date=${date}` : '/api/admin/sessions'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        // Handle both direct array response (with date) and object response (without date)
        const sessionsData = Array.isArray(data) ? data : (data.sessions || [])
        setSessions(sessionsData)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setSessionLoading(false)
    }
  }

  const fetchBookings = async (date?: string, status?: string) => {
    try {
      setBookingLoading(true)
      let url = '/api/admin/bookings'
      const params = new URLSearchParams()
      
      if (date) params.append('date', date)
      if (status && status !== 'all') params.append('status', status)
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const bookingsData = await response.json()
        setBookings(Array.isArray(bookingsData) ? bookingsData : [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setBookingLoading(false)
    }
  }



  const fetchNotificationHistory = async () => {
    try {
      const response = await fetch('/api/notifications?type=all&limit=50', {
        credentials: 'include'
      })
      if (response.ok) {
        const history = await response.json()
        setNotificationHistory(history)
      }
    } catch (error) {
      console.error('Error fetching notification history:', error)
    }
  }

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return
    
    if (!user || user.role !== 'admin') {
      router.push('/admin/login')
      return
    }
    fetchData()
  }, [user, router, authLoading])

  // Load notification data when component mounts
  useEffect(() => {
    if (user?.role === 'admin') {
      // Then fetch other data
      fetchNotificationHistory()
    }
  }, [user])

  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting non-admin users
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Redirecting...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push('/admin/login')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Suspended</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">{status}</Badge>
    }
  }

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-300">Expired</Badge>
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Expiring Soon</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    const matchesSearch = searchTerm === "" || 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
        alert('User deleted successfully')
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    }
  }

  const handleSuspendUser = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'approved' : 'suspended'
    const action = newStatus === 'suspended' ? 'suspend' : 'unsuspend'
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          updates: { status: newStatus }
        })
      })

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? {...u, status: newStatus} : u))
        alert(`User ${action}ed successfully`)
      } else {
        alert(`Failed to ${action} user`)
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      alert(`Error ${action}ing user`)
    }
  }

  const handleUpdateUser = async (updates: any) => {
    if (!editingUser) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          updates: updates
        })
      })

      if (response.ok) {
        setUsers(users.map(u => u.id === editingUser.id ? {...u, ...updates} : u))
        setShowEditModal(false)
        setEditingUser(null)
        alert('User updated successfully')
        fetchData() // Refresh data
      } else {
        alert('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
    }
  }

  const handleApproveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to approve this user?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          action: 'approve'
        })
      })

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? {...u, status: 'approved', approval_date: new Date().toISOString()} : u))
        alert('User approved successfully')
      } else {
        alert('Failed to approve user')
      }
    } catch (error) {
      console.error('Error approving user:', error)
      alert('Error approving user')
    }
  }

  const handleDeclineUser = async (userId: string) => {
    if (!confirm('Are you sure you want to decline this user? This will suspend their account.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          action: 'reject'
        })
      })

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? {...u, status: 'suspended'} : u))
        alert('User declined successfully')
      } else {
        alert('Failed to decline user')
      }
    } catch (error) {
      console.error('Error declining user:', error)
      alert('Error declining user')
    }
  }

  const handleCreateSession = async () => {
    // Validate all required fields
    if (!newSession.date || !newSession.startTime || !newSession.endTime || !newSession.capacity) {
      alert('Please fill in all required fields')
      return
    }

    // Validate gym operating days (Monday to Saturday only)
    if (!isValidGymDay(newSession.date)) {
      alert(`Gym is closed on ${getDayName(newSession.date)}s. Please select a date from Monday to Saturday.`)
      return
    }

    // Validate session times
    const timeValidationError = validateSessionTime(newSession.startTime, newSession.endTime)
    if (timeValidationError) {
      alert(timeValidationError)
      return
    }

    // Validate capacity
    const capacity = parseInt(newSession.capacity)
    if (isNaN(capacity) || capacity < 1 || capacity > 50) {
      alert('Capacity must be between 1 and 50')
      return
    }

    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          sessionData: newSession
        })
      })

      if (response.ok) {
        alert('Session created successfully!')
        setShowCreateSessionModal(false)
        setNewSession({
          date: "",
          startTime: "",
          endTime: "",
          capacity: "",
          type: "general"
        })
        // Refresh sessions if the created session is for the selected date
        if (newSession.date === selectedDate) {
          await fetchSessions(selectedDate)
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create session')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Error creating session')
    }
  }

  const handleUpdateSession = async () => {
    if (!editingSession) return
    
    // Validate all required fields
    if (!editingSession.date || !editingSession.start_time || !editingSession.end_time || !editingSession.capacity) {
      alert('Please fill in all required fields')
      return
    }

    // Validate gym operating days (Monday to Saturday only)
    if (!isValidGymDay(editingSession.date)) {
      alert(`Gym is closed on ${getDayName(editingSession.date)}s. Please select a date from Monday to Saturday.`)
      return
    }

    // Validate session times
    const timeValidationError = validateSessionTime(editingSession.start_time, editingSession.end_time)
    if (timeValidationError) {
      alert(timeValidationError)
      return
    }

    // Validate capacity
    const capacity = parseInt(editingSession.capacity)
    if (isNaN(capacity) || capacity < 1 || capacity > 50) {
      alert('Capacity must be between 1 and 50')
      return
    }
    
    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: editingSession.id,
          updates: {
            date: editingSession.date,
            startTime: editingSession.start_time,
            endTime: editingSession.end_time,
            capacity: capacity,
            type: editingSession.type,
            instructor: editingSession.instructor,
            description: editingSession.description
          }
        })
      })

      if (response.ok) {
        alert('Session updated successfully')
        setShowEditSessionModal(false)
        setEditingSession(null)
        await fetchSessions(selectedDate)
        // Refresh weekly overview
        await loadWeeklyOverview()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update session')
      }
    } catch (error) {
      console.error('Error updating session:', error)
      alert('Error updating session')
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This will cancel all bookings.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/sessions?sessionId=${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Session deleted successfully')
        await fetchSessions(selectedDate)
        // Refresh weekly overview
        await loadWeeklyOverview()
      } else {
        alert('Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Error deleting session')
    }
  }

  const handleEditSession = (session: any) => {
    setEditingSession(session)
    setShowEditSessionModal(true)
  }

  const handleDateChange = async (date: string) => {
    setSelectedDate(date)
    await fetchSessions(date)
  }

  const handleBookingDateChange = async (date: string) => {
    setSelectedBookingDate(date)
    await fetchBookings(date, bookingFilter)
  }

  const handleBookingFilterChange = async (filter: string) => {
    setBookingFilter(filter)
    await fetchBookings(selectedBookingDate, filter)
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    
    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          updates: { status: 'cancelled' }
        })
      })

      if (response.ok) {
        await fetchBookings(selectedBookingDate, bookingFilter)
        await fetchSessions(selectedDate) // Refresh session data to update capacity
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    }
  }

  const handleEmailChange = async () => {
    if (!emailChangeData.currentPassword || !emailChangeData.newEmail) {
      alert('Please fill in all fields')
      return
    }

    if (!emailChangeData.newEmail.endsWith('@my.jcu.edu.au')) {
      alert('Please use a valid JCU email address')
      return
    }

    setProfileUpdateLoading(true)
    
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'email',
          currentPassword: emailChangeData.currentPassword,
          newEmail: emailChangeData.newEmail
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert('Email updated successfully!')
        setShowEmailChangeModal(false)
        setEmailChangeData({ currentPassword: "", newEmail: "", showPassword: false })
        
        // Update user data in localStorage and state
        const userData = JSON.parse(localStorage.getItem('user-data') || '{}')
        userData.email = result.newEmail
        localStorage.setItem('user-data', JSON.stringify(userData))
        
        // Refresh the page to update the UI
        window.location.reload()
      } else {
        alert(result.error || 'Failed to update email')
      }
    } catch (error) {
      console.error('Error updating email:', error)
      alert('An error occurred while updating email')
    } finally {
      setProfileUpdateLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordChangeData.currentPassword || !passwordChangeData.newPassword || !passwordChangeData.confirmPassword) {
      alert('Please fill in all fields')
      return
    }

    if (passwordChangeData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    setProfileUpdateLoading(true)
    
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'password',
          currentPassword: passwordChangeData.currentPassword,
          newPassword: passwordChangeData.newPassword
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert('Password updated successfully!')
        setShowPasswordChangeModal(false)
        setPasswordChangeData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          showCurrentPassword: false,
          showNewPassword: false,
          showConfirmPassword: false
        })
      } else {
        alert(result.error || 'Failed to update password')
      }
    } catch (error) {
      console.error('Error updating password:', error)
      alert('An error occurred while updating password')
    } finally {
      setProfileUpdateLoading(false)
    }
  }



  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      alert('Please enter both title and message')
      return
    }

    try {
      setNotificationLoading(true)
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type,
          priority: notificationForm.priority,
          userId: notificationForm.target || null, // null for global notifications
          actionUrl: notificationForm.actionUrl || null
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message || 'Notification sent successfully!')
        setNotificationForm({
          type: 'announcement',
          priority: 'normal',
          target: '',
          title: '',
          message: '',
          actionUrl: ''
        })
        await fetchNotificationHistory() // Refresh the history
      } else {
        alert(result.error || 'Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('An error occurred while sending the notification')
    } finally {
      setNotificationLoading(false)
    }
  }

  const handleNotificationTemplate = (template: { title: string; message: string; type: string; priority: string }) => {
    setNotificationForm(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      type: template.type,
      priority: template.priority
    }))
  }

  const fetchWeekOverview = async () => {
    try {
      setWeeklyLoading(true)
      const weekDays = []
      const today = new Date()
      
      // Find the Monday of the current week
      const monday = new Date(today)
      monday.setDate(today.getDate() - today.getDay() + 1)
      
      // Generate data for Monday through Saturday (6 days)
      for (let i = 0; i < 6; i++) {
        const day = new Date(monday)
        day.setDate(monday.getDate() + i)
        const dateString = day.toISOString().split('T')[0]
        
        const response = await fetch(`/api/admin/sessions?date=${dateString}`)
        if (response.ok) {
          const sessionsData = await response.json()
          const totalCapacity = sessionsData.reduce((sum: number, session: any) => sum + session.capacity, 0)
          const totalBookings = sessionsData.reduce((sum: number, session: any) => sum + session.current_bookings, 0)
          const utilization = totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0
          
          weekDays.push({
            day: day.toLocaleDateString('en-US', { weekday: 'long' }),
            date: dateString,
            sessions: sessionsData.length,
            utilization: utilization,
            available: sessionsData.filter((s: any) => s.current_bookings < s.capacity).length,
            totalCapacity,
            totalBookings
          })
        }
      }
      
      return weekDays
    } catch (error) {
      console.error('Error fetching week overview:', error)
      return []
    } finally {
      setWeeklyLoading(false)
    }
  }

  const loadWeeklyOverview = async () => {
    const weekData = await fetchWeekOverview()
    setWeeklyData(weekData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-2 border-blue-600">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-900">
                    JCU Fitness Center
                  </h1>
                  <p className="text-blue-700 font-medium">Admin Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-blue-600 font-medium">Administrator</p>
                <p className="text-lg font-bold text-blue-900">{user.firstName} {user.lastName}</p>
              </div>
              <Button 
                onClick={logout} 
                variant="outline" 
                size="sm"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-semibold"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white border border-gray-200 shadow-md rounded-lg p-1">
            <TabsTrigger value="overview" className="text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="sessions" className="text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
              <Calendar className="h-4 w-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
              <Clock className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
              <DollarSign className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border-l-4 border-l-blue-500 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600">Total Users</CardTitle>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700">
                    {stats.totalUsers}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-green-500 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Active Members</CardTitle>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">
                    {stats.activeUsers}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-amber-500 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Pending Approvals</CardTitle>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-700">
                    {stats.pendingUsers}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-purple-500 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600">Total Revenue</CardTitle>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700">
                    S${stats.totalRevenue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  Recent User Registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200">
                      <div>
                        <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(user.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* User Management */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-blue-900">
                User Management
              </h2>
              <div className="flex space-x-4">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="bg-white shadow-md">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.student_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.membership_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-900">{user.expiry_date}</div>
                              {getExpiryStatus(user.expiry_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">S${user.payment_amount}</div>
                            <div className="text-xs text-gray-500">{user.payment_method}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              {user.status === 'pending' ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveUser(user.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeclineUser(user.id)}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditUser(user)}
                                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSuspendUser(user.id, user.status)}
                                    className={`border-amber-300 text-amber-600 hover:bg-amber-50 ${
                                      user.status === 'suspended' ? 'bg-amber-50' : ''
                                    }`}
                                  >
                                    {user.status === 'suspended' ? (
                                      <UserCheck className="h-4 w-4" />
                                    ) : (
                                      <UserX className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user.id)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            {/* Session Management */}
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  Session Management
                </CardTitle>
                <CardDescription className="text-gray-600">Manage gym session availability and capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowCreateSessionModal(true)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Time Slot
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={() => setShowSessionListModal(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Sessions
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-green-300 text-green-600 hover:bg-green-50"
                      onClick={fetchData}
                      disabled={loading}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                  

                  
                  {/* All Sessions */}
                  <div className="mt-6">
                    <h4 className="text-gray-900 font-semibold mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                      All Sessions
                    </h4>
                    <div className="space-y-3">
                      {sessions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No sessions scheduled</p>
                        </div>
                      ) : (
                        sessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-gray-900 font-medium">
                                      {new Date(session.date).toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                    <span className="text-gray-900 font-medium">
                                      {session.start_time} - {session.end_time}
                                    </span>
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                      {session.type}
                                    </Badge>
                                    {session.instructor && (
                                      <span className="text-gray-600">{session.instructor}</span>
                                    )}
                                  </div>
                                  {session.description && (
                                    <div className="text-sm text-gray-500 mt-1">
                                      {session.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="text-gray-900 font-medium">
                                  {session.current_bookings}/{session.capacity} booked
                                </div>
                                <div className="text-sm text-gray-500">
                                  {Math.round((session.current_bookings / session.capacity) * 100)}% utilized
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleEditSession(session)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteSession(session.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Week Overview */}
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    Weekly Overview (Mon-Sat)
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50"
                    onClick={loadWeeklyOverview}
                    disabled={weeklyLoading}
                  >
                    {weeklyLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                    ) : (
                      <TrendingUp className="h-3 w-3" />
                    )}
                  </Button>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Session utilization Monday through Saturday (7 AM - 9 PM)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {weeklyLoading ? (
                    <div className="text-center py-8 text-blue-600">Loading weekly data...</div>
                  ) : weeklyData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No weekly data available</div>
                  ) : (
                    weeklyData.map((dayData) => (
                      <div key={dayData.day} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className="text-gray-900 font-medium">{dayData.day}</span>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <span className="text-green-600 text-sm">
                              {dayData.sessions} sessions
                            </span>
                            <div className="text-xs text-gray-400">
                              {dayData.available} available
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-medium ${
                              dayData.utilization >= 80 ? 'text-red-600' : 
                              dayData.utilization >= 60 ? 'text-amber-600' : 'text-green-600'
                            }`}>
                              {dayData.utilization}% booked
                            </span>
                            <div className="text-xs text-gray-500">
                              {dayData.totalBookings}/{dayData.totalCapacity}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleDateChange(dayData.date)}
                          >
                            View Day
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Weekly Summary */}
                {weeklyData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-amber-600">
                          {weeklyData.reduce((sum, day) => sum + day.sessions, 0)}
                        </div>
                        <div className="text-xs text-gray-500">Total Sessions</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {weeklyData.reduce((sum, day) => sum + day.totalBookings, 0)}
                        </div>
                        <div className="text-xs text-gray-500">Total Bookings</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {Math.round(
                            weeklyData.reduce((sum, day) => sum + day.utilization, 0) / weeklyData.length
                          )}%
                        </div>
                        <div className="text-xs text-gray-500">Avg Utilization</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <h2 className="text-3xl font-bold text-blue-900">Booking Management</h2>
            
            {/* Booking Filters */}
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900">Filter Bookings</CardTitle>
                <CardDescription className="text-gray-600">
                  Filter bookings by date and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedBookingDate}
                      onChange={(e) => handleBookingDateChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <Select value={bookingFilter} onValueChange={handleBookingFilterChange}>
                      <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all">All Bookings</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => fetchBookings(selectedBookingDate, bookingFilter)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? "Loading..." : "Refresh"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bookings List */}
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900">
                  Bookings for {new Date(selectedBookingDate).toLocaleDateString('en-AU', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookingLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading bookings...</div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No bookings found for selected criteria</div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {booking.user?.name || `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim() || 'Unknown User'}
                                </p>
                                <p className="text-sm text-gray-600">{booking.user?.email}</p>
                                <p className="text-xs text-gray-500">Student ID: {booking.user?.studentId || 'N/A'}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-900">
                                  {booking.session?.startTime} - {booking.session?.endTime}
                                </p>
                                <p className="text-xs text-gray-600">{booking.session?.type || 'General Session'}</p>
                                <p className="text-xs text-gray-600">
                                  Instructor: {booking.session?.instructor || 'Self-guided'}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  className={
                                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-300' :
                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-300' :
                                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    'bg-gray-100 text-gray-800 border-gray-300'
                                  }
                                >
                                  {booking.status}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  Booked: {new Date(booking.bookingDate || booking.createdAt).toLocaleDateString()}
                                </p>
                                {booking.status === 'confirmed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2 border-red-300 text-red-600 hover:bg-red-50"
                                    onClick={() => handleCancelBooking(booking.id)}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="notifications" className="space-y-6">
            {/* Notifications Management */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-blue-900">
                Notifications Management
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Notification */}
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Bell className="h-6 w-6 text-blue-600" />
                    </div>
                    Send Notification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select 
                        value={notificationForm.type}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 transition-colors"
                      >
                        <option value="announcement">📢 Announcement</option>
                        <option value="info">ℹ️ Information</option>
                        <option value="warning">⚠️ Warning</option>
                        <option value="success">✅ Success</option>
                        <option value="error">❌ Error</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select 
                        value={notificationForm.priority}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 transition-colors"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
                      <select 
                        value={notificationForm.target}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, target: e.target.value }))}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 transition-colors"
                      >
                        <option value="">All Users (Global)</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input 
                        type="text" 
                        value={notificationForm.title}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Notification title..."
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 transition-colors placeholder:text-gray-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                      <textarea 
                        rows={3}
                        value={notificationForm.message}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Notification message..."
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 transition-colors placeholder:text-gray-500"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSendNotification}
                      disabled={notificationLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {notificationLoading ? 'Sending...' : 'Send Notification'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Templates */}
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    Quick Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => handleNotificationTemplate({
                        title: "Scheduled Maintenance",
                        message: "The gym will be temporarily closed for maintenance on [DATE] from [TIME] to [TIME]. Please plan your workouts accordingly.",
                        type: "warning",
                        priority: "high"
                      })}
                      className="w-full justify-start text-left border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-all duration-200"
                    >
                      🔧 Maintenance Notice
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleNotificationTemplate({
                        title: "New Equipment Available",
                        message: "We've added new fitness equipment to the gym! Come check out our latest additions and enhance your workout experience.",
                        type: "announcement",
                        priority: "normal"
                      })}
                      className="w-full justify-start text-left border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                    >
                      🏋️ New Equipment
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleNotificationTemplate({
                        title: "Session Reminder",
                        message: "Don't forget about your upcoming gym session tomorrow at [TIME]. We look forward to seeing you!",
                        type: "info",
                        priority: "normal"
                      })}
                      className="w-full justify-start text-left border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                    >
                      ⏰ Session Reminder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notification History */}
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notificationHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications sent yet</p>
                    <p className="text-sm">Sent notifications will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {notificationHistory.slice(0, 10).map((notification) => (
                      <div key={notification.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                              <Badge className={`text-xs ${
                                notification.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-300' :
                                notification.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                'bg-blue-100 text-blue-800 border-blue-300'
                              }`}>
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>
                                {new Date(notification.created_at).toLocaleDateString("en-AU", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                              <span>
                                {notification.user_name || 'All Users'}
                              </span>
                              <Badge className={`text-xs ${
                                notification.type === 'announcement' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                notification.type === 'success' ? 'bg-green-100 text-green-800 border-green-300' :
                                notification.type === 'error' ? 'bg-red-100 text-red-800 border-red-300' :
                                'bg-blue-100 text-blue-800 border-blue-300'
                              }`}>
                                {notification.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <h2 className="text-3xl font-bold text-blue-900">Billing & Transactions</h2>
            
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {billingTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No recent transactions</p>
                    <p className="text-sm">Payment transactions will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {billingTransactions.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">{transaction.user?.firstName} {transaction.user?.lastName}</p>
                          <p className="text-sm text-gray-600">{transaction.user?.email}</p>
                          <p className="text-xs text-gray-500">{transaction.paymentReference}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">S${transaction.amount}</p>
                          <p className="text-sm text-gray-600">{transaction.paymentMethod}</p>
                          <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-3xl font-bold text-blue-900">Admin Settings</h2>
            
            {/* Admin Profile Management */}
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                    <User className="h-6 w-6 text-amber-600" />
                  </div>
                  Admin Profile Management
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Update your admin account email and password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => setShowEmailChangeModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center h-12"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Change Email
                  </Button>
                  
                  <Button
                    onClick={() => setShowPasswordChangeModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center h-12"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Current Admin Email</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* System Settings */}
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Settings className="h-6 w-6 text-green-600" />
                  </div>
                  System Configuration
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">System Status</p>
                    <p className="text-sm text-gray-600">All systems operational</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Database</p>
                    <p className="text-sm text-gray-600">Connected and synchronized</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Payment Processing</p>
                    <p className="text-sm text-gray-600">Payment gateway active</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Session Modal */}
      {showCreateSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96 max-w-lg border border-amber-500/30">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Time Slot</h3>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-blue-400 text-sm">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">i</span>
                </div>
                <span>Gym operates Monday to Saturday, 7:00 AM - 9:00 PM</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={newSession.date}
                  min={getMinDateForBooking()}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    if (selectedDate && !isValidGymDay(selectedDate)) {
                      alert(`Gym is closed on ${getDayName(selectedDate)}s. Please select Monday through Saturday.`)
                      return
                    }
                    setNewSession({...newSession, date: selectedDate})
                  }}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                {newSession.date && (
                  <p className="text-xs text-gray-400 mt-1">
                    Selected: {getDayName(newSession.date)}, {new Date(newSession.date).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={newSession.startTime}
                    onChange={(e) => {
                      const startTime = e.target.value
                      setNewSession({
                        ...newSession, 
                        startTime,
                        endTime: startTime ? getRecommendedEndTime(startTime) : ''
                      })
                    }}
                    className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">Select start time</option>
                    {generateTimeSlots().slice(0, -1).map(time => (
                      <option key={time} value={time}>
                        {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={newSession.endTime}
                    onChange={(e) => setNewSession({...newSession, endTime: e.target.value})}
                    className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    disabled={!newSession.startTime}
                  >
                    <option value="">Select end time</option>
                    {generateTimeSlots()
                      .filter(time => {
                        if (!newSession.startTime) return false
                        const startMinutes = newSession.startTime.split(':').map(Number).reduce((h: number, m: number) => h * 60 + m)
                        const timeMinutes = time.split(':').map(Number).reduce((h: number, m: number) => h * 60 + m)
                        return timeMinutes > startMinutes
                      })
                      .map(time => (
                        <option key={time} value={time}>
                          {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>
              
              {newSession.startTime && newSession.endTime && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm">
                    Session Duration: {(() => {
                      const startMinutes = newSession.startTime.split(':').map(Number).reduce((h: number, m: number) => h * 60 + m)
                      const endMinutes = newSession.endTime.split(':').map(Number).reduce((h: number, m: number) => h * 60 + m)
                      const duration = endMinutes - startMinutes
                      const hours = Math.floor(duration / 60)
                      const minutes = duration % 60
                      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
                    })()}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Capacity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={newSession.capacity}
                  onChange={(e) => setNewSession({...newSession, capacity: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  min="1"
                  max="50"
                  placeholder="Max participants (1-50)"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: 10-20 for general sessions, 5-15 for classes
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Session Type</label>
                <select
                  value={newSession.type}
                  onChange={(e) => setNewSession({...newSession, type: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="general">🏋️ General Workout</option>
                  <option value="class">👥 Fitness Class</option>
                  <option value="personal-training">🎯 Personal Training</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateSessionModal(false)
                  setNewSession({
                    date: "",
                    startTime: "",
                    endTime: "",
                    capacity: "",
                    type: "general"
                  })
                }}
                className="border-gray-500 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!newSession.date || !newSession.startTime || !newSession.endTime || !newSession.capacity}
              >
                Create Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96 max-w-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={editingUser.first_name}
                  onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editingUser.last_name}
                  onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Membership Type</label>
                <select
                  value={editingUser.membership_type}
                  onChange={(e) => setEditingUser({...editingUser, membership_type: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white"
                >
                  <option value="1-trimester">1 Trimester</option>
                  <option value="3-trimester">3 Trimester</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="border-gray-500 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateUser({
                  first_name: editingUser.first_name,
                  last_name: editingUser.last_name,
                  email: editingUser.email,
                  membership_type: editingUser.membership_type
                })}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96 max-w-lg border border-amber-500/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-amber-400" />
              Change Admin Email
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={emailChangeData.showPassword ? "text" : "password"}
                    value={emailChangeData.currentPassword}
                    onChange={(e) => setEmailChangeData({...emailChangeData, currentPassword: e.target.value})}
                    className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setEmailChangeData({...emailChangeData, showPassword: !emailChangeData.showPassword})}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white"
                  >
                    {emailChangeData.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">New Email</label>
                <input
                  type="email"
                  value={emailChangeData.newEmail}
                  onChange={(e) => setEmailChangeData({...emailChangeData, newEmail: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white"
                  placeholder="new.admin@my.jcu.edu.au"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailChangeModal(false)
                  setEmailChangeData({ currentPassword: "", newEmail: "", showPassword: false })
                }}
                className="border-gray-500 text-gray-300"
                disabled={profileUpdateLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEmailChange}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={profileUpdateLoading}
              >
                {profileUpdateLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  "Update Email"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96 max-w-lg border border-amber-500/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Key className="h-5 w-5 mr-2 text-amber-400" />
              Change Admin Password
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={passwordChangeData.showCurrentPassword ? "text" : "password"}
                    value={passwordChangeData.currentPassword}
                    onChange={(e) => setPasswordChangeData({...passwordChangeData, currentPassword: e.target.value})}
                    className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordChangeData({...passwordChangeData, showCurrentPassword: !passwordChangeData.showCurrentPassword})}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white"
                  >
                    {passwordChangeData.showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={passwordChangeData.showNewPassword ? "text" : "password"}
                    value={passwordChangeData.newPassword}
                    onChange={(e) => setPasswordChangeData({...passwordChangeData, newPassword: e.target.value})}
                    className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white pr-10"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordChangeData({...passwordChangeData, showNewPassword: !passwordChangeData.showNewPassword})}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white"
                  >
                    {passwordChangeData.showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={passwordChangeData.showConfirmPassword ? "text" : "password"}
                    value={passwordChangeData.confirmPassword}
                    onChange={(e) => setPasswordChangeData({...passwordChangeData, confirmPassword: e.target.value})}
                    className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordChangeData({...passwordChangeData, showConfirmPassword: !passwordChangeData.showConfirmPassword})}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white"
                  >
                    {passwordChangeData.showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordChangeModal(false)
                  setPasswordChangeData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                    showCurrentPassword: false,
                    showNewPassword: false,
                    showConfirmPassword: false
                  })
                }}
                className="border-gray-500 text-gray-300"
                disabled={profileUpdateLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={profileUpdateLoading}
              >
                {profileUpdateLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditSessionModal && editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96 max-w-lg border border-amber-500/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Edit className="h-5 w-5 mr-2 text-amber-400" />
              Edit Session
            </h3>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-blue-400 text-sm">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">i</span>
                </div>
                <span>Gym operates Monday to Saturday, 7:00 AM - 9:00 PM</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={editingSession.date}
                  min={getMinDateForBooking()}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    if (selectedDate && !isValidGymDay(selectedDate)) {
                      alert(`Gym is closed on ${getDayName(selectedDate)}s. Please select Monday through Saturday.`)
                      return
                    }
                    setEditingSession({...editingSession, date: selectedDate})
                  }}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                {editingSession.date && (
                  <p className="text-xs text-gray-400 mt-1">
                    Selected: {getDayName(editingSession.date)}, {new Date(editingSession.date).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editingSession.start_time}
                    onChange={(e) => {
                      const startTime = e.target.value
                      setEditingSession({
                        ...editingSession, 
                        start_time: startTime,
                        end_time: startTime && !editingSession.end_time ? getRecommendedEndTime(startTime) : editingSession.end_time
                      })
                    }}
                    className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">Select start time</option>
                    {generateTimeSlots().slice(0, -1).map(time => (
                      <option key={time} value={time}>
                        {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editingSession.end_time}
                    onChange={(e) => setEditingSession({...editingSession, end_time: e.target.value})}
                    className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    disabled={!editingSession.start_time}
                  >
                    <option value="">Select end time</option>
                    {generateTimeSlots()
                      .filter(time => {
                        if (!editingSession.start_time) return false
                        const startMinutes = editingSession.start_time.split(':').map(Number).reduce((h: number, m: number) => h * 60 + m)
                        const timeMinutes = time.split(':').map(Number).reduce((h: number, m: number) => h * 60 + m)
                        return timeMinutes > startMinutes
                      })
                      .map(time => (
                        <option key={time} value={time}>
                          {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>
              
              {editingSession.start_time && editingSession.end_time && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm">
                    Session Duration: {(() => {
                      const startMinutes = editingSession.start_time.split(':').map(Number).reduce((h: number, m: number) => h * 60 + m)
                      const endMinutes = editingSession.end_time.split(':').map(Number).reduce((h: number, m: number) => h * 60 + m)
                      const duration = endMinutes - startMinutes
                      const hours = Math.floor(duration / 60)
                      const minutes = duration % 60
                      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
                    })()}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Capacity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={editingSession.capacity}
                  onChange={(e) => setEditingSession({...editingSession, capacity: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  min="1"
                  max="50"
                  placeholder="Max participants (1-50)"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: 10-20 for general sessions, 5-15 for classes
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Session Type</label>
                <select
                  value={editingSession.type}
                  onChange={(e) => setEditingSession({...editingSession, type: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="general">🏋️ General Workout</option>
                  <option value="class">👥 Fitness Class</option>
                  <option value="personal-training">🎯 Personal Training</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Instructor</label>
                <input
                  type="text"
                  value={editingSession.instructor || ''}
                  onChange={(e) => setEditingSession({...editingSession, instructor: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Self-guided"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={editingSession.description || ''}
                  onChange={(e) => setEditingSession({...editingSession, description: e.target.value})}
                  className="w-full p-2 bg-slate-700 border border-gray-600 rounded text-white h-20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Session description"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditSessionModal(false)
                  setEditingSession(null)
                }}
                className="border-gray-500 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSession}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!editingSession.date || !editingSession.start_time || !editingSession.end_time || !editingSession.capacity}
              >
                Update Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session List Modal */}
      {showSessionListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-4/5 max-w-4xl max-h-[90vh] overflow-y-auto border border-amber-500/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-amber-400" />
              All Sessions Management
            </h3>
            
            {/* Date Filter */}
            <div className="flex items-center space-x-4 mb-6">
              <label className="text-white font-medium">Filter by Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
              />
              <Button
                onClick={() => setShowSessionListModal(false)}
                variant="outline"
                className="border-gray-500 text-gray-300 ml-auto"
              >
                Close
              </Button>
            </div>

            {/* Sessions List */}
            <div className="space-y-3">
              {sessionLoading ? (
                <div className="text-center py-8 text-amber-400">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No sessions found for {new Date(selectedDate).toLocaleDateString()}
                </div>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <span className="text-white font-medium text-lg">
                            {session.start_time} - {session.end_time}
                          </span>
                          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                            {session.type}
                          </Badge>
                          <span className="text-gray-300">{session.instructor}</span>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          {session.description}
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-green-400">
                            Capacity: {session.capacity}
                          </span>
                          <span className="text-amber-400">
                            Booked: {session.current_bookings}
                          </span>
                          <span className="text-blue-400">
                            Available: {session.capacity - session.current_bookings}
                          </span>
                          <span className="text-purple-400">
                            Utilization: {Math.round((session.current_bookings / session.capacity) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                          onClick={() => {
                            setShowSessionListModal(false)
                            handleEditSession(session)
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 