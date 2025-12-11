import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Get audit logs with profile info for user email
    const { data: logs, error } = await supabase
      .from("audit_log")
      .select(
        `
        id, action, entity_type, entity_id, 
        details, ip_address, created_at, user_id
      `,
      )
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) {
      console.error("Fetch audit logs error:", error)
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    // Get user emails from profiles
    const userIds = [...new Set(logs?.filter((l) => l.user_id).map((l) => l.user_id))]
    let profilesMap: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds)

      if (profiles) {
        profilesMap = profiles.reduce(
          (acc, p) => {
            acc[p.id] = p.email
            return acc
          },
          {} as Record<string, string>,
        )
      }
    }

    // Add user_email to logs
    const logsWithEmail = logs?.map((log) => ({
      ...log,
      user_email: log.user_id ? profilesMap[log.user_id] || null : null,
    }))

    return NextResponse.json({ logs: logsWithEmail })
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
