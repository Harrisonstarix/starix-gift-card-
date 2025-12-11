import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowRight, Sparkles } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-muted to-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="relative max-w-md w-full border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>{"We've sent you a verification link"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in your email to verify your account and get started with Starix. The link will expire in
              24 hours.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/auth/login">
              <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                Go to Sign In
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <Link href="/">
              <Button variant="ghost" className="w-full">
                Return to Home
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="w-4 h-4" />
              Starix
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
