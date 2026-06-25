// FILE: pages/ChatPage.jsx | PURPOSE: Full chat layout — wires together all chat components with Gemini Live interaction | CONNECTS TO: useChat.js, useVoice.js, ChatWindow.jsx, ChatInput.jsx, ChatSidebar.jsx, VoiceMode.jsx

import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useChat } from '../hooks/useChat.js'
import { useVoice } from '../hooks/useVoice.js'
import ChatWindow from '../components/chat/ChatWindow.jsx'
import ChatInput from '../components/chat/ChatInput.jsx'
import ChatSidebar from '../components/chat/ChatSidebar.jsx'
import VoiceMode from '../components/chat/VoiceMode.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export default function ChatPage() {
  const {
    messages, sessions, currentSessionId, isStreaming, streamingContent, error,
    quota, loadSessions, loadMessages, startNewSession, sendMessage, stopStreaming, loadQuota, deleteSession, setError,
  } = useChat()

  const { isDark, toggleTheme } = useTheme()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [voiceModeOpen, setVoiceModeOpen] = useState(false)

  // Maintain references to safely capture freshest state pointers
  const sendMessageRef = useRef(sendMessage)
  const voiceModeOpenRef = useRef(voiceModeOpen)

  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  useEffect(() => {
    voiceModeOpenRef.current = voiceModeOpen
  }, [voiceModeOpen])

  // Connect Gemini Live voice processing loop
  const voice = useVoice({
    onTranscript: (text) => {
      if (!text || !text.trim()) return
      if (sendMessageRef.current) {
        sendMessageRef.current(text, voiceModeOpenRef.current ? voice : null)
      }
    },
    // If user interrupts by talking, tell useChat to immediately kill the running backend stream
    onInterrupted: () => {
      if (typeof stopStreaming === 'function') {
        stopStreaming()
      }
    }
  })

  useEffect(() => {
    loadSessions()
    loadQuota()
  }, [])

  // Auto-start microphone whenever Gemini Live overlay is opened
  useEffect(() => {
    if (voiceModeOpen && voice.supported && !voice.isListening) {
      voice.startListening()
    }
  }, [voiceModeOpen, voice])

  const handleNewChat = async () => {
    if (voice && typeof voice.stopSpeaking === 'function') {
      voice.stopSpeaking()
    }
    await startNewSession()
  }

  const handleSelectSession = async (id) => {
    if (voice && typeof voice.stopSpeaking === 'function') {
      voice.stopSpeaking()
    }
    if (voice && typeof voice.stopListening === 'function') {
      try { voice.stopListening() } catch (e) {}
    }
    await loadMessages(id)
  }

  const handleVoiceToggle = () => {
    if (!voice.supported) return
    if (voice.isListening) {
      voice.stopListening()
    } else {
      if (voice.isSpeaking) {
        voice.stopSpeaking()
      }
      voice.startListening()
    }
  }

  const handleOpenVoiceMode = () => {
    setVoiceModeOpen(true)
  }

  const handleCloseVoiceMode = () => {
    voice.stopListening()
    voice.stopSpeaking()
    setVoiceModeOpen(false)
  }

  const handleBoxSubmit = (text) => {
    sendMessage(text, voiceModeOpen ? voice : null)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-[#121212]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-light-grey dark:border-[#2E2E2E] shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-serif text-lg font-semibold text-teal">NURO AI</Link>
          {quota && (
            <span className="hidden sm:inline text-xs text-graphite/50 dark:text-[#444]">
              {quota.remaining} messages remaining today
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {voice.supported && (
            <button
              onClick={handleOpenVoiceMode}
              className="w-8 h-8 flex items-center justify-center rounded-full text-graphite dark:text-[#A0A0A0] hover:bg-light-grey dark:hover:bg-[#2A2A2A] transition-colors"
              title="Voice mode"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full text-graphite dark:text-[#A0A0A0] hover:bg-light-grey dark:hover:bg-[#2A2A2A] transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? '☀' : '☾'}
          </button>
          <Link to="/dashboard" className="text-xs text-graphite dark:text-[#A0A0A0] hover:text-teal transition-colors">Dashboard</Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={deleteSession}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          {error && (
            <div className="mx-4 mt-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          <ChatWindow
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            showTyping={isStreaming && !streamingContent}
          />

          <ChatInput
            onSend={handleBoxSubmit}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            disabled={!!(quota && quota.remaining === 0)}
            voiceSupported={voice.supported}
            isListening={voice.isListening}
            onVoiceToggle={handleVoiceToggle}
          />
        </div>
      </div>

      {voiceModeOpen && (
        <VoiceMode
          isListening={voice.isListening}
          isSpeaking={voice.isSpeaking}
          voiceGender={voice.voiceGender}
          onGenderChange={voice.setVoiceGender}
          onClose={handleCloseVoiceMode}
          onToggleListen={handleVoiceToggle}
        />
      )}
    </div>
  )
}






// grmini wiithout live voice------------------=----------=====================================================================
// // FILE: pages/ChatPage.jsx | PURPOSE: Full chat layout — wires together all chat components | CONNECTS TO: useChat.js, useVoice.js, ChatWindow.jsx, ChatInput.jsx, ChatSidebar.jsx, VoiceMode.jsx

// import { useEffect, useState, useRef } from 'react'
// import { Link } from 'react-router-dom'
// import { useChat } from '../hooks/useChat.js'
// import { useVoice } from '../hooks/useVoice.js'
// import ChatWindow from '../components/chat/ChatWindow.jsx'
// import ChatInput from '../components/chat/ChatInput.jsx'
// import ChatSidebar from '../components/chat/ChatSidebar.jsx'
// import VoiceMode from '../components/chat/VoiceMode.jsx'
// import { useTheme } from '../context/ThemeContext.jsx'

// export default function ChatPage() {
//   const {
//     messages, sessions, currentSessionId, isStreaming, streamingContent, error,
//     quota, loadSessions, loadMessages, startNewSession, sendMessage, stopStreaming, loadQuota, deleteSession, setError,
//   } = useChat()

//   const { isDark, toggleTheme } = useTheme()
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
//   const [voiceModeOpen, setVoiceModeOpen] = useState(false)

//   // Maintain references to safely capture freshest state pointers
//   const sendMessageRef = useRef(sendMessage)
//   const voiceModeOpenRef = useRef(voiceModeOpen)

//   useEffect(() => {
//     sendMessageRef.current = sendMessage
//   }, [sendMessage])

//   useEffect(() => {
//     voiceModeOpenRef.current = voiceModeOpen
//   }, [voiceModeOpen])

//   // Initialize your web speech hook connection safely
//   const voice = useVoice({
//     onTranscript: (text) => {
//       if (!text || !text.trim()) return
//       if (sendMessageRef.current) {
//         sendMessageRef.current(text, voiceModeOpenRef.current ? voice : null)
//       }
//     },
//   })

//   useEffect(() => {
//     loadSessions()
//     loadQuota()
//   }, [])

//   const handleNewChat = async () => {
//     if (voice && typeof voice.stopSpeaking === 'function') {
//       voice.stopSpeaking()
//     }
//     await startNewSession()
//   }

//   const handleSelectSession = async (id) => {
//     if (voice && typeof voice.stopSpeaking === 'function') {
//       voice.stopSpeaking()
//     }
//     if (voice && typeof voice.stopListening === 'function') {
//       try { voice.stopListening() } catch (e) {}
//     }
//     await loadMessages(id)
//   }

//   const handleVoiceToggle = () => {
//     if (!voice.supported) return
//     if (voice.isListening) {
//       voice.stopListening()
//     } else {
//       if (voice.isSpeaking) {
//         voice.stopSpeaking()
//       }
//       voice.startListening()
//     }
//   }

//   const handleOpenVoiceMode = () => {
//     setVoiceModeOpen(true)
//   }

//   const handleCloseVoiceMode = () => {
//     voice.stopListening()
//     voice.stopSpeaking()
//     setVoiceModeOpen(false)
//   }

//   const handleBoxSubmit = (text) => {
//     sendMessage(text, voiceModeOpen ? voice : null)
//   }

//   return (
//     <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-[#121212]">
//       {/* Top bar */}
//       <header className="flex items-center justify-between px-4 py-3 border-b border-light-grey dark:border-[#2E2E2E] shrink-0">
//         <div className="flex items-center gap-3">
//           <Link to="/" className="font-serif text-lg font-semibold text-teal">NURO AI</Link>
//           {quota && (
//             <span className="hidden sm:inline text-xs text-graphite/50 dark:text-[#444]">
//               {quota.remaining} messages remaining today
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-2">
//           {voice.supported && (
//             <button
//               onClick={handleOpenVoiceMode}
//               className="w-8 h-8 flex items-center justify-center rounded-full text-graphite dark:text-[#A0A0A0] hover:bg-light-grey dark:hover:bg-[#2A2A2A] transition-colors"
//               title="Voice mode"
//             >
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round"/>
//                 <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round"/>
//               </svg>
//             </button>
//           )}
//           <button
//             onClick={toggleTheme}
//             className="w-8 h-8 flex items-center justify-center rounded-full text-graphite dark:text-[#A0A0A0] hover:bg-light-grey dark:hover:bg-[#2A2A2A] transition-colors"
//             aria-label="Toggle theme"
//           >
//             {isDark ? '☀' : '☾'}
//           </button>
//           <Link to="/dashboard" className="text-xs text-graphite dark:text-[#A0A0A0] hover:text-teal transition-colors">Dashboard</Link>
//         </div>
//       </header>

//       {/* Body */}
//       <div className="flex flex-1 overflow-hidden">
//         <ChatSidebar
//           sessions={sessions}
//           currentSessionId={currentSessionId}
//           onSelectSession={handleSelectSession}
//           onNewChat={handleNewChat}
//           onDeleteSession={deleteSession}
//           collapsed={sidebarCollapsed}
//           onToggle={() => setSidebarCollapsed((c) => !c)}
//         />

//         <div className="flex flex-col flex-1 overflow-hidden">
//           {error && (
//             <div className="mx-4 mt-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center justify-between">
//               <span>{error}</span>
//               <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-600">✕</button>
//             </div>
//           )}

//           <ChatWindow
//             messages={messages}
//             isStreaming={isStreaming}
//             streamingContent={streamingContent}
//             showTyping={isStreaming && !streamingContent}
//           />

//           <ChatInput
//             onSend={handleBoxSubmit}
//             onStop={stopStreaming}
//             isStreaming={isStreaming}
//             disabled={!!(quota && quota.remaining === 0)}
//             voiceSupported={voice.supported}
//             isListening={voice.isListening}
//             onVoiceToggle={handleVoiceToggle}
//           />
//         </div>
//       </div>

//       {voiceModeOpen && (
//         <VoiceMode
//           isListening={voice.isListening}
//           isSpeaking={voice.isSpeaking}
//           voiceGender={voice.voiceGender}
//           onGenderChange={voice.setVoiceGender}
//           onClose={handleCloseVoiceMode}
//           onToggleListen={handleVoiceToggle}
//         />
//       )}
//     </div>
//   )
// }



