import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { deductFromBalance } from "@/lib/balance"
import { calculateFee } from "@/lib/fees"
import { hashPassword, generateGiftCardCode, generateSecretCode } from "@/lib/crypto"
import { notifyCardActivated } from "@/lib/notifications"
import { notifyBalancePurchase } from "@/lib/admin-notifications"
import {
  sendPurchaseEmail,
  sendGiftCardEmail,
  notifyAdminPurchase,
  notifyAdminPurchaseFailed,
  notifyAdminError,
} from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { amount, designId, recipientName, recipientEmail, senderName, message, password, isAnonymous } = body

    const valueUsd = body.valueUsd || amount

    const { data: settingsData } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["min_gift_card_value", "max_gift_card_value"])

    const settingsMap: Record<string, string> = {}
    settingsData?.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    const minCardValue = Number(settingsMap.min_gift_card_value) || 5
    const maxCardValue = Number(settingsMap.max_gift_card_value) || 100000

    // Validate amount using admin settings
    if (!valueUsd || valueUsd < minCardValue || valueUsd > maxCardValue) {
      return NextResponse.json(
        { error: `Card value must be between $${minCardValue} and $${maxCardValue.toLocaleString()}` },
        { status: 400 },
      )
    }

    // Calculate total cost with fee
    const feeCalc = calculateFee(valueUsd)
    const totalCost = feeCalc.totalCost

    // Get user email for notifications
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single()
    const userEmail = profile?.email || user.email

    // Deduct from balance
    const { success, newBalance, insufficientFunds } = await deductFromBalance(
      user.id,
      totalCost,
      `Gift card purchase - $${valueUsd}`,
    )

    if (!success) {
      if (insufficientFunds) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
      }
      notifyAdminPurchaseFailed(userEmail || "Unknown", valueUsd, "Failed to deduct from balance").catch(console.error)
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
    }

    const code = generateGiftCardCode()
    const secretCode = generateSecretCode()

    // Hash password if provided
    let passwordHash = null
    if (password) {
      passwordHash = await hashPassword(password)
    }

    const design = designId || body.design

    // Create the gift card
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90) // 90 days expiry

    const { data: card, error: insertError } = await supabase
      .from("gift_cards")
      .insert({
        code,
        secret_code: secretCode,
        created_by: user.id,
        value_usd: valueUsd,
        total_paid: totalCost,
        total_paid_usd: totalCost,
        platform_fee: feeCalc.platformFee,
        platform_fee_usd: feeCalc.platformFee,
        design,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        sender_name: isAnonymous ? null : senderName || null,
        message: message || null,
        password_hash: passwordHash,
        is_anonymous: isAnonymous || false,
        status: "active", // Immediately active since paid from balance
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Failed to create gift card:", insertError)
      // Refund the balance
      const { addToBalance } = await import("@/lib/balance")
      await addToBalance(user.id, totalCost, "refund", "Refund - Gift card creation failed")
      notifyAdminPurchaseFailed(userEmail || "Unknown", valueUsd, `Database error: ${insertError.message}`).catch(
        console.error,
      )
      return NextResponse.json({ error: "Failed to create gift card" }, { status: 500 })
    }

    // Record the transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      gift_card_id: card.id,
      type: "purchase",
      deposit_amount: totalCost,
      settle_amount: valueUsd,
      status: "completed",
    })

    await notifyCardActivated(user.id, valueUsd, code, design || "default", card.id, password || undefined)

    await notifyBalancePurchase(valueUsd, code, card.id, user.email || "Unknown", feeCalc.platformFee)

    if (userEmail) {
      sendPurchaseEmail(userEmail, {
        code,
        valueUsd,
        totalPaid: totalCost,
        fee: feeCalc.platformFee,
        paymentMethod: "Balance",
        status: "completed",
        design: design || undefined,
      }).catch(console.error)
    }

    if (recipientEmail) {
      sendGiftCardEmail(recipientEmail, {
        code,
        valueUsd,
        recipientName: recipientName || undefined,
        senderName: isAnonymous ? undefined : senderName || undefined,
        message: message || undefined,
        design: design || undefined,
        hasPassword: !!password,
      }).catch(console.error)
    }

    notifyAdminPurchase({
      userEmail: userEmail || "Unknown",
      cardCode: code,
      valueUsd,
      fee: feeCalc.platformFee,
      paymentMethod: "Balance",
      status: "completed",
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      code,
      valueUsd,
      newBalance,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("Balance purchase error:", error)
    notifyAdminError("Balance Purchase", error instanceof Error ? error.message : "Unknown error", {
      "Error Type": "Unexpected Exception",
    }).catch(console.error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to purchase gift card" },
      { status: 500 },
    )
  }
}
