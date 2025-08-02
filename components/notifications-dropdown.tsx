"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  is_read: boolean
}

interface NotificationsDropdownProps {
  userId?: string
}

export default function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    if (!userId) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/notifications?userId=${userId}&type=user&limit=10`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch notifications on component mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchNotifications()
    }
  }, [userId])

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications()
    }
  }, [isOpen, userId])

  // Set up periodic refresh every 30 seconds to keep notification count updated
  useEffect(() => {
    if (!userId) return

    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const markAllAsRead = async () => {
    if (!userId) return
    
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      })
      
      if (response.ok) {
        // Update local state to mark all as read
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!userId) return
    
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, notificationId })
      })
      
      if (response.ok) {
        // Update local state to mark specific notification as read
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!userId) return
    
    try {
      const response = await fetch(`/api/notifications/delete?userId=${userId}&notificationId=${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Remove notification from local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const deleteAllNotifications = async () => {
    if (!userId) return
    
    try {
      const response = await fetch(`/api/notifications/delete?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Clear all notifications from local state
        setNotifications([])
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'success': return '✅'
      case 'announcement': return '📢'
      default: return 'ℹ️'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDropdown}
        className="relative p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
            <h3 className="font-semibold text-blue-900 flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-blue-600">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                                                  {notifications.map((notification) => (
                   <div
                     key={notification.id}
                     className={`p-4 hover:bg-gray-50 transition-colors ${
                       !notification.is_read ? 'bg-blue-50/50' : ''
                     }`}
                   >
                     <div className="flex items-start space-x-3">
                       <div className="flex-shrink-0 mt-1">
                         <span className="text-lg">
                           {getNotificationIcon(notification.type)}
                         </span>
                       </div>
                       <div 
                         className={`flex-1 min-w-0 ${!notification.is_read ? 'cursor-pointer' : ''}`}
                         onClick={() => !notification.is_read && markAsRead(notification.id)}
                       >
                        <div className="flex items-center space-x-2 mb-1">
                          <p className={`font-semibold text-sm ${
                            notification.priority === 'urgent' ? 'text-red-800' :
                            notification.priority === 'high' ? 'text-orange-800' :
                            notification.type === 'warning' ? 'text-yellow-800' :
                            notification.type === 'success' ? 'text-green-800' :
                            'text-blue-800'
                          }`}>
                            {notification.title}
                          </p>
                          {notification.priority !== 'normal' && (
                            <Badge className={`text-xs ${
                              notification.priority === 'urgent' ? 'bg-red-500 text-white' :
                              notification.priority === 'high' ? 'bg-orange-500 text-white' :
                              'bg-blue-500 text-white'
                            }`}>
                              {notification.priority}
                            </Badge>
                          )}
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString("en-AU", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                                                     })}
                         </p>
                       </div>
                       <div className="flex-shrink-0">
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                           onClick={(e) => {
                             e.stopPropagation()
                             deleteNotification(notification.id)
                           }}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-3 bg-gray-50 space-y-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={markAllAsRead}
                >
                  Mark All as Read ({unreadCount})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={deleteAllNotifications}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 