import { createClient } from "@supabase/supabase-js"

/**
 * Create a Supabase client with service role key
 * This bypasses Row Level Security (RLS) and should only be used in server-side code
 * for admin operations that need to access all data
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
