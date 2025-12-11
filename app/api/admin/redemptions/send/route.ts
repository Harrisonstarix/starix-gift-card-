// Admin endpoint to manually trigger treasury send for a redemption
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, logAudit } from "@/lib/auth"
import { sendFromTreasury, canAutoSend } from "@/lib/treasury"

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()
    const { redemptionId } = await request.json()

    if (!redemptionId) {
      return NextResponse.json({ error: "Redemption ID required" }, { status: 400 })
    }

    // Get redemption details
    const { data: redemption, error } = await supabase.from("redemptions").select("*").eq("id", redemptionId).single()

    if (error || !redemption) {
      return NextResponse.json({ error: "Redemption not found" }, { status: 404 })
    }

    if (redemption.status === "completed") {
      return NextResponse.json({ error: "Redemption already completed" }, { status: 400 })
    }

    if (!redemption.deposit_address) {
      return NextResponse.json({ error: "No deposit address found for this redemption" }, { status: 400 })
    }

    // Get treasury wallet config
    const { data: wallets } = await supabase
      .from("admin_wallets")
      .select("asset, network, address")
      .eq("is_primary", true)
      .limit(1)

    if (!wallets || wallets.length === 0) {
      return NextResponse.json({ error: "Treasury wallet not configured" }, { status: 500 })
    }

    const treasury = wallets[0]

    // Check if auto-send is possible for this network
    if (!canAutoSend(treasury.network)) {
      return NextResponse.json(
        {
          error: `Automatic sending not supported for ${treasury.network}. Please send manually.`,
          manualSendRequired: true,
          sendDetails: {
            from: treasury.address,
            to: redemption.deposit_address,
            amount: redemption.deposit_amount,
            token: treasury.asset.toUpperCase(),
            network: treasury.network,
          },
        },
        { status: 400 },
      )
    }

    // Attempt to send from treasury
    const sendResult = await sendFromTreasury(
      treasury.asset,
      treasury.network,
      redemption.deposit_address,
      redemption.deposit_amount.toString(),
    )

    if (!sendResult.success) {
      await logAudit(admin.id, "manual_send_failed", "redemption", redemptionId, {
        error: sendResult.error,
      })

      return NextResponse.json(
        {
          error: sendResult.error || "Failed to send from treasury",
          manualSendRequired: true,
          sendDetails: {
            from: treasury.address,
            to: redemption.deposit_address,
            amount: redemption.deposit_amount,
            token: treasury.asset.toUpperCase(),
            network: treasury.network,
          },
        },
        { status: 500 },
      )
    }

    // Update redemption with tx hash
    await supabase
      .from("redemptions")
      .update({
        treasury_tx_hash: sendResult.txHash,
        treasury_send_status: "sent",
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", redemptionId)

    // Update transaction record
    await supabase
      .from("transactions")
      .update({
        tx_hash: sendResult.txHash,
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("sideshift_id", redemption.shift_id)

    await logAudit(admin.id, "manual_send_success", "redemption", redemptionId, {
      txHash: sendResult.txHash,
      amount: redemption.deposit_amount,
      token: treasury.asset,
    })

    return NextResponse.json({
      success: true,
      txHash: sendResult.txHash,
      gasUsed: sendResult.gasUsed,
      networkFee: sendResult.networkFee,
      message: "Treasury send successful. Waiting for SideShift to process.",
    })
  } catch (error) {
    console.error("Manual send error:", error)
    return NextResponse.json({ error: "Failed to process manual send" }, { status: 500 })
  }
}
