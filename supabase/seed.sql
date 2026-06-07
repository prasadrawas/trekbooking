-- ============================================================
-- SahyadriBook - Seed Data for Development
-- ============================================================
-- NOTE: auth.users rows must be created manually via Supabase
-- Auth API or Studio before running this seed. The UUIDs below
-- are placeholders; replace them if needed.
-- ============================================================

-- -------------------------------------------------------
-- Profiles (2 organizers + 3 trekkers)
-- -------------------------------------------------------

INSERT INTO profiles (id, role, full_name, phone, city, youtube_channel_url) VALUES
    ('00000000-0000-0000-0000-000000000001', 'organizer', 'Rahul Patil',      '9876543210', 'Pune',   NULL),
    ('00000000-0000-0000-0000-000000000002', 'organizer', 'Priya Desai',      '9812345678', 'Mumbai', 'https://youtube.com/@priyatreksmumbai'),
    ('00000000-0000-0000-0000-000000000011', 'trekker',   'Amit Sharma',      '9900112233', 'Pune',   NULL),
    ('00000000-0000-0000-0000-000000000012', 'trekker',   'Sneha Kulkarni',   '9900445566', 'Nashik', 'https://youtube.com/@snehatrekker'),
    ('00000000-0000-0000-0000-000000000013', 'trekker',   'Vikram Joshi',     '9900778899', 'Pune',   NULL);

-- -------------------------------------------------------
-- Organizers
-- -------------------------------------------------------

INSERT INTO organizers (
    id, profile_id, org_name, slug, description, phone, email,
    is_verified, commission_rate, avg_rating, total_reviews, status,
    agreement_signed_at, free_period_ends_at
) VALUES
    (
        'aaaaaaaa-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Sahyadri Explorers',
        'sahyadri-explorers',
        'We organize premium treks across the Sahyadri ranges of Maharashtra. Safety first, adventure always.',
        '9876543210',
        'rahul@sahyadriexplorers.in',
        TRUE, 10.00, 4.6, 24, 'active',
        NOW() - INTERVAL '90 days',
        NOW() + INTERVAL '275 days'
    ),
    (
        'aaaaaaaa-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000002',
        'Mumbai Mountain Mavericks',
        'mumbai-mountain-mavericks',
        'Weekend treks from Mumbai. Family-friendly and beginner treks a specialty.',
        '9812345678',
        'priya@mumbaimavericks.in',
        TRUE, 12.00, 4.3, 11, 'active',
        NOW() - INTERVAL '45 days',
        NOW() + INTERVAL '320 days'
    );

-- -------------------------------------------------------
-- Treks
-- -------------------------------------------------------

