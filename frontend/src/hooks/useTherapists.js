// FILE: useTherapists.js | PURPOSE: Therapist listing and filter state | CONNECTS TO: therapistService.js, TherapistsPage.jsx

import { useState, useEffect, useCallback } from 'react'
import { therapistService } from '../services/therapistService.js'

export function useTherapists() {
  const [therapists, setTherapists] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    specialization: '',
    language: '',
    feeMax: '',
    availableOnly: false,
    search: '',
  })

  const fetchTherapists = useCallback(async (f = filters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await therapistService.listTherapists(f)
      setTherapists(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTherapists(filters)
  }, [filters]) // eslint-disable-line

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({ specialization: '', language: '', feeMax: '', availableOnly: false, search: '' })
  }

  return { therapists, loading, error, filters, updateFilter, resetFilters, refetch: fetchTherapists }
}

// CHANGE THIS FILE IF YOU WANT TO: add pagination, add sorting, add favorites filter
