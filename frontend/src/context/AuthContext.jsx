// FILE: AuthContext.jsx | PURPOSE: User session, role, profile, consent state | CONNECTS TO: App.jsx, useAuth.js

import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u) {
    if (!u) { setProfile(null); return }
    try {
      let p = await authService.getProfile(u.id)
      if (!p) {
        // Pass user metadata so role is set correctly on first sign-up
        p = await authService.createProfile(u.id, null, u.user_metadata)
      }
      setProfile(p)
    } catch (err) {
      console.error('Failed to load profile:', err)
    }
  }

  useEffect(() => {
    authService.getSession().then(async (session) => {
      const u = session?.user ?? null
      setUser(u)
      await loadProfile(u)
      setLoading(false)
    })

    const { data: { subscription } } = authService.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      await loadProfile(u)
    })

    return () => subscription.unsubscribe()
  }, [])

  const acceptConsent = async () => {
    if (!user) return
    await authService.acceptConsent(user.id)
    setProfile((p) => ({
      ...(p ?? {}),
      consent_accepted: true,
      consent_accepted_at: new Date().toISOString(),
    }))
  }

  const completeOnboarding = async () => {
    if (!user) return
    await authService.completeOnboarding(user.id)
    setProfile((p) => ({
      ...(p ?? {}),
      onboarding_complete: true,
    }))
  }

  const refreshProfile = async () => {
    if (user) await loadProfile(user)
  }

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    role: profile?.role ?? null,
    consentAccepted: profile?.consent_accepted ?? false,
    onboardingComplete: profile?.onboarding_complete ?? false,
    acceptConsent,
    completeOnboarding,
    refreshProfile,
    signOut: authService.signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}

// CHANGE THIS FILE IF YOU WANT TO: add more profile fields, change session persistence
