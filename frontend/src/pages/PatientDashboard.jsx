// FILE: pages/PatientDashboard.jsx | PURPOSE: Patient dashboard — sessions, saved therapists, chat quick-launch | CONNECTS TO: profileService.js, useBooking.js, Navbar.jsx

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import { useAuthContext } from '../context/AuthContext.jsx'
import { profileService } from '../services/profileService.js'
import { useBooking } from '../hooks/useBooking.js'
import { formatters } from '../utils/formatters.js'
import { chatService } from '../services/chatService.js'

function QuotaWidget({ quota }) {
  if (!quota) return null
  const pct = (quota.used / quota.limit) * 100
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-black dark:text-white">Daily messages</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${quota.plan === 'pro' ? 'bg-teal/10 text-teal' : 'bg-light-grey dark:bg-[#2A2A2A] text-graphite dark:text-[#A0A0A0]'}`}>
          {quota.plan.toUpperCase()}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-graphite dark:text-[#A0A0A0]">
          <span>{quota.used} used</span>
          <span>{quota.remaining} remaining</span>
        </div>
        <div className="h-1.5 bg-light-grey dark:bg-[#2E2E2E] rounded-full">
          <div className="h-1.5 bg-teal rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>
      {quota.plan === 'free' && (
        <Link to="/pricing" className="block text-xs text-teal hover:underline">Upgrade to Pro for 500/day →</Link>
      )}
    </div>
  )
}

