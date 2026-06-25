// FILE: useChat.js | PURPOSE: Chat state, streaming, session management | CONNECTS TO: chatService.js, ChatPage.jsx

import { useState, useCallback, useRef } from 'react'
import { chatService } from '../services/chatService.js'
import { useAuthContext } from '../context/AuthContext.jsx'

export function useChat() {
  const { user } = useAuthContext()
  const [messages, setMessages] = useState([])
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState(null)
  const [quota, setQuota] = useState(null)
  const abortRef = useRef(null)

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsStreaming(false)
    setStreamingContent('')
  }, [])

  const loadSessions = useCallback(async () => {
    if (!user) return
    try {
      const data = await chatService.loadRecentSessions(user.id)
      setSessions(data)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    }
  }, [user])

  const loadMessages = useCallback(async (sessionId) => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    
    setIsStreaming(false)
    setStreamingContent('')
    setError(null)
    setMessages([]) 
    setCurrentSessionId(sessionId)

    try {
      const data = await chatService.loadMessages(sessionId)
      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load messages.')
    }
  }, [])

  const startNewSession = useCallback(async () => {
    if (!user) return null
    
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setIsStreaming(false)
    setStreamingContent('')
    setError(null)

    try {
      const session = await chatService.createSession(user.id)
      setCurrentSessionId(session.id)
      setMessages([])
      setSessions((prev) => [session, ...prev])
      return session.id
    } catch (err) {
      setError('Failed to start session.')
      return null
    }
  }, [user])

  const sendMessage = useCallback(async (content, voiceOptions = null) => {
    if (!user || isStreaming) return
    setError(null)

    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = await startNewSession()
      if (!sessionId) return
    }

    const userMsg = { role: 'user', content, session_id: sessionId, created_at: new Date().toISOString(), id: `temp-${Date.now()}` }
    setMessages((prev) => [...prev, userMsg])

    try {
      const saved = await chatService.saveMessage(sessionId, 'user', content)
      setMessages((prev) => prev.map((m) => (m.id === userMsg.id ? saved : m)))
    } catch {
      // non-blocking
    }

    let history = []
    setMessages((prev) => {
      history = prev.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }))
      return prev
    })

    setIsStreaming(true)
    setStreamingContent('')
    let fullContent = ''

    const controller = new AbortController()
    abortRef.current = controller

    await chatService.streamMessage({
      sessionId,
      messages: history,
      signal: controller.signal,
      onToken: (token) => {
        if (controller.signal.aborted) return;
        fullContent += token
        setStreamingContent(fullContent)
        
        // Pass individual voice tokens to speakers instantly
        if (voiceOptions?.speakToken) {
          voiceOptions.speakToken(token)
        }
      },
      onDone: async (tokensUsed) => {
        if (controller.signal.aborted) return;
        
        // Flush any remaining voice data out of memory at line break
        if (voiceOptions?.flushSpeakBuffer) {
          voiceOptions.flushSpeakBuffer()
        }

        setIsStreaming(false)
        setStreamingContent('')
        
        const assistantMsg = {
          role: 'assistant',
          content: fullContent,
          session_id: sessionId,
          created_at: new Date().toISOString(),
          id: `temp-assistant-${Date.now()}`,
        }
        
        setMessages((prev) => {
          const alreadyExists = prev.some(m => m.content === fullContent && m.role === 'assistant');
          if (alreadyExists) return prev;
          return [...prev, assistantMsg];
        })

        setMessages((prev) => {
          if (prev.filter(m => m.session_id === sessionId).length <= 2) {
            const title = content.slice(0, 50)
            chatService.updateSessionTitle(sessionId, title).catch(() => {})
            setSessions((sPrev) => sPrev.map((s) => (s.id === sessionId ? { ...s, title } : s)))
          }
          return prev
        })

        if (user) {
          chatService.getQuota(user.id).then(setQuota).catch(() => {})
        }
      },
      onError: (err) => {
        if (controller.signal.aborted) return;
        setIsStreaming(false)
        setStreamingContent('')
        setError(err.message || 'Something went wrong. Please try again.')
      },
    })
  }, [user, isStreaming, currentSessionId, startNewSession])

  const loadQuota = useCallback(async () => {
    if (!user) return
    try {
      const q = await chatService.getQuota(user.id)
      setQuota(q)
    } catch {}
  }, [user])

  const deleteSession = useCallback(async (sessionId) => {
    await chatService.deleteSession(sessionId)
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
      setMessages([])
    }
  }, [currentSessionId])

  return {
    messages, sessions, currentSessionId, isStreaming, streamingContent, error, quota,
    loadSessions, loadMessages, startNewSession, sendMessage, stopStreaming, loadQuota, deleteSession, setError,
  }
}



