// FILE: useVoice.js | PURPOSE: Continuous Gemini Live interaction with seamless interruption | CONNECTS TO: ChatPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'

const SENTENCE_END = /[.?!,]/

export function useVoice({ onTranscript, onSpeakingChange, onInterrupted } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceGender, setVoiceGender] = useState('female')
  const [supported, setSupported] = useState(false)
  
  const recognitionRef = useRef(null)
  const speakQueueRef = useRef([])
  const speakBufferRef = useRef('')
  const isSpeakingRef = useRef(false)
  const shouldRestartMicRef = useRef(false) // Traps microphone in an open loop

  useEffect(() => {
    const hasSpeech = 'speechSynthesis' in window
    const hasRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    setSupported(hasSpeech && hasRecognition)

    return () => {
      shouldRestartMicRef.current = false
      window.speechSynthesis?.cancel()
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) {}
      }
    }
  }, [])

  const getVoice = useCallback((gender) => {
    const voices = window.speechSynthesis.getVoices()
    const enVoices = voices.filter((v) => v.lang.startsWith('en'))
    if (!enVoices.length) return null

    const genderKey = gender === 'female' ? ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria'] : ['male', 'man', 'david', 'daniel', 'alex']
    const match = enVoices.find((v) => genderKey.some((k) => v.name.toLowerCase().includes(k)))
    return match ?? enVoices[0]
  }, [])

  /** Cancel all speech immediately if user interrupts */
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis?.speaking || isSpeakingRef.current) {
      window.speechSynthesis?.cancel()
      speakQueueRef.current = []
      speakBufferRef.current = ''
      isSpeakingRef.current = false
      setIsSpeaking(false)
      onSpeakingChange?.(false)
      onInterrupted?.() // Signal useChat to stop downloading stream
    }
  }, [onSpeakingChange, onInterrupted])

  const speakChunk = useCallback((text) => {
    if (!text.trim()) return
    const utterance = new SpeechSynthesisUtterance(text.trim())
    utterance.voice = getVoice(voiceGender)
    utterance.rate = 1.05 // Slightly accelerated for snappy responses

    utterance.onstart = () => {
      isSpeakingRef.current = true
      setIsSpeaking(true)
      onSpeakingChange?.(true)
    }
    
    utterance.onend = () => {
      const next = speakQueueRef.current.shift()
      if (next) {
        speakChunk(next)
      } else {
        isSpeakingRef.current = false
        setIsSpeaking(false)
        onSpeakingChange?.(false)
      }
    }

    utterance.onerror = () => {
      isSpeakingRef.current = false
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }, [getVoice, voiceGender, onSpeakingChange])

  const speakToken = useCallback((token) => {
    speakBufferRef.current += token
    if (SENTENCE_END.test(token)) {
      const chunk = speakBufferRef.current
      speakBufferRef.current = ''
      if (isSpeakingRef.current) {
        speakQueueRef.current.push(chunk)
      } else {
        speakChunk(chunk)
      }
    }
  }, [speakChunk])

  const flushSpeakBuffer = useCallback(() => {
    const remaining = speakBufferRef.current.trim()
    speakBufferRef.current = ''
    if (!remaining) return
    if (isSpeakingRef.current) {
      speakQueueRef.current.push(remaining)
    } else {
      speakChunk(remaining)
    }
  }, [speakChunk])

  /** Start continuous live speech recognition loop */
  const startListening = useCallback(() => {
    if (!supported) return
    
    // Clear any active recognition to prevent overlapping crash states
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch(e){}
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    // Crucial configurations for persistent Live mode
    recognition.continuous = true 
    recognition.interimResults = true
    recognition.lang = 'en-US'

    shouldRestartMicRef.current = true

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (e) => {
      // 🚨 INTERRUPTION TRAP: Cut off speakers immediately if user speaks over AI
      if (isSpeakingRef.current || window.speechSynthesis.speaking) {
        stopSpeaking()
      }

      // Loop dynamically from current resultIndex through the end of the results array.
      // This prevents the engine from dropping phrases in continuous tracking mode.
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          const transcript = result[0]?.transcript ?? ''
          if (transcript.trim()) {
            onTranscript?.(transcript)
          }
        }
      }
    }

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.error('Live interaction STT error:', e.error)
      }
    }

    // Automatically reboot microphone with a minor delay to avoid browser security blocking
    recognition.onend = () => {
      if (shouldRestartMicRef.current) {
        setTimeout(() => {
          if (shouldRestartMicRef.current && recognitionRef.current) {
            try { 
              recognitionRef.current.start() 
            } catch(err) { 
              console.warn("Mic reboot blocked by browser, resetting state:", err.message)
              setIsListening(false) 
            }
          }
        }, 50); // 50ms buffer prevents the "not-allowed" rapid-fire lock
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition
    try { recognition.start() } catch(e){}
  }, [supported, onTranscript, stopSpeaking])

  const stopListening = useCallback(() => {
    shouldRestartMicRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch(e){}
    }
    setIsListening(false)
  }, [])

  return {
    supported,
    isListening,
    isSpeaking,
    voiceGender,
    setVoiceGender,
    startListening,
    stopListening,
    speakToken,
    flushSpeakBuffer,
    stopSpeaking,
  }
}




