import { NextResponse } from "next/server"
import { getCoins, getCoinIconUrl } from "@/lib/sideshift"
import { getTreasuryConfig } from "@/lib/sideshift-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const excludeTreasury = searchParams.get("excludeTreasury") === "true"
    const forDeposit = searchParams.get("forDeposit") === "true"
    const forSettle = searchParams.get("forSettle") === "true"

    const liveCoins = await getCoins()

    // Get treasury config
    let treasuryCoin: string | null = null
    let treasuryNetwork: string | null = null
    const treasury = await getTreasuryConfig()

    if (treasury) {
      treasuryCoin = treasury.coin.toLowerCase()
      treasuryNetwork = treasury.network.toLowerCase()
    }

    // Map each coin+network as a unique entry
    const allCoins: Array<{
      id: string
      name: string
      symbol: string
      network: string
      networkName: string
      icon: string
      hasMemo: boolean
      isTreasury: boolean
      canDeposit: boolean
      canSettle: boolean
    }> = []

    // Network display names
    const networkNames: Record<string, string> = {
      bitcoin: "Bitcoin",
      ethereum: "Ethereum (ERC20)",
      tron: "Tron (TRC20)",
      bsc: "BNB Smart Chain (BEP20)",
      solana: "Solana",
      polygon: "Polygon",
      avalanche: "Avalanche C-Chain",
      arbitrum: "Arbitrum One",
      optimism: "Optimism",
      base: "Base",
      litecoin: "Litecoin",
      dogecoin: "Dogecoin",
      ripple: "XRP Ledger",
      stellar: "Stellar",
      monero: "Monero",
      ton: "TON",
      near: "NEAR",
      cosmos: "Cosmos",
      algorand: "Algorand",
      fantom: "Fantom",
    }

    for (const coin of liveCoins) {
      const coinId = coin.coin.toLowerCase()

      for (const network of coin.networks) {
        const isTreasury = coinId === treasuryCoin && network === treasuryNetwork

        // Check deposit/settle availability
        const depositOffline = Array.isArray(coin.depositOffline)
          ? coin.depositOffline.includes(network)
          : coin.depositOffline === true
        const settleOffline = Array.isArray(coin.settleOffline)
          ? coin.settleOffline.includes(network)
          : coin.settleOffline === true

        const canDeposit = !depositOffline
        const canSettle = !settleOffline

        // Apply filters
        if (excludeTreasury && isTreasury) continue
        if (forDeposit && !canDeposit) continue
        if (forSettle && !canSettle) continue

        allCoins.push({
          id: coinId,
          name: coin.name,
          symbol: coin.coin.toUpperCase(),
          network,
          networkName: networkNames[network] || network.charAt(0).toUpperCase() + network.slice(1),
          icon: getCoinIconUrl(coinId, network),
          hasMemo: coin.networksWithMemo?.includes(network) || coin.hasMemo || false,
          isTreasury,
          canDeposit,
          canSettle,
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

    return NextResponse.json({
      coins: allCoins,
      total: allCoins.length,
      treasury: treasury ? { coin: treasury.coin, network: treasury.network } : null,
    })
  } catch (error) {
    console.error("Coins fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch coins from SideShift", coins: [], total: 0 }, { status: 500 })
  }
}
