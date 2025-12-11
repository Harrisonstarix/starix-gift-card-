import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getShift, isShiftComplete } from "@/lib/sideshift"
import { addToBalance } from "@/lib/balance"

/**
 * Recovery endpoint to check for payments that were completed but not credited
 * This handles cases where users closed their browser before payment was confirmed
 *
 * Can be called:
 * 1. By a cron job periodically
 * 2. When user logs back in
 * 3. Manually by admin
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check for authorization (cron secret or admin)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Get pending deposits that haven't been confirmed
    const { data: pendingDeposits, error: depositsError } = await supabase
      .from("deposits")
      .select("*")
      .eq("status", "pending")
      .not("shift_id", "is", null)
      .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    if (depositsError) {
      console.error("Error fetching pending deposits:", depositsError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const results = {
      checked: 0,
      credited: 0,
      failed: 0,
      details: [] as Array<{ shiftId: string; status: string; action: string }>,
    }

    // Check each pending deposit
    for (const deposit of pendingDeposits || []) {
      results.checked++

      try {
        const shift = await getShift(deposit.shift_id)

        if (isShiftComplete(shift.status)) {
          // Payment completed! Credit the user
          const settledAmount = Number.parseFloat(shift.settleAmount || deposit.amount_usd.toString())

          const { success, newBalance } = await addToBalance(
            deposit.user_id,
            settledAmount,
            "deposit",
            `Recovery: Deposit via ${deposit.deposit_coin}`,
            deposit.id,
            {
              amount: deposit.deposit_amount,
              coin: deposit.deposit_coin,
              network: deposit.deposit_network,
              shiftId: deposit.shift_id,
              recoveredAt: new Date().toISOString(),
            },
          )

          if (success) {
            // Update deposit status
            await supabase
              .from("deposits")
              .update({
                status: "completed",
                settled_amount: settledAmount,
                completed_at: new Date().toISOString(),
              })
              .eq("id", deposit.id)

            results.credited++
            results.details.push({
              shiftId: deposit.shift_id,
              status: shift.status,
              action: `Credited $${settledAmount.toFixed(2)}`,
            })
          } else {
            results.failed++
            results.details.push({
              shiftId: deposit.shift_id,
              status: shift.status,
              action: "Failed to credit balance",
            })
          }
        } else if (shift.status === "expired" || shift.status === "failed" || shift.status === "refunded") {
          // Mark as failed
          await supabase.from("deposits").update({ status: "failed" }).eq("id", deposit.id)

          results.details.push({
            shiftId: deposit.shift_id,
            status: shift.status,
            action: "Marked as failed",
          })
        } else {
          results.details.push({
            shiftId: deposit.shift_id,
            status: shift.status,
            action: "Still pending",
          })
        }
      } catch (err) {
        console.error(`Error checking shift ${deposit.shift_id}:`, err)
        results.failed++
      }
    }

    // Also check pending gift card purchases
    const { data: pendingCards, error: cardsError } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("status", "pending")
      .not("shift_id", "is", null)
      .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    for (const card of pendingCards || []) {
      results.checked++

      try {
        const shift = await getShift(card.shift_id)

        if (isShiftComplete(shift.status)) {
          // Activate the card
          await supabase
            .from("gift_cards")
            .update({
              status: "active",
              payment_confirmed_at: new Date().toISOString(),
            })
            .eq("id", card.id)

          results.credited++
          results.details.push({
            shiftId: card.shift_id,
            status: shift.status,
            action: `Activated card ${card.code}`,
          })
        } else if (shift.status === "expired" || shift.status === "failed" || shift.status === "refunded") {
          await supabase.from("gift_cards").update({ status: "cancelled" }).eq("id", card.id)

          results.details.push({
            shiftId: card.shift_id,
            status: shift.status,
            action: "Cancelled card",
          })
        }
      } catch (err) {
        console.error(`Error checking card shift ${card.shift_id}:`, err)
        results.failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.checked} pending payments, credited ${results.credited}`,
      results,
    })
  } catch (error) {
    console.error("Recovery check error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recovery check failed" },
      { status: 500 },
    )
  }
}
