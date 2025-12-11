// ============================================================
// SIDESHIFT API INTEGRATION - COMPLETE REFERENCE
// Docs: https://docs.sideshift.ai/
// NOTE: This file is safe to import in client components
// For treasury functions, use @/lib/sideshift-server (server-only)
// ============================================================

const SIDESHIFT_API_URL = "https://sideshift.ai/api/v2"

// Get these from your SideShift account
const SIDESHIFT_SECRET = process.env.SIDESHIFT_SECRET || ""
const SIDESHIFT_AFFILIATE_ID = process.env.SIDESHIFT_AFFILIATE_ID || ""

// Your merchant wallet to receive payments (USDT on Tron is cheapest)
const MERCHANT_WALLET = process.env.MERCHANT_WALLET_ADDRESS || ""

const DEFAULT_SETTLE_COIN = process.env.MERCHANT_SETTLE_COIN || "usdt"
const DEFAULT_SETTLE_NETWORK = process.env.MERCHANT_SETTLE_NETWORK || "tron"

// ============================================================
// SUPPORTED CRYPTOCURRENCIES - Fallback list
// ============================================================
export interface SupportedCrypto {
  id: string
  name: string
  symbol: string
  network: string
  icon: string
  color: string
  hasMemo?: boolean
}

export const SUPPORTED_CRYPTOS: SupportedCrypto[] = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", network: "bitcoin", icon: "₿", color: "#F7931A" },
  { id: "eth", name: "Ethereum", symbol: "ETH", network: "ethereum", icon: "Ξ", color: "#627EEA" },
  { id: "usdt", name: "Tether", symbol: "USDT", network: "tron", icon: "$", color: "#26A17B" },
  { id: "usdc", name: "USD Coin", symbol: "USDC", network: "ethereum", icon: "$", color: "#2775CA" },
  { id: "ltc", name: "Litecoin", symbol: "LTC", network: "litecoin", icon: "Ł", color: "#BFBBBB" },
  { id: "xmr", name: "Monero", symbol: "XMR", network: "monero", icon: "ɱ", color: "#FF6600" },
  { id: "sol", name: "Solana", symbol: "SOL", network: "solana", icon: "◎", color: "#9945FF" },
  { id: "doge", name: "Dogecoin", symbol: "DOGE", network: "dogecoin", icon: "Ð", color: "#C2A633" },
  { id: "trx", name: "Tron", symbol: "TRX", network: "tron", icon: "₮", color: "#FF0013" },
  { id: "xrp", name: "Ripple", symbol: "XRP", network: "ripple", icon: "✕", color: "#23292F", hasMemo: true },
  { id: "bnb", name: "BNB", symbol: "BNB", network: "bsc", icon: "◆", color: "#F3BA2F" },
  { id: "avax", name: "Avalanche", symbol: "AVAX", network: "avax", icon: "△", color: "#E84142" },
  { id: "bch", name: "Bitcoin Cash", symbol: "BCH", network: "bitcoincash", icon: "₿", color: "#8DC351" },
  { id: "xlm", name: "Stellar", symbol: "XLM", network: "stellar", icon: "*", color: "#14B6E7", hasMemo: true },
  { id: "dash", name: "Dash", symbol: "DASH", network: "dash", icon: "D", color: "#008CE7" },
]

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface SideshiftCoin {
  coin: string
  name: string
  hasMemo: boolean
  fixedOnly: boolean | string[]
  variableOnly: boolean | string[]
  networks: string[]
  networksWithMemo: string[]
  tokenDetails?: Record<string, { network: string; contractAddress: string; decimals: number }>
  depositOffline?: boolean | string[]
  settleOffline?: boolean | string[]
}

export interface SideshiftPair {
  min: string
  max: string
  rate: string
  depositCoin: string
  settleCoin: string
  depositNetwork: string
  settleNetwork: string
}

export interface SideshiftQuote {
  id: string
  createdAt: string
  depositCoin: string
  settleCoin: string
  depositNetwork: string
  settleNetwork: string
  expiresAt: string
  depositAmount: string
  settleAmount: string
  rate: string
  affiliateId?: string
}

