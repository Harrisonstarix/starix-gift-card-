import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Admin email that gets auto-promoted
const ADMIN_EMAIL = "ighanghangodspower@gmail.com"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // PUBLIC (no auth): /, /support, /auth/*
  // AUTH REQUIRED: /buy, /dashboard, /profile, /redeem, /deposit
  // ADMIN ONLY: /admin
  const protectedPaths = ["/dashboard", "/admin", "/buy", "/profile", "/redeem", "/deposit"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Admin-only routes - check profile for is_admin
  if (request.nextUrl.pathname.startsWith("/admin") && user) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    const isAdmin = user.email === ADMIN_EMAIL || profile?.is_admin === true

    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
