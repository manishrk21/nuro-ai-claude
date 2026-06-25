-- FILE: db/schema.sql | PURPOSE: Complete Supabase database schema with RLS | CONNECTS TO: All backend repositories

-- ─────────────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role                 TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'therapist', 'admin')),
    onboarding_complete  BOOLEAN NOT NULL DEFAULT FALSE,
    consent_accepted     BOOLEAN NOT NULL DEFAULT FALSE,
    consent_accepted_at  TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    onboarding_data   JSONB NOT NULL DEFAULT '{}',
    financial_comfort TEXT CHECK (financial_comfort IN ('Comfortable', 'Managing', 'Struggling')),
    sleep_quality     TEXT CHECK (sleep_quality IN ('Good', 'Inconsistent', 'Poor')),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Therapists
CREATE TABLE IF NOT EXISTS therapists (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name                  TEXT NOT NULL,
    photo_url             TEXT,
    specializations       TEXT[] NOT NULL DEFAULT '{}',
    license_type          TEXT,
    license_number        TEXT,
    years_experience      INT NOT NULL DEFAULT 0,
    languages             TEXT[] NOT NULL DEFAULT '{"English"}',
    fee_per_session       NUMERIC(10,2) NOT NULL DEFAULT 0,
    available             BOOLEAN NOT NULL DEFAULT TRUE,
    bio                   TEXT,
    verified_status       TEXT NOT NULL DEFAULT 'pending'
                          CHECK (verified_status IN ('pending','under_review','verified','rejected','suspended')),
    verification_docs_url TEXT,
    verified_at           TIMESTAMPTZ,
    reviewer_notes        TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_therapists_available ON therapists(available);
CREATE INDEX IF NOT EXISTS idx_therapists_status ON therapists(verified_status);

-- Therapist availability
CREATE TABLE IF NOT EXISTS therapist_availability (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id  UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_availability_therapist ON therapist_availability(therapist_id);

-- Booking requests
CREATE TABLE IF NOT EXISTS booking_requests (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    therapist_id   UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    requested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','rejected','cancelled','completed','no_show')),
    proposed_slots JSONB NOT NULL DEFAULT '[]',
    meet_link      TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_patient ON booking_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_therapist ON booking_requests(therapist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON booking_requests(status);

-- Confirmed sessions
CREATE TABLE IF NOT EXISTS confirmed_sessions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id        UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
    patient_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    therapist_id      UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    session_at        TIMESTAMPTZ NOT NULL,
    duration_minutes  INT NOT NULL DEFAULT 60,
    status            TEXT NOT NULL DEFAULT 'confirmed'
                      CHECK (status IN ('confirmed','completed')),
    meet_link         TEXT,
    calendar_event_id TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON confirmed_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist ON confirmed_sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_at ON confirmed_sessions(session_at);

-- Session notes (therapist private)
CREATE TABLE IF NOT EXISTS session_notes (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id   UUID REFERENCES confirmed_sessions(id) ON DELETE SET NULL,
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL DEFAULT 'New conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id   UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role         TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content      TEXT NOT NULL,
    tokens_used  INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

-- Saved therapists
CREATE TABLE IF NOT EXISTS saved_therapists (
    patient_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    therapist_id  UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (patient_id, therapist_id)
);

-- Therapist reviews
CREATE TABLE IF NOT EXISTS therapist_reviews (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    session_id   UUID REFERENCES confirmed_sessions(id) ON DELETE SET NULL,
    rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crisis events
CREATE TABLE IF NOT EXISTS crisis_events (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id        UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    message_id        UUID,
    severity          TEXT NOT NULL CHECK (severity IN ('low','moderate','high','emergency')),
    detected_by       TEXT NOT NULL DEFAULT 'keyword' CHECK (detected_by IN ('keyword','classifier','keyword+classifier')),
    notified_therapist BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crisis_user ON crisis_events(user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    read       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT,
    entity_id   UUID,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message quotas
CREATE TABLE IF NOT EXISTS message_quotas (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date    DATE NOT NULL,
    count   INT NOT NULL DEFAULT 0,
    plan    TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
    UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_quotas_user_date ON message_quotas(user_id, date);

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Atomic quota increment to avoid race conditions
CREATE OR REPLACE FUNCTION increment_quota(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO message_quotas (user_id, date, count)
    VALUES (p_user_id, p_date, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET count = message_quotas.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmed_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_therapists     ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_quotas       ENABLE ROW LEVEL SECURITY;

-- Profiles: own row only
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = user_id);

-- User preferences: own row only
CREATE POLICY "prefs_own" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Therapists: read verified = public; write own only
CREATE POLICY "therapists_read" ON therapists FOR SELECT USING (verified_status = 'verified' OR auth.uid() = user_id);
-- CREATE POLICY "therapists_write_own" ON therapists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "therapists_insert_own" ON therapists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "therapists_update_own" ON therapists FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Therapist availability: public read; therapist write own
CREATE POLICY "availability_read" ON therapist_availability FOR SELECT USING (TRUE);
CREATE POLICY "availability_write" ON therapist_availability FOR ALL
    USING (therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid()));

-- Booking requests: patient sees own; therapist sees their bookings
CREATE POLICY "bookings_patient" ON booking_requests FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "bookings_therapist" ON booking_requests FOR SELECT
    USING (therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid()));
-- CREATE POLICY "bookings_therapist_update" ON booking_requests FOR UPDATE
--     USING (therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "bookings_therapist_update" ON booking_requests;

CREATE POLICY "bookings_therapist_update" ON booking_requests 
    FOR UPDATE 
    USING (therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid()))
    WITH CHECK (therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid()));


-- Confirmed sessions: patient sees own; therapist sees their sessions
CREATE POLICY "sessions_patient" ON confirmed_sessions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "sessions_therapist" ON confirmed_sessions FOR ALL
    USING (therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid()));

-- Session notes: therapist sees only their own notes
CREATE POLICY "notes_therapist" ON session_notes FOR ALL
    USING (therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid()));

-- Chat sessions: own only
CREATE POLICY "chat_sessions_own" ON chat_sessions FOR ALL USING (auth.uid() = user_id);

-- Chat messages: via session ownership
CREATE POLICY "chat_messages_own" ON chat_messages FOR ALL
    USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

-- Saved therapists: own only
CREATE POLICY "saved_own" ON saved_therapists FOR ALL USING (auth.uid() = patient_id);

-- Reviews: patients can write own; public can read
CREATE POLICY "reviews_read" ON therapist_reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_write_own" ON therapist_reviews FOR INSERT USING (auth.uid() = patient_id);

-- Crisis events: own only
CREATE POLICY "crisis_own" ON crisis_events FOR ALL USING (auth.uid() = user_id);

-- Notifications: own only
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Message quotas: own only
CREATE POLICY "quotas_own" ON message_quotas FOR ALL USING (auth.uid() = user_id);
