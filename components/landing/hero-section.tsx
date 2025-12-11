"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { GiftCard3D } from "@/components/gift-card-3d"
import { CARD_DESIGNS } from "@/lib/card-designs"

export function HeroSection() {
  const showcaseCards = CARD_DESIGNS.slice(0, 3)

  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">The Future of Crypto Gifting</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
            >
              Send Crypto Gifts
              <br />
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                They&apos;ll Actually Love
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Beautiful gift cards loaded with crypto value. You pick the design and amount, they choose which
              cryptocurrency to receive — <span className="text-foreground font-medium">Bitcoin, Ethereum, Solana</span>
              , and 200+ more.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                50+ Premium Designs
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Instant Delivery
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Low Fees
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/buy">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 font-semibold"
                >
                  Create Gift Card
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/redeem">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-8 text-base border-2 hover:bg-muted/50 bg-transparent font-semibold"
                >
                  Redeem a Card
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right side - Cards (unchanged) */}
          <div className="relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative"
            >
              {/* Main featured card */}
              <div className="relative z-10">
                <GiftCard3D design={showcaseCards[0]} value={100} className="w-[380px] mx-auto" />
              </div>

              {/* Second card - behind and to the left */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 0.8, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute -left-8 top-8 z-0 transform -rotate-6"
              >
                <GiftCard3D design={showcaseCards[1]} value={50} className="w-[320px]" />
              </motion.div>

              {/* Third card - behind and to the right */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 0.6, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute -right-8 top-16 z-0 transform rotate-6"
              >
                <GiftCard3D design={showcaseCards[2]} value={250} className="w-[280px]" />
              </motion.div>

              {/* Glow effect behind cards */}
              <div className="absolute inset-0 -z-10 blur-3xl opacity-30">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full" />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:hidden flex justify-center"
          >
            <GiftCard3D design={showcaseCards[0]} value={100} className="w-[320px] sm:w-[380px]" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
