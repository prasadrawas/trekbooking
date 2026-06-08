-- Performance indexes for TrekBooking
-- Run in Supabase SQL Editor

-- bookings
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_trekker_status ON bookings (trekker_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_event_status ON bookings (trek_event_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings (created_at DESC);

-- trek_events
CREATE INDEX IF NOT EXISTS idx_trek_events_status ON trek_events (status);
CREATE INDEX IF NOT EXISTS idx_trek_events_status_date ON trek_events (status, event_date);

-- treks
CREATE INDEX IF NOT EXISTS idx_treks_organizer ON treks (organizer_id);
CREATE INDEX IF NOT EXISTS idx_treks_published_date ON treks (created_at DESC) WHERE is_published = true;

-- trek_images
CREATE INDEX IF NOT EXISTS idx_trek_images_trek ON trek_images (trek_id);
CREATE INDEX IF NOT EXISTS idx_trek_images_cover ON trek_images (trek_id) WHERE is_cover = true;

-- reviews
CREATE INDEX IF NOT EXISTS idx_reviews_trekker ON reviews (trekker_id);

-- trekker_videos
CREATE INDEX IF NOT EXISTS idx_trekker_videos_trek ON trekker_videos (trek_id) WHERE is_published = true;

-- payouts
CREATE INDEX IF NOT EXISTS idx_payouts_event ON payouts (trek_event_id);
