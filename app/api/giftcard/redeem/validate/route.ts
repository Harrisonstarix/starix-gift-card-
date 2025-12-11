import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/giftcard/redeem/validate
 * Validate a gift card code before redemption
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Gift card code is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find the gift card
    const { data: card, error } = await supabase
      .from("gift_cards")
      .select(
        `
        id, code, value_usd, status, design_variant,
        recipient_name, sender_name, message,
        expires_at, created_at
      `,
      )
      .eq("code", code.toUpperCase().trim())
      .single()

    if (error || !card) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 })
    }

    // Check status
    if (card.status === "redeemed") {
      return NextResponse.json({ error: "This gift card has already been redeemed" }, { status: 400 })
    }

    if (card.status === "pending") {
      return NextResponse.json({ error: "This gift card is still awaiting payment confirmation" }, { status: 400 })
    }

    if (card.status === "cancelled" || card.status === "refunded") {
      return NextResponse.json({ error: "This gift card is no longer valid" }, { status: 400 })
    }

    if (card.status !== "active") {
      return NextResponse.json({ error: "This gift card is not available for redemption" }, { status: 400 })
    }

    // Check expiry
    if (new Date(card.expires_at) < new Date()) {
      await supabase.from("gift_cards").update({ status: "expired" }).eq("id", card.id)
      return NextResponse.json({ error: "This gift card has expired" }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      giftCard: {
        id: card.id,
        valueUsd: card.value_usd,
        design: card.design_variant,
        recipientName: card.recipient_name,
        senderName: card.sender_name,
        message: card.message,
        expiresAt: card.expires_at,
        createdAt: card.created_at,
      },
    })
  } catch (error) {
    console.error("Failed to validate gift card:", error)
    return NextResponse.json({ error: "Failed to validate gift card" }, { status: 500 })
  }
}
