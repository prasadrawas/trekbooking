# TrekBooking — Complete Project Guide

## What is TrekBooking?

TrekBooking is an online platform for booking weekend treks in the Sahyadri mountains near Pune, Maharashtra. Think of it as "BookMyShow for treks" — trekkers discover and book verified treks, organizers list and manage their trek events, and an admin oversees the entire platform.

**Website:** https://trekbooking.in
**GitHub:** https://github.com/prasadrawas/trekbooking

---

## Three User Roles

### 1. Trekker (Regular User)
A person who wants to go on a trek.

**What they can do:**
- Browse all published treks without signing up
- Filter treks by difficulty, duration, region, price, child-friendly
- View trek details — photos, itinerary, pricing, available dates, reviews
- Sign up / login (email + password or Google)
- Book a trek — select date, pickup point, number of adults/children
- Pay online via Razorpay (UPI, cards, netbanking)
- View their bookings in the dashboard
- Cancel a booking (with automatic refund calculation)
- Download a receipt (PDF)
- Write reviews for completed treks
- Update their profile (name, phone, city, avatar)
- Change password, delete account

**Dashboard:** `/dashboard`

---

### 2. Organizer (Trek Company)
A trek company or individual who organizes treks.

**What they can do:**
- Sign up as an organizer
- Complete onboarding (org name, phone, email, description)
- Create treks with full details:
  - Basic info (title, difficulty, duration, region, elevation)
  - Inclusions/exclusions/things to carry
  - Day-by-day itinerary
  - Cancellation policy (with structured refund rules)
  - Pricing (adult + child)
  - Photos (uploaded to cloud storage with compression)
  - Default pickup points
- Schedule trek dates using 5 scheduling options:
  - Single date
  - Weekly (e.g., every Saturday)
  - Bi-weekly
  - Monthly
  - Custom dates
- Manage events — view bookings, seat availability, cancel events
- View all bookings for their treks
- View booking details (trekker info, payment, pickup)
- Cancel bookings (triggers refund)
- Track payouts (revenue, commission, bank details)
- View and manage reviews
- Upload YouTube videos to feature their treks
- Update organization settings (name, logo, bank details, cancellation rules)
- Change password

**Dashboard:** `/org`

---

### 3. Admin
The platform administrator who manages everything.

**What they can do:**
- View platform-wide statistics (total bookings, revenue, organizers, treks)
- Manage organizers (approve, suspend, activate, change commission rate)
- View all bookings across the platform
- Process payouts to organizers
- Export data (CSV)

**Dashboard:** `/admin`

---

## How the Booking Flow Works

```
Step 1: Trekker browses treks on the website
         ↓
Step 2: Selects a trek and clicks "Book Now" on an available date
         ↓
Step 3: Fills booking form:
        - Number of adults and children
        - Selects pickup point
        - Enters name, email, phone, emergency contact
        - Special requests (optional)
         ↓
Step 4: Clicks "Pay Now"
        - If not logged in → redirected to login → comes back to booking
        - Booking is created in the database
        - Seats are atomically reserved (no double-booking)
        - Razorpay checkout opens
         ↓
Step 5: Trekker pays via UPI / Card / Netbanking
        - Payment is verified server-side (HMAC signature check)
        - Booking status changes: pending → confirmed
         ↓
Step 6: Booking confirmed
        - Trekker sees confirmation page with booking details
        - Can download receipt
        - Booking appears in their dashboard
         ↓
Step 7: After the trek date passes
        - Booking automatically moves to "completed"
        - Trekker can now write a review
```

---

## Cancellation & Refund Policy

Each trek has structured cancellation rules set by the organizer. Example:

| When cancelled | Refund |
|---|---|
| More than 48 hours before trek | 100% refund |
| 24-48 hours before trek | 50% refund |
| Less than 24 hours before trek | 0% refund |

When a trekker cancels:
1. System checks how many hours until the trek
2. Matches the right rule automatically
3. Shows refund amount to the trekker
4. Processes refund via Razorpay
5. Releases the reserved seats

---

## Commission & Payouts