INSERT INTO treks (
    id, organizer_id, title, slug, description, short_desc,
    difficulty, duration_days, distance_km, elevation_m, region,
    meeting_point, meeting_point_url,
    inclusions, exclusions, things_to_carry,
    cancellation_policy,
    is_child_friendly, min_child_age, child_price_policy,
    is_published
) VALUES
    (
        'bbbbbbbb-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001',
        'Rajmachi Fort Trek',
        'rajmachi-fort-trek',
        'Rajmachi is one of the most popular weekend treks in Maharashtra. The fort offers breathtaking views of Katraj and Bor Ghat passes, and twin forts Shrivardhan and Manaranjan.',
        'A classic overnight trek to twin forts with stunning valley views.',
        'easy', 2, 15.0, 925,
        'Lonavala, Maharashtra',
        'Lonavala Railway Station, Platform 1 end',
        'https://maps.google.com/?q=Lonavala+Railway+Station',
        ARRAY['Professional trek leader', 'Night stay in tent', 'Dinner and breakfast', 'First aid kit', 'Torch'],
        ARRAY['Personal expenses', 'Travel to/from base', 'Lunch', 'Any item of personal nature'],
        ARRAY['Trekking shoes', 'Rain poncho', 'Water bottle (2L)', 'Torch with extra batteries', 'Dry snacks', 'ID proof'],
        'Full refund if cancelled 7+ days before. 50% refund if 3-7 days before. No refund within 3 days.',
        TRUE, 8, 'discounted',
        TRUE
    ),
    (
        'bbbbbbbb-0000-0000-0000-000000000002',
        'aaaaaaaa-0000-0000-0000-000000000001',
        'Harishchandragad Trek',
        'harishchandragad-trek',
        'Harishchandragad is a hill fort in Maharashtra famous for the Konkan Kada, a concave cliff offering a 270-degree view. The Kedareshwar cave with a Shiva lingam surrounded by water is a highlight.',
        'An iconic Maharashtra trek with the famous Konkan Kada cliff.',
        'difficult', 2, 22.0, 1424,
        'Ahmednagar District, Maharashtra',
        'Khireshwar Village Entry Point',
        'https://maps.google.com/?q=Khireshwar+village+Maharashtra',
        ARRAY['Experienced trek leader', 'Forest tent accommodation', 'All meals on trek (Day 1 dinner to Day 2 lunch)', 'Safety equipment', 'Emergency support'],
        ARRAY['Travel to/from Khireshwar', 'Personal trekking gear', 'Snacks', 'Insurance'],
        ARRAY['Trekking shoes (mandatory)', 'Warm jacket', 'Raincoat', '3L water carrying capacity', 'Headlamp', 'Walking stick', 'Dry snacks', 'Personal medicines'],
        'Full refund if cancelled 10+ days before. 50% refund if 5-10 days before. No refund within 5 days.',
        FALSE, NULL, NULL,
        TRUE
    ),
    (
        'bbbbbbbb-0000-0000-0000-000000000003',
        'aaaaaaaa-0000-0000-0000-000000000002',
        'Visapur Fort Trek',
        'visapur-fort-trek',
        'Visapur is a large fort situated in the Maval taluka of Pune district. At an elevation of 1084m it offers panoramic views of the surrounding valleys and the twin fort Lohagad.',
        'Easy family trek to Visapur with stunning views of Lohagad fort.',
        'easy', 1, 8.0, 1084,
        'Maval, Pune District',
        'Bhaje Village Parking, Near Bhaje Caves',
        'https://maps.google.com/?q=Bhaje+village+Maval+Pune',
        ARRAY['Certified trek guide', 'Light refreshments', 'First aid kit'],
        ARRAY['Meals', 'Personal gear', 'Travel to/from Bhaje'],
        ARRAY['Comfortable sports shoes', 'Sunscreen', 'Hat or cap', '1.5L water', 'Light snacks', 'Camera'],
        'Full refund if cancelled 5+ days before. No refund after that.',
        TRUE, 5, 'same_price',
        TRUE
    ),
    (
        'bbbbbbbb-0000-0000-0000-000000000004',
        'aaaaaaaa-0000-0000-0000-000000000002',
        'Kalsubai Peak Trek',
        'kalsubai-peak-trek',
        'Kalsubai is the highest peak in Maharashtra at 1646m. The trail passes through dense forests and villages offering a rewarding summit experience with 360-degree panoramic views.',
        'Conquer Maharashtra''s highest peak — a rewarding moderate trail.',
        'moderate', 1, 12.0, 1646,
        'Akole, Ahmednagar',
        'Bari Village, Kalsubai Base',
        'https://maps.google.com/?q=Bari+village+Kalsubai',
        ARRAY['Trained trek leader', 'Safety briefing', 'First aid support'],
        ARRAY['Meals', 'Accommodation', 'Personal equipment', 'Transport'],
        ARRAY['Sturdy trekking shoes', 'Trekking pole (recommended)', '2L water', 'Energy bars', 'Layered clothing', 'Sunglasses'],
        'Full refund if cancelled 7+ days before. 50% if 3-7 days. No refund within 3 days.',
        FALSE, NULL, NULL,
        TRUE
    );

