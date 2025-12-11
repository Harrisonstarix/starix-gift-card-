import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowRight, Home } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-muted to-background">
      <Card className="max-w-md w-full border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription>Something went wrong during authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-muted-foreground text-center">
              The link may have expired or been used already. Please try signing in again or request a new verification
              email.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/auth/login">
              <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                Try Again
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <Link href="/">
              <Button variant="ghost" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