// gemmini old
// // FILE: useVoice.js | PURPOSE: Continuous Gemini Live interaction backed by WebSockets & ElevenLabs Backend Streaming

// import { useState, useEffect, useRef, useCallback } from 'react'

// export function useVoice({ onTranscript, onSpeakingChange } = {}) {
//   const [isListening, setIsListening] = useState(false)
//   const [isSpeaking, setIsSpeaking] = useState(false)
//   const [voiceGender, setVoiceGender] = useState('female')
//   const [supported, setSupported] = useState(true)

//   const recognitionRef = useRef(null)
//   const wsRef = useRef(null)
//   const audioCtxRef = useRef(null)
//   const shouldRestartMicRef = useRef(false)

//   // Initialize secure WebSocket channel connection to Render backend
//   useEffect(() => {
//     const rawUrl = import.meta.env.VITE_API_URL || "https://onrender.com"
//     const wsUrl = rawUrl.replace('http', 'ws')
//     const ws = new WebSocket(`${wsUrl}/ws/voice`)
    
//     ws.onmessage = async (event) => {
//       const payload = JSON.parse(event.data)
      
//       if (payload.type === 'audio' && payload.data) {
//         setIsSpeaking(true)
//         onSpeakingChange?.(true)
        
//         // Transform the binary server packet array back into uncompressed audio streams
//         try {
//           if (!audioCtxRef.current) {
//             audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
//           }
//           const u8Array = new Uint8Array(payload.data)
//           const audioBuffer = await audioCtxRef.current.decodeAudioData(u8Array.buffer)
//           const source = audioCtxRef.current.createBufferSource()
//           source.buffer = audioBuffer
//           source.connect(audioCtxRef.current.destination)
//           source.start(0)
//         } catch(e) {
//           console.error("Audio buffer playback layout decode failure:", e)
//         }
//       }
      
//       if (payload.type === 'done') {
//         setIsSpeaking(false)
//         onSpeakingChange?.(false)
//       }
//     }

//     wsRef.current = ws
//     return () => ws.close()
//   }, [onSpeakingChange])

//   const stopSpeaking = useCallback(() => {
//     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify({ type: 'interrupt' }))
//     }
//     setIsSpeaking(false)
//     onSpeakingChange?.(false)
//   }, [onSpeakingChange])

//   const startListening = useCallback(() => {
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
//     if (!SpeechRecognition) return

//     const recognition = new SpeechRecognition()
//     recognition.continuous = true
//     recognition.interimResults = true
//     recognition.lang = 'en-US'
//     shouldRestartMicRef.current = true

//     recognition.onstart = () => setIsListening(true)
    
//     recognition.onresult = (e) => {
//       if (isSpeaking || window.speechSynthesis?.speaking) {
//         stopSpeaking()
//       }

//       const result = e.results[e.resultIndex]
//       if (result.isFinal) {
//         const transcript = result.transcript
//         if (transcript.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
//           wsRef.current.send(JSON.stringify({ type: 'text_input', text: transcript }))
//           onTranscript?.(transcript)
//         }
//       }
//     }

//     recognition.onend = () => {
//       if (shouldRestartMicRef.current) recognition.start()
//     }

//     recognitionRef.current = recognition
//     recognition.start()
//   }, [isSpeaking, onTranscript, stopSpeaking])

//   const stopListening = useCallback(() => {
//     shouldRestartMicRef.current = false
//     recognitionRef.current?.stop()
//     setIsListening(false)
//   }, [])

//   return {
//     supported: true, isListening, isSpeaking, voiceGender, setVoiceGender,
//     startListening, stopListening, stopSpeaking
//   }
// }







// //claude 
// // // FILE: useVoice.js | PURPOSE: STT + TTS via Web Speech API exclusively | CONNECTS TO: ChatInput.jsx, VoiceMode.jsx

// // import { useState, useEffect, useRef, useCallback } from 'react'

// // const SENTENCE_END = /[.?!,]/

// // export function useVoice({ onTranscript, onSpeakingChange } = {}) {
// //   const [isListening, setIsListening] = useState(false)
// //   const [isSpeaking, setIsSpeaking] = useState(false)
// //   const [voiceGender, setVoiceGender] = useState('female') // 'male' | 'female'
// //   const [supported, setSupported] = useState(false)
// //   const recognitionRef = useRef(null)
// //   const speakQueueRef = useRef([])
// //   const speakBufferRef = useRef('')
// //   const isSpeakingRef = useRef(false)

