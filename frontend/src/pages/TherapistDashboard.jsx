// FILE: pages/TherapistDashboard.jsx | PURPOSE: Therapist dashboard — pending review gate, patient list, booking management, notes | CONNECTS TO: useBooking.js, Navbar.jsx, supabase

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import { useAuthContext } from '../context/AuthContext.jsx'
import { useBooking } from '../hooks/useBooking.js'
import { supabase } from '../services/supabaseClient.js'
import { formatters } from '../utils/formatters.js'

// ── Verification status gate ──────────────────────────────────────────────────
function VerificationBanner({ status }) {
  const configs = {
    pending: {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
      ),
      bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30',
      title: 'Your profile is under review',
      body: 'Our team is verifying your credentials. This usually takes up to 8 hours. You\'ll get an email once you\'re approved and visible to patients.',
      badge: 'Pending review',
      badgeColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
    },
    under_review: {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      ),
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30',
      title: 'Credentials being verified',
      body: 'A team member is actively reviewing your license and documentation. You\'ll be notified shortly.',
      badge: 'Under review',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    },
    rejected: {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      ),
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30',
      title: 'Verification unsuccessful',
      body: 'We couldn\'t verify your credentials with the document provided. Please email therapists@nuroai.in with updated documentation.',
      badge: 'Not approved',
      badgeColor: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    },
    suspended: {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30',
      title: 'Account suspended',
      body: 'Your account has been suspended. Please contact therapists@nuroai.in for assistance.',
      badge: 'Suspended',
      badgeColor: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    },
  }

  const c = configs[status]
  if (!c) return null

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212]">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 pt-28 pb-16">
        <div className={`border rounded-2xl p-8 space-y-5 ${c.bg}`}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5">{c.icon}</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-xl font-semibold text-brand-black dark:text-white">{c.title}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badgeColor}`}>{c.badge}</span>
              </div>
              <p className="text-sm text-graphite dark:text-[#A0A0A0] leading-relaxed">{c.body}</p>
            </div>
          </div>

          {/* What happens while waiting */}
          {(status === 'pending' || status === 'under_review') && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0]">What to do while you wait</p>
              {[
                { label: 'Complete your dashboard', desc: 'Set your availability so it\'s ready when you go live.' },
                { label: 'Check your email', desc: 'Approval and any follow-up questions will come there.' },
                { label: 'Questions?', desc: 'Email therapists@nuroai.in — we respond within a few hours.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-white/60 dark:bg-white/10 text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold text-graphite dark:text-[#A0A0A0]">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-brand-black dark:text-white">{item.label}</p>
                    <p className="text-xs text-graphite dark:text-[#A0A0A0]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {status === 'rejected' && (
            <a href="mailto:therapists@nuroai.in" className="inline-flex btn-primary py-2.5 px-5 text-sm">
              Contact support →
            </a>
          )}
        </div>

        {/* Preview of what the dashboard looks like */}
        {(status === 'pending' || status === 'under_review') && (
          <div className="mt-6 opacity-40 pointer-events-none select-none">
            <p className="text-xs text-center text-graphite dark:text-[#444] mb-4">Dashboard preview (unlocks after approval)</p>
            <div className="card p-5 space-y-3">
              <div className="h-4 bg-light-grey dark:bg-[#2E2E2E] rounded w-1/3" />
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-light-grey dark:bg-[#2E2E2E] rounded-xl" />)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Patient detail panel ──────────────────────────────────────────────────────
// ── Patient detail panel ──────────────────────────────────────────────────────
function PatientPanel({ patientId, onSaveNote, onCompleteSession, patientBookings }) {
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmingBookingId, setConfirmingBookingId] = useState(null)
  const [savingComplete, setSavingComplete] = useState(false)
  const [completionError, setCompletionError] = useState(null)

  const activeBookings = patientBookings.filter((b) => b.status === 'confirmed')
  const completedBookings = patientBookings.filter((b) => b.status === 'completed')

  const handleSave = async () => {
    setSaving(true)
    await onSaveNote(patientId, noteText)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleComplete = async (bookingId) => {
    setSavingComplete(true)
    setCompletionError(null)
    const result = await onCompleteSession(bookingId)
    setSavingComplete(false)
    if (result) {
      setConfirmingBookingId(null)
    } else {
      setCompletionError("Could not mark session as completed. Please check the booking details and try again.")
    }
  }

  // Find onboarding name inside the dataset array 
  const realName = patientBookings[0]?.patient_profile?.onboarding_data?.name;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-semibold text-brand-black dark:text-white mb-2">
          {realName ? realName : `Patient #${patientId.slice(0, 6)}`}
        </h3>
        <p className="text-xs text-graphite/60 dark:text-[#A0A0A0] mb-4">Internal ID: {patientId}</p>
      </div>

      {/* Unified Session History Timeline */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] block">
          Upcoming Sessions ({activeBookings.length})
        </label>
        <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
          {activeBookings.length === 0 ? (
            <p className="text-sm text-graphite dark:text-[#A0A0A0]">No upcoming sessions for this patient.</p>
          ) : (
            activeBookings.map((b, index) => {
              const googleMeetUrl = b.meet_link || b.proposed_slots?.[0]?.meet_link;
              const slotValue = b.proposed_slots?.[0]
              const sessionTime = slotValue ? formatters.datetime(typeof slotValue === 'object' ? slotValue.slot || slotValue : slotValue) : 'No slot date'

              return (
                <div key={b.id} className="space-y-3 bg-cream dark:bg-[#2A2A2A] rounded-xl p-3 border border-light-grey dark:border-[#333]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-brand-black dark:text-white">Session #{activeBookings.length - index}</p>
                      <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-0.5">{sessionTime}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {googleMeetUrl ? (
                        <a
                          href={googleMeetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-teal text-white px-2.5 py-1 rounded-lg hover:bg-teal-600 transition-colors"
                        >
                          Join Meet
                        </a>
                      ) : (
                        <span className="text-xs text-graphite/40 dark:text-[#555] italic">Link generating…</span>
                      )}
                      <button
                        onClick={() => setConfirmingBookingId(b.id)}
                        className="text-xs bg-white dark:bg-[#1F1F1F] border border-light-grey dark:border-[#333] text-graphite dark:text-[#A0A0A0] px-2.5 py-1 rounded-lg hover:bg-light-grey dark:hover:bg-[#2E2E2E] transition-colors"
                      >
                        Meeting Done
                      </button>
                    </div>
                  </div>

                  {confirmingBookingId === b.id && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-graphite dark:text-[#E8C8A2]">
                      <p>Are you sure you want to mark this session as completed? This will move it to your history.</p>
                      {completionError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2 mb-2">{completionError}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleComplete(b.id)}
                          disabled={savingComplete}
                          className="py-2 px-3 bg-teal text-white rounded-lg text-xs hover:bg-teal-600 transition-colors disabled:opacity-50"
                        >
                          {savingComplete ? 'Marking done…' : 'Yes, complete'}
                        </button>
                        <button
                          onClick={() => {
                            setConfirmingBookingId(null)
                            setCompletionError(null)
                          }}
                          className="py-2 px-3 border border-light-grey dark:border-[#333] rounded-lg text-xs text-graphite dark:text-[#A0A0A0] hover:bg-light-grey dark:hover:bg-[#2E2E2E] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {completedBookings.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-light-grey dark:border-[#2E2E2E]">
          <label className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] block">
            Past Sessions ({completedBookings.length})
          </label>
          <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
            {completedBookings.map((b, index) => {
              const googleMeetUrl = b.meet_link || b.proposed_slots?.[0]?.meet_link;
              const slotValue = b.proposed_slots?.[0]
              const sessionTime = slotValue ? formatters.datetime(typeof slotValue === 'object' ? slotValue.slot || slotValue : slotValue) : 'No slot date'

              return (
                <div key={b.id} className="flex items-center justify-between bg-[#F7F8FA] dark:bg-[#1F1F1F] rounded-xl p-3 border border-light-grey dark:border-[#333]">
                  <div>
                    <p className="text-xs font-medium text-brand-black dark:text-white">{sessionTime}</p>
                    <p className="text-[11px] uppercase tracking-wide text-graphite dark:text-[#A0A0A0] mt-1">Completed</p>
                  </div>
                  {googleMeetUrl ? (
                    <a
                      href={googleMeetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-graphite text-white px-2.5 py-1 rounded-lg hover:bg-[#2D2D2D] transition-colors"
                    >
                      Join Meet
                    </a>
                  ) : (
                    <span className="text-xs text-graphite/40 dark:text-[#555] italic">No link available</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-light-grey dark:border-[#2E2E2E]">
        <label className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] block">
          Private notes <span className="font-normal">(not visible to patient)</span>
        </label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={5}
          placeholder="Session observations, progress, next steps, patterns noticed…"
          className="input-base resize-none"
        />
        <button
          onClick={handleSave}
          disabled={saving || !noteText.trim()}
          className="btn-primary py-2 px-4 text-sm disabled:opacity-40"
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save notes'}
        </button>
      </div>
    </div>
  )
}



// function PatientPanel({ patientId, onSaveNote, patientBookings }) {
//   const [noteText, setNoteText] = useState('')
//   const [saving, setSaving] = useState(false)
//   const [saved, setSaved] = useState(false)

//   const handleSave = async () => {
//     setSaving(true)
//     await onSaveNote(patientId, noteText)
//     setSaving(false)
//     setSaved(true)
//     setTimeout(() => setSaved(false), 2000)
//   }

//   // Find onboarding name inside the dataset array 
//   const realName = patientBookings[0]?.patient_profile?.onboarding_data?.name;

//   return (
//     <div className="space-y-6">
//       <div>
//         <h3 className="font-serif text-lg font-semibold text-brand-black dark:text-white mb-2">
//           {realName ? realName : `Patient #${patientId.slice(0, 6)}`}
//         </h3>
//         <p className="text-xs text-graphite/60 dark:text-[#A0A0A0] mb-4">Internal ID: {patientId}</p>
//       </div>

//       {/* Unified Session History Timeline */}
//       <div className="space-y-2">
//         <label className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] block">
//           Session History ({patientBookings.length})
//         </label>
//         <div className="max-h-44 overflow-y-auto space-y-2 pr-2">
//           {patientBookings.map((b, index) => (
//             <div key={b.id} className="flex items-center justify-between bg-cream dark:bg-[#2A2A2A] rounded-xl p-3 border border-light-grey dark:border-[#333]">
//               <div>
//                 <p className="text-xs font-medium text-brand-black dark:text-white">Session #{patientBookings.length - index}</p>
//                 <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-0.5">
//                   {b.proposed_slots?.[0] ? formatters.datetime(b.proposed_slots[0]) : 'No slot date'}
//                 </p>
//               </div>
              
//               {b.meet_link && (
//                 <a href={b.meet_link} target="_blank" rel="noreferrer" className="text-xs bg-teal text-white px-2.5 py-1 rounded-lg hover:bg-teal-600 transition-colors">
//                   Join Meet
//                 </a>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="space-y-2 pt-2 border-t border-light-grey dark:border-[#2E2E2E]">
//         <label className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0] block">
//           Private notes <span className="font-normal">(not visible to patient)</span>
//         </label>
//         <textarea
//           value={noteText}
//           onChange={(e) => setNoteText(e.target.value)}
//           rows={5}
//           placeholder="Session observations, progress, next steps, patterns noticed…"
//           className="input-base resize-none"
//         />
//         <button
//           onClick={handleSave}
//           disabled={saving || !noteText.trim()}
//           className="btn-primary py-2 px-4 text-sm disabled:opacity-40"
//         >
//           {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save notes'}
//         </button>
//       </div>
//     </div>
//   )
// }

// ── Schedule view by date ────────────────────────────────────────────────────
function ScheduleView({ bookings, onCompleteSession }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [confirmingBookingId, setConfirmingBookingId] = useState(null)
  const [savingComplete, setSavingComplete] = useState(false)
  const [completionError, setCompletionError] = useState(null)

  // Filter sessions for selected date
  const sessionsForDate = bookings
    .filter(b => b.status === 'confirmed')
    .filter(b => {
      const slotDate = b.proposed_slots?.[0]
      if (!slotDate) return false
      const sessionDateStr = new Date(slotDate).toISOString().split('T')[0]
      return sessionDateStr === selectedDate
    })
    .sort((a, b) => {
      const timeA = new Date(a.proposed_slots?.[0] || 0)
      const timeB = new Date(b.proposed_slots?.[0] || 0)
      return timeA - timeB
    })

  const handleComplete = async (bookingId) => {
    setSavingComplete(true)
    setCompletionError(null)
    const result = await onCompleteSession(bookingId)
    setSavingComplete(false)
    if (result) {
      setConfirmingBookingId(null)
    } else {
      setCompletionError("Could not mark session as completed. Please try again.")
    }
  }

  // Quick navigation buttons
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-lg font-semibold text-brand-black dark:text-white mb-3">Schedule by date</h2>
        
        {/* Quick nav + date picker */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedDate === todayStr
                ? 'bg-teal text-white'
                : 'border border-light-grey dark:border-[#2E2E2E] text-graphite dark:text-[#A0A0A0] hover:bg-light-grey dark:hover:bg-[#2A2A2A]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedDate === tomorrowStr
                ? 'bg-teal text-white'
                : 'border border-light-grey dark:border-[#2E2E2E] text-graphite dark:text-[#A0A0A0] hover:bg-light-grey dark:hover:bg-[#2A2A2A]'
            }`}
          >
            Tomorrow
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs border border-light-grey dark:border-[#2E2E2E] rounded-lg bg-white dark:bg-[#1F1F1F] text-brand-black dark:text-white"
          />
        </div>

        {/* Sessions for date */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-graphite dark:text-[#A0A0A0]">
              Sessions: {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </label>
            <span className="text-xs font-semibold bg-teal/10 text-teal px-2 py-0.5 rounded-full">{sessionsForDate.length}</span>
          </div>

          {sessionsForDate.length === 0 ? (
            <div className="bg-cream dark:bg-[#2A2A2A] rounded-xl p-4 text-center">
              <p className="text-sm text-graphite dark:text-[#A0A0A0]">No sessions scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {sessionsForDate.map((b) => {
                const patientName = b.patient_profile?.onboarding_data?.name || `Patient #${b.patient_id.slice(0, 6)}`
                const slotTime = formatters.datetime(b.proposed_slots?.[0])
                const googleMeetUrl = b.meet_link || b.proposed_slots?.[0]?.meet_link

                return (
                  <div key={b.id} className="bg-cream dark:bg-[#2A2A2A] rounded-xl p-3 border border-light-grey dark:border-[#333] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-brand-black dark:text-white">{patientName}</p>
                        <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-0.5">{slotTime}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {googleMeetUrl ? (
                          <a
                            href={googleMeetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-teal text-white px-2 py-1 rounded-lg hover:bg-teal-600 transition-colors"
                          >
                            Join
                          </a>
                        ) : (
                          <span className="text-xs text-graphite/40 dark:text-[#555] italic">Generating…</span>
                        )}
                      </div>
                    </div>

                    {confirmingBookingId !== b.id && (
                      <button
                        onClick={() => setConfirmingBookingId(b.id)}
                        className="w-full text-xs bg-white dark:bg-[#1F1F1F] border border-light-grey dark:border-[#333] text-graphite dark:text-[#A0A0A0] px-2.5 py-1.5 rounded-lg hover:bg-light-grey dark:hover:bg-[#2E2E2E] transition-colors"
                      >
                        Meeting Done
                      </button>
                    )}

                    {confirmingBookingId === b.id && (
                      <div className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-2 text-xs text-graphite dark:text-[#E8C8A2] space-y-2">
                        <p>Mark this session as completed?</p>
                        {completionError && (
                          <p className="text-xs text-red-600 dark:text-red-400">{completionError}</p>
                        )}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleComplete(b.id)}
                            disabled={savingComplete}
                            className="flex-1 py-1.5 bg-teal text-white rounded-lg text-xs hover:bg-teal-600 transition-colors disabled:opacity-50"
                          >
                            {savingComplete ? 'Marking…' : 'Yes'}
                          </button>
                          <button
                            onClick={() => {
                              setConfirmingBookingId(null)
                              setCompletionError(null)
                            }}
                            className="flex-1 py-1.5 border border-light-grey dark:border-[#333] rounded-lg text-xs text-graphite dark:text-[#A0A0A0] hover:bg-light-grey dark:hover:bg-[#2E2E2E] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function TherapistDashboard() {
  const { user, signOut } = useAuthContext()
  const { bookings, fetchBookings, acceptBooking, rejectBooking, completeBooking } = useBooking()
  const [therapist, setTherapist] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [available, setAvailable] = useState(false)
  const [viewMode, setViewMode] = useState('schedule') // 'schedule' or 'patient'

  useEffect(() => {
    if (!user) return
    supabase
      .from('therapists')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setTherapist(data)
        setAvailable(data?.available ?? false)
      })
      .finally(() => setLoadingProfile(false))

    fetchBookings()
  }, [user])

  const toggleAvailability = async () => {
    const next = !available
    setAvailable(next)
    await supabase.from('therapists').update({ available: next }).eq('user_id', user.id)
  }

  const handleAccept = (id) => acceptBooking(id)
  const handleReject = (id) => rejectBooking(id)
  const handleComplete = (id) => completeBooking(id)

  const handleSaveNote = async (patientId, noteText) => {
    const session = await supabase.auth.getSession()
    const token = session.data?.session?.access_token
    if (!token) return
    await fetch(`${import.meta.env.VITE_API_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ patient_id: patientId, content: noteText }),
    })
  }

  // Loading
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // No therapist profile yet — redirect to onboarding
  if (!therapist) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#121212] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-brand-black dark:text-white">No therapist profile found.</p>
          <Link to="/onboarding/therapist" className="btn-primary py-2.5 px-5 inline-flex">Complete your profile →</Link>
        </div>
      </div>
    )
  }

  // Show verification gate for non-verified statuses
  if (therapist.verified_status !== 'verified') {
    return <VerificationBanner status={therapist.verified_status} />
  }

  // ── Verified dashboard layout splits ───────────────────────────────────────
  const pendingBookings = bookings.filter((b) => b.status === 'pending')
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed')
  const completedBookings = bookings.filter((b) => b.status === 'completed')
  const patientBookings = bookings.filter((b) => ['confirmed', 'completed'].includes(b.status))

  // Group listings to create unique patient records for the sidebar
  const uniquePatients = []
  const seenPatientIds = new Set()
  
  patientBookings.forEach((b) => {
    if (!seenPatientIds.has(b.patient_id)) {
      seenPatientIds.add(b.patient_id)
      uniquePatients.push(b)
    }
  })

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-black dark:text-white">
              {therapist.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-teal flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#3D9E8C"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Verified therapist
              </span>
              <span className="text-graphite/30 dark:text-[#333]">·</span>
              <span className="text-xs text-graphite dark:text-[#A0A0A0]">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Availability toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <span className="text-sm text-graphite dark:text-[#A0A0A0]">
                {available ? 'Accepting patients' : 'Not accepting'}
              </span>
              <button
                onClick={toggleAvailability}
                className={`w-12 h-6 rounded-full transition-colors relative ${available ? 'bg-teal' : 'bg-light-grey dark:bg-[#2E2E2E]'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${available ? 'left-6' : 'left-0.5'}`} />
              </button>
            </label>
            <button onClick={signOut} className="text-xs text-graphite/40 hover:text-graphite dark:hover:text-[#A0A0A0] transition-colors">
              Sign out
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending requests', value: pendingBookings.length, accent: pendingBookings.length > 0 },
            { label: 'Confirmed sessions', value: confirmedBookings.length, accent: false },
            { label: 'Completed sessions', value: completedBookings.length, accent: false },
            { label: 'Fee per session', value: `₹${Number(therapist.fee_per_session).toLocaleString()}`, accent: false },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <p className={`font-serif text-2xl font-semibold ${stat.accent ? 'text-teal' : 'text-brand-black dark:text-white'}`}>{stat.value}</p>
              <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Left panel */}
          <div className="space-y-4">

            {/* Pending booking requests */}
            {pendingBookings.length > 0 && (
              <div className="card p-4 space-y-3">
                <h2 className="font-semibold text-sm text-brand-black dark:text-white flex items-center gap-2">
                  New Requests
                  <span className="w-5 h-5 rounded-full bg-teal text-white text-xs flex items-center justify-center">{pendingBookings.length}</span>
                </h2>
                {pendingBookings.map((b) => {
                  const reqName = b.patient_profile?.onboarding_data?.name;
                  return (
                    <div key={b.id} className="border border-teal/20 dark:border-teal/10 bg-teal/3 dark:bg-teal/5 rounded-xl p-3.5 space-y-3">
                      <div>
                        <span className="text-xs font-medium text-teal">
                          From: {reqName ? reqName : `Patient #${b.patient_id.slice(0, 6)}`}
                        </span>
                        <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-0.5">{formatters.relative(b.created_at)}</p>
                      </div>
                      {b.proposed_slots?.[0] && (
                        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg px-3 py-2">
                          <p className="text-xs text-graphite dark:text-[#A0A0A0]">Requested slot</p>
                          <p className="text-sm font-medium text-brand-black dark:text-white">{formatters.datetime(b.proposed_slots[0])}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(b.id)}
                          className="flex-1 py-2 bg-teal text-white text-xs font-medium rounded-lg hover:bg-teal-600 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(b.id)}
                          className="flex-1 py-2 border border-light-grey dark:border-[#2E2E2E] text-graphite dark:text-[#A0A0A0] text-xs font-medium rounded-lg hover:bg-light-grey dark:hover:bg-[#2A2A2A] transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unique Patient list sidebar section */}
            <div className="card p-4">
              <h2 className="font-semibold text-sm text-brand-black dark:text-white mb-3">Patients ({uniquePatients.length})</h2>
              {uniquePatients.length === 0 ? (
                <p className="text-xs text-graphite/50 dark:text-[#444] text-center py-6">
                  No confirmed patients yet.<br />
                  {!available && <span className="text-teal">Turn on availability above to receive bookings.</span>}
                </p>
              ) : (
                <div className="space-y-1">
                  {uniquePatients.map((b) => {
                    const sideName = b.patient_profile?.onboarding_data?.name;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedPatientId(b.patient_id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                          selectedPatientId === b.patient_id
                            ? 'bg-teal/10 text-teal'
                            : 'hover:bg-light-grey dark:hover:bg-[#2A2A2A] text-graphite dark:text-[#A0A0A0]'
                        }`}
                      >
                        <p className="font-medium text-sm">
                          {sideName ? sideName : `Patient #${b.patient_id.slice(0, 6)}`}
                        </p>
                        <p className="text-xs opacity-60">View history timeline</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Profile quick edit */}
            <div className="card p-4 space-y-3">
              <h2 className="font-semibold text-sm text-brand-black dark:text-white">My profile</h2>
              <div className="flex flex-wrap gap-1.5">
                {(therapist.specializations || []).slice(0, 3).map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 bg-teal/8 dark:bg-teal/10 text-teal rounded-full">{s}</span>
                ))}
              </div>
              <p className="text-xs text-graphite dark:text-[#A0A0A0] leading-relaxed line-clamp-3">{therapist.bio}</p>
              <Link to="/dashboard/therapist/edit-profile" className="text-xs text-teal hover:underline">Edit profile →</Link>
            </div>
          </div>

          {/* Right panel — details viewer */}
          <div className="card p-6 min-h-[400px]">
            {/* Toggle between views */}
            <div className="flex items-center gap-2 mb-6 border-b border-light-grey dark:border-[#2E2E2E]">
              <button
                onClick={() => setViewMode('schedule')}
                className={`pb-3 px-2 text-sm font-medium transition-colors ${
                  viewMode === 'schedule'
                    ? 'text-teal border-b-2 border-teal'
                    : 'text-graphite dark:text-[#A0A0A0] hover:text-brand-black dark:hover:text-white'
                }`}
              >
                📅 Schedule
              </button>
              <button
                onClick={() => setViewMode('patient')}
                className={`pb-3 px-2 text-sm font-medium transition-colors ${
                  viewMode === 'patient'
                    ? 'text-teal border-b-2 border-teal'
                    : 'text-graphite dark:text-[#A0A0A0] hover:text-brand-black dark:hover:text-white'
                }`}
              >
                👤 Patient
              </button>
            </div>

            {viewMode === 'schedule' ? (
              <ScheduleView bookings={bookings} onCompleteSession={handleComplete} />
            ) : (
              <>
                {!selectedPatientId ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-10">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E8E5E0" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <p className="font-serif text-base text-brand-black dark:text-white">Select a patient</p>
                    <p className="text-sm text-graphite dark:text-[#A0A0A0] max-w-xs">Click a name from the left to view session info and write private notes.</p>
                  </div>
                ) : (
                  <PatientPanel 
                    patientId={selectedPatientId} 
                    onSaveNote={handleSaveNote} 
                    onCompleteSession={handleComplete}
                    patientBookings={patientBookings.filter((b) => b.patient_id === selectedPatientId)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
