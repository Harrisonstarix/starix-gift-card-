import { DepositForm } from "@/components/deposit-form"
import { Navbar } from "@/components/navbar"

export default function DepositPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Deposit{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                Funds
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Add funds to your balance to purchase gift cards instantly
            </p>
          </div>
          <DepositForm />
        </div>
      </main>
    </div>
  )
}
