import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Failed to fetch notifications:", error)
      return NextResponse.json({ notifications: [] })
    }

    const transformedNotifications =
      notifications?.map((n) => ({
        ...n,
        card_password: n.metadata?.card_password || null,
      })) || []

    // Count unread
    const unreadCount = notifications?.filter((n) => n.status === "unread").length || 0

    return NextResponse.json({
      notifications: transformedNotifications,
      unreadCount,
    })
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      // Mark all as read
      await supabase
        .from("notifications")
        .update({ status: "read", read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("status", "unread")
    } else if (notificationId) {
      // Mark single as read
      await supabase
        .from("notifications")
        .update({ status: "read", read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update notifications:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
