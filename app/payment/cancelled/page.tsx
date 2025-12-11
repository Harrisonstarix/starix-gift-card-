"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, RefreshCw, Home } from "lucide-react"

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">Payment Cancelled</h1>
              <p className="text-muted-foreground mb-6">
                Your payment was cancelled or expired. No funds have been charged.
              </p>

              <div className="flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/buy">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start New Purchase
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
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
