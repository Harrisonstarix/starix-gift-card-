"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Check,
  Gift,
  ArrowUpRight,
  Wallet,
  Users,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminNotification {
  id: string
  type: string
  title: string
  message: string
  severity: "info" | "warning" | "critical" | "success"
  status: "unread" | "read" | "dismissed"
  entity_type?: string
  entity_id?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export function AdminNotificationsPanel() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error("Failed to fetch admin notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (notificationId?: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationId ? { notificationId } : { markAllRead: true }),
      })
      fetchNotifications()
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, dismiss: true }),
      })
      fetchNotifications()
    } catch (err) {
      console.error("Failed to dismiss:", err)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "new_purchase":
        return <Gift className="w-4 h-4" />
      case "redemption_pending":
      case "redemption_failed":
        return <ArrowUpRight className="w-4 h-4" />
      case "low_treasury":
        return <Wallet className="w-4 h-4" />
      case "user_signup":
        return <Users className="w-4 h-4" />
      case "high_volume":
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 border-red-500/30"
      case "warning":
        return "bg-yellow-500/20 border-yellow-500/30"
      case "success":
        return "bg-green-500/20 border-green-500/30"
      default:
        return "bg-blue-500/20 border-blue-500/30"
    }
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now.getTime() - notifDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return notifDate.toLocaleDateString()
  }

  const criticalCount = notifications.filter((n) => n.severity === "critical" && n.status === "unread").length

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center",
                criticalCount > 0 ? "bg-red-500 text-white" : "bg-primary text-primary-foreground",
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Admin Notifications
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalCount} critical
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAsRead()}>
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription>System alerts and activity updates</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications
                .filter((n) => n.status !== "dismissed")
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors relative group",
                      notification.status === "unread"
                        ? getSeverityColor(notification.severity)
                        : "bg-muted/30 border-border",
                    )}
                    onClick={() => {
                      if (notification.status === "unread") {
                        markAsRead(notification.id)
                      }
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissNotification(notification.id)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          notification.severity === "critical"
                            ? "bg-red-500/20"
                            : notification.severity === "warning"
                              ? "bg-yellow-500/20"
                              : notification.severity === "success"
                                ? "bg-green-500/20"
                                : "bg-blue-500/20",
                        )}
                      >
                        {getSeverityIcon(notification.severity)}
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">{notification.title}</span>
                          {notification.status === "unread" && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              notification.severity === "critical" && "border-red-500/50 text-red-400",
                              notification.severity === "warning" && "border-yellow-500/50 text-yellow-400",
                              notification.severity === "success" && "border-green-500/50 text-green-400",
                            )}
                          >
                            {getTypeIcon(notification.type)}
                            <span className="ml-1">{notification.type.replace(/_/g, " ")}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
