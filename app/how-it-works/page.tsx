import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CreditCard, Wallet, Gift, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How <span className="text-emerald-500">Starix</span> Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Send crypto gift cards in three simple steps. No complicated setup required.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-8 mb-16">
            {/* Step 1 */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-500 font-bold text-xl">1</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-xl font-semibold text-foreground">Choose Amount & Design</h2>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Select your gift card value from $5 to $10,000. Pick a design that matches the occasion - birthday,
                    holiday, thank you, or any celebration.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      50+ premium designs - cars, phones, occasions & more
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Add optional password protection
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Include a personal message
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-emerald-500 rotate-90" />
            </div>

            {/* Step 2 */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-500 font-bold text-xl">2</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-xl font-semibold text-foreground">Pay with Crypto</h2>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Pay using any of 200+ supported cryptocurrencies. We handle the conversion automatically through
                    SideShift.ai's instant settlement.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Bitcoin, Ethereum, USDT, and 200+ more
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Instant payment confirmation
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Secure and transparent pricing
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-emerald-500 rotate-90" />
            </div>

            {/* Step 3 */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-500 font-bold text-xl">3</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-xl font-semibold text-foreground">Send & Redeem</h2>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Your recipient gets a unique code they can redeem for any cryptocurrency to their wallet. They
                    choose what they want - complete flexibility.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Quick sign up to redeem your gift
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Funds sent directly to their wallet
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Choose from 200+ cryptocurrencies
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Ready to send a crypto gift?</h2>
            <p className="text-muted-foreground mb-6">Create your first gift card in minutes.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/buy">
                  Create Gift Card
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/redeem">Redeem a Card</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