// //   useEffect(() => {
// //     const hasSpeech = 'speechSynthesis' in window
// //     const hasRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
// //     setSupported(hasSpeech && hasRecognition)

// //     return () => {
// //       window.speechSynthesis?.cancel()
// //       recognitionRef.current?.stop()
// //     }
// //   }, [])

// //   /** Pick best available voice for gender preference */
// //   const getVoice = useCallback((gender) => {
// //     const voices = window.speechSynthesis.getVoices()
// //     const enVoices = voices.filter((v) => v.lang.startsWith('en'))
// //     if (!enVoices.length) return null

// //     const genderKey = gender === 'female' ? ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'karen'] : ['male', 'man', 'david', 'daniel', 'mark', 'alex']
// //     const match = enVoices.find((v) => genderKey.some((k) => v.name.toLowerCase().includes(k)))
// //     return match ?? (gender === 'female' ? enVoices[0] : enVoices[1] ?? enVoices[0])
// //   }, [])

// //   /** Speak a single chunk */
// //   const speakChunk = useCallback((text) => {
// //     if (!text.trim()) return
// //     const utterance = new SpeechSynthesisUtterance(text.trim())
// //     utterance.voice = getVoice(voiceGender)
// //     utterance.rate = 1.0
// //     utterance.pitch = 1.0

// //     utterance.onstart = () => {
// //       isSpeakingRef.current = true
// //       setIsSpeaking(true)
// //       onSpeakingChange?.(true)
// //     }
// //     utterance.onend = () => {
// //       const next = speakQueueRef.current.shift()
// //       if (next) {
// //         speakChunk(next)
// //       } else {
// //         isSpeakingRef.current = false
// //         setIsSpeaking(false)
// //         onSpeakingChange?.(false)
// //       }
// //     }
// //     utterance.onerror = () => {
// //       isSpeakingRef.current = false
// //       setIsSpeaking(false)
// //     }

// //     window.speechSynthesis.speak(utterance)
// //   }, [getVoice, voiceGender, onSpeakingChange])

// //   /**
// //    * Buffer streaming tokens; speak immediately when a sentence boundary is hit.
// //    * This creates natural real-time conversation — don't wait for full response.
// //    */
// //   const speakToken = useCallback((token) => {
// //     speakBufferRef.current += token

// //     if (SENTENCE_END.test(token)) {
// //       const chunk = speakBufferRef.current
// //       speakBufferRef.current = ''
// //       if (isSpeakingRef.current) {
// //         speakQueueRef.current.push(chunk)
// //       } else {
// //         speakChunk(chunk)
// //       }
// //     }
// //   }, [speakChunk])

// //   /** Flush remaining buffer at end of stream */
// //   const flushSpeakBuffer = useCallback(() => {
// //     const remaining = speakBufferRef.current.trim()
// //     speakBufferRef.current = ''
// //     if (!remaining) return
// //     if (isSpeakingRef.current) {
// //       speakQueueRef.current.push(remaining)
// //     } else {
// //       speakChunk(remaining)
// //     }
// //   }, [speakChunk])

// //   /** Cancel all speech immediately */
// //   const stopSpeaking = useCallback(() => {
// //     window.speechSynthesis?.cancel()
// //     speakQueueRef.current = []
// //     speakBufferRef.current = ''
// //     isSpeakingRef.current = false
// //     setIsSpeaking(false)
// //     onSpeakingChange?.(false)
// //   }, [onSpeakingChange])

// //   /** Start speech recognition */
// //   const startListening = useCallback(() => {
// //     if (!supported || isListening) return
// //     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
// //     const recognition = new SpeechRecognition()
// //     recognition.continuous = false
// //     recognition.interimResults = false
// //     recognition.lang = 'en-US'

// //     recognition.onresult = (e) => {
// //       const transcript = e.results[0]?.[0]?.transcript ?? ''
// //       if (transcript) onTranscript?.(transcript)
// //     }

// //     recognition.onerror = (e) => {
// //       console.error('STT error:', e.error)
// //       setIsListening(false)
// //     }

// //     recognition.onend = () => setIsListening(false)

// //     recognitionRef.current = recognition
// //     recognition.start()
// //     setIsListening(true)
// //   }, [supported, isListening, onTranscript])

// //   const stopListening = useCallback(() => {
// //     recognitionRef.current?.stop()
// //     setIsListening(false)
// //   }, [])

// //   return {
// //     supported,
// //     isListening,
// //     isSpeaking,
// //     voiceGender,
// //     setVoiceGender,
// //     startListening,
// //     stopListening,
// //     speakToken,
// //     flushSpeakBuffer,
// //     stopSpeaking,
// //   }
// // }

// // // CHANGE THIS FILE IF YOU WANT TO: add ElevenLabs Pro TTS override, add language selection, tune voice rate/pitch
