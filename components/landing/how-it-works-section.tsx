"use client"

import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

const benefits = [
  {
    title: "Perfect for Any Occasion",
    points: [
      "Birthday gifts that let them choose",
      "Holiday presents without the guesswork",
      "Thank you gifts with a personal touch",
      "Onboarding new crypto users easily",
    ],
  },
  {
    title: "Recipient-Friendly Experience",
    points: [
      "Simple account creation to redeem",
      "Easy code redemption process",
      "Choice of Bitcoin, Ethereum, Solana, and more",
      "Direct deposit to any wallet address",
    ],
  },
  {
    title: "Secure & Transparent",
    points: [
      "Funds stored safely until redemption",
      "Low service fees - transparent pricing",
      "Powered by SideShift for reliable swaps",
      "50+ premium card designs to choose from",
    ],
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Why Choose Starix?</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">The easiest way to share crypto with anyone</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">{benefit.title}</h3>
              <ul className="space-y-3">
                {benefit.points.map((point, pointIndex) => (
                  <li key={pointIndex} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
