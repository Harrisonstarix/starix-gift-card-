import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Starix - Premium Crypto Gift Cards",
  description:
    "The most elegant way to gift cryptocurrency. Send premium digital gift cards that recipients can redeem in any cryptocurrency. Fixed USD value, any crypto — zero volatility risk.",
  generator: "v0.app",
  icons: {
    icon: "/starix-logo.jpg",
    shortcut: "/starix-logo.jpg",
    apple: "/starix-logo.jpg",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