export interface SideshiftShift {
  id: string
  createdAt: string
  depositCoin: string
  settleCoin: string
  depositNetwork: string
  settleNetwork: string
  depositAddress: string
  depositMemo?: string
  settleAddress: string
  settleMemo?: string
  depositMin: string
  depositMax: string
  refundAddress?: string
  refundMemo?: string
  type: "fixed" | "variable"
  quoteId?: string
  depositAmount?: string
  settleAmount?: string
  expiresAt: string
  status: SideshiftStatus
  rate: string
  averageShiftSeconds?: string
  externalId?: string
  settleCoinNetworkFee?: string
  networkFeeUsd?: string
  deposits?: SideshiftDeposit[]
}

export interface SideshiftDeposit {
  depositAmount: string
  depositHash?: string
  settleHash?: string
  status: SideshiftStatus
}

export type SideshiftStatus =
  | "waiting"
  | "pending"
  | "processing"
  | "review"
  | "settling"
  | "settled"
  | "refund"
  | "refunded"
  | "expired"
  | "multiple"

export interface SideshiftPermissions {
  createShift: boolean
}

export interface SideshiftCheckout {
  id: string
  settleCoin: string
  settleNetwork: string
  settleAddress: string
  settleMemo?: string
  settleAmount: string
  updatedAt: string
  createdAt: string
  affiliateId: string
  successUrl: string
  cancelUrl: string
  orders?: { id: string; deposits: { depositHash?: string; settleHash?: string }[] }[]
}

// ============================================================
// API HELPER
// ============================================================

async function sideshiftRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>,
  userIp?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  if (SIDESHIFT_SECRET) {
    headers["x-sideshift-secret"] = SIDESHIFT_SECRET
  }

  // Use a default non-localhost IP if none provided (SideShift blocks 127.0.0.1)
  const effectiveIp = userIp && userIp !== "127.0.0.1" && userIp !== "::1" ? userIp : "8.8.8.8"
  headers["x-user-ip"] = effectiveIp

  const url = `${SIDESHIFT_API_URL}${endpoint}`
  console.log(`[SideShift] ${method} ${url}`, body ? JSON.stringify(body) : "")

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  const text = await response.text()

  if (!response.ok) {
    console.error(`[SideShift] Error: ${response.status} - ${text}`)
    let error
    try {
      error = JSON.parse(text)
    } catch {
      error = { error: { message: text } }
    }
    throw new Error(error.error?.message || `SideShift API error: ${response.status}`)
  }

  return JSON.parse(text) as T
}

// ============================================================
// COINS API - GET /v2/coins
// ============================================================

export async function getCoins(): Promise<SideshiftCoin[]> {
  return sideshiftRequest<SideshiftCoin[]>("/coins")
}

// ============================================================
// COIN ICON API
// ============================================================

export function getCoinIconUrl(coin: string, network?: string): string {
  const path = network ? `${coin}-${network}` : coin
  return `${SIDESHIFT_API_URL}/coins/icon/${path}`
}

// ============================================================
// PERMISSIONS API
// ============================================================

export async function checkPermissions(userIp: string): Promise<SideshiftPermissions> {
  return sideshiftRequest<SideshiftPermissions>("/permissions", "GET", undefined, userIp)
}

// ============================================================
// PAIR API - GET /v2/pair/:from/:to
// ============================================================

export async function getPair(
  fromCoin: string,
  fromNetwork: string,
  toCoin: string,
  toNetwork: string,
  userIp?: string,
): Promise<SideshiftPair> {
  const from = `${fromCoin}-${fromNetwork}`
  const to = `${toCoin}-${toNetwork}`
  const url = `/pair/${from}/${to}?affiliateId=${SIDESHIFT_AFFILIATE_ID}&commissionRate=0`
  return sideshiftRequest<SideshiftPair>(url, "GET", undefined, userIp)
}

// ============================================================
// REQUEST QUOTE API - POST /v2/quotes
// ============================================================

