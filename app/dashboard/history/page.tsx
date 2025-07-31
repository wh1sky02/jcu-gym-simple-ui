"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, TrendingUp, Target, Trophy, GraduationCap, LogOut } from "lucide-react"
import type { Booking } from "@/lib/types"
import NotificationsDropdown from "@/components/notifications-dropdown"

export default function BookingHistoryPage() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return
    
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchBookings()
  }, [user, router, authLoading])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch("/api/bookings/user", { 
        headers,
        credentials: 'include' // Include cookies for session authentication
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched bookings:', data) // Debug log
        setBookings(
          data.sort(
            (a: Booking, b: Booking) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime(),
          ),
        )
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300"
      case "cancelled":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "no-show":
        return "bg-red-100 text-red-800 border-red-300"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const upcomingBookings = bookings.filter(
    (booking) => {
      // Extract just the date part (YYYY-MM-DD) for comparison
      const sessionDateStr = booking.session.date.split('T')[0]
      const todayStr = new Date().toISOString().split('T')[0]
      return sessionDateStr >= todayStr && booking.status === "confirmed"
    }
  )

  const pastBookings = bookings.filter(
    (booking) => {
      // Extract just the date part (YYYY-MM-DD) for comparison
      const sessionDateStr = booking.session.date.split('T')[0]
      const todayStr = new Date().toISOString().split('T')[0]
      const isPast = sessionDateStr < todayStr
      const isCancelled = booking.status === "cancelled"
      console.log(`Booking ${booking.id}: sessionDate=${sessionDateStr}, today=${todayStr}, isPast=${isPast}, status=${booking.status}`) // Debug log
      // Show past sessions (any status) OR cancelled future sessions
      return isPast || isCancelled
    }
  )

  console.log('Past bookings:', pastBookings) // Debug log

  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header with Ocean Wave Pattern */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-5"></div>
        <div className="absolute bottom-0 left-0 w-full h-16">
          <svg viewBox="0 0 1200 120" className="w-full h-full fill-blue-100 opacity-30">
            <path d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,120 L0,120 Z"/>
          </svg>
        </div>
        <div className="container mx-auto px-6 py-6 relative z-10">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/dashboard")}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Booking History</h1>
                <p className="text-blue-700 font-medium">View your complete workout history</p>
              </div>
            </div>
            <div className="ml-auto flex items-center space-x-3">
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

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Upcoming Bookings */}
        <Card className="bg-white shadow-lg border border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <Calendar className="h-6 w-6 mr-3" />
              Upcoming Sessions
            </CardTitle>
            <CardDescription className="text-blue-100 font-medium">Your confirmed future gym sessions</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-blue-600 font-medium text-lg">Loading...</p>
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-blue-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-blue-900 mb-2">No upcoming sessions</h3>
                <p className="text-blue-600 mb-6 font-medium">Ready to book your next workout?</p>
                <Button 
                  onClick={() => router.push("/dashboard/book")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
                >
                  Book a Session
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-6 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                        <Clock className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-900 text-lg">
                          {new Date(booking.session.date).toLocaleDateString("en-AU", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-blue-700 font-medium">
                          {formatTime(booking.session.startTime)} - {formatTime(booking.session.endTime)}
                        </p>
                        <p className="text-sm text-blue-600 font-medium">
                          Booked on {new Date(booking.bookingDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Bookings */}
        <Card className="bg-white shadow-lg border border-gray-100">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <Clock className="h-6 w-6 mr-3" />
              Past & Cancelled Sessions
            </CardTitle>
            <CardDescription className="text-gray-100 font-medium">Your booking history, completed sessions, and cancelled bookings</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {pastBookings.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <p className="text-gray-600 font-medium text-lg">No past bookings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl shadow-lg">
                        <Clock className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {new Date(booking.session.date).toLocaleDateString("en-AU", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-gray-700 font-medium">
                          {formatTime(booking.session.startTime)} - {formatTime(booking.session.endTime)}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Booked on {new Date(booking.bookingDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="bg-white shadow-lg border border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <TrendingUp className="h-6 w-6 mr-3" />
              Your Statistics
            </CardTitle>
            <CardDescription className="text-blue-100 font-medium">Track your fitness journey progress</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-3">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-blue-900">{bookings.length}</p>
                <p className="text-blue-700 font-semibold">Total Bookings</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-green-900">
                  {bookings.filter((b) => b.status === "confirmed" && new Date(b.session.date) < new Date()).length}
                </p>
                <p className="text-green-700 font-semibold">Attended</p>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl mx-auto mb-3">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-red-900">
                  {bookings.filter((b) => b.status === "no-show").length}
                </p>
                <p className="text-red-700 font-semibold">No-Shows</p>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-600 rounded-xl mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-orange-900">
                  {bookings.filter((b) => b.status === "cancelled").length}
                </p>
                <p className="text-orange-700 font-semibold">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
