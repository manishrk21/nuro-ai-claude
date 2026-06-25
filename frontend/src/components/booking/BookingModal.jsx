// FILE: booking/BookingModal.jsx | PURPOSE: 5-step booking flow modal | CONNECTS TO: TherapistsPage.jsx, TherapistProfilePage.jsx, useBooking.js

import { useState } from 'react'
import TimeSlotPicker from './TimeSlotPicker.jsx'
import { useBooking } from '../../hooks/useBooking.js'
import { calendarService } from '../../services/calendarService.js'
import { profileService } from '../../services/profileService.js'
import { useAuthContext } from '../../context/AuthContext.jsx'
import { formatters } from '../../utils/formatters.js'

const STEPS = ['Pick a time', 'Confirm', 'Booked!', 'Add to calendar', 'Save therapist']

export default function BookingModal({ therapist, onClose }) {
  const { user } = useAuthContext()
  const { createBooking, loading } = useBooking()
  const [step, setStep] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [booking, setBooking] = useState(null)
  const [saved, setSaved] = useState(false)

  const meetLink = booking?.meet_link || calendarService.generateMeetLink()

  const handleBook = async () => {
    if (!selectedSlot) return
    const result = await createBooking(therapist.id, [selectedSlot])
    if (result) {
      setBooking(result)
      setStep(2)
    }
  }

  const handleAddCalendar = () => {
    if (!selectedSlot) return
    const start = new Date(selectedSlot)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const url = calendarService.buildGoogleCalendarLink({
      title: `Session with ${therapist.name} — NURO AI`,
      startDate: start,
      endDate: end,
      description: `Therapy session.\nJoin: https://${meetLink}`,
    })
    window.open(url, '_blank', 'noopener')
    setStep(4)
  }

  const handleSaveTherapist = async () => {
    if (!user) return
    await profileService.saveTherapist(user.id, therapist.id)
    setSaved(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-2xl w-full max-w-md p-6 relative">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-light-grey dark:hover:bg-[#2A2A2A] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-teal' : 'bg-light-grey dark:bg-[#2E2E2E]'}`} />
          ))}
        </div>

        <h2 className="font-serif text-xl font-semibold text-brand-black dark:text-white mb-1">{STEPS[step]}</h2>
        <p className="text-sm text-graphite dark:text-[#A0A0A0] mb-5">with {therapist.name}</p>

        {/* Step 0: Pick time */}
        {step === 0 && (
          <>
            <TimeSlotPicker onSlotSelect={setSelectedSlot} selectedSlot={selectedSlot} />
            <button
              onClick={() => setStep(1)}
              disabled={!selectedSlot}
              className="w-full btn-primary py-3 mt-5 disabled:opacity-40"
            >
              Continue
            </button>
          </>
        )}

        {/* Step 1: Confirm */}
        {step === 1 && (
          <>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-graphite dark:text-[#A0A0A0]">Therapist</span>
                <span className="font-medium text-brand-black dark:text-white">{therapist.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-graphite dark:text-[#A0A0A0]">Date & time</span>
                <span className="font-medium text-brand-black dark:text-white">{selectedSlot ? formatters.datetime(selectedSlot) : '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-graphite dark:text-[#A0A0A0]">Duration</span>
                <span className="font-medium text-brand-black dark:text-white">60 minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-graphite dark:text-[#A0A0A0]">Fee</span>
                <span className="font-semibold text-teal">{formatters.currency(therapist.fee_per_session)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="flex-1 btn-outline py-3">Back</button>
              <button onClick={handleBook} disabled={loading} className="flex-1 btn-primary py-3 disabled:opacity-40">
                {loading ? 'Booking…' : 'Confirm'}
              </button>
            </div>
          </>
        )}

        {/* Step 2: Booked! */}
        {step === 2 && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            </div>
            <p className="text-sm text-graphite dark:text-[#A0A0A0]">Your request has been sent. You'll be notified once {therapist.name} confirms.</p>
            <div className="bg-cream dark:bg-[#2A2A2A] rounded-xl p-4 text-left">
              <p className="text-xs text-graphite dark:text-[#A0A0A0] mb-1">Google Meet link (placeholder)</p>
              <a href={`https://${meetLink}`} className="text-sm text-teal font-medium break-all">{meetLink}</a>
            </div>
            <button onClick={() => setStep(3)} className="w-full btn-primary py-3">Next</button>
          </div>
        )}

        {/* Step 3: Calendar */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <p className="text-sm text-graphite dark:text-[#A0A0A0]">Add this session to your Google Calendar so you don't miss it.</p>
            <button onClick={handleAddCalendar} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Add to Google Calendar
            </button>
            <button onClick={() => setStep(4)} className="w-full text-sm text-graphite dark:text-[#A0A0A0] hover:text-brand-black dark:hover:text-white underline transition-colors">
              Skip for now
            </button>
          </div>
        )}

        {/* Step 4: Save therapist */}
        {step === 4 && (
          <div className="text-center space-y-4">
            <p className="text-sm text-graphite dark:text-[#A0A0A0]">Save {therapist.name} to your therapists for easy access later.</p>
            {saved ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ Saved to My Therapists</p>
            ) : (
              <button onClick={handleSaveTherapist} className="w-full btn-primary py-3">
                Save {therapist.name}
              </button>
            )}
            <button onClick={onClose} className="w-full btn-outline py-3">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add payment step, add cancellation policy, add session notes pre-session
