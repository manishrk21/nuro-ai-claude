// FILE: pages/TherapistProfileEditPage.jsx | PURPOSE: Therapist profile editor (save-only) | CONNECTS TO: AuthContext.jsx, supabase

import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext.jsx'
import { supabase } from '../services/supabaseClient.js'

const SPECIALIZATIONS = [
  'Anxiety', 'Depression', 'Trauma & PTSD', 'CBT', 'Relationships',
  'Grief & Loss', 'Adolescents', 'Mindfulness', 'Career & Burnout',
  'Addiction', 'Bipolar Disorder', 'OCD', 'Eating Disorders',
  'ADHD', 'Family Therapy', 'Couples Therapy', 'Sleep Issues',
]

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi']

const INITIAL_FORM = {
  name: '',
  bio: '',
  photoFile: null,
  photoUrl: null,
  languages: ['English'],
  fee: '',
  specializations: [],
  yearsExp: '',
}

function TogglePillList({ label, items, value, onToggle }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">{label}</label>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              value.includes(item)
                ? 'bg-teal border-teal text-white'
                : 'border-light-grey dark:border-[#2E2E2E] text-graphite dark:text-[#A0A0A0] hover:border-teal/40'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TherapistProfileEditPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const photoRef = useRef()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      setLoading(true)
      try {
        const { data, error: fetchError } = await supabase
          .from('therapists')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError
        if (!data) return

        setForm({
          name: data.name ?? '',
          bio: data.bio ?? '',
          photoFile: null,
          photoUrl: data.photo_url ?? null,
          languages: data.languages?.length ? data.languages : ['English'],
          fee: data.fee_per_session?.toString?.() ?? '',
          specializations: data.specializations ?? [],
          yearsExp: data.years_experience?.toString?.() ?? '',
        })
        setPhotoPreview(data.photo_url ?? null)
      } catch (err) {
        console.error('Failed to load therapist profile:', err)
        setError('Could not load your profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  const handlePhoto = (file) => {
    if (!file) return
    setForm((prev) => ({ ...prev, photoFile: file }))
    setPhotoPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.'
    if (!form.bio.trim()) return 'Short bio is required.'
    if (form.bio.length > 300) return 'Short bio must be 300 characters or less.'
    if (form.languages.length === 0) return 'Select at least one language.'
    if (!form.fee || Number.isNaN(Number(form.fee)) || Number(form.fee) < 0) return 'Enter a valid fee.'
    if (form.specializations.length === 0) return 'Select at least one area of specialisation.'
    if (!form.yearsExp || Number.isNaN(Number(form.yearsExp))) return 'Enter years of experience.'
    return null
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      let photoUrl = form.photoUrl

      if (form.photoFile) {
        const ext = form.photoFile.name.split('.').pop()?.toLowerCase() || 'png'
        const path = `${user.id}/photo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(path, form.photoFile, {
            upsert: true,
            contentType: form.photoFile.type || 'image/png',
            cacheControl: '3600',
          })

        if (!uploadError) {
          const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
          photoUrl = data.publicUrl
        }
      }

      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        bio: form.bio.trim(),
        photo_url: photoUrl,
        specializations: form.specializations,
        years_experience: parseInt(form.yearsExp, 10),
        languages: form.languages,
        fee_per_session: parseFloat(form.fee),
      }

      const { data: existingTherapist, error: lookupError } = await supabase
        .from('therapists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (lookupError) throw lookupError

      const writeQuery = existingTherapist
        ? supabase.from('therapists').update(payload).eq('user_id', user.id)
        : supabase.from('therapists').insert(payload)

      const { error: saveError } = await writeQuery

      if (saveError) throw saveError
      navigate('/dashboard/therapist')
    } catch (err) {
      console.error('Therapist profile save error:', err)
      setError('Could not save your profile changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-serif text-xl font-semibold text-teal">NURO AI</span>
            <Link to="/dashboard/therapist" className="text-xs text-graphite dark:text-[#A0A0A0] hover:text-teal">
              Back to dashboard
            </Link>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-black dark:text-white">Edit profile</h1>
            <p className="text-sm text-graphite dark:text-[#A0A0A0] mt-1">Save your profile updates directly. Credential fields are not editable here.</p>
          </div>
        </div>

        <div className="card p-7 space-y-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal/20 to-teal/5 dark:from-teal/20 dark:to-teal/5 border-2 border-dashed border-teal/30 flex items-center justify-center overflow-hidden hover:border-teal/60 transition-colors shrink-0"
            >
              {photoPreview
                ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3D9E8C" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              }
            </button>
            <input ref={photoRef} type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files?.[0])} className="hidden" />
            <div>
              <p className="text-sm font-medium text-brand-black dark:text-white">Profile photo</p>
              <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-0.5">Clear headshot, square preferred</p>
              <button type="button" onClick={() => photoRef.current?.click()} className="text-xs text-teal underline mt-1">
                {photoPreview ? 'Change photo' : 'Upload photo'}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="Dr. Priya Menon"
              className="input-base"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Short bio</label>
              <span className={`text-xs ${form.bio.length > 280 ? 'text-red-400' : 'text-graphite/40 dark:text-[#444]'}`}>
                {form.bio.length}/300
              </span>
            </div>
            <textarea
              value={form.bio}
              onChange={(e) => onChange('bio', e.target.value)}
              rows={4}
              maxLength={300}
              className="input-base resize-none"
            />
          </div>

          <TogglePillList
            label="Languages spoken"
            items={LANGUAGES}
            value={form.languages}
            onToggle={(lang) => {
              const current = form.languages
              onChange('languages', current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang])
            }}
          />

          <div className="space-y-1">
            <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Fee per session (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-graphite dark:text-[#A0A0A0]">₹</span>
              <input
                type="number"
                value={form.fee}
                onChange={(e) => onChange('fee', e.target.value)}
                min="0"
                className="input-base pl-8"
              />
            </div>
          </div>

          <TogglePillList
            label="Areas of specialisation"
            items={SPECIALIZATIONS}
            value={form.specializations}
            onToggle={(s) => {
              const current = form.specializations
              onChange('specializations', current.includes(s) ? current.filter((x) => x !== s) : [...current, s])
            }}
          />

          <div className="space-y-1">
            <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Years of experience</label>
            <input
              type="number"
              value={form.yearsExp}
              onChange={(e) => onChange('yearsExp', e.target.value)}
              min="0"
              max="50"
              className="input-base"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link to="/dashboard/therapist" className="btn-outline py-3 px-5 text-center">
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-primary py-3 text-base disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
