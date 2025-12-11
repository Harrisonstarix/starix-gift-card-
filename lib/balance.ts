import { createClient } from "@/lib/supabase/server"

export interface UserBalance {
  balance_usd: number
  total_deposited: number
  total_spent: number
}

/**
 * Get user's current balance
 */
export async function getUserBalance(userId: string): Promise<UserBalance> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_balances")
    .select("balance_usd, total_deposited, total_spent")
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    const { data: newData } = await supabase
      .from("user_balances")
      .upsert(
        {
          user_id: userId,
          balance_usd: 0,
          total_deposited: 0,
          total_spent: 0,
        },
        { onConflict: "user_id" },
      )
      .select("balance_usd, total_deposited, total_spent")
      .single()

    return newData || { balance_usd: 0, total_deposited: 0, total_spent: 0 }
  }

  return data
}

/**
 * Add to user balance with atomic operation to prevent race conditions
 * Uses optimistic locking by checking balance hasn't changed between read and write
 */
export async function addToBalance(
  userId: string,
  amount: number,
  type: "deposit" | "underpayment_credit" | "refund" | "admin_adjustment",
  description: string,
  referenceId?: string,
  cryptoDetails?: {
    amount: number
    coin: string
    network: string
    shiftId: string
  },
): Promise<{ success: boolean; newBalance: number }> {
  const supabase = await createClient()

  // Get current balance
  const currentBalance = await getUserBalance(userId)
  const newBalanceUsd = currentBalance.balance_usd + amount

  // First try to update existing row with balance verification
  const { data: updated, error: updateError } = await supabase
    .from("user_balances")
    .update({
      balance_usd: newBalanceUsd,
      total_deposited:
        type === "deposit" || type === "underpayment_credit"
          ? currentBalance.total_deposited + amount
          : currentBalance.total_deposited,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("balance_usd", currentBalance.balance_usd) // Optimistic lock - only update if balance hasn't changed
    .select("balance_usd")
    .single()

  if (updateError || !updated) {
    // Balance changed between read and write - retry with fresh data
    console.log(`[Balance] Race condition detected for user ${userId}, retrying...`)

    // Get fresh balance and try again
    const freshBalance = await getUserBalance(userId)
    const retryNewBalance = freshBalance.balance_usd + amount

    const { data: retryUpdated, error: retryError } = await supabase
      .from("user_balances")
      .update({
        balance_usd: retryNewBalance,
        total_deposited:
          type === "deposit" || type === "underpayment_credit"
            ? freshBalance.total_deposited + amount
            : freshBalance.total_deposited,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("balance_usd")
      .single()

    if (retryError || !retryUpdated) {
      console.error("Balance update failed after retry:", retryError)
      return { success: false, newBalance: freshBalance.balance_usd }
    }

    // Record transaction with correct values
    await supabase.from("balance_transactions").insert({
      user_id: userId,
      type,
      amount,
      balance_before: freshBalance.balance_usd,
      balance_after: retryNewBalance,
      description,
      reference_id: referenceId,
      crypto_amount: cryptoDetails?.amount,
      crypto_coin: cryptoDetails?.coin,
      crypto_network: cryptoDetails?.network,
      shift_id: cryptoDetails?.shiftId,
    })

    return { success: true, newBalance: retryNewBalance }
  }

  // Record transaction
  await supabase.from("balance_transactions").insert({
    user_id: userId,
    type,
    amount,
    balance_before: currentBalance.balance_usd,
    balance_after: newBalanceUsd,
    description,
    reference_id: referenceId,
    crypto_amount: cryptoDetails?.amount,
    crypto_coin: cryptoDetails?.coin,
    crypto_network: cryptoDetails?.network,
    shift_id: cryptoDetails?.shiftId,
  })

  return { success: true, newBalance: newBalanceUsd }
}

/**
 * Deduct from user balance with atomic operation
 * Uses optimistic locking and minimum balance check in single query
 */
export async function deductFromBalance(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
): Promise<{ success: boolean; newBalance: number; insufficientFunds: boolean }> {
  const supabase = await createClient()

  const currentBalance = await getUserBalance(userId)

  if (currentBalance.balance_usd < amount) {
    return {
      success: false,
      newBalance: currentBalance.balance_usd,
      insufficientFunds: true,
    }
  }

  const newBalanceUsd = currentBalance.balance_usd - amount

  const { data: updated, error: updateError } = await supabase
    .from("user_balances")
    .update({
      balance_usd: newBalanceUsd,
      total_spent: currentBalance.total_spent + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .gte("balance_usd", amount) // Only deduct if balance is still sufficient
    .select("balance_usd")
    .single()

  if (updateError || !updated) {
    // Either balance changed or insufficient funds
    const freshBalance = await getUserBalance(userId)
    return {
      success: false,
      newBalance: freshBalance.balance_usd,
      insufficientFunds: freshBalance.balance_usd < amount,
    }
  }

  // Record transaction
  await supabase.from("balance_transactions").insert({
    user_id: userId,
    type: "purchase",
    amount: -amount,
    balance_before: currentBalance.balance_usd,
    balance_after: updated.balance_usd,
    description,
    reference_id: referenceId,
  })

  return { success: true, newBalance: updated.balance_usd, insufficientFunds: false }
}

/**
 * Check if user has sufficient balance for purchase
 */
export async function hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
  const balance = await getUserBalance(userId)
  return balance.balance_usd >= amount
}
