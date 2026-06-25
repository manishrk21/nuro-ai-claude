// FILE: supabaseClient.js | PURPOSE: Shared Supabase browser client | CONNECTS TO: authService.js, chatService.js, profileService.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'nuro_session',
  },
})

// CHANGE THIS FILE IF YOU WANT TO: change Supabase project, adjust auth session persistence settings
