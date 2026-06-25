// FILE: chat/TypingIndicator.jsx | PURPOSE: Animated three-dot typing indicator | CONNECTS TO: ChatWindow.jsx

import BotAvatar from './BotAvatar.jsx'

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 bubble-enter">
      <BotAvatar size="sm" />
      <div className="bg-cream dark:bg-[#2A2A2A] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="typing-dot w-1.5 h-1.5 bg-graphite/50 dark:bg-[#666] rounded-full" />
        <span className="typing-dot w-1.5 h-1.5 bg-graphite/50 dark:bg-[#666] rounded-full" />
        <span className="typing-dot w-1.5 h-1.5 bg-graphite/50 dark:bg-[#666] rounded-full" />
      </div>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: change dot color, add "NURO is thinking…" text
