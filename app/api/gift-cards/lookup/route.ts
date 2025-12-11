import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    let card = null

    // First try the 'code' column
    const { data: cardByCode, error: codeError } = await supabase
      .from("gift_cards")
      .select(
        `
        id,
        value_usd,
        design,
        recipient_name,
        sender_name,
        message,
        status,
        expires_at,
        created_at,
        redeemed_at,
        password_hash,
        is_anonymous,
        platform_fee,
        total_paid
      `,
      )
      .eq("code", code.toUpperCase().trim())
      .maybeSingle()

    if (codeError) {
      console.error("Code lookup error:", codeError)
    }

    if (cardByCode) {
      card = cardByCode
    } else {
      // Try the 'secret_code' column as fallback
      const { data: cardBySecret, error: secretError } = await supabase
        .from("gift_cards")
        .select(
          `
          id,
          value_usd,
          design,
          recipient_name,
          sender_name,
          message,
          status,
          expires_at,
          created_at,
          redeemed_at,
          password_hash,
          is_anonymous,
          platform_fee,
          total_paid
        `,
        )
        .eq("secret_code", code.toUpperCase().trim())
        .maybeSingle()

      if (secretError) {
        console.error("Secret code lookup error:", secretError)
      }

      card = cardBySecret
    }

    if (!card) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 })
    }

    // Check if expired but not yet marked
    const isExpired = card.expires_at ? new Date(card.expires_at) < new Date() : false
    const effectiveStatus = card.status === "active" && isExpired ? "expired" : card.status

    const displaySenderName = card.is_anonymous ? "Anonymous" : card.sender_name

    return NextResponse.json({
      id: card.id,
      valueUsd: card.value_usd,
      design: card.design,
      recipientName: card.recipient_name,
      senderName: displaySenderName,
      message: card.message,
      status: effectiveStatus,
      expiresAt: card.expires_at,
      createdAt: card.created_at,
      redeemedAt: card.redeemed_at,
      isPasswordProtected: !!card.password_hash,
      platformFee: card.platform_fee,
      totalPaid: card.total_paid,
      // Flags to help UI
      canRedeem: effectiveStatus === "active",
      isExpired: effectiveStatus === "expired",
      isRedeemed: effectiveStatus === "redeemed",
      isPending: effectiveStatus === "pending",
      isCancelled: effectiveStatus === "cancelled",
    })
  } catch (error) {
    console.error("Failed to lookup gift card:", error)
    return NextResponse.json({ error: "Failed to lookup gift card" }, { status: 500 })
  }
}
