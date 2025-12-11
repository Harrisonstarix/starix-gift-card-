"use client"

import { motion } from "framer-motion"
import { CARD_DESIGNS } from "@/lib/card-designs"
import Image from "next/image"

export function CardShowcase() {
  // Select 6 featured card designs
  const featuredDesigns = CARD_DESIGNS.slice(0, 6)

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Premium Card Collection</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Choose from our exclusive collection of 50+ designs featuring luxury cars, phones, special occasions and
            more
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {featuredDesigns.map((design, index) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative aspect-[1.6/1] rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${design.gradient}`} />

                {/* Car Image */}
                <Image
                  src={design.image || "/placeholder.svg"}
                  alt={design.name}
                  fill
                  className="object-cover opacity-70 group-hover:opacity-80 transition-opacity"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Card Content */}
                <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between">
                  {/* Top - Logo */}
                  <div className="flex items-start justify-between">
                    <div className="bg-white/10 backdrop-blur-sm rounded-md px-2 py-1">
                      <span className="text-[10px] sm:text-xs font-bold text-white tracking-wider">STARIX</span>
                    </div>
                    <div className="bg-emerald-500/20 backdrop-blur-sm rounded-md px-2 py-1">
                      <span className="text-[10px] sm:text-xs font-medium text-emerald-400">GIFT CARD</span>
                    </div>
                  </div>

                  {/* Bottom - Info */}
                  <div>
                    <p className="text-white font-semibold text-sm sm:text-base truncate">{design.name}</p>
                    <p className="text-white/60 text-[10px] sm:text-xs">{design.description}</p>
                  </div>
                </div>

                {/* Shine effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Link - Updated count to 50+ */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-muted-foreground">
            <span className="text-emerald-500 font-semibold">50+</span> premium designs available
          </p>
        </motion.div>
      </div>
    </section>
  )
}
