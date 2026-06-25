// FILE: layout/Navbar.jsx | PURPOSE: Sticky navigation bar with dark mode toggle | CONNECTS TO: LandingPage.jsx, ThemeContext.jsx, AuthContext.jsx

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useAuthContext } from '../../context/AuthContext.jsx'
import { landingContent } from '../../constants/landingContent.js'

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const { isAuthenticated, role, signOut } = useAuthContext()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const dashboardHref = role === 'therapist' ? '/dashboard/therapist' : '/dashboard'

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-serif text-xl font-semibold text-teal tracking-tight">
          {landingContent.nav.logo}
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {landingContent.nav.links.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className={
                  link.highlight
                    ? 'text-sm font-semibold text-teal hover:text-teal-600 transition-colors'
                    : 'text-sm font-medium text-graphite hover:text-brand-black dark:text-[#A0A0A0] dark:hover:text-white transition-colors'
                }
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="w-9 h-9 rounded-full flex items-center justify-center text-graphite hover:bg-light-grey dark:text-[#A0A0A0] dark:hover:bg-[#2A2A2A] transition-colors"
          >
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06a.996.996 0 0 0 0 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0zM7.05 18.36l-1.06 1.06a.996.996 0 0 0 0 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0z"/></svg>
            )}
          </button>

          {isAuthenticated ? (
            <>
              <Link to={dashboardHref} className="btn-outline text-sm hidden md:inline-flex">Dashboard</Link>
              <button onClick={handleSignOut} className="btn-primary text-sm">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/auth" className="btn-outline text-sm hidden md:inline-flex">Log in</Link>
              <Link to="/auth?mode=signup" className="btn-primary text-sm">Get Started</Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center text-graphite dark:text-[#A0A0A0]"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-[#1A1A1A] border-t border-light-grey dark:border-[#2E2E2E] px-6 py-4 space-y-3">
          {landingContent.nav.links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-graphite dark:text-[#A0A0A0] py-1"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <button onClick={handleSignOut} className="text-sm text-red-500 py-1">Sign out</button>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-teal py-1">Log in</Link>
          )}
        </div>
      )}
    </header>
  )
}

// CHANGE THIS FILE IF YOU WANT TO: add notification bell, add user avatar dropdown, change nav links
