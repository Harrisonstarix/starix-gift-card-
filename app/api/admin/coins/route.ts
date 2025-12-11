import { type NextRequest, NextResponse } from "next/server"
import { getCoins, getCoinIconUrl } from "@/lib/sideshift"
import { getTreasuryConfig } from "@/lib/sideshift-server"

// GET - Fetch all coins from SideShift directly
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const excludeTreasury = searchParams.get("excludeTreasury") === "true"

    // Always fetch fresh from SideShift
    const liveCoins = await getCoins()

    // Get treasury config if we need to filter
    let treasuryCoin: string | null = null
    let treasuryNetwork: string | null = null

    if (excludeTreasury) {
      const treasury = await getTreasuryConfig()
      if (treasury) {
        treasuryCoin = treasury.coin.toLowerCase()
        treasuryNetwork = treasury.network.toLowerCase()
      }
    }

    // Map SideShift coins to our format - each coin+network combo is a unique option
    const allCoins: Array<{
      id: string
      name: string
      symbol: string
      network: string
      networks: string[]
      icon: string
      hasMemo: boolean
      depositOffline: boolean
      settleOffline: boolean
    }> = []

    for (const coin of liveCoins) {
      const coinId = coin.coin.toLowerCase()

      // Skip if completely offline
      if (coin.depositOffline === true && coin.settleOffline === true) continue

      // Create an entry for each network this coin supports
      for (const network of coin.networks) {
        // Check if this specific coin+network combo should be excluded (treasury)
        if (excludeTreasury && coinId === treasuryCoin && network === treasuryNetwork) {
          continue
        }

        // Check if deposit is offline for this network
        const depositOffline = Array.isArray(coin.depositOffline)
          ? coin.depositOffline.includes(network)
          : coin.depositOffline === true

        // Check if settle is offline for this network
        const settleOffline = Array.isArray(coin.settleOffline)
          ? coin.settleOffline.includes(network)
          : coin.settleOffline === true

        allCoins.push({
          id: coinId,
          name: coin.name,
          symbol: coin.coin.toUpperCase(),
          network,
          networks: coin.networks,
          icon: getCoinIconUrl(coinId, network),
          hasMemo: coin.networksWithMemo?.includes(network) || coin.hasMemo || false,
          depositOffline,
          settleOffline,
        })
      }
    }

    // Sort by popularity
    const priorityCoins = ["btc", "eth", "usdt", "usdc", "sol", "xrp", "ltc", "doge", "bnb", "trx", "avax", "matic"]
    allCoins.sort((a, b) => {
      const aIdx = priorityCoins.indexOf(a.id)
      const bIdx = priorityCoins.indexOf(b.id)
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return a.name.localeCompare(b.name)
    })

    const treasury = await getTreasuryConfig()

    return NextResponse.json({
      coins: allCoins,
      total: allCoins.length,
      treasury: treasury ? { coin: treasury.coin, network: treasury.network } : null,
    })
  } catch (error) {
    console.error("Failed to fetch coins:", error)
    return NextResponse.json({ coins: [], total: 0, error: "Failed to fetch coins" }, { status: 500 })
  }
}
