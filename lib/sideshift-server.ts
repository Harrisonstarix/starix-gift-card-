// ============================================================
// SIDESHIFT SERVER-ONLY FUNCTIONS
// These functions access the database and must only be used in API routes
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { requestQuote, createFixedShift, getShift, type SideshiftQuote, type SideshiftShift } from "./sideshift"
import { getCoinUsdPrice } from "./coingecko"

// Fallback env vars
const MERCHANT_WALLET = process.env.MERCHANT_WALLET_ADDRESS || ""
const DEFAULT_SETTLE_COIN = process.env.MERCHANT_SETTLE_COIN || "usdt"
const DEFAULT_SETTLE_NETWORK = process.env.MERCHANT_SETTLE_NETWORK || "tron"

export interface TreasuryConfig {
  coin: string
  network: string
  address: string
}

/**
 * Get treasury wallet configuration from database
 * This should be called to get the actual configured treasury
 * SERVER-SIDE ONLY
 */
export async function getTreasuryConfig(): Promise<TreasuryConfig | null> {
  try {
    const supabase = await createClient()

    const { data: wallets, error } = await supabase
      .from("admin_wallets")
      .select("asset, network, address")
      .eq("is_primary", true)
      .limit(1)

    if (error || !wallets || wallets.length === 0) {
      console.log("[Treasury] No DB wallet found, falling back to env vars")
      // Fall back to env vars
      if (MERCHANT_WALLET) {
        return {
          coin: DEFAULT_SETTLE_COIN,
          network: DEFAULT_SETTLE_NETWORK,
          address: MERCHANT_WALLET,
        }
      }
      return null
    }

    const wallet = wallets[0]
    if (!wallet.address?.trim() || !wallet.asset || !wallet.network) {
      console.error("[Treasury] Invalid wallet data in DB:", wallet)
      if (MERCHANT_WALLET) {
        return {
          coin: DEFAULT_SETTLE_COIN,
          network: DEFAULT_SETTLE_NETWORK,
          address: MERCHANT_WALLET,
        }
      }
      return null
    }

    return {
      coin: wallet.asset.toLowerCase(),
      network: wallet.network.toLowerCase(),
      address: wallet.address.trim(),
    }
  } catch (error) {
    console.error("Failed to get treasury config:", error)
    // Fall back to env vars
    if (MERCHANT_WALLET) {
      return {
        coin: DEFAULT_SETTLE_COIN,
        network: DEFAULT_SETTLE_NETWORK,
        address: MERCHANT_WALLET,
      }
    }
    return null
  }
}

/**
 * Check if a coin/network is the treasury token
 * Used to prevent same-coin shifts which SideShift doesn't support
 * SERVER-SIDE ONLY
 */
export async function isTreasuryToken(coin: string, network: string): Promise<boolean> {
  const treasury = await getTreasuryConfig()
  if (!treasury) return false
  return coin.toLowerCase() === treasury.coin.toLowerCase() && network.toLowerCase() === treasury.network.toLowerCase()
}

/**
 * Get a quote for buying a gift card - uses DB treasury config
 * User sends crypto, merchant receives treasury token
 * SERVER-SIDE ONLY
 */
export async function getPaymentQuoteWithTreasury(
  depositCoin: string,
  depositNetwork: string,
  settleAmountUsd: number,
  userIp: string,
): Promise<SideshiftQuote> {
  const treasury = await getTreasuryConfig()
  if (!treasury) {
    throw new Error("Treasury wallet not configured")
  }

  console.log(
    `[Quote] Payment: ${depositCoin}-${depositNetwork} -> ${treasury.coin}-${treasury.network} ($${settleAmountUsd})`,
  )

  if (!isStablecoin(treasury.coin)) {
    const treasuryUsdPrice = await getCoinUsdPrice(treasury.coin)

    if (treasuryUsdPrice && treasuryUsdPrice > 0) {
      // Convert USD value to treasury coin amount
      // If 1 BNB = $500, then $6 = 6/500 = 0.012 BNB
      const treasuryCoinAmount = settleAmountUsd / treasuryUsdPrice
      console.log(
        `[Quote] Non-stablecoin treasury payment (${treasury.coin}): $${settleAmountUsd} USD = ${treasuryCoinAmount.toFixed(8)} ${treasury.coin} (price: $${treasuryUsdPrice})`,
      )

      return requestQuote(
        {
          depositCoin: depositCoin.toLowerCase(),
          depositNetwork,
          settleCoin: treasury.coin,
          settleNetwork: treasury.network,
          settleAmount: treasuryCoinAmount.toFixed(8),
        },
        userIp,
      )
    } else {
      console.warn(
        `[Quote] Could not get CoinGecko price for treasury ${treasury.coin}, using direct amount (may be incorrect)`,
      )
    }
  }

  // Stablecoin treasury - original logic works (1 USDT = $1)
  return requestQuote(
    {
      depositCoin: depositCoin.toLowerCase(),
      depositNetwork,
      settleCoin: treasury.coin,
      settleNetwork: treasury.network,
      settleAmount: settleAmountUsd.toFixed(2),
    },
    userIp,
  )
}

