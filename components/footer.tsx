import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="py-12 sm:py-16 bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/starix-logo.jpg"
                alt="Starix"
                width={40}
                height={40}
                className="w-10 h-10 rounded-xl object-cover shadow-lg"
              />
              <span className="text-xl font-bold text-foreground">Starix</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The easiest way to gift cryptocurrency. Buy a card, share the code, and let them redeem for their favorite
              crypto.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Gift Cards</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/buy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Buy Gift Card
                </Link>
              </li>
              <li>
                <Link href="/redeem" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Redeem Card
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/deposit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Deposit Funds
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About Starix
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Starix. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Powered by</span>
              <a
                href="https://sideshift.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                SideShift.ai
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
