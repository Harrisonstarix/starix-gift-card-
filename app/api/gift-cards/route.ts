import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createFixedShift } from "@/lib/sideshift"
import { calculateFee } from "@/lib/fees"
import { hashPassword } from "@/lib/crypto"
import { generateGiftCardCode, generateSecretCode } from "@/lib/crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const {
      quoteId,
      valueUsd,
      design,
      recipientName,
      recipientEmail,
      senderName,
      message,
      paymentCrypto,
      paymentNetwork,
      refundAddress,
      password,
      isAnonymous,
    } = body

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfIp = request.headers.get("cf-connecting-ip")
    let userIp = forwardedFor?.split(",")[0]?.trim() || realIp || cfIp || ""

    // Don't send localhost IPs to SideShift
    if (!userIp || userIp === "127.0.0.1" || userIp === "::1") {
      userIp = "" // Will use default in sideshift.ts
    }

    const secretCode = generateSecretCode()
    const displayCode = generateGiftCardCode()

    // Get admin wallet
    const { data: wallets, error: walletError } = await supabase
      .from("admin_wallets")
      .select("address, asset, network")
      .eq("is_primary", true)
      .limit(1)

    if (walletError || !wallets || wallets.length === 0) {
      console.error("[GiftCard] No admin wallet configured:", walletError)
      return NextResponse.json({ error: "Payment system not configured. Please contact support." }, { status: 500 })
    }

    const settleWallet = wallets[0]

    if (!settleWallet.address || settleWallet.address.trim().length === 0) {
      console.error("[GiftCard] Invalid settle wallet address:", settleWallet)
      return NextResponse.json(
        { error: "Treasury wallet address is invalid. Please contact support." },
        { status: 500 },
      )
    }

    const trimmedAddress = settleWallet.address.trim()
    console.log(
      `[GiftCard] Using treasury: ${settleWallet.asset} on ${settleWallet.network}, address: ${trimmedAddress.slice(0, 10)}...`,
    )

    const feeCalc = calculateFee(valueUsd)

    let shift
    try {
      shift = await createFixedShift(
        {
          quoteId,
          settleAddress: trimmedAddress,
          refundAddress: refundAddress?.trim() || undefined,
        },
        userIp,
      )
    } catch (shiftError: any) {
      const errorMessage = shiftError?.message || String(shiftError)

      // Check if quote was already used
      if (errorMessage.includes("Quote has already been accepted") || errorMessage.includes("already been accepted")) {
        return NextResponse.json(
          {
            error: "This quote has expired or already been used. Please request a new quote.",
            code: "QUOTE_EXPIRED",
          },
          { status: 400 },
        )
      }

      throw shiftError
    }

    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year expiry

    let passwordHash = null
    if (password && password.trim()) {
      passwordHash = await hashPassword(password.trim())
    }

    const { data: giftCard, error: insertError } = await supabase
      .from("gift_cards")
      .insert({
        code: displayCode,
        secret_code: secretCode,
        value_usd: valueUsd,
        platform_fee: feeCalc.platformFee,
        total_paid: feeCalc.totalCost,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        sender_name: senderName || null,
        message: message || null,
        design: design || "obsidian",
        created_by: user?.id || null,
        payment_crypto: paymentCrypto?.toUpperCase(),
        payment_network: paymentNetwork,
        payment_amount: shift.depositAmount ? Number.parseFloat(shift.depositAmount) : null,
        payment_shift_id: shift.id,
        payment_deposit_address: shift.depositAddress,
        payment_deposit_memo: shift.depositMemo || null,
        payment_quote_id: quoteId,
        status: "pending", // Use "pending" which is in the allowed status list
        expires_at: expiresAt.toISOString(),
        password_hash: passwordHash,
        is_anonymous: isAnonymous === true,
      })
      .select("id, code, secret_code")
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({ error: "Failed to create gift card" }, { status: 500 })
    }

    // Create transaction record
    await supabase.from("transactions").insert({
      gift_card_id: giftCard.id,
      type: "purchase",
      sideshift_id: shift.id,
      quote_id: quoteId,
      deposit_coin: paymentCrypto?.toLowerCase(),
      deposit_network: paymentNetwork,
      deposit_amount: shift.depositAmount ? Number.parseFloat(shift.depositAmount) : null,
      settle_coin: settleWallet.asset,
      settle_network: settleWallet.network,
      settle_amount: null,
      status: "waiting",
    })

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: displayCode,
        password: password || null,
      },
      fees: {
        cardValue: valueUsd,
        platformFee: feeCalc.platformFee,
        totalCost: feeCalc.totalCost,
      },
      shift: {
        id: shift.id,
        depositAddress: shift.depositAddress,
        depositMemo: shift.depositMemo,
        depositAmount: shift.depositAmount,
        settleAmount: shift.settleAmount,
        expiresAt: shift.expiresAt,
        status: shift.status,
      },
    })
  } catch (error) {
    console.error("Failed to create gift card:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create gift card" },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: giftCards, error } = await supabase
      .from("gift_cards")
      .select("id, code, value_usd, design, status, recipient_name, recipient_email, created_at, expires_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch gift cards" }, { status: 500 })
    }

    return NextResponse.json({ giftCards })
  } catch (error) {
    console.error("Failed to fetch gift cards:", error)
    return NextResponse.json({ error: "Failed to fetch gift cards" }, { status: 500 })
  }
}
