// FILE: useBooking.js | PURPOSE: Booking flow state and API calls | CONNECTS TO: bookingService.js, BookingModal.jsx

import { useState, useCallback } from 'react'
import { bookingService } from '../services/bookingService.js'

export function useBooking() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await bookingService.getMyBookings()
      setBookings(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createBooking = useCallback(async (therapistId, proposedSlots) => {
    setLoading(true)
    setError(null)
    try {
      const booking = await bookingService.createBooking(therapistId, proposedSlots)
      setBookings((prev) => [booking, ...prev])
      return booking
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const acceptBooking = useCallback(async (bookingId) => {
    try {
      const updated = await bookingService.acceptBooking(bookingId)
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)))
      return updated
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const rejectBooking = useCallback(async (bookingId) => {
    try {
      await bookingService.rejectBooking(bookingId)
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected' } : b)))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const completeBooking = useCallback(async (bookingId) => {
    try {
      const result = await bookingService.completeBooking(bookingId)
      const updated = result && result.booking ? result.booking : result
      if (!updated) {
        setError("Failed to complete booking")
        return null
      }
      await fetchBookings()
      return updated
    } catch (err) {
      const errorMsg = err.message || "Failed to complete booking"
      setError(errorMsg)
      console.error("completeBooking error:", errorMsg)
      return null
    }
  }, [fetchBookings])

  const cancelBooking = useCallback(async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId)
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    createBooking,
    acceptBooking,
    rejectBooking,
    completeBooking,
    cancelBooking,
    setError,
  }
}

// CHANGE THIS FILE IF YOU WANT TO: add rescheduling, add payment flow, add cancellation policy


// // FILE: useBooking.js | PURPOSE: Booking flow state and API calls | CONNECTS TO: bookingService.js, BookingModal.jsx

// import { useState, useCallback } from 'react'
// import { bookingService } from '../services/bookingService.js'

// export function useBooking() {
//   const [bookings, setBookings] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)

//   const fetchBookings = useCallback(async () => {
//     setLoading(true)
//     try {
//       const data = await bookingService.getMyBookings()
//       setBookings(data)
//     } catch (err) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   const createBooking = useCallback(async (therapistId, proposedSlots) => {
//     setLoading(true)
//     setError(null)
//     try {
//       const booking = await bookingService.createBooking(therapistId, proposedSlots)
//       setBookings((prev) => [booking, ...prev])
//       return booking
//     } catch (err) {
//       setError(err.message)
//       return null
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   const acceptBooking = useCallback(async (bookingId) => {
//     try {
//       const updated = await bookingService.acceptBooking(bookingId)
//       setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)))
//       return updated
//     } catch (err) {
//       setError(err.message)
//       return null
//     }
//   }, [])

//   const rejectBooking = useCallback(async (bookingId) => {
//     try {
//       await bookingService.rejectBooking(bookingId)
//       setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected' } : b)))
//     } catch (err) {
//       setError(err.message)
//     }
//   }, [])

//   const completeBooking = useCallback(async (bookingId) => {
//     try {
//       const result = await bookingService.completeBooking(bookingId)
//       const updated = result && result.booking ? result.booking : result
//       if (!updated) {
//         await fetchBookings()
//         return null
//       }
//       await fetchBookings()
//       return updated
//     } catch (err) {
//       setError(err.message)
//       return null
//     }
//   }, [fetchBookings])

//   const cancelBooking = useCallback(async (bookingId) => {
//     try {
//       await bookingService.cancelBooking(bookingId)
//       setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)))
//     } catch (err) {
//       setError(err.message)
//     }
//   }, [])

//   return {
//     bookings,
//     loading,
//     error,
//     fetchBookings,
//     createBooking,
//     acceptBooking,
//     rejectBooking,
//     completeBooking,
//     cancelBooking,
//     setError,
//   }
// }

// // CHANGE THIS FILE IF YOU WANT TO: add rescheduling, add payment flow, add cancellation policy
