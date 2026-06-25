// FILE: booking/TherapistCard.jsx | PURPOSE: Card in therapist listing grid | CONNECTS TO: TherapistsPage.jsx

import { Link } from 'react-router-dom'
import AvailabilityBadge from './AvailabilityBadge.jsx'
import { formatters } from '../../utils/formatters.js'

export default function TherapistCard({ therapist, onBook }) {
  const { id, name, photo_url, specializations = [], fee_per_session, available, verified_status, years_experience } = therapist

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-100 to-teal/30 dark:from-teal/20 dark:to-teal/10 flex items-center justify-center shrink-0 overflow-hidden">
          {photo_url ? (
            <img src={photo_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-semibold text-teal text-lg">{formatters.initials(name)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-brand-black dark:text-white truncate">{name}</h3>
            {verified_status === 'verified' && (
              <span title="Verified therapist" className="shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#3D9E8C"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              </span>
            )}
          </div>
          <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-0.5">{years_experience} yrs experience</p>
          <AvailabilityBadge available={available} />
        </div>
      </div>

      {/* Specializations */}
      <div className="flex flex-wrap gap-1.5">
        {specializations.slice(0, 3).map((s) => (
          <span key={s} className="text-xs px-2.5 py-1 bg-teal/8 dark:bg-teal/10 text-teal rounded-full">{s}</span>
        ))}
        {specializations.length > 3 && (
          <span className="text-xs px-2.5 py-1 bg-light-grey dark:bg-[#2A2A2A] text-graphite dark:text-[#A0A0A0] rounded-full">+{specializations.length - 3} more</span>
        )}
      </div>

      {/* Fee */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-black dark:text-white">
          {formatters.currency(fee_per_session)}<span className="text-xs font-normal text-graphite dark:text-[#A0A0A0]">/session</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link
          to={`/therapists/${id}`}
          className="flex-1 btn-outline text-xs py-2 text-center"
        >
          View Profile
        </Link>
        <button
          onClick={() => onBook(therapist)}
          disabled={!available}
          className="flex-1 btn-primary text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Book Session
        </button>
      </div>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add star rating display, add saved/heart button, add video intro
