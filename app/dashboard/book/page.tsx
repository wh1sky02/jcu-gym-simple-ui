"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Calendar, Clock, Users, CheckCircle, AlertCircle, Target, Dumbbell, LogOut } from "lucide-react"
import type { GymSession } from "@/lib/types"
import NotificationsDropdown from "@/components/notifications-dropdown"

export default function BookSessionPage() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<GymSession[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get the next available weekday (skip weekends)
    const today = new Date()
    let nextDate = new Date(today)
    
    // If today is weekend (Saturday=6, Sunday=0), find next Monday
    while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
      nextDate.setDate(nextDate.getDate() + 1)
    }
    
    return nextDate.toISOString().split('T')[0]
  })
  const [isLoading, setIsLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return
    
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchData()
  }, [user, router, selectedDate, authLoading])

  const fetchData = async () => {
    try {
      console.log('Fetching sessions for date:', selectedDate)
      const sessionsResponse = await fetch(`/api/sessions?date=${selectedDate}`)
      console.log('Response status:', sessionsResponse.status, sessionsResponse.ok)

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        console.log('Sessions data received:', sessionsData)
        console.log('Number of sessions:', sessionsData.length)
        setSessions(sessionsData)
      } else {
        console.error('Sessions response not ok:', sessionsResponse.status)
        const errorText = await sessionsResponse.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookSession = async (sessionId: string) => {
    setBookingLoading(sessionId)
    try {
      const token = localStorage.getItem('auth-token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ sessionId, userId: user?.id })
      })

      if (response.ok) {
        setAlert({ type: 'success', message: 'Session booked successfully!' })
        fetchData()
      } else {
        const errorData = await response.json()
        setAlert({ type: 'error', message: errorData.error || 'Failed to book session' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'An error occurred while booking' })
    } finally {
      setBookingLoading(null)
      setTimeout(() => setAlert(null), 5000)
    }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getSessionTypeColor = (type: string) => {
    return 'bg-blue-100 text-blue-800 border-blue-300'
  }

  const getAvailabilityStatus = (session: GymSession) => {
    const available = session.capacity - session.currentBookings
    if (available > 3) return { status: 'available', color: 'text-green-600', icon: CheckCircle, text: `${available} spots left` }
    if (available > 0) return { status: 'limited', color: 'text-amber-600', icon: AlertCircle, text: `Only ${available} spot${available > 1 ? 's' : ''} left!` }
    return { status: 'full', color: 'text-red-600', icon: AlertCircle, text: 'Session Full' }
  }

  const isSessionBookable = (session: GymSession) => {
    const available = session.capacity - session.currentBookings
    return available > 0
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/dashboard")}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Book a Session</h1>
                <p className="text-blue-700 font-medium">Schedule your workout at JCU Fitness Center</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
        {/* Date Selection */}
        <Card className="mb-8 bg-white shadow-md border border-gray-200">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Select Date
            </CardTitle>
            <CardDescription className="text-blue-100">Choose the date for your workout session</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full md:w-auto px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-900 font-semibold text-lg"
            />
            <p className="mt-3 text-blue-600 font-medium">
              Selected: {new Date(selectedDate).toLocaleDateString('en-AU', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="mt-2 text-sm text-blue-500">
              📅 Gym operates Monday to Friday only (6:00 AM - 10:00 PM)
            </p>
          </CardContent>
        </Card>

        {/* Alert */}
        {alert && (
          <Alert className={`mb-6 ${alert.type === 'success' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <AlertDescription className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Session Booking */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 bg-white border border-blue-200 shadow-md">
            <TabsTrigger value="general" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
              <Target className="h-4 w-4 mr-2" />
              Gym Access Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle>Gym Access Sessions</CardTitle>
                <CardDescription className="text-blue-100">Book your time slot for independent gym access</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-blue-600 font-medium">Loading sessions...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-blue-900 mb-2">No sessions available</h3>
                    {(() => {
                      const selectedDay = new Date(selectedDate).getDay()
                      const isWeekend = selectedDay === 0 || selectedDay === 6
                      return isWeekend ? (
                        <div className="space-y-2">
                          <p className="text-blue-600 font-medium">The gym is closed on weekends</p>
                          <p className="text-blue-500">Please select a weekday (Monday - Friday) to book a session</p>
                        </div>
                      ) : (
                        <p className="text-blue-600">No sessions available for this date. Try selecting a different date.</p>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sessions.map((session) => {
                      const availability = getAvailabilityStatus(session)
                      const available = session.capacity - session.currentBookings
                      const StatusIcon = availability.icon

                      return (
                        <div key={session.id} className="p-6 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 text-blue-600 mr-2" />
                              <span className="font-bold text-blue-900 text-lg">
                                {formatTime(session.startTime)} - {formatTime(session.endTime)}
                              </span>
                            </div>
                            <Badge className={getSessionTypeColor(session.type)}>
                              {session.type}
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <StatusIcon className={`h-4 w-4 mr-2 ${availability.color}`} />
                                <span className={`font-semibold ${availability.color}`}>
                                  {availability.text}
                                </span>
                              </div>
                              <span className="text-blue-600 font-medium">
                                {session.currentBookings}/{session.capacity}
                              </span>
                            </div>

                            <div className="text-sm text-gray-600">
                              <p>🎯 {session.description}</p>
                              <p>👨‍🏫 {session.instructor}</p>
                            </div>
                          </div>

                          <div className="mt-4">
                            {isSessionBookable(session) ? (
                              <Button
                                onClick={() => handleBookSession(session.id)}
                                disabled={bookingLoading === session.id}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                              >
                                {bookingLoading === session.id ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Booking...
                                  </div>
                                ) : (
                                  'Book Session'
                                )}
                              </Button>
                            ) : (
                              <Button
                                disabled
                                className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                              >
                                Session Full
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
