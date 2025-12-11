import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRedemptionQuote, createRedemptionShift } from "@/lib/sideshift"
import { getCurrentUser, logAudit } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, settleCoin, settleNetwork, settleAddress, settleMemo } = body

    const userIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "127.0.0.1"

    // Validate inputs
    if (!code || !settleCoin || !settleNetwork || !settleAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const user = await getCurrentUser()

    // Find and validate the gift card
    const { data: card, error: cardError } = await supabase
      .from("gift_cards")
      .select("id, code, value_usd, status, expires_at")
      .eq("code", code.toUpperCase().trim())
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 })
    }

    if (card.status !== "active") {
      return NextResponse.json({ error: `Gift card is ${card.status}, cannot redeem` }, { status: 400 })
    }

    if (new Date(card.expires_at) < new Date()) {
      return NextResponse.json({ error: "Gift card has expired" }, { status: 400 })
    }

    // Get redemption quote from SideShift
    const quote = await getRedemptionQuote(settleCoin, settleNetwork, card.value_usd, userIp)

    // Create the redemption shift
    const shift = await createRedemptionShift(quote.id, settleAddress, settleMemo, `redeem-${card.id}`, userIp)

    // Create redemption request record
    await supabase.from("redemption_requests").insert({
      gift_card_id: card.id,
      user_id: user?.id || null,
      settle_coin: settleCoin,
      settle_network: settleNetwork,
      settle_address: settleAddress,
      settle_memo: settleMemo || null,
      estimated_amount: Number.parseFloat(quote.settleAmount),
      quote_id: quote.id,
      shift_id: shift.id,
      deposit_address: shift.depositAddress,
      deposit_amount: Number.parseFloat(quote.depositAmount),
      deposit_coin: quote.depositCoin,
      deposit_network: quote.depositNetwork,
      status: "quoted",
    })

    // Update gift card status
    await supabase
      .from("gift_cards")
      .update({
        status: "redeemed",
        redeemed_by_id: user?.id || null,
        redeemed_coin: settleCoin.toUpperCase(),
        redeemed_network: settleNetwork,
        redeemed_address: settleAddress,
        redeemed_memo: settleMemo || null,
        redeemed_amount: Number.parseFloat(quote.settleAmount),
        redeemed_shift_id: shift.id,
        redeemed_at: new Date().toISOString(),
      })
      .eq("id", card.id)

    // Create transaction record
    await supabase.from("transactions").insert({
      gift_card_id: card.id,
      type: "redemption",
      sideshift_id: shift.id,
      sideshift_type: "fixed",
      quote_id: quote.id,
      deposit_coin: quote.depositCoin,
      deposit_network: quote.depositNetwork,
      deposit_address: shift.depositAddress,
      deposit_amount: Number.parseFloat(quote.depositAmount),
      settle_coin: settleCoin,
      settle_network: settleNetwork,
      settle_address: settleAddress,
      settle_memo: settleMemo || null,
      settle_amount: Number.parseFloat(quote.settleAmount),
      value_usd: card.value_usd,
      status: "waiting",
      expires_at: shift.expiresAt,
    })

    await logAudit(user?.id || null, "gift_card_redeemed", "gift_card", card.id, {
      settleCoin,
      settleNetwork,
      settleAmount: quote.settleAmount,
    })

    return NextResponse.json({
      success: true,
      redemption: {
        estimatedAmount: quote.settleAmount,
        settleCoin: settleCoin.toUpperCase(),
        settleNetwork,
        settleAddress,
        shiftId: shift.id,
        adminAction: {
          depositAddress: shift.depositAddress,
          depositAmount: quote.depositAmount,
          depositCoin: quote.depositCoin.toUpperCase(),
          depositNetwork: quote.depositNetwork,
          expiresAt: shift.expiresAt,
        },
        message: `You will receive approximately ${quote.settleAmount} ${settleCoin.toUpperCase()}. The exact amount may vary slightly due to network fees.`,
      },
    })
  } catch (error) {
    console.error("Failed to redeem gift card:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to redeem gift card" },
      { status: 500 },
    )
  }
}
