// FILE: therapistService.js | PURPOSE: Therapist listing, profiles, availability | CONNECTS TO: useTherapists.js

import { authService } from './authService.js'

const API_URL = import.meta.env.VITE_API_URL

async function authFetch(path, options = {}) {
  const token = await authService.getAccessToken()
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}

export const therapistService = {
  async listTherapists(filters = {}) {
    const params = new URLSearchParams()
    if (filters.specialization) params.set('specialization', filters.specialization)
    if (filters.language) params.set('language', filters.language)
    if (filters.feeMax) params.set('fee_max', filters.feeMax)
    if (filters.availableOnly) params.set('available_only', 'true')
    if (filters.search) params.set('search', filters.search)

    const res = await fetch(`${API_URL}/api/therapists?${params}`)
    if (!res.ok) throw new Error('Failed to load therapists')
    return res.json()
  },

  async getTherapist(id) {
    const res = await fetch(`${API_URL}/api/therapists/${id}`)
    if (!res.ok) throw new Error('Therapist not found')
    return res.json()
  },

  async updateMyProfile(profileData) {
    const res = await authFetch('/api/therapists/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
    if (!res.ok) throw new Error('Failed to update profile')
    return res.json()
  },

  async setAvailability(slots) {
    const res = await authFetch('/api/therapists/me/availability', {
      method: 'POST',
      body: JSON.stringify({ slots }),
    })
    if (!res.ok) throw new Error('Failed to update availability')
    return res.json()
  },

  async getGoogleCalendarStatus() {
    const res = await authFetch('/api/auth/google/status')
    if (!res.ok) throw new Error('Failed to fetch Google Calendar status')
    return res.json()
  },
}

// CHANGE THIS FILE IF YOU WANT TO: add more filter options, cache therapist data, add pagination
