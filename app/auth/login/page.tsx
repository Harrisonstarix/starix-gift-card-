"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useState, Suspense, useEffect } from "react"
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        window.location.href = redirect
      }
    }
    checkUser()
  }, [supabase, redirect])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Login successful!",
        description: "Redirecting to dashboard...",
      })

      window.location.href = redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Failed to sign in",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col xl:flex-row">
      {/* Left side - Branding - Only show on xl screens (1280px+) */}
      <div className="hidden xl:flex xl:w-1/2 bg-gradient-to-br from-background via-muted to-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <Image
              src="/starix-logo.jpg"
              alt="Starix"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-cover"
            />
            <span className="font-heading text-2xl font-bold text-foreground">Starix</span>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">
            The Premium Way to Gift{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Cryptocurrency
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md text-pretty">
            Create stunning digital gift cards backed by real value. Recipients choose their crypto, you choose the
            experience.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-500">200+</div>
              <div className="text-sm text-muted-foreground">Cryptocurrencies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-500">Instant</div>
              <div className="text-sm text-muted-foreground">Delivery</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-500">0%</div>
              <div className="text-sm text-muted-foreground">Volatility</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form - flex-1 with safe area padding */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="xl:hidden flex justify-center mb-4">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/starix-logo.jpg"
                    alt="Starix"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <span className="font-heading text-xl font-bold">Starix</span>
                </Link>
              </div>
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-background/50"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-12 bg-background/50"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">{error}</div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <Link href="/auth/sign-up" className="text-emerald-500 hover:text-emerald-400 font-medium">
                  Create one
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
