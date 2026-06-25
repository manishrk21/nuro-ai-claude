// FILE: bookingService.js | PURPOSE: Booking CRUD via backend API | CONNECTS TO: useBooking.js

import { authService } from './authService.js'

const API_URL = import.meta.env.VITE_API_URL

async function authFetch(path, options = {}) {
  const token = await authService.getAccessToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const bookingService = {
  async createBooking(therapistId, proposedSlots) {
    return authFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ therapist_id: therapistId, proposed_slots: proposedSlots }),
    })
  },

  async getMyBookings() {
    return authFetch('/api/bookings')
  },

  async acceptBooking(bookingId) {
    return authFetch(`/api/bookings/${bookingId}/accept`, { method: 'POST' })
  },

  async rejectBooking(bookingId) {
    return authFetch(`/api/bookings/${bookingId}/reject`, { method: 'POST' })
  },

  async completeBooking(bookingId) {
    const useDev = import.meta.env.VITE_USE_DEV_COMPLETE === 'true'
    const devKey = import.meta.env.VITE_DEV_TEST_KEY || 'dev-key'
    const path = useDev ? `/api/bookings/${bookingId}/complete-dev` : `/api/bookings/${bookingId}/complete`

    // For dev endpoint, include the X-DEV-KEY header; authFetch will also attach Authorization if available.
    return authFetch(path, { method: 'POST', headers: useDev ? { 'X-DEV-KEY': devKey } : {} })
  },

  async cancelBooking(bookingId) {
    return authFetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
  },
}

// CHANGE THIS FILE IF YOU WANT TO: add booking rescheduling, add payment integration
