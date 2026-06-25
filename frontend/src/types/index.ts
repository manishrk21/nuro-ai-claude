// FILE: types/index.ts | PURPOSE: Shared TypeScript types | CONNECTS TO: All services, hooks, components

export interface User {
  id: string
  email: string
}

export interface Profile {
  id: string
  user_id: string
  role: 'patient' | 'therapist'
  onboarding_complete: boolean
  consent_accepted: boolean
  consent_accepted_at?: string
  created_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  onboarding_data: Record<string, unknown>
  financial_comfort: 'Comfortable' | 'Managing' | 'Struggling'
  sleep_quality: 'Good' | 'Inconsistent' | 'Poor'
  updated_at: string
}

export interface Therapist {
  id: string
  user_id: string
  name: string
  photo_url?: string
  specializations: string[]
  license_type: string
  license_number: string
  years_experience: number
  languages: string[]
  fee_per_session: number
  available: boolean
  bio: string
  verified_status: 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended'
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  tokens_used?: number
  created_at: string
}

export interface BookingRequest {
  id: string
  patient_id: string
  therapist_id: string
  requested_at: string
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show'
  proposed_slots: unknown[]
  meet_link?: string
  created_at: string
}

export interface ConfirmedSession {
  id: string
  booking_id: string
  patient_id: string
  therapist_id: string
  session_at: string
  duration_minutes: number
  status: string
  calendar_event_id?: string
  created_at: string
}

export interface QuotaInfo {
  used: number
  limit: number
  remaining: number
  plan: 'free' | 'pro' | 'enterprise'
}

// CHANGE THIS FILE IF YOU WANT TO: add new entity types, extend existing types with new fields
