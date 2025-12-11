"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { XCircle, RefreshCw, HelpCircle } from "lucide-react"

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason") || "Payment could not be completed"

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h1>
              <p className="text-muted-foreground mb-6">{reason}</p>

              <div className="p-4 rounded-xl bg-background border border-border mb-6 text-left">
                <h3 className="font-medium text-foreground mb-2">What happened?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Payment window may have expired</li>
                  <li>- Insufficient funds were sent</li>
                  <li>- Network congestion caused delay</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/buy">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/support">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Get Help
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
