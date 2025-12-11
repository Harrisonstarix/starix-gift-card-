import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getShift, isShiftComplete, isShiftFailed, getStatusMessage } from "@/lib/sideshift"

/**
 * POST /api/admin/redemptions/auto-process
 * Automatically check and update all pending redemptions
 * This can be called by a cron job or manually
 */
export async function POST(request: Request) {
  try {
    // Verify secret for cron jobs or admin access
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Allow either admin session or cron secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      try {
        const { requireAdmin } = await import("@/lib/auth")
        await requireAdmin()
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const supabase = await createClient()

    // Get all pending/processing redemptions
    const { data: pendingRedemptions, error } = await supabase
      .from("redemption_requests")
      .select(
        `
        id, shift_id, status, deposit_amount, deposit_coin, estimated_amount,
        gift_cards (value_usd)
      `,
      )
      .in("status", ["quoted", "processing", "pending"])
      .not("shift_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(50)

    if (error) throw error

    const results = {
      checked: 0,
      completed: 0,
      failed: 0,
      stillPending: 0,
      errors: [] as string[],
    }

    for (const redemption of pendingRedemptions || []) {
      results.checked++

      try {
        const shift = await getShift(redemption.shift_id!)

        if (isShiftComplete(shift.status)) {
          await supabase
            .from("redemption_requests")
            .update({
              status: "completed",
              actual_amount: shift.deposits?.[0]?.depositAmount || redemption.estimated_amount,
              processed_at: new Date().toISOString(),
            })
            .eq("id", redemption.id)

          await supabase
            .from("transactions")
            .update({
              status: "settled",
              settle_tx_hash: shift.deposits?.[0]?.settleHash || null,
            })
            .eq("sideshift_id", redemption.shift_id)

          results.completed++
        } else if (isShiftFailed(shift.status)) {
          await supabase
            .from("redemption_requests")
            .update({
              status: "failed",
              error_message: `SideShift: ${getStatusMessage(shift.status)}`,
            })
            .eq("id", redemption.id)

          results.failed++
        } else {
          results.stillPending++
        }
      } catch (err) {
        results.errors.push(`Redemption ${redemption.id}: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.checked} redemptions: ${results.completed} completed, ${results.failed} failed, ${results.stillPending} still pending`,
    })
  } catch (error) {
    console.error("Auto-process error:", error)
    return NextResponse.json({ error: "Failed to auto-process redemptions" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: allRedemptions } = await supabase.from("redemption_requests").select("status")

    const stats = {
      pending: allRedemptions?.filter((r) => ["pending", "quoted"].includes(r.status)).length || 0,
      processing: allRedemptions?.filter((r) => r.status === "processing").length || 0,
      completed: allRedemptions?.filter((r) => r.status === "completed").length || 0,
      failed: allRedemptions?.filter((r) => r.status === "failed").length || 0,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 })
  }
}
