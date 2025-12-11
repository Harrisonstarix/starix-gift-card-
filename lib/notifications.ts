import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

export type NotificationType =
  | "deposit_pending"
  | "deposit_confirmed"
  | "deposit_failed"
  | "purchase_pending"
  | "purchase_confirmed"
  | "purchase_failed"
  | "card_activated"
  | "card_redeemed"
  | "card_expired"
  | "redemption_pending"
  | "redemption_processing"
  | "redemption_completed"
  | "redemption_failed"
  | "system"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  entityType?: "gift_card" | "deposit" | "redemption" | "transaction"
  entityId?: string
  amountUsd?: number
  cryptoAmount?: number
  cryptoCoin?: string
  cryptoNetwork?: string
  cardCode?: string
  cardDesign?: string
  cardPassword?: string
  txStatus?: "pending" | "confirmed" | "failed" | "cancelled" | "processing"
  txHash?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(
  supabaseOrParams: SupabaseClient | CreateNotificationParams,
  maybeParams?: CreateNotificationParams,
) {
  try {
    let supabase: SupabaseClient
    let params: CreateNotificationParams

    // Handle both call signatures: createNotification(params) and createNotification(supabase, params)
    if (maybeParams) {
      supabase = supabaseOrParams as SupabaseClient
      params = maybeParams
    } else {
      supabase = await createClient()
      params = supabaseOrParams as CreateNotificationParams
    }

    const metadata = {
      ...(params.metadata || {}),
      ...(params.cardPassword ? { card_password: params.cardPassword } : {}),
    }

    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      status: "unread",
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      amount_usd: params.amountUsd || null,
      crypto_amount: params.cryptoAmount || null,
      crypto_coin: params.cryptoCoin || null,
      crypto_network: params.cryptoNetwork || null,
      card_code: params.cardCode || null,
      card_design: params.cardDesign || null,
      tx_status: params.txStatus || null,
      tx_hash: params.txHash || null,
      metadata,
    })

    if (error) {
      console.error("Failed to create notification:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Error creating notification:", err)
    return false
  }
}

// Helper functions for common notification types
export async function notifyDepositPending(
  userId: string,
  amount: number,
  coin: string,
  network: string,
  depositId: string,
) {
  return createNotification({
    userId,
    type: "deposit_pending",
    title: "Deposit Initiated",
    message: `Your deposit of ${amount} ${coin.toUpperCase()} is being processed.`,
    entityType: "deposit",
    entityId: depositId,
    cryptoAmount: amount,
    cryptoCoin: coin,
    cryptoNetwork: network,
    txStatus: "pending",
  })
}

export async function notifyDepositConfirmed(
  userId: string,
  amountUsd: number,
  coin: string,
  network: string,
  depositId: string,
  txHash?: string,
) {
  return createNotification({
    userId,
    type: "deposit_confirmed",
    title: "Deposit Confirmed",
    message: `$${amountUsd.toFixed(2)} has been added to your balance.`,
    entityType: "deposit",
    entityId: depositId,
    amountUsd,
    cryptoCoin: coin,
    cryptoNetwork: network,
    txStatus: "confirmed",
    txHash,
  })
}

export async function notifyDepositFailed(userId: string, coin: string, network: string, depositId: string) {
  return createNotification({
    userId,
    type: "deposit_failed",
    title: "Deposit Failed",
    message: `Your ${coin.toUpperCase()} deposit could not be processed. Please contact support.`,
    entityType: "deposit",
    entityId: depositId,
    cryptoCoin: coin,
    cryptoNetwork: network,
    txStatus: "failed",
  })
}

export async function notifyCardPurchasePending(
  userId: string,
  cardValue: number,
  cardCode: string,
  cardDesign: string,
  cardId: string,
  coin: string,
  network: string,
) {
  return createNotification({
    userId,
    type: "purchase_pending",
    title: "Gift Card Purchase Pending",
    message: `Your $${cardValue} gift card is waiting for payment confirmation.`,
    entityType: "gift_card",
    entityId: cardId,
    amountUsd: cardValue,
    cardCode,
    cardDesign,
    cryptoCoin: coin,
    cryptoNetwork: network,
    txStatus: "pending",
  })
}

export async function notifyCardActivated(
  userId: string,
  cardValue: number,
  cardCode: string,
  cardDesign: string,
  cardId: string,
  cardPassword?: string, // Added password param
) {
  return createNotification({
    userId,
    type: "card_activated",
    title: "Gift Card Activated",
    message: `Your $${cardValue} gift card (${cardCode}) is now active and ready to use!`,
    entityType: "gift_card",
    entityId: cardId,
    amountUsd: cardValue,
    cardCode,
    cardDesign,
    cardPassword, // Pass password to notification
    txStatus: "confirmed",
  })
}

export async function notifyRedemptionProcessing(
  userId: string,
  cardValue: number,
  cardCode: string,
  coin: string,
  network: string,
  redemptionId: string,
) {
  return createNotification({
    userId,
    type: "redemption_processing",
    title: "Redemption Processing",
    message: `Your $${cardValue} card is being redeemed to ${coin.toUpperCase()}.`,
    entityType: "redemption",
    entityId: redemptionId,
    amountUsd: cardValue,
    cardCode,
    cryptoCoin: coin,
    cryptoNetwork: network,
    txStatus: "processing",
  })
}

export async function notifyRedemptionCompleted(
  userId: string,
  cardValue: number,
  cardCode: string,
  cryptoAmount: number,
  coin: string,
  network: string,
  redemptionId: string,
  txHash?: string,
) {
  return createNotification({
    userId,
    type: "redemption_completed",
    title: "Redemption Complete",
    message: `${cryptoAmount} ${coin.toUpperCase()} has been sent to your wallet.`,
    entityType: "redemption",
    entityId: redemptionId,
    amountUsd: cardValue,
    cardCode,
    cryptoAmount,
    cryptoCoin: coin,
    cryptoNetwork: network,
    txStatus: "confirmed",
    txHash,
  })
}
