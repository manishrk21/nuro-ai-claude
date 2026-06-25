// FILE: pages/AuthPage.jsx | PURPOSE: Login + Signup with role selection (Patient/Therapist) | CONNECTS TO: authService.js, useAuth.js, ConsentScreen.jsx

import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import ConsentScreen from '../components/onboarding/ConsentScreen.jsx'
import { validators } from '../utils/validators.js'

// ── Role picker shown only during signup ────────────────────────────────────
function RolePicker({ selected, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-1">
      {[
        {
          id: 'patient',
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          ),
          label: 'I need support',
          sub: 'Patient / individual',
        },
        {
          id: 'therapist',
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>
            </svg>
          ),
          label: 'I am a therapist',
          sub: 'Licensed professional',
        },
      ].map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onChange(r.id)}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
            selected === r.id
              ? 'border-teal bg-teal/5 dark:bg-teal/10 text-teal'
              : 'border-light-grey dark:border-[#2E2E2E] text-graphite dark:text-[#A0A0A0] hover:border-teal/40'
          }`}
        >
          <span className={selected === r.id ? 'text-teal' : ''}>{r.icon}</span>
          <span className="font-semibold text-sm text-brand-black dark:text-white leading-tight">{r.label}</span>
          <span className="text-xs opacity-60">{r.sub}</span>
        </button>
      ))}
    </div>
  )
}

export default function AuthPage() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [role, setRole] = useState(params.get('role') === 'therapist' ? 'therapist' : 'patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [showConsent, setShowConsent] = useState(false)

  const {
    signIn, signUp, signInWithGoogle,
    authLoading, authError, setAuthError,
    isAuthenticated, consentAccepted, onboardingComplete,
    role: profileRole,
  } = useAuth()
  const navigate = useNavigate()

  // After auth state settles, redirect appropriately
  useEffect(() => {
    if (!isAuthenticated) return
    if (!consentAccepted) { setShowConsent(true); return }
    if (!onboardingComplete) {
      navigate(profileRole === 'therapist' ? '/onboarding/therapist' : '/onboarding')
      return
    }
    navigate(profileRole === 'therapist' ? '/dashboard/therapist' : '/dashboard')
  }, [isAuthenticated, consentAccepted, onboardingComplete, profileRole, navigate])

  const validate = () => {
    const e = {}
    const emailErr = validators.email(email)
    const pwErr = validators.password(password)
    if (emailErr) e.email = emailErr
    if (pwErr) e.password = pwErr
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (tab === 'login') {
      await signIn(email, password)
    } else {
      await signUp(email, password, role)
    }
  }

  const handleConsentAccepted = () => {
    setShowConsent(false)
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212] flex items-center justify-center px-4 py-12">
      {showConsent && <ConsentScreen onAccepted={handleConsentAccepted} />}

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-2xl font-semibold text-teal">NURO AI</Link>
          <p className="text-sm text-graphite dark:text-[#A0A0A0] mt-1">Mental wellness, reimagined</p>
        </div>

        <form
          className="card p-7 space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          {/* Login / Sign up tabs */}
          <div className="flex rounded-xl bg-light-grey dark:bg-[#2A2A2A] p-1">
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); setAuthError?.(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-white dark:bg-[#1E1E1E] text-brand-black dark:text-white shadow-sm'
                    : 'text-graphite dark:text-[#A0A0A0]'
                }`}
              >
                {t === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Role picker — only on signup */}
          {tab === 'signup' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0]">I am joining as…</p>
              <RolePicker selected={role} onChange={setRole} />
            </div>
          )}

          {/* Therapist signup note */}
          {tab === 'signup' && role === 'therapist' && (
            <div className="flex gap-2.5 bg-teal/5 dark:bg-teal/10 border border-teal/20 rounded-xl px-3.5 py-3">
              <svg className="shrink-0 mt-0.5 text-teal" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <p className="text-xs text-teal leading-relaxed">
                Your profile will be reviewed before going live. You'll need your license details and a verification document.
              </p>
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={() => signInWithGoogle(tab === 'signup' ? role : undefined)}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-3 py-3 border border-light-grey dark:border-[#2E2E2E] rounded-xl text-sm font-medium text-brand-black dark:text-white hover:bg-light-grey dark:hover:bg-[#2A2A2A] transition-colors disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-light-grey dark:bg-[#2E2E2E]" />
            <span className="text-xs text-graphite/50 dark:text-[#444]">or</span>
            <div className="flex-1 h-px bg-light-grey dark:bg-[#2E2E2E]" />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`input-base ${errors.email ? 'ring-2 ring-red-400' : ''}`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className={`input-base ${errors.password ? 'ring-2 ring-red-400' : ''}`}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {authError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full btn-primary py-3 text-base disabled:opacity-40"
          >
            {authLoading
              ? 'Please wait…'
              : tab === 'login'
              ? 'Log in'
              : role === 'therapist'
              ? 'Create therapist account'
              : 'Create account'}
          </button>

          {tab === 'signup' && (
            <p className="text-xs text-center text-graphite/60 dark:text-[#555]">
              By signing up you agree to our{' '}
              <a href="/terms" className="underline hover:text-teal">Terms</a> and{' '}
              <a href="/privacy" className="underline hover:text-teal">Privacy Policy</a>.
            </p>
          )}
        </form>

        {/* Therapist CTA below card */}
        {tab === 'login' && (
          <p className="text-center text-xs text-graphite/50 dark:text-[#444] mt-5">
            Are you a therapist?{' '}
            <button
              onClick={() => { setTab('signup'); setRole('therapist') }}
              className="text-teal underline hover:opacity-80"
            >
              Join as a therapist
            </button>
          </p>
        )}

        <p className="text-center text-xs text-graphite/40 dark:text-[#444] mt-4">
          NURO is not a licensed therapist. For emergencies call 112.
        </p>
      </div>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add magic link login, add phone auth, change role picker design
