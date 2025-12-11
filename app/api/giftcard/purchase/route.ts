import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentQuote, createPaymentShift } from "@/lib/sideshift"
import { generateGiftCardCode } from "@/lib/crypto"
import { getCurrentUser, logAudit } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      valueUsd,
      design,
      recipientName,
      recipientEmail,
      senderName,
      message,
      buyerEmail,
      paymentCoin,
      paymentNetwork,
      refundAddress,
    } = body

    // Get user IP for SideShift
    const userIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "127.0.0.1"

    // Validate required fields
    if (!valueUsd || valueUsd < 10 || valueUsd > 10000) {
      return NextResponse.json({ error: "Invalid gift card value. Must be between $10 and $10,000" }, { status: 400 })
    }

    if (!paymentCoin || !paymentNetwork) {
      return NextResponse.json({ error: "Payment cryptocurrency and network are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const user = await getCurrentUser()

    // Generate unique code
    const code = generateGiftCardCode()

    // Get settings for expiry days
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "gift_card_expiry_days")
      .single()

    const expiryDays = settings?.value ? Number.parseInt(settings.value) : 365
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    // Get SideShift quote
    const quote = await getPaymentQuote(paymentCoin, paymentNetwork, valueUsd, userIp)

    // Create SideShift shift
    const shift = await createPaymentShift(quote.id, refundAddress, `purchase-${code}`, userIp)

    // Create pending gift card in database
    const { data: giftCard, error: insertError } = await supabase
      .from("gift_cards")
      .insert({
        code,
        value_usd: valueUsd,
        status: "pending",
        buyer_id: user?.id || null,
        buyer_email: buyerEmail || user?.email || null,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        sender_name: senderName || null,
        message: message || null,
        design_variant: design || "obsidian",
        purchase_coin: paymentCoin.toUpperCase(),
        purchase_network: paymentNetwork,
        purchase_amount: Number.parseFloat(quote.depositAmount),
        purchase_shift_id: shift.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Create transaction record
    await supabase.from("transactions").insert({
      gift_card_id: giftCard.id,
      type: "purchase",
      sideshift_id: shift.id,
      sideshift_type: "fixed",
      quote_id: quote.id,
      deposit_coin: paymentCoin.toLowerCase(),
      deposit_network: paymentNetwork,
      deposit_address: shift.depositAddress,
      deposit_memo: shift.depositMemo || null,
      deposit_amount: Number.parseFloat(quote.depositAmount),
      settle_coin: quote.settleCoin,
      settle_network: quote.settleNetwork,
      settle_address: shift.settleAddress,
      settle_amount: Number.parseFloat(quote.settleAmount),
      value_usd: valueUsd,
      status: "waiting",
      expires_at: shift.expiresAt,
    })

    await logAudit(user?.id || null, "gift_card_purchase_initiated", "gift_card", giftCard.id, {
      valueUsd,
      paymentCoin,
      paymentNetwork,
    })

    return NextResponse.json({
      success: true,
      giftCardId: giftCard.id,
      code,
      payment: {
        depositAddress: shift.depositAddress,
        depositMemo: shift.depositMemo,
        depositAmount: quote.depositAmount,
        depositCoin: paymentCoin.toUpperCase(),
        depositNetwork: paymentNetwork,
        expiresAt: shift.expiresAt,
        shiftId: shift.id,
        quoteId: quote.id,
        rate: quote.rate,
      },
    })
  } catch (error) {
    console.error("Failed to create gift card purchase:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create purchase" },
      { status: 500 },
    )
  }
}
