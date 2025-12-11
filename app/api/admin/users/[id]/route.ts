import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ADMIN_EMAIL = "ighanghangodspower@gmail.com"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Use regular client for auth check
  const authClient = await createServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  try {
    // Get user profile - handle case where user doesn't exist
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle() // Use maybeSingle instead of single to avoid error on no rows

    if (profileError) throw profileError

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user balance - use maybeSingle
    const { data: balance } = await supabase.from("user_balances").select("*").eq("user_id", id).maybeSingle()

    // Get user deposits
    const { data: deposits } = await supabase
      .from("deposits")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })

    // Get user gift cards
    const { data: giftCards } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("created_by", id)
      .order("created_at", { ascending: false })

    // Get balance transactions
    const { data: balanceTransactions } = await supabase
      .from("balance_transactions")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(50)

    // Get notifications
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20)

    // Calculate stats
    const depositStats = {
      total: deposits?.length || 0,
      completed: deposits?.filter((d) => d.status === "completed" || d.status === "confirmed").length || 0,
      pending: deposits?.filter((d) => d.status === "pending").length || 0,
      failed: deposits?.filter((d) => d.status === "failed" || d.status === "expired").length || 0,
      totalVolume:
        deposits
          ?.filter((d) => d.status === "completed" || d.status === "confirmed")
          .reduce((sum, d) => sum + Number(d.settled_amount || d.amount_usd || 0), 0) || 0,
    }

    const cardStats = {
      total: giftCards?.length || 0,
      active: giftCards?.filter((c) => c.status === "active").length || 0,
      redeemed: giftCards?.filter((c) => c.status === "redeemed").length || 0,
      pending: giftCards?.filter((c) => c.status === "pending" || c.status === "payment_pending").length || 0,
      totalValue: giftCards?.reduce((sum, c) => sum + Number(c.value_usd || 0), 0) || 0,
      totalFees: giftCards?.reduce((sum, c) => sum + Number(c.platform_fee || 0), 0) || 0,
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        isAdmin: profile.is_admin,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
      balance: {
        current: balance?.balance_usd || 0,
        totalDeposited: balance?.total_deposited || 0,
        totalSpent: balance?.total_spent || 0,
      },
      depositStats,
      cardStats,
      deposits: deposits || [],
      giftCards: giftCards || [],
      balanceTransactions: balanceTransactions || [],
      notifications: notifications || [],
    })
  } catch (error: any) {
    console.error("Error fetching user details:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch user" }, { status: 500 })
  }
}
