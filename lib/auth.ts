// ============================================================
// AUTHENTICATION & AUTHORIZATION HELPERS FOR SUPABASE
// ============================================================

import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAIL = "ighanghangodspower@gmail.com"

export interface User {
  id: string
  email: string
  isAdmin: boolean
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    // Check profile for admin status
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    return {
      id: user.id,
      email: user.email || "",
      isAdmin: user.email === ADMIN_EMAIL || profile?.is_admin === true,
    }
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.isAdmin === true
}

/**
 * Require admin access - throws if not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()
  if (!user || !user.isAdmin) {
    throw new Error("Admin access required")
  }
  return user
}

/**
 * Log an audit event
 */
export async function logAudit(
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from("audit_log").insert({
      user_id: userId,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    })
  } catch (error) {
    console.error("Failed to log audit:", error)
  }
}
