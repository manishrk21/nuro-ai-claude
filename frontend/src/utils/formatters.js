// FILE: utils/formatters.js | PURPOSE: Date, currency, and text formatters | CONNECTS TO: All components needing display formatting

export const formatters = {
  /** Format a date as "Mon DD, YYYY" */
  date(iso) {
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  },

  /** Format a datetime as "Mon DD at HH:MM AM/PM" */
  datetime(iso) {
    return new Date(iso).toLocaleString('en-IN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  },

  /** Relative time: "2 minutes ago" */
  relative(iso) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  },

  /** Format currency in INR */
  currency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(amount)
  },

  /** Truncate text with ellipsis */
  truncate(text, max = 100) {
    if (!text) return ''
    return text.length > max ? text.slice(0, max) + '…' : text
  },

  /** Get initials from name */
  initials(name = '') {
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  },

  /** Format time as HH:MM AM/PM */
  time(iso) {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    })
  },
}

// CHANGE THIS FILE IF YOU WANT TO: add new locale, change currency default, add number formatting