-- -------------------------------------------------------
-- Trek Images
-- -------------------------------------------------------

INSERT INTO trek_images (trek_id, image_url, alt_text, sort_order, is_cover) VALUES
    ('bbbbbbbb-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200', 'Rajmachi fort at dawn', 0, TRUE),
    ('bbbbbbbb-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200', 'Trail through the forest', 1, FALSE),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', 'Konkan Kada cliff view', 0, TRUE),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1200', 'Kedareshwar cave', 1, FALSE),
    ('bbbbbbbb-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200', 'Visapur fort walls', 0, TRUE),
    ('bbbbbbbb-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1200', 'Kalsubai summit panorama', 0, TRUE),
    ('bbbbbbbb-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200', 'Bari village at sunrise', 1, FALSE);

-- -------------------------------------------------------
-- Trek Events (upcoming dates relative to seed time)
-- -------------------------------------------------------

INSERT INTO trek_events (
    id, trek_id, event_date, end_date, reporting_time,
    price, child_price, total_seats, booked_seats, status
) VALUES
    -- Rajmachi (2-day, easy, child-friendly)
    (
        'cccccccc-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001',
        CURRENT_DATE + 14, CURRENT_DATE + 15, '06:00',
        799.00, 500.00, 30, 12, 'upcoming'
    ),
    (
        'cccccccc-0000-0000-0000-000000000002',
        'bbbbbbbb-0000-0000-0000-000000000001',
        CURRENT_DATE + 28, CURRENT_DATE + 29, '06:00',
        799.00, 500.00, 30, 4, 'upcoming'
    ),
    -- Harishchandragad (2-day, difficult)
    (
        'cccccccc-0000-0000-0000-000000000003',
        'bbbbbbbb-0000-0000-0000-000000000002',
        CURRENT_DATE + 21, CURRENT_DATE + 22, '05:30',
        1299.00, NULL, 20, 8, 'upcoming'
    ),
    -- Visapur (1-day, easy, child-friendly)
    (
        'cccccccc-0000-0000-0000-000000000004',
        'bbbbbbbb-0000-0000-0000-000000000003',
        CURRENT_DATE + 7,  NULL,              '07:00',
        499.00, 499.00, 40, 22, 'upcoming'
    ),
    (
        'cccccccc-0000-0000-0000-000000000005',
        'bbbbbbbb-0000-0000-0000-000000000003',
        CURRENT_DATE + 21, NULL,              '07:00',
        499.00, 499.00, 40, 0, 'upcoming'
    ),
    -- Kalsubai (1-day, moderate)
    (
        'cccccccc-0000-0000-0000-000000000006',
        'bbbbbbbb-0000-0000-0000-000000000004',
        CURRENT_DATE + 10, NULL,              '05:00',
        899.00, NULL, 25, 25, 'full'
    ),
    (
        'cccccccc-0000-0000-0000-000000000007',
        'bbbbbbbb-0000-0000-0000-000000000004',
        CURRENT_DATE + 24, NULL,              '05:00',
        899.00, NULL, 25, 3, 'upcoming'
    );

-- -------------------------------------------------------
-- Pickup Points
-- -------------------------------------------------------

