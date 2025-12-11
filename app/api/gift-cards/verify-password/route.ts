import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { verifyPassword as verifyPasswordPBKDF2 } from "@/lib/crypto"

export async function POST(request: NextRequest) {
  try {
    const { code, password } = await request.json()

    if (!code || !password) {
      return NextResponse.json({ error: "Code and password are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find the gift card by code or secret_code
    const { data: card, error } = await supabase
      .from("gift_cards")
      .select("id, password_hash, status")
      .or(`code.eq.${code.toUpperCase().trim()},secret_code.eq.${code.toUpperCase().trim()}`)
      .maybeSingle()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to verify password" }, { status: 500 })
    }

    if (!card) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 })
    }

    if (!card.password_hash) {
      // No password required
      return NextResponse.json({ success: true })
    }

    let isValid = false

    // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
    if (card.password_hash.startsWith("$2")) {
      // bcrypt hash (from admin generate)
      isValid = await bcrypt.compare(password, card.password_hash)
    } else if (card.password_hash.includes(":")) {
      // PBKDF2 hash (salt:hash format from lib/crypto.ts)
      isValid = await verifyPasswordPBKDF2(password, card.password_hash)
    } else {
      // Unknown format, try both
      try {
        isValid = await bcrypt.compare(password, card.password_hash)
      } catch {
        isValid = await verifyPasswordPBKDF2(password, card.password_hash)
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to verify password:", error)
    return NextResponse.json({ error: "Failed to verify password" }, { status: 500 })
  }
}
