"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Key, Shield, Clock, LogOut, Loader2, Check, AlertCircle } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form states
  const [fullName, setFullName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?redirect=/profile")
        return
      }

      setUser(user)

      // Fetch profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || "")
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleUpdateProfile = async () => {
    if (!user) return
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id)

      if (error) throw error
      setMessage({ type: "success", text: "Profile updated successfully" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile" })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error

      setMessage({ type: "success", text: "Password changed successfully" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      setMessage({ type: "error", text: "Failed to change password" })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your profile and security settings</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 flex items-center gap-2 text-sm ${
              message.type === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-muted border border-border inline-flex min-w-max">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-background text-xs sm:text-sm px-3 sm:px-4"
              >
                <User className="w-4 h-4 mr-1 sm:mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-background text-xs sm:text-sm px-3 sm:px-4"
              >
                <Shield className="w-4 h-4 mr-1 sm:mr-2" />
                Security
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-card border-border">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground text-sm truncate">{user?.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Member Since</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground text-sm">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-background text-sm h-10 sm:h-11"
                  />
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 text-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-4 sm:space-y-6">
              <Card className="bg-card border-border">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Key className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="bg-background text-sm h-10 sm:h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-background text-sm h-10 sm:h-11"
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={saving || !newPassword || !confirmPassword}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 text-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border border-destructive/50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-destructive text-base sm:text-lg">
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    Sign Out
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Sign out from your account on this device
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <Button variant="destructive" onClick={handleSignOut} className="h-10 sm:h-11 text-sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