- TrekBooking charges a **10% commission** on each booking
- First **3 months** are commission-free for new organizers
- Example: Trek price ₹1,000 → Platform gets ₹100, Organizer gets ₹900
- Payouts are tracked in the organizer dashboard
- Admin processes payouts to organizer's bank account

---

## Pages & URLs

### Public Pages (no login needed)

| URL | Page | Description |
|---|---|---|
| `/` | Landing page | Hero, trending treks, how it works, features, testimonials |
| `/treks` | Browse treks | Search, filter, sort all published treks |
| `/treks/[slug]` | Trek detail | Photos, itinerary, dates, pricing, reviews, booking |
| `/treks/[slug]/book/[eventId]` | Booking page | Select participants, pickup, pay |
| `/organizers/[slug]` | Organizer profile | Public profile, treks, reviews |
| `/about` | About us | Company info |
| `/contact` | Contact | Contact form |
| `/partner` | Partner with us | Organizer recruitment page |
| `/login` | Login | Email/password + Google OAuth |
| `/signup` | Sign up | Role selection + registration |
| `/forgot-password` | Password reset | Send reset email |

### Trekker Dashboard (login required)

| URL | Page |
|---|---|
| `/dashboard` | Home — upcoming/past bookings |
| `/dashboard/bookings` | All bookings list |
| `/dashboard/bookings/[id]` | Booking detail — receipt, cancel |
| `/dashboard/reviews` | My reviews |
| `/dashboard/settings` | Profile, password, delete account |

### Organizer Dashboard (organizer login required)

| URL | Page |
|---|---|
| `/org` | Home — stats, upcoming treks, recent bookings |
| `/org/treks` | My treks list |
| `/org/treks/new` | Create new trek (7-step form) |
| `/org/treks/[id]/edit` | Edit trek (7-step form) |
| `/org/treks/[id]/events` | Manage scheduled dates |
| `/org/treks/[id]/events/[eventId]` | Event detail — pickup points, bookings |
| `/org/bookings` | All bookings for my treks |
| `/org/bookings/[id]` | Booking detail |
| `/org/payouts` | Payout history |
| `/org/reviews` | Reviews dashboard |
| `/org/videos` | YouTube video management |
| `/org/settings` | Org profile, bank details, cancellation policy, password |

### Admin Dashboard (admin login required)

| URL | Page |
|---|---|
| `/admin` | Overview — stats, charts, activity |
| `/admin/organizers` | Manage organizers |
| `/admin/bookings` | All platform bookings |
| `/admin/payouts` | Process payouts |

---

## Trek Creation Process (7 Steps)

When an organizer creates a trek, they go through 7 steps:

1. **Basic Info** — Title, short description, full description, difficulty, duration, distance, elevation, region
2. **Details** — Meeting point, inclusions, exclusions, things to carry, day-by-day itinerary, cancellation rules
3. **Pricing** — Child-friendly toggle, adult price, child price
4. **Photos** — Upload trek images (auto-compressed, stored in cloud)
5. **Pickup Points** — Default pickup locations with time and extra charge
6. **Schedule** — Schedule trek dates (single, weekly, bi-weekly, monthly, custom)
7. **Review & Publish** — Review all details, save as draft or publish

Each step auto-saves to the database when clicking "Save & Next".

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 16 (React) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (email + Google OAuth) |
| Payments | Razorpay (UPI, cards, netbanking) |
| Image Storage | Supabase Storage |
| Deployment | Vercel |
| Domain | GoDaddy |

