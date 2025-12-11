import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Cookie } from "lucide-react"

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Cookie className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Cookie Policy</h1>
              <p className="text-muted-foreground">Last updated: December 2025</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website.
                They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies to understand how you use our website, remember your preferences, and improve your
                experience. We also use cookies to keep you signed in and to process transactions securely.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground">Essential Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    These cookies are necessary for the website to function properly. They enable basic functions like
                    page navigation and access to secure areas of the website.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Functional Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    These cookies enable the website to provide enhanced functionality and personalization, such as
                    remembering your login details and preferences.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Analytics Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    These cookies help us understand how visitors interact with our website by collecting and reporting
                    information anonymously.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Most web browsers allow you to control cookies through their settings. You can set your browser to
                refuse cookies or delete certain cookies. However, if you block or delete cookies, some features of our
                website may not work properly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Some cookies may be placed by third-party services that appear on our pages. We do not control these
                cookies and recommend you check the third-party websites for more information about their cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new
                policy on this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about our use of cookies, please contact us through our support page.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