// claude
// // FILE: useChat.js | PURPOSE: Chat state, streaming, session management | CONNECTS TO: chatService.js, ChatPage.jsx

// import { useState, useCallback, useRef } from 'react'
// import { chatService } from '../services/chatService.js'
// import { useAuthContext } from '../context/AuthContext.jsx'

// export function useChat() {
//   const { user } = useAuthContext()
//   const [messages, setMessages] = useState([])
//   const [sessions, setSessions] = useState([])
//   const [currentSessionId, setCurrentSessionId] = useState(null)
//   const [isStreaming, setIsStreaming] = useState(false)
//   const [streamingContent, setStreamingContent] = useState('')
//   const [error, setError] = useState(null)
//   const [quota, setQuota] = useState(null)
//   const abortRef = useRef(null)

//   const loadSessions = useCallback(async () => {
//     if (!user) return
//     try {
//       const data = await chatService.loadRecentSessions(user.id)
//       setSessions(data)
//     } catch (err) {
//       console.error('Failed to load sessions:', err)
//     }
//   }, [user])

//   const loadMessages = useCallback(async (sessionId) => {
//     try {
//       const data = await chatService.loadMessages(sessionId)
//       setMessages(data)
//       setCurrentSessionId(sessionId)
//     } catch (err) {
//       setError('Failed to load messages.')
//     }
//   }, [])

//   const startNewSession = useCallback(async () => {
//     if (!user) return null
//     try {
//       const session = await chatService.createSession(user.id)
//       setCurrentSessionId(session.id)
//       setMessages([])
//       setSessions((prev) => [session, ...prev])
//       return session.id
//     } catch (err) {
//       setError('Failed to start session.')
//       return null
//     }
//   }, [user])

//   const sendMessage = useCallback(async (content) => {
//     if (!user || isStreaming) return
//     setError(null)

//     // Ensure we have a session
//     let sessionId = currentSessionId
//     if (!sessionId) {
//       sessionId = await startNewSession()
//       if (!sessionId) return
//     }

//     // Optimistically add user message
//     const userMsg = { role: 'user', content, session_id: sessionId, created_at: new Date().toISOString(), id: `temp-${Date.now()}` }
//     setMessages((prev) => [...prev, userMsg])

//     // Save user message to Supabase
//     try {
//       const saved = await chatService.saveMessage(sessionId, 'user', content)
//       setMessages((prev) => prev.map((m) => (m.id === userMsg.id ? saved : m)))
//     } catch {
//       // non-blocking; continue streaming
//     }

//     // Build message history for API (last 20)
//     const history = [...messages, userMsg].slice(-20).map((m) => ({
//       role: m.role,
//       content: m.content,
//     }))

//     // Start streaming
//     setIsStreaming(true)
//     setStreamingContent('')
//     let fullContent = ''

//     const controller = new AbortController()
//     abortRef.current = controller

//     await chatService.streamMessage({
//       sessionId,
//       messages: history,
//       signal: controller.signal,
//       onToken: (token) => {
//         fullContent += token
//         setStreamingContent(fullContent)
//       },
//       onDone: async (tokensUsed) => {
//         setIsStreaming(false)
//         setStreamingContent('')
//         const assistantMsg = {
//           role: 'assistant',
//           content: fullContent,
//           session_id: sessionId,
//           created_at: new Date().toISOString(),
//           id: `temp-assistant-${Date.now()}`,
//         }
//         setMessages((prev) => [...prev, assistantMsg])

