"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { SessionManager } from "@/lib/session-manager"

export function SessionConflictHandler() {
  const pathname = usePathname()
  
  useEffect(() => {
    // Function to perform all session checks and cleanups
    const performSessionChecks = () => {
      // Don't interfere with admin routes - let AdminAuthProvider handle them
      if (pathname?.startsWith('/admin')) {
        return
      }
      
      // Enforce session separation
      SessionManager.enforceAdminSessionSeparation()
      SessionManager.enforceUserSessionSeparation()
      
      // Check for and resolve any remaining conflicts
      SessionManager.resolveSessionConflicts()
    }
    
    // Perform initial check on mount (with delay to avoid race conditions)
    const initialTimer = setTimeout(performSessionChecks, 1000)
    
    // Set up periodic checks for session conflicts (less frequent to avoid interference)
    const interval = setInterval(performSessionChecks, 60000) // Check every 60 seconds instead of 30
    
    // Also check when the user focuses the window (in case of cross-tab conflicts)
    const handleFocus = () => {
      // Add delay to prevent immediate conflicts with auth providers
      setTimeout(performSessionChecks, 500)
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [pathname])

  return null // This component doesn't render anything
}
