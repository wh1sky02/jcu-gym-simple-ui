"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Users, 
  Trophy,
  Clock,
  User,
  BookOpen,
  Shield
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [checkingSetup, setCheckingSetup] = useState(true)

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/setup')
        const data = await response.json()
        
        if (data.needsSetup) {
          router.push('/setup')
          return
        }
      } catch (error) {
        console.error('Error checking setup status:', error)
      } finally {
        setCheckingSetup(false)
      }
    }

    if (!user && !isLoading) {
      checkSetupStatus()
    } else {
      setCheckingSetup(false)
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && !isLoading) {
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, router])

  if (isLoading || checkingSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-900 text-lg font-semibold">Loading JCU Fitness...</p>
        </div>
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Navigation */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-bold text-blue-900 leading-tight">JAMES COOK UNIVERSITY</h1>
              <p className="text-sm font-semibold text-blue-700">SINGAPORE FITNESS CENTER</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
                asChild
              >
                <Link href="/auth/login">
                  <User className="h-5 w-5 mr-2" />
                  Login
                </Link>
              </Button>
              <Button 
                onClick={() => router.push("/auth/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 px-4 py-2">
                  University Excellence
                </Badge>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-blue-900 leading-tight">
                Transform Your
                <span className="text-amber-600 block">
                  Fitness Journey
                </span>
                <span className="text-blue-700 block text-4xl lg:text-5xl">
                  at JCU Singapore
                </span>
              </h1>
              
              <p className="text-xl text-gray-700 leading-relaxed max-w-lg">
                Experience our state-of-the-art fitness facility with smart booking 
                and a supportive university community designed for your success.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                onClick={() => router.push("/auth/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg h-14 px-8 shadow-md"
              >
                Get Started
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => router.push("/auth/login")}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 h-14 px-8 font-semibold"
              >
                Login
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <h3 className="text-4xl font-bold text-blue-900">500+</h3>
                <p className="text-blue-700 font-semibold">Active Members</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold text-blue-900">24/7</h3>
                <p className="text-blue-700 font-semibold">Access Available</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold text-blue-900">100%</h3>
                <p className="text-blue-700 font-semibold">Student Focused</p>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-blue-50 border border-blue-200 shadow-md">
              <CardContent className="p-6 text-center">
                <Calendar className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h4 className="text-blue-900 font-bold mb-2">Session Booking</h4>
                <p className="text-blue-700 text-sm font-medium">Real-time session scheduling</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border border-green-200 shadow-md">
              <CardContent className="p-6 text-center">
                <Users className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <h4 className="text-green-900 font-bold mb-2">User Management</h4>
                <p className="text-green-700 text-sm font-medium">Secure registration & approval</p>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border border-purple-200 shadow-md">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                <h4 className="text-purple-900 font-bold mb-2">Booking History</h4>
                <p className="text-purple-700 text-sm font-medium">Track your gym sessions</p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50 border border-amber-200 shadow-md">
              <CardContent className="p-6 text-center">
                <Shield className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                <h4 className="text-amber-900 font-bold mb-2">Admin Control</h4>
                <p className="text-amber-700 text-sm font-medium">Comprehensive admin dashboard</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 360° Virtual Tour Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Experience Our Facility</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Take a 360° virtual tour of our state-of-the-art fitness center before your visit</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative">
                <iframe
                  src="https://360.theredmarker.com/F15d4Yv3wl/36142220p&93.94h&101.62t"
                  width="100%"
                  height="500"
                  frameBorder="0"
                  allowFullScreen
                  className="w-full"
                  title="JCU Singapore Fitness Center 360° Virtual Tour"
                />
                <div className="absolute top-4 left-4 bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  360° Virtual Tour
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-2">Explore Our Fitness Center</h3>
                <p className="text-gray-600">Use your mouse to navigate around and explore our modern gym equipment, spacious workout areas, and premium facilities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Key Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Our fitness center platform offers a range of features designed specifically for JCU students</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-6 w-6 text-blue-600" />
                  Smart Booking System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Book gym sessions in advance, check capacity, and manage your fitness schedule with ease.</p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-6 w-6 text-amber-600" />
                  Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Set fitness goals and track your attendance as you maintain your routine.</p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-6 w-6 text-green-600" />
                  Real-time Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">View real-time gym capacity and availability to plan your workout around peak hours.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join the JCU Singapore Fitness Center today and transform your fitness journey with our state-of-the-art facilities.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-600">
            <p className="font-bold">JCU Singapore Fitness Center</p>
            <p className="text-sm mt-2">© {new Date().getFullYear()} James Cook University Singapore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
