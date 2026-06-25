
// FILE: chat/ChatWindow.jsx | PURPOSE: Message thread display with streaming support | CONNECTS TO: ChatPage.jsx, useChat.js

import { useEffect, useRef } from 'react'
import BotAvatar from './BotAvatar.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import { formatters } from '../../utils/formatters.js'

function MessageBubble({ message, onCopy }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex items-end gap-2 bubble-enter ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && <BotAvatar size="sm" />}
      <div className={`group relative max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-black dark:bg-[#F5F5F5] text-white dark:text-brand-black rounded-br-sm'
            : 'bg-cream dark:bg-[#2A2A2A] text-brand-black dark:text-[#F5F5F5] rounded-bl-sm'
        }`}>
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-graphite/40 dark:text-[#555]">
            {formatters.time(message.created_at)}
          </span>
          <button
            onClick={() => onCopy(message.content)}
            className="opacity-0 group-hover:opacity-100 text-[11px] text-graphite/40 hover:text-graphite dark:text-[#555] dark:hover:text-[#A0A0A0] transition-all"
            aria-label="Copy message"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}

function StreamingBubble({ content }) {
  return (
    <div className="flex items-end gap-2 bubble-enter">
      <BotAvatar size="sm" />
      <div className="max-w-[78%] bg-cream dark:bg-[#2A2A2A] rounded-2xl rounded-bl-sm px-4 py-3">
        <p className="text-sm leading-relaxed text-brand-black dark:text-[#F5F5F5] whitespace-pre-wrap break-words">
          {content}
          <span className="inline-block w-1.5 h-4 bg-teal ml-0.5 animate-pulse rounded-sm" />
        </p>
      </div>
    </div>
  )
}

export default function ChatWindow({ messages, isStreaming, streamingContent, showTyping }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, showTyping])

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  const isEmpty = messages.length === 0 && !isStreaming && !showTyping

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {isEmpty && (
        <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20">
          <BotAvatar size="lg" />
          <div>
            <h3 className="font-serif text-xl font-medium text-brand-black dark:text-white mb-1">
              Hi, I'm NURO
            </h3>
            <p className="text-sm text-graphite dark:text-[#A0A0A0] max-w-xs">
              A safe space to talk through whatever's on your mind. What's going on for you today?
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {["I've been feeling anxious", "I need to vent", "Help me with my sleep"].map((prompt) => (
              <span key={prompt} className="text-xs px-3 py-1.5 rounded-full border border-light-grey dark:border-[#2E2E2E] text-graphite dark:text-[#A0A0A0] cursor-default">
                {prompt}
              </span>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onCopy={handleCopy} />
      ))}

      {showTyping && !streamingContent && <TypingIndicator />}
      {streamingContent && <StreamingBubble content={streamingContent} />}

      <div ref={bottomRef} />
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add message reactions, add image support, add markdown rendering
