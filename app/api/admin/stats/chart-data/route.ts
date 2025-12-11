import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

// GET - Comprehensive chart data for admin dashboard
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"
    const type = searchParams.get("type") || "all" // all, deposits, purchases, redemptions, fees, users

    const now = new Date()
    let startDate: Date
    let groupBy: "hour" | "day" | "week" | "month" = "day"

    switch (period) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        groupBy = "hour"
        break
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        groupBy = "day"
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        groupBy = "day"
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        groupBy = "week"
        break
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        groupBy = "month"
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Fetch all data in parallel
    const [depositsRes, giftCardsRes, redemptionsRes, usersRes] = await Promise.all([
      supabase
        .from("deposits")
        .select("amount_usd, settled_amount, status, created_at")
        .gte("created_at", startDate.toISOString()),
      supabase
        .from("gift_cards")
        .select("value_usd, platform_fee, status, created_at")
        .gte("created_at", startDate.toISOString()),
      supabase.from("redemptions").select("value_usd, status, created_at").gte("created_at", startDate.toISOString()),
      supabase.from("profiles").select("created_at").gte("created_at", startDate.toISOString()),
    ])

    const deposits = depositsRes.data || []
    const giftCards = giftCardsRes.data || []
    const redemptions = redemptionsRes.data || []
    const users = usersRes.data || []

    // Generate time slots based on groupBy
    const timeSlots: Record<
      string,
      {
        label: string
        timestamp: string
        deposits: number
        depositVolume: number
        purchases: number
        purchaseVolume: number
        redemptions: number
        redemptionVolume: number
        fees: number
        users: number
      }
    > = {}

    const getSlotKey = (date: Date): string => {
      switch (groupBy) {
        case "hour":
          return date.toISOString().slice(0, 13) + ":00"
        case "day":
          return date.toISOString().slice(0, 10)
        case "week":
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          return weekStart.toISOString().slice(0, 10)
        case "month":
          return date.toISOString().slice(0, 7)
        default:
          return date.toISOString().slice(0, 10)
      }
    }

    const getSlotLabel = (key: string): string => {
      switch (groupBy) {
        case "hour":
          return new Date(key).toLocaleTimeString("en-US", { hour: "numeric", hour12: true })
        case "day":
          return new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        case "week":
          return `Week of ${new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        case "month":
          return new Date(key + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })
        default:
          return key
      }
    }

    // Initialize time slots
    const currentDate = new Date(startDate)
    while (currentDate <= now) {
      const key = getSlotKey(currentDate)
      if (!timeSlots[key]) {
        timeSlots[key] = {
          label: getSlotLabel(key),
          timestamp: key,
          deposits: 0,
          depositVolume: 0,
          purchases: 0,
          purchaseVolume: 0,
          redemptions: 0,
          redemptionVolume: 0,
          fees: 0,
          users: 0,
        }
      }
      // Increment based on groupBy
      switch (groupBy) {
        case "hour":
          currentDate.setHours(currentDate.getHours() + 1)
          break
        case "day":
          currentDate.setDate(currentDate.getDate() + 1)
          break
        case "week":
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case "month":
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
      }
    }

    // Populate deposits
    deposits.forEach((d) => {
      const key = getSlotKey(new Date(d.created_at))
      if (timeSlots[key]) {
        timeSlots[key].deposits += 1
        if (d.status === "completed") {
          timeSlots[key].depositVolume += Number(d.settled_amount || d.amount_usd || 0)
        }
      }
    })

    // Populate gift cards
    giftCards.forEach((c) => {
      const key = getSlotKey(new Date(c.created_at))
      if (timeSlots[key]) {
        timeSlots[key].purchases += 1
        timeSlots[key].purchaseVolume += Number(c.value_usd || 0)
        timeSlots[key].fees += Number(c.platform_fee || 0)
      }
    })

    // Populate redemptions
    redemptions.forEach((r) => {
      const key = getSlotKey(new Date(r.created_at))
      if (timeSlots[key]) {
        timeSlots[key].redemptions += 1
        if (r.status === "completed" || r.status === "settled") {
          timeSlots[key].redemptionVolume += Number(r.value_usd || 0)
        }
      }
    })

    // Populate users
    users.forEach((u) => {
      const key = getSlotKey(new Date(u.created_at))
      if (timeSlots[key]) {
        timeSlots[key].users += 1
      }
    })

    // Convert to array and sort
    const chartData = Object.values(timeSlots).sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    // Calculate totals
    const totals = {
      deposits: deposits.length,
      depositVolume: deposits
        .filter((d) => d.status === "completed")
        .reduce((sum, d) => sum + Number(d.settled_amount || d.amount_usd || 0), 0),
      purchases: giftCards.length,
      purchaseVolume: giftCards.reduce((sum, c) => sum + Number(c.value_usd || 0), 0),
      redemptions: redemptions.length,
      redemptionVolume: redemptions
        .filter((r) => r.status === "completed" || r.status === "settled")
        .reduce((sum, r) => sum + Number(r.value_usd || 0), 0),
      fees: giftCards.reduce((sum, c) => sum + Number(c.platform_fee || 0), 0),
      users: users.length,
    }

    // Status breakdowns
    const statusBreakdown = {
      deposits: {
        pending: deposits.filter((d) => d.status === "pending").length,
        completed: deposits.filter((d) => d.status === "completed").length,
        failed: deposits.filter((d) => d.status === "failed" || d.status === "expired").length,
      },
      giftCards: {
        pending: giftCards.filter((c) => c.status === "pending").length,
        active: giftCards.filter((c) => c.status === "active").length,
        redeemed: giftCards.filter((c) => c.status === "redeemed").length,
        expired: giftCards.filter((c) => c.status === "expired").length,
      },
      redemptions: {
        pending: redemptions.filter((r) => r.status === "pending").length,
        processing: redemptions.filter((r) => r.status === "processing" || r.status === "waiting").length,
        completed: redemptions.filter((r) => r.status === "completed" || r.status === "settled").length,
        failed: redemptions.filter((r) => r.status === "failed").length,
      },
    }

    return NextResponse.json({
      chartData,
      totals,
      statusBreakdown,
      period,
      groupBy,
    })
  } catch (error) {
    console.error("Failed to fetch chart data:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