export async function requestQuote(
  params: {
    depositCoin: string
    depositNetwork: string
    settleCoin: string
    settleNetwork: string
    depositAmount?: string
    settleAmount?: string
    commissionRate?: string
  },
  userIp?: string,
): Promise<SideshiftQuote> {
  const requestBody: Record<string, unknown> = {
    depositCoin: params.depositCoin.toLowerCase(),
    depositNetwork: params.depositNetwork,
    settleCoin: params.settleCoin.toLowerCase(),
    settleNetwork: params.settleNetwork,
    affiliateId: SIDESHIFT_AFFILIATE_ID,
    commissionRate: params.commissionRate ?? "0",
  }

  // SideShift requires either depositAmount OR settleAmount, but not both null
  // One must be a string amount, the other should be null (not undefined)
  if (params.depositAmount) {
    requestBody.depositAmount = params.depositAmount
    requestBody.settleAmount = null
  } else if (params.settleAmount) {
    requestBody.settleAmount = params.settleAmount
    requestBody.depositAmount = null
  } else {
    throw new Error("Either depositAmount or settleAmount is required")
  }

  return sideshiftRequest<SideshiftQuote>("/quotes", "POST", requestBody, userIp)
}

// ============================================================
// GET SHIFT API
// ============================================================

export async function getShift(shiftId: string): Promise<SideshiftShift> {
  return sideshiftRequest<SideshiftShift>(`/shifts/${shiftId}`)
}

// ============================================================
// CREATE FIXED SHIFT API
// ============================================================

export async function createFixedShift(
  params: {
    quoteId: string
    settleAddress: string
    settleMemo?: string
    refundAddress?: string
    refundMemo?: string
    externalId?: string
  },
  userIp?: string,
): Promise<SideshiftShift> {
  const requestBody: Record<string, unknown> = {
    quoteId: params.quoteId,
    settleAddress: params.settleAddress.trim(),
    affiliateId: SIDESHIFT_AFFILIATE_ID,
  }

  // Only add optional fields if they have values
  if (params.settleMemo?.trim()) {
    requestBody.settleMemo = params.settleMemo.trim()
  }
  if (params.refundAddress?.trim()) {
    requestBody.refundAddress = params.refundAddress.trim()
  }
  if (params.refundMemo?.trim()) {
    requestBody.refundMemo = params.refundMemo.trim()
  }
  // SideShift may have restrictions on format, so we sanitize it
  if (params.externalId) {
    // Keep only alphanumeric characters and limit to 64 chars
    const sanitizedId = params.externalId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 64)
    if (sanitizedId.length > 0) {
      requestBody.externalId = sanitizedId
    }
  }

  return sideshiftRequest<SideshiftShift>("/shifts/fixed", "POST", requestBody, userIp)
}

// ============================================================
// CREATE VARIABLE SHIFT API
// ============================================================

export async function createVariableShift(
  params: {
    depositCoin: string
    depositNetwork: string
    settleCoin: string
    settleNetwork: string
    settleAddress: string
    settleMemo?: string
    refundAddress?: string
    refundMemo?: string
    externalId?: string
    commissionRate?: string
  },
  userIp?: string,
): Promise<SideshiftShift> {
  const requestBody: Record<string, unknown> = {
    depositCoin: params.depositCoin.toLowerCase(),
    depositNetwork: params.depositNetwork,
    settleCoin: params.settleCoin.toLowerCase(),
    settleNetwork: params.settleNetwork,
    settleAddress: params.settleAddress.trim(),
    affiliateId: SIDESHIFT_AFFILIATE_ID,
    commissionRate: params.commissionRate ?? "0",
  }

  if (params.settleMemo?.trim()) {
    requestBody.settleMemo = params.settleMemo.trim()
  }
  if (params.refundAddress?.trim()) {
    requestBody.refundAddress = params.refundAddress.trim()
  }
  if (params.refundMemo?.trim()) {
    requestBody.refundMemo = params.refundMemo.trim()
  }
  if (params.externalId) {
    const sanitizedId = params.externalId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 64)
    if (sanitizedId.length > 0) {
      requestBody.externalId = sanitizedId
    }
  }

  return sideshiftRequest<SideshiftShift>("/shifts/variable", "POST", requestBody, userIp)
}

// ============================================================
// CANCEL ORDER API
// ============================================================

export async function cancelOrder(orderId: string): Promise<void> {
  await sideshiftRequest("/cancel-order", "POST", { orderId })
}

// ============================================================
// CREATE CHECKOUT API (For merchants)
// ============================================================

