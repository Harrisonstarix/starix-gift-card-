"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Wallet, Gift } from "lucide-react"

export default function UnderpaymentPage() {
  const searchParams = useSearchParams()
  const amount = searchParams.get("amount") || "0"

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">Underpayment Detected</h1>
              <p className="text-muted-foreground mb-6">
                The amount sent was below the minimum required for a gift card.
              </p>

              <div className="p-4 rounded-xl bg-background border border-green-500/30 mb-6">
                <div className="flex items-center justify-center gap-2 text-green-500 mb-2">
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium">Added to Your Balance</span>
                </div>
                <p className="text-2xl font-bold text-foreground">${Number(amount).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Use this balance for your next purchase</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/buy">
                    <Gift className="w-4 h-4 mr-2" />
                    Buy Gift Card with Balance
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
