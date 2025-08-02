"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"

interface AdminLoginResult {
  success: boolean
  status?: string
  message?: string
  user?: User
}

interface AdminAuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<AdminLoginResult>
  logout: () => Promise<void>
  isLoading: boolean
  clearUserSession: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing admin session
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("admin-auth-token")
      const userData = localStorage.getItem("admin-user-data")

      if (token && userData) {
        const parsedUser = JSON.parse(userData)
        // Verify the user is actually an admin
        if (parsedUser.role === 'admin') {
          setUser(parsedUser)
        } else {
          // Clear invalid admin session
          clearAdminSession()
        }
      } else {
        // Check if we have a cookie-based session
        await checkCookieAuth()
      }
    } catch (error) {
      console.error("Admin auth check failed:", error)
      clearAdminSession()
    } finally {
      setIsLoading(false)
    }
  }

  const checkCookieAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          'credentials': 'include'
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        if (userData.user && userData.user.role === 'admin') {
          setUser(userData.user)
          // Store in admin-specific localStorage
          localStorage.setItem("admin-user-data", JSON.stringify(userData.user))
          if (userData.token) {
            localStorage.setItem("admin-auth-token", userData.token)
          }
        }
      }
    } catch (error) {
      console.log("Admin cookie auth check failed:", error)
    }
  }

  const clearAdminSession = () => {
    localStorage.removeItem("admin-auth-token")
    localStorage.removeItem("admin-user-data")
    setUser(null)
  }

  const clearUserSession = () => {
    // Clear any regular user session data to prevent conflicts
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user-data")
  }

  const login = async (email: string, password: string): Promise<AdminLoginResult> => {
    try {
      // Clear any existing sessions before attempting admin login
      clearAdminSession()
      clearUserSession()
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Login": "true" // Flag to indicate admin login attempt
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.user && data.user.role === 'admin') {
        // Successful admin login
        localStorage.setItem("admin-auth-token", data.token)
        localStorage.setItem("admin-user-data", JSON.stringify(data.user))
        setUser(data.user)
        return {
          success: true,
          status: data.status,
          user: data.user
        }
      } else if (response.ok && data.success && data.user && data.user.role !== 'admin') {
        // User is valid but not an admin
        return {
          success: false,
          status: 'access_denied',
          message: 'Access denied. Admin credentials required.'
        }
      } else {
        // Invalid credentials or other error
        return {
          success: false,
          status: data.status || 'error',
          message: data.message || data.error || 'Invalid admin credentials'
        }
      }
    } catch (error) {
      console.error("Admin login error:", error)
      return {
        success: false,
        status: 'error',
        message: 'An error occurred during admin login. Please try again.'
      }
    }
  }

  const logout = async () => {
    try {
      // Call logout API endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Logout": "true" // Flag to indicate admin logout
        },
      })
    } catch (error) {
      console.error("Admin logout API error:", error)
    } finally {
      // Clear all session data
      clearAdminSession()
      clearUserSession()
      
      // Redirect to admin login page
      window.location.href = "/admin/login"
    }
  }

  return (
    <AdminAuthContext.Provider value={{ user, login, logout, isLoading, clearUserSession }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}
