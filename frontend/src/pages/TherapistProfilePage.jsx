// FILE: pages/TherapistProfilePage.jsx | PURPOSE: Individual therapist detail page | CONNECTS TO: therapistService.js, BookingModal.jsx, Navbar.jsx

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'
import AvailabilityBadge from '../components/booking/AvailabilityBadge.jsx'
import { therapistService } from '../services/therapistService.js'
import { profileService } from '../services/profileService.js'
import { useAuthContext } from '../context/AuthContext.jsx'
import { formatters } from '../utils/formatters.js'

export default function TherapistProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [therapist, setTherapist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    therapistService.getTherapist(id)
      .then(setTherapist)
      .catch(() => navigate('/therapists'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleSave = async () => {
    if (!user) return
    await profileService.saveTherapist(user.id, id)
    setSaved(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!therapist) return null

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        {/* Back */}
        <button onClick={() => navigate('/therapists')} className="flex items-center gap-1.5 text-sm text-graphite dark:text-[#A0A0A0] hover:text-teal mb-6 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Back to therapists
        </button>

        <div className="card p-8 space-y-8">
          {/* Header */}
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-100 to-teal/20 dark:from-teal/20 dark:to-teal/5 flex items-center justify-center shrink-0 overflow-hidden">
              {therapist.photo_url
                ? <img src={therapist.photo_url} alt={therapist.name} className="w-full h-full object-cover" />
                : <span className="font-semibold text-2xl text-teal">{formatters.initials(therapist.name)}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-serif text-2xl font-semibold text-brand-black dark:text-white">{therapist.name}</h1>
                {therapist.verified_status === 'verified' && (
                  <span className="flex items-center gap-1 text-xs text-teal font-medium">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#3D9E8C"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-graphite dark:text-[#A0A0A0]">{therapist.license_type} · {therapist.years_experience} years experience</p>
              <AvailabilityBadge available={therapist.available} />
            </div>
          </div>

          {/* Bio */}
          {therapist.bio && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] mb-2">About</h2>
              <p className="text-sm text-brand-black dark:text-[#F5F5F5] leading-relaxed">{therapist.bio}</p>
            </div>
          )}

          {/* Details grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-cream dark:bg-[#2A2A2A] rounded-xl p-4 space-y-1">
              <p className="text-xs text-graphite dark:text-[#A0A0A0]">Fee per session</p>
              <p className="font-semibold text-teal text-lg">{formatters.currency(therapist.fee_per_session)}</p>
            </div>
            <div className="bg-cream dark:bg-[#2A2A2A] rounded-xl p-4 space-y-1">
              <p className="text-xs text-graphite dark:text-[#A0A0A0]">Languages</p>
              <p className="font-medium text-brand-black dark:text-white text-sm">{(therapist.languages || []).join(', ') || '—'}</p>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] mb-3">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {(therapist.specializations || []).map((s) => (
                <span key={s} className="px-3 py-1.5 bg-teal/8 dark:bg-teal/10 text-teal rounded-full text-sm">{s}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saved}
              className="btn-outline py-3 px-5 flex items-center gap-2 disabled:opacity-60"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? '#3D9E8C' : 'none'} stroke="#3D9E8C" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => setShowBooking(true)}
              disabled={!therapist.available}
              className="flex-1 btn-primary py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {therapist.available ? 'Book a Session' : 'Not Available'}
            </button>
          </div>
        </div>
      </div>

      {showBooking && (
        <BookingModal therapist={therapist} onClose={() => setShowBooking(false)} />
      )}
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add reviews section, add video intro, add shared patients note
