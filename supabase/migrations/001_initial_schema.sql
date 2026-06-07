-- ============================================================
-- SahyadriBook - Trek Booking Platform
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('trekker', 'organizer', 'admin');
CREATE TYPE organizer_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE difficulty_level AS ENUM ('easy', 'moderate', 'difficult', 'very_difficult');
CREATE TYPE event_status AS ENUM ('upcoming', 'full', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'refunded');
CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'failed', 'refunded');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE child_price_policy AS ENUM ('same_price', 'discounted', 'free_under_age');

-- ============================================================
-- TABLES
-- ============================================================

-- 1. profiles (extends auth.users)
CREATE TABLE profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role          user_role NOT NULL DEFAULT 'trekker',
    full_name     TEXT NOT NULL,
    phone         TEXT,
    avatar_url    TEXT,
    city          TEXT DEFAULT 'Pune',
    youtube_channel_url TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. organizers
CREATE TABLE organizers (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id           UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    org_name             TEXT NOT NULL,
    slug                 TEXT UNIQUE NOT NULL,
    description          TEXT,
    logo_url             TEXT,
    phone                TEXT NOT NULL,
    email                TEXT NOT NULL,
    is_verified          BOOLEAN NOT NULL DEFAULT FALSE,
    commission_rate      DECIMAL(4,2) NOT NULL DEFAULT 10.00,
    avg_rating           DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    total_reviews        INT NOT NULL DEFAULT 0,
    status               organizer_status NOT NULL DEFAULT 'pending',
    agreement_signed_at  TIMESTAMPTZ,
    free_period_ends_at  TIMESTAMPTZ,
    bank_account_name    TEXT,
    bank_account_number  TEXT,
    bank_ifsc            TEXT,
    default_cancellation_rules JSONB DEFAULT '[{"hours_before": 48, "refund_percent": 100}, {"hours_before": 24, "refund_percent": 50}, {"hours_before": 0, "refund_percent": 0}]'::jsonb,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. treks
CREATE TABLE treks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id        UUID NOT NULL REFERENCES organizers(id) ON DELETE RESTRICT,
    title               TEXT NOT NULL,
    slug                TEXT UNIQUE NOT NULL,
    description         TEXT,
    short_desc          TEXT,
    difficulty          difficulty_level NOT NULL DEFAULT 'moderate',
    duration_days       INT NOT NULL DEFAULT 1,
    distance_km         DECIMAL(5,1),
    elevation_m         INT,
    region              TEXT,
    meeting_point       TEXT,
    meeting_point_url   TEXT,
    inclusions          TEXT[],
    exclusions          TEXT[],
    things_to_carry     TEXT[],
    cancellation_policy TEXT,
    cancellation_rules  JSONB DEFAULT '[{"hours_before": 48, "refund_percent": 100}, {"hours_before": 24, "refund_percent": 50}, {"hours_before": 0, "refund_percent": 0}]'::jsonb,
    is_child_friendly   BOOLEAN NOT NULL DEFAULT FALSE,
    min_child_age       INT,
    child_price_policy  child_price_policy,
    itinerary           JSONB DEFAULT '[]'::jsonb,
    default_adult_price DECIMAL(8,2),
    default_child_price DECIMAL(8,2),
    is_published        BOOLEAN NOT NULL DEFAULT FALSE,
    default_pickup_points JSONB DEFAULT '[]'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. trek_images
CREATE TABLE trek_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trek_id     UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    image_url   TEXT NOT NULL,
    alt_text    TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    is_cover    BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5. trek_events
CREATE TABLE trek_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trek_id         UUID NOT NULL REFERENCES treks(id) ON DELETE RESTRICT,
    event_date      DATE NOT NULL,
    end_date        DATE,
    reporting_time  TIME NOT NULL,
    price           DECIMAL(8,2) NOT NULL,
    child_price     DECIMAL(8,2),
    total_seats     INT NOT NULL,
    booked_seats    INT NOT NULL DEFAULT 0,
    status          event_status NOT NULL DEFAULT 'upcoming',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_booked_seats CHECK (booked_seats <= total_seats)
);

CREATE INDEX idx_trek_events_trek_date ON trek_events (trek_id, event_date);

