// FILE: App.jsx | PURPOSE: Root router and global context providers | CONNECTS TO: All pages, AuthContext, ThemeContext

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'

import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import TherapistOnboardingPage from './pages/TherapistOnboardingPage.jsx'
import TherapistProfileEditPage from './pages/TherapistProfileEditPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import TherapistsPage from './pages/TherapistsPage.jsx'
import TherapistProfilePage from './pages/TherapistProfilePage.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import TherapistDashboard from './pages/TherapistDashboard.jsx'
import PricingPage from './pages/PricingPage.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/pricing" element={<PricingPage />} />

            {/* ─── FIX: Move Patient Onboarding Outside of Protected Layout ─── */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Protected Layout — requires authentication */}
            <Route element={<ProtectedRoute />}>
              {/* Therapist onboarding — separate multi-step form */}
              <Route path="/onboarding/therapist" element={<TherapistOnboardingPage />} />
              <Route path="/dashboard/therapist/edit-profile" element={<TherapistProfileEditPage />} />

              {/* Application Core Core Routes */}
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/therapists" element={<TherapistsPage />} />
              <Route path="/therapists/:id" element={<TherapistProfilePage />} />
              <Route path="/dashboard" element={<PatientDashboard />} />
              <Route path="/dashboard/therapist" element={<TherapistDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}





// // FILE: App.jsx | PURPOSE: Root router and global context providers | CONNECTS TO: All pages, AuthContext, ThemeContext

// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { AuthProvider } from './context/AuthContext.jsx'
// import { ThemeProvider } from './context/ThemeContext.jsx'
// import ProtectedRoute from './components/layout/ProtectedRoute.jsx'

// import LandingPage from './pages/LandingPage.jsx'
// import AuthPage from './pages/AuthPage.jsx'
// import OnboardingPage from './pages/OnboardingPage.jsx'
// import TherapistOnboardingPage from './pages/TherapistOnboardingPage.jsx'
// import ChatPage from './pages/ChatPage.jsx'
// import TherapistsPage from './pages/TherapistsPage.jsx'
// import TherapistProfilePage from './pages/TherapistProfilePage.jsx'
// import PatientDashboard from './pages/PatientDashboard.jsx'
// import TherapistDashboard from './pages/TherapistDashboard.jsx'
// import PricingPage from './pages/PricingPage.jsx'

// export default function App() {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <BrowserRouter>
//           <Routes>
//             {/* Public */}
//             <Route path="/" element={<LandingPage />} />
//             <Route path="/auth" element={<AuthPage />} />
//             <Route path="/pricing" element={<PricingPage />} />

//             {/* Protected — require login */}
//             <Route element={<ProtectedRoute />}>
//               {/* Patient onboarding */}
//               <Route path="/onboarding" element={<OnboardingPage />} />

//               {/* Therapist onboarding — separate multi-step form */}
//               <Route path="/onboarding/therapist" element={<TherapistOnboardingPage />} />

//               {/* App */}
//               <Route path="/chat" element={<ChatPage />} />
//               <Route path="/therapists" element={<TherapistsPage />} />
//               <Route path="/therapists/:id" element={<TherapistProfilePage />} />
//               <Route path="/dashboard" element={<PatientDashboard />} />
//               <Route path="/dashboard/therapist" element={<TherapistDashboard />} />
//             </Route>

//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Routes>
//         </BrowserRouter>
//       </AuthProvider>
//     </ThemeProvider>
//   )
// }

// // CHANGE THIS FILE IF YOU WANT TO: add new routes, add admin panel route, add public therapist profile route
