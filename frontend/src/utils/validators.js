// FILE: utils/validators.js | PURPOSE: Form validation helpers | CONNECTS TO: AuthPage.jsx, OnboardingPage.jsx

export const validators = {
  email(value) {
    if (!value) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
    return null
  },

  password(value) {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    return null
  },

  age(value) {
    const n = parseInt(value, 10)
    if (!value) return 'Age is required'
    if (isNaN(n) || n < 13 || n > 99) return 'Age must be between 13 and 99'
    return null
  },

  required(value, label = 'This field') {
    if (!value || (typeof value === 'string' && !value.trim())) return `${label} is required`
    return null
  },

  bioLength(value) {
    if (value && value.length > 300) return `Bio must be under 300 characters (${value.length}/300)`
    return null
  },

  feeAmount(value) {
    const n = parseFloat(value)
    if (!value) return 'Fee is required'
    if (isNaN(n) || n < 0) return 'Enter a valid fee amount'
    return null
  },
}

// CHANGE THIS FILE IF YOU WANT TO: add phone validation, add postal code validation, add custom regex rules
