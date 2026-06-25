// FILE: pages/LandingPage.jsx | PURPOSE: Public marketing home page | CONNECTS TO: landingContent.js, pricingData.js, Navbar.jsx

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import { landingContent } from '../constants/landingContent.js'
import { pricingData } from '../constants/pricingData.js'
import { formatters } from '../utils/formatters.js'

// ─── Chat animation ─────────────────────────────────────────────────────────
function ChatAnimation() {
  const [visible, setVisible] = useState(0)
  const msgs = landingContent.chatAnimation

  useEffect(() => {
    if (visible >= msgs.length) {
      const reset = setTimeout(() => setVisible(0), 2000)
      return () => clearTimeout(reset)
    }
    const t = setTimeout(() => setVisible((v) => v + 1), 1600)
    return () => clearTimeout(t)
  }, [visible, msgs.length])

  return (
    <div className="space-y-3 pointer-events-none select-none" aria-hidden>
      {msgs.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-500 ${i < visible ? 'opacity-35' : 'opacity-0'}`}
          style={{ transform: i < visible ? 'translateY(0)' : 'translateY(10px)' }}
        >
          {msg.role === 'nuro' && (
            <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-[10px] font-serif mr-2 mt-1 shrink-0">N</div>
          )}
          <div className={`max-w-[75%] px-3.5 py-2 rounded-xl text-xs leading-relaxed ${
            msg.role === 'user'
              ? 'bg-brand-black dark:bg-[#F5F5F5] text-white dark:text-brand-black rounded-br-sm'
              : 'bg-white dark:bg-[#2A2A2A] text-brand-black dark:text-[#F5F5F5] rounded-bl-sm shadow-sm'
          }`}>
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Brain SVG ───────────────────────────────────────────────────────────────
function BrainSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-xs mx-auto" fill="none" aria-hidden>
      <path className="brain-draw" d="M100 40 C70 40 50 60 50 85 C50 100 57 113 68 120 C60 127 55 138 55 150 C55 165 67 175 80 175 C87 175 93 172 98 167 C103 172 110 175 120 175 C133 175 145 165 145 150 C145 138 140 127 132 120 C143 113 150 100 150 85 C150 60 130 40 100 40Z" stroke="#3D9E8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path className="brain-draw" d="M80 80 C80 80 90 95 100 80 C110 65 120 85 120 85" stroke="#3D9E8C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" style={{ animationDelay: '1s' }} />
      <path className="brain-draw" d="M75 110 C85 105 95 115 105 110 C115 105 125 115 130 110" stroke="#3D9E8C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" style={{ animationDelay: '2s' }} />
      <circle cx="100" cy="40" r="3" fill="#3D9E8C" opacity="0.5" />
    </svg>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { hero, nuroFeature, howItWorks, therapistPreview, testimonials, footer } = landingContent

  // Silent backend wake-up ping for Render cold starts
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212]">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block text-xs font-semibold tracking-widest text-teal uppercase">{hero.eyebrow}</span>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight text-brand-black dark:text-white">
              {hero.headline}
            </h1>
            <p className="text-lg text-graphite dark:text-[#A0A0A0] leading-relaxed max-w-md">
              {hero.subtext}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/auth" className="btn-primary py-3 px-6 text-base">{hero.cta1}</Link>
              <Link to="/therapists" className="btn-outline py-3 px-6 text-base">{hero.cta2}</Link>
            </div>
            <div className="pt-2 max-w-sm">
              <ChatAnimation />
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <BrainSVG />
          </div>
        </div>
      </section>

      {/* ── NURO FEATURE ─────────────────────────────────────────────────── */}
      <section className="bg-cream dark:bg-[#1A1A1A] py-20 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal to-teal-700 flex items-center justify-center mx-auto avatar-pulse">
            <span className="font-serif text-3xl font-semibold text-white">N</span>
          </div>
          <h2 className="font-serif text-3xl font-semibold text-brand-black dark:text-white">{nuroFeature.headline}</h2>
          <p className="text-graphite dark:text-[#A0A0A0] text-lg leading-relaxed">{nuroFeature.body}</p>
          <Link to="/auth" className="btn-primary py-3 px-8 text-base inline-flex">{nuroFeature.cta}</Link>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {nuroFeature.pills.map((pill) => (
              <span key={pill} className="text-sm px-4 py-1.5 rounded-full border border-teal/30 text-teal bg-teal/5">{pill}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="font-serif text-3xl font-semibold text-center text-brand-black dark:text-white mb-14">{howItWorks.headline}</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {howItWorks.steps.map((step, i) => (
            <div key={i} className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal/10 dark:bg-teal/10 flex items-center justify-center mx-auto text-2xl text-teal">{step.icon}</div>
              <h3 className="font-semibold text-brand-black dark:text-white">{step.title}</h3>
              <p className="text-sm text-graphite dark:text-[#A0A0A0] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── THERAPIST PREVIEW ────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#121212] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-semibold text-center text-brand-black dark:text-white mb-12">{therapistPreview.headline}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {therapistPreview.therapists.map((t) => (
              <div key={t.name} className="card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-teal/20 dark:from-teal/20 dark:to-teal/10 flex items-center justify-center font-semibold text-teal">{t.initials}</div>
                  <div>
                    <p className="font-semibold text-sm text-brand-black dark:text-white">{t.name}</p>
                    <p className="text-xs text-graphite dark:text-[#A0A0A0]">{t.yearsExp} yrs exp</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.specializations.map((s) => <span key={s} className="text-xs px-2 py-0.5 bg-teal/8 dark:bg-teal/10 text-teal rounded-full">{s}</span>)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-brand-black dark:text-white">{formatters.currency(t.fee)}/session</span>
                  <span className={`text-xs ${t.available ? 'text-emerald-500' : 'text-graphite/40'}`}>{t.available ? '● Available' : '○ Unavailable'}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/therapists" className="btn-outline py-3 px-8 text-base inline-flex">{therapistPreview.cta}</Link>
          </div>
        </div>
      </section>

      {/* ── JOIN AS THERAPIST ────────────────────────────────────────────── */}
      <section className="bg-brand-black dark:bg-[#0E0E0E] py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-block text-xs font-semibold tracking-widest text-teal uppercase">For mental health professionals</span>
            <h2 className="font-serif text-3xl font-semibold text-white leading-tight">
              Reach patients who are ready.<br />On your own terms.
            </h2>
            <p className="text-[#A0A0A0] leading-relaxed">
              NURO AI connects verified therapists with patients who've already taken the first step. Set your own fee, availability, and specializations. We handle the platform — you focus on the work.
            </p>
            <Link
              to="/auth?mode=signup&role=therapist"
              className="inline-flex btn-primary py-3 px-7 text-base"
            >
              Apply as a therapist
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { icon: '✦', title: 'Set your own fee', desc: 'You decide what you charge per session. No platform commission.' },
              { icon: '◎', title: 'Verified badge', desc: 'Our vetting process means patients trust your credentials from day one.' },
              { icon: '⬡', title: 'Simple booking', desc: 'Patients request slots, you accept. Google Meet link auto-generated.' },
              { icon: '◈', title: 'Private case notes', desc: 'Write session notes directly in your dashboard. Never visible to patients.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                <span className="text-teal text-lg mt-0.5 shrink-0">{f.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-white">{f.title}</p>
                  <p className="text-xs text-[#A0A0A0] mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="bg-cream dark:bg-[#1A1A1A] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-semibold text-center text-brand-black dark:text-white mb-3">{pricingData.headline}</h2>
          <p className="text-center text-graphite dark:text-[#A0A0A0] mb-12">{pricingData.subtext}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {pricingData.tiers.map((tier) => (
              <div key={tier.id} className={`card p-6 flex flex-col gap-5 ${tier.highlighted ? 'ring-2 ring-teal shadow-lg scale-[1.02]' : ''}`}>
                {tier.badge && <span className="inline-block text-xs font-semibold text-teal uppercase tracking-wide">{tier.badge}</span>}
                <div>
                  <h3 className="font-semibold text-xl text-brand-black dark:text-white">{tier.name}</h3>
                  <p className="text-teal font-semibold mt-1">{tier.priceLine}</p>
                  <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-1">{tier.description}</p>
                </div>
                <ul className="space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-graphite dark:text-[#C0C0C0]">
                      <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D9E8C" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={tier.ctaHref} className={`text-center py-2.5 rounded-full text-sm font-medium transition-colors ${tier.highlighted ? 'btn-primary' : 'btn-outline'}`}>
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-semibold text-center text-brand-black dark:text-white mb-12">{testimonials.headline}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.quotes.map((q) => (
              <div key={q.author} className="card p-6 space-y-4">
                <p className="text-sm text-graphite dark:text-[#C0C0C0] leading-relaxed italic">"{q.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-brand-black dark:text-white">{q.author}</p>
                  <p className="text-xs text-graphite/60 dark:text-[#666]">{q.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-light-grey dark:border-[#2E2E2E] py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="space-y-2">
              <span className="font-serif text-xl font-semibold text-teal">NURO AI</span>
              <p className="text-sm text-graphite dark:text-[#A0A0A0] italic font-serif">{footer.tagline}</p>
            </div>
            {footer.columns.map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-graphite dark:text-[#A0A0A0] mb-3">{col.heading}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-graphite/70 dark:text-[#666] hover:text-teal dark:hover:text-teal transition-colors">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-light-grey dark:border-[#2E2E2E] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-graphite/50 dark:text-[#555]">© {new Date().getFullYear()} NURO AI. All rights reserved.</p>
            <p className="text-xs text-graphite/50 dark:text-[#555]">{footer.disclaimer}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: rearrange sections, update hero copy, add new sections
