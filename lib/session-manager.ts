/**
 * Utility functions for session management and preventing cross-session contamination
 */

export const SessionManager = {
  /**
   * Clear all authentication data from localStorage
   */
  clearAllSessions: () => {
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user-data")
    localStorage.removeItem("admin-auth-token")
    localStorage.removeItem("admin-user-data")
  },

  /**
   * Clear only user session data
   */
  clearUserSession: () => {
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user-data")
  },

  /**
   * Clear only admin session data
   */
  clearAdminSession: () => {
    localStorage.removeItem("admin-auth-token")
    localStorage.removeItem("admin-user-data")
  },

  /**
   * Get current user session data
   */
  getUserSession: () => {
    const token = localStorage.getItem("auth-token")
    const userData = localStorage.getItem("user-data")
    
    if (token && userData) {
      try {
        return {
          token,
          user: JSON.parse(userData)
        }
      } catch (error) {
        console.error("Error parsing user session data:", error)
        SessionManager.clearUserSession()
        return null
      }
    }
    return null
  },

  /**
   * Get current admin session data
   */
  getAdminSession: () => {
    const token = localStorage.getItem("admin-auth-token")
    const userData = localStorage.getItem("admin-user-data")
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        // Verify the user is actually an admin
        if (user.role === 'admin') {
          return {
            token,
            user
          }
        } else {
          // Clear invalid admin session
          SessionManager.clearAdminSession()
          return null
        }
      } catch (error) {
        console.error("Error parsing admin session data:", error)
        SessionManager.clearAdminSession()
        return null
      }
    }
    return null
  },

  /**
   * Check if there's any conflicting session data
   */
  hasConflictingSessions: () => {
    const userSession = SessionManager.getUserSession()
    const adminSession = SessionManager.getAdminSession()
    
    // Check for conflicts: admin data in user session or vice versa
    if (userSession && userSession.user.role === 'admin') {
      return true
    }
    
    if (adminSession && adminSession.user.role !== 'admin') {
      return true
    }
    
    // Check if both admin and user sessions exist
    return !!(userSession && adminSession)
  },

  /**
   * Resolve session conflicts by clearing all sessions
   */
  resolveSessionConflicts: () => {
    if (SessionManager.hasConflictingSessions()) {
      console.warn("Conflicting sessions detected. Clearing all sessions.")
      SessionManager.clearAllSessions()
      return true
    }
    return false
  },

  /**
   * Ensure admin users only have admin sessions
   */
  enforceAdminSessionSeparation: () => {
    const userSession = SessionManager.getUserSession()
    if (userSession && userSession.user.role === 'admin') {
      console.warn("Admin user found in regular session. Clearing user session.")
      SessionManager.clearUserSession()
      return true
    }
    return false
  },

  /**
   * Ensure regular users only have user sessions
   */
  enforceUserSessionSeparation: () => {
    const adminSession = SessionManager.getAdminSession()
    if (adminSession && adminSession.user.role !== 'admin') {
      console.warn("Non-admin user found in admin session. Clearing admin session.")
      SessionManager.clearAdminSession()
      return true
    }
    return false
  }
}
