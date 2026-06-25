// FILE: booking/AvailabilityBadge.jsx | PURPOSE: Green/grey availability dot | CONNECTS TO: TherapistCard.jsx, TherapistProfilePage.jsx

export default function AvailabilityBadge({ available, showLabel = true }) {
  return (
    <span className="inline-flex items-center gap-1.5 mt-1">
      <span className={`w-2 h-2 rounded-full shrink-0 ${available ? 'bg-emerald-400' : 'bg-graphite/30 dark:bg-[#444]'}`} />
      {showLabel && (
        <span className={`text-xs ${available ? 'text-emerald-600 dark:text-emerald-400' : 'text-graphite/50 dark:text-[#555]'}`}>
          {available ? 'Available' : 'Not available'}
        </span>
      )}
    </span>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add "Next available" date, add "Limited slots" warning
