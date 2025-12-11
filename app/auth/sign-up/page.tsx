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
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.replace("/dashboard")
      }
    }
    checkUser()
  }, [supabase, router])

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase", met: /[A-Z]/.test(password) },
  ]

  const allRequirementsMet = passwordRequirements.every((req) => req.met)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!allRequirementsMet) {
      setError("Please meet all password requirements")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (error) throw error

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      })

      router.push("/auth/sign-up-success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up")
      toast({
        title: "Sign up failed",
        description: err instanceof Error ? err.message : "Failed to create account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col xl:flex-row">
      {/* Left side - Branding - Only show on xl screens */}
      <div className="hidden xl:flex xl:w-1/2 bg-gradient-to-br from-background via-muted to-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
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
            Join the Future of{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Crypto Gifting
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md text-pretty">
            Create your free account and start sending premium crypto gift cards in minutes. No complicated setup, no
            hidden fees.
          </p>

          <div className="mt-12 space-y-4">
            {[
              "Send beautiful crypto gifts",
              "200+ cryptocurrencies supported",
              "Track all your gift cards",
              "Premium designs included",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form - Better padding for mobile */}
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
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
              <CardDescription>Start your crypto gifting journey</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 bg-background/50"
                    disabled={isLoading}
                  />
                </div>

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

                  <div className="space-y-1 mt-2">
                    {passwordRequirements.map((req) => (
                      <div
                        key={req.label}
                        className={`text-xs flex items-center gap-1.5 ${req.met ? "text-emerald-500" : "text-muted-foreground"}`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${req.met ? "bg-emerald-500" : "bg-muted-foreground/50"}`}
                        />
                        {req.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-background/50"
                    disabled={isLoading}
                  />
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
                      Create Account
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/auth/login" className="text-emerald-500 hover:text-emerald-400 font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
