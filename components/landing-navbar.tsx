"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/starix-logo.jpg"
              alt="Starix"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-lg"
            />
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Starix</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="/redeem"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Redeem
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-sm font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-6">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background/95 backdrop-blur-md">
            <nav className="flex flex-col gap-1">
              <Link
                href="#how-it-works"
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#features"
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/redeem"
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Redeem
              </Link>
              <div className="flex gap-3 mt-4 pt-4 border-t border-border px-4">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up" className="flex-1">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Get Started</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
