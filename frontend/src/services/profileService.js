// FILE: profileService.js | PURPOSE: User profile reads/writes to Supabase | CONNECTS TO: OnboardingPage.jsx, PatientDashboard.jsx

import { supabase } from './supabaseClient.js'

export const profileService = {
  async getPreferences(userId) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async saveOnboardingData(userId, onboardingData) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        onboarding_data: onboardingData,
        financial_comfort: onboardingData.financial_comfort,
        sleep_quality: onboardingData.sleep_quality,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getSavedTherapists(userId) {
    const { data, error } = await supabase
      .from('saved_therapists')
      .select('therapist_id, saved_at, therapists(*)')
      .eq('patient_id', userId)
      .order('saved_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async saveTherapist(userId, therapistId) {
    const { error } = await supabase
      .from('saved_therapists')
      .upsert({ patient_id: userId, therapist_id: therapistId })
    if (error) throw error
  },

  async unsaveTherapist(userId, therapistId) {
    const { error } = await supabase
      .from('saved_therapists')
      .delete()
      .eq('patient_id', userId)
      .eq('therapist_id', therapistId)
    if (error) throw error
  },

  async getUpcomingSessions(userId) {
    const { data, error } = await supabase
      .from('confirmed_sessions')
      .select('*, therapists(name, photo_url)')
      .eq('patient_id', userId)
      .gte('session_at', new Date().toISOString())
      .order('session_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },
}

// CHANGE THIS FILE IF YOU WANT TO: add profile photo upload, change what onboarding data is stored
