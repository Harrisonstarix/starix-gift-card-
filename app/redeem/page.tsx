import { RedeemGiftCard } from "@/components/redeem-gift-card"
import { Navbar } from "@/components/navbar"
import { Suspense } from "react"

function RedeemContent({ searchParams }: { searchParams: { code?: string } }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <RedeemGiftCard initialCode={searchParams.code || ""} />
    </div>
  )
}

export default async function RedeemPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4">
                Redeem Your Gift Card
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">Loading...</p>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        }
      >
        <RedeemContent searchParams={params} />
      </Suspense>
    </main>
  )
}
