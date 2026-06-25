// FILE: constants/landingContent.js | PURPOSE: All landing page copy — edit here, never in JSX | CONNECTS TO: LandingPage.jsx

export const landingContent = {
  nav: {
    logo: 'NURO AI',
    links: [
      { label: 'Home', href: '/' },
      { label: 'AI Companion', href: '/chat' },
      { label: 'Find a Therapist', href: '/therapists' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'For Therapists', href: '/auth?mode=signup&role=therapist', highlight: true },
    ],
  },

  hero: {
    eyebrow: 'Mental wellness, reimagined',
    headline: 'Your mental health companion, available 24/7',
    subtext: 'Talk through what\'s on your mind. Anytime, anywhere. No waitlist, no judgment.',
    cta1: 'Chat with NURO — It\'s Free',
    cta2: 'Find a Therapist',
  },

  chatAnimation: [
    { role: 'user', text: "I've been feeling overwhelmed lately." },
    { role: 'nuro', text: "That makes sense. Would you like to talk about what's been weighing on you most?" },
    { role: 'user', text: "Work, mostly. I can't seem to switch off." },
    { role: 'nuro', text: "It sounds like the boundary between work and rest has gotten blurry. That's really common — and really exhausting." },
  ],

  nuroFeature: {
    headline: 'Meet NURO — your personal AI companion',
    body: 'NURO is always here. No appointments. No judgment. Evidence-informed support at 3am or 3pm.',
    cta: 'Try NURO Now — Free',
    pills: ['Available 24/7', 'Voice & text', 'Remembers your journey'],
  },

  howItWorks: {
    headline: 'How it works',
    steps: [
      {
        icon: '✦',
        title: 'Create your profile',
        desc: 'Answer a few gentle questions so NURO understands you.',
      },
      {
        icon: '◎',
        title: 'Talk to NURO',
        desc: 'Your AI companion, anytime. Voice or text.',
      },
      {
        icon: '⬡',
        title: 'Book a therapist',
        desc: 'When you\'re ready for human support, we\'ll match you.',
      },
    ],
  },

  therapistPreview: {
    headline: 'Real therapists. Verified and ready.',
    cta: 'Browse All Therapists',
    therapists: [
      {
        name: 'Dr. Priya Menon',
        specializations: ['Anxiety', 'CBT', 'Relationships'],
        fee: 1800,
        rating: 4.9,
        reviews: 47,
        available: true,
        yearsExp: 8,
        initials: 'PM',
      },
      {
        name: 'Arjun Shah, MA',
        specializations: ['Trauma', 'Grief', 'Adolescents'],
        fee: 1500,
        rating: 4.8,
        reviews: 31,
        available: true,
        yearsExp: 6,
        initials: 'AS',
      },
      {
        name: 'Dr. Kavitha Rao',
        specializations: ['Depression', 'Mindfulness', 'Career'],
        fee: 2000,
        rating: 5.0,
        reviews: 62,
        available: false,
        yearsExp: 12,
        initials: 'KR',
      },
    ],
  },

  testimonials: {
    headline: 'What people are saying',
    quotes: [
      {
        text: 'Talking to NURO at midnight when I couldn\'t sleep changed something for me. It didn\'t fix everything — but it helped me feel less alone.',
        author: 'Anjali, 28',
        location: 'Mumbai',
      },
      {
        text: 'I was skeptical of AI therapy. NURO never felt clinical or robotic. It actually asked questions I hadn\'t thought to ask myself.',
        author: 'Rahul, 34',
        location: 'Bengaluru',
      },
      {
        text: 'Found my therapist through NURO AI after months of not knowing where to start. The matching made all the difference.',
        author: 'Sneha, 26',
        location: 'Delhi',
      },
    ],
  },

  footer: {
    tagline: 'Mental health support is not a luxury.',
    disclaimer: 'NURO is not a licensed therapist. For emergencies call 112.',
    columns: [
      {
        heading: 'Product',
        links: [
          { label: 'AI Companion', href: '/chat' },
          { label: 'Find a Therapist', href: '/therapists' },
          { label: 'Pricing', href: '/pricing' },
        ],
      },
      {
        heading: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Blog', href: '/blog' },
          { label: 'Careers', href: '/careers' },
        ],
      },
      {
        heading: 'Legal',
        links: [
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
          { label: 'Cookie Policy', href: '/cookies' },
        ],
      },
    ],
  },
}

// CHANGE THIS FILE IF YOU WANT TO: update all landing page copy, change therapist preview cards, update testimonials
