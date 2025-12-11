// ============================================================
// FEE CALCULATION SYSTEM
// Fee formula: max(FEE_PERCENTAGE% of card value, FEE_MINIMUM)
// Default: 2.5% with $0.50 minimum
// ============================================================

export interface FeeCalculation {
  cardValue: number // The gift card value user wants to redeem
  platformFee: number // The fee charged by platform
  totalCost: number // Total the user pays (cardValue + platformFee)
  feePercentage: number // Actual fee percentage applied
  feeAmount: number // Same as platformFee for component compatibility
  feePercent: number // The fee rate (e.g., 0.025 for 2.5%)
}

export interface FeeSettings {
  feePercentage: number // e.g., 2.5 for 2.5%
  feeMinimum: number // e.g., 0.50 for $0.50
}

// Default fee settings
const DEFAULT_FEE_PERCENTAGE = 2.5 // 2.5%
const DEFAULT_FEE_MINIMUM = 0.5 // $0.50

/**
 * Calculate platform fee for a gift card purchase
 * @param cardValue - The gift card value in USD
 * @param settings - Optional custom fee settings from admin
 * @returns FeeCalculation object with all fee details
 */
export function calculateFee(cardValue: number, settings?: FeeSettings): FeeCalculation {
  if (!cardValue || isNaN(cardValue) || cardValue <= 0) {
    return {
      cardValue: 0,
      platformFee: 0,
      totalCost: 0,
      feePercentage: 0,
      feeAmount: 0,
      feePercent: 0,
    }
  }

  const feePercent = (settings?.feePercentage ?? DEFAULT_FEE_PERCENTAGE) / 100
  const feeMin = settings?.feeMinimum ?? DEFAULT_FEE_MINIMUM

  // Calculate percentage-based fee
  const percentageFee = cardValue * feePercent

  // Apply minimum fee rule
  const platformFee = Math.max(percentageFee, feeMin)

  // Round to 2 decimal places
  const roundedFee = Math.round(platformFee * 100) / 100

  return {
    cardValue,
    platformFee: roundedFee,
    totalCost: Math.round((cardValue + roundedFee) * 100) / 100,
    feePercentage: roundedFee / cardValue,
    feeAmount: roundedFee,
    feePercent: feePercent,
  }
}

/**
 * Get fee breakdown for display purposes
 */
export function getFeeBreakdown(
  cardValue: number,
  settings?: FeeSettings,
): {
  cardValue: string
  fee: string
  total: string
  feePercent: string
} {
  const calc = calculateFee(cardValue, settings)

  return {
    cardValue: `$${calc.cardValue.toFixed(2)}`,
    fee: `$${calc.platformFee.toFixed(2)}`,
    total: `$${calc.totalCost.toFixed(2)}`,
    feePercent: `${(calc.feePercentage * 100).toFixed(1)}%`,
  }
}

/**
 * Fee examples for documentation/display
 */
export function generateFeeExamples(settings?: FeeSettings) {
  const amounts = [5, 10, 25, 50, 100, 500, 1000, 10000, 100000]
  return amounts.map((amount) => ({
    cardValue: amount,
    ...calculateFee(amount, settings),
  }))
}

export const FEE_EXAMPLES = generateFeeExamples()

// ============================================================
// REDEMPTION CALCULATION SYSTEM
// Calculates the amount to send for redemption with platform margin
// Default margin: 8.33% (send $5.50 for $6 card)
// - Cards $6-$9.99: $0.10 flat fee (e.g., $6 card → send $5.90)
// - Cards $10+: 1% fee (e.g., $100 card → send $99)
// SideShift adds ~0.5% on top, so user receives slightly less
// ============================================================

export interface RedemptionCalculation {
  cardValue: number // Original card value in USD
  sendAmount: number // Amount platform sends (USD value for quote)
  marginAmount: number // Platform margin amount (now always 0)
  marginPercent: number // Margin percentage (now always 0)
  estimatedReceive: number // What user should approximately receive
}

/**
 * Calculate redemption payout - NO PLATFORM FEE
 *
 * Fee structure:
 * - Platform fee: 0% (FREE)
 * - SideShift handles the swap and charges their network fees
 *
 * @param cardValue - The gift card value in USD
 */
export function calculateRedemptionPayout(cardValue: number): RedemptionCalculation {
  if (!cardValue || isNaN(cardValue) || cardValue <= 0) {
    return {
      cardValue: 0,
      sendAmount: 0,
      marginAmount: 0,
      marginPercent: 0,
      estimatedReceive: 0,
    }
  }

  const platformFee = 0
  const marginPercent = 0
  const sendAmount = cardValue

  // SideShift network fees vary by coin/network, estimate ~1-2% for display
  const estimatedNetworkFees = sendAmount * 0.015
  const estimatedReceive = sendAmount - estimatedNetworkFees

  return {
    cardValue,
    sendAmount: Math.round(sendAmount * 100) / 100,
    marginAmount: Math.round(platformFee * 100) / 100,
    marginPercent: Math.round(marginPercent * 100) / 100,
    estimatedReceive: Math.round(estimatedReceive * 100) / 100,
  }
}

/**
 * Get redemption info for display to user
 */
export function getRedemptionInfo(cardValue: number): {
  cardValue: string
  youReceive: string
  networkFee: string
  note: string
} {
  const calc = calculateRedemptionPayout(cardValue)

  return {
    cardValue: `$${calc.cardValue.toFixed(2)}`,
    youReceive: `~$${calc.estimatedReceive.toFixed(2)}`,
    networkFee: "Network fees apply",
    note: `You will receive approximately $${calc.estimatedReceive.toFixed(2)} worth of your selected cryptocurrency after network fees.`,
  }
}

/**
 * Generate redemption fee examples for documentation/display
 */
export function generateRedemptionExamples() {
  const amounts = [5, 6, 7, 8, 9, 10, 15, 20, 25, 50, 100, 500, 1000]
  return amounts.map((amount) => ({
    cardValue: amount,
    ...calculateRedemptionPayout(amount),
  }))
}

export const REDEMPTION_EXAMPLES = generateRedemptionExamples()
