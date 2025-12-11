"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import {
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  Menu,
  X,
  Gift,
  CreditCard,
  HelpCircle,
  Settings,
  Wallet,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { cn } from "@/lib/utils"

const ADMIN_EMAIL = "ighanghangodspower@gmail.com"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [balance, setBalance] = useState<number>(0)

  const isAdmin = user?.email === ADMIN_EMAIL || user?.user_metadata?.is_admin === true

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/user/balance")
        if (res.ok) {
          const data = await res.json()
          setBalance(data.balance || 0)
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err)
      }
    }
    fetchBalance()
  }, [user])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const publicNavLinks = [
    { href: "/redeem", label: "Redeem Gift Card", icon: Gift },
    { href: "/support", label: "Support", icon: HelpCircle },
  ]

  const authNavLinks = [
    { href: "/buy", label: "Buy Gift Card", icon: CreditCard },
    { href: "/deposit", label: "Deposit", icon: Wallet },
    { href: "/dashboard", label: "My Cards", icon: LayoutDashboard },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Renamed to Starix */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/starix-logo.jpg"
              alt="Starix"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">Starix</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Public links - always visible */}
            {publicNavLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors",
                    pathname === link.href && "text-foreground bg-muted",
                  )}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}
            {/* Auth links - only when logged in */}
            {user &&
              authNavLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-muted-foreground hover:text-foreground transition-colors",
                      pathname === link.href && "text-foreground bg-muted",
                    )}
                  >
                    <link.icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {user && (
              <Link href="/deposit">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-500">${balance.toFixed(2)}</span>
                </div>
              </Link>
            )}

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                      {user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.email}</p>
                    {isAdmin && <p className="text-xs text-emerald-500">Administrator</p>}
                    <p className="text-xs text-muted-foreground mt-1">Balance: ${balance.toFixed(2)}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/deposit" className="cursor-pointer">
                      <Wallet className="w-4 h-4 mr-2" />
                      Deposit Funds
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/buy" className="cursor-pointer">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Buy Gift Card
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      My Gift Cards
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/25">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col gap-2">
              {user && (
                <Link href="/deposit" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-2">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-500">Balance: ${balance.toFixed(2)}</span>
                  </div>
                </Link>
              )}
              {/* Public links */}
              {publicNavLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-muted-foreground hover:text-foreground",
                      pathname === link.href && "text-foreground bg-muted",
                    )}
                  >
                    <link.icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              {/* Auth links - only when logged in */}
              {user &&
                authNavLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-muted-foreground hover:text-foreground",
                        pathname === link.href && "text-foreground bg-muted",
                      )}
                    >
                      <link.icon className="w-4 h-4 mr-2" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