-- 6. pickup_points
CREATE TABLE pickup_points (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trek_event_id   UUID NOT NULL REFERENCES trek_events(id) ON DELETE CASCADE,
    label           TEXT NOT NULL,
    address         TEXT,
    maps_url        TEXT,
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    pickup_time     TIME NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    extra_charge    DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pickup_points_event_order ON pickup_points (trek_event_id, sort_order);

-- 7. bookings
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number      TEXT UNIQUE NOT NULL,
    trek_event_id       UUID NOT NULL REFERENCES trek_events(id) ON DELETE RESTRICT,
    trekker_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    num_adults          INT NOT NULL DEFAULT 1,
    num_children        INT NOT NULL DEFAULT 0,
    total_amount        DECIMAL(10,2) NOT NULL,
    platform_fee        DECIMAL(10,2) NOT NULL,
    organizer_amount    DECIMAL(10,2) NOT NULL,
    status              booking_status NOT NULL DEFAULT 'pending',
    booking_name        TEXT NOT NULL,
    booking_phone       TEXT NOT NULL,
    booking_email       TEXT NOT NULL,
    emergency_contact   TEXT,
    special_requests    TEXT,
    selected_pickup_id  UUID REFERENCES pickup_points(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at        TIMESTAMPTZ,
    cancellation_reason TEXT
);

CREATE INDEX idx_bookings_trekker ON bookings (trekker_id);
CREATE INDEX idx_bookings_event ON bookings (trek_event_id);

-- 8. payments
CREATE TABLE payments (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id           UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    razorpay_order_id    TEXT UNIQUE,
    razorpay_payment_id  TEXT UNIQUE,
    razorpay_signature   TEXT,
    amount               DECIMAL(10,2) NOT NULL,
    currency             TEXT NOT NULL DEFAULT 'INR',
    status               payment_status NOT NULL DEFAULT 'created',
    method               TEXT,
    paid_at              TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments (booking_id);

-- 9. payouts
CREATE TABLE payouts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id     UUID NOT NULL REFERENCES organizers(id) ON DELETE RESTRICT,
    trek_event_id    UUID NOT NULL REFERENCES trek_events(id) ON DELETE RESTRICT,
    total_collected  DECIMAL(10,2) NOT NULL,
    commission       DECIMAL(10,2) NOT NULL,
    payout_amount    DECIMAL(10,2) NOT NULL,
    status           payout_status NOT NULL DEFAULT 'pending',
    paid_at          TIMESTAMPTZ,
    reference_id     TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_organizer ON payouts (organizer_id);

-- 10. reviews
CREATE TABLE reviews (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id   UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    trek_id      UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    trekker_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating       INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment      TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_trek ON reviews (trek_id);

-- 11. trekker_videos
CREATE TABLE trekker_videos (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trekker_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trek_id      UUID REFERENCES treks(id) ON DELETE SET NULL,
    youtube_url  TEXT NOT NULL,
    title        TEXT,
    sort_order   INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_trekker_youtube UNIQUE (trekker_id, youtube_url)
);

CREATE INDEX idx_trekker_videos_trekker ON trekker_videos (trekker_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- 1. Atomic seat booking: increments booked_seats, flips status to 'full' when needed
CREATE OR REPLACE FUNCTION book_seats(
    p_event_id   UUID,
    p_num_persons INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_seats  INT;
    v_booked_seats INT;
BEGIN
    -- Lock the row for update to prevent race conditions
    SELECT total_seats, booked_seats
    INTO v_total_seats, v_booked_seats
    FROM trek_events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trek event not found: %', p_event_id;
    END IF;

    IF (v_booked_seats + p_num_persons) > v_total_seats THEN
        RAISE EXCEPTION 'Not enough seats available. Requested: %, Available: %',
            p_num_persons, (v_total_seats - v_booked_seats);
    END IF;

    UPDATE trek_events
    SET
        booked_seats = booked_seats + p_num_persons,
        status = CASE
            WHEN (booked_seats + p_num_persons) >= total_seats THEN 'full'::event_status
            ELSE status
        END
    WHERE id = p_event_id;
END;
$$;

-- 2. Release seats on booking cancellation: decrements booked_seats, restores status to 'upcoming' if no longer full
CREATE OR REPLACE FUNCTION release_seats(p_event_id UUID, p_num_persons INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE trek_events
    SET booked_seats = GREATEST(0, booked_seats - p_num_persons),
        status = CASE
            WHEN (booked_seats - p_num_persons) < total_seats THEN 'upcoming'::event_status
            ELSE status
        END
    WHERE id = p_event_id;
END;
$$;

-- 3. Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO profiles (id, role, full_name, phone, avatar_url)
    VALUES (
        NEW.id,
        -- SECURITY: Only allow 'trekker' or 'organizer' — never 'admin' via self-signup
        CASE
            WHEN (NEW.raw_user_meta_data->>'role') IN ('trekker', 'organizer') THEN
                (NEW.raw_user_meta_data->>'role')::user_role
            ELSE 'trekker'::user_role
        END,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 3. Recalculate organizer avg_rating on review insert/update
CREATE OR REPLACE FUNCTION update_organizer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_organizer_id UUID;
BEGIN
    -- Resolve organizer_id through trek
    SELECT t.organizer_id INTO v_organizer_id
    FROM treks t
    WHERE t.id = COALESCE(NEW.trek_id, OLD.trek_id);

    IF v_organizer_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    UPDATE organizers
    SET
        avg_rating    = (
            SELECT ROUND(AVG(r.rating)::NUMERIC, 1)
            FROM reviews r
            JOIN treks t ON t.id = r.trek_id
            WHERE t.organizer_id = v_organizer_id
              AND r.is_published = TRUE
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews r
            JOIN treks t ON t.id = r.trek_id
            WHERE t.organizer_id = v_organizer_id
              AND r.is_published = TRUE
        )
    WHERE id = v_organizer_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_review_upsert
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_organizer_rating();

CREATE TRIGGER on_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_organizer_rating();

-- Helper to auto-update updated_at columns
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_treks_updated_at
    BEFORE UPDATE ON treks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE treks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_points  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE trekker_videos ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- profiles
-- -------------------------------------------------------

CREATE POLICY "profiles: anyone can read"
    ON profiles FOR SELECT
    USING (TRUE);

CREATE POLICY "profiles: users update own"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------
-- organizers
-- -------------------------------------------------------

CREATE POLICY "organizers: public read active"
    ON organizers FOR SELECT
    USING (status = 'active');

CREATE POLICY "organizers: organizer update own"
    ON organizers FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "organizers: organizer insert own"
    ON organizers FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- -------------------------------------------------------
-- treks
-- -------------------------------------------------------

CREATE POLICY "treks: public read published"
    ON treks FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "treks: organizer read own (unpublished)"
    ON treks FOR SELECT
    USING (
        organizer_id IN (
            SELECT id FROM organizers WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "treks: organizer insert"
    ON treks FOR INSERT
    WITH CHECK (
        organizer_id IN (
            SELECT id FROM organizers WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "treks: organizer update own"
    ON treks FOR UPDATE
    USING (
        organizer_id IN (
            SELECT id FROM organizers WHERE profile_id = auth.uid()
        )
    )
    WITH CHECK (
        organizer_id IN (
            SELECT id FROM organizers WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "treks: organizer delete own"
    ON treks FOR DELETE
    USING (
        organizer_id IN (
            SELECT id FROM organizers WHERE profile_id = auth.uid()
        )
    );

-- -------------------------------------------------------
-- trek_images
-- -------------------------------------------------------

CREATE POLICY "trek_images: public read for published treks"
    ON trek_images FOR SELECT
    USING (
        trek_id IN (SELECT id FROM treks WHERE is_published = TRUE)
    );

CREATE POLICY "trek_images: organizer manage own"
    ON trek_images FOR ALL
    USING (
        trek_id IN (
            SELECT t.id FROM treks t
            JOIN organizers o ON o.id = t.organizer_id
            WHERE o.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        trek_id IN (
            SELECT t.id FROM treks t
            JOIN organizers o ON o.id = t.organizer_id
            WHERE o.profile_id = auth.uid()
        )
    );

-- -------------------------------------------------------
-- trek_events
-- -------------------------------------------------------

CREATE POLICY "trek_events: public read for published treks"
    ON trek_events FOR SELECT
    USING (
        trek_id IN (SELECT id FROM treks WHERE is_published = TRUE)
    );

CREATE POLICY "trek_events: organizer manage own"
    ON trek_events FOR ALL
    USING (
        trek_id IN (
            SELECT t.id FROM treks t
            JOIN organizers o ON o.id = t.organizer_id
            WHERE o.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        trek_id IN (
            SELECT t.id FROM treks t
            JOIN organizers o ON o.id = t.organizer_id
            WHERE o.profile_id = auth.uid()
        )
    );

-- -------------------------------------------------------
-- pickup_points
-- -------------------------------------------------------

CREATE POLICY "pickup_points: public read"
    ON pickup_points FOR SELECT
    USING (TRUE);

CREATE POLICY "pickup_points: organizer manage own events"
    ON pickup_points FOR ALL
    USING (
        trek_event_id IN (
            SELECT te.id FROM trek_events te
            JOIN treks t ON t.id = te.trek_id
            JOIN organizers o ON o.id = t.organizer_id
            WHERE o.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        trek_event_id IN (
            SELECT te.id FROM trek_events te
            JOIN treks t ON t.id = te.trek_id
            JOIN organizers o ON o.id = t.organizer_id
            WHERE o.profile_id = auth.uid()
        )
    );

-- -------------------------------------------------------
-- bookings
-- -------------------------------------------------------

CREATE POLICY "bookings: trekker read own"
    ON bookings FOR SELECT
    USING (trekker_id = auth.uid());

CREATE POLICY "bookings: trekker insert own"
    ON bookings FOR INSERT
    WITH CHECK (trekker_id = auth.uid());

CREATE POLICY "bookings: trekker update own"
    ON bookings FOR UPDATE
    USING (trekker_id = auth.uid())
    WITH CHECK (trekker_id = auth.uid());

CREATE POLICY "bookings: organizer read their trek bookings"
    ON bookings FOR SELECT
    USING (
        trek_event_id IN (
            SELECT te.id FROM trek_events te
            JOIN treks t ON t.id = te.trek_id
            JOIN organizers o ON o.id = t.organizer_id
            WHERE o.profile_id = auth.uid()
        )
    );

-- -------------------------------------------------------
-- payments
-- -------------------------------------------------------

CREATE POLICY "payments: trekker read own"
    ON payments FOR SELECT
    USING (
        booking_id IN (
            SELECT id FROM bookings WHERE trekker_id = auth.uid()
        )
    );

CREATE POLICY "payments: trekker insert own"
    ON payments FOR INSERT
    WITH CHECK (
        booking_id IN (
            SELECT id FROM bookings WHERE trekker_id = auth.uid()
        )
    );

CREATE POLICY "payments: organizer read related"
    ON payments FOR SELECT
    USING (
        booking_id IN (
            SELECT b.id FROM bookings b
            JOIN trek_events te ON te.id = b.trek_event_id
            JOIN treks t ON t.id = te.trek_id
            JOIN organizers o ON o.id = t.organizer_id
            WHERE o.profile_id = auth.uid()
        )
    );

-- -------------------------------------------------------
-- payouts
-- -------------------------------------------------------

CREATE POLICY "payouts: organizer read own"
    ON payouts FOR SELECT
    USING (
        organizer_id IN (
            SELECT id FROM organizers WHERE profile_id = auth.uid()
        )
    );

-- -------------------------------------------------------
-- reviews
-- -------------------------------------------------------

CREATE POLICY "reviews: public read published"
    ON reviews FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "reviews: trekker create for own bookings"
    ON reviews FOR INSERT
    WITH CHECK (
        trekker_id = auth.uid()
        AND booking_id IN (
            SELECT id FROM bookings
            WHERE trekker_id = auth.uid() AND status = 'completed'
        )
    );

CREATE POLICY "reviews: trekker update own"
    ON reviews FOR UPDATE
    USING (trekker_id = auth.uid())
    WITH CHECK (trekker_id = auth.uid());

-- -------------------------------------------------------
-- trekker_videos
-- -------------------------------------------------------

CREATE POLICY "trekker_videos: public read published"
    ON trekker_videos FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "trekker_videos: trekker manage own"
    ON trekker_videos FOR ALL
    USING (trekker_id = auth.uid())
    WITH CHECK (trekker_id = auth.uid());
