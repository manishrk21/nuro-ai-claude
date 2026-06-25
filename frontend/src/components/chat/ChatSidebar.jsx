// FILE: chat/ChatSidebar.jsx | PURPOSE: Past sessions list, new chat button | CONNECTS TO: ChatPage.jsx, useChat.js

import { formatters } from '../../utils/formatters.js'

export default function ChatSidebar({ sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession, collapsed, onToggle }) {
  return (
    <aside className={`flex flex-col border-r border-light-grey dark:border-[#2E2E2E] bg-cream dark:bg-[#1A1A1A] transition-all duration-300 ${collapsed ? 'w-14' : 'w-60'} shrink-0 h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-light-grey dark:border-[#2E2E2E]">
        {!collapsed && (
          <span className="font-serif text-sm font-semibold text-brand-black dark:text-white">Conversations</span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-graphite hover:bg-light-grey dark:text-[#A0A0A0] dark:hover:bg-[#2A2A2A] transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed
              ? <path d="M9 18l6-6-6-6" />
              : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 py-3">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-teal text-white text-sm font-medium hover:bg-teal-600 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {!collapsed && <span>New chat</span>}
        </button>
      </div>

      {/* Sessions list */}
      {!collapsed && (
        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {sessions.length === 0 && (
            <p className="text-xs text-graphite/50 dark:text-[#555] text-center mt-6 px-2">No conversations yet</p>
          )}
          {sessions.map((session) => (
            <div key={session.id} className="group relative">
              <button
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-teal/10 text-teal dark:bg-teal/10 dark:text-teal'
                    : 'text-graphite hover:bg-light-grey dark:text-[#A0A0A0] dark:hover:bg-[#2A2A2A]'
                }`}
              >
                <p className="font-medium truncate">{session.title || 'Conversation'}</p>
                <p className="text-xs opacity-60 mt-0.5">{formatters.relative(session.updated_at)}</p>
              </button>
              <button
                onClick={() => onDeleteSession(session.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-graphite/40 hover:text-red-400 transition-all"
                aria-label="Delete session"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          ))}
        </nav>
      )}
    </aside>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add session search, add pinned sessions, change date format
