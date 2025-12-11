import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { getShift, isShiftComplete } from "@/lib/sideshift"
import { addToBalance } from "@/lib/balance"
import { notifyDepositConfirmed } from "@/lib/notifications"
import { notifyDepositCompleted, notifyDepositFailed } from "@/lib/admin-notifications"
import { sendDepositEmail, notifyAdminDeposit, notifyAdminDepositFailed, notifyAdminError } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { shiftId } = body

    // Get the deposit record
    const { data: deposit, error: depositError } = await supabase
      .from("deposits")
      .select("*")
      .eq("shift_id", shiftId)
      .eq("user_id", user.id)
      .single()

    if (depositError || !deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 })
    }

    if (deposit.status === "completed") {
      // Already processed - return current balance without adding again
      const { data: balance } = await supabase
        .from("user_balances")
        .select("balance_usd")
        .eq("user_id", user.id)
        .single()

      return NextResponse.json({
        success: true,
        newBalance: balance?.balance_usd || 0,
        alreadyProcessed: true,
      })
    }

    const { data: updatedDeposit, error: updateError } = await supabase
      .from("deposits")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", deposit.id)
      .eq("status", "pending") // Only update if still pending
      .select()
      .single()

    if (updateError || !updatedDeposit) {
      // Another request already started processing or completed
      const { data: balance } = await supabase
        .from("user_balances")
        .select("balance_usd")
        .eq("user_id", user.id)
        .single()

      return NextResponse.json({
        success: true,
        newBalance: balance?.balance_usd || 0,
        alreadyProcessed: true,
      })
    }

    // Verify shift status with SideShift
    const shift = await getShift(shiftId)

    if (!isShiftComplete(shift.status)) {
      // Reset status back to pending
      await supabase.from("deposits").update({ status: "pending" }).eq("id", deposit.id)

      return NextResponse.json({ error: "Payment not yet confirmed", status: shift.status }, { status: 400 })
    }

    // Get the actual settled amount (what we received)
    const settledAmount = Number.parseFloat(shift.settleAmount || deposit.amount_usd.toString())

    // Check for underpayment - if less than expected, still credit what we received
    const creditAmount = settledAmount
    let depositType: "deposit" | "underpayment_credit" = "deposit"

    if (settledAmount < deposit.amount_usd * 0.95) {
      // Significant underpayment (more than 5% less)
      depositType = "underpayment_credit"
    }

    // Add to user balance
    const { success, newBalance } = await addToBalance(
      user.id,
      creditAmount,
      depositType,
      `Deposit via ${deposit.deposit_coin}`,
      deposit.id,
      {
        amount: deposit.deposit_amount,
        coin: deposit.deposit_coin,
        network: deposit.deposit_network,
        shiftId: shiftId,
      },
    )

    if (!success) {
      // Reset status
      await supabase.from("deposits").update({ status: "pending" }).eq("id", deposit.id)

      await notifyDepositFailed(
        user.id,
        user.email || "Unknown",
        deposit.amount_usd,
        deposit.deposit_coin,
        deposit.id,
        "Failed to update balance",
      )

      notifyAdminDepositFailed(
        user.email || "Unknown",
        deposit.amount_usd,
        deposit.deposit_coin || "Unknown",
        "Failed to update user balance",
      ).catch(console.error)

      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    await supabase
      .from("deposits")
      .update({
        status: "completed",
        settled_amount: settledAmount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", deposit.id)

    // Record in transactions
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      sideshift_id: shiftId,
      deposit_coin: deposit.deposit_coin,
      deposit_network: deposit.deposit_network,
      deposit_amount: deposit.deposit_amount,
      settle_amount: settledAmount,
      status: "completed",
    })

    // Get user email
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single()

    const userEmail = profile?.email || user.email

    // Send deposit confirmation to user (non-blocking)
    if (userEmail) {
      sendDepositEmail(
        userEmail,
        deposit.amount_usd,
        deposit.deposit_coin?.toUpperCase() || "CRYPTO",
        newBalance,
      ).catch(console.error)
    }

    // Notify admin (non-blocking)
    notifyAdminDeposit(
      userEmail || "Unknown",
      deposit.amount_usd,
      deposit.deposit_coin?.toUpperCase() || "CRYPTO",
      shiftId,
    ).catch(console.error)

    await notifyDepositConfirmed(user.id, creditAmount, deposit.deposit_coin, deposit.deposit_network, deposit.id)

    await notifyDepositCompleted(user.id, user.email || "Unknown", creditAmount, deposit.deposit_coin, deposit.id)

    return NextResponse.json({
      success: true,
      newBalance,
      credited: creditAmount,
      type: depositType,
    })
  } catch (error) {
    console.error("Deposit confirmation error:", error)
    notifyAdminError("Deposit Confirmation", error instanceof Error ? error.message : "Unknown error", {
      "Error Type": "Unexpected Exception",
    }).catch(console.error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to confirm deposit" },
      { status: 500 },
    )
  }
}
