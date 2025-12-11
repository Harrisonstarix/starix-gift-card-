import { BuyGiftCardForm } from "@/components/buy-gift-card-form"
import { Navbar } from "@/components/navbar"

export default function BuyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4">
            Create Your{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Gift Card
            </span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Choose a design, set the value, and pay with any cryptocurrency
          </p>
        </div>

        <BuyGiftCardForm />
      </div>
    </main>
  )
}
