"use client"

import { LandingNavbar } from "@/components/landing-navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Shield,
  Globe,
  Coins,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  Lightbulb,
  Code2,
  Rocket,
  Users,
  TrendingUp,
} from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-600">
              About Our Platform
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              The Future of Crypto Gifting
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We built a platform that makes sending and receiving cryptocurrency as simple as giving a gift card. No
              wallet setup required for recipients - just redeem in any crypto you prefer.
            </p>
          </div>
        </section>

        {/* What It Does */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">What It Does</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <Coins className="w-8 h-8 text-emerald-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Buy Gift Cards with Crypto</h3>
                  <p className="text-muted-foreground text-sm">
                    Purchase digital gift cards using any supported cryptocurrency. Pay with BTC, ETH, USDT, or 50+
                    other coins through our SideShift integration.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-6">
                  <ArrowRightLeft className="w-8 h-8 text-emerald-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Redeem in Any Crypto</h3>
                  <p className="text-muted-foreground text-sm">
                    Recipients choose their preferred cryptocurrency at redemption. No need to match the payment coin -
                    receive BTC even if paid with ETH.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-6">
                  <Globe className="w-8 h-8 text-emerald-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Wallet Required</h3>
                  <p className="text-muted-foreground text-sm">
                    Gift recipients don't need an existing wallet. They simply enter any valid wallet address during
                    redemption and receive their crypto directly.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-6">
                  <Clock className="w-8 h-8 text-emerald-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Real-Time Processing</h3>
                  <p className="text-muted-foreground text-sm">
                    Payments are verified on-chain through SideShift's infrastructure. Status updates in real-time from
                    payment detection to wallet delivery.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Problem It Solves */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">The Problem We Solve</h2>
            </div>

            <div className="space-y-6">
              <Card className="border-border/50 bg-red-500/5 border-red-500/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-red-600">Traditional Crypto Gifting Issues</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      Recipients need to already have a wallet and understand crypto
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      Sender must know recipient's wallet address in advance
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      Recipient stuck with whatever coin sender chooses
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      Complex exchange process to convert between coins
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-emerald-600">Our Solution</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      Gift cards work like cash - recipient decides how to use it
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      No wallet address needed upfront - share just the code
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      Recipient chooses their crypto at redemption time
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      Automatic conversion via SideShift - no manual trading
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Technologies Used */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Technologies Used</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Next.js 15", desc: "React framework with App Router" },
                { name: "TypeScript", desc: "Type-safe development" },
                { name: "Supabase", desc: "PostgreSQL database & auth" },
                { name: "SideShift.ai", desc: "Crypto exchange API" },
                { name: "Tailwind CSS", desc: "Utility-first styling" },
                { name: "shadcn/ui", desc: "Component library" },
                { name: "Vercel", desc: "Deployment platform" },
                { name: "ethers.js", desc: "Blockchain interactions" },
                { name: "Recharts", desc: "Analytics visualizations" },
              ].map((tech) => (
                <Card key={tech.name} className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm">{tech.name}</h3>
                    <p className="text-xs text-muted-foreground">{tech.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How We Built It */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">How We Built It</h2>
            </div>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Architecture:</strong> We designed a full-stack application with
                    Next.js App Router for server components and API routes. The database layer uses Supabase with
                    PostgreSQL, handling users, gift cards, transactions, and admin settings.
                  </p>
                  <p>
                    <strong className="text-foreground">Payment Flow:</strong> Integration with SideShift.ai API enables
                    cross-chain cryptocurrency conversions. When a user deposits, we create a "shift" that provides a
                    unique deposit address. The system polls SideShift's status endpoint to track payment progress.
                  </p>
                  <p>
                    <strong className="text-foreground">Treasury System:</strong> For redemptions, the platform
                    maintains a treasury wallet (configured by admin). When users redeem cards, funds are sent from the
                    treasury to SideShift, which converts and delivers to the user's chosen wallet.
                  </p>
                  <p>
                    <strong className="text-foreground">Real-Time Updates:</strong> Status polling every 5 seconds
                    provides live feedback during payments. Users see transaction progress from "waiting" through
                    "settled" with clear status messages.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Challenges */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Challenges We Faced</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Cross-Chain Complexity",
                  desc: "Different blockchains have different confirmation times, memo requirements, and address formats. We had to handle each network's quirks while providing a unified user experience.",
                },
                {
                  title: "Payment Verification",
                  desc: "Ensuring payments are properly credited even if users close their browser. We implemented a recovery system to check for settled payments that weren't confirmed.",
                },
                {
                  title: "Treasury Management",
                  desc: "Automating outbound payments requires secure key management. The treasury private key enables automatic redemption processing while keeping funds secure.",
                },
                {
                  title: "Rate Fluctuations",
                  desc: "Crypto prices change rapidly. We use SideShift's quote system to lock in rates and show users exactly what they'll receive before confirming.",
                },
              ].map((challenge, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{challenge.title}</h3>
                    <p className="text-xs text-muted-foreground">{challenge.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What We Learned */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">What We Learned</h2>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">User Experience Matters:</strong> Crypto can be intimidating.
                  Clear status messages, progress indicators, and simple flows make all the difference.
                </p>
                <p>
                  <strong className="text-foreground">Error Handling is Critical:</strong> Network issues, API failures,
                  and edge cases happen. Robust error handling and recovery mechanisms are essential.
                </p>
                <p>
                  <strong className="text-foreground">Security First:</strong> Handling financial transactions requires
                  careful attention to authentication, authorization, and secure key storage.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* What's Next */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">What's Next</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Webhook integration for instant payment confirmation",
                "Email notifications for gift card delivery",
                "Mobile app for iOS and Android",
                "Additional payment methods (credit card, bank transfer)",
                "Multi-language support",
                "Scheduled gift card delivery",
                "Bulk purchase for businesses",
                "API for third-party integrations",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
