// FILE: layout/ProtectedRoute.jsx | PURPOSE: Redirect unauthenticated users or un-onboarded patients safely | CONNECTS TO: App.jsx, AuthContext.jsx

import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext.jsx'

export default function ProtectedRoute() {
  const { isAuthenticated, profile, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-[#121212]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-graphite dark:text-[#A0A0A0]">Loading…</p>
        </div>
      </div>
    )
  }

  // 1. If not authenticated at all, redirect to auth screen
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  // 2. Intercept patient roles who haven't completed their multi-step profile setups
  // 2. Intercept users who haven't accepted consent — route them to /auth
  if (profile && !profile?.consent_accepted) {
    return <Navigate to="/auth" replace />
  }

  // 3. Intercept patient roles who haven't completed their multi-step profile setups
  if (profile?.role === 'patient' && !profile?.onboarding_complete) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}


// // FILE: components/layout/ProtectedRoute.jsx | PURPOSE: Auth check and onboarding route guard redirection

// import { Navigate, useLocation } from 'react-router-dom'
// import { useAuthContext } from '../../context/AuthContext.jsx'

// export default function ProtectedRoute({ children, allowedRoles }) {
//   const { user, profile, loading } = useAuthContext()
//   const location = useLocation()

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-[#121212]">
//         <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
//       </div>
//     )
//   }

//   // 1. If not authenticated at all, redirect to auth screen
//   if (!user) {
//     return <Navigate to="/auth" state={{ from: location }} replace />
//   }

//   // 2. If a specific role permission check fails, bounce back to homepage
//   if (allowedRoles && !allowedRoles.includes(profile?.role)) {
//     return <Navigate to="/" replace />
//   }

//   // 3. ─── MANDATORY PATIENT ONBOARDING INTERCEPTOR ───
//   // Force patients to complete their questionnaire (name, age, country) before visiting any dashboard pages
//   if (
//     profile?.role === 'patient' && 
//     !profile?.onboarding_complete && 
//     location.pathname !== '/onboarding'
//   ) {
//     return <Navigate to="/onboarding" replace />
//   }

//   return children
// }





// // FILE: layout/ProtectedRoute.jsx | PURPOSE: Redirect unauthenticated users to /auth | CONNECTS TO: App.jsx, AuthContext.jsx

// import { Navigate, Outlet } from 'react-router-dom'
// import { useAuthContext } from '../../context/AuthContext.jsx'

// export default function ProtectedRoute() {
//   const { isAuthenticated, loading } = useAuthContext()

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-[#121212]">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
//           <p className="text-sm text-graphite dark:text-[#A0A0A0]">Loading…</p>
//         </div>
//       </div>
//     )
//   }

//   return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />
// }

// // CHANGE THIS FILE IF YOU WANT TO: add role-based route protection, add loading skeleton
