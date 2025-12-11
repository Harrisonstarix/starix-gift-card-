import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser, logAudit } from "@/lib/auth"
import { generateGiftCardCode, generateSecretCode, hashPassword } from "@/lib/crypto"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required. Please log in." }, { status: 401 })
    }

    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const supabase = await createClient()

    let body
    try {
      const text = await request.text()
      if (!text || text.trim() === "") {
        return NextResponse.json({ error: "Request body is empty" }, { status: 400 })
      }
      body = JSON.parse(text)
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const {
      amount,
      valueUsd,
      design,
      recipientName,
      recipientEmail,
      message,
      password,
      expiryDays = 90,
      quantity = 1,
    } = body

    // Use valueUsd if amount not provided (admin page sends valueUsd)
    const rawAmount = amount ?? valueUsd

    if (rawAmount === undefined || rawAmount === null) {
      return NextResponse.json({ error: "Amount is required (send 'amount' or 'valueUsd')" }, { status: 400 })
    }

    const numAmount = Number(rawAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: `Amount must be a positive number, got: ${rawAmount}` }, { status: 400 })
    }

    if (!design || typeof design !== "string") {
      return NextResponse.json({ error: "Please select a design" }, { status: 400 })
    }

    const numQuantity = Math.min(Math.max(Number(quantity) || 1, 1), 100)

    const generatedCards = []
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (Number(expiryDays) || 90))

    for (let i = 0; i < numQuantity; i++) {
      const code = generateGiftCardCode()
      const secretCode = generateSecretCode()

      let passwordHash = null
      if (password && typeof password === "string" && password.length > 0) {
        passwordHash = await hashPassword(password)
      }

      const { data: card, error: insertError } = await supabase
        .from("gift_cards")
        .insert({
          code,
          secret_code: secretCode,
          value_usd: numAmount,
          design,
          status: "active",
          recipient_name: recipientName || null,
          recipient_email: recipientEmail || null,
          sender_name: "Starix Admin",
          message: message || null,
          password_hash: passwordHash,
          is_anonymous: false,
          platform_fee: 0,
          platform_fee_usd: 0,
          total_paid: 0,
          total_paid_usd: 0,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Failed to create gift card:", insertError)
        if (i === 0) {
          return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 400 })
        }
        continue
      }

      generatedCards.push({
        id: card.id,
        code: card.code,
        value: card.value_usd,
        design: card.design,
        expiresAt: card.expires_at,
        password: password || null,
      })
    }

    if (generatedCards.length === 0) {
      return NextResponse.json({ error: "Failed to generate any cards" }, { status: 500 })
    }

    await logAudit(user.id, "admin_generate_cards", "gift_cards", undefined, {
      quantity: generatedCards.length,
      amount: numAmount,
      design,
      totalValue: numAmount * generatedCards.length,
    })

    return NextResponse.json({
      success: true,
      cards: generatedCards,
      message: `Successfully generated ${generatedCards.length} gift card(s)`,
    })
  } catch (error) {
    console.error("Admin generate cards error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate cards" },
      { status: 500 },
    )
  }
}
