# NURO AI — Deployment Checklist

## 1. SUPABASE

```bash
# 1a. Create project at https://supabase.com/dashboard
# Note your: Project URL, anon key, service role key

# 1b. Run schema in SQL Editor (Supabase Dashboard > SQL Editor)
# Paste contents of backend/db/schema.sql and run

# 1c. Verify RLS is enabled on every table
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
# Every table should show rowsecurity = true

# 1d. Enable Google OAuth
# Auth > Providers > Google — add Client ID + Secret
# Add your Vercel URL to redirect allowlist:
# https://your-app.vercel.app/auth/callback

# 1e. Create Storage buckets
# Storage > New bucket: "profile-photos" (public = true)
# Storage > New bucket: "therapist-docs" (public = false)
```

---

## 2. RENDER (Backend)

```bash
# 2a. New Web Service → connect GitHub → root dir: backend/
# Build command:
pip install -r requirements.txt

# Start command:
uvicorn main:app --host 0.0.0.0 --port $PORT

# 2b. Add environment variables in Render dashboard:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
ELEVENLABS_API_KEY=          # optional
FRONTEND_URL=https://your-app.vercel.app
SELF_URL=https://your-backend.onrender.com

# 2c. Verify health endpoint
curl https://your-backend.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## 3. VERCEL (Frontend)

```bash
# 3a. New Project → connect GitHub → root dir: frontend/
# Framework preset: Vite
# Build command: npm run build
# Output directory: dist

# 3b. Add environment variables in Vercel dashboard:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-backend.onrender.com

# 3c. vercel.json is already present in frontend/ — handles SPA routing

# 3d. Add Vercel URL to Supabase Auth redirect allowlist
# Supabase > Auth > URL Configuration > Redirect URLs:
# https://your-app.vercel.app/**
```

---

## 4. END-TO-END VERIFICATION CHECKLIST

```
[ ] Landing page loads and /api/health ping fires silently (check Network tab)
[ ] Sign up with email → consent screen appears → onboarding completes → dashboard loads
[ ] Google OAuth flow works (sign in, redirect, profile created)
[ ] Chat with NURO → messages stream token by token → saved to Supabase chat_messages
[ ] Message quota increments in message_quotas table and blocks at 50 (free tier)
[ ] Crisis keyword in chat ("I want to hurt myself") → crisis_events row created in DB
[ ] Browse therapists page loads with filters working
[ ] Book a therapist session → booking_requests row appears in DB with status=pending
[ ] Therapist accepts booking → confirmed_sessions row created + meet link generated
[ ] Accepted booking appears in patient dashboard
[ ] Dark mode toggle persists across browser refresh (check localStorage key: mark_theme)
[ ] Voice mode opens and microphone prompt appears (HTTPS required)
[ ] Self-ping logs appear in Render logs every 14 minutes
```

---

## 5. COMMON ISSUES

| Problem | Fix |
|---------|-----|
| CORS errors | Check `FRONTEND_URL` env var on Render matches exact Vercel URL |
| Auth redirects fail | Add Vercel URL to Supabase redirect allowlist |
| Cold start timeouts | Verify self-ping is running (check Render logs) |
| Supabase RLS blocking backend | Backend uses service key — bypasses RLS by design |
| Voice not working | Voice requires HTTPS — works on Vercel, not localhost unless using mkcert |
| Quota not incrementing | Run `increment_quota` function migration in Supabase SQL editor |
