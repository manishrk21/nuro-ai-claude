// FILE: pages/OnboardingPage.jsx | PURPOSE: Multi-step profile questionnaire | CONNECTS TO: onboardingQuestions.js, profileService.js, authService.js, useAuth.js

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onboardingQuestions } from '../constants/onboardingQuestions.js'
import { profileService } from '../services/profileService.js'
import { useAuth } from '../hooks/useAuth.js'
import { validators } from '../utils/validators.js'

function ProgressBar({ current, total }) {
  return (
    <div className="w-full bg-light-grey dark:bg-[#2E2E2E] rounded-full h-1.5">
      <div
        className="bg-teal h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${((current + 1) / total) * 100}%` }}
      />
    </div>
  )
}

function QuestionStep({ question, value, onChange, error }) {
  return (
    <div className="space-y-4 animate-float-up">
      <h2 className="font-serif text-2xl font-semibold text-brand-black dark:text-white leading-snug">
        {question.question}
      </h2>
      {question.note && (
        <p className="text-sm text-graphite dark:text-[#A0A0A0]">{question.note}</p>
      )}

      {/* ─── Support for Standard Text Input (e.g., Patient Name) ─── */}
      {question.type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || 'Type your answer here…'}
          className={`input-base text-lg ${error ? 'ring-2 ring-red-400' : ''}`}
        />
      )}

      {question.type === 'single-select' && (
        <div className="flex flex-col gap-2">
          {question.options?.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`text-left px-5 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                value === opt
                  ? 'border-teal bg-teal/5 text-teal dark:bg-teal/10'
                  : 'border-light-grey dark:border-[#2E2E2E] text-brand-black dark:text-[#F5F5F5] hover:border-teal/40'
              }`}
            >
              {opt}
            </button>
          ))}
          {question.allowCustom && value === 'Other' && (
            <input
              type="text"
              placeholder="Please specify…"
              className="input-base mt-1"
              onChange={(e) => onChange(`Other: ${e.target.value}`)}
            />
          )}
        </div>
      )}

      {question.type === 'number' && (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          min={question.min}
          max={question.max}
          className={`input-base text-lg ${error ? 'ring-2 ring-red-400' : ''}`}
        />
      )}

      {question.type === 'searchable-select' && (
        <div className="relative">
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="input-base appearance-none"
          >
            <option value="">Select your country…</option>
            {question.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [stepError, setStepError] = useState(null)
  const [saving, setSaving] = useState(false)

  const q = onboardingQuestions ? onboardingQuestions[step] : null
  const total = onboardingQuestions ? onboardingQuestions.length : 0
  const currentValue = q ? answers[q.id] : ''

  // ─── SAFE GUARD CLAUSE: Prevents blank screen crashes while checking steps ───
  if (!onboardingQuestions || total === 0 || !q) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const validateStep = () => {
    if (!q.required) return true
    
    if (q.type === 'number') {
      const err = validators.age(currentValue)
      if (err) { setStepError(err); return false }
    } else if (!currentValue || (typeof currentValue === 'string' && !currentValue.trim())) {
      setStepError('Please answer this question to continue.')
      return false
    }
    return true
  }

  const handleNext = async () => {
    setStepError(null)
    if (!validateStep()) return

    if (step < total - 1) {
      setStep((s) => s + 1)
    } else {
      // Last step — save and complete
      setSaving(true)
      try {
        await profileService.saveOnboardingData(user.id, answers)
        await completeOnboarding()
        // After onboarding, route to consent so user can accept before seeing dashboard
        navigate('/auth?consent=1')
      } catch (err) {
        setStepError('Failed to save. Please try again.')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
    setStepError(null)
  }

  const handleSkip = () => {
    if (q.required) return
    setStep((s) => s + 1)
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between text-sm text-graphite dark:text-[#A0A0A0]">
            <span className="font-serif text-teal text-lg font-semibold">NURO AI</span>
            <span>{step + 1} of {total}</span>
          </div>
          <ProgressBar current={step} total={total} />
        </div>

        {/* Question */}
        <QuestionStep
          question={q}
          value={currentValue}
          onChange={handleAnswer}
          error={stepError}
        />

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="btn-outline py-3 px-5"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex-1 btn-primary py-3 text-base disabled:opacity-40"
          >
            {saving ? 'Saving…' : step === total - 1 ? 'Finish' : 'Continue'}
          </button>
        </div>

        {!q.required && step < total - 1 && (
          <button onClick={handleSkip} className="w-full mt-3 text-sm text-graphite/50 dark:text-[#444] hover:text-graphite dark:hover:text-[#A0A0A0] underline transition-colors">
            Skip this question
          </button>
        )}
      </div>
    </div>
  )
}





// // FILE: pages/OnboardingPage.jsx | PURPOSE: Multi-step profile questionnaire | CONNECTS TO: onboardingQuestions.js, profileService.js, authService.js, useAuth.js

// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { onboardingQuestions } from '../constants/onboardingQuestions.js'
// import { profileService } from '../services/profileService.js'
// import { useAuth } from '../hooks/useAuth.js'
// import { validators } from '../utils/validators.js'

// function ProgressBar({ current, total }) {
//   return (
//     <div className="w-full bg-light-grey dark:bg-[#2E2E2E] rounded-full h-1.5">
//       <div
//         className="bg-teal h-1.5 rounded-full transition-all duration-500"
//         style={{ width: `${((current + 1) / total) * 100}%` }}
//       />
//     </div>
//   )
// }

// function QuestionStep({ question, value, onChange, error }) {
//   return (
//     <div className="space-y-4 animate-float-up">
//       <h2 className="font-serif text-2xl font-semibold text-brand-black dark:text-white leading-snug">
//         {question.question}
//       </h2>
//       {question.note && (
//         <p className="text-sm text-graphite dark:text-[#A0A0A0]">{question.note}</p>
//       )}

//       {/* ─── ADDED: Support for Standard Text Input (e.g., Patient Name) ─── */}
//       {question.type === 'text' && (
//         <input
//           type="text"
//           value={value || ''}
//           onChange={(e) => onChange(e.target.value)}
//           placeholder={question.placeholder || 'Type your answer here…'}
//           className={`input-base text-lg ${error ? 'ring-2 ring-red-400' : ''}`}
//         />
//       )}

//       {question.type === 'single-select' && (
//         <div className="flex flex-col gap-2">
//           {question.options.map((opt) => (
//             <button
//               key={opt}
//               onClick={() => onChange(opt)}
//               className={`text-left px-5 py-3.5 rounded-xl border text-sm font-medium transition-all ${
//                 value === opt
//                   ? 'border-teal bg-teal/5 text-teal dark:bg-teal/10'
//                   : 'border-light-grey dark:border-[#2E2E2E] text-brand-black dark:text-[#F5F5F5] hover:border-teal/40'
//               }`}
//             >
//               {opt}
//             </button>
//           ))}
//           {question.allowCustom && value === 'Other' && (
//             <input
//               type="text"
//               placeholder="Please specify…"
//               className="input-base mt-1"
//               onChange={(e) => onChange(`Other: ${e.target.value}`)}
//             />
//           )}
//         </div>
//       )}

//       {question.type === 'number' && (
//         <input
//           type="number"
//           value={value || ''}
//           onChange={(e) => onChange(e.target.value)}
//           placeholder={question.placeholder}
//           min={question.min}
//           max={question.max}
//           className={`input-base text-lg ${error ? 'ring-2 ring-red-400' : ''}`}
//         />
//       )}

//       {question.type === 'searchable-select' && (
//         <div className="relative">
//           <select
//             value={value || ''}
//             onChange={(e) => onChange(e.target.value)}
//             className="input-base appearance-none"
//           >
//             <option value="">Select your country…</option>
//             {question.options.map((opt) => (
//               <option key={opt} value={opt}>{opt}</option>
//             ))}
//           </select>
//         </div>
//       )}

//       {error && <p className="text-sm text-red-500">{error}</p>}
//     </div>
//   )
// }

// export default function OnboardingPage() {
//   const { user, completeOnboarding } = useAuth()
//   const navigate = useNavigate()
//   const [step, setStep] = useState(0)
//   const [answers, setAnswers] = useState({})
//   const [stepError, setStepError] = useState(null)
//   const [saving, setSaving] = useState(false)

//   const q = onboardingQuestions[step]
//   const total = onboardingQuestions.length
//   const currentValue = answers[q.id]

//   const validateStep = () => {
//     if (!q.required) return true
    
//     if (q.type === 'number') {
//       const err = validators.age(currentValue)
//       if (err) { setStepError(err); return false }
//     } else if (!currentValue || (typeof currentValue === 'string' && !currentValue.trim())) {
//       setStepError('Please answer this question to continue.')
//       return false
//     }
//     return true
//   }

//   const handleNext = async () => {
//     setStepError(null)
//     if (!validateStep()) return

//     if (step < total - 1) {
//       setStep((s) => s + 1)
//     } else {
//       // Last step — save and complete
//       setSaving(true)
//       try {
//         await profileService.saveOnboardingData(user.id, answers)
//         await completeOnboarding()
//         navigate('/dashboard')
//       } catch (err) {
//         setStepError('Failed to save. Please try again.')
//       } finally {
//         setSaving(false)
//       }
//     }
//   }

//   const handleAnswer = (value) => {
//     setAnswers((prev) => ({ ...prev, [q.id]: value }))
//     setStepError(null)
//   }

//   const handleSkip = () => {
//     if (q.required) return
//     setStep((s) => s + 1)
//   }

//   return (
//     <div className="min-h-screen bg-cream dark:bg-[#121212] flex flex-col items-center justify-center px-6 py-12">
//       <div className="w-full max-w-lg">
//         {/* Header */}
//         <div className="mb-8 space-y-3">
//           <div className="flex items-center justify-between text-sm text-graphite dark:text-[#A0A0A0]">
//             <span className="font-serif text-teal text-lg font-semibold">NURO AI</span>
//             <span>{step + 1} of {total}</span>
//           </div>
//           <ProgressBar current={step} total={total} />
//         </div>

//         {/* Question */}
//         <QuestionStep
//           question={q}
//           value={currentValue}
//           onChange={handleAnswer}
//           error={stepError}
//         />

//         {/* Actions */}
//         <div className="flex gap-3 mt-8">
//           {step > 0 && (
//             <button
//               onClick={() => setStep((s) => s - 1)}
//               className="btn-outline py-3 px-5"
//             >
//               Back
//             </button>
//           )}
//           <button
//             onClick={handleNext}
//             disabled={saving}
//             className="flex-1 btn-primary py-3 text-base disabled:opacity-40"
//           >
//             {saving ? 'Saving…' : step === total - 1 ? 'Finish' : 'Continue'}
//           </button>
//         </div>

//         {!q.required && step < total - 1 && (
//           <button onClick={handleSkip} className="w-full mt-3 text-sm text-graphite/50 dark:text-[#444] hover:text-graphite dark:hover:text-[#A0A0A0] underline transition-colors">
//             Skip this question
//           </button>
//         )}
//       </div>
//     </div>
//   )
// }


