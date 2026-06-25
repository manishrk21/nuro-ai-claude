// FILE: chat/BotAvatar.jsx | PURPOSE: Animated NURO avatar with pulse ring | CONNECTS TO: ChatWindow.jsx, TypingIndicator.jsx

export default function BotAvatar({ size = 'sm' }) {
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' }
  return (
    <div className={`relative shrink-0 ${sizeMap[size]}`}>
      <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-teal to-teal-700 flex items-center justify-center avatar-pulse`}>
        <span className="font-serif font-semibold text-white">N</span>
      </div>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: replace with logo image, change pulse color, add status indicator
