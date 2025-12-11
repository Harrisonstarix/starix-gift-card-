import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { getTreasuryConfig } from "@/lib/sideshift-server"
import { requestQuote, createFixedShift } from "@/lib/sideshift"
import { notifyDepositInitiated } from "@/lib/admin-notifications"
import { sendDepositEmail, notifyAdminDeposit } from "@/lib/email"
import { getCoinUsdPrice } from "@/lib/coingecko"

const STABLECOINS = ["usdt", "usdc", "dai", "busd", "tusd", "usdp", "gusd", "frax", "lusd", "susd"]

function isStablecoin(coin: string): boolean {
  return STABLECOINS.includes(coin.toLowerCase())
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { amount, depositCoin, depositNetwork, refundAddress } = body

    // Validate amount
    const amountNum = Number(amount)
    if (isNaN(amountNum) || amountNum < 5) {
      return NextResponse.json({ error: "Minimum deposit is $5" }, { status: 400 })
    }

    if (amountNum > 100000) {
      return NextResponse.json({ error: "Maximum deposit is $100,000" }, { status: 400 })
    }

    if (!refundAddress?.trim()) {
      return NextResponse.json({ error: "Refund address is required" }, { status: 400 })
    }

    const treasury = await getTreasuryConfig()
    if (!treasury) {
      return NextResponse.json({ error: "Treasury wallet not configured. Contact support." }, { status: 500 })
    }

    // Prevent depositing the same coin as treasury
    if (
      depositCoin.toLowerCase() === treasury.coin.toLowerCase() &&
      depositNetwork.toLowerCase() === treasury.network.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: `Cannot deposit ${depositCoin.toUpperCase()} on ${depositNetwork} as it's the treasury settlement token. Please choose a different cryptocurrency.`,
        },
        { status: 400 },
      )
    }

    // Get user IP for SideShift
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfIp = request.headers.get("cf-connecting-ip")
    let userIp = forwardedFor?.split(",")[0]?.trim() || realIp || cfIp || ""
    if (userIp === "127.0.0.1" || userIp === "::1") {
      userIp = ""
    }

    let settleAmount: string

    if (!isStablecoin(treasury.coin)) {
      // Non-stablecoin treasury - convert USD to treasury coin amount
      const treasuryUsdPrice = await getCoinUsdPrice(treasury.coin)
      if (treasuryUsdPrice && treasuryUsdPrice > 0) {
        const treasuryCoinAmount = amountNum / treasuryUsdPrice
        settleAmount = treasuryCoinAmount.toFixed(8)
        console.log(`[Deposit] Non-stablecoin treasury: $${amountNum} = ${settleAmount} ${treasury.coin}`)
      } else {
        // Fallback - use USD amount directly (may be incorrect for non-stablecoins)
        settleAmount = amountNum.toFixed(2)
        console.warn(`[Deposit] Could not get price for ${treasury.coin}, using USD amount directly`)
      }
    } else {
      // Stablecoin treasury - 1:1 with USD
      settleAmount = amountNum.toFixed(2)
    }

    // Request fresh quote
    const quote = await requestQuote(
      {
        depositCoin: depositCoin.toLowerCase(),
        depositNetwork,
        settleCoin: treasury.coin,
        settleNetwork: treasury.network,
        settleAmount,
      },
      userIp,
    )

    if (!quote || !quote.id) {
      return NextResponse.json({ error: "Failed to get quote from exchange" }, { status: 500 })
    }

    const shift = await createFixedShift(
      {
        quoteId: quote.id,
        settleAddress: treasury.address,
        refundAddress: refundAddress.trim(),
      },
      userIp,
    )

    if (!shift || !shift.id) {
      return NextResponse.json({ error: "Failed to create payment shift" }, { status: 500 })
    }

    // Parse deposit amount safely
    const depositAmount =
      typeof quote.depositAmount === "string"
        ? Number.parseFloat(quote.depositAmount)
        : typeof quote.depositAmount === "number"
          ? quote.depositAmount
          : 0

    // Calculate rate safely
    const settleAmountNum =
      typeof quote.settleAmount === "string"
        ? Number.parseFloat(quote.settleAmount)
        : typeof quote.settleAmount === "number"
          ? quote.settleAmount
          : amountNum

    const rate = depositAmount > 0 ? settleAmountNum / depositAmount : 0

    // Record the pending deposit
    const { data: deposit, error: insertError } = await supabase
      .from("deposits")
      .insert({
        user_id: user.id,
        amount_usd: amountNum,
        deposit_coin: depositCoin.toUpperCase(),
        deposit_network: depositNetwork,
        deposit_amount: isNaN(depositAmount) ? 0 : depositAmount,
        shift_id: shift.id,
        quote_id: quote.id,
        deposit_address: shift.depositAddress,
        deposit_memo: shift.depositMemo || null,
        refund_address: refundAddress.trim(),
        status: "pending",
        expires_at: shift.expiresAt,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Failed to record deposit:", insertError)
    }

    // Send notifications (non-blocking)
    const emailData = {
      userEmail: user.email || "Unknown",
      amount: amountNum,
      depositCoin: depositCoin.toUpperCase(),
      depositNetwork,
      depositAddress: shift.depositAddress,
      depositAmount: String(depositAmount || 0),
      status: "initiated" as const,
    }

    if (user.email) {
      sendDepositEmail(user.email, emailData).catch(console.error)
    }
    notifyAdminDeposit(emailData).catch(console.error)

    if (deposit) {
      notifyDepositInitiated(
        user.id,
        user.email || "Unknown",
        amountNum,
        depositCoin,
        depositNetwork,
        deposit.id,
      ).catch(console.error)
    }

    return NextResponse.json({
      shift: {
        id: shift.id,
        depositAddress: shift.depositAddress,
        depositMemo: shift.depositMemo,
        depositAmount: String(depositAmount || 0),
        settleAmount: String(settleAmountNum || amountNum),
        expiresAt: shift.expiresAt,
        status: shift.status,
      },
      quote: {
        rate: String(rate || 0),
        depositCoin: quote.depositCoin || depositCoin,
        settleCoin: quote.settleCoin || treasury.coin,
      },
      treasury: {
        coin: treasury.coin.toUpperCase(),
        network: treasury.network,
      },
    })
  } catch (error) {
    console.error("Deposit creation error:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to create deposit"

    if (errorMessage.includes("Quote has already been accepted")) {
      return NextResponse.json({ error: "Quote expired. Please try again.", code: "QUOTE_EXPIRED" }, { status: 400 })
    }

    if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again.", code: "RATE_LIMITED" },
        { status: 429 },
      )
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