export async function createCheckout(
  params: {
    settleCoin: string
    settleNetwork: string
    settleAmount: string
    settleAddress: string
    settleMemo?: string
    successUrl: string
    cancelUrl: string
  },
  userIp: string,
): Promise<SideshiftCheckout> {
  return sideshiftRequest<SideshiftCheckout>(
    "/checkout",
    "POST",
    {
      ...params,
      affiliateId: SIDESHIFT_AFFILIATE_ID,
    },
    userIp,
  )
}

// ============================================================
// GET CHECKOUT API
// ============================================================

export async function getCheckout(checkoutId: string): Promise<SideshiftCheckout> {
  return sideshiftRequest<SideshiftCheckout>(`/checkout/${checkoutId}`)
}

// ============================================================
// HELPER FUNCTIONS FOR GIFT CARD FLOW
// ============================================================

export function getMerchantWallet(): string {
  return MERCHANT_WALLET
}

export function getMerchantSettleCoin(): string {
  return DEFAULT_SETTLE_COIN
}

export function getMerchantSettleNetwork(): string {
  return DEFAULT_SETTLE_NETWORK
}

export function isMerchantSettleCoin(coin: string, network: string): boolean {
  return (
    coin.toLowerCase() === DEFAULT_SETTLE_COIN.toLowerCase() &&
    network.toLowerCase() === DEFAULT_SETTLE_NETWORK.toLowerCase()
  )
}

/**
 * Get a quote for buying a gift card
 * User sends crypto, merchant receives USDT
 */
export async function getPaymentQuote(
  depositCoin: string,
  depositNetwork: string,
  settleAmountUsd: number,
  userIp: string,
): Promise<SideshiftQuote> {
  return requestQuote(
    {
      depositCoin: depositCoin.toLowerCase(),
      depositNetwork,
      settleCoin: DEFAULT_SETTLE_COIN,
      settleNetwork: DEFAULT_SETTLE_NETWORK,
      settleAmount: settleAmountUsd.toFixed(2),
    },
    userIp,
  )
}

/**
 * Create payment shift - user sends crypto to buy gift card
 */
export async function createPaymentShift(
  quoteId: string,
  refundAddress?: string,
  externalId?: string,
  userIp?: string,
): Promise<SideshiftShift> {
  if (!MERCHANT_WALLET) {
    throw new Error("Merchant wallet address not configured")
  }

  return createFixedShift(
    {
      quoteId,
      settleAddress: MERCHANT_WALLET,
      refundAddress,
      externalId,
    },
    userIp,
  )
}

/**
 * Get a quote for redeeming a gift card
 * Merchant sends USDT, user receives their chosen crypto
 */
export async function getRedemptionQuote(
  settleCoin: string,
  settleNetwork: string,
  depositAmountUsd: number,
  userIp: string,
): Promise<SideshiftQuote> {
  return requestQuote(
    {
      depositCoin: DEFAULT_SETTLE_COIN,
      depositNetwork: DEFAULT_SETTLE_NETWORK,
      settleCoin: settleCoin.toLowerCase(),
      settleNetwork,
      depositAmount: depositAmountUsd.toFixed(2),
    },
    userIp,
  )
}

/**
 * Create redemption shift - merchant sends USDT to SideShift, user receives crypto
 * Returns the shift with a deposit address where merchant must send USDT
 */
export async function createRedemptionShift(
  quoteId: string,
  settleAddress: string,
  settleMemo?: string,
  externalId?: string,
  userIp?: string,
): Promise<SideshiftShift> {
  return createFixedShift(
    {
      quoteId,
      settleAddress,
      settleMemo,
      externalId,
    },
    userIp,
  )
}

export function isShiftComplete(status: SideshiftStatus): boolean {
  return status === "settled"
}

export function isShiftFailed(status: SideshiftStatus): boolean {
  return ["expired", "refund", "refunded"].includes(status)
}

export function isShiftPending(status: SideshiftStatus): boolean {
  return ["waiting", "pending", "processing", "settling", "review"].includes(status)
}

export function getStatusMessage(status: SideshiftStatus): string {
  const messages: Record<SideshiftStatus, string> = {
    waiting: "Waiting for deposit",
    pending: "Deposit detected, confirming...",
    processing: "Converting cryptocurrency",
    review: "Under manual review",
    settling: "Sending to wallet",
    settled: "Complete!",
    refund: "Refund in progress",
    refunded: "Refunded",
    expired: "Expired",
    multiple: "Multiple deposits detected",
  }
  return messages[status] || status
}
