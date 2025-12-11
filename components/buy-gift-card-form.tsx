"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Gift,
  CreditCard,
  Wallet,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
  Info,
  ChevronLeft,
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { motion, AnimatePresence } from "framer-motion"
import { GiftCard3D } from "./gift-card-3d"
import { createClient } from "@/lib/supabase/client"
import { CARD_DESIGNS, getDesignsByCategory, DESIGN_CATEGORIES } from "@/lib/card-designs"

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

const PRESET_AMOUNTS = [25, 50, 100, 250, 500]

export function BuyGiftCardForm() {
  const router = useRouter()
  const [step, setStep] = useState<"design" | "details" | "payment">("design")
  const [paymentMethod, setPaymentMethod] = useState<"balance" | "crypto">("crypto")

  // User & Balance
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [balance, setBalance] = useState(0)

  // Design selection
  const [selectedDesign, setSelectedDesign] = useState(CARD_DESIGNS[0]?.id || "obsidian")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  // Amount
  const [selectedAmount, setSelectedAmount] = useState(100)
  const [customAmount, setCustomAmount] = useState("")
  const [useCustomAmount, setUseCustomAmount] = useState(false)

  // Card details
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [senderName, setSenderName] = useState("")
  const [message, setMessage] = useState("")
  const [hasPassword, setHasPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)

  const [selectedCoinId, setSelectedCoinId] = useState("")
  const [coins, setCoins] = useState<Coin[]>([])
  const [loadingCoins, setLoadingCoins] = useState(true)
  const [quote, setQuote] = useState<{ id: string; depositAmount: string; rate: string } | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)

  const [refundAddress, setRefundAddress] = useState("")

  // Settings
  const [settings, setSettings] = useState<{
    minGiftCardValue: number
    maxGiftCardValue: number
    feePercentage: number
    feeMinimum: number
  } | null>(null)

  // State
  const [loading, setLoading] = useState(false)
  const [shift, setShift] = useState<Shift | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedMemo, setCopiedMemo] = useState(false)
  const [error, setError] = useState("")
  const [giftCardCode, setGiftCardCode] = useState("")

  const [paymentStatus, setPaymentStatus] = useState<{
    status: string
    message: string
    deposits?: Array<{ amount: string; txHash?: string }>
  } | null>(null)

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const actualAmount = useCustomAmount && customAmount ? Number.parseFloat(customAmount) || 0 : selectedAmount
  const fee = calculateFee(actualAmount, settings?.feePercentage, settings?.feeMinimum)
  const totalAmount = actualAmount + (fee?.platformFee || 0)

  const selectedCoin = coins.find((c) => `${c.id}-${c.network}` === selectedCoinId)

  // Fetch user and balance
  useEffect(() => {
    const supabase = createClient()
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUser({ id: user.id, email: user.email || "" })
          const res = await fetch("/api/user/balance")
          if (res.ok) {
            const data = await res.json()
            setBalance(data.balance || 0)
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          if (data.settings) {
            setSettings({
              minGiftCardValue: data.settings.minGiftCardValue || 5,
              maxGiftCardValue: data.settings.maxGiftCardValue || 100000,
              feePercentage: data.settings.feePercentage || 2.5,
              feeMinimum: data.settings.feeMinimum || 0.5,
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
    const fetchQuote = async () => {
      if (!selectedCoin || actualAmount <= 0 || paymentMethod !== "crypto") {
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
            settleAmount: totalAmount.toString(),
          }),
        })
        const data = await res.json()
        if (data.error) {
          console.error("Quote error:", data.error)
          setError(data.error)
          setQuote(null)
        } else if (data.depositAmount && data.id) {
          setQuote({
            id: data.id,
            depositAmount: data.depositAmount,
            rate: data.rate,
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
  }, [selectedCoin, actualAmount, totalAmount, paymentMethod])

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
        // Shift expired - redirect to expired page
        router.push("/payment/failed?reason=expired")
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

  const handlePurchaseWithBalance = async () => {
    if (!user) {
      router.push("/auth/login?redirect=/buy")
      return
    }

    if (balance < totalAmount) {
      setError("Insufficient balance")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/gift-cards/purchase-with-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: actualAmount,
          designId: selectedDesign,
          recipientName,
          recipientEmail,
          senderName: isAnonymous ? "Anonymous" : senderName,
          message,
          password: hasPassword ? password : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to purchase gift card")
      }

      router.push(`/payment/success?code=${data.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to purchase")
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseWithCrypto = async () => {
    if (!selectedCoin) {
      setError("Please select a cryptocurrency")
      return
    }

    if (!quote?.id) {
      setError("Please wait for quote to load")
      return
    }

    if (!refundAddress.trim()) {
      setError("Please enter a refund address for failed transactions")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          valueUsd: actualAmount,
          design: selectedDesign,
          recipientName,
          recipientEmail,
          senderName: isAnonymous ? "Anonymous" : senderName,
          message,
          password: hasPassword ? password : null,
          paymentCrypto: selectedCoin.id,
          paymentNetwork: selectedCoin.network,
          refundAddress: refundAddress.trim(),
          isAnonymous,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create gift card")
      }

      setShift(data.shift)
      setGiftCardCode(data.giftCard?.code || "")
      setStep("payment")

      // Start polling for payment status
      pollPaymentStatus(data.shift.id, data.giftCard?.code || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create gift card")
    } finally {
      setLoading(false)
    }
  }

  const pollPaymentStatus = useCallback(
    async (shiftId: string, code: string) => {
      let attempts = 0
      const maxAttempts = 120 // 10 minutes max (5 second intervals)

      const checkStatus = async () => {
        try {
          attempts++
          const res = await fetch(`/api/sideshift/status/${shiftId}`)
          const data = await res.json()

          // Update status for UI display
          if (data.deposits && data.deposits.length > 0) {
            setPaymentStatus({
              status: data.status,
              message: getPaymentStatusMessage(data.status),
              deposits: data.deposits,
            })
          } else {
            setPaymentStatus({
              status: data.status,
              message: getPaymentStatusMessage(data.status),
            })
          }

          if (data.status === "settled") {
            setPaymentStatus({
              status: "activating",
              message: "Payment confirmed! Activating your gift card...",
              deposits: data.deposits,
            })

            // Activate the card
            const activateRes = await fetch("/api/gift-cards/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ shiftId }),
            })

            const activateData = await activateRes.json()

            if (activateData.success || activateData.alreadyProcessed) {
              setPaymentStatus({
                status: "complete",
                message: "Gift card activated successfully!",
                deposits: data.deposits,
              })

              // Small delay to show success message
              setTimeout(() => {
                router.push(`/payment/success?code=${code}`)
              }, 1500)
            } else {
              setError(activateData.error || "Failed to activate gift card")
            }
            return
          }

          if (data.status === "failed" || data.status === "refunded") {
            setPaymentStatus({
              status: data.status,
              message: `Payment ${data.status}. Please try again.`,
            })
            setError(`Payment ${data.status}`)
            return
          }

          // Continue polling if not settled and not max attempts
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000)
          } else {
            setPaymentStatus({
              status: "timeout",
              message: "Payment check timed out. Please check your dashboard.",
            })
          }
        } catch (err) {
          console.error("Status check error:", err)
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000)
          }
        }
      }

      checkStatus()
    },
    [router],
  )

  const getPaymentStatusMessage = (status: string): string => {
    switch (status) {
      case "waiting":
        return "Waiting for your payment..."
      case "pending":
        return "Payment detected! Waiting for confirmations..."
      case "processing":
        return "Processing your payment..."
      case "review":
        return "Payment under review..."
      case "settling":
        return "Finalizing your payment..."
      case "settled":
        return "Payment confirmed!"
      case "refunded":
        return "Payment was refunded"
      case "failed":
        return "Payment failed"
      default:
        return "Checking payment status..."
    }
  }

  const currentDesign = CARD_DESIGNS.find((d) => d.id === selectedDesign) || CARD_DESIGNS[0]
  const filteredDesigns = activeCategory === "all" ? CARD_DESIGNS : getDesignsByCategory(activeCategory)

  if (loadingCoins) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {step === "design" && (
          <motion.div
            key="design"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid lg:grid-cols-2 gap-6 lg:gap-8"
          >
            {/* Left: Card Preview */}
            <div className="order-2 lg:order-1">
              <Card className="bg-card border-border sticky top-24">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="gift-card-scale">
                    <GiftCard3D
                      design={currentDesign}
                      recipientName={recipientName || "Recipient"}
                      value={actualAmount}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Form */}
            <div className="order-1 lg:order-2 space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Gift className="w-5 h-5 text-primary" />
                    Create Gift Card
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Choose amount and design for your gift card
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Select Amount</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_AMOUNTS.map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          variant={selectedAmount === amount && !useCustomAmount ? "default" : "outline"}
                          className="h-10 sm:h-12 text-xs sm:text-sm"
                          onClick={() => {
                            setSelectedAmount(amount)
                            setUseCustomAmount(false)
                            setCustomAmount("")
                          }}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="Custom amount"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value)
                          setUseCustomAmount(true)
                        }}
                        className="pl-8 h-12 bg-background"
                        min={settings?.minGiftCardValue || 5}
                        max={settings?.maxGiftCardValue || 100000}
                      />
                    </div>
                  </div>

                  {/* Design Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Choose Design</Label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      <Button
                        type="button"
                        variant={activeCategory === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveCategory("all")}
                        className="flex-shrink-0 text-xs"
                      >
                        All
                      </Button>
                      {DESIGN_CATEGORIES.map((cat) => (
                        <Button
                          key={cat.id}
                          type="button"
                          variant={activeCategory === cat.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveCategory(cat.id)}
                          className="flex-shrink-0 text-xs"
                        >
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                      {filteredDesigns.slice(0, 10).map((design) => (
                        <button
                          key={design.id}
                          type="button"
                          onClick={() => setSelectedDesign(design.id)}
                          className={`aspect-[1.6/1] rounded-lg overflow-hidden border-2 transition-all relative ${
                            selectedDesign === design.id
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${design.gradient}`} />
                          {design.image && (
                            <img
                              src={design.image || "/placeholder.svg"}
                              alt={design.name}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <span className="absolute bottom-1 left-1 right-1 text-[8px] sm:text-[10px] text-white font-medium truncate z-10">
                            {design.name.replace("BMW ", "")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fee Summary */}
                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Card Value</span>
                      <span className="font-medium">${(actualAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Starix Service Fee ({fee?.feePercentage || 2.5}%)</span>
                      <span className="font-medium">${(fee?.platformFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-primary">${(totalAmount || 0).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                      Service fee covers platform maintenance & support. When paying with crypto, additional network
                      fees from your wallet and exchange fees from SideShift may apply.
                    </p>
                  </div>

                  <Button
                    onClick={() => setStep("details")}
                    disabled={actualAmount < (settings?.minGiftCardValue || 5)}
                    className="w-full h-12 bg-primary text-primary-foreground"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="max-w-2xl mx-auto bg-card border-border">
              <CardHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("design")}
                  className="w-fit mb-2 -ml-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Card Details & Payment
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Add recipient info and choose how to pay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recipient Info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Recipient Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="h-11 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Recipient Email (Optional)</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="h-11 bg-background"
                    />
                  </div>
                </div>

                {/* Sender Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Your Name</Label>
                    <div className="flex items-center gap-2">
                      <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                      <span className="text-xs text-muted-foreground">Send anonymously</span>
                    </div>
                  </div>
                  <Input
                    placeholder="Your name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    disabled={isAnonymous}
                    className="h-11 bg-background"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label className="text-sm">Personal Message (Optional)</Label>
                  <Textarea
                    placeholder="Write a personal message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-background resize-none"
                    rows={3}
                  />
                </div>

                {/* Password Protection */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">Password Protection</Label>
                    </div>
                    <Switch checked={hasPassword} onCheckedChange={setHasPassword} />
                  </div>
                  {hasPassword && (
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 bg-background pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("crypto")}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        paymentMethod === "crypto"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Pay with Crypto</p>
                          <p className="text-xs text-muted-foreground">BTC, ETH, USDT & more</p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("balance")}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        paymentMethod === "balance"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Use Balance</p>
                          <p className="text-xs text-muted-foreground">${(balance || 0).toFixed(2)} available</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Crypto Payment Options */}
                {paymentMethod === "crypto" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Select Cryptocurrency</Label>
                      <Select value={selectedCoinId} onValueChange={setSelectedCoinId}>
                        <SelectTrigger className="h-12 bg-background">
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
                        className="h-12 bg-background font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        If the payment fails, funds will be refunded to this address
                      </p>
                    </div>

                    {/* Memo Warning */}
                    {selectedCoin?.hasMemo && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-amber-500">
                            <strong>{selectedCoin.symbol}</strong> requires a memo/tag. You will receive it after
                            clicking "Pay Now". Make sure to include it when sending.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quote */}
                    {quote && selectedCoin && (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">You pay:</span>
                          <span className="font-semibold">
                            {Number.parseFloat(quote.depositAmount).toFixed(8)} {selectedCoin.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-muted-foreground">Card value:</span>
                          <span className="font-semibold text-primary">${actualAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {loadingQuote && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Getting quote...</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === "balance" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Payment Summary
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gift Card Value</span>
                          <span className="font-medium">${(actualAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service Fee ({fee?.feePercentage || 2.5}%)</span>
                          <span className="font-medium text-amber-500">+${(fee?.platformFee || 0).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between">
                          <span className="font-medium">Total Deduction</span>
                          <span className="font-bold text-primary">${(totalAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Your Balance</span>
                          <span className={`font-medium ${balance >= totalAmount ? "text-green-500" : "text-red-500"}`}>
                            ${(balance || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-muted-foreground">After Purchase</span>
                          <span
                            className={`font-medium ${balance >= totalAmount ? "text-muted-foreground" : "text-red-500"}`}
                          >
                            ${Math.max(0, balance - totalAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {balance < totalAmount && (
                        <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                          <p className="text-xs text-red-500 text-center">
                            Insufficient balance. You need ${(totalAmount - balance).toFixed(2)} more.
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      The service fee ({fee?.feePercentage || 2.5}%) helps us maintain the platform and provide support.
                      No additional fees apply when paying from balance.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={paymentMethod === "balance" ? handlePurchaseWithBalance : handlePurchaseWithCrypto}
                  disabled={
                    loading ||
                    (paymentMethod === "balance" && balance < totalAmount) ||
                    (paymentMethod === "crypto" && (!selectedCoin || !quote || !refundAddress.trim()))
                  }
                  className="w-full h-12 bg-primary text-primary-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : paymentMethod === "balance" ? (
                    <>Pay ${totalAmount.toFixed(2)} from Balance</>
                  ) : (
                    <>
                      Pay Now
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
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Wallet className="w-5 h-5 text-primary" />
                  Complete Payment
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Send the exact amount to the address below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount to Send */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Send exactly:</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">
                    {shift.depositAmount} {selectedCoin?.symbol}
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
                      className="flex-shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Memo/Tag Section - Always show */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Memo / Tag</Label>
                    {shift.depositMemo ? (
                      <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                        Required
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Not Required
                      </span>
                    )}
                  </div>

                  {shift.depositMemo ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Input value={shift.depositMemo} readOnly className="font-mono text-xs bg-background" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(shift.depositMemo!, "memo")}
                          className="flex-shrink-0"
                        >
                          {copiedMemo ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-amber-500">
                            <strong>IMPORTANT:</strong> You MUST include this memo/tag when sending. Funds sent without
                            the correct memo may be lost permanently.
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-muted-foreground">
                          This cryptocurrency does not require a memo or tag. Just send to the address above.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add status display */}
                {paymentStatus && (
                  <div
                    className={`p-4 rounded-lg border text-center flex items-center gap-3 ${
                      paymentStatus.status === "complete"
                        ? "bg-green-500/10 border-green-500/30"
                        : paymentStatus.status === "error" ||
                            paymentStatus.status === "failed" ||
                            paymentStatus.status === "refunded" ||
                            paymentStatus.status === "timeout"
                          ? "bg-red-500/10 border-red-500/30"
                          : paymentStatus.status === "activating"
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-primary/10 border-primary/20"
                    }`}
                  >
                    {paymentStatus.status === "complete" && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                    {(paymentStatus.status === "error" ||
                      paymentStatus.status === "failed" ||
                      paymentStatus.status === "refunded" ||
                      paymentStatus.status === "timeout") && (
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    {paymentStatus.status === "activating" && (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500 flex-shrink-0" />
                    )}
                    {!(
                      paymentStatus.status === "complete" ||
                      paymentStatus.status === "error" ||
                      paymentStatus.status === "failed" ||
                      paymentStatus.status === "refunded" ||
                      paymentStatus.status === "timeout" ||
                      paymentStatus.status === "activating"
                    ) && <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-left">{paymentStatus.message}</p>
                      {paymentStatus.deposits && paymentStatus.deposits.length > 0 && (
                        <p className="text-xs text-muted-foreground text-left mt-1">
                          Deposited: {paymentStatus.deposits.map((d) => `${d.amount}`).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Countdown Timer */}
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

                {giftCardCode && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-xs text-green-600">
                      Your gift card code: <strong className="font-mono">{giftCardCode}</strong>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Save this code! It will be activated once payment is confirmed.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs sm:text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function calculateFee(amount: number, feePercentage?: number, feeMinimum?: number) {
  const percentageFee = (amount * (feePercentage || 2.5)) / 100
  const platformFee = Math.max(percentageFee, feeMinimum || 0.5)
  return { platformFee, feePercentage, feeMinimum }
}

function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
