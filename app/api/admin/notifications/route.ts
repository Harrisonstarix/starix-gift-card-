import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export interface AdminNotification {
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

// GET - Fetch admin notifications
export async function GET() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data: notifications, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      // Table might not exist yet, return empty
      console.error("Admin notifications fetch error:", error)
      return NextResponse.json({ notifications: [], unreadCount: 0 })
    }

    const unreadCount = notifications?.filter((n) => n.status === "unread").length || 0

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount,
    })
  } catch (error) {
    console.error("Failed to fetch admin notifications:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const { notificationId, markAllRead, dismiss } = body

    if (markAllRead) {
      await supabase.from("admin_notifications").update({ status: "read" }).eq("status", "unread")
    } else if (dismiss && notificationId) {
      await supabase.from("admin_notifications").update({ status: "dismissed" }).eq("id", notificationId)
    } else if (notificationId) {
      await supabase.from("admin_notifications").update({ status: "read" }).eq("id", notificationId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update notification:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

// POST - Create admin notification (internal use)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const { type, title, message, severity, entityType, entityId, metadata } = body

    const { error } = await supabase.from("admin_notifications").insert({
      type,
      title,
      message,
      severity: severity || "info",
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || {},
      status: "unread",
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to create notification:", error)
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}
