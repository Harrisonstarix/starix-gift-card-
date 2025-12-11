// This API should be called by a cron job every 1-2 minutes
// It checks all pending deposits and gift cards for payment completion
// even if the user has closed their browser

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getShiftStatus } from "@/lib/sideshift-server"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // Allow up to 60 seconds for processing

export async function GET() {
  const results = {
    depositsChecked: 0,
    depositsCompleted: 0,
    giftCardsChecked: 0,
    giftCardsCompleted: 0,
    errors: [] as string[],
  }

  try {
    const supabase = await createClient()

    // Check pending deposits (created in last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    const { data: pendingDeposits, error: depositsError } = await supabase
      .from("deposits")
      .select("*")
      .eq("status", "pending")
      .gte("created_at", thirtyMinutesAgo)

    if (depositsError) {
      results.errors.push(`Deposits query error: ${depositsError.message}`)
    } else if (pendingDeposits) {
      results.depositsChecked = pendingDeposits.length

      for (const deposit of pendingDeposits) {
        try {
          if (!deposit.shift_id) continue

          const status = await getShiftStatus(deposit.shift_id)

          if (status.status === "settled") {
            // Only process if status is still "pending" - this prevents race conditions
            const { data: lockedDeposit, error: lockError } = await supabase
              .from("deposits")
              .update({
                status: "processing",
                updated_at: new Date().toISOString(),
              })
              .eq("id", deposit.id)
              .eq("status", "pending") // CRITICAL: Only update if still pending
              .select()
              .single()

            // If we couldn't lock it, another process already got it
            if (lockError || !lockedDeposit) {
              console.log(`Deposit ${deposit.id} already being processed by another request`)
              continue
            }

            const settledAmount = status.settleAmount ? Number.parseFloat(status.settleAmount) : deposit.amount_usd

            // Get or create user balance with atomic update
            const { data: existingBalance } = await supabase
              .from("user_balances")
              .select("*")
              .eq("user_id", deposit.user_id)
              .single()

            if (existingBalance) {
              await supabase
                .from("user_balances")
                .update({
                  balance_usd: existingBalance.balance_usd + settledAmount,
                  total_deposited: existingBalance.total_deposited + settledAmount,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", deposit.user_id)
            } else {
              await supabase.from("user_balances").insert({
                user_id: deposit.user_id,
                balance_usd: settledAmount,
                total_deposited: settledAmount,
                total_spent: 0,
              })
            }

            // Update deposit status to completed
            await supabase
              .from("deposits")
              .update({
                status: "completed",
                settled_amount: settledAmount,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", deposit.id)

            // Record transaction
            const balanceAfter = (existingBalance?.balance_usd || 0) + settledAmount
            await supabase.from("balance_transactions").insert({
              user_id: deposit.user_id,
              type: "deposit",
              amount: settledAmount,
              balance_before: existingBalance?.balance_usd || 0,
              balance_after: balanceAfter,
              description: `Deposit via ${deposit.deposit_coin}`,
              shift_id: deposit.shift_id,
              crypto_coin: deposit.deposit_coin,
              crypto_network: deposit.deposit_network,
              crypto_amount: deposit.deposit_amount,
            })

            // Create notification
            await supabase.from("notifications").insert({
              user_id: deposit.user_id,
              type: "deposit_complete",
              title: "Deposit Completed",
              message: `Your deposit of $${settledAmount.toFixed(2)} has been confirmed`,
              status: "unread",
              amount_usd: settledAmount,
              crypto_coin: deposit.deposit_coin,
              crypto_network: deposit.deposit_network,
              tx_status: "settled",
            })

            results.depositsCompleted++
          } else if (status.status === "failed" || status.status === "refunded") {
            await supabase
              .from("deposits")
              .update({
                status: status.status,
                updated_at: new Date().toISOString(),
              })
              .eq("id", deposit.id)
          }
          // If still pending/waiting, leave it alone for next check
        } catch (err) {
          results.errors.push(`Deposit ${deposit.id}: ${err instanceof Error ? err.message : "Unknown error"}`)
        }
      }
    }

    // Check pending gift cards (created in last 30 minutes)
    const { data: pendingCards, error: cardsError } = await supabase
      .from("gift_cards")
      .select("*")
      .in("status", ["pending_payment", "pending"]) // Check both statuses
      .gte("created_at", thirtyMinutesAgo)

    if (cardsError) {
      results.errors.push(`Gift cards query error: ${cardsError.message}`)
    } else if (pendingCards) {
      results.giftCardsChecked = pendingCards.length

      for (const card of pendingCards) {
        try {
          if (!card.payment_shift_id) continue

          const status = await getShiftStatus(card.payment_shift_id)

          if (status.status === "settled") {
            const { data: lockedCard, error: lockError } = await supabase
              .from("gift_cards")
              .update({
                status: "processing",
                updated_at: new Date().toISOString(),
              })
              .eq("id", card.id)
              .in("status", ["pending_payment", "pending"]) // Only update if still pending
              .select()
              .single()

            // If we couldn't lock it, another process already got it
            if (lockError || !lockedCard) {
              console.log(`Gift card ${card.id} already being processed by another request`)
              continue
            }

            // Activate the gift card
            await supabase
              .from("gift_cards")
              .update({
                status: "active",
                payment_tx_hash: status.settleHash || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", card.id)

            // Create notification for card creator
            if (card.created_by) {
              await supabase.from("notifications").insert({
                user_id: card.created_by,
                type: "gift_card_created",
                title: "Gift Card Activated",
                message: `Your $${card.value_usd} gift card is now active`,
                status: "unread",
                card_code: card.code,
                card_design: card.design,
                amount_usd: card.value_usd,
              })
            }

            results.giftCardsCompleted++
          } else if (status.status === "failed" || status.status === "refunded") {
            await supabase
              .from("gift_cards")
              .update({
                status: "payment_failed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", card.id)
          }
        } catch (err) {
          results.errors.push(`Gift card ${card.id}: ${err instanceof Error ? err.message : "Unknown error"}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    })
  } catch (error) {
    console.error("Cron check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ...results,
      },
      { status: 500 },
    )
  }
}

// Also support POST for manual triggers
export async function POST() {
  return GET()
}
