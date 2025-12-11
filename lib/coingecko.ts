// CoinGecko API helper for getting USD prices of cryptocurrencies

// Mapping of coin symbols to CoinGecko IDs
const COINGECKO_ID_MAP: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  bnb: "binancecoin",
  sol: "solana",
  xrp: "ripple",
  ada: "cardano",
  doge: "dogecoin",
  matic: "matic-network",
  pol: "matic-network",
  dot: "polkadot",
  avax: "avalanche-2",
  link: "chainlink",
  ltc: "litecoin",
  bch: "bitcoin-cash",
  xlm: "stellar",
  atom: "cosmos",
  near: "near",
  apt: "aptos",
  arb: "arbitrum",
  op: "optimism",
  sui: "sui",
  sei: "sei-network",
  inj: "injective-protocol",
  tia: "celestia",
  ton: "the-open-network",
  trx: "tron",
  ftm: "fantom",
  mon: "monad-xyz",
  monad: "monad-xyz",
  usdt: "tether",
  usdc: "usd-coin",
  dai: "dai",
  busd: "binance-usd",
}

const FALLBACK_PRICES: Record<string, number> = {
  mon: 0.026, // Approximate MON price - update this periodically
  monad: 0.026,
}

// Cache for prices (5 minute TTL)
const priceCache: Map<string, { price: number; timestamp: number }> = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getCoinUsdPrice(coinSymbol: string): Promise<number | null> {
  if (!coinSymbol) {
    console.log(`[CoinGecko] Coin symbol is undefined or null`)
    return null
  }

  const symbol = coinSymbol.toLowerCase()

  // Check cache first
  const cached = priceCache.get(symbol)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[CoinGecko] Using cached price for ${symbol}: $${cached.price}`)
    return cached.price
  }

  const coinId = COINGECKO_ID_MAP[symbol]
  if (!coinId) {
    const fallbackPrice = FALLBACK_PRICES[symbol]
    if (fallbackPrice) {
      console.log(`[CoinGecko] Using fallback price for ${symbol}: $${fallbackPrice}`)
      priceCache.set(symbol, { price: fallbackPrice, timestamp: Date.now() })
      return fallbackPrice
    }
    console.log(`[CoinGecko] No CoinGecko ID mapping for ${symbol}`)
    return null
  }

  try {
    // CoinGecko free API (no API key required, but rate limited)
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds at edge
    })

    if (!response.ok) {
      console.log(`[CoinGecko] API error for ${coinId}:`, response.status)
      const fallbackPrice = FALLBACK_PRICES[symbol]
      if (fallbackPrice) {
        console.log(`[CoinGecko] Using fallback price for ${symbol}: $${fallbackPrice}`)
        return fallbackPrice
      }
      return null
    }

    const data = await response.json()
    const price = data[coinId]?.usd

    if (price) {
      // Update cache
      priceCache.set(symbol, { price, timestamp: Date.now() })
      console.log(`[CoinGecko] Got price for ${symbol}: $${price}`)
      return price
    }

    const fallbackPrice = FALLBACK_PRICES[symbol]
    if (fallbackPrice) {
      console.log(`[CoinGecko] API returned no price, using fallback for ${symbol}: $${fallbackPrice}`)
      priceCache.set(symbol, { price: fallbackPrice, timestamp: Date.now() })
      return fallbackPrice
    }

    return null
  } catch (error) {
    console.error(`[CoinGecko] Error fetching price for ${symbol}:`, error)
    const fallbackPrice = FALLBACK_PRICES[symbol]
    if (fallbackPrice) {
      console.log(`[CoinGecko] Using fallback price for ${symbol}: $${fallbackPrice}`)
      return fallbackPrice
    }
    return null
  }
}

// Convert USD amount to coin amount
export async function usdToCoinAmount(usdAmount: number, coinSymbol: string): Promise<number | null> {
  if (!coinSymbol) return null

  const price = await getCoinUsdPrice(coinSymbol)
  if (!price || price <= 0) return null

  return usdAmount / price
}

// Convert coin amount to USD
export async function coinToUsdAmount(coinAmount: number, coinSymbol: string): Promise<number | null> {
  if (!coinSymbol) return null

  const price = await getCoinUsdPrice(coinSymbol)
  if (!price || price <= 0) return null

  return coinAmount * price
}
