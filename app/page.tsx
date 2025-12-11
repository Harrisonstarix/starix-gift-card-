import { LandingNavbar } from "@/components/landing-navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { StatsSection } from "@/components/landing/stats-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { CardShowcase } from "@/components/landing/card-showcase"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <LandingNavbar />
      <HeroSection />
      <StatsSection />
      <CardShowcase />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  )
}
