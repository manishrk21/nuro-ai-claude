# NURO AI — FILEMAP
> Edit this guide whenever you want to know which file to touch.

---

## FRONTEND (`frontend/src/`)

### Pages — edit when you want to change a full screen
| File | What to edit it for |
|------|---------------------|
| `pages/LandingPage.jsx` | Rearrange homepage sections, change layout |
| `pages/AuthPage.jsx` | Change login/signup flow, add magic link |
| `pages/OnboardingPage.jsx` | Add/remove onboarding steps, change validation |
| `pages/ChatPage.jsx` | Change the chat screen layout |
| `pages/TherapistsPage.jsx` | Change filter UI, listing layout |
| `pages/TherapistProfilePage.jsx` | Change individual therapist detail view |
| `pages/PatientDashboard.jsx` | Change what patients see after login |
| `pages/TherapistDashboard.jsx` | Change what therapists see, booking management |
| `pages/PricingPage.jsx` | Change pricing layout or billing toggle |

### Components — edit when you want to change a reusable piece of UI
| File | What to edit it for |
|------|---------------------|
| `components/layout/Navbar.jsx` | Nav links, logo, auth buttons |
| `components/layout/ProtectedRoute.jsx` | Auth redirect logic, loading state |
| `components/onboarding/ConsentScreen.jsx` | Consent text, styling |
| `components/chat/ChatWindow.jsx` | Message bubbles, streaming cursor |
| `components/chat/ChatInput.jsx` | Input box, send button, voice toggle |
| `components/chat/ChatSidebar.jsx` | Session list, new chat button |
| `components/chat/BotAvatar.jsx` | NURO avatar appearance |
| `components/chat/TypingIndicator.jsx` | Typing dots animation |
| `components/chat/VoiceMode.jsx` | Voice overlay UI |
| `components/booking/TherapistCard.jsx` | Therapist card in listing grid |
| `components/booking/BookingModal.jsx` | Multi-step booking flow |
| `components/booking/AvailabilityBadge.jsx` | Available/unavailable dot |
| `components/booking/TimeSlotPicker.jsx` | Calendar + time slot picker |

### Hooks — edit when you want to change data-fetching or state logic
| File | What to edit it for |
|------|---------------------|
| `hooks/useAuth.js` | Auth actions, error handling |
| `hooks/useChat.js` | Chat state, streaming, session logic |
| `hooks/useVoice.js` | STT/TTS behaviour, voice gender |
| `hooks/useTherapists.js` | Therapist filter state, fetching |
| `hooks/useBooking.js` | Booking actions and state |

### Services — edit when you want to change API calls
| File | What to edit it for |
|------|---------------------|
| `services/authService.js` | Supabase auth calls |
| `services/chatService.js` | Streaming endpoint, chat history |
| `services/therapistService.js` | Therapist API calls |
| `services/bookingService.js` | Booking API calls |
| `services/profileService.js` | User preferences, saved therapists |
| `services/calendarService.js` | Google Calendar link builder |
| `services/supabaseClient.js` | Supabase config |

### Constants — edit when you want to change copy or data (no JSX needed)
| File | What to edit it for |
|------|---------------------|
| `constants/landingContent.js` | ALL landing page text, chat animation, testimonials |
| `constants/pricingData.js` | Pricing tiers, features, amounts |
| `constants/onboardingQuestions.js` | Onboarding questions and options |

### Context
| File | What to edit it for |
|------|---------------------|
| `context/AuthContext.jsx` | User session, profile, consent state |
| `context/ThemeContext.jsx` | Dark/light mode toggle |

---

## BACKEND (`backend/`)

| File | What to edit it for |
|------|---------------------|
| `main.py` | CORS, routers, startup logic |
| `constants/ai_config.py` | **NURO system prompt — ONLY edit here** |
| `services/ai_service.py` | AI provider fallback chain, timeouts |
| `services/crisis_service.py` | Crisis keywords, AI classifier, crisis levels |
| `services/booking_service.py` | Booking business logic |
| `routers/health.py` | Health check endpoint |
| `routers/auth.py` | Profile and consent endpoints |
| `routers/chat.py` | SSE streaming endpoint, quota check |
| `routers/therapists.py` | Therapist listing and profile endpoints |
| `routers/bookings.py` | Booking CRUD endpoints |
| `routers/notes.py` | Session notes endpoints |
| `repositories/profile_repo.py` | profiles + user_preferences SQL |
| `repositories/chat_repo.py` | chat_sessions + chat_messages SQL |
| `repositories/therapist_repo.py` | therapists SQL |
| `repositories/booking_repo.py` | booking_requests + confirmed_sessions SQL |
| `utils/supabase_client.py` | Supabase service client, JWT verification |
| `db/schema.sql` | Full database schema + RLS policies |

