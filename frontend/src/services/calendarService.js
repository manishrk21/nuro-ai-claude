// FILE: calendarService.js | PURPOSE: Builds Google Calendar deep-link URL (no OAuth needed) | CONNECTS TO: BookingModal.jsx

export const calendarService = {
  /**
   * Build a Google Calendar "Add Event" deep link
   * No OAuth or API keys needed — opens in browser tab
   */
  buildGoogleCalendarLink({ title, startDate, endDate, description, location }) {
    const fmt = (d) =>
      new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${fmt(startDate)}/${fmt(endDate)}`,
      details: description ?? '',
      location: location ?? '',
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  },

  /** Generate a placeholder Google Meet link */
  generateMeetLink() {
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    const seg = (n) =>
      Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`
  },
}

// CHANGE THIS FILE IF YOU WANT TO: add Zoom link generation, add iCal export, add real Google Calendar OAuth
