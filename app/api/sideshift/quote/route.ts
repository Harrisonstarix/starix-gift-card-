import { type NextRequest, NextResponse } from "next/server"
import { requestQuote } from "@/lib/sideshift"
import { getTreasuryConfig } from "@/lib/sideshift-server"
import { getCoinUsdPrice } from "@/lib/coingecko"

const STABLECOINS = ["usdt", "usdc", "dai", "busd", "tusd", "usdp", "gusd", "frax", "lusd", "susd"]

function isStablecoin(coin: string): boolean {
  return STABLECOINS.includes(coin.toLowerCase())
}

function formatAmount(amount: number, coin: string): string {
  const maxDecimals = 6
  return amount.toFixed(maxDecimals)
}

function calculateRate(
  depositAmount: string | number | undefined,
  settleAmount: string | number | undefined,
  depositCoin: string,
  settleCoin: string,
): string {
  const deposit = typeof depositAmount === "string" ? Number.parseFloat(depositAmount) : Number(depositAmount || 0)
  const settle = typeof settleAmount === "string" ? Number.parseFloat(settleAmount) : Number(settleAmount || 0)

  if (deposit <= 0 || settle <= 0) return "0"

  // Rate = how much 1 deposit coin is worth in settle coin
  // If settle is USD-based, rate is USD per deposit coin
  if (isStablecoin(settleCoin)) {
    return (settle / deposit).toFixed(6)
  }
  // Otherwise it's a ratio
  return (settle / deposit).toFixed(6)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { depositCoin, depositNetwork, settleCoin, settleNetwork, depositAmount, settleAmount, type } = body

    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfIp = request.headers.get("cf-connecting-ip")
    let userIp = forwardedFor?.split(",")[0]?.trim() || realIp || cfIp || ""

    if (!userIp || userIp === "127.0.0.1" || userIp === "::1") {
      userIp = ""
    }

    console.log("[Quote] User IP:", userIp || "(using default)")

    if (!depositAmount && !settleAmount) {
      return NextResponse.json({ error: "Either depositAmount or settleAmount is required" }, { status: 400 })
    }

    const treasury = await getTreasuryConfig()

    let finalDepositCoin = depositCoin
    let finalDepositNetwork = depositNetwork
    let finalSettleCoin = settleCoin
    let finalSettleNetwork = settleNetwork
    let finalDepositAmount = depositAmount || undefined
    let finalSettleAmount = settleAmount || undefined

    if (type === "redemption") {
      if (treasury) {
        finalDepositCoin = treasury.coin
        finalDepositNetwork = treasury.network
      }

      if (treasury && !isStablecoin(treasury.coin)) {
        const usdValue = Number.parseFloat(depositAmount || settleAmount || "0")

        if (usdValue > 0) {
          const treasuryUsdPrice = await getCoinUsdPrice(treasury.coin)

          if (treasuryUsdPrice && treasuryUsdPrice > 0) {
            const treasuryCoinAmount = usdValue / treasuryUsdPrice
            finalDepositAmount = formatAmount(treasuryCoinAmount, treasury.coin)
            finalSettleAmount = undefined
            console.log(
              `[Quote] Non-stablecoin treasury redemption (${treasury.coin}): $${usdValue} USD = ${finalDepositAmount} ${treasury.coin} (price: $${treasuryUsdPrice})`,
            )
          } else {
            console.log(`[Quote] Could not get CoinGecko price for ${treasury.coin}, using settleAmount fallback`)
            finalSettleAmount = formatAmount(usdValue, "usd")
            finalDepositAmount = undefined
          }
        }
      } else {
        finalDepositAmount = depositAmount || undefined
        finalSettleAmount = undefined
      }
    } else {
      if (!finalSettleCoin || !finalSettleNetwork) {
        if (treasury) {
          finalSettleCoin = treasury.coin
          finalSettleNetwork = treasury.network
        } else {
          return NextResponse.json({ error: "Treasury not configured" }, { status: 500 })
        }
      }

      if (treasury && !isStablecoin(treasury.coin)) {
        const usdValue = Number.parseFloat(settleAmount || "0")

        if (usdValue > 0) {
          const treasuryUsdPrice = await getCoinUsdPrice(treasury.coin)

          if (treasuryUsdPrice && treasuryUsdPrice > 0) {
            const treasuryCoinAmount = usdValue / treasuryUsdPrice
            finalSettleAmount = formatAmount(treasuryCoinAmount, treasury.coin)
            finalDepositAmount = undefined
            console.log(
              `[Quote] Non-stablecoin treasury deposit (${treasury.coin}): $${usdValue} USD = ${finalSettleAmount} ${treasury.coin} (price: $${treasuryUsdPrice})`,
            )
          } else {
            console.log(`[Quote] Could not get CoinGecko price for ${treasury.coin}, using direct amount`)
            finalSettleAmount = formatAmount(Number(settleAmount), "usd")
            finalDepositAmount = undefined
          }
        }
      } else {
        finalSettleAmount = settleAmount ? formatAmount(Number(settleAmount), "usd") : undefined
        finalDepositAmount = undefined
      }
    }

    if (!finalDepositCoin || !finalDepositNetwork) {
      return NextResponse.json({ error: "depositCoin and depositNetwork are required" }, { status: 400 })
    }

    if (!finalSettleCoin || !finalSettleNetwork) {
      return NextResponse.json({ error: "settleCoin and settleNetwork are required" }, { status: 400 })
    }

    if (
      finalDepositCoin.toLowerCase() === finalSettleCoin.toLowerCase() &&
      finalDepositNetwork.toLowerCase() === finalSettleNetwork.toLowerCase()
    ) {
      const amount = settleAmount || depositAmount
      return NextResponse.json({
        id: `direct${Date.now()}`,
        depositCoin: finalDepositCoin.toLowerCase(),
        depositNetwork: finalDepositNetwork,
        settleCoin: finalSettleCoin,
        settleNetwork: finalSettleNetwork,
        depositAmount: amount,
        settleAmount: amount,
        rate: "1",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        isDirect: true,
      })
    }

    console.log("[Quote] Requesting quote:", {
      depositCoin: finalDepositCoin,
      depositNetwork: finalDepositNetwork,
      settleCoin: finalSettleCoin,
      settleNetwork: finalSettleNetwork,
      depositAmount: finalDepositAmount,
      settleAmount: finalSettleAmount,
      type,
    })

    const quote = await requestQuote(
      {
        depositCoin: finalDepositCoin.toLowerCase(),
        depositNetwork: finalDepositNetwork,
        settleCoin: finalSettleCoin.toLowerCase(),
        settleNetwork: finalSettleNetwork,
        depositAmount: finalDepositAmount,
        settleAmount: finalSettleAmount,
      },
      userIp,
    )

    let rate = quote.rate
    if (!rate || rate === "0" || rate === "" || isNaN(Number(rate))) {
      rate = calculateRate(quote.depositAmount, quote.settleAmount, finalDepositCoin, finalSettleCoin)
      console.log(`[Quote] Calculated rate from amounts: ${rate}`)
    }

    return NextResponse.json({
      id: quote.id,
      depositCoin: quote.depositCoin,
      depositNetwork: quote.depositNetwork,
      settleCoin: quote.settleCoin,
      settleNetwork: quote.settleNetwork,
      depositAmount: quote.depositAmount || "0",
      settleAmount: quote.settleAmount || "0",
      rate: rate || "0",
      expiresAt: quote.expiresAt,
    })
  } catch (error) {
    console.error("Quote error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to get quote" }, { status: 500 })
  }
}
