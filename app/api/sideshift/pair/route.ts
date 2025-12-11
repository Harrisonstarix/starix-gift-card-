import { type NextRequest, NextResponse } from "next/server"
import { getPair } from "@/lib/sideshift"
import { getTreasuryConfig } from "@/lib/sideshift-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromCoin, fromNetwork } = body

    if (!fromCoin) {
      return NextResponse.json({ error: "fromCoin is required" }, { status: 400 })
    }

    if (!fromNetwork) {
      console.error(`[Pair] Missing network for coin: ${fromCoin}`)
      return NextResponse.json({ error: `Network is required for ${fromCoin}` }, { status: 400 })
    }

    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfIp = request.headers.get("cf-connecting-ip")
    let userIp = forwardedFor?.split(",")[0]?.trim() || realIp || cfIp || ""

    if (!userIp || userIp === "127.0.0.1" || userIp === "::1") {
      userIp = ""
    }

    const treasury = await getTreasuryConfig()
    if (!treasury) {
      return NextResponse.json(
        {
          error: "Treasury not configured",
          min: "0.001",
          max: "10000",
          rate: "0",
          fallback: true,
        },
        { status: 500 },
      )
    }

    const merchantCoin = treasury.coin
    const merchantNetwork = treasury.network

    console.log(`[Pair] Request: ${fromCoin}-${fromNetwork} -> ${merchantCoin}-${merchantNetwork}`)

    // Check if same coin (no conversion needed)
    if (
      fromCoin.toLowerCase() === merchantCoin.toLowerCase() &&
      fromNetwork.toLowerCase() === merchantNetwork.toLowerCase()
    ) {
      // Return mock data - no conversion needed
      return NextResponse.json({
        min: "1",
        max: "100000",
        rate: "1",
        depositCoin: fromCoin.toLowerCase(),
        settleCoin: merchantCoin,
        depositNetwork: fromNetwork,
        settleNetwork: merchantNetwork,
        sameAsSettle: true,
        message: "Direct payment - no conversion needed",
      })
    }

    const pair = await getPair(fromCoin.toLowerCase(), fromNetwork, merchantCoin, merchantNetwork, userIp)

    return NextResponse.json({
      min: pair.min,
      max: pair.max,
      rate: pair.rate,
      depositCoin: pair.depositCoin,
      settleCoin: pair.settleCoin,
      depositNetwork: pair.depositNetwork,
      settleNetwork: pair.settleNetwork,
    })
  } catch (error) {
    console.error("Pair info error:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get pair info",
        // Provide fallback so UI doesn't break completely
        min: "0.001",
        max: "10000",
        rate: "0",
        fallback: true,
      },
      { status: 500 },
    )
  }
}
