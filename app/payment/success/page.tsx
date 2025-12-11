"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Gift, Copy, Check, Loader2 } from "lucide-react"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cardData, setCardData] = useState<{
    code: string
    value: number
    status: string
  } | null>(null)

  const shiftId = searchParams.get("shift")
  const code = searchParams.get("code")

  useEffect(() => {
    if (!shiftId) {
      setLoading(false)
      return
    }

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/gift-cards/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shiftId }),
        })
        const data = await res.json()

        if (data.success && data.status === "active") {
          setCardData({
            code: data.code || code || "",
            value: data.finalValue || 0,
            status: "active",
          })
        }
      } catch (err) {
        console.error("Status check error:", err)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [shiftId, code])

  const handleCopy = () => {
    if (cardData?.code) {
      navigator.clipboard.writeText(cardData.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          {loading ? (
            <Card className="border-border">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Processing Payment</h2>
                <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
              </CardContent>
            </Card>
          ) : cardData ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground mb-6">Your ${cardData.value.toFixed(2)} gift card is ready</p>

                <div className="p-4 rounded-xl bg-background border border-border mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Your Gift Card Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-xl font-mono font-bold text-foreground">{cardData.code}</code>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button asChild className="w-full">
                    <Link href="/dashboard">
                      <Gift className="w-4 h-4 mr-2" />
                      View My Cards
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <Link href="/buy">Buy Another Card</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-primary" />
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-2">Payment Received</h1>
                <p className="text-muted-foreground mb-6">
                  Your payment is being processed. Check your dashboard for updates.
                </p>

                <Button asChild className="w-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
