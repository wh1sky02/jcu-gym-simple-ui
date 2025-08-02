"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User } from "@/lib/types"

interface LoginResult {
  success: boolean
  status?: string
  message?: string
  userInfo?: any
  user?: User
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    // Don't initialize auth on admin routes - let AdminAuthProvider handle it
    if (pathname?.startsWith('/admin')) {
      setIsLoading(false)
      return
    }
    
    console.log('AuthProvider: useEffect running, checking for existing session')
    const initAuth = async () => {
      // Check for existing session
      const token = localStorage.getItem("auth-token")
      const userData = localStorage.getItem("user-data")

      console.log('AuthProvider: token exists?', !!token)
      console.log('AuthProvider: userData exists?', !!userData)

      if (token && userData) {
        console.log('AuthProvider: Setting user from localStorage')
        setUser(JSON.parse(userData))
      } else {
        // If no localStorage data, check if user is authenticated via cookie
        console.log('AuthProvider: No localStorage data, checking cookie auth')
        await checkCookieAuth()
      }
      console.log('AuthProvider: Setting isLoading to false')
      setIsLoading(false)
    }
    
    initAuth()
  }, [pathname])

  const checkCookieAuth = async () => {
    console.log('AuthProvider: checkCookieAuth called')
    try {
      // Check if we have a token in localStorage first
      const token = localStorage.getItem("auth-token")
      console.log('AuthProvider: checkCookieAuth - token from localStorage:', !!token)
      
      const headers: HeadersInit = {
        'credentials': 'include'
      }
      
      // If we have a token, send it in Authorization header
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      console.log('AuthProvider: Making request to /api/auth/me')
      // Try to fetch user data using either cookie or header authentication
      const response = await fetch("/api/auth/me", {
        headers,
        credentials: 'include' // Include cookies in request
      })
      
      console.log('AuthProvider: /api/auth/me response status:', response.status)
      
      if (response.ok) {
        const userData = await response.json()
        console.log('AuthProvider: User data received:', userData)
        setUser(userData.user)
        // Also store in localStorage for faster subsequent loads
        localStorage.setItem("user-data", JSON.stringify(userData.user))
        // Update the token in localStorage if we got it from cookie
        if (!token && userData.token) {
          localStorage.setItem("auth-token", userData.token)
        }
      } else {
        console.log('AuthProvider: Auth check failed with status:', response.status)
      }
    } catch (error) {
      console.log("AuthProvider: Auth check failed with error:", error)
    }
  }

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Login": "true" // Flag to indicate user login attempt
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Successful login - user is approved
        localStorage.setItem("auth-token", data.token)
        localStorage.setItem("user-data", JSON.stringify(data.user))
        setUser(data.user)
        return {
          success: true,
          status: data.status,
          user: data.user
        }
      } else if (response.status === 202) {
        // User exists but is pending approval
        return {
          success: false,
          status: data.status || 'pending',
          message: data.message,
          userInfo: data.userInfo
        }
      } else if (response.status === 401) {
        // Invalid credentials (including admin users trying to use user portal)
        return {
          success: false,
          status: 'invalid_credentials',
          message: data.error || 'Invalid email or password'
        }
      } else if (response.status === 403) {
        // User is suspended, expired, or has other access issues
        return {
          success: false,
          status: data.status,
          message: data.message,
          userInfo: data.userInfo || data.renewalInfo || data.supportEmail
        }
      } else {
        // Invalid credentials or other error
        return {
          success: false,
          status: 'error',
          message: data.error || 'Invalid email or password'
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        status: 'error',
        message: 'An error occurred during login. Please try again.'
      }
    }
  }

  const logout = async () => {
    try {
      // Call logout API endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Logout API error:", error)
      // Continue with client-side logout even if API call fails
    } finally {
      // Clear client-side storage and state
      localStorage.removeItem("auth-token")
      localStorage.removeItem("user-data")
      setUser(null)
      
      // Redirect to login page
      window.location.href = "/auth/login"
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
