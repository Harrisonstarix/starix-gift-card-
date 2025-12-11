import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, logAudit } from "@/lib/auth"
import { getShift, isShiftComplete, isShiftFailed } from "@/lib/sideshift"
import { sendFromTreasury, canAutoSend, getTreasuryBalance } from "@/lib/treasury"

// GET - List all redemptions from the redemptions table
export async function GET() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data: redemptions, error } = await supabase
      .from("redemptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error

    const giftCardIds = [...new Set((redemptions || []).map((r) => r.gift_card_id).filter(Boolean))]
    let giftCardsMap: Record<
      string,
      { code: string; buyer_email: string | null; created_by: string | null; value_usd: number }
    > = {}

    if (giftCardIds.length > 0) {
      const { data: cards } = await supabase
        .from("gift_cards")
        .select("id, code, buyer_email, created_by, value_usd")
        .in("id", giftCardIds)

      if (cards) {
        giftCardsMap = cards.reduce(
          (acc, c) => {
            acc[c.id] = { code: c.code, buyer_email: c.buyer_email, created_by: c.created_by, value_usd: c.value_usd }
            return acc
          },
          {} as Record<
            string,
            { code: string; buyer_email: string | null; created_by: string | null; value_usd: number }
          >,
        )
      }
    }

    const redemptionsWithInfo = (redemptions || []).map((r) => ({
      ...r,
      gift_card: r.gift_card_id ? giftCardsMap[r.gift_card_id] : null,
    }))

    // Get stats
    const { data: allRedemptions } = await supabase
      .from("redemptions")
      .select("status, value_usd, deposit_amount, actual_amount")

    const stats = {
      total: allRedemptions?.length || 0,
      pending: allRedemptions?.filter((r) => r.status === "pending").length || 0,
      processing: allRedemptions?.filter((r) => r.status === "processing" || r.status === "waiting").length || 0,
      completed: allRedemptions?.filter((r) => r.status === "completed" || r.status === "settled").length || 0,
      failed: allRedemptions?.filter((r) => r.status === "failed" || r.status === "send_failed").length || 0,
      totalValue: allRedemptions?.reduce((sum, r) => sum + Number(r.value_usd || 0), 0) || 0,
      totalSent:
        allRedemptions
          ?.filter((r) => r.status === "completed" || r.status === "settled")
          .reduce((sum, r) => sum + Number(r.deposit_amount || 0), 0) || 0,
      totalReceived:
        allRedemptions
          ?.filter((r) => r.status === "completed" || r.status === "settled")
          .reduce((sum, r) => sum + Number(r.actual_amount || 0), 0) || 0,
    }

    const { data: wallets } = await supabase
      .from("admin_wallets")
      .select("asset, network, address")
      .eq("is_primary", true)
      .limit(1)

    let treasuryBalance = null
    if (wallets && wallets.length > 0) {
      treasuryBalance = await getTreasuryBalance(wallets[0].address, wallets[0].asset, wallets[0].network)
    }

    return NextResponse.json({
      redemptions: redemptionsWithInfo,
      stats,
      treasuryBalance,
    })
  } catch (error) {
    console.error("Failed to fetch redemptions:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// POST - Process a redemption
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()
    const { redemptionId, action } = await request.json()

    if (!redemptionId || !action) {
      return NextResponse.json({ error: "Redemption ID and action required" }, { status: 400 })
    }

    const { data: redemption, error: fetchError } = await supabase
      .from("redemptions")
      .select("*")
      .eq("id", redemptionId)
      .single()

    if (fetchError || !redemption) {
      return NextResponse.json({ error: "Redemption not found" }, { status: 404 })
    }

    if (action === "manual_send") {
      if (!redemption.deposit_address) {
        return NextResponse.json({ error: "No deposit address found" }, { status: 400 })
      }

      // Get treasury wallet
      const { data: wallets } = await supabase
        .from("admin_wallets")
        .select("asset, network, address")
        .eq("is_primary", true)
        .limit(1)

      if (!wallets || wallets.length === 0) {
        return NextResponse.json({ error: "Treasury wallet not configured" }, { status: 500 })
      }

      const treasury = wallets[0]

      // Check if auto-send is supported
      if (!canAutoSend(treasury.network)) {
        return NextResponse.json(
          {
            error: `Auto-send not supported for ${treasury.network}. Send manually.`,
            manualDetails: {
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

      // Attempt treasury send
      const sendResult = await sendFromTreasury(
        treasury.asset,
        treasury.network,
        redemption.deposit_address,
        redemption.deposit_amount.toString(),
      )

      if (!sendResult.success) {
        await supabase
          .from("redemptions")
          .update({
            status: "send_failed",
            error_message: sendResult.error,
            updated_at: new Date().toISOString(),
          })
          .eq("id", redemptionId)

        await logAudit(admin.id, "redemption_send_failed", "redemption", redemptionId, {
          error: sendResult.error,
        })

        return NextResponse.json(
          {
            error: sendResult.error,
            manualDetails: {
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

      // Update transaction
      await supabase
        .from("transactions")
        .update({
          tx_hash: sendResult.txHash,
          status: "sent",
        })
        .eq("sideshift_id", redemption.shift_id)

      await logAudit(admin.id, "redemption_sent", "redemption", redemptionId, {
        txHash: sendResult.txHash,
        amount: redemption.deposit_amount,
      })

      return NextResponse.json({
        success: true,
        txHash: sendResult.txHash,
        message: "Funds sent to SideShift. Waiting for conversion.",
      })
    }

    if (action === "check_status") {
      if (!redemption.shift_id) {
        return NextResponse.json({ error: "No shift ID found" }, { status: 400 })
      }

      const shift = await getShift(redemption.shift_id)

      if (isShiftComplete(shift.status)) {
        await supabase
          .from("redemptions")
          .update({
            status: "completed",
            actual_amount: shift.settleAmount ? Number.parseFloat(shift.settleAmount) : redemption.estimated_amount,
            settle_tx_hash: shift.deposits?.[0]?.settleHash || null,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", redemptionId)

        await supabase
          .from("transactions")
          .update({
            status: "settled",
            tx_hash: shift.deposits?.[0]?.settleHash || null,
          })
          .eq("sideshift_id", redemption.shift_id)

        return NextResponse.json({
          success: true,
          status: "completed",
          settleTxHash: shift.deposits?.[0]?.settleHash,
        })
      }

      if (isShiftFailed(shift.status)) {
        await supabase
          .from("redemptions")
          .update({
            status: "failed",
            error_message: `SideShift status: ${shift.status}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", redemptionId)

        return NextResponse.json({
          success: false,
          status: "failed",
          error: `Shift ${shift.status}`,
        })
      }

      return NextResponse.json({
        success: true,
        status: shift.status,
        message: "Still processing",
      })
    }

    if (action === "cancel") {
      await supabase
        .from("redemptions")
        .update({
          status: "cancelled",
          error_message: "Cancelled by admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", redemptionId)

      // Reactivate the gift card
      await supabase
        .from("gift_cards")
        .update({
          status: "active",
          redeemed_at: null,
          redeemed_crypto: null,
          redeemed_amount: null,
          redeemed_address: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", redemption.gift_card_id)

      await logAudit(admin.id, "redemption_cancelled", "redemption", redemptionId)

      return NextResponse.json({ success: true, message: "Redemption cancelled, gift card reactivated" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Failed to process redemption:", error)
    return NextResponse.json({ error: "Failed to process redemption" }, { status: 500 })
  }
}
