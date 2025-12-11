import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getShift, isShiftComplete, isShiftFailed, getStatusMessage } from "@/lib/sideshift"
import { logAudit } from "@/lib/auth"

/**
 * GET /api/giftcard/status/[shiftId]
 * Check payment status and activate gift card if payment complete
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ shiftId: string }> }) {
  try {
    const { shiftId } = await params
    const supabase = await createClient()

    // Get shift status from SideShift
    const shift = await getShift(shiftId)

    // Find associated gift card
    const { data: cards, error } = await supabase
      .from("gift_cards")
      .select("id, code, status, value_usd, buyer_email, recipient_email")
      .eq("payment_shift_id", shiftId)
      .limit(1)

    if (error || !cards || cards.length === 0) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 })
    }

    const card = cards[0]

    // Update transaction status
    await supabase
      .from("transactions")
      .update({
        status: shift.status,
        tx_hash: shift.deposits?.[0]?.depositHash || null,
        updated_at: new Date().toISOString(),
      })
      .eq("sideshift_id", shiftId)

    // If payment is complete, activate the gift card
    if (isShiftComplete(shift.status) && card.status === "pending") {
      await supabase
        .from("gift_cards")
        .update({
          status: "active",
          payment_tx_hash: shift.deposits?.[0]?.depositHash || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", card.id)

      await logAudit(null, "gift_card_activated", "gift_card", card.id, {
        shiftId,
        txHash: shift.deposits?.[0]?.depositHash,
      })

      return NextResponse.json({
        status: "active",
        message: "Payment confirmed! Gift card is now active.",
        code: card.code,
        valueUsd: card.value_usd,
        txHash: shift.deposits?.[0]?.depositHash,
      })
    }

    // If payment failed/expired
    if (isShiftFailed(shift.status) && card.status === "pending") {
      const newStatus = shift.status === "refunded" ? "refunded" : "cancelled"

      await supabase
        .from("gift_cards")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", card.id)

      await logAudit(null, "gift_card_payment_failed", "gift_card", card.id, {
        shiftId,
        reason: shift.status,
      })

      return NextResponse.json({
        status: newStatus,
        message: `Payment ${shift.status}. Gift card not activated.`,
      })
    }

    // Still pending
    return NextResponse.json({
      status: shift.status,
      message: getStatusMessage(shift.status),
      depositAddress: shift.depositAddress,
      depositMemo: shift.depositMemo,
      expectedAmount: shift.depositAmount,
      expiresAt: shift.expiresAt,
    })
  } catch (error) {
    console.error("Failed to check status:", error)
    return NextResponse.json({ error: "Failed to check payment status" }, { status: 500 })
  }
}
