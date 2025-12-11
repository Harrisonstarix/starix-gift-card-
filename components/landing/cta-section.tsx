"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export function CTASection() {
  return (
    <section className="py-12 sm:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />

          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          {/* Content - Simpler, more direct CTA */}
          <div className="relative px-6 sm:px-12 py-16 sm:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white max-w-2xl mx-auto leading-tight">
              Ready to Send Your First Crypto Gift?
            </h2>

            <p className="mt-4 text-base sm:text-lg text-white/80 max-w-lg mx-auto">
              Create a gift card in minutes. Share the code. Let them choose their crypto.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/buy">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 text-base bg-white text-emerald-600 hover:bg-white/90 shadow-lg font-semibold"
                >
                  Create Gift Card
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/redeem">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-8 text-base border-2 border-white/30 text-white hover:bg-white/10 bg-transparent font-semibold"
                >
                  Redeem a Code
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/60">
              Powered by{" "}
              <a
                href="https://sideshift.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white underline"
              >
                SideShift.ai
              </a>{" "}
              — Supports Bitcoin, Ethereum, Solana, and hundreds more
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