//         // Save assistant message
//         try {
//           const saved = await chatService.saveMessage(sessionId, 'assistant', fullContent, tokensUsed)
//           setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? saved : m)))
//         } catch {}

//         // Auto-title session from first user message
//         if (messages.length === 0) {
//           const title = content.slice(0, 50)
//           await chatService.updateSessionTitle(sessionId, title).catch(() => {})
//           setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title } : s)))
//         }

//         // Refresh quota
//         if (user) {
//           chatService.getQuota(user.id).then(setQuota).catch(() => {})
//         }
//       },
//       onError: (err) => {
//         setIsStreaming(false)
//         setStreamingContent('')
//         setError(err.message || 'Something went wrong. Please try again.')
//       },
//     })
//   }, [user, isStreaming, currentSessionId, messages, startNewSession])

//   const stopStreaming = useCallback(() => {
//     if (abortRef.current) {
//       abortRef.current.abort()
//       setIsStreaming(false)
//       setStreamingContent('')
//     }
//   }, [])

//   const loadQuota = useCallback(async () => {
//     if (!user) return
//     try {
//       const q = await chatService.getQuota(user.id)
//       setQuota(q)
//     } catch {}
//   }, [user])

//   const deleteSession = useCallback(async (sessionId) => {
//     await chatService.deleteSession(sessionId)
//     setSessions((prev) => prev.filter((s) => s.id !== sessionId))
//     if (currentSessionId === sessionId) {
//       setCurrentSessionId(null)
//       setMessages([])
//     }
//   }, [currentSessionId])

//   return {
//     messages,
//     sessions,
//     currentSessionId,
//     isStreaming,
//     streamingContent,
//     error,
//     quota,
//     loadSessions,
//     loadMessages,
//     startNewSession,
//     sendMessage,
//     stopStreaming,
//     loadQuota,
//     deleteSession,
//     setError,
//   }
// }

// // CHANGE THIS FILE IF YOU WANT TO: adjust history window size, change optimistic update behavior, add message reactions

// //gemmini
// // FILE: useChat.js | PURPOSE: Chat state, streaming, session management | CONNECTS TO: chatService.js, ChatPage.jsx

// import { useState, useCallback, useRef } from 'react'
// import { chatService } from '../services/chatService.js'
// import { useAuthContext } from '../context/AuthContext.jsx'

// export function useChat() {
//   const { user } = useAuthContext()
//   const [messages, setMessages] = useState([])
//   const [sessions, setSessions] = useState([])
//   const [currentSessionId, setCurrentSessionId] = useState(null)
//   const [isStreaming, setIsStreaming] = useState(false)
//   const [streamingContent, setStreamingContent] = useState('')
//   const [error, setError] = useState(null)
//   const [quota, setQuota] = useState(null)
//   const abortRef = useRef(null)

//   const stopStreaming = useCallback(() => {
//     if (abortRef.current) {
//       abortRef.current.abort()
//       abortRef.current = null
//     }
//     setIsStreaming(false)
//     setStreamingContent('')
//   }, [])

//   const loadSessions = useCallback(async () => {
//     if (!user) return
//     try {
//       const data = await chatService.loadRecentSessions(user.id)
//       setSessions(data)
//     } catch (err) {
//       console.error('Failed to load sessions:', err)
//     }
//   }, [user])

//   const loadMessages = useCallback(async (sessionId) => {
//     if (abortRef.current) {
//       abortRef.current.abort();
//       abortRef.current = null;
//     }
    
//     setIsStreaming(false)
//     setStreamingContent('')
//     setError(null)
//     setMessages([]) 
//     setCurrentSessionId(sessionId)

//     try {
//       const data = await chatService.loadMessages(sessionId)
//       setMessages(Array.isArray(data) ? data : [])
//     } catch (err) {
//       setError('Failed to load messages.')
//     }
//   }, [])

//   const startNewSession = useCallback(async () => {
//     if (!user) return null
    
//     if (abortRef.current) {
//       abortRef.current.abort();
//       abortRef.current = null;
//     }

