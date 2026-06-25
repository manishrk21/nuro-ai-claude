// FILE: booking/TimeSlotPicker.jsx | PURPOSE: Calendar + time slot selector | CONNECTS TO: BookingModal.jsx

import { useState } from 'react'
import { formatters } from '../../utils/formatters.js'

const TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

export default function TimeSlotPicker({ onSlotSelect, selectedSlot }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const monthName = new Date(viewYear, viewMonth).toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const handleDateClick = (day) => {
    const d = new Date(viewYear, viewMonth, day)
    if (d < new Date(today.setHours(0, 0, 0, 0))) return // no past dates
    setSelectedDate(d)
    setSelectedTime(null)
  }

  const handleTimeClick = (time) => {
    setSelectedTime(time)
    if (selectedDate) {
      const [h, m] = time.split(':')
      const dt = new Date(selectedDate)
      dt.setHours(parseInt(h), parseInt(m))
      onSlotSelect(dt.toISOString())
    }
  }

  const isToday = (day) => {
    const d = new Date(viewYear, viewMonth, day)
    const t = new Date()
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
  }

  const isPast = (day) => {
    const d = new Date(viewYear, viewMonth, day)
    const t = new Date(); t.setHours(0, 0, 0, 0)
    return d < t
  }

  const isSelected = (day) => {
    if (!selectedDate) return false
    return selectedDate.getDate() === day && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-light-grey dark:hover:bg-[#2A2A2A] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="text-sm font-semibold text-brand-black dark:text-white">{monthName}</span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-light-grey dark:hover:bg-[#2A2A2A] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
            <div key={d} className="text-xs text-graphite/50 dark:text-[#555] py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isPast(day)}
              className={`aspect-square rounded-lg text-sm font-medium transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${
                isSelected(day)
                  ? 'bg-teal text-white'
                  : isToday(day)
                  ? 'border border-teal text-teal'
                  : 'hover:bg-light-grey dark:hover:bg-[#2A2A2A] text-brand-black dark:text-[#F5F5F5]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <p className="text-xs font-medium text-graphite dark:text-[#A0A0A0] mb-2 uppercase tracking-wide">
            Available times — {formatters.date(selectedDate)}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TIMES.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeClick(time)}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selectedTime === time
                    ? 'bg-teal border-teal text-white'
                    : 'border-light-grey dark:border-[#2E2E2E] text-brand-black dark:text-[#F5F5F5] hover:border-teal/50'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: fetch real availability from backend, add timezone support, add duration selection
