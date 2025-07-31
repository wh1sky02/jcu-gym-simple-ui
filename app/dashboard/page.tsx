"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Dumbbell, 
  TrendingUp, 
  Users,
  Target,
  Flame,
  BookOpen,
  LogOut
} from "lucide-react"
import type { Booking } from "@/lib/types"
import NotificationsDropdown from "@/components/notifications-dropdown"

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalBookings: 0,
    currentStreak: 0,
    weeklyWorkouts: 0
  })
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return
    
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchDashboardData()
  }, [user, router, authLoading])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Fetch bookings
      const bookingsResponse = await fetch("/api/bookings/user", { 
        headers,
        credentials: 'include' // Include cookies for session authentication
      })
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        
        // Store all bookings
        setAllBookings(bookingsData)
        
        const upcoming = bookingsData
          .filter((booking: Booking) => {
            const sessionDate = new Date(booking.session.date)
            const today = new Date()
            const isUpcoming = sessionDate >= today && booking.status === "confirmed"
            return isUpcoming
          })
          .sort((a: Booking, b: Booking) => 
            new Date(a.session.date).getTime() - new Date(b.session.date).getTime()
          )
          .slice(0, 3)
        
        setUpcomingBookings(upcoming)
        
        // Calculate stats from real data
        const completedBookings = bookingsData.filter((b: any) => b.status === 'completed')
        const thisWeekBookings = bookingsData.filter((b: any) => {
          const bookingDate = new Date(b.session.date)
          const today = new Date()
          const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
          return bookingDate >= weekStart && b.status === 'confirmed'
        })
        
        // Calculate basic streak from bookings data (simplified)
        const today = new Date()
        const completedBookings2 = bookingsData.filter((b: any) => 
          b.status === 'completed' || (b.status === 'confirmed' && new Date(b.session.date) < today)
        ).sort((a: any, b: any) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime())
        
        let streak = 0
        if (completedBookings2.length > 0) {
          // Simple streak calculation - consecutive days with workouts
          const lastWorkout = new Date(completedBookings2[0].session.date)
          const daysDiff = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDiff <= 1) { // Today or yesterday
            streak = 1
            // Check for more consecutive days
            for (let i = 1; i < completedBookings2.length; i++) {
              const currentDate = new Date(completedBookings2[i-1].session.date)
              const prevDate = new Date(completedBookings2[i].session.date)
              const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
              if (diff === 1) {
                streak++
              } else {
                break
              }
            }
          }
        }
        
        setStats(prev => ({ 
          ...prev, 
          totalBookings: bookingsData.length,
          weeklyWorkouts: thisWeekBookings.length,
          currentStreak: streak
        }))
      } else {
        console.error('Error fetching bookings:', bookingsResponse.status)
      }


    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-2 border-blue-600">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-900">JCU Fitness Center</h1>
              <p className="text-blue-700 font-medium">Welcome back, {user?.firstName} {user?.lastName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-blue-600 font-medium">Student ID</p>
                <p className="text-lg font-bold text-blue-900">{user?.studentId}</p>
              </div>
              <NotificationsDropdown userId={user?.id} />
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

      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-l-4 border-l-amber-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 font-medium">Current Streak</p>
                  <p className="text-3xl font-bold text-amber-700">{stats.currentStreak} days</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Flame className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-green-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium">This Week</p>
                  <p className="text-3xl font-bold text-green-700">{stats.weeklyWorkouts} workouts</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-blue-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium">Total Sessions</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.totalBookings}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Bookings */}
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Bookings
                </CardTitle>
                <CardDescription>Your next scheduled gym sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking: Booking) => (
                      <Card key={booking.id} className="border border-gray-200 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Dumbbell className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {new Date(booking.session.date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                                <p className="text-gray-600">
                                  {formatTime(booking.session.startTime)} - {formatTime(booking.session.endTime)}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {booking.session.type}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-xl font-medium text-gray-900 mb-1">No Upcoming Bookings</h3>
                    <p className="text-gray-500 mb-4">You don't have any upcoming gym sessions scheduled.</p>
                    <Button onClick={() => router.push('/dashboard/book')} className="bg-blue-600 hover:bg-blue-700">
                      Book a Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Weekly Overview */}
            <Card className="mt-6 shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Weekly Progress
                </CardTitle>
                <CardDescription>Track your fitness goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">Weekly Target (4 sessions)</p>
                      <p className="text-sm font-semibold text-blue-600">{stats.weeklyWorkouts} / 4 completed</p>
                    </div>
                    <Progress 
                      value={Math.min((stats.weeklyWorkouts / 4) * 100, 100)} 
                      className="h-2 bg-blue-100" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">Monthly Target (16 sessions)</p>
                      <p className="text-sm font-semibold text-green-600">{stats.totalBookings} / 16 completed</p>
                    </div>
                    <Progress 
                      value={Math.min((stats.totalBookings / 16) * 100, 100)} 
                      className="h-2 bg-green-100" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Action Panel */}
          <div>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => router.push('/dashboard/book')}
                  className="bg-blue-600 hover:bg-blue-700 w-full h-12 mb-2 shadow-sm"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Book New Session
                </Button>
                
                <Button 
                  onClick={() => router.push('/dashboard/history')}
                  variant="outline"
                  className="w-full h-12 mb-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  View Booking History
                </Button>
              </CardContent>
            </Card>


            {/* Membership Information */}
            <Card className="shadow-md mt-6">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="font-medium">Current Plan</p>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {user?.membershipType || 'Student'}
                  </Badge>
                </div>
                {user && 'expiryDate' in user && (
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Valid Until</p>
                    <p className="text-gray-700">
                      {new Date(user.expiryDate as string).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-100 py-4 mt-12 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <p className="text-gray-600 text-center text-sm">
            © {new Date().getFullYear()} JCU Singapore Fitness Center. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
