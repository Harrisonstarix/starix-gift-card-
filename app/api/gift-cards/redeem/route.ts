import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRedemptionQuoteWithTreasury, createRedemptionShiftWithTreasury } from "@/lib/sideshift-server"
import { verifyPassword } from "@/lib/crypto"
import { calculateRedemptionPayout } from "@/lib/fees"
import { getCurrentUser } from "@/lib/auth"
import { sendFromTreasury, canAutoSend, getTreasuryBalance } from "@/lib/treasury"
import { createNotification } from "@/lib/notifications"
import { notifyRedemptionPending } from "@/lib/admin-notifications"
import {
  sendRedemptionEmail,
  notifyAdminRedemption,
  notifyAdminRedemptionFailed,
  sendRedemptionFailedEmail,
} from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    console.log("[Redeem] Starting redemption process...")

    const supabase = await createClient()
    const body = await request.json()

    console.log("[Redeem] Request body:", JSON.stringify(body, null, 2))

    const { code, settleCoin, settleNetwork, settleAddress, settleMemo, password, quoteId } = body

    const crypto = settleCoin
    const network = settleNetwork
    const walletAddress = settleAddress

    if (!code) {
      return NextResponse.json({ error: "Gift card code is required" }, { status: 400 })
    }
    if (!crypto) {
      return NextResponse.json({ error: "Cryptocurrency selection is required" }, { status: 400 })
    }
    if (!network) {
      return NextResponse.json({ error: "Network selection is required" }, { status: 400 })
    }
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required to redeem gift cards" }, { status: 401 })
    }

    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfIp = request.headers.get("cf-connecting-ip")
    let userIp = forwardedFor?.split(",")[0]?.trim() || realIp || cfIp || ""

    if (!userIp || userIp === "127.0.0.1" || userIp === "::1") {
      userIp = ""
    }

    console.log("[Redeem] User IP:", userIp || "using default")

    // Look up the gift card
    const { data: cards, error: lookupError } = await supabase
      .from("gift_cards")
      .select(`
        id, 
        code,
        value_usd, 
        total_paid,
        platform_fee,
        status, 
        expires_at, 
        password_hash,
        created_at,
        payment_amount,
        payment_crypto,
        design,
        recipient_name,
        sender_name,
        message,
        is_anonymous
      `)
      .or(`code.eq.${code.toUpperCase().trim()},secret_code.eq.${code.toUpperCase().trim()}`)
      .limit(1)

    if (lookupError || !cards || cards.length === 0) {
      console.log("[Redeem] Gift card not found:", code)
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 })
    }

    const card = cards[0]
    console.log("[Redeem] Found card:", { id: card.id, value: card.value_usd, status: card.status })

    // Password verification
    if (card.password_hash) {
      if (!password) {
        return NextResponse.json(
          { error: "This gift card is password protected", requiresPassword: true },
          { status: 401 },
        )
      }

      const isValidPassword = await verifyPassword(password, card.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
      }
    }

    // Status checks
    if (card.status === "redeemed") {
      return NextResponse.json({ error: "This gift card has already been redeemed" }, { status: 400 })
    }

    if (card.status !== "active") {
      return NextResponse.json({ error: `This gift card is ${card.status} and cannot be redeemed` }, { status: 400 })
    }

    // Check expiration
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      await supabase.from("gift_cards").update({ status: "expired" }).eq("id", card.id)
      return NextResponse.json({ error: "This gift card has expired" }, { status: 400 })
    }

    // Calculate payout amount
    const { sendAmount, estimatedReceive } = calculateRedemptionPayout(card.value_usd, crypto, network)

    console.log("[Redeem] Payout calculation:", { cardValue: card.value_usd, sendAmount, estimatedReceive })

    const { data: wallets } = await supabase
      .from("admin_wallets")
      .select("asset, network, address")
      .eq("is_primary", true)
      .limit(1)

    if (!wallets || wallets.length === 0) {
      console.log("[Redeem] No treasury wallet configured")
      return NextResponse.json(
        {
          error: "Platform treasury is not configured. Please contact support.",
          code: "TREASURY_NOT_CONFIGURED",
        },
        { status: 503 },
      )
    }

    const treasury = wallets[0]

    // Check if auto-send is supported for this network
    if (!canAutoSend(treasury.network)) {
      console.log("[Redeem] Auto-send not supported for network:", treasury.network)
      return NextResponse.json(
        {
          error: `Auto-send is not supported for ${treasury.network} network. Please contact support.`,
          code: "AUTO_SEND_NOT_SUPPORTED",
        },
        { status: 503 },
      )
    }

    // Get treasury balance FIRST before doing anything else
    const treasuryBalanceData = await getTreasuryBalance(treasury.address, treasury.asset, treasury.network)
    console.log("[Redeem] Treasury balance data:", treasuryBalanceData)

    if (!treasuryBalanceData) {
      console.log("[Redeem] Could not fetch treasury balance")
      await notifyAdminRedemptionFailed(
        user.email || "Unknown",
        card.value_usd,
        crypto.toUpperCase(),
        "Could not fetch treasury balance",
        0,
        0,
        treasury.asset.toUpperCase(),
      )
      return NextResponse.json(
        {
          error: "Could not verify platform balance. Please try again later.",
          code: "TREASURY_CHECK_FAILED",
        },
        { status: 503 },
      )
    }

    // Get quote to know how much we need from treasury
    let quote
    try {
      quote = quoteId
        ? await getRedemptionQuoteWithTreasury(crypto, network, sendAmount, userIp, quoteId)
        : await getRedemptionQuoteWithTreasury(crypto, network, sendAmount, userIp)
      console.log("[Redeem] Got quote:", quote.id, "Deposit amount needed:", quote.depositAmount)
    } catch (quoteError) {
      console.error("[Redeem] Quote error:", quoteError)
      return NextResponse.json(
        { error: quoteError instanceof Error ? quoteError.message : "Failed to get conversion quote" },
        { status: 500 },
      )
    }

    const requiredTokenAmount = Number.parseFloat(quote.depositAmount)
    const availableTokenBalance = Number.parseFloat(treasuryBalanceData.balance)

    console.log("[Redeem] Balance check:", {
      availableTokens: availableTokenBalance,
      availableUSD: treasuryBalanceData.balanceUsd,
      requiredTokens: requiredTokenAmount,
      asset: treasury.asset,
    })

    if (availableTokenBalance < requiredTokenAmount) {
      console.log("[Redeem] INSUFFICIENT TREASURY BALANCE - STOPPING!")

      await notifyAdminRedemptionFailed(
        user.email || "Unknown",
        card.value_usd,
        crypto.toUpperCase(),
        "Insufficient treasury balance",
        availableTokenBalance,
        requiredTokenAmount,
        treasury.asset.toUpperCase(),
      )

      if (user.email) {
        await sendRedemptionFailedEmail(
          user.email,
          card.value_usd,
          crypto.toUpperCase(),
          network,
          "Platform treasury temporarily low",
          card.design,
        )
      }

      return NextResponse.json(
        {
          error: `Platform treasury balance is insufficient. Available: ${availableTokenBalance.toFixed(6)} ${treasury.asset.toUpperCase()} ($${treasuryBalanceData.balanceUsd.toFixed(2)} USD), Required: ${requiredTokenAmount.toFixed(6)} ${treasury.asset.toUpperCase()}. Please try again later or contact support.`,
          code: "TREASURY_INSUFFICIENT",
          treasuryBalance: availableTokenBalance,
          treasuryBalanceUsd: treasuryBalanceData.balanceUsd,
          requiredAmount: requiredTokenAmount,
          asset: treasury.asset.toUpperCase(),
        },
        { status: 503 },
      )
    }

    // Create shift for redemption
    let shift
    try {
      shift = await createRedemptionShiftWithTreasury(quote.id, walletAddress, settleMemo || undefined, userIp)
      console.log("[Redeem] Created shift:", shift.id)
    } catch (shiftError) {
      console.error("[Redeem] Shift error:", shiftError)
      return NextResponse.json(
        { error: shiftError instanceof Error ? shiftError.message : "Failed to create conversion shift" },
        { status: 500 },
      )
    }

    // Now attempt to send from treasury BEFORE marking card as redeemed
    let autoSendResult = null
    try {
      console.log("[Redeem] Attempting auto-send from treasury...")
      const sendResult = await sendFromTreasury(
        treasury.asset,
        treasury.network,
        shift.depositAddress,
        quote.depositAmount,
      )

      if (!sendResult.success) {
        console.error("[Redeem] Auto-send failed:", sendResult.error)

        await notifyAdminRedemptionFailed(
          user.email || "Unknown",
          card.value_usd,
          crypto.toUpperCase(),
          sendResult.error || "Treasury send failed",
          availableTokenBalance,
          requiredTokenAmount,
          treasury.asset.toUpperCase(),
        )

        if (user.email) {
          await sendRedemptionFailedEmail(
            user.email,
            card.value_usd,
            crypto.toUpperCase(),
            network,
            "Transaction failed - please try again",
            card.design,
          )
        }

        return NextResponse.json(
          {
            error: `Failed to send from treasury: ${sendResult.error}. Please try again.`,
            code: "TREASURY_SEND_FAILED",
          },
          { status: 500 },
        )
      }

      autoSendResult = sendResult
      console.log("[Redeem] Auto-send successful:", sendResult.txHash)
    } catch (sendError) {
      console.error("[Redeem] Auto-send error:", sendError)

      await notifyAdminRedemptionFailed(
        user.email || "Unknown",
        card.value_usd,
        crypto.toUpperCase(),
        sendError instanceof Error ? sendError.message : "Unknown error",
        availableTokenBalance,
        requiredTokenAmount,
        treasury.asset.toUpperCase(),
      )

      if (user.email) {
        await sendRedemptionFailedEmail(
          user.email,
          card.value_usd,
          crypto.toUpperCase(),
          network,
          "Transaction error - please try again",
          card.design,
        )
      }

      return NextResponse.json(
        {
          error: `Treasury send failed: ${sendError instanceof Error ? sendError.message : "Unknown error"}. Please try again.`,
          code: "TREASURY_SEND_ERROR",
        },
        { status: 500 },
      )
    }

    // Only mark card as redeemed AFTER successful treasury send
    await supabase
      .from("gift_cards")
      .update({
        status: "redeemed",
        redeemed_at: new Date().toISOString(),
        redeemed_crypto: crypto.toUpperCase(),
        redeemed_amount: Number.parseFloat(quote.settleAmount),
        redeemed_address: walletAddress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", card.id)

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from("redemptions")
      .insert({
        gift_card_id: card.id,
        gift_card_code: card.code,
        value_usd: card.value_usd,
        settle_coin: crypto.toUpperCase(),
        settle_network: network,
        settle_address: walletAddress,
        settle_memo: settleMemo || null,
        estimated_amount: Number.parseFloat(quote.settleAmount),
        deposit_coin: quote.depositCoin?.toUpperCase(),
        deposit_network: quote.depositNetwork,
        deposit_address: shift.depositAddress,
        deposit_amount: Number.parseFloat(quote.depositAmount),
        quote_id: quote.id,
        shift_id: shift.id,
        status: "processing",
        treasury_tx_hash: autoSendResult.txHash,
        treasury_send_status: "sent",
      })
      .select()
      .single()

    if (redemptionError) {
      console.error("[Redeem] Failed to create redemption record:", redemptionError)
    }

    // Record the transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      gift_card_id: card.id,
      type: "redemption",
      sideshift_id: shift.id,
      quote_id: quote.id,
      deposit_coin: quote.depositCoin?.toUpperCase(),
      deposit_network: quote.depositNetwork,
      deposit_amount: Number.parseFloat(quote.depositAmount),
      settle_coin: crypto.toUpperCase(),
      settle_network: network,
      settle_amount: Number.parseFloat(quote.settleAmount),
      status: "processing",
    })

    // Send user notification
    await createNotification({
      userId: user.id,
      type: "redemption_processing",
      title: "Redemption Processing",
      message: `Your $${card.value_usd} gift card is being converted to ${crypto.toUpperCase()}. You'll receive approximately ${Number.parseFloat(quote.settleAmount).toFixed(6)} ${crypto.toUpperCase()}.`,
      metadata: {
        giftCardId: card.id,
        shiftId: shift.id,
        crypto: crypto.toUpperCase(),
        amount: quote.settleAmount,
      },
    })

    // Send admin notification
    await notifyRedemptionPending(
      card.id,
      user.email || "Unknown",
      card.value_usd,
      crypto.toUpperCase(),
      network,
      walletAddress,
    )

    // Send email notifications
    try {
      await sendRedemptionEmail(
        user.email || "",
        card.value_usd,
        crypto.toUpperCase(),
        network,
        walletAddress,
        Number.parseFloat(quote.settleAmount),
        shift.id,
        "processing",
        card.design, // Include card design for email image
      )
      await notifyAdminRedemption(
        user.email || "Unknown",
        card.value_usd,
        crypto.toUpperCase(),
        network,
        walletAddress,
        Number.parseFloat(quote.settleAmount),
        shift.id,
        autoSendResult.txHash || "",
      )
    } catch (emailError) {
      console.error("[Redeem] Email notification failed:", emailError)
    }

    console.log("[Redeem] Redemption successful!")

    return NextResponse.json({
      success: true,
      message: "Gift card redeemed successfully",
      shiftId: shift.id,
      shift: {
        id: shift.id,
        depositAddress: shift.depositAddress,
        settleAddress: walletAddress,
        depositCoin: quote.depositCoin,
        depositNetwork: quote.depositNetwork,
        settleCoin: crypto,
        settleNetwork: network,
      },
      settleAmount: quote.settleAmount,
      estimatedAmount: Number.parseFloat(quote.settleAmount),
      treasuryTxHash: autoSendResult.txHash,
      card: {
        id: card.id,
        value: card.value_usd,
        senderName: card.is_anonymous ? "Anonymous" : card.sender_name,
        recipientName: card.recipient_name,
        message: card.message,
        design: card.design,
      },
    })
  } catch (error) {
    console.error("[Redeem] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