//     setIsStreaming(false)
//     setStreamingContent('')
//     setError(null)

//     try {
//       const session = await chatService.createSession(user.id)
//       setCurrentSessionId(session.id)
//       setMessages([])
//       setSessions((prev) => [session, ...prev])
//       return session.id
//     } catch (err) {
//       setError('Failed to start session.')
//       return null
//     }
//   }, [user])

//   const sendMessage = useCallback(async (content) => {
//     if (!user || isStreaming) return
//     setError(null)

//     let sessionId = currentSessionId
//     if (!sessionId) {
//       sessionId = await startNewSession()
//       if (!sessionId) return
//     }

//     const userMsg = { role: 'user', content, session_id: sessionId, created_at: new Date().toISOString(), id: `temp-${Date.now()}` }
//     setMessages((prev) => [...prev, userMsg])

//     try {
//       const saved = await chatService.saveMessage(sessionId, 'user', content)
//       setMessages((prev) => prev.map((m) => (m.id === userMsg.id ? saved : m)))
//     } catch {
//       // non-blocking
//     }

//     let history = []
//     setMessages((prev) => {
//       history = prev.slice(-20).map((m) => ({
//         role: m.role,
//         content: m.content,
//       }))
//       return prev
//     })

//     setIsStreaming(true)
//     setStreamingContent('')
//     let fullContent = ''

//     const controller = new AbortController()
//     abortRef.current = controller

//     await chatService.streamMessage({
//       sessionId,
//       messages: history,
//       signal: controller.signal,
//       onToken: (token) => {
//         if (controller.signal.aborted) return;
//         fullContent += token
//         setStreamingContent(fullContent)
//       },
//       onDone: async (tokensUsed) => {
//         if (controller.signal.aborted) return;
//         setIsStreaming(false)
//         setStreamingContent('')
        
//         const assistantMsg = {
//           role: 'assistant',
//           content: fullContent,
//           session_id: sessionId,
//           created_at: new Date().toISOString(),
//           id: `temp-assistant-${Date.now()}`,
//         }
        
//         // Add assistant message locally for immediate feedback without double-rendering
//         setMessages((prev) => {
//           const alreadyExists = prev.some(m => m.content === fullContent && m.role === 'assistant');
//           if (alreadyExists) return prev;
//           return [...prev, assistantMsg];
//         })

//         // NOTE: chatService.saveMessage for assistant removed from here.
//         // The backend python code automatically saves the assistant response to Supabase.

//         setMessages((prev) => {
//           if (prev.filter(m => m.session_id === sessionId).length <= 2) {
//             const title = content.slice(0, 50)
//             chatService.updateSessionTitle(sessionId, title).catch(() => {})
//             setSessions((sPrev) => sPrev.map((s) => (s.id === sessionId ? { ...s, title } : s)))
//           }
//           return prev
//         })

//         if (user) {
//           chatService.getQuota(user.id).then(setQuota).catch(() => {})
//         }
//       },
//       onError: (err) => {
//         if (controller.signal.aborted) return;
//         setIsStreaming(false)
//         setStreamingContent('')
//         setError(err.message || 'Something went wrong. Please try again.')
//       },
//     })
//   }, [user, isStreaming, currentSessionId, startNewSession])

//   const loadQuota = useCallback(async () => {
//     if (!user) return
//     try {
//       const q = await chatService.getQuota(user.id)
//       setQuota(q)
//     } catch {}
//   }, [user])

//   const deleteSession = useCallback(async (sessionId) => {
//     await chatService.deleteSession(sessionId)
//     setSessions((prev) => prev.filter((s) => s.id !== sessionId))
//     if (currentSessionId === sessionId) {
//       setCurrentSessionId(null)
//       setMessages([])
//     }
//   }, [currentSessionId])

//   return {
//     messages, sessions, currentSessionId, isStreaming, streamingContent, error, quota,
//     loadSessions, loadMessages, startNewSession, sendMessage, stopStreaming, loadQuota, deleteSession, setError,
//   }
// }

// // gemini
