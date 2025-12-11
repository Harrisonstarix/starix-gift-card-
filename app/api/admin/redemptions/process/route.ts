import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, logAudit } from "@/lib/auth"
import { getShift, isShiftComplete, isShiftFailed, isShiftPending, getStatusMessage } from "@/lib/sideshift"

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()
    const { redemptionId, action } = await request.json()

    if (!redemptionId) {
      return NextResponse.json({ error: "Redemption ID required" }, { status: 400 })
    }

    const { data: redemption, error } = await supabase
      .from("redemption_requests")
      .select(
        `
        *,
        gift_cards (value_usd, code)
      `,
      )
      .eq("id", redemptionId)
      .single()

    if (error || !redemption) {
      return NextResponse.json({ error: "Redemption not found" }, { status: 404 })
    }

    // Check current SideShift status
    if (redemption.shift_id) {
      const shift = await getShift(redemption.shift_id)

      if (isShiftComplete(shift.status)) {
        await supabase
          .from("redemption_requests")
          .update({
            status: "completed",
            actual_amount: shift.deposits?.[0]?.depositAmount || redemption.estimated_amount,
            processed_at: new Date().toISOString(),
          })
          .eq("id", redemptionId)

        await supabase
          .from("transactions")
          .update({
            status: "settled",
            settle_tx_hash: shift.deposits?.[0]?.settleHash || null,
          })
          .eq("sideshift_id", redemption.shift_id)

        await logAudit(admin.id, "redemption_completed", "redemption_request", redemptionId, {
          settleTxHash: shift.deposits?.[0]?.settleHash,
        })

        return NextResponse.json({
          success: true,
          status: "completed",
          message: "Redemption completed successfully",
          settleTxHash: shift.deposits?.[0]?.settleHash,
        })
      }

      if (isShiftFailed(shift.status)) {
        await supabase
          .from("redemption_requests")
          .update({
            status: "failed",
            error_message: `SideShift: ${getStatusMessage(shift.status)}`,
          })
          .eq("id", redemptionId)

        return NextResponse.json({
          success: false,
          status: "failed",
          message: getStatusMessage(shift.status),
        })
      }

      if (isShiftPending(shift.status)) {
        return NextResponse.json({
          success: true,
          status: shift.status,
          message: getStatusMessage(shift.status),
          depositAddress: shift.depositAddress,
          depositAmount: redemption.deposit_amount,
          depositCoin: redemption.deposit_coin?.toUpperCase(),
        })
      }
    }

    if (action === "manual_process") {
      await supabase
        .from("redemption_requests")
        .update({ status: "processing", processed_at: new Date().toISOString() })
        .eq("id", redemptionId)

      await logAudit(admin.id, "redemption_manual_process", "redemption_request", redemptionId)

      return NextResponse.json({
        success: true,
        message: "Marked for processing",
        depositAddress: redemption.deposit_address,
        depositAmount: redemption.deposit_amount,
        depositCoin: redemption.deposit_coin?.toUpperCase(),
        depositNetwork: redemption.deposit_network,
      })
    }

    return NextResponse.json({
      success: true,
      status: redemption.status,
      depositAddress: redemption.deposit_address,
      depositAmount: redemption.deposit_amount,
      depositCoin: redemption.deposit_coin?.toUpperCase(),
    })
  } catch (error) {
    console.error("Failed to process redemption:", error)
    return NextResponse.json({ error: "Failed to process redemption" }, { status: 500 })
  }
}