---

## NEVER TOUCH (by design)
- `constants/ai_config.py` is never imported by any frontend file
- No API keys in any frontend file
- No SQL in any router file — SQL lives in `repositories/` only
- No business logic in React components — logic lives in hooks/services


<!-- ## Plan: Therapist End Session Flow

TL;DR: Add a therapist dashboard flow that lets therapists mark confirmed sessions complete, move them out of upcoming sessions, and surface them in a past-history section by updating the frontend UI, booking state hook, API service, backend router/service, and DB status handling.

**Steps**
1. Frontend UI update in `frontend/src/pages/TherapistDashboard.jsx`
   - Add `End Session` or `Meeting Done` button near the existing `Join Meet` action.
   - Show a small confirmation modal before marking complete.
   - Add a separate `History` or `Past Sessions` section for `completed` bookings.
   - Filter the existing booking list into `confirmedBookings` and `completedBookings` so completed sessions leave the upcoming area immediately.
2. Frontend state action in `frontend/src/hooks/useBooking.js`
   - Add a `completeBooking` function to call the new API and update local `bookings` state.
   - Update local state so the session disappears from the upcoming list and appears in completed history without refresh.
3. Frontend API layer in `frontend/src/services/bookingService.js`
   - Add `completeBooking(bookingId)` to POST to `/api/bookings/{bookingId}/complete`.
4. Backend router in `backend/routers/bookings.py`
   - Add a new POST route for `/bookings/{booking_id}/complete`.
   - Authorize the therapist via their profile, matching `therapist_id` ownership.
5. Backend business logic in `backend/services/booking_service.py`
   - Add `complete_booking` to validate booking ownership and update the status.
   - Optionally update both `booking_requests` and `confirmed_sessions` records for consistency.
6. Backend repository in `backend/repositories/booking_repo.py`
   - Extend the status update logic to support `completed` and update the confirmed session row if needed.
7. Database schema in `backend/db/schema.sql`
   - Add `completed` to the `booking_requests.status` CHECK constraint.
   - Optionally add `completed` to `confirmed_sessions.status` if strict status validation is enforced.
8. Optional patient-side consistency in `frontend/src/services/profileService.js`
   - If completed sessions are stored in `confirmed_sessions`, update `getUpcomingSessions` to only return `status='confirmed'` sessions.

**Relevant files**
- `frontend/src/pages/TherapistDashboard.jsx` — UI rendering, button placement, modal, history section.
- `frontend/src/hooks/useBooking.js` — booking state and complete-session action.
- `frontend/src/services/bookingService.js` — authFetch network helper and complete endpoint.
- `backend/routers/bookings.py` — new API route and therapist authorization.
- `backend/services/booking_service.py` — business logic for marking session complete.
- `backend/repositories/booking_repo.py` — DB update path for booking/session status.
- `backend/db/schema.sql` — allow `completed` status in schema rules.
- `frontend/src/services/profileService.js` — optional update for patient upcoming-session filtering.

**Verification**
1. Therapist dashboard shows upcoming confirmed sessions and a separate completed history section.
2. Clicking `End Session` opens a confirmation modal.
3. Confirming the action removes the session from upcoming and adds it to history immediately.
4. Backend route `/api/bookings/{bookingId}/complete` updates the DB status to `completed`.
5. Completed sessions no longer appear in upcoming session queries.

**Decisions**
- Use `booking_requests.status='completed'` as the primary owner state for therapist sessions, since therapist dashboard booking feeds are based on booking_requests.
- Also update `confirmed_sessions.status` if present to keep patient-side upcoming session logic consistent.

**Further considerations**
1. If you want therapist history to persist across page loads, the dashboard can derive history from `bookings.filter(b => b.status === 'completed')` rather than needing a separate API.
2. If final behavior should be more strict, implement a time-check in `complete_booking` so only sessions whose scheduled time has passed can be ended.
3. If patient dashboard should also show past sessions, add a dedicated `getPastSessions` query or filter in `profileService.js`. -->