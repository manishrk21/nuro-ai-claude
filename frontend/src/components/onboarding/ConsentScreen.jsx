// FILE: onboarding/ConsentScreen.jsx | PURPOSE: First-time consent gate before any features | CONNECTS TO: AuthPage.jsx, AuthContext.jsx

import { useState } from 'react'
import { useAuthContext } from '../../context/AuthContext.jsx'

const CONSENT_POINTS = [
  'NURO is an AI wellness companion — not a licensed therapist or medical professional.',
  'Conversations are stored securely to personalise your experience.',
  'In a crisis, NURO will refer you to trained human counsellors.',
  'You can delete your data at any time from Settings.',
]

export default function ConsentScreen({ onAccepted, onCancel }) {
  const { acceptConsent } = useAuthContext()
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    if (!checked) return
    setLoading(true)
    try {
      await acceptConsent()
      onAccepted?.()
    } catch (err) {
      console.error('Consent error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-2xl max-w-md w-full p-8">
        {/* Logo mark */}
        <div className="text-center mb-6">
          <span className="font-serif text-2xl font-semibold text-teal">NURO AI</span>
          <p className="mt-1 text-sm text-graphite dark:text-[#A0A0A0]">Before we begin</p>
        </div>

        <h2 className="text-xl font-semibold text-brand-black dark:text-white mb-5">
          A few things to know
        </h2>

        <ul className="space-y-3 mb-6">
          {CONSENT_POINTS.map((point, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-teal-50 dark:bg-teal/10 flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#3D9E8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <p className="text-sm text-graphite dark:text-[#C0C0C0] leading-relaxed">{point}</p>
            </li>
          ))}
        </ul>

        <p className="text-xs text-graphite/70 dark:text-[#666] mb-5">
          By continuing, you agree to our{' '}
          <a href="/privacy" className="underline hover:text-teal">Privacy Policy</a>
          {' '}and{' '}
          <a href="/terms" className="underline hover:text-teal">Terms of Service</a>.
        </p>

        <label className="flex items-center gap-3 cursor-pointer mb-6 group">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-4 h-4 accent-teal rounded"
          />
          <span className="text-sm text-brand-black dark:text-white font-medium">
            I understand and want to continue
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            type="button"
            className="w-full py-3 border border-light-grey dark:border-[#2E2E2E] rounded-xl text-sm text-graphite dark:text-[#A0A0A0] hover:bg-light-grey dark:hover:bg-[#2E2E2E] transition-colors"
          >
            Go back
          </button>
          <button
            onClick={handleAccept}
            disabled={!checked || loading}
            className="w-full btn-primary py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'I understand — Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: update consent copy, add more consent points, add version tracking
