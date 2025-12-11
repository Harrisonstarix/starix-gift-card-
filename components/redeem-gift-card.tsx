"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { GiftCard3D, type CardDesign } from "@/components/gift-card-3d"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  Search,
  ArrowRight,
  Check,
  Gift,
  AlertCircle,
  ExternalLink,
  Lock,
  Calendar,
  CheckCircle,
  MessageSquare,
  User,
  ChevronDown,
  XCircle,
} from "lucide-react"
import Image from "next/image"
import { calculateRedemptionPayout } from "@/lib/fees"

type Step = "lookup" | "password" | "reveal" | "details" | "redeem" | "processing" | "success" | "error"

type ShiftStatus =
  | "waiting"
  | "pending"
  | "processing"
  | "review"
  | "settling"
  | "settled"
  | "refund"
  | "refunded"
  | "expired"
  | "failed"

interface GiftCardData {
  id: string
  valueUsd: number
  design: CardDesign
  recipientName: string
  senderName: string
  message: string
  status: string
  expiresAt: string
  createdAt: string
  redeemedAt?: string
  isPasswordProtected?: boolean
  canRedeem: boolean
  isExpired: boolean
  isRedeemed: boolean
  isPending: boolean
  isCancelled: boolean
  isAnonymous?: boolean
  password?: string
}

interface RedemptionQuote {
  quoteId: string
  depositAmount: string
  settleAmount: string
  settleCoin: string
  settleNetwork: string
  rate: string
  expiresAt: string
  networkFee?: string
}

interface CryptoOption {
  id: string
  name: string
  symbol: string
  network: string
  networkName?: string
  hasMemo?: boolean
  isTreasury?: boolean
  icon?: string
}

interface TreasuryInfo {
  coin: string
  network: string
}

interface RedeemGiftCardProps {
  initialCode?: string
}

