import { createClient } from "@/lib/supabase/server"

type AdminNotificationType =
  | "new_purchase"
  | "purchase_pending"
  | "purchase_failed"
  | "redemption_pending"
  | "redemption_completed"
  | "redemption_failed"
  | "deposit_initiated"
  | "deposit_completed"
  | "deposit_failed"
  | "low_treasury"
  | "high_volume"
  | "card_expired"
  | "system_alert"
  | "user_signup"
  | "shift_completed"
  | "shift_failed"
  | "balance_purchase"

interface CreateAdminNotificationParams {
  type: AdminNotificationType
  title: string
  message: string
  severity?: "info" | "warning" | "critical" | "success"
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
}

export async function createAdminNotification(params: CreateAdminNotificationParams) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("admin_notifications").insert({
      type: params.type,
      title: params.title,
      message: params.message,
      severity: params.severity || "info",
      entity_type: params.entityType,
      entity_id: params.entityId,
      metadata: params.metadata || {},
      status: "unread",
    })

    if (error) {
      console.error("Failed to create admin notification:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Error creating admin notification:", err)
    return false
  }
}

// Helper functions for common admin notifications

export async function notifyDepositInitiated(
  userId: string,
  userEmail: string,
  amount: number,
  coin: string,
  network: string,
  depositId: string,
) {
  return createAdminNotification({
    type: "deposit_initiated",
    title: "New Deposit Initiated",
    message: `${userEmail} initiated a $${amount.toFixed(2)} deposit via ${coin.toUpperCase()} (${network})`,
    severity: "info",
    entityType: "deposit",
    entityId: depositId,
    metadata: { userId, userEmail, amount, coin, network },
  })
}

export async function notifyDepositCompleted(
  userId: string,
  userEmail: string,
  amount: number,
  coin: string,
  depositId: string,
) {
  return createAdminNotification({
    type: "deposit_completed",
    title: "Deposit Completed",
    message: `${userEmail}'s $${amount.toFixed(2)} deposit (${coin.toUpperCase()}) has been confirmed`,
    severity: "success",
    entityType: "deposit",
    entityId: depositId,
    metadata: { userId, userEmail, amount, coin },
  })
}

export async function notifyDepositFailed(
  userId: string,
  userEmail: string,
  amount: number,
  coin: string,
  depositId: string,
  reason: string,
) {
  return createAdminNotification({
    type: "deposit_failed",
    title: "Deposit Failed",
    message: `${userEmail}'s $${amount.toFixed(2)} deposit failed: ${reason}`,
    severity: "critical",
    entityType: "deposit",
    entityId: depositId,
    metadata: { userId, userEmail, amount, coin, reason },
  })
}

export async function notifyNewPurchase(
  cardValue: number,
  cardCode: string,
  cardId: string,
  paymentCoin: string,
  userEmail?: string,
) {
  return createAdminNotification({
    type: "new_purchase",
    title: "New Gift Card Purchase",
    message: `$${cardValue} gift card purchased with ${paymentCoin.toUpperCase()}${userEmail ? ` by ${userEmail}` : ""}`,
    severity: "success",
    entityType: "gift_card",
    entityId: cardId,
    metadata: { cardCode, cardValue, paymentCoin, userEmail },
  })
}

export async function notifyBalancePurchase(
  cardValue: number,
  cardCode: string,
  cardId: string,
  userEmail: string,
  fee: number,
) {
  return createAdminNotification({
    type: "balance_purchase",
    title: "Balance Purchase",
    message: `${userEmail} purchased $${cardValue} gift card from balance (fee: $${fee.toFixed(2)})`,
    severity: "success",
    entityType: "gift_card",
    entityId: cardId,
    metadata: { cardCode, cardValue, userEmail, fee },
  })
}

