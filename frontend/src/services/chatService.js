// FILE: chatService.js | PURPOSE: /api/stream SSE connection + Supabase chat history CRUD | CONNECTS TO: useChat.js

import { supabase } from './supabaseClient.js'
import { authService } from './authService.js'

const API_URL = import.meta.env.VITE_API_URL

export const chatService = {
  /** Stream AI response tokens from backend SSE endpoint */
  async streamMessage({ sessionId, messages, onToken, onDone, onError, signal }) {
    const token = await authService.getAccessToken()
    if (!token) throw new Error('Not authenticated')

    try {
      const response = await fetch(`${API_URL}/api/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: sessionId, messages }),
        signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        if (response.status === 429) {
          throw new Error(err.detail || 'Daily message limit reached.')
        }
        throw new Error(err.detail || `Backend error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const payload = JSON.parse(raw)
            if (payload.token) onToken(payload.token)
            if (payload.done) onDone(payload.tokens_used ?? 0)
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      onError(err)
    }
  },

  /** Create a new chat session in Supabase */
  async createSession(userId, title = 'New conversation') {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title })
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** Save a message to Supabase */
  async saveMessage(sessionId, role, content, tokensUsed = 0) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ session_id: sessionId, role, content, tokens_used: tokensUsed })
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** Load messages for a session (last 50) */
  async loadMessages(sessionId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(50)
    if (error) throw error
    return data ?? []
  },

  /** Load last 3 sessions for sidebar */
  async loadRecentSessions(userId) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10)
    if (error) throw error
    return data ?? []
  },

  /** Update session title */
  async updateSessionTitle(sessionId, title) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
    if (error) throw error
  },

  /** Delete a session and its messages */
  async deleteSession(sessionId) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)
    if (error) throw error
    const { error: err2 } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
    if (err2) throw err2
  },

  /** Check remaining quota for today */
  // async getQuota(userId) {
  //   const today = new Date().toISOString().slice(0, 10)
  //   const { data, error } = await supabase
  //     .from('message_quotas')
  //     .select('count, plan')
  //     .eq('user_id', userId)
  //     .eq('date', today)
  //     .single()
  //   if (error && error.code !== 'PGRST116') throw error
  //   const plan = data?.plan ?? 'free'
  //   const used = data?.count ?? 0
  //   const limit = plan === 'pro' ? 500 : 50
  //   return { used, limit, remaining: Math.max(0, limit - used), plan }
  // },

async getQuota(userId) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('message_quotas')
      .select('count, plan')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (error) {
      return { used: 0, limit: 99999, remaining: 99999, plan: 'free' }
    }

    const plan = data?.plan ?? 'free'
    const used = data?.count ?? 0
    const limit = 99999
    return { used, limit, remaining: Math.max(0, limit - used), plan }
  } catch {
    return { used: 0, limit: 99999, remaining: 99999, plan: 'free' }
  }
},
  
}

// CHANGE THIS FILE IF YOU WANT TO: adjust quota limits, change session title logic, modify SSE parsing