export default function PatientDashboard() {
  const { user, signOut } = useAuthContext()
  const { bookings, fetchBookings, cancelBooking } = useBooking()
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [savedTherapists, setSavedTherapists] = useState([])
  const [quota, setQuota] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchBookings(),
      profileService.getUpcomingSessions(user.id).then(setUpcomingSessions),
      profileService.getSavedTherapists(user.id).then(setSavedTherapists),
      chatService.getQuota(user.id).then(setQuota),
    ]).finally(() => setLoading(false))
  }, [user])

  const pendingBookings = bookings.filter((b) => b.status === 'pending')
  
  // ─── FIX: Merge both backend streams into a single source of truth ───
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed')

  // Create a combined array without duplicate matches
  const mergedUpcomingList = [...upcomingSessions]
  confirmedBookings.forEach((cb) => {
    if (!mergedUpcomingList.some(s => s.id === cb.id || s.booking_id === cb.booking_id)) {
      mergedUpcomingList.push({
        id: cb.id,
        session_at: cb.proposed_slots?.[0],
        meet_link: cb.meet_link,
        therapists: { name: cb.therapist_name || 'Verified Therapist' }
      })
    }
  })

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        {/* Welcome */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-black dark:text-white">
              Good {getTimeGreeting()}, {user?.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-graphite dark:text-[#A0A0A0] mt-0.5">How are you doing today?</p>
          </div>
          <button onClick={signOut} className="text-xs text-graphite/50 dark:text-[#444] hover:text-graphite dark:hover:text-[#A0A0A0] transition-colors">Sign out</button>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Link to="/chat" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-brand-black dark:text-white group-hover:text-teal transition-colors">Chat with NURO</p>
              <p className="text-xs text-graphite dark:text-[#A0A0A0]">Your AI companion</p>
            </div>
          </Link>
          <Link to="/therapists" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-brand-black dark:text-white group-hover:text-teal transition-colors">Find Therapist</p>
              <p className="text-xs text-graphite dark:text-[#A0A0A0]">Browse verified</p>
            </div>
          </Link>
          <QuotaWidget quota={quota} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Sessions */}
          <div className="space-y-3">
            <h2 className="font-semibold text-brand-black dark:text-white">Upcoming Sessions ({mergedUpcomingList.length})</h2>
            {loading && <div className="card p-8 animate-pulse bg-light-grey dark:bg-[#2A2A2A]" />}
            {!loading && mergedUpcomingList.length === 0 && (
              <div className="card p-6 text-center">
                <p className="text-sm text-graphite dark:text-[#A0A0A0] mb-3">No upcoming sessions</p>
                <Link to="/therapists" className="btn-primary text-sm py-2 px-4">Book a session</Link>
              </div>
            )}
            {mergedUpcomingList.map((s) => (
              <div key={s.id} className="card p-4 flex items-center gap-3 border border-teal/10 bg-white dark:bg-[#1E1E1E]">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal font-semibold text-sm shrink-0">
                  {s.session_at ? new Date(s.session_at).getDate() : '✓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-brand-black dark:text-white truncate">
                    {s.therapists?.name || 'Verified Therapist'}
                  </p>
                  <p className="text-xs text-graphite dark:text-[#A0A0A0]">
                    {s.session_at ? formatters.datetime(s.session_at) : 'Confirmed Appointment'}
                  </p>
                </div>
                
                {/* FIX: Use clear, safe target variables to parse fully qualified meeting URLs without string duplication */}
                {s.meet_link && (
                  <a 
                    href={s.meet_link.startsWith('http') ? s.meet_link : `https://${s.meet_link}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs bg-teal text-white px-3 py-1.5 rounded-lg hover:bg-teal-600 transition-colors shrink-0 font-medium"
                  >
                    Join Meet →
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Booking Requests */}
          <div className="space-y-3">
            <h2 className="font-semibold text-brand-black dark:text-white">Booking Requests</h2>
            {!loading && pendingBookings.length === 0 && (
              <div className="card p-6 text-center">
                <p className="text-sm text-graphite dark:text-[#A0A0A0]">No pending requests</p>
              </div>
            )}
            {pendingBookings.map((b) => (
              <div key={b.id} className="card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">Pending</span>
                  <span className="text-xs text-graphite/50 dark:text-[#444]">{formatters.relative(b.created_at)}</span>
                </div>
                <p className="text-sm text-brand-black dark:text-white font-medium">Awaiting therapist confirmation</p>
                <button
                  onClick={() => cancelBooking(b.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Cancel request
                </button>
              </div>
            ))}
          </div>

          {/* Saved Therapists */}
          <div className="md:col-span-2 space-y-3">
            <h2 className="font-semibold text-brand-black dark:text-white">My Therapists</h2>
            {!loading && savedTherapists.length === 0 && (
              <div className="card p-6 text-center">
                <p className="text-sm text-graphite dark:text-[#A0A0A0] mb-3">No saved therapists yet</p>
                <Link to="/therapists" className="btn-outline text-sm py-2 px-4">Browse therapists</Link>
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedTherapists.map((st) => {
                const t = st.therapists
                return t ? (
                  <Link key={st.therapist_id} to={`/therapists/${st.therapist_id}`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal/20 to-teal/10 flex items-center justify-center font-semibold text-teal text-sm">
                      {formatters.initials(t.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-brand-black dark:text-white truncate">{t.name}</p>
                      <p className="text-xs text-graphite dark:text-[#A0A0A0] truncate">{(t.specializations || []).slice(0, 2).join(', ')}</p>
                    </div>
                  </Link>
                ) : null
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}









// // FILE: pages/PatientDashboard.jsx | PURPOSE: Patient dashboard — sessions, saved therapists, chat quick-launch | CONNECTS TO: profileService.js, useBooking.js, Navbar.jsx

// import { useEffect, useState } from 'react'
// import { Link } from 'react-router-dom'
// import Navbar from '../components/layout/Navbar.jsx'
// import { useAuthContext } from '../context/AuthContext.jsx'
// import { profileService } from '../services/profileService.js'
// import { useBooking } from '../hooks/useBooking.js'
// import { formatters } from '../utils/formatters.js'
// import { chatService } from '../services/chatService.js'

// function QuotaWidget({ quota }) {
//   if (!quota) return null
//   const pct = (quota.used / quota.limit) * 100
//   return (
//     <div className="card p-5 space-y-3">
//       <div className="flex items-center justify-between">
//         <h3 className="text-sm font-semibold text-brand-black dark:text-white">Daily messages</h3>
//         <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${quota.plan === 'pro' ? 'bg-teal/10 text-teal' : 'bg-light-grey dark:bg-[#2A2A2A] text-graphite dark:text-[#A0A0A0]'}`}>
//           {quota.plan.toUpperCase()}
//         </span>
//       </div>
//       <div className="space-y-1.5">
//         <div className="flex justify-between text-xs text-graphite dark:text-[#A0A0A0]">
//           <span>{quota.used} used</span>
//           <span>{quota.remaining} remaining</span>
//         </div>
//         <div className="h-1.5 bg-light-grey dark:bg-[#2E2E2E] rounded-full">
//           <div className="h-1.5 bg-teal rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
//         </div>
//       </div>
//       {quota.plan === 'free' && (
//         <Link to="/pricing" className="block text-xs text-teal hover:underline">Upgrade to Pro for 500/day →</Link>
//       )}
//     </div>
//   )
// }

// export default function PatientDashboard() {
//   const { user, signOut } = useAuthContext()
//   const { bookings, fetchBookings, cancelBooking } = useBooking()
//   const [upcomingSessions, setUpcomingSessions] = useState([])
//   const [savedTherapists, setSavedTherapists] = useState([])
//   const [quota, setQuota] = useState(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     if (!user) return
//     Promise.all([
//       fetchBookings(),
//       profileService.getUpcomingSessions(user.id).then(setUpcomingSessions),
//       profileService.getSavedTherapists(user.id).then(setSavedTherapists),
//       chatService.getQuota(user.id).then(setQuota),
//     ]).finally(() => setLoading(false))
//   }, [user])

//   const pendingBookings = bookings.filter((b) => b.status === 'pending')
//   const confirmedBookings = bookings.filter((b) => b.status === 'confirmed')

//   return (
//     <div className="min-h-screen bg-cream dark:bg-[#121212]">
//       <Navbar />
//       <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">
//         {/* Welcome */}
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="font-serif text-2xl font-semibold text-brand-black dark:text-white">
//               Good {getTimeGreeting()}, {user?.email?.split('@')[0]}
//             </h1>
//             <p className="text-sm text-graphite dark:text-[#A0A0A0] mt-0.5">How are you doing today?</p>
//           </div>
//           <button onClick={signOut} className="text-xs text-graphite/50 dark:text-[#444] hover:text-graphite dark:hover:text-[#A0A0A0] transition-colors">Sign out</button>
//         </div>

//         {/* Quick actions */}
//         <div className="grid sm:grid-cols-3 gap-4 mb-8">
//           <Link to="/chat" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow group">
//             <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal">
//               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
//             </div>
//             <div>
//               <p className="font-semibold text-sm text-brand-black dark:text-white group-hover:text-teal transition-colors">Chat with NURO</p>
//               <p className="text-xs text-graphite dark:text-[#A0A0A0]">Your AI companion</p>
//             </div>
//           </Link>
//           <Link to="/therapists" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow group">
//             <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal">
//               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
//             </div>
//             <div>
//               <p className="font-semibold text-sm text-brand-black dark:text-white group-hover:text-teal transition-colors">Find Therapist</p>
//               <p className="text-xs text-graphite dark:text-[#A0A0A0]">Browse verified</p>
//             </div>
//           </Link>
//           <QuotaWidget quota={quota} />
//         </div>

//         <div className="grid md:grid-cols-2 gap-6">
//           {/* Upcoming Sessions */}
//           <div className="space-y-3">
//             <h2 className="font-semibold text-brand-black dark:text-white">Upcoming Sessions</h2>
//             {loading && <div className="card p-8 animate-pulse bg-light-grey dark:bg-[#2A2A2A]" />}
//             {!loading && confirmedBookings.length === 0 && upcomingSessions.length === 0 && (
//               <div className="card p-6 text-center">
//                 <p className="text-sm text-graphite dark:text-[#A0A0A0] mb-3">No upcoming sessions</p>
//                 <Link to="/therapists" className="btn-primary text-sm py-2 px-4">Book a session</Link>
//               </div>
//             )}
//             {upcomingSessions.map((s) => (
//               <div key={s.id} className="card p-4 flex items-center gap-3">
//                 <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal font-semibold text-sm">
//                   {new Date(s.session_at).getDate()}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="font-medium text-sm text-brand-black dark:text-white truncate">{s.therapists?.name || 'Therapist'}</p>
//                   <p className="text-xs text-graphite dark:text-[#A0A0A0]">{formatters.datetime(s.session_at)}</p>
//                 </div>
//                 {s.meet_link && (
//                   <a href={`https://${s.meet_link}`} target="_blank" rel="noopener noreferrer" className="text-xs text-teal hover:underline shrink-0">Join →</a>
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* Pending Requests */}
//           <div className="space-y-3">
//             <h2 className="font-semibold text-brand-black dark:text-white">Booking Requests</h2>
//             {!loading && pendingBookings.length === 0 && (
//               <div className="card p-6 text-center">
//                 <p className="text-sm text-graphite dark:text-[#A0A0A0]">No pending requests</p>
//               </div>
//             )}
//             {pendingBookings.map((b) => (
//               <div key={b.id} className="card p-4 space-y-2">
//                 <div className="flex items-center justify-between">
//                   <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">Pending</span>
//                   <span className="text-xs text-graphite/50 dark:text-[#444]">{formatters.relative(b.created_at)}</span>
//                 </div>
//                 <p className="text-sm text-brand-black dark:text-white font-medium">Awaiting therapist confirmation</p>
//                 <button
//                   onClick={() => cancelBooking(b.id)}
//                   className="text-xs text-red-400 hover:text-red-600 transition-colors"
//                 >
//                   Cancel request
//                 </button>
//               </div>
//             ))}
//           </div>

//           {/* Saved Therapists */}
//           <div className="md:col-span-2 space-y-3">
//             <h2 className="font-semibold text-brand-black dark:text-white">My Therapists</h2>
//             {!loading && savedTherapists.length === 0 && (
//               <div className="card p-6 text-center">
//                 <p className="text-sm text-graphite dark:text-[#A0A0A0] mb-3">No saved therapists yet</p>
//                 <Link to="/therapists" className="btn-outline text-sm py-2 px-4">Browse therapists</Link>
//               </div>
//             )}
//             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               {savedTherapists.map((st) => {
//                 const t = st.therapists
//                 return t ? (
//                   <Link key={st.therapist_id} to={`/therapists/${st.therapist_id}`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
//                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal/20 to-teal/10 flex items-center justify-center font-semibold text-teal text-sm">
//                       {formatters.initials(t.name)}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="font-medium text-sm text-brand-black dark:text-white truncate">{t.name}</p>
//                       <p className="text-xs text-graphite dark:text-[#A0A0A0] truncate">{(t.specializations || []).slice(0, 2).join(', ')}</p>
//                     </div>
//                   </Link>
//                 ) : null
//               })}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// function getTimeGreeting() {
//   const h = new Date().getHours()
//   if (h < 12) return 'morning'
//   if (h < 17) return 'afternoon'
//   return 'evening'
// }

// // CHANGE THIS FILE IF YOU WANT TO: add mood check-in widget, add session history, add usage stats