export function RedeemGiftCard({ initialCode = "" }: RedeemGiftCardProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<Step>("lookup")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState(initialCode)
  const [password, setPassword] = useState("")
  const [giftCard, setGiftCard] = useState<GiftCardData | null>(null)
  const [redeemCrypto, setRedeemCrypto] = useState("")
  const [redeemNetwork, setRedeemNetwork] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [settleMemo, setSettleMemo] = useState("")
  const [quote, setQuote] = useState<RedemptionQuote | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [coins, setCoins] = useState<CryptoOption[]>([])
  const [treasury, setTreasury] = useState<TreasuryInfo | null>(null)
  const [loadingCoins, setLoadingCoins] = useState(true)
  const [copied, setCopied] = useState(false)
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null)
  const [shiftStatusMessage, setShiftStatusMessage] = useState<string>("")
  const [coinSearch, setCoinSearch] = useState("")
  const [showCoinDropdown, setShowCoinDropdown] = useState(false)

  const [showCardBack, setShowCardBack] = useState(true)
  const [cardRevealed, setCardRevealed] = useState(false)

  const [redemptionResult, setRedemptionResult] = useState<{
    amount: string
    crypto: string
    shiftId: string
    estimatedSeconds?: string
    txHash?: string
    settleTxHash?: string
    treasuryTxHash?: string
    feeInfo?: {
      cardValue: number
      networkFeeBuffer: number
      amountConverted: number
      estimatedReceive: string
    }
  } | null>(null)

  const selectedCrypto = coins.find((c) => c.id === redeemCrypto && c.network === redeemNetwork)
  const needsMemo = selectedCrypto?.hasMemo || ["xrp", "xlm", "atom", "bnb"].includes(redeemCrypto)

  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(coinSearch.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(coinSearch.toLowerCase()) ||
      (coin.networkName || coin.network).toLowerCase().includes(coinSearch.toLowerCase()),
  )

  // Auto-lookup if code is provided
  useEffect(() => {
    if (initialCode && !giftCard) {
      handleLookup()
    }
  }, [initialCode])

  // Fetch coins once on mount
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setLoadingCoins(true)
        const res = await fetch("/api/sideshift/coins?excludeTreasury=true&forSettle=true")
        if (res.ok) {
          const data = await res.json()
          setCoins(data.coins || [])
          setTreasury(data.treasury || null)
        }
      } catch (err) {
        console.error("Failed to fetch coins:", err)
      } finally {
        setLoadingCoins(false)
      }
    }
    fetchCoins()
  }, [])

  useEffect(() => {
    if (redeemCrypto && redeemNetwork && walletAddress && giftCard && step === "details") {
      fetchQuote()
    }
  }, [redeemCrypto, redeemNetwork, walletAddress, giftCard, step])

  const fetchQuote = async () => {
    if (!giftCard || !redeemCrypto || !redeemNetwork || !treasury) return

    setLoadingQuote(true)
    setQuote(null)
    try {
      const redemptionCalc = calculateRedemptionPayout(giftCard.valueUsd)
      const depositAmountUsd = redemptionCalc.sendAmount.toFixed(2)

      const res = await fetch("/api/sideshift/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "redemption",
          settleCoin: redeemCrypto,
          settleNetwork: redeemNetwork,
          depositAmount: depositAmountUsd,
          settleAmount: null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setQuote({
          quoteId: data.id,
          depositAmount: data.depositAmount,
          settleAmount: data.settleAmount,
          settleCoin: data.settleCoin?.toUpperCase() || redeemCrypto.toUpperCase(),
          settleNetwork: data.settleNetwork || redeemNetwork,
          rate: data.rate,
          expiresAt: data.expiresAt,
        })
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error("Quote error:", errorData)
        toast({
          title: "Quote Error",
          description: errorData.error || "Failed to get conversion rate",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to fetch quote:", err)
    } finally {
      setLoadingQuote(false)
    }
  }

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!code.trim()) {
      setError("Please enter a gift card code")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/gift-cards/lookup?code=${encodeURIComponent(code.trim())}`)

      if (!res.ok) {
        const text = await res.text()
        let errorMessage = "Gift card not found"
        try {
          if (text) {
            const errorData = JSON.parse(text)
            errorMessage = errorData.error || errorMessage
          }
        } catch {
          // Text wasn't JSON
        }
        setError(errorMessage)
        return
      }

      const data = await res.json()
      setGiftCard(data)

      if (data.isPasswordProtected) {
        setStep("password")
      } else {
        setStep("reveal")
        setTimeout(() => {
          setShowCardBack(false)
        }, 2500)
      }
    } catch (err) {
      setError("Failed to look up gift card")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!password.trim()) {
      setError("Please enter the password")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/gift-cards/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), password: password.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid password")
        return
      }

      setStep("reveal")
      setTimeout(() => {
        setShowCardBack(false)
      }, 2500)
    } catch (err) {
      setError("Failed to verify password")
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!giftCard || !redeemCrypto || !redeemNetwork || !walletAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!quote) {
      toast({
        title: "No Quote",
        description: "Please wait for the quote to load",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setStep("processing")
    setError(null)

    try {
      const res = await fetch("/api/gift-cards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          password: password.trim() || undefined,
          settleCoin: redeemCrypto,
          settleNetwork: redeemNetwork,
          settleAddress: walletAddress.trim(),
          settleMemo: settleMemo.trim() || undefined,
          quoteId: quote.quoteId,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.success === false) {
        let errorMessage = data.error || "Failed to redeem gift card"

        // Show treasury balance info if available
        if (data.code === "TREASURY_INSUFFICIENT") {
          errorMessage = `Platform treasury has insufficient balance.\n\nAvailable: ${data.treasuryBalance?.toFixed(6) || 0} ${data.asset}\nRequired: ${data.requiredAmount?.toFixed(6)} ${data.asset}\n\nPlease try again later or contact support.`
        } else if (data.code === "TREASURY_NOT_CONFIGURED") {
          errorMessage = "Platform treasury is not configured. Please contact support."
        } else if (data.code === "TREASURY_SEND_FAILED" || data.code === "TREASURY_SEND_ERROR") {
          errorMessage = data.error || "Failed to send from platform treasury. Please try again."
        }

        setError(errorMessage)
        setStep("error")

        toast({
          title: "Redemption Failed",
          description: errorMessage.split("\n")[0], // Just show first line in toast
          variant: "destructive",
        })
        return
      }

      const shiftId = data.shiftId || data.shift?.id

      setRedemptionResult({
        amount: data.estimatedAmount || data.settleAmount || data.shift?.settleAmount || quote.settleAmount,
        crypto: (data.settleCoin || redeemCrypto).toUpperCase(),
        shiftId: shiftId,
        estimatedSeconds: data.averageShiftSeconds,
        treasuryTxHash: data.treasuryTxHash || data.txHash,
      })
      setStep("success")

      toast({
        title: "Redemption Successful!",
        description: "Your crypto is being sent to your wallet.",
      })

      // Start polling for shift status
      if (shiftId) {
        pollShiftStatus(shiftId)
      }
    } catch (err) {
      console.error("[Redeem] Error:", err)
      setError("Failed to redeem gift card. Please try again.")
      setStep("error")

      toast({
        title: "Error",
        description: "Failed to redeem gift card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const pollShiftStatus = async (shiftId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/sideshift/status/${shiftId}`)
        if (res.ok) {
          const data = await res.json()
          setShiftStatus(data.status)

          if (data.deposits?.[0]?.settleHash) {
            setRedemptionResult((prev) => (prev ? { ...prev, settleTxHash: data.deposits[0].settleHash } : prev))
          }

          // Continue polling unless settled, expired, or failed
          if (!["settled", "expired", "refunded", "failed"].includes(data.status)) {
            setTimeout(poll, 5000)
          }
        }
      } catch (err) {
        console.error("Status poll error:", err)
      }
    }
    poll()
  }

  const getStatusMessage = (status: ShiftStatus | null): string => {
    switch (status) {
      case "waiting":
        return "Waiting for payment..."
      case "pending":
        return "Payment detected, confirming..."
      case "processing":
        return "Converting your crypto..."
      case "settling":
        return "Sending to your wallet..."
      case "settled":
        return "Complete! Check your wallet"
      case "expired":
        return "Shift expired"
      case "refunded":
        return "Funds refunded"
      case "failed":
        return "Transaction failed"
      default:
        return "Processing..."
    }
  }

  const renderStep = () => {
    switch (step) {
      case "lookup":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Gift Card Code</Label>
                <div className="relative">
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="STARIX-XXXX-XXXX-XXXX"
                    className="font-mono text-lg pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading || !code.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Look Up Gift Card
              </Button>
            </form>
          </motion.div>
        )

      case "password":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Password Protected</h2>
              <p className="text-muted-foreground text-sm">This gift card requires a password to unlock</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading || !password.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                Unlock Gift Card
              </Button>

              <Button variant="ghost" className="w-full" onClick={() => setStep("lookup")}>
                Back
              </Button>
            </form>
          </motion.div>
        )

      case "reveal":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {giftCard?.isRedeemed ? (
              <>
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-8 h-8 text-orange-500" />
                  </motion.div>
                  <h2 className="text-xl font-bold">Already Redeemed</h2>
                  <p className="text-muted-foreground text-sm">This gift card has already been redeemed</p>
                </div>

                {giftCard && (
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center"
                  >
                    <div className="w-full max-w-[320px] opacity-60">
                      <GiftCard3D
                        variant={giftCard.design}
                        value={giftCard.valueUsd}
                        recipientName={giftCard.recipientName}
                      />
                    </div>
                  </motion.div>
                )}

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-orange-500">Gift Card Already Used</p>
                      <p className="text-xs text-muted-foreground">
                        This ${giftCard.valueUsd} gift card was redeemed on{" "}
                        {giftCard.redeemedAt ? new Date(giftCard.redeemedAt).toLocaleDateString() : "a previous date"}.
                        Each gift card can only be redeemed once.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setStep("lookup")
                    setCode("")
                    setGiftCard(null)
                  }}
                >
                  Look Up Another Card
                </Button>
              </>
            ) : giftCard?.isExpired ? (
              <>
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <XCircle className="w-8 h-8 text-destructive" />
                  </motion.div>
                  <h2 className="text-xl font-bold">Gift Card Expired</h2>
                  <p className="text-muted-foreground text-sm">This gift card is no longer valid</p>
                </div>

                {giftCard && (
                  <motion.div className="flex justify-center">
                    <div className="w-full max-w-[320px] opacity-60 grayscale">
                      <GiftCard3D
                        variant={giftCard.design}
                        value={giftCard.valueUsd}
                        recipientName={giftCard.recipientName}
                      />
                    </div>
                  </motion.div>
                )}

                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-destructive">
                        Expired on {new Date(giftCard.expiresAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Unfortunately, this gift card has passed its expiration date and can no longer be redeemed.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setStep("lookup")
                    setCode("")
                    setGiftCard(null)
                  }}
                >
                  Look Up Another Card
                </Button>
              </>
            ) : giftCard?.isPending ? (
              <>
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                  </motion.div>
                  <h2 className="text-xl font-bold">Payment Pending</h2>
                  <p className="text-muted-foreground text-sm">This gift card is waiting for payment confirmation</p>
                </div>

                {giftCard && (
                  <motion.div className="flex justify-center">
                    <div className="w-full max-w-[320px] opacity-75">
                      <GiftCard3D
                        variant={giftCard.design}
                        value={giftCard.valueUsd}
                        recipientName={giftCard.recipientName}
                      />
                    </div>
                  </motion.div>
                )}

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-500">Awaiting Payment</p>
                      <p className="text-xs text-muted-foreground">
                        The payment for this gift card is still being processed. Please check back later once the
                        payment is confirmed.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setStep("lookup")
                    setCode("")
                    setGiftCard(null)
                  }}
                >
                  Look Up Another Card
                </Button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4"
                  >
                    <Gift className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-bold">You received a gift!</h2>
                  <p className="text-muted-foreground text-sm">Revealing your gift...</p>
                </div>

                {giftCard && (
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center"
                  >
                    <div className="w-full max-w-[320px]">
                      <GiftCard3D
                        variant={giftCard.design}
                        value={giftCard.valueUsd}
                        recipientName={giftCard.recipientName}
                        showBack={showCardBack}
                      />
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {!showCardBack && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-4"
                    >
                      {giftCard?.message && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Message</span>
                          </div>
                          <p className="text-sm text-muted-foreground italic">"{giftCard.message}"</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <User className="w-3 h-3" />
                            <span className="text-xs">From</span>
                          </div>
                          <span className="font-medium">
                            {giftCard?.isAnonymous ? "Anonymous" : giftCard?.senderName || "Someone special"}
                          </span>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">Expires</span>
                          </div>
                          <span className="font-medium">
                            {giftCard?.expiresAt ? new Date(giftCard.expiresAt).toLocaleDateString() : "Never"}
                          </span>
                        </div>
                      </div>

                      <Button className="w-full" size="lg" onClick={() => setStep("details")}>
                        <Gift className="w-4 h-4 mr-2" />
                        Redeem Now
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )

      case "details":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {giftCard && (
              <div className="flex justify-center scale-75 origin-top -mb-8">
                <GiftCard3D
                  variant={giftCard.design}
                  value={giftCard.valueUsd}
                  recipientName={giftCard.recipientName}
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Cryptocurrency to Receive</Label>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-12 bg-transparent"
                    onClick={() => setShowCoinDropdown(!showCoinDropdown)}
                  >
                    {selectedCrypto ? (
                      <div className="flex items-center gap-2">
                        {selectedCrypto.icon && (
                          <Image
                            src={selectedCrypto.icon || "/placeholder.svg"}
                            alt={selectedCrypto.symbol}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )}
                        <span className="font-medium">{selectedCrypto.symbol.toUpperCase()}</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedCrypto.networkName || selectedCrypto.network}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select cryptocurrency...</span>
                    )}
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {showCoinDropdown && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-hidden">
                      <div className="p-2 border-b border-border">
                        <Input
                          placeholder="Search coins..."
                          value={coinSearch}
                          onChange={(e) => setCoinSearch(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="overflow-y-auto max-h-[240px]">
                        {loadingCoins ? (
                          <div className="p-4 text-center">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          </div>
                        ) : filteredCoins.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground text-sm">No coins found</div>
                        ) : (
                          filteredCoins.map((coin) => (
                            <button
                              key={`${coin.id}-${coin.network}`}
                              type="button"
                              className="w-full px-3 py-2 hover:bg-muted flex items-center gap-3 text-left"
                              onClick={() => {
                                setRedeemCrypto(coin.id)
                                setRedeemNetwork(coin.network)
                                setShowCoinDropdown(false)
                                setCoinSearch("")
                                setQuote(null) // Clear old quote
                              }}
                            >
                              {coin.icon && (
                                <Image
                                  src={coin.icon || "/placeholder.svg"}
                                  alt={coin.symbol}
                                  width={28}
                                  height={28}
                                  className="rounded-full"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{coin.symbol.toUpperCase()}</div>
                                <div className="text-xs text-muted-foreground">
                                  {coin.name} • {coin.networkName || coin.network}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet">Your Wallet Address</Label>
                <Input
                  id="wallet"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={`Enter your ${selectedCrypto?.symbol.toUpperCase() || "crypto"} address`}
                  className="font-mono text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo" className="flex items-center gap-2">
                  Memo / Tag
                  {needsMemo ? (
                    <Badge variant="destructive" className="text-xs">
                      May Be Required
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Optional
                    </Badge>
                  )}
                </Label>
                <Input
                  id="memo"
                  value={settleMemo}
                  onChange={(e) => setSettleMemo(e.target.value)}
                  placeholder={
                    needsMemo ? "Enter memo or tag (check your wallet)" : "Enter memo if your wallet requires one"
                  }
                  className="text-sm"
                />
                {needsMemo ? (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {selectedCrypto?.symbol.toUpperCase()} often requires a memo/tag. Check your wallet or exchange -
                      if they provide one, you MUST enter it here or your funds may be lost.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Most wallets don't require a memo. Only enter one if your wallet or exchange specifically provides
                    it.
                  </p>
                )}
              </div>

              {quote && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Estimated Redemption</h4>
                  {(() => {
                    const redemptionCalc = calculateRedemptionPayout(giftCard?.valueUsd || 0)
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Card Value:</span>
                          <span>${giftCard?.valueUsd.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Platform Fee:</span>
                          <span className="text-green-500">FREE</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Amount to Convert:</span>
                          <span>${redemptionCalc.sendAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium border-t border-border pt-2 mt-2">
                          <span>You'll Receive (approx):</span>
                          <span className="text-green-500">
                            {Number(quote.settleAmount).toFixed(8)} {quote.settleCoin}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Rate: $1 USD = {Number(quote.rate).toFixed(6)} {quote.settleCoin}
                        </p>
                      </>
                    )
                  })()}
                </div>
              )}

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200/80">
                    <p className="font-medium text-amber-400 mb-1">Important: Network Fees Apply</p>
                    <p>
                      The final amount you receive may be slightly less than the card value due to blockchain network
                      fees and exchange rates. These fees are charged by the cryptocurrency network and our exchange
                      partner (SideShift), not by Starix. We do not charge any redemption fees.
                    </p>
                  </div>
                </div>
              </div>

              {loadingQuote && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Getting quote...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleRedeem}
                className="w-full"
                size="lg"
                disabled={loading || !redeemCrypto || !redeemNetwork || !walletAddress || loadingQuote || !quote}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Confirm Redemption
              </Button>

              <Button variant="ghost" className="w-full" onClick={() => setStep("reveal")}>
                Back
              </Button>
            </div>
          </motion.div>
        )

      case "processing":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Processing Redemption</h2>
              <p className="text-muted-foreground text-sm">Please wait while we process your request...</p>
            </div>
          </motion.div>
        )

      case "success":
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2">Redemption Successful!</h2>
              <p className="text-muted-foreground text-sm">Your crypto is being sent to your wallet</p>
            </div>

            {redemptionResult && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    {redemptionResult.amount} {redemptionResult.crypto}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant={
                      shiftStatus === "settled"
                        ? "default"
                        : shiftStatus === "failed" || shiftStatus === "expired"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {getStatusMessage(shiftStatus)}
                  </Badge>
                </div>
                {redemptionResult.shiftId && (
                  <a
                    href={`https://sideshift.ai/orders/${redemptionResult.shiftId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Track on SideShift
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {redemptionResult.settleTxHash && (
                  <a
                    href={`https://blockchair.com/search?q=${redemptionResult.settleTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View Transaction
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            <Button className="w-full" onClick={() => (window.location.href = "/dashboard")}>
              Go to Dashboard
            </Button>
          </motion.div>
        )

      case "error":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Redemption Failed</h2>
              <p className="text-muted-foreground text-sm">{error || "Something went wrong"}</p>
            </div>
            <Button onClick={() => setStep("details")} className="w-full">
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => setStep("lookup")} className="w-full">
              Start Over
            </Button>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Redeem Your Gift Card</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Enter your gift card code and choose which cryptocurrency you'd like to receive
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">{renderStep()}</div>
    </div>
  )
}