INSERT INTO pickup_points (
    trek_event_id, label, address, maps_url, pickup_time, sort_order, extra_charge
) VALUES
    -- Rajmachi event 1 pickups
    ('cccccccc-0000-0000-0000-000000000001', 'Pune - Shivajinagar ST Stand',  'Shivajinagar, Pune 411005', 'https://maps.google.com/?q=Shivajinagar+ST+Stand+Pune', '05:00', 0, 0.00),
    ('cccccccc-0000-0000-0000-000000000001', 'Pune - Wakad Phata',            'Wakad, Pune 411057',        'https://maps.google.com/?q=Wakad+Phata+Pune',          '05:15', 1, 0.00),
    ('cccccccc-0000-0000-0000-000000000001', 'Lonavala Railway Station',      'Lonavala 410401',           'https://maps.google.com/?q=Lonavala+Railway+Station',  '06:30', 2, 0.00),
    -- Rajmachi event 2 pickups (same locations)
    ('cccccccc-0000-0000-0000-000000000002', 'Pune - Shivajinagar ST Stand',  'Shivajinagar, Pune 411005', 'https://maps.google.com/?q=Shivajinagar+ST+Stand+Pune', '05:00', 0, 0.00),
    ('cccccccc-0000-0000-0000-000000000002', 'Lonavala Railway Station',      'Lonavala 410401',           'https://maps.google.com/?q=Lonavala+Railway+Station',  '06:30', 1, 0.00),
    -- Visapur event 4 pickups
    ('cccccccc-0000-0000-0000-000000000004', 'Mumbai - Dadar Station West',   'Dadar, Mumbai 400028',      'https://maps.google.com/?q=Dadar+Station+West+Mumbai', '05:30', 0, 150.00),
    ('cccccccc-0000-0000-0000-000000000004', 'Mumbai - Thane Station',        'Thane, Mumbai 400601',      'https://maps.google.com/?q=Thane+Railway+Station',     '06:00', 1, 100.00),
    ('cccccccc-0000-0000-0000-000000000004', 'Bhaje Village Base',            'Bhaje, Maval, Pune 410506', 'https://maps.google.com/?q=Bhaje+village+Maval',       '07:30', 2, 0.00),
    -- Kalsubai event 7 pickups
    ('cccccccc-0000-0000-0000-000000000007', 'Mumbai - CST Station',          'CST, Mumbai 400001',        'https://maps.google.com/?q=CST+Mumbai',                '03:30', 0, 200.00),
    ('cccccccc-0000-0000-0000-000000000007', 'Bari Village Base',             'Bari, Akole 422601',        'https://maps.google.com/?q=Bari+village+Kalsubai',     '05:30', 1, 0.00);

-- -------------------------------------------------------
-- Bookings
-- -------------------------------------------------------

INSERT INTO bookings (
    id, booking_number, trek_event_id, trekker_id,
    num_adults, num_children, total_amount, platform_fee, organizer_amount,
    status, booking_name, booking_phone, booking_email,
    emergency_contact, special_requests
) VALUES
    -- Amit booked Rajmachi event 1 (2 adults + 1 child)
    (
        'dddddddd-0000-0000-0000-000000000001',
        'SB-2024-000001',
        'cccccccc-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000011',
        2, 1,
        2098.00,  -- (799*2 + 500) with marginal fee
        209.80,   -- 10%
        1888.20,
        'confirmed',
        'Amit Sharma', '9900112233', 'amit.sharma@example.com',
        'Rina Sharma: 9900001111',
        'Vegetarian meals preferred'
    ),
    -- Sneha booked Harishchandragad (1 adult)
    (
        'dddddddd-0000-0000-0000-000000000002',
        'SB-2024-000002',
        'cccccccc-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000012',
        1, 0,
        1299.00,
        129.90,
        1169.10,
        'confirmed',
        'Sneha Kulkarni', '9900445566', 'sneha.k@example.com',
        'Mom: 9900002222',
        NULL
    ),
    -- Vikram booked Visapur event 4 (3 adults)
    (
        'dddddddd-0000-0000-0000-000000000003',
        'SB-2024-000003',
        'cccccccc-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000013',
        3, 0,
        1497.00,
        179.64,  -- 12% (Mumbai Mavericks rate)
        1317.36,
        'confirmed',
        'Vikram Joshi', '9900778899', 'vikram.j@example.com',
        'Kavita Joshi: 9900003333',
        'One member has knee issues - please note for trail guidance'
    ),
    -- Amit also booked Kalsubai (completed older event - for review seeding)
    (
        'dddddddd-0000-0000-0000-000000000004',
        'SB-2024-000004',
        'cccccccc-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000011',
        1, 0,
        899.00,
        107.88,
        791.12,
        'completed',
        'Amit Sharma', '9900112233', 'amit.sharma@example.com',
        'Rina Sharma: 9900001111',
        NULL
    ),
    -- Sneha cancelled booking for Rajmachi event 2
    (
        'dddddddd-0000-0000-0000-000000000005',
        'SB-2024-000005',
        'cccccccc-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000012',
        2, 0,
        1598.00,
        159.80,
        1438.20,
        'cancelled',
        'Sneha Kulkarni', '9900445566', 'sneha.k@example.com',
        'Mom: 9900002222',
        NULL
    );

