"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Copy, Check, ArrowRight, Wallet, AlertTriangle, QrCode, ChevronLeft } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface Coin {
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
}

interface Shift {
  id: string
  depositAddress: string
  depositMemo?: string
  depositAmount: string
  settleAmount: string
  expiresAt: string
  status: string
}

interface Quote {
  depositAmount: string
  rate: string
}

const PRESET_AMOUNTS = [25, 50, 100, 250, 500]

function safeParseFloat(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !isNaN(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

function safeToFixed(value: unknown, decimals = 2, fallback = "0.00"): string {
  const num = safeParseFloat(value)
  if (isNaN(num)) return fallback
  return num.toFixed(decimals)
}

export function DepositForm() {
  const router = useRouter()
  const [step, setStep] = useState<"amount" | "payment">("amount")
  const [amount, setAmount] = useState("")
  const [selectedCoinId, setSelectedCoinId] = useState("")
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCoins, setLoadingCoins] = useState(true)
  const [shift, setShift] = useState<Shift | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedMemo, setCopiedMemo] = useState(false)
  const [error, setError] = useState("")
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [refundAddress, setRefundAddress] = useState("")
  const [settings, setSettings] = useState<{
    minDepositValue: number
    maxDepositValue: number
  } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pollRef = useRef<boolean>(false) // Track if we're already polling

  const selectedCoin = coins.find((c) => `${c.id}-${c.network}` === selectedCoinId)

  // Check auth
  useEffect(() => {
    const supabase = createClient()
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login?redirect=/deposit")
          return
        }
        setUserId(user.id)
      } catch (err) {
        console.error("Auth check error:", err)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const res = await fetch("/api/sideshift/coins?forDeposit=true")
        const data = await res.json()
        if (data.coins && Array.isArray(data.coins)) {
          setCoins(data.coins)
          if (data.coins.length > 0) {
            const firstCoin = data.coins[0]
            setSelectedCoinId(`${firstCoin.id}-${firstCoin.network}`)
          }
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
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          if (data.settings) {
            setSettings({
              minDepositValue: data.settings.minDepositValue || 5,
              maxDepositValue: data.settings.maxDepositValue || 100000,
            })
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    const fetchQuote = async () => {
      if (!selectedCoin || !amount || safeParseFloat(amount) <= 0) {
        setQuote(null)
        return
      }

      setLoadingQuote(true)
      setError("")
      try {
        const res = await fetch("/api/sideshift/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            depositCoin: selectedCoin.id,
            depositNetwork: selectedCoin.network,
            settleAmount: amount,
          }),
        })
        const data = await res.json()
        if (data.error) {
          console.error("Quote error:", data.error)
          setError(data.error)
          setQuote(null)
        } else if (data.depositAmount) {
          setQuote({
            depositAmount: String(data.depositAmount || "0"),
            rate: String(data.rate || "0"),
          })
        }
      } catch (err) {
        console.error("Quote error:", err)
        setError("Failed to get quote")
      } finally {
        setLoadingQuote(false)
      }
    }

    const debounce = setTimeout(fetchQuote, 500)
    return () => clearTimeout(debounce)
  }, [selectedCoin, amount])

  const createDeposit = async () => {
    if (!amount || !selectedCoin || !userId) return

    if (!refundAddress.trim()) {
      setError("Please enter a refund address for failed transactions")
      return
    }

    const amountNum = safeParseFloat(amount)
    if (amountNum < (settings?.minDepositValue || 5)) {
      setError(`Minimum deposit is $${settings?.minDepositValue || 5}`)
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          depositCoin: selectedCoin.id,
          depositNetwork: selectedCoin.network,
          refundAddress: refundAddress.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === "QUOTE_EXPIRED") {
          setError("Quote expired. Please try again.")
        } else if (data.code === "RATE_LIMITED") {
          setError("Too many requests. Please wait a moment and try again.")
        } else {
          throw new Error(data.error || "Failed to create deposit")
        }
        return
      }

      setShift(data.shift)
      setStep("payment")
      pollRef.current = false // Reset poll flag
      pollPaymentStatus(data.shift.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deposit")
    } finally {
      setLoading(false)
    }
  }

  const pollPaymentStatus = async (shiftId: string) => {
    if (pollRef.current) return // Already polling
    pollRef.current = true

    const checkStatus = async () => {
      if (!pollRef.current) return // Stopped polling

      try {
        const res = await fetch(`/api/sideshift/status/${shiftId}`)
        const data = await res.json()

        if (data.status === "settled") {
          pollRef.current = false // Stop polling

          const confirmRes = await fetch("/api/deposit/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shiftId }),
          })
          const confirmData = await confirmRes.json()

          if (confirmRes.ok) {
            router.push("/dashboard?deposit=success")
          } else {
            setError(confirmData.error || "Failed to confirm deposit")
          }
          return
        }

        if (data.status === "failed" || data.status === "refunded") {
          pollRef.current = false
          setError("Payment failed or was refunded")
          return
        }

        // Continue polling if not completed
        if (pollRef.current) {
          setTimeout(checkStatus, 5000)
        }
      } catch (err) {
        console.error("Status check error:", err)
        if (pollRef.current) {
          setTimeout(checkStatus, 5000)
        }
      }
    }

    checkStatus()
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollRef.current = false
    }
  }, [])

  const handleCopy = (text: string, type: "address" | "memo") => {
    navigator.clipboard.writeText(text)
    if (type === "address") {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopiedMemo(true)
      setTimeout(() => setCopiedMemo(false), 2000)
    }
  }

  useEffect(() => {
    if (!shift?.expiresAt) {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const expires = new Date(shift.expiresAt).getTime()
      const remaining = Math.max(0, Math.floor((expires - now) / 1000))
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        pollRef.current = false // Stop polling
        router.push("/deposit?expired=true")
      }
    }

    updateTimer()
    timerRef.current = setInterval(updateTimer, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [shift?.expiresAt, router])

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loadingCoins) {
    return (
      <Card className="max-w-md mx-auto bg-card border-border">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {step === "amount" && (
        <motion.div
          key="amount"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="max-w-md mx-auto bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Wallet className="w-5 h-5 text-primary" />
                Deposit Funds
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Add funds to your balance using cryptocurrency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preset Amounts */}
              <div className="space-y-2">
                <Label className="text-sm">Quick Select Amount</Label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={amount === String(preset) ? "default" : "outline"}
                      className="h-10 text-xs sm:text-sm"
                      onClick={() => setAmount(String(preset))}
                    >
                      ${preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label className="text-sm">Custom Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    id="amount"
                    placeholder="100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 h-12 text-base sm:text-lg bg-background"
                    min={settings?.minDepositValue || 5}
                    max={settings?.maxDepositValue || 100000}
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum: ${settings?.minDepositValue?.toFixed(2) || "5.00"} | Maximum: $
                  {settings?.maxDepositValue?.toLocaleString() || "100,000"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Pay with</Label>
                <Select value={selectedCoinId} onValueChange={setSelectedCoinId}>
                  <SelectTrigger className="h-12 bg-background text-sm">
                    <SelectValue placeholder="Select cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {coins.map((coin) => (
                      <SelectItem
                        key={`${coin.id}-${coin.network}`}
                        value={`${coin.id}-${coin.network}`}
                        className="text-sm"
                      >
                        {coin.name} ({coin.symbol}) - {coin.networkName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Refund Address</Label>
                <Input
                  type="text"
                  placeholder={`Your ${selectedCoin?.symbol || "crypto"} wallet address`}
                  value={refundAddress}
                  onChange={(e) => setRefundAddress(e.target.value)}
                  className="h-12 bg-background text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  If the payment fails, funds will be refunded to this address
                </p>
              </div>

              {/* Memo/Tag Warning */}
              {selectedCoin?.hasMemo && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-500">
                      <strong>{selectedCoin.symbol}</strong> requires a memo/tag. You will receive it on the next step.
                      Make sure to include it when sending.
                    </div>
                  </div>
                </div>
              )}

              {/* Quote Display - Using safe number formatting */}
              {quote && selectedCoin && (
                <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-muted-foreground">You send (approx):</span>
                    <span className="font-semibold text-foreground">
                      {safeToFixed(quote.depositAmount, 8)} {selectedCoin.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm mt-1">
                    <span className="text-muted-foreground">You receive:</span>
                    <span className="font-semibold text-primary">${safeToFixed(amount, 2)} USD</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-primary/20">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="text-muted-foreground">
                      1 {selectedCoin.symbol} = ${safeToFixed(quote.rate, 4)}
                    </span>
                  </div>
                </div>
              )}

              {loadingQuote && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Getting quote...</span>
                </div>
              )}

              {error && !loadingQuote && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={createDeposit}
                disabled={
                  loading ||
                  !amount ||
                  !selectedCoin ||
                  !refundAddress.trim() ||
                  safeParseFloat(amount) < (settings?.minDepositValue || 5)
                }
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating deposit...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === "payment" && shift && (
        <motion.div
          key="payment"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="max-w-md mx-auto bg-card border-border">
            <CardHeader>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  pollRef.current = false // Stop polling
                  setStep("amount")
                }}
                className="w-fit mb-2 -ml-2 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <QrCode className="w-5 h-5 text-primary" />
                Complete Payment
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Send exactly the amount shown to complete your deposit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {timeRemaining !== null && (
                <div
                  className={`p-3 rounded-lg border text-center ${
                    timeRemaining < 120
                      ? "bg-red-500/10 border-red-500/30"
                      : timeRemaining < 300
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-primary/10 border-primary/20"
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">Time remaining to pay:</p>
                  <p
                    className={`text-2xl font-bold font-mono ${
                      timeRemaining < 120 ? "text-red-500" : timeRemaining < 300 ? "text-amber-500" : "text-primary"
                    }`}
                  >
                    {formatTimeRemaining(timeRemaining)}
                  </p>
                  {timeRemaining < 120 && (
                    <p className="text-xs text-red-500 mt-1">Hurry! Payment window closing soon</p>
                  )}
                </div>
              )}

              {/* Amount to Send - Using safe formatting */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground mb-1">Send exactly:</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {safeToFixed(shift.depositAmount, 8)} {selectedCoin?.symbol}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Network: {selectedCoin?.networkName}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={shift.depositAddress} size={180} />
              </div>

              {/* Deposit Address */}
              <div className="space-y-2">
                <Label className="text-sm">Deposit Address</Label>
                <div className="flex items-center gap-2">
                  <Input value={shift.depositAddress} readOnly className="font-mono text-xs bg-background" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(shift.depositAddress, "address")}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Memo (if required) */}
              {shift.depositMemo && (
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    Memo / Tag
                    <span className="text-xs text-amber-500 font-normal">(Required!)</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input value={shift.depositMemo} readOnly className="font-mono text-xs bg-background" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(shift.depositMemo!, "memo")}
                      className="shrink-0"
                    >
                      {copiedMemo ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-amber-500">
                    You MUST include this memo when sending, or your funds may be lost!
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Waiting for payment confirmation...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
