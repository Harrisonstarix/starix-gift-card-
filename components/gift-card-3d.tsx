"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { type CardDesignConfig, getDesignById, CARD_DESIGNS } from "@/lib/card-designs"

export type CardDesign = string

interface GiftCard3DProps {
  variant?: string
  design?: CardDesignConfig
  value?: number
  amount?: number
  recipientName?: string
  holographic?: boolean
  className?: string
  code?: string
  showBack?: boolean
  autoFlipDelay?: number
  onFlipComplete?: () => void
}

export function GiftCard3D({
  variant = "obsidian",
  design: designProp,
  value,
  amount,
  recipientName,
  holographic = false,
  className,
  code,
  showBack = false,
  autoFlipDelay = 0,
  onFlipComplete,
}: GiftCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isFlipped, setIsFlipped] = useState(showBack)

  const design: CardDesignConfig = designProp || getDesignById(variant) || CARD_DESIGNS[0]
  const hasImage = !!design.image

  const displayValue = amount ?? value ?? 100

  useEffect(() => {
    if (autoFlipDelay > 0 && isFlipped) {
      const timer = setTimeout(() => {
        setIsFlipped(false)
        onFlipComplete?.()
      }, autoFlipDelay)
      return () => clearTimeout(timer)
    }
  }, [autoFlipDelay, isFlipped, onFlipComplete])

  useEffect(() => {
    setIsFlipped(showBack)
  }, [showBack])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 12
    const rotateY = (centerX - x) / 12

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current || isFlipped) return
    cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
  }

  return (
    <div className={cn("relative", className)} style={{ perspective: "1000px" }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full max-w-[380px] aspect-[380/240] mx-auto transition-transform duration-700 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front of card */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-zinc-900 p-[1px]">
            <div
              className={cn(
                "w-full h-full rounded-2xl relative overflow-hidden",
                hasImage ? "bg-black" : `bg-gradient-to-br ${design.gradient}`,
              )}
            >
              {hasImage && (
                <div className="absolute inset-0">
                  <Image
                    src={design.image || "/placeholder.svg"}
                    alt={design.name}
                    fill
                    className="object-cover"
                    style={{ objectPosition: "center" }}
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                </div>
              )}

              {holographic && (
                <div
                  className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
                  style={{
                    background: `linear-gradient(
                      135deg,
                      transparent 0%,
                      rgba(255,255,255,0.3) 25%,
                      transparent 50%,
                      rgba(255,255,255,0.3) 75%,
                      transparent 100%
                    )`,
                    backgroundSize: "200% 200%",
                    animation: "holographic 3s ease infinite",
                  }}
                />
              )}

              <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative h-full p-4 sm:p-6 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/starix-logo.jpg"
                      alt="Starix"
                      width={32}
                      height={32}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover"
                    />
                    <span className="font-semibold text-xs sm:text-sm tracking-wide text-white drop-shadow-lg">
                      Starix
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <div className="text-3xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    ${displayValue}
                  </div>
                  <div className="text-xs sm:text-sm mt-1 text-white/80 drop-shadow-lg">{design.name}</div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="min-w-0 flex-1">
                    {recipientName && (
                      <div className="text-xs sm:text-sm font-medium mb-1 text-white drop-shadow-lg truncate">
                        {recipientName}
                      </div>
                    )}
                    {code && (
                      <div className="font-mono text-[10px] sm:text-xs tracking-widest text-white/70 drop-shadow truncate">
                        {code}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none" />
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-black" />
        </div>
      </div>

      {/* Shadow */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[85%] h-6 sm:h-8 rounded-full blur-xl opacity-40 max-w-[320px]"
        style={{ backgroundColor: design.accentColor }}
      />

      <style jsx>{`
        @keyframes holographic {
          0%,
          100% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
        }
      `}</style>
    </div>
  )
}