export async function notifyPurchasePending(cardValue: number, cardCode: string, cardId: string, paymentCoin: string) {
  return createAdminNotification({
    type: "purchase_pending",
    title: "Purchase Awaiting Payment",
    message: `$${cardValue} gift card awaiting ${paymentCoin.toUpperCase()} payment`,
    severity: "info",
    entityType: "gift_card",
    entityId: cardId,
    metadata: { cardCode, cardValue, paymentCoin },
  })
}

export async function notifyPurchaseFailed(cardValue: number, cardCode: string, cardId: string, reason: string) {
  return createAdminNotification({
    type: "purchase_failed",
    title: "Purchase Failed",
    message: `$${cardValue} gift card purchase failed: ${reason}`,
    severity: "warning",
    entityType: "gift_card",
    entityId: cardId,
    metadata: { cardCode, cardValue, reason },
  })
}

export async function notifyRedemptionPending(
  cardValue: number,
  cardCode: string,
  redemptionId: string,
  settleCoin: string,
  settleAddress: string,
) {
  return createAdminNotification({
    type: "redemption_pending",
    title: "Redemption Requires Attention",
    message: `$${cardValue} card redemption to ${settleCoin.toUpperCase()} needs processing`,
    severity: "warning",
    entityType: "redemption",
    entityId: redemptionId,
    metadata: { cardCode, cardValue, settleCoin, settleAddress },
  })
}

export async function notifyRedemptionCompleted(
  cardValue: number,
  cardCode: string,
  redemptionId: string,
  settleCoin: string,
  settleAmount: number,
) {
  return createAdminNotification({
    type: "redemption_completed",
    title: "Redemption Completed",
    message: `$${cardValue} card redeemed - sent ${settleAmount} ${settleCoin.toUpperCase()}`,
    severity: "success",
    entityType: "redemption",
    entityId: redemptionId,
    metadata: { cardCode, cardValue, settleCoin, settleAmount },
  })
}

export async function notifyRedemptionFailed(cardValue: number, cardCode: string, redemptionId: string, error: string) {
  return createAdminNotification({
    type: "redemption_failed",
    title: "Redemption Failed",
    message: `$${cardValue} card (${cardCode}) redemption failed: ${error}`,
    severity: "critical",
    entityType: "redemption",
    entityId: redemptionId,
    metadata: { cardCode, cardValue, error },
  })
}

export async function notifyLowTreasury(balance: number, asset: string) {
  return createAdminNotification({
    type: "low_treasury",
    title: "Low Treasury Balance",
    message: `Treasury balance is low: ${balance} ${asset.toUpperCase()}`,
    severity: "critical",
    metadata: { balance, asset },
  })
}

export async function notifyHighVolume(purchaseCount: number, totalValue: number, period: string) {
  return createAdminNotification({
    type: "high_volume",
    title: "High Purchase Volume",
    message: `${purchaseCount} purchases ($${totalValue.toFixed(2)}) in the last ${period}`,
    severity: "info",
    metadata: { purchaseCount, totalValue, period },
  })
}

export async function notifyUserSignup(userEmail: string, userId: string) {
  return createAdminNotification({
    type: "user_signup",
    title: "New User Registered",
    message: `New user signed up: ${userEmail}`,
    severity: "info",
    entityType: "user",
    entityId: userId,
    metadata: { userEmail },
  })
}

export async function notifyShiftCompleted(shiftId: string, settleAmount: number, settleCoin: string) {
  return createAdminNotification({
    type: "shift_completed",
    title: "Shift Completed",
    message: `SideShift conversion complete: ${settleAmount} ${settleCoin.toUpperCase()}`,
    severity: "success",
    entityType: "shift",
    entityId: shiftId,
    metadata: { settleAmount, settleCoin },
  })
}

export async function notifyShiftFailed(shiftId: string, error: string) {
  return createAdminNotification({
    type: "shift_failed",
    title: "Shift Failed",
    message: `SideShift conversion failed: ${error}`,
    severity: "critical",
    entityType: "shift",
    entityId: shiftId,
    metadata: { error },
  })
}
