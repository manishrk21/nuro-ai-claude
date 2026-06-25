// FILE: authService.js | PURPOSE: All Supabase authentication calls | CONNECTS TO: useAuth.js, AuthContext.jsx

import { supabase } from './supabaseClient.js'

export const authService = {
  async signUp(email, password, role = 'patient') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Store role in user metadata so AuthContext can read it on first load
        data: { intended_role: role },
      },
    })
    if (error) throw error
    return data
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signInWithGoogle(role = 'patient') {
    if (typeof window !== 'undefined' && role) {
      try {
        window.localStorage.setItem('nuro_pending_oauth_role', role)
      } catch (err) {
        console.warn('Unable to persist OAuth role:', err)
      }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { intended_role: role },
      },
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getAccessToken() {
    const session = await this.getSession()
    return session?.access_token ?? null
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async acceptConsent(userId) {
    const acceptedAt = new Date().toISOString()
    const { data: existing, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (lookupError) throw lookupError

    if (existing) {
      const { error } = await supabase
        .from('profiles')
        .update({ consent_accepted: true, consent_accepted_at: acceptedAt })
        .eq('user_id', userId)
      if (error) throw error
      return
    }

    const { error } = await supabase.from('profiles').insert({
      user_id: userId,
      consent_accepted: true,
      consent_accepted_at: acceptedAt,
    })
    if (error) throw error
  },

  /** Creates the initial profile row, reading role from user metadata if not explicitly passed */
  async createProfile(userId, role, userMetadata = {}) {
    const storageRole = typeof window !== 'undefined'
      ? window.localStorage.getItem('nuro_pending_oauth_role')
      : null
    const resolvedRole = role || userMetadata?.intended_role || storageRole || 'patient'
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('nuro_pending_oauth_role')
      } catch (err) {
        console.warn('Unable to clear OAuth role:', err)
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, role: resolvedRole, onboarding_complete: false })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async completeOnboarding(userId) {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('user_id', userId)
    if (error) throw error
  },
}

// CHANGE THIS FILE IF YOU WANT TO: add magic link, add phone auth, change OAuth redirect URL
