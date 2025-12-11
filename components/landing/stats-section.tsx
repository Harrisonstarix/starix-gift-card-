"use client"

import { motion } from "framer-motion"

const stats = [
  {
    value: "50+",
    label: "Premium Designs",
    sublabel: "Cars, phones, occasions & more",
  },
  {
    value: "Low",
    label: "Service Fees",
    sublabel: "Transparent pricing",
  },
  {
    value: "3 min",
    label: "Average Redemption",
    sublabel: "Fast delivery",
  },
  {
    value: "200+",
    label: "Cryptocurrencies",
    sublabel: "Bitcoin, ETH, SOL & more",
  },
]

export function StatsSection() {
  return (
    <section className="py-16 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold text-emerald-500 mb-2">{stat.value}</div>
              <div className="text-base font-semibold text-foreground">{stat.label}</div>
              <div className="text-sm text-muted-foreground">{stat.sublabel}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
