import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, logAudit } from "@/lib/auth"
import { generateGiftCardCode } from "@/lib/crypto"

// GET - List all gift cards with stats
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("gift_cards")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,buyer_email.ilike.%${search}%,recipient_email.ilike.%${search}%`)
    }

    const { data: giftCards, error } = await query

    if (error) throw error

    const creatorIds = [...new Set((giftCards || []).map((c) => c.created_by).filter(Boolean))]
    let creatorsMap: Record<string, { email: string; full_name: string | null }> = {}

    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, email, full_name").in("id", creatorIds)

      if (profiles) {
        creatorsMap = profiles.reduce(
          (acc, p) => {
            acc[p.id] = { email: p.email, full_name: p.full_name }
            return acc
          },
          {} as Record<string, { email: string; full_name: string | null }>,
        )
      }
    }

    const giftCardsWithCreator = (giftCards || []).map((card) => ({
      ...card,
      creator: card.created_by ? creatorsMap[card.created_by] : null,
    }))

    // Get stats
    const { data: allCards } = await supabase
      .from("gift_cards")
      .select("value_usd, status, platform_fee, total_paid, payment_amount, created_at")

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
      totalCards: allCards?.length || 0,
      totalValue: allCards?.reduce((sum, c) => sum + Number(c.value_usd || 0), 0) || 0,
      pendingCards: allCards?.filter((c) => c.status === "pending" || c.status === "payment_pending").length || 0,
      activeCards: allCards?.filter((c) => c.status === "active").length || 0,
      redeemedCards: allCards?.filter((c) => c.status === "redeemed").length || 0,
      expiredCards: allCards?.filter((c) => c.status === "expired").length || 0,
      cancelledCards: allCards?.filter((c) => c.status === "cancelled").length || 0,
      activeValue:
        allCards?.filter((c) => c.status === "active").reduce((sum, c) => sum + Number(c.value_usd || 0), 0) || 0,
      redeemedValue:
        allCards?.filter((c) => c.status === "redeemed").reduce((sum, c) => sum + Number(c.value_usd || 0), 0) || 0,
      // Fee tracking
      totalFees: allCards?.reduce((sum, c) => sum + Number(c.platform_fee || 0), 0) || 0,
      totalPaid: allCards?.reduce((sum, c) => sum + Number(c.total_paid || 0), 0) || 0,
      // Time-based stats
      cardsLast24h: allCards?.filter((c) => new Date(c.created_at) > last24h).length || 0,
      cardsLast7d: allCards?.filter((c) => new Date(c.created_at) > last7d).length || 0,
      valueLast24h:
        allCards
          ?.filter((c) => new Date(c.created_at) > last24h)
          .reduce((sum, c) => sum + Number(c.value_usd || 0), 0) || 0,
      valueLast7d:
        allCards
          ?.filter((c) => new Date(c.created_at) > last7d)
          .reduce((sum, c) => sum + Number(c.value_usd || 0), 0) || 0,
      // Outstanding liability (active cards that haven't been redeemed)
      outstandingLiability:
        allCards?.filter((c) => c.status === "active").reduce((sum, c) => sum + Number(c.value_usd || 0), 0) || 0,
    }

    return NextResponse.json({ giftCards: giftCardsWithCreator, stats })
  } catch (error) {
    console.error("Failed to fetch gift cards:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// POST - Manually create a gift card (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const { valueUsd, recipientName, recipientEmail, senderName, message, design, expiryDays } = body

    if (!valueUsd || valueUsd < 1) {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 })
    }

    const code = generateGiftCardCode()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (expiryDays || 365))

    const { data: giftCard, error } = await supabase
      .from("gift_cards")
      .insert({
        code,
        value_usd: valueUsd,
        status: "active",
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        sender_name: senderName || null,
        message: message || null,
        design_variant: design || "obsidian",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    await logAudit(admin.id, "gift_card_created_manual", "gift_card", giftCard.id, {
      valueUsd,
      code,
    })

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        valueUsd,
        expiresAt,
      },
    })
  } catch (error) {
    console.error("Failed to create gift card:", error)
    return NextResponse.json({ error: "Failed to create gift card" }, { status: 500 })
  }
}

// PATCH - Update gift card status
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const { id, status, expiresAt } = body

    if (!id) {
      return NextResponse.json({ error: "Gift card ID required" }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (expiresAt) updates.expires_at = expiresAt

    const { error } = await supabase.from("gift_cards").update(updates).eq("id", id)

    if (error) throw error

    await logAudit(admin.id, "gift_card_updated", "gift_card", id, { status, expiresAt })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update gift card:", error)
    return NextResponse.json({ error: "Failed to update gift card" }, { status: 500 })
  }
}