---

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` | User profiles (name, phone, city, avatar, role) |
| `organizers` | Organizer details (org name, bank details, commission, rating) |
| `treks` | Trek listings (title, description, difficulty, pricing, images, etc.) |
| `trek_images` | Trek photo URLs |
| `trek_events` | Scheduled trek dates (date, price, seats, status) |
| `pickup_points` | Pickup locations per event |
| `bookings` | Booking records (trekker, event, participants, amount, status) |
| `payments` | Payment records (Razorpay order/payment IDs, status) |
| `payouts` | Organizer payout records |
| `reviews` | Trek reviews (rating, comment) |
| `trekker_videos` | YouTube videos linked to treks |

---

## API Endpoints

The platform has 30+ REST API endpoints. Key ones:

### Public (no auth)
- `GET /api/treks` — List published treks with filters
- `GET /api/treks/:slug` — Trek detail
- `GET /api/organizers/:slug` — Organizer profile

### Auth
- `POST /api/auth/signup` — Register (role whitelist: trekker/organizer only)
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/profile` — Get profile
- `PUT /api/auth/profile` — Update profile
- `POST /api/auth/change-password` — Change password
- `DELETE /api/auth/delete-account` — Delete account

### Bookings
- `GET /api/bookings` — List bookings
- `POST /api/bookings` — Create booking + Razorpay order
- `PUT /api/bookings/:id` — Cancel booking
- `POST /api/payments/verify` — Verify payment after Razorpay checkout

### Organizer
- `GET /api/organizers/me` — My org profile
- `PUT /api/organizers/me` — Update org profile
- `POST /api/treks` — Create trek
- `PUT /api/treks/:id` — Update trek
- `POST /api/upload` — Upload image

### Webhooks
- `POST /api/webhooks/razorpay` — Razorpay payment status updates

---

## Security Features

| Feature | Implementation |
|---|---|
| Role-based access | Middleware checks role on every request |
| Auth guards | Dashboard/org/admin layouts redirect to login on 401 |
| Role injection prevention | Signup API whitelists roles (never allows "admin") |
| Open redirect protection | All redirect params validated |
| Upload security | Bucket allowlist + role-based permissions |
| Bank data protection | RLS restricts access to owner only |
| Payment verification | HMAC signature check on Razorpay payments |
| Atomic seat booking | PostgreSQL function prevents double-booking |
| CSRF protection | SameSite cookies on auth |
| Input validation | Server-side validation on all forms |

---

## Key Features Summary

- **Multi-role platform** — trekker, organizer, admin
- **Online payment** — Razorpay (UPI, cards, netbanking)
- **Smart scheduling** — 5 scheduling options for trek dates
- **Auto-completion** — bookings auto-complete after trek date
- **Structured cancellation** — rule-based refund calculation
- **Image compression** — client-side compression before upload
- **SEO optimized** — structured data, dynamic sitemap, meta tags
- **Responsive design** — works on mobile, tablet, desktop
- **Real-time seat tracking** — atomic seat reservation prevents overbooking
- **Receipt generation** — downloadable booking receipts
- **Review system** — post-trek reviews with star ratings

---

## Environment Variables Needed

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server only) |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key ID (for frontend) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (server only) |
| `NEXT_PUBLIC_BASE_URL` | Site URL (https://trekbooking.in) |

---

## How to Make Someone an Admin

Admins cannot self-register. To create an admin:

1. User signs up as a trekker via the website
2. Run this SQL in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
);

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
WHERE email = 'admin@example.com';
```

3. User logs out and logs back in — they'll be redirected to `/admin`

---

## Deployment

| Service | URL |
|---|---|
| Production (Vercel) | https://project-5quco.vercel.app |
| Custom Domain | https://trekbooking.in (DNS pending) |
| Database | Supabase (Mumbai region) |
| Payments | Razorpay (test mode) |
| Code Repository | https://github.com/prasadrawas/trekbooking |

---

## File Structure

```
src/
├── app/                    # Pages and routes
│   ├── (auth)/             # Login, signup, forgot password
│   ├── (public)/           # Public pages (treks, about, contact)
│   ├── dashboard/          # Trekker dashboard
│   ├── org/                # Organizer dashboard
│   ├── admin/              # Admin panel
│   └── api/                # API endpoints
├── components/             # Reusable UI components
├── actions/                # Server actions
├── lib/                    # Utilities (Supabase clients, Razorpay, etc.)
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript types
supabase/
├── migrations/             # Database schema
└── seed.sql                # Sample data
```

---

## Contact

- **Email:** trekbooking.in@gmail.com
- **Website:** https://trekbooking.in
