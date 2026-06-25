// FILE: chat/ChatInput.jsx | PURPOSE: Text input, send, voice toggle, stop button | CONNECTS TO: ChatPage.jsx, useChat.js, useVoice.js

import { useState, useRef, useCallback } from 'react'

export default function ChatInput({ onSend, onStop, isStreaming, disabled, voiceSupported, isListening, onVoiceToggle }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, isStreaming, disabled, onSend])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    setText(e.target.value)
    // auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <div className="border-t border-light-grey dark:border-[#2E2E2E] bg-white dark:bg-[#121212] px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-cream dark:bg-[#1E1E1E] rounded-2xl border border-light-grey dark:border-[#2E2E2E] px-4 py-2 focus-within:border-teal/50 transition-colors">
          {/* Voice button */}
          {voiceSupported && (
            <button
              onClick={onVoiceToggle}
              disabled={isStreaming}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              className={`shrink-0 mb-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-graphite/50 hover:text-teal dark:text-[#555] dark:hover:text-teal'
              } disabled:opacity-30`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isListening ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening…' : "What's on your mind?"}
            disabled={disabled || isListening}
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm text-brand-black dark:text-[#F5F5F5] placeholder-graphite/40 dark:placeholder-[#444] outline-none py-1.5 min-h-[36px] max-h-[160px] leading-relaxed"
          />

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              onClick={onStop}
              aria-label="Stop response"
              className="shrink-0 mb-1.5 w-8 h-8 rounded-full bg-graphite/10 dark:bg-[#2A2A2A] flex items-center justify-center text-graphite dark:text-[#A0A0A0] hover:bg-graphite/20 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              aria-label="Send message"
              className="shrink-0 mb-1.5 w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white hover:bg-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
        <p className="text-center text-[11px] text-graphite/30 dark:text-[#444] mt-2">
          NURO is not a licensed therapist. For emergencies call 112.
        </p>
      </div>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add file attachment, add emoji picker, change max input height
