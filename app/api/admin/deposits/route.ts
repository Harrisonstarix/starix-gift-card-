// Admin endpoint to view all deposits with comprehensive stats
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const supabase = await createClient()

    const { data: deposits, error } = await supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) {
      console.error("Failed to fetch deposits:", error)
      throw error
    }

    const userIds = [...new Set((deposits || []).map((d) => d.user_id).filter(Boolean))]

    let profilesMap: Record<string, { email: string; full_name: string }> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, email, full_name").in("id", userIds)

      if (profiles) {
        profilesMap = profiles.reduce(
          (acc, p) => {
            acc[p.id] = { email: p.email, full_name: p.full_name }
            return acc
          },
          {} as Record<string, { email: string; full_name: string }>,
        )
      }
    }

    // Attach profile info to deposits
    const depositsWithProfiles = (deposits || []).map((d) => ({
      ...d,
      user_email: profilesMap[d.user_id]?.email || "Unknown",
      user_name: profilesMap[d.user_id]?.full_name || "Unknown",
    }))

    // Get comprehensive stats
    const { data: allDeposits } = await supabase
      .from("deposits")
      .select("status, amount_usd, settled_amount, created_at")

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const stats = {
      total: allDeposits?.length || 0,
      pending: allDeposits?.filter((d) => d.status === "pending" || d.status === "processing").length || 0,
      completed: allDeposits?.filter((d) => d.status === "completed" || d.status === "confirmed").length || 0,
      failed: allDeposits?.filter((d) => d.status === "failed" || d.status === "expired").length || 0,
      totalRequested: allDeposits?.reduce((sum, d) => sum + Number(d.amount_usd || 0), 0) || 0,
      totalReceived:
        allDeposits
          ?.filter((d) => d.status === "completed" || d.status === "confirmed")
          .reduce((sum, d) => sum + Number(d.settled_amount || d.amount_usd || 0), 0) || 0,
      // Time-based stats
      last24h: allDeposits?.filter((d) => new Date(d.created_at) > last24h).length || 0,
      last7d: allDeposits?.filter((d) => new Date(d.created_at) > last7d).length || 0,
      last30d: allDeposits?.filter((d) => new Date(d.created_at) > last30d).length || 0,
      // Volume stats - only count completed deposits
      volume24h:
        allDeposits
          ?.filter((d) => new Date(d.created_at) > last24h && (d.status === "completed" || d.status === "confirmed"))
          .reduce((sum, d) => sum + Number(d.settled_amount || d.amount_usd || 0), 0) || 0,
      volume7d:
        allDeposits
          ?.filter((d) => new Date(d.created_at) > last7d && (d.status === "completed" || d.status === "confirmed"))
          .reduce((sum, d) => sum + Number(d.settled_amount || d.amount_usd || 0), 0) || 0,
      volume30d:
        allDeposits
          ?.filter((d) => new Date(d.created_at) > last30d && (d.status === "completed" || d.status === "confirmed"))
          .reduce((sum, d) => sum + Number(d.settled_amount || d.amount_usd || 0), 0) || 0,
    }

    return NextResponse.json({ deposits: depositsWithProfiles, stats })
  } catch (error) {
    console.error("Failed to fetch deposits:", error)
    return NextResponse.json({ error: "Failed to fetch deposits" }, { status: 500 })
  }
}
