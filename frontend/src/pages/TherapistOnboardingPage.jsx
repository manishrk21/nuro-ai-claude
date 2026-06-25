// FILE: pages/TherapistOnboardingPage.jsx | PURPOSE: Therapist profile setup — license, specializations, photo, docs upload | CONNECTS TO: authService.js, supabase storage, AuthContext.jsx

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { supabase } from '../services/supabaseClient.js'
import { validators } from '../utils/validators.js'

const SPECIALIZATIONS = [
  'Anxiety', 'Depression', 'Trauma & PTSD', 'CBT', 'Relationships',
  'Grief & Loss', 'Adolescents', 'Mindfulness', 'Career & Burnout',
  'Addiction', 'Bipolar Disorder', 'OCD', 'Eating Disorders',
  'ADHD', 'Family Therapy', 'Couples Therapy', 'Sleep Issues',
]

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi']

const LICENSE_TYPES = [
  'RCI Licensed Clinical Psychologist',
  'MCI Registered Psychiatrist',
  'Counselling Psychologist (M.Phil)',
  'Certified Counsellor (REBT/CBT)',
  'Licensed Marriage & Family Therapist',
  'Other',
]

const STEPS = ['Your details', 'Specializations', 'Credentials', 'Submit']

// ── Step components ──────────────────────────────────────────────────────────

