// FILE: pages/TherapistsPage.jsx | PURPOSE: Browse, filter, search therapists | CONNECTS TO: useTherapists.js, TherapistCard.jsx, BookingModal.jsx

import { useState } from 'react'
import Navbar from '../components/layout/Navbar.jsx'
import TherapistCard from '../components/booking/TherapistCard.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'
import { useTherapists } from '../hooks/useTherapists.js'

const SPECIALIZATIONS = ['Anxiety', 'Depression', 'Trauma', 'CBT', 'Relationships', 'Grief', 'Adolescents', 'Mindfulness', 'Career', 'Addiction']
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali']

export default function TherapistsPage() {
  const { therapists, loading, error, filters, updateFilter, resetFilters } = useTherapists()
  const [bookingTarget, setBookingTarget] = useState(null)

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold text-brand-black dark:text-white mb-1">Find a therapist</h1>
          <p className="text-graphite dark:text-[#A0A0A0]">Verified, licensed professionals ready to support you.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="md:w-56 shrink-0 space-y-6">
            {/* Search */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] block mb-2">Search</label>
              <input
                type="text"
                placeholder="Therapist name…"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="input-base text-sm"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] block mb-2">Specialization</label>
              <div className="space-y-1.5">
                {SPECIALIZATIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.specialization === s}
                      onChange={(e) => updateFilter('specialization', e.target.checked ? s : '')}
                      className="accent-teal w-3.5 h-3.5"
                    />
                    <span className="text-sm text-graphite dark:text-[#A0A0A0] group-hover:text-brand-black dark:group-hover:text-white transition-colors">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] block mb-2">Language</label>
              <select value={filters.language} onChange={(e) => updateFilter('language', e.target.value)} className="input-base text-sm">
                <option value="">Any language</option>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Fee range */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] block mb-2">Max fee/session</label>
              <input
                type="range" min={500} max={5000} step={250}
                value={filters.feeMax || 5000}
                onChange={(e) => updateFilter('feeMax', e.target.value)}
                className="w-full accent-teal"
              />
              <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-1">Up to ₹{(filters.feeMax || 5000).toLocaleString()}</p>
            </div>

            {/* Available only */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.availableOnly} onChange={(e) => updateFilter('availableOnly', e.target.checked)} className="accent-teal w-4 h-4" />
              <span className="text-sm text-graphite dark:text-[#A0A0A0]">Available now</span>
            </label>

            <button onClick={resetFilters} className="text-xs text-teal underline hover:opacity-70 transition-opacity">Reset all filters</button>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            {loading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-5 h-52 animate-pulse bg-light-grey dark:bg-[#2A2A2A]" />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="text-center py-16 text-graphite dark:text-[#A0A0A0]">
                <p>Failed to load therapists. Please try again.</p>
              </div>
            )}

            {!loading && !error && therapists.length === 0 && (
              <div className="text-center py-16 text-graphite dark:text-[#A0A0A0]">
                <p className="font-serif text-lg mb-2">No therapists found</p>
                <p className="text-sm">Try adjusting your filters.</p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {therapists.map((t) => (
                  <TherapistCard key={t.id} therapist={t} onBook={setBookingTarget} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {bookingTarget && (
        <BookingModal therapist={bookingTarget} onClose={() => setBookingTarget(null)} />
      )}
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add map view, add pagination, add sorting (rating, fee, experience)