/**
 * Create payment shift using treasury from DB
 * Removed externalId parameter - it's optional and was causing errors
 * SERVER-SIDE ONLY
 */
export async function createPaymentShiftWithTreasury(
  quoteId: string,
  refundAddress?: string,
  externalId?: string, // Keep param for backwards compat but don't use it
  userIp?: string,
): Promise<SideshiftShift> {
  const treasury = await getTreasuryConfig()
  if (!treasury) {
    throw new Error("Treasury wallet not configured")
  }

  console.log(`[Shift] Creating payment shift to treasury: ${treasury.address.slice(0, 10)}...`)

  return createFixedShift(
    {
      quoteId,
      settleAddress: treasury.address,
      refundAddress,
      // No externalId
    },
    userIp,
  )
}

const STABLECOINS = ["usdt", "usdc", "dai", "busd", "tusd", "usdp", "gusd", "frax", "lusd", "susd"]

function isStablecoin(coin: string): boolean {
  return STABLECOINS.includes(coin.toLowerCase())
}

/**
 * Get a quote for redeeming a gift card using treasury from DB
 * Merchant sends treasury token, user receives their chosen crypto
 * SERVER-SIDE ONLY
 */
export async function getRedemptionQuoteWithTreasury(
  settleCoin: string,
  settleNetwork: string,
  depositAmountUsd: number,
  userIp: string,
  existingQuoteId?: string, // Optional: use existing quote
): Promise<SideshiftQuote> {
  const treasury = await getTreasuryConfig()
  if (!treasury) {
    throw new Error("Treasury wallet not configured")
  }

  console.log(
    `[Quote] Redemption: ${treasury.coin}-${treasury.network} ($${depositAmountUsd}) -> ${settleCoin}-${settleNetwork}`,
  )
  console.log(`[Quote] User IP: ${userIp || "not provided"}`)

  if (!isStablecoin(treasury.coin)) {
    const treasuryUsdPrice = await getCoinUsdPrice(treasury.coin)

    if (treasuryUsdPrice && treasuryUsdPrice > 0) {
      const treasuryCoinAmount = depositAmountUsd / treasuryUsdPrice
      console.log(
        `[Quote] Non-stablecoin treasury redemption (${treasury.coin}): $${depositAmountUsd} USD = ${treasuryCoinAmount.toFixed(8)} ${treasury.coin} (price: $${treasuryUsdPrice})`,
      )

      return requestQuote(
        {
          depositCoin: treasury.coin,
          depositNetwork: treasury.network,
          settleCoin: settleCoin.toLowerCase(),
          settleNetwork,
          depositAmount: treasuryCoinAmount.toFixed(8),
        },
        userIp,
      )
    } else {
      console.warn(`[Quote] Could not get CoinGecko price for treasury ${treasury.coin}, using settleAmount fallback`)
      return requestQuote(
        {
          depositCoin: treasury.coin,
          depositNetwork: treasury.network,
          settleCoin: settleCoin.toLowerCase(),
          settleNetwork,
          settleAmount: depositAmountUsd.toFixed(2),
        },
        userIp,
      )
    }
  }

  // Stablecoin treasury - original logic
  return requestQuote(
    {
      depositCoin: treasury.coin,
      depositNetwork: treasury.network,
      settleCoin: settleCoin.toLowerCase(),
      settleNetwork,
      depositAmount: depositAmountUsd.toFixed(2),
    },
    userIp,
  )
}

/**
 * Create redemption shift using treasury from DB
 * Fixed parameter order - userIp is now 4th param, removed externalId
 * SERVER-SIDE ONLY
 */
export async function createRedemptionShiftWithTreasury(
  quoteId: string,
  settleAddress: string,
  settleMemo?: string,
  userIp?: string, // Moved userIp to 4th position
): Promise<SideshiftShift> {
  const treasury = await getTreasuryConfig()
  if (!treasury) {
    throw new Error("Treasury wallet not configured - refund address needed")
  }

  console.log(`[Shift] Creating redemption shift to user: ${settleAddress.slice(0, 10)}...`)
  console.log(`[Shift] User IP for redemption: ${userIp || "not provided"}`)

  return createFixedShift(
    {
      quoteId,
      settleAddress,
      settleMemo,
      refundAddress: treasury.address, // Use treasury as refund address
    },
    userIp,
  )
}

/**
 * Get the status of a shift by ID
 * Wrapper around getShift for easier status checking
 * SERVER-SIDE ONLY
 */
export async function getShiftStatus(shiftId: string): Promise<{
  status: string
  settleAmount?: string
  settleHash?: string
  depositAmount?: string
  depositHash?: string
}> {
  const shift = await getShift(shiftId)

  // Get deposit info if available
  const deposit = shift.deposits?.[0]

  return {
    status: shift.status,
    settleAmount: shift.settleAmount,
    settleHash: deposit?.settleHash,
    depositAmount: shift.depositAmount,
    depositHash: deposit?.depositHash,
  }
}
