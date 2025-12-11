import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ADMIN_EMAIL = "ighanghangodspower@gmail.com"

export async function GET(request: Request) {
  const serverSupabase = await createServerClient()

  const {
    data: { user },
  } = await serverSupabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get all users with their profiles using service role (bypasses RLS)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      throw profilesError
    }

    // Get balances for all users
    const { data: balances, error: balancesError } = await supabaseAdmin.from("user_balances").select("*")

    if (balancesError) {
      console.error("Error fetching balances:", balancesError)
      throw balancesError
    }

    // Get deposit counts per user
    const { data: deposits, error: depositsError } = await supabaseAdmin
      .from("deposits")
      .select("user_id, amount_usd, settled_amount, status")

    if (depositsError) {
      console.error("Error fetching deposits:", depositsError)
      throw depositsError
    }

    // Get gift card counts per user
    const { data: giftCards, error: giftCardsError } = await supabaseAdmin
      .from("gift_cards")
      .select("created_by, value_usd, status")

    if (giftCardsError) {
      console.error("Error fetching gift cards:", giftCardsError)
      throw giftCardsError
    }

    const { data: redemptions, error: redemptionsError } = await supabaseAdmin
      .from("redemptions")
      .select("gift_card_id, value_usd, status")

    if (redemptionsError) {
      console.error("Error fetching redemptions:", redemptionsError)
    }

    // Combine data
    const users = (profiles || []).map((profile: any) => {
      const userBalance = balances?.find((b: any) => b.user_id === profile.id)
      const userDeposits = deposits?.filter((d: any) => d.user_id === profile.id) || []
      const userCards = giftCards?.filter((c: any) => c.created_by === profile.id) || []

      const depositStats = {
        total: userDeposits.length,
        completed: userDeposits.filter((d: any) => d.status === "completed").length,
        pending: userDeposits.filter((d: any) => d.status === "pending" || d.status === "processing").length,
        failed: userDeposits.filter((d: any) => d.status === "failed" || d.status === "expired").length,
        totalAmount: userDeposits
          .filter((d: any) => d.status === "completed")
          .reduce((sum: number, d: any) => sum + (Number(d.settled_amount) || Number(d.amount_usd) || 0), 0),
      }

      const cardStats = {
        total: userCards.length,
        active: userCards.filter((c: any) => c.status === "active").length,
        redeemed: userCards.filter((c: any) => c.status === "redeemed").length,
        pending: userCards.filter((c: any) => c.status === "pending" || c.status === "payment_pending").length,
        totalValue: userCards.reduce((sum: number, c: any) => sum + (Number(c.value_usd) || 0), 0),
      }

      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        isAdmin: profile.is_admin,
        createdAt: profile.created_at,
        balance: Number(userBalance?.balance_usd) || 0,
        totalDeposited: Number(userBalance?.total_deposited) || 0,
        totalSpent: Number(userBalance?.total_spent) || 0,
        depositStats,
        cardStats,
      }
    })

    // Calculate overall stats
    const stats = {
      totalUsers: users.length,
      adminUsers: users.filter((u: any) => u.isAdmin).length,
      regularUsers: users.filter((u: any) => !u.isAdmin).length,
      usersWithBalance: users.filter((u: any) => u.balance > 0).length,
      totalBalanceHeld: users.reduce((sum: number, u: any) => sum + u.balance, 0),
      totalDeposited: users.reduce((sum: number, u: any) => sum + u.totalDeposited, 0),
      totalSpent: users.reduce((sum: number, u: any) => sum + u.totalSpent, 0),
      newUsersLast24h: users.filter((u: any) => {
        const created = new Date(u.createdAt)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return created > dayAgo
      }).length,
      newUsersLast7d: users.filter((u: any) => {
        const created = new Date(u.createdAt)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return created > weekAgo
      }).length,
    }

    return NextResponse.json({ users, stats })
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 })
  }
}
