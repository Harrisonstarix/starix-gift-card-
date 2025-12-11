"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, XCircle, Clock, Gift, ArrowDownLeft, ArrowUpRight, ExternalLink, Check, Lock } from "lucide-react"
import { GiftCard3D } from "@/components/gift-card-3d"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  status: "unread" | "read"
  entity_type?: string
  entity_id?: string
  amount_usd?: number
  crypto_amount?: number
  crypto_coin?: string
  crypto_network?: string
  card_code?: string
  card_design?: string
  card_password?: string // Added password field
  tx_status?: string
  tx_hash?: string
  created_at: string
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/user/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (notificationId?: string) => {
    try {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationId ? { notificationId } : { markAllRead: true }),
      })
      fetchNotifications()
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const getIcon = (type: string, txStatus?: string) => {
    if (txStatus === "failed" || txStatus === "cancelled") {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    if (txStatus === "pending") {
      return <Clock className="w-5 h-5 text-yellow-500" />
    }

    switch (type) {
      case "deposit_pending":
      case "deposit_confirmed":
      case "deposit_failed":
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />
      case "purchase_pending":
      case "purchase_confirmed":
      case "card_activated":
        return <Gift className="w-5 h-5 text-primary" />
      case "redemption_pending":
      case "redemption_processing":
      case "redemption_completed":
        return <ArrowUpRight className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (txStatus?: string) => {
    switch (txStatus) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "failed":
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-muted text-muted-foreground"
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

  const togglePassword = (id: string) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAsRead()}>
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription>Your recent activity and updates</SheetDescription>
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
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    notification.status === "unread" ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border",
                  )}
                  onClick={() => {
                    if (notification.status === "unread") {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        notification.tx_status === "confirmed"
                          ? "bg-green-500/20"
                          : notification.tx_status === "pending"
                            ? "bg-yellow-500/20"
                            : notification.tx_status === "failed"
                              ? "bg-red-500/20"
                              : "bg-muted",
                      )}
                    >
                      {getIcon(notification.type, notification.tx_status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-foreground">{notification.title}</span>
                        {notification.status === "unread" && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

                      {notification.card_design && notification.amount_usd && (
                        <div
                          className="my-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedCard(expandedCard === notification.id ? null : notification.id)
                          }}
                        >
                          {expandedCard === notification.id ? (
                            <div className="flex justify-center transform scale-90 origin-top">
                              <GiftCard3D
                                variant={notification.card_design}
                                value={notification.amount_usd}
                                code={notification.card_code}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                              <div className="w-16 h-10 rounded overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">${notification.amount_usd}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium">${notification.amount_usd} Gift Card</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {notification.card_code || "Click to preview"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {notification.card_password && (
                        <div className="my-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span className="text-xs text-amber-500 font-medium">Password Protected</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono">
                              {showPassword[notification.id] ? notification.card_password : "••••••••"}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                togglePassword(notification.id)
                              }}
                            >
                              {showPassword[notification.id] ? "Hide" : "Show"}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {notification.tx_status && (
                          <Badge className={getStatusColor(notification.tx_status)}>{notification.tx_status}</Badge>
                        )}
                        {notification.amount_usd && !notification.card_design && (
                          <span className="text-xs text-muted-foreground">${notification.amount_usd.toFixed(2)}</span>
                        )}
                        {notification.crypto_coin && (
                          <span className="text-xs text-muted-foreground">
                            {notification.crypto_amount} {notification.crypto_coin.toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>

                      {notification.tx_hash && (
                        <a
                          href={`https://bscscan.com/tx/${notification.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View transaction
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
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
