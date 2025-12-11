import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

const ADMIN_EMAIL = "ighanghangodspower@gmail.com"

// GET - Comprehensive admin stats for dashboard
export async function GET() {
  try {
    const serverSupabase = await createServerClient()
    const {
      data: { user },
    } = await serverSupabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Fetch all data in parallel
    const [giftCardsRes, redemptionsRes, transactionsRes, usersRes, balancesRes, depositsRes] = await Promise.all([
      supabase.from("gift_cards").select("value_usd, status, platform_fee, total_paid, created_at"),
      supabase.from("redemptions").select("value_usd, status, deposit_amount, actual_amount, created_at"),
      supabase.from("transactions").select("type, status, deposit_amount, settle_amount, created_at"),
      supabase.from("profiles").select("id, created_at, is_admin"),
      supabase.from("user_balances").select("balance_usd, total_deposited, total_spent"),
      supabase.from("deposits").select("amount_usd, settled_amount, status, created_at"),
    ])

    const giftCards = giftCardsRes.data || []
    const redemptions = redemptionsRes.data || []
    const transactions = transactionsRes.data || []
    const users = usersRes.data || []
    const balances = balancesRes.data || []
    const deposits = depositsRes.data || []

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const depositStats = {
      total: deposits.length,
      pending: deposits.filter((d) => d.status === "pending" || d.status === "processing" || d.status === "waiting")
        .length,
      completed: deposits.filter((d) => d.status === "completed").length,
      failed: deposits.filter((d) => d.status === "failed" || d.status === "expired").length,
      cancelled: deposits.filter((d) => d.status === "cancelled").length,
      // Only count completed deposits for volume
      totalRequestedVolume: deposits.reduce((sum, d) => sum + Number(d.amount_usd || 0), 0),
      totalCompletedVolume: deposits
        .filter((d) => d.status === "completed")
        .reduce((sum, d) => sum + Number(d.settled_amount || d.amount_usd || 0), 0),
      pendingVolume: deposits
        .filter((d) => d.status === "pending" || d.status === "processing")
        .reduce((sum, d) => sum + Number(d.amount_usd || 0), 0),
      // Time-based completed volume only
      volume24h: deposits
        .filter((d) => new Date(d.created_at) > last24h && d.status === "completed")
        .reduce((sum, d) => sum + Number(d.settled_amount || d.amount_usd || 0), 0),
      volume7d: deposits
        .filter((d) => new Date(d.created_at) > last7d && d.status === "completed")
        .reduce((sum, d) => sum + Number(d.settled_amount || d.amount_usd || 0), 0),
      volume30d: deposits
        .filter((d) => new Date(d.created_at) > last30d && d.status === "completed")
        .reduce((sum, d) => sum + Number(d.settled_amount || d.amount_usd || 0), 0),
    }

    // Gift Card Stats
    const cardStats = {
      total: giftCards.length,
      pending: giftCards.filter((c) => c.status === "pending" || c.status === "payment_pending").length,
      active: giftCards.filter((c) => c.status === "active").length,
      redeemed: giftCards.filter((c) => c.status === "redeemed").length,
      expired: giftCards.filter((c) => c.status === "expired").length,
      cancelled: giftCards.filter((c) => c.status === "cancelled").length,
      totalValue: giftCards
        .filter((c) => c.status === "active" || c.status === "redeemed")
        .reduce((sum, c) => sum + Number(c.value_usd || 0), 0),
      activeValue: giftCards.filter((c) => c.status === "active").reduce((sum, c) => sum + Number(c.value_usd || 0), 0),
      redeemedValue: giftCards
        .filter((c) => c.status === "redeemed")
        .reduce((sum, c) => sum + Number(c.value_usd || 0), 0),
    }

    const revenueStats = {
      totalFeesCollected: giftCards
        .filter((c) => c.status === "active" || c.status === "redeemed")
        .reduce((sum, c) => sum + Number(c.platform_fee || 0), 0),
      totalPaymentsReceived: giftCards
        .filter((c) => c.status === "active" || c.status === "redeemed")
        .reduce((sum, c) => sum + Number(c.total_paid || 0), 0),
      feesLast24h: giftCards
        .filter((c) => new Date(c.created_at) > last24h && (c.status === "active" || c.status === "redeemed"))
        .reduce((sum, c) => sum + Number(c.platform_fee || 0), 0),
      feesLast7d: giftCards
        .filter((c) => new Date(c.created_at) > last7d && (c.status === "active" || c.status === "redeemed"))
        .reduce((sum, c) => sum + Number(c.platform_fee || 0), 0),
      feesLast30d: giftCards
        .filter((c) => new Date(c.created_at) > last30d && (c.status === "active" || c.status === "redeemed"))
        .reduce((sum, c) => sum + Number(c.platform_fee || 0), 0),
    }

    const redemptionStats = {
      total: redemptions.length,
      pending: redemptions.filter((r) => r.status === "pending").length,
      processing: redemptions.filter((r) => r.status === "processing" || r.status === "waiting").length,
      completed: redemptions.filter((r) => r.status === "completed" || r.status === "settled").length,
      failed: redemptions.filter((r) => r.status === "failed" || r.status === "send_failed").length,
      totalValueRedeemed: redemptions
        .filter((r) => r.status === "completed" || r.status === "settled")
        .reduce((sum, r) => sum + Number(r.value_usd || 0), 0),
      totalSent: redemptions
        .filter((r) => r.status === "completed" || r.status === "settled")
        .reduce((sum, r) => sum + Number(r.deposit_amount || 0), 0),
    }

    // Transaction Stats
    const txStats = {
      total: transactions.length,
      purchases: transactions.filter((t) => t.type === "purchase").length,
      redemptions: transactions.filter((t) => t.type === "redemption").length,
      settled: transactions.filter((t) => t.status === "settled" || t.status === "completed").length,
      pending: transactions.filter((t) => t.status === "pending" || t.status === "waiting" || t.status === "processing")
        .length,
      failed: transactions.filter((t) => t.status === "failed" || t.status === "expired").length,
    }

    const userStats = {
      total: users.length,
      adminUsers: users.filter((u) => u.is_admin).length,
      regularUsers: users.filter((u) => !u.is_admin).length,
      last24h: users.filter((u) => new Date(u.created_at) > last24h).length,
      last7d: users.filter((u) => new Date(u.created_at) > last7d).length,
      totalBalances: balances.reduce((sum, b) => sum + Number(b.balance_usd || 0), 0),
      totalDeposited: balances.reduce((sum, b) => sum + Number(b.total_deposited || 0), 0),
      totalSpent: balances.reduce((sum, b) => sum + Number(b.total_spent || 0), 0),
    }

    // Platform Health
    const platformHealth = {
      outstandingLiability: cardStats.activeValue,
      bufferFromFees: revenueStats.totalFeesCollected,
      netPosition: revenueStats.totalFeesCollected - (redemptionStats.totalSent - redemptionStats.totalValueRedeemed),
    }

    return NextResponse.json({
      depositStats,
      cardStats,
      revenueStats,
      redemptionStats,
      txStats,
      userStats,
      platformHealth,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to fetch admin stats:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