function StepDetails({ form, onChange, errors }) {
  const photoRef = useRef()
  const [photoPreview, setPhotoPreview] = useState(null)

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    onChange('photoFile', file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  return (
    <div className="space-y-5">
      {/* Photo upload */}
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
        <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        <div>
          <p className="text-sm font-medium text-brand-black dark:text-white">Profile photo</p>
          <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-0.5">Clear headshot, square preferred</p>
          <button type="button" onClick={() => photoRef.current?.click()} className="text-xs text-teal underline mt-1">
            {photoPreview ? 'Change photo' : 'Upload photo'}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Full name (as on license) *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Dr. Priya Menon"
          className={`input-base ${errors.name ? 'ring-2 ring-red-400' : ''}`}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      {/* Bio */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Short bio *</label>
          <span className={`text-xs ${form.bio.length > 280 ? 'text-red-400' : 'text-graphite/40 dark:text-[#444]'}`}>
            {form.bio.length}/300
          </span>
        </div>
        <textarea
          value={form.bio}
          onChange={(e) => onChange('bio', e.target.value)}
          placeholder="A warm, evidence-based therapist with 8 years specialising in anxiety and relationships…"
          rows={4}
          maxLength={300}
          className={`input-base resize-none ${errors.bio ? 'ring-2 ring-red-400' : ''}`}
        />
        {errors.bio && <p className="text-xs text-red-500">{errors.bio}</p>}
      </div>

      {/* Languages */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Languages spoken *</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                const current = form.languages
                onChange('languages', current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang])
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                form.languages.includes(lang)
                  ? 'bg-teal border-teal text-white'
                  : 'border-light-grey dark:border-[#2E2E2E] text-graphite dark:text-[#A0A0A0] hover:border-teal/40'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
        {errors.languages && <p className="text-xs text-red-500">{errors.languages}</p>}
      </div>

      {/* Fee */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Fee per session (₹) *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-graphite dark:text-[#A0A0A0]">₹</span>
          <input
            type="number"
            value={form.fee}
            onChange={(e) => onChange('fee', e.target.value)}
            placeholder="1500"
            min="0"
            className={`input-base pl-8 ${errors.fee ? 'ring-2 ring-red-400' : ''}`}
          />
        </div>
        {errors.fee && <p className="text-xs text-red-500">{errors.fee}</p>}
        <p className="text-xs text-graphite/50 dark:text-[#444]">Patients with financial hardship may see adjusted options</p>
      </div>
    </div>
  )
}

function StepSpecializations({ form, onChange, errors }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0] block mb-3">
          Select your areas of focus * (choose at least 1)
        </label>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const current = form.specializations
                onChange('specializations', current.includes(s) ? current.filter((x) => x !== s) : [...current, s])
              }}
              className={`px-3 py-2 rounded-xl text-sm border transition-all ${
                form.specializations.includes(s)
                  ? 'bg-teal/10 dark:bg-teal/10 border-teal text-teal font-medium'
                  : 'border-light-grey dark:border-[#2E2E2E] text-graphite dark:text-[#A0A0A0] hover:border-teal/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {errors.specializations && <p className="text-xs text-red-500 mt-2">{errors.specializations}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">Years of experience *</label>
        <input
          type="number"
          value={form.yearsExp}
          onChange={(e) => onChange('yearsExp', e.target.value)}
          placeholder="5"
          min="0"
          max="50"
          className={`input-base ${errors.yearsExp ? 'ring-2 ring-red-400' : ''}`}
        />
        {errors.yearsExp && <p className="text-xs text-red-500">{errors.yearsExp}</p>}
      </div>
    </div>
  )
}

function StepCredentials({ form, onChange, errors }) {
  const docRef = useRef()
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">License type *</label>
        <select
          value={form.licenseType}
          onChange={(e) => onChange('licenseType', e.target.value)}
          className={`input-base ${errors.licenseType ? 'ring-2 ring-red-400' : ''}`}
        >
          <option value="">Select license type…</option>
          {LICENSE_TYPES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        {errors.licenseType && <p className="text-xs text-red-500">{errors.licenseType}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">License / registration number *</label>
        <input
          type="text"
          value={form.licenseNumber}
          onChange={(e) => onChange('licenseNumber', e.target.value)}
          placeholder="RCI/2015/12345"
          className={`input-base ${errors.licenseNumber ? 'ring-2 ring-red-400' : ''}`}
        />
        {errors.licenseNumber && <p className="text-xs text-red-500">{errors.licenseNumber}</p>}
      </div>

      {/* Document upload */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-graphite dark:text-[#A0A0A0]">
          Verification document * <span className="font-normal">(license certificate, degree, or ID)</span>
        </label>
        <button
          type="button"
          onClick={() => docRef.current?.click()}
          className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 transition-colors ${
            form.docFile
              ? 'border-teal/50 bg-teal/5 dark:bg-teal/10'
              : errors.docFile
              ? 'border-red-400'
              : 'border-light-grey dark:border-[#2E2E2E] hover:border-teal/40'
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={form.docFile ? '#3D9E8C' : '#9CA3AF'} strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          {form.docFile
            ? <span className="text-sm font-medium text-teal">{form.docFile.name}</span>
            : <span className="text-sm text-graphite dark:text-[#A0A0A0]">Click to upload PDF or image</span>
          }
          <span className="text-xs text-graphite/40 dark:text-[#444]">PDF, JPG, PNG — max 5MB</span>
        </button>
        <input
          ref={docRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => onChange('docFile', e.target.files?.[0] || null)}
          className="hidden"
        />
        {errors.docFile && <p className="text-xs text-red-500">{errors.docFile}</p>}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl p-4">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>What happens next:</strong> Our team reviews your credentials within 8 hours. You'll receive an email when your profile is approved and you appear in the therapist directory.
        </p>
      </div>
    </div>
  )
}

function StepSuccess() {
  return (
    <div className="text-center space-y-5 py-4">
      <div className="w-16 h-16 rounded-full bg-teal/10 dark:bg-teal/10 flex items-center justify-center mx-auto">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3D9E8C" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round"/>
          <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <h3 className="font-serif text-xl font-semibold text-brand-black dark:text-white">Application submitted!</h3>
        <p className="text-sm text-graphite dark:text-[#A0A0A0] mt-2 leading-relaxed max-w-xs mx-auto">
          Your profile is now under review. Our team will verify your credentials and you'll hear from us within 8 hours.
        </p>
      </div>
      <div className="bg-cream dark:bg-[#2A2A2A] rounded-xl p-4 text-left space-y-2">
        <p className="text-xs font-semibold text-brand-black dark:text-white">What to expect:</p>
        {[
          'Verification email confirming submission',
          'Team reviews license and credentials',
          'Profile approved → you appear in search',
          'Patients can book sessions with you',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-teal/10 dark:bg-teal/10 text-teal text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">{i + 1}</span>
            <p className="text-xs text-graphite dark:text-[#A0A0A0]">{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepEditSaved() {
  return (
    <div className="text-center space-y-4 py-6">
      <div className="w-14 h-14 rounded-full bg-teal/10 dark:bg-teal/10 flex items-center justify-center mx-auto">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3D9E8C" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h3 className="font-serif text-xl font-semibold text-brand-black dark:text-white">Profile updated</h3>
        <p className="text-sm text-graphite dark:text-[#A0A0A0] mt-2">Your changes were saved successfully.</p>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  name: '',
  bio: '',
  photoFile: null,
  languages: ['English'],
  fee: '',
  specializations: [],
  yearsExp: '',
  licenseType: '',
  licenseNumber: '',
  docFile: null,
}

export default function TherapistOnboardingPage() {
  const { user, completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const activeSteps = STEPS
  const totalSteps = 4

  useEffect(() => {
    const loadTherapistProfile = async () => {
      if (!user) return
      setLoadingProfile(true)
      try {
        const { data, error } = await supabase
          .from('therapists')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        if (!data) return

        setForm((prev) => ({
          ...prev,
          name: data.name ?? '',
          bio: data.bio ?? '',
          languages: data.languages?.length ? data.languages : ['English'],
          fee: data.fee_per_session?.toString?.() ?? '',
          specializations: data.specializations ?? [],
          yearsExp: data.years_experience?.toString?.() ?? '',
          licenseType: data.license_type ?? '',
          licenseNumber: data.license_number ?? '',
          photoUrl: data.photo_url ?? null,
        }))
      } catch (err) {
        console.error('Failed to load therapist profile:', err)
      } finally {
        setLoadingProfile(false)
      }
    }

    loadTherapistProfile()
  }, [user])

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validateStep = () => {
    const e = {}
    if (step === 0) {
      if (!form.name.trim()) e.name = 'Full name is required'
      if (!form.bio.trim()) e.bio = 'Bio is required'
      if (form.bio.length > 300) e.bio = 'Bio must be under 300 characters'
      if (form.languages.length === 0) e.languages = 'Select at least one language'
      if (!form.fee || isNaN(Number(form.fee)) || Number(form.fee) < 0) e.fee = 'Enter a valid fee'
    }
    if (step === 1) {
      if (form.specializations.length === 0) e.specializations = 'Select at least one specialization'
      if (!form.yearsExp || isNaN(Number(form.yearsExp))) e.yearsExp = 'Enter years of experience'
    }
    if (step === 2) {
      if (!form.licenseType) e.licenseType = 'License type is required'
      if (!form.licenseNumber.trim()) e.licenseNumber = 'License number is required'
      if (!form.docFile) e.docFile = 'Please upload a verification document'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    if (!user) return
    setSubmitting(true)

    try {
      let photoUrl = form.photoUrl || null
      let docUrl = null

      // Upload profile photo to Supabase Storage
      if (form.photoFile) {
        const ext = form.photoFile.name.split('.').pop()?.toLowerCase() || 'png'
        const path = `${user.id}/photo.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('profile-photos')
          .upload(path, form.photoFile, {
            upsert: true,
            contentType: form.photoFile.type || 'image/png',
            cacheControl: '3600',
          })
        if (!uploadErr) {
          const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
          photoUrl = data.publicUrl
        }
      }

      // Upload verification doc during onboarding
      if (form.docFile) {
        const ext = form.docFile.name.split('.').pop()?.toLowerCase() || 'pdf'
        const path = `${user.id}/verification.${ext}`
        const { error: docErr } = await supabase.storage
          .from('therapist-docs')
          .upload(path, form.docFile, {
            upsert: true,
            contentType: form.docFile.type || 'application/pdf',
            cacheControl: '3600',
          })
        if (!docErr) {
          docUrl = path // private — don't expose public URL
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

      payload.license_type = form.licenseType
      payload.license_number = form.licenseNumber.trim()
      payload.available = false // not available until verified
      payload.verified_status = 'pending'
      payload.verification_docs_url = docUrl

      const { data: existingTherapist, error: lookupError } = await supabase
        .from('therapists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (lookupError) throw lookupError

      // Write therapist row explicitly to avoid duplicate-key conflicts from upsert edge cases.
      const writeQuery = existingTherapist
        ? supabase.from('therapists').update(payload).eq('user_id', user.id)
        : supabase.from('therapists').insert(payload)

      const { error: therapistErr } = await writeQuery

      if (therapistErr) throw therapistErr

      // Mark onboarding complete for first-time setup
      await completeOnboarding()
      setSubmitted(true)
      setStep(3) // success step

    } catch (err) {
      console.error('Therapist onboarding error:', err)
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-serif text-xl font-semibold text-teal">NURO AI</span>
            {step < 3 && (
              <span className="text-sm text-graphite dark:text-[#A0A0A0]">Step {step + 1} of {totalSteps}</span>
            )}
          </div>

          {/* Progress bar */}
          {step < 3 && (
            <div className="w-full bg-light-grey dark:bg-[#2E2E2E] rounded-full h-1.5">
              <div
                className="bg-teal h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Card */}
        <div className="card p-7">
          {step < 3 && (
            <div className="mb-6">
              <h1 className="font-serif text-2xl font-semibold text-brand-black dark:text-white">
                {activeSteps[step]}
              </h1>
              <p className="text-sm text-graphite dark:text-[#A0A0A0] mt-1">
                {step === 0 && 'Tell patients who you are and what you offer.'}
                {step === 1 && 'Select what you work with. Patients filter by these.'}
                {step === 2 && 'Your credentials are reviewed privately and never shown publicly.'}
              </p>
            </div>
          )}

          {/* Step content */}
          {step === 0 && <StepDetails form={form} onChange={onChange} errors={errors} />}
          {step === 1 && <StepSpecializations form={form} onChange={onChange} errors={errors} />}
          {step === 2 && <StepCredentials form={form} onChange={onChange} errors={errors} />}
          {step === 3 && <StepSuccess />}

          {errors.submit && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
              {errors.submit}
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button onClick={() => setStep((s) => s - 1)} className="btn-outline py-3 px-5">
                  Back
                </button>
              )}
              {step < 2 ? (
                <button onClick={handleNext} className="flex-1 btn-primary py-3 text-base">
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 btn-primary py-3 text-base disabled:opacity-40"
                >
                  {submitting ? 'Saving…' : 'Submit for review'}
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <button
              onClick={() => navigate('/dashboard/therapist')}
              className="w-full btn-primary py-3 text-base mt-6"
            >
              Go to my dashboard
            </button>
          )}
        </div>

        <p className="text-center text-xs text-graphite/40 dark:text-[#444] mt-6">
          Questions? Email <a href="mailto:therapists@nuroai.in" className="text-teal hover:underline">therapists@nuroai.in</a>
        </p>
      </div>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add video intro upload, add insurance/panel info, add session format options (in-person/online)
