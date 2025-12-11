import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FileText } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: December 2025</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Starix, you accept and agree to be bound by the terms and provisions of this
                agreement. If you do not agree to abide by these terms, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                Starix provides a platform for purchasing and redeeming cryptocurrency gift cards. Our service allows
                users to create gift cards backed by cryptocurrency value, which recipients can redeem for their
                preferred cryptocurrency.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users are responsible for maintaining the confidentiality of their account information and gift card
                codes. You agree to notify us immediately of any unauthorized use of your account or any other breach of
                security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Payment and Fees</h2>
              <p className="text-muted-foreground leading-relaxed">
                All payments are processed through secure cryptocurrency transactions. Fees may apply to certain
                transactions and will be clearly displayed before confirmation. All sales are final once the transaction
                is confirmed on the blockchain.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Gift Card Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Gift cards have no expiration date. The value of a gift card is denominated in USD but redeemable for
                cryptocurrency at the current market rate at the time of redemption. Gift card codes should be kept
                secure and not shared with unintended recipients.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Starix shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                resulting from your use of the service. This includes but is not limited to loss of profits, data, or
                other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Modifications to Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or discontinue the service at any time without notice. We shall not be
                liable to you or any third party for any modification, suspension, or discontinuance of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our support page.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
