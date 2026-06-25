// FILE: useAuth.js | PURPOSE: Auth state + actions, passes role to signUp | CONNECTS TO: AuthContext.jsx, authService.js

import { useState } from 'react'
import { useAuthContext } from '../context/AuthContext.jsx'
import { authService } from '../services/authService.js'

export function useAuth() {
  const ctx = useAuthContext()
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  const signIn = async (email, password) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      await authService.signIn(email, password)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // role = 'patient' | 'therapist' — stored in profiles table after signup
  const signUp = async (email, password, role = 'patient') => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      await authService.signUp(email, password, role)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const signInWithGoogle = async (role = 'patient') => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      // Pass role in OAuth state so AuthContext can set it after redirect
      await authService.signInWithGoogle(role)
    } catch (err) {
      setAuthError(err.message)
      setAuthLoading(false)
    }
  }

  return {
    ...ctx,
    authLoading,
    authError,
    setAuthError,
    signIn,
    signUp,
    signInWithGoogle,
  }
}

// CHANGE THIS FILE IF YOU WANT TO: add magic link auth, add phone auth
