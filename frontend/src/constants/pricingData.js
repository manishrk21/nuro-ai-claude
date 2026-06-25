// FILE: constants/pricingData.js | PURPOSE: All pricing tiers and feature lists | CONNECTS TO: PricingPage.jsx, LandingPage.jsx

export const pricingData = {
  headline: 'Transparent pricing. No surprises.',
  subtext: 'Start free. Upgrade when you\'re ready.',
  tiers: [
    {
      id: 'free',
      name: 'Free',
      price: null,
      priceLine: 'Always free',
      description: 'Everything you need to get started.',
      cta: 'Get Started',
      ctaHref: '/auth',
      highlighted: false,
      features: [
        'NURO AI companion chat',
        '50 messages per day',
        'Browse verified therapists',
        '1 booking per month',
        'Basic session history',
        'Crisis support resources',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: 1, yearly: 10 },
      priceLine: '₹1/month or ₹10/year',
      description: 'For those who want the full experience.',
      cta: 'Start Pro',
      ctaHref: '/auth?plan=pro',
      highlighted: true,
      badge: 'Most Popular',
      features: [
        'Everything in Free',
        '500 messages per day',
        'Priority NURO responses',
        'Voice mode (STT + TTS)',
        'Unlimited bookings',
        'Full session history',
        'Mood tracking (coming soon)',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null,
      priceLine: 'Custom pricing',
      description: 'For teams, clinics, and organisations.',
      cta: 'Contact Us',
      ctaHref: 'mailto:hello@nuroai.in',
      highlighted: false,
      features: [
        'Everything in Pro',
        'Custom integrations',
        'Team billing & admin',
        'Dedicated support',
        'Analytics dashboard',
        'White-label options',
        'SLA guarantee',
      ],
    },
  ],
}

// CHANGE THIS FILE IF YOU WANT TO: adjust pricing, add/remove features, add annual discount percentage
