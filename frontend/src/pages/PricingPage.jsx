// FILE: pages/PricingPage.jsx | PURPOSE: Standalone pricing page | CONNECTS TO: pricingData.js, Navbar.jsx

import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import { pricingData } from '../constants/pricingData.js'

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly')

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="text-center space-y-4 mb-14">
          <h1 className="font-serif text-4xl font-semibold text-brand-black dark:text-white">{pricingData.headline}</h1>
          <p className="text-lg text-graphite dark:text-[#A0A0A0]">{pricingData.subtext}</p>
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className={`text-sm font-medium transition-colors ${billing === 'monthly' ? 'text-brand-black dark:text-white' : 'text-graphite/50 dark:text-[#555]'}`}>Monthly</span>
            <button
              onClick={() => setBilling((b) => b === 'monthly' ? 'yearly' : 'monthly')}
              className={`w-12 h-6 rounded-full transition-colors relative ${billing === 'yearly' ? 'bg-teal' : 'bg-light-grey dark:bg-[#2E2E2E]'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${billing === 'yearly' ? 'left-6' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm font-medium transition-colors ${billing === 'yearly' ? 'text-brand-black dark:text-white' : 'text-graphite/50 dark:text-[#555]'}`}>
              Yearly <span className="text-teal text-xs font-semibold">Save 17%</span>
            </span>
          </div>
        </div>

        {/* Tiers */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {pricingData.tiers.map((tier) => (
            <div key={tier.id} className={`card p-6 flex flex-col gap-5 ${tier.highlighted ? 'ring-2 ring-teal shadow-xl' : ''}`}>
              {tier.badge && (
                <span className="inline-block text-xs font-bold text-teal uppercase tracking-widest">{tier.badge}</span>
              )}
              <div>
                <h2 className="font-serif text-2xl font-semibold text-brand-black dark:text-white">{tier.name}</h2>
                <p className="text-teal font-bold text-lg mt-1">
                  {tier.price
                    ? billing === 'yearly'
                      ? `₹${tier.price.yearly}/yr`
                      : `₹${tier.price.monthly}/mo`
                    : tier.priceLine}
                </p>
                <p className="text-xs text-graphite dark:text-[#A0A0A0] mt-1">{tier.description}</p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-graphite dark:text-[#C0C0C0]">
                    <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D9E8C" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to={tier.ctaHref}
                className={`text-center py-3 rounded-full text-sm font-medium transition-colors block ${tier.highlighted ? 'btn-primary' : 'btn-outline'}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ note */}
        <div className="mt-14 text-center space-y-2">
          <p className="text-sm text-graphite dark:text-[#A0A0A0]">Questions? Email us at <a href="mailto:hello@nuroai.in" className="text-teal hover:underline">hello@nuroai.in</a></p>
          <p className="text-xs text-graphite/40 dark:text-[#444]">NURO is not a licensed therapist. For emergencies call 112.</p>
        </div>
      </div>
    </div>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add FAQ section, add comparison table, add Razorpay payment integration
