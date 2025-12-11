import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Shield } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: December 2025</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us, such as when you create an account, make a purchase,
                or contact us for support. This may include your email address, wallet addresses, and transaction
                history.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, process transactions,
                send you technical notices and support messages, and respond to your comments and questions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not share your personal information with third parties except as described in this policy. We may
                share information with service providers who assist us in operating our platform, or when required by
                law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We take reasonable measures to help protect your personal information from loss, theft, misuse, and
                unauthorized access. However, no security system is impenetrable, and we cannot guarantee the security
                of our systems.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Blockchain Transactions</h2>
              <p className="text-muted-foreground leading-relaxed">
                Please note that blockchain transactions are public by nature. When you make a cryptocurrency
                transaction, the transaction details are recorded on the public blockchain and cannot be deleted.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our service and hold certain
                information. You can instruct your browser to refuse all cookies or indicate when a cookie is being
                sent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, update, or delete your personal information at any time. You can do this
                through your account settings or by contacting our support team.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through our support page.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