-- Update cancelled booking fields
UPDATE bookings
SET cancelled_at = NOW() - INTERVAL '2 days',
    cancellation_reason = 'Personal emergency'
WHERE id = 'dddddddd-0000-0000-0000-000000000005';

-- -------------------------------------------------------
-- Payments
-- -------------------------------------------------------

INSERT INTO payments (
    booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
    amount, currency, status, method, paid_at
) VALUES
    (
        'dddddddd-0000-0000-0000-000000000001',
        'order_RajmachiAmit001', 'pay_RajmachiAmit001', 'sig_RajmachiAmit001',
        2098.00, 'INR', 'captured', 'upi',
        NOW() - INTERVAL '5 days'
    ),
    (
        'dddddddd-0000-0000-0000-000000000002',
        'order_HarisSneha002', 'pay_HarisSneha002', 'sig_HarisSneha002',
        1299.00, 'INR', 'captured', 'netbanking',
        NOW() - INTERVAL '3 days'
    ),
    (
        'dddddddd-0000-0000-0000-000000000003',
        'order_VisapurVikram003', 'pay_VisapurVikram003', 'sig_VisapurVikram003',
        1497.00, 'INR', 'captured', 'card',
        NOW() - INTERVAL '1 day'
    ),
    (
        'dddddddd-0000-0000-0000-000000000004',
        'order_KalsubaiAmit004', 'pay_KalsubaiAmit004', 'sig_KalsubaiAmit004',
        899.00, 'INR', 'captured', 'upi',
        NOW() - INTERVAL '30 days'
    ),
    (
        'dddddddd-0000-0000-0000-000000000005',
        'order_RajmachiSneha005', NULL, NULL,
        1598.00, 'INR', 'refunded', 'upi',
        NOW() - INTERVAL '10 days'
    );

-- -------------------------------------------------------
-- Reviews (only for completed bookings)
-- -------------------------------------------------------

INSERT INTO reviews (
    booking_id, trek_id, trekker_id, rating, comment, is_published
) VALUES
    (
        'dddddddd-0000-0000-0000-000000000004',
        'bbbbbbbb-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000011',
        5,
        'Absolutely stunning summit! The trail was well-marked and the guide was extremely knowledgeable. Woke up at 3am and it was totally worth it for the sunrise view. Highly recommend Priya''s team!',
        TRUE
    );

-- -------------------------------------------------------
-- Trekker Videos
-- -------------------------------------------------------

INSERT INTO trekker_videos (trekker_id, trek_id, youtube_url, title, sort_order, is_published) VALUES
    (
        '00000000-0000-0000-0000-000000000012',
        'bbbbbbbb-0000-0000-0000-000000000002',
        'https://youtube.com/watch?v=example_harishchandragad',
        'Harishchandragad Trek Vlog - Konkan Kada Magic',
        0, TRUE
    ),
    (
        '00000000-0000-0000-0000-000000000012',
        NULL,
        'https://youtube.com/watch?v=example_sahyadri_general',
        'Top 5 Treks in Sahyadri You Must Do',
        1, TRUE
    ),
    (
        '00000000-0000-0000-0000-000000000011',
        'bbbbbbbb-0000-0000-0000-000000000004',
        'https://youtube.com/watch?v=example_kalsubai',
        'Kalsubai Peak - Maharashtra''s Highest Point',
        0, TRUE
    );
