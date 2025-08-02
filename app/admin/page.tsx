"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/components/admin-auth-provider"

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return
    
    if (!user) {
      const timer = setTimeout(() => {
        router.push('/admin/login')
      }, 100)
      return () => clearTimeout(timer)
    }
    
    if (user.role !== 'admin') {
      const timer = setTimeout(() => {
        router.push('/admin/login')
      }, 100)
      return () => clearTimeout(timer)
    }

    // Redirect to the new admin dashboard
    const timer = setTimeout(() => {
      router.push('/admin/dashboard')
    }, 100)
    return () => clearTimeout(timer)
  }, [user, router, authLoading])

  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-900 text-xl font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-900 text-xl font-medium">Redirecting to admin dashboard...</div>
    </div>
  )
}
