"use client"

import { motion } from "framer-motion"
import { Gift, Send, CreditCard } from "lucide-react"

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How Starix Works</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to send the perfect crypto gift
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6"
          >
            <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
              1
            </div>
            <CreditCard className="w-8 h-8 text-emerald-500 mb-4 mt-2" />
            <h3 className="text-lg font-bold text-foreground mb-2">Pick Value & Design</h3>
            <p className="text-sm text-muted-foreground">
              Select any amount you want and choose from our premium BMW card collection.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 rounded-2xl p-6"
          >
            <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
              2
            </div>
            <Send className="w-8 h-8 text-teal-500 mb-4 mt-2" />
            <h3 className="text-lg font-bold text-foreground mb-2">Pay & Share Code</h3>
            <p className="text-sm text-muted-foreground">
              Pay with crypto or account balance. Get your unique gift code instantly to share.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-6"
          >
            <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">
              3
            </div>
            <Gift className="w-8 h-8 text-cyan-500 mb-4 mt-2" />
            <h3 className="text-lg font-bold text-foreground mb-2">Recipient Redeems</h3>
            <p className="text-sm text-muted-foreground">
              They log in, enter the code, pick their preferred crypto, and receive it in their wallet.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
