// FILE: chat/VoiceMode.jsx | PURPOSE: Live voice conversation UI overlay | CONNECTS TO: ChatPage.jsx, useVoice.js

export default function VoiceMode({ isListening, isSpeaking, voiceGender, onGenderChange, onClose, onToggleListen }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 text-white text-center px-6">
        {/* Animated orb */}
        <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-teal to-teal-700 flex items-center justify-center transition-transform duration-300 ${isSpeaking ? 'scale-110' : isListening ? 'scale-105' : 'scale-100'}`}>
          <div className={`absolute inset-0 rounded-full bg-teal/30 ${(isListening || isSpeaking) ? 'animate-ping' : ''}`} style={{ animationDuration: '1.5s' }} />
          <span className="font-serif text-4xl font-semibold text-white relative z-10">N</span>
        </div>

        {/* Status */}
        <div>
          <p className="text-lg font-medium">
            {isSpeaking ? 'NURO is speaking…' : isListening ? 'Listening…' : 'Tap to speak'}
          </p>
          <p className="text-sm text-white/50 mt-1">Voice conversation mode</p>
        </div>

        {/* Voice gender picker */}
        <div className="flex gap-2">
          {['female', 'male'].map((g) => (
            <button
              key={g}
              onClick={() => onGenderChange(g)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                voiceGender === g
                  ? 'bg-teal border-teal text-white'
                  : 'border-white/20 text-white/60 hover:border-white/50'
              }`}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)} voice
            </button>
          ))}
        </div>

        {/* Mic button */}
        <button
          onClick={onToggleListen}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isListening ? 'bg-red-500 scale-110' : 'bg-white/10 hover:bg-white/20 border border-white/20'
          }`}
          aria-label={isListening ? 'Stop' : 'Speak'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={isListening ? 'white' : 'white'} stroke="none">
            {isListening
              ? <rect x="7" y="7" width="10" height="10" rx="1"/>
              : <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            }
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="text-sm text-white/50 hover:text-white underline transition-colors"
        >
          Exit voice mode
        </button>
      </div>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add waveform visualizer, add voice transcript display
