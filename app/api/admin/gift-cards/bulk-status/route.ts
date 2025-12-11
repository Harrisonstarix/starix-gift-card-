import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

// Valid statuses that match the database check constraint
const VALID_STATUSES = ["pending", "active", "redeemed", "expired", "cancelled"]

export async function POST(request: NextRequest) {
  try {
    // Auth check - must be admin
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { codes, status } = body

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      )
    }

    // Parse codes - handle both array and newline-separated string
    let cardCodes: string[] = []
    if (Array.isArray(codes)) {
      cardCodes = codes
    } else if (typeof codes === "string") {
      // Split by newline, comma, or space and filter empty
      cardCodes = codes
        .split(/[\n,\s]+/)
        .map((c: string) => c.trim().toUpperCase())
        .filter((c: string) => c.length > 0)
    }

    if (cardCodes.length === 0) {
      return NextResponse.json({ error: "No valid card codes provided" }, { status: 400 })
    }

    if (cardCodes.length > 100) {
      return NextResponse.json({ error: "Maximum 100 cards can be updated at once" }, { status: 400 })
    }

    // Use service client to bypass RLS
    const serviceSupabase = createServiceClient()

    // Get all matching cards
    const { data: existingCards, error: fetchError } = await serviceSupabase
      .from("gift_cards")
      .select("id, code, status")
      .in("code", cardCodes)

    if (fetchError) {
      console.error("Failed to fetch cards:", fetchError)
      return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 })
    }

    const foundCodes = existingCards?.map((c) => c.code) || []
    const notFoundCodes = cardCodes.filter((c) => !foundCodes.includes(c))

    // Update all found cards
    const results: { code: string; success: boolean; oldStatus?: string; newStatus?: string; error?: string }[] = []

    for (const card of existingCards || []) {
      // Skip if already in target status
      if (card.status === status) {
        results.push({
          code: card.code,
          success: true,
          oldStatus: card.status,
          newStatus: status,
        })
        continue
      }

      // Update the card
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      // If setting to redeemed, add redeemed_at
      if (status === "redeemed") {
        updateData.redeemed_at = new Date().toISOString()
      }

      const { error: updateError } = await serviceSupabase.from("gift_cards").update(updateData).eq("id", card.id)

      if (updateError) {
        results.push({
          code: card.code,
          success: false,
          oldStatus: card.status,
          error: updateError.message,
        })
      } else {
        results.push({
          code: card.code,
          success: true,
          oldStatus: card.status,
          newStatus: status,
        })
      }
    }

    // Add not found codes to results
    for (const code of notFoundCodes) {
      results.push({
        code,
        success: false,
        error: "Card not found",
      })
    }

    // Log audit entry
    await serviceSupabase.from("audit_log").insert({
      user_id: user.id,
      action: "bulk_status_change",
      entity_type: "gift_cards",
      entity_id: cardCodes.join(","),
      details: {
        targetStatus: status,
        totalRequested: cardCodes.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    })

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Updated ${successful} cards, ${failed} failed`,
      results,
      summary: {
        total: cardCodes.length,
        successful,
        failed,
        notFound: notFoundCodes.length,
      },
    })
  } catch (error) {
    console.error("Bulk status update error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update cards" },
      { status: 500 },
    )
  }
}
