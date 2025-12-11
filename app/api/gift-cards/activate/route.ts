import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getShift, isShiftComplete, isShiftFailed, getStatusMessage } from "@/lib/sideshift"
import { notifyCardActivated } from "@/lib/notifications"
import { notifyNewPurchase, notifyPurchaseFailed } from "@/lib/admin-notifications"
import { sendPurchaseEmail, sendGiftCardEmail, notifyAdminPurchase, notifyAdminError } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shiftId, cardPassword } = body

    if (!shiftId) {
      return NextResponse.json({ error: "Shift ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const shift = await getShift(shiftId)

    const { data: card, error } = await supabase
      .from("gift_cards")
      .select(
        "id, code, status, value_usd, total_paid, platform_fee, created_by, payment_amount, design, payment_crypto, recipient_email, recipient_name, sender_name, message, is_anonymous",
      )
      .eq("payment_shift_id", shiftId)
      .single()

    if (error || !card) {
      return NextResponse.json({ error: "Gift card not found for this payment" }, { status: 404 })
    }

    if (card.status === "active") {
      return NextResponse.json({
        success: true,
        status: "active",
        code: card.code,
        finalValue: card.value_usd,
        alreadyProcessed: true,
        message: "Gift card already activated",
      })
    }

    let creatorEmail: string | undefined
    if (card.created_by) {
      const { data: profile } = await supabase.from("profiles").select("email").eq("id", card.created_by).single()
      creatorEmail = profile?.email
    }

    if (isShiftComplete(shift.status)) {
      const settleAmount = shift.settleAmount ? Number.parseFloat(shift.settleAmount) : null

      // Activate the gift card immediately
      const { error: updateError } = await supabase
        .from("gift_cards")
        .update({
          status: "active",
          payment_tx_hash: shift.deposits?.[0]?.depositHash || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", card.id)

      if (updateError) {
        console.error("Failed to activate card:", updateError)
        return NextResponse.json({ error: "Failed to activate card" }, { status: 500 })
      }

      // Update transaction status
      await supabase
        .from("transactions")
        .update({
          status: "settled",
          settle_amount: settleAmount,
          tx_hash: shift.deposits?.[0]?.settleHash || null,
        })
        .eq("sideshift_id", shiftId)

      // Send notifications
      if (card.created_by) {
        await notifyCardActivated(
          card.created_by,
          card.value_usd,
          card.code,
          card.design || "obsidian",
          card.id,
          cardPassword || undefined,
        ).catch(console.error)
      }

      await notifyNewPurchase(
        card.value_usd,
        card.code,
        card.id,
        card.payment_crypto || shift.depositCoin || "crypto",
      ).catch(console.error)

      if (creatorEmail) {
        await sendPurchaseEmail(creatorEmail, {
          code: card.code,
          valueUsd: card.value_usd,
          totalPaid: settleAmount || card.value_usd,
          fee: card.platform_fee || 0,
          paymentMethod: "Crypto",
          depositCoin: shift.depositCoin,
          status: "completed",
        }).catch(console.error)
      }

      if (card.recipient_email) {
        await sendGiftCardEmail(card.recipient_email, {
          code: card.code,
          valueUsd: card.value_usd,
          senderName: card.is_anonymous ? undefined : card.sender_name || undefined,
          recipientName: card.recipient_name || undefined,
          message: card.message || undefined,
          design: card.design || undefined,
          hasPassword: !!cardPassword,
        }).catch(console.error)
      }

      await notifyAdminPurchase({
        userEmail: creatorEmail || "Unknown",
        cardCode: card.code,
        valueUsd: card.value_usd,
        fee: card.platform_fee || 0,
        paymentMethod: `${shift.depositCoin?.toUpperCase() || "Crypto"} (${shift.depositNetwork || "unknown"})`,
        status: "completed",
      }).catch(console.error)

      return NextResponse.json({
        success: true,
        status: "active",
        code: card.code,
        finalValue: card.value_usd,
        shiftStatus: shift.status,
        message: "Gift card activated successfully!",
      })
    } else if (isShiftFailed(shift.status)) {
      await supabase.from("gift_cards").update({ status: "cancelled" }).eq("id", card.id)
      await supabase.from("transactions").update({ status: shift.status }).eq("sideshift_id", shiftId)

      await notifyPurchaseFailed(card.value_usd, card.code, card.id, `Payment ${shift.status}`).catch(console.error)

      if (creatorEmail) {
        await sendPurchaseEmail(creatorEmail, {
          code: card.code,
          valueUsd: card.value_usd,
          totalPaid: 0,
          fee: card.platform_fee || 0,
          paymentMethod: "Crypto",
          depositCoin: shift.depositCoin,
          status: "failed",
        }).catch(console.error)
      }

      await notifyAdminPurchase({
        userEmail: creatorEmail || "Unknown",
        cardCode: card.code,
        valueUsd: card.value_usd,
        fee: 0,
        paymentMethod: `${shift.depositCoin?.toUpperCase() || "Crypto"}`,
        status: "failed",
      }).catch(console.error)

      return NextResponse.json({
        success: false,
        status: "cancelled",
        shiftStatus: shift.status,
        message: getStatusMessage(shift.status),
      })
    }

    return NextResponse.json({
      success: true,
      status: card.status,
      shiftStatus: shift.status,
      message: getStatusMessage(shift.status),
      deposits: shift.deposits,
    })
  } catch (error) {
    console.error("Failed to check gift card status:", error)
    notifyAdminError("Card Activation", error instanceof Error ? error.message : "Unknown error", {
      "Error Type": "Unexpected Exception",
    }).catch(console.error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check status" },
      { status: 500 },
    )
  }
}
