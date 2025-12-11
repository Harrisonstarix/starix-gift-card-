"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  role: "user" | "admin"
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setState({ user: data.user, loading: false, error: null })
      } else {
        setState({ user: null, loading: false, error: null })
      }
    } catch (err) {
      setState({ user: null, loading: false, error: "Failed to check auth" })
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setState((prev) => ({ ...prev, loading: false, error: data.error }))
        return false
      }

      setState({ user: data.user, loading: false, error: null })
      return true
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false, error: "Login failed" }))
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setState({ user: null, loading: false, error: null })
      router.push("/")
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  const requireAuth = useCallback(
    (redirectTo = "/login") => {
      if (!state.loading && !state.user) {
        router.push(redirectTo)
      }
    },
    [state.loading, state.user, router],
  )

  const requireAdmin = useCallback(
    (redirectTo = "/login?redirect=admin") => {
      if (!state.loading) {
        if (!state.user || state.user.role !== "admin") {
          router.push(redirectTo)
        }
      }
    },
    [state.loading, state.user, router],
  )

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.role === "admin",
    login,
    logout,
    checkAuth,
    requireAuth,
    requireAdmin,
  }
}
