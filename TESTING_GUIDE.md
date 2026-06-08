# TrekBooking — Complete Testing Guide

This guide covers how to test every feature of the TrekBooking platform manually. Follow the test cases in order — each section builds on the previous one.

---

## Prerequisites

Before testing, ensure:
- [ ] Local dev server running (`npm run dev` → `http://localhost:3000`)
- [ ] Supabase project running with migrations applied
- [ ] Razorpay test keys configured in `.env.local`
- [ ] Storage buckets created (`trek-images`, `organizer-logos`, `avatars`)
- [ ] Database is clean or has known test data

### Razorpay Test Credentials
| Type | Value |
|---|---|
| Card Number | `5267 3181 8797 5449` |
| Card Expiry | `12/28` |
| Card CVV | `123` |
| UPI ID | `success@razorpay` |
| Failed UPI | `failure@razorpay` |
| OTP (when asked) | Any 6 digits (e.g., `123456`) |

---

## 1. Authentication Tests

### 1.1 Trekker Signup
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 1.1.1 | Signup with valid data | Go to `/signup` → Select "Trekker" → Fill name, email, password → Click "Create Account" | Redirected to `/login` with success message |
| 1.1.2 | Signup with short password | Enter password less than 8 chars → Submit | Error: "Password must be at least 8 characters" |
| 1.1.3 | Signup with invalid email | Enter "notanemail" → Submit | Error: "Invalid email format" |
| 1.1.4 | Signup with invalid phone | Enter "12345" → Submit | Error: "Must be a valid 10-digit Indian number" |
| 1.1.5 | Signup without agreeing to terms | Don't check terms checkbox → Submit | Error: "You must agree to the terms" |
| 1.1.6 | Signup with existing email | Use an already registered email | Error from Supabase: "User already registered" |
| 1.1.7 | Admin role injection attempt | Open DevTools → Change hidden role input to "admin" → Submit | Should still create as "trekker" (role whitelisted) |

### 1.2 Organizer Signup
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 1.2.1 | Signup as organizer | Go to `/signup` → Select "Organizer" → Fill details → Submit | Account created, redirected to login |
| 1.2.2 | Login as organizer | Login with organizer credentials | Redirected to `/org` → then to `/org/onboarding` |
| 1.2.3 | Complete onboarding | Fill org name, phone, email, description → Submit | Redirected to `/org` dashboard |
| 1.2.4 | Skip onboarding and revisit | Close browser mid-onboarding → Login again | Should redirect back to `/org/onboarding` |

### 1.3 Login
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 1.3.1 | Login with valid credentials | Enter email + password → Click "Sign In" | Redirected to role-appropriate dashboard |
| 1.3.2 | Login with wrong password | Enter wrong password | Error: "Invalid login credentials" |
| 1.3.3 | Login with unregistered email | Enter unknown email | Error: "Invalid login credentials" |
| 1.3.4 | Login with redirect param | Visit `/login?redirect=/treks/abc/book/xyz` → Login | Redirected to the booking page, not dashboard |
| 1.3.5 | Trekker cannot access `/org` | Login as trekker → Navigate to `/org` | Redirected to `/dashboard` |
| 1.3.6 | Trekker cannot access `/admin` | Login as trekker → Navigate to `/admin` | Redirected to `/dashboard` |

### 1.4 Google OAuth
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 1.4.1 | Signup via Google as trekker | Select "Trekker" → Click "Continue with Google" | Google login → Account created as trekker |
| 1.4.2 | Signup via Google as organizer | Select "Organizer" → Click "Continue with Google" | Google login → Account created as organizer → Redirected to onboarding |
| 1.4.3 | Login via Google (existing user) | Click Google on login page | Logged in, role preserved |

### 1.5 Password Management
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 1.5.1 | Change password | Dashboard → Settings → Enter current + new password → Submit | "Password updated successfully" |
| 1.5.2 | Change with wrong current password | Enter incorrect current password | Error: "Current password is incorrect" |
| 1.5.3 | Forgot password | `/forgot-password` → Enter email → Submit | Success message: "Check your email" |
| 1.5.4 | Password too short | Enter new password < 8 chars | Error: "Password must be at least 8 characters" |

### 1.6 Logout
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 1.6.1 | Logout from trekker dashboard | Click user menu → "Sign out" | Redirected to `/` |
| 1.6.2 | Logout from org dashboard | Click user menu → "Sign out" | Redirected to `/` |
| 1.6.3 | Access dashboard after logout | Navigate to `/dashboard` | Redirected to `/login` |

### 1.7 Account Deletion
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 1.7.1 | Delete trekker account | Settings → Danger Zone → Type "delete my account" → Click Delete | Account deleted, redirected to `/` |
| 1.7.2 | Delete without confirmation text | Click Delete without typing | Button should be disabled |

---

## 2. Trek Management Tests (Organizer)

### 2.1 Create Trek
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 2.1.1 | Create trek with all fields | `/org/treks/new` → Fill all 7 steps → Publish | Trek created, visible on `/treks` |
| 2.1.2 | Save as draft | Fill Step 1 → Click "Save & Next" → Then "Save as Draft" on Review | Trek saved but not visible publicly |
| 2.1.3 | Step auto-save | Fill Step 1 → Click "Save & Next" → Close browser → Come back | Trek exists as draft in `/org/treks` |
| 2.1.4 | Skip step | Click "Skip" on Step 2 → Advance to Step 3 | No data saved for Step 2, but advances |
| 2.1.5 | Create without title | Leave title empty → Click "Save & Next" | Error: "Trek title is required" |
| 2.1.6 | Publish & Schedule | Click "Publish & Schedule Dates" | Trek published, redirected to events page |

### 2.2 Trek Details (Step by Step)
| Step | Fields to Test |
|---|---|
| 1. Basic Info | Title, short desc (160 char limit), full desc, difficulty dropdown, duration (number), distance, elevation, region |
| 2. Details | Meeting point, Google Maps URL, inclusions (tag input), exclusions, things to carry, itinerary (day-by-day), cancellation rules (rule builder), cancellation notes |
| 3. Pricing | Child-friendly toggle, min child age, pricing policy (half/same/free), adult price, child price |
| 4. Photos | Browse images, preview thumbnails, set cover photo, delete photo |
| 5. Pickup Points | Add pickup (name, address, time, extra charge, maps URL), edit, delete |
| 6. Schedule | Single date, weekly, bi-weekly, monthly, custom dates — preview dates, create events |
| 7. Review | All fields displayed, Save as Draft / Publish / Publish & Schedule |

### 2.3 Edit Trek
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 2.3.1 | Edit existing trek | `/org/treks` → Click edit → Modify fields → Save | Trek updated |
| 2.3.2 | All fields pre-filled | Open edit page | All previously saved data loaded |
| 2.3.3 | Edit doesn't unpublish | Edit a published trek → Save & Next on any step | Trek remains published |
| 2.3.4 | Upload new photos | Edit → Step 4 → Browse → Add photo → Save & Next | Photo uploaded to Supabase Storage |

### 2.4 Schedule Events
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 2.4.1 | Schedule single date | Events page → Schedule Dates → Single → Select date → Create | 1 event created |
| 2.4.2 | Schedule weekly | Select Weekly → Saturday → Date range → Create | Multiple events created (1 per week) |
| 2.4.3 | Schedule bi-weekly | Select Bi-weekly → Day → Range → Create | Events every 2 weeks |
| 2.4.4 | Schedule monthly | Select Monthly → Day 15 → Range → Create | Monthly events created |
| 2.4.5 | Schedule custom dates | Select Custom → Add 3 dates → Create | 3 events created |
| 2.4.6 | Preview dates | Select any schedule type → Fill fields | Preview shows exact dates below |
| 2.4.7 | Default prices pre-filled | Open schedule dialog | Adult/child price from trek defaults |
| 2.4.8 | Cancel event | Click X on an upcoming event → Confirm | Event status changes to cancelled |
| 2.4.9 | Past date rejected | Try to schedule a past date | "No valid dates generated" error |

---

## 3. Booking Tests (Trekker)

### 3.1 Browse & Search
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 3.1.1 | View all treks | Go to `/treks` | All published treks displayed |
| 3.1.2 | Search by name | Type trek name in search → Click "Search Treks" | Filtered results |
| 3.1.3 | Filter by difficulty | Sidebar → Check "Easy" | Only easy treks shown |
| 3.1.4 | Filter by region | Sidebar → Check "Lonavala" | Only Lonavala treks |
| 3.1.5 | Filter by duration | Click "1 Day" | Only 1-day treks |
| 3.1.6 | Child-friendly filter | Toggle "Child Friendly Only" | Only child-friendly treks |
| 3.1.7 | Clear filters | Click "Clear All" | All treks shown |
| 3.1.8 | View trek detail | Click on a trek card | Trek detail page with full info |

### 3.2 Booking Flow
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 3.2.1 | Book as logged-in user | Trek detail → Book Now → Fill form → Pay | Booking confirmed, redirect to confirmation |
| 3.2.2 | Book without login | Click "Pay Now" without login | Redirected to `/login?redirect=...` → After login, back to booking |
| 3.2.3 | Select pickup point | Choose a pickup with extra charge | Price updates in order summary |
| 3.2.4 | Add children | Increase children count | Child price line appears in summary |
| 3.2.5 | Exceed available seats | Try to book more seats than available | Error: "Only X seat(s) remaining" |
| 3.2.6 | Empty form submission | Click Pay without filling name/email/phone | Validation errors shown |
| 3.2.7 | Successful payment (UPI) | Enter `success@razorpay` → Submit | Payment succeeds → Confirmation page |
| 3.2.8 | Successful payment (Card) | Enter test card → 12/28 → 123 → OTP: 123456 | Payment succeeds |
| 3.2.9 | Cancel Razorpay modal | Open Razorpay → Close without paying | Returns to booking page, button re-enabled |

### 3.3 Post-Booking
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 3.3.1 | View confirmation | After payment | Confirmation page with booking details |
| 3.3.2 | View booking in dashboard | Go to `/dashboard` → My Bookings | Booking listed under "Upcoming" |
| 3.3.3 | View booking detail | Click on a booking | Full details — trek, participants, payment, pickup |
| 3.3.4 | Download receipt | Click "Download Receipt" | HTML receipt opens → Print dialog |
| 3.3.5 | Receipt shows correct data | Check receipt content | Real booking number, trek name, amount, payment ID |

### 3.4 Cancellation
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 3.4.1 | Cancel upcoming booking | Booking detail → Cancel Booking → Enter reason → Confirm | Booking cancelled, refund info shown |
| 3.4.2 | Cancel with full refund | Cancel >48 hours before trek | 100% refund message |
| 3.4.3 | Cancel with partial refund | Cancel 24-48 hours before trek | 50% refund message |
| 3.4.4 | Cannot cancel completed | View a completed booking | Cancel button not shown |
| 3.4.5 | Seats released | Cancel a booking → Check event seats | Available seats increase |

### 3.5 Reviews
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 3.5.1 | Write review | Dashboard → Reviews → Click "Write Review" on completed trek | Review form opens |
| 3.5.2 | Submit review | Select stars → Write comment → Submit | Review saved |
| 3.5.3 | Review visible on trek page | Go to trek detail → Reviews tab | Review shown |
| 3.5.4 | Cannot review upcoming trek | Check an upcoming booking | "Write Review" button not shown |

---

## 4. Organizer Dashboard Tests

### 4.1 Dashboard Home
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 4.1.1 | Stats display | Visit `/org` | Stats cards show real data (or 0 for new org) |
| 4.1.2 | Upcoming treks | Check "Upcoming Treks" section | Real upcoming events with seat fill bars |
| 4.1.3 | Recent bookings | Check "Recent Bookings" table | Real bookings for org's treks |

### 4.2 Bookings Management
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 4.2.1 | View all bookings | `/org/bookings` | All bookings for org's treks |
| 4.2.2 | View booking detail | Click a booking | Trekker info, payment, pickup details |
| 4.2.3 | Cancel booking as organizer | Click Cancel → Enter reason → Confirm | Booking cancelled, API called |

### 4.3 Settings
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 4.3.1 | Update org info | Change name → Save | Name updated |
| 4.3.2 | Upload logo | Select image → Save | Logo uploaded to Supabase Storage |
| 4.3.3 | Update bank details | Enter account number, IFSC → Save | Saved (only visible to owner) |
| 4.3.4 | Update cancellation rules | Add/remove rules → Save | Rules updated |
| 4.3.5 | Change password | Enter current + new password → Update | Password changed |

---

## 5. Admin Panel Tests

### 5.1 Overview
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 5.1.1 | View stats | Visit `/admin` | Real counts (users, organizers, bookings, revenue) |
| 5.1.2 | Pending actions | Check pending section | Real counts of pending organizers/payouts |

### 5.2 Organizer Management
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 5.2.1 | View organizers | `/admin/organizers` | List of all organizers |
| 5.2.2 | Suspend organizer | Click Suspend → Enter reason | Status changes to "suspended" |
| 5.2.3 | Reactivate organizer | Click Activate on suspended org | Status changes to "active" |
| 5.2.4 | Change commission rate | Click Edit Commission → Enter new rate | Rate updated |

### 5.3 Bookings & Payouts
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 5.3.1 | View all bookings | `/admin/bookings` | All platform bookings |
| 5.3.2 | View payouts | `/admin/payouts` | Payout records |
| 5.3.3 | Process payout | Click "Mark as Processed" on pending payout | Status changes |

---

## 6. Security Tests

### 6.1 Role-Based Access
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 6.1.1 | Trekker can't access `/org` | Login as trekker → Navigate to `/org` | Redirected to `/dashboard` |
| 6.1.2 | Trekker can't access `/admin` | Login as trekker → Navigate to `/admin` | Redirected to `/dashboard` |
| 6.1.3 | Organizer can't access `/admin` | Login as organizer → Navigate to `/admin` | Redirected to `/dashboard` |
| 6.1.4 | Unauthenticated → protected page | Not logged in → Navigate to `/dashboard` | Redirected to `/login` |

### 6.2 API Security
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 6.2.1 | Unauthenticated API call | `curl /api/bookings` | 401 Unauthorized |
| 6.2.2 | Admin role injection | POST to `/api/auth/signup` with `role: "admin"` | Created as "trekker" (whitelisted) |
| 6.2.3 | Open redirect | Visit `/auth/callback?next=//evil.com` | Redirected to `/dashboard`, not evil.com |
| 6.2.4 | Upload bucket injection | POST to `/api/upload` with `bucket: "secret-bucket"` | Error: "Invalid bucket" |
| 6.2.5 | Cross-user booking access | Try to GET another user's booking | 403 or empty result |

### 6.3 Payment Security
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 6.3.1 | Tampered payment amount | Modify amount in browser → Pay | Server creates order with correct amount (untamperable) |
| 6.3.2 | Invalid payment signature | Call `/api/payments/verify` with fake signature | 400: "Invalid payment signature" |
| 6.3.3 | Double payment verification | Call verify twice with same data | Second call returns success (idempotent) |

---

## 7. UI/UX Tests

### 7.1 Responsive Design
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 7.1.1 | Mobile homepage | Open `/` on mobile (375px) | Hero, search bar, cards stack vertically |
| 7.1.2 | Mobile trek listing | Open `/treks` on mobile | Filter button (sidebar hidden), cards stack |
| 7.1.3 | Mobile booking page | Open booking page on mobile | Form stacks, order summary below |
| 7.1.4 | Mobile dashboard | Open `/dashboard` on mobile | Hamburger menu for sidebar |
| 7.1.5 | Tablet layout | Open on tablet (768px) | 2-column grids, proper spacing |

### 7.2 Navigation
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 7.2.1 | Navbar — logged out | Visit site without login | Shows "Login" and "Sign Up" buttons |
| 7.2.2 | Navbar — logged in | Login → Check navbar | Shows user avatar + name + dropdown menu |
| 7.2.3 | User menu dropdown | Click avatar in navbar | Dropdown: Dashboard, Settings, Sign Out |
| 7.2.4 | Mobile menu | Click hamburger on mobile | Side panel slides in |
| 7.2.5 | View organizer profile | Trek detail → Click "View Profile" | Goes to `/organizers/slug` (not redirected away) |

### 7.3 Loading States
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 7.3.1 | Trek listing loading | Open `/treks` | Skeleton cards while loading |
| 7.3.2 | Dashboard loading | Open `/dashboard` | Spinner while loading |
| 7.3.3 | Booking payment loading | Click "Pay Now" | Button shows "Processing..." spinner |
| 7.3.4 | Form save loading | Click "Save & Next" on trek form | Button shows "Saving..." spinner |

### 7.4 Error States
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 7.4.1 | 404 page | Visit `/nonexistent-page` | Custom 404 page with "Trail Not Found" |
| 7.4.2 | Trek not found | Visit `/treks/invalid-slug` | Fallback to mock data or error state |
| 7.4.3 | Booking API error | Simulate network error during booking | Error message shown to user |

---

## 8. Image Upload Tests

### 8.1 Trek Photos
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 8.1.1 | Upload JPEG | Trek form Step 4 → Browse → Select .jpg | Preview shown, uploads on Save & Next |
| 8.1.2 | Upload PNG | Select .png file | Works same as JPEG |
| 8.1.3 | Upload WebP | Select .webp file | Works same as JPEG |
| 8.1.4 | File too large | Select file > 5MB | Error: "File too large" |
| 8.1.5 | Invalid file type | Select .pdf or .exe | Error: "Invalid file type" |
| 8.1.6 | Image persists | Upload → Save → Refresh edit page | Image still shown with "Saved" badge |
| 8.1.7 | Image on trek card | Upload cover image → Check `/treks` | Real image on trek card (not "No image" placeholder) |

### 8.2 Profile Photos
| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| 8.2.1 | Upload avatar | Dashboard Settings → Change photo → Save | Avatar appears in sidebar and top bar |
| 8.2.2 | Upload org logo | Org Settings → Change logo → Save | Logo appears in sidebar |

---

## 9. SEO Tests

| # | Test Case | How to Check | Expected Result |
|---|---|---|---|
| 9.1 | Homepage title | View page source or browser tab | "TrekBooking — Book Weekend Treks Near Pune" |
| 9.2 | Trek detail title | Open a trek page → Check tab | "Trek Name | TrekBooking" |
| 9.3 | JSON-LD on homepage | View source → Search "application/ld+json" | Organization + WebSite + SiteNavigationElement schemas |
| 9.4 | JSON-LD on trek detail | View source on trek page | Event schema with price, availability |
| 9.5 | Sitemap | Visit `/sitemap.xml` | Lists all published treks and organizers |
| 9.6 | Robots.txt | Visit `/robots.txt` | Allows public, blocks dashboard/org/admin/api |
| 9.7 | OG tags | Use Facebook Sharing Debugger or check source | og:title, og:description, og:image present |
| 9.8 | noindex (WIP mode) | Check source for `<meta name="robots">` | Should show `noindex, nofollow` while in WIP |

---

## 10. Cross-Browser Testing

Test these browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, macOS/iOS)
- [ ] Edge (latest)
- [ ] Chrome on Android
- [ ] Safari on iPhone

Key things to test across browsers:
- Login/signup forms
- Razorpay checkout (payment modal)
- Image upload
- Animations (framer-motion)
- Date picker inputs
- Mobile navigation

---

## 11. Database Verification Queries

Run these in Supabase SQL Editor after testing:

```sql
-- Check total users
SELECT role, COUNT(*) FROM profiles GROUP BY role;

-- Check published treks
SELECT title, is_published, difficulty, region FROM treks;

-- Check upcoming events
SELECT te.event_date, te.price, te.total_seats, te.booked_seats, t.title
FROM trek_events te JOIN treks t ON te.trek_id = t.id
WHERE te.status = 'upcoming' ORDER BY te.event_date;

-- Check bookings
SELECT b.booking_number, b.status, b.total_amount, b.booking_name, t.title
FROM bookings b
JOIN trek_events te ON b.trek_event_id = te.id
JOIN treks t ON te.trek_id = t.id
ORDER BY b.created_at DESC;

-- Check payments
SELECT p.status, p.amount, p.razorpay_payment_id, b.booking_number
FROM payments p JOIN bookings b ON p.booking_id = b.id
ORDER BY p.created_at DESC;

-- Check seat counts match
SELECT te.event_date, te.total_seats, te.booked_seats,
       COUNT(b.id) as actual_confirmed_bookings,
       SUM(b.num_adults + b.num_children) as actual_persons
FROM trek_events te
LEFT JOIN bookings b ON b.trek_event_id = te.id AND b.status IN ('confirmed', 'completed')
GROUP BY te.id, te.event_date, te.total_seats, te.booked_seats;
```

---

## Testing Checklist Summary

### Pre-Launch Checklist
- [ ] All signup/login flows work
- [ ] Google OAuth works
- [ ] Role-based access enforced
- [ ] Trek creation (all 7 steps) works
- [ ] Event scheduling works
- [ ] Booking flow works end-to-end
- [ ] Razorpay payment works (test mode)
- [ ] Cancellation + refund works
- [ ] Receipt download works
- [ ] Image upload works (trek photos, avatar, logo)
- [ ] Dashboard shows real data (not mock)
- [ ] Organizer dashboard fully functional
- [ ] Admin panel accessible only by admin
- [ ] Mobile responsive on all key pages
- [ ] 404 page works
- [ ] Sitemap accessible
- [ ] No console errors on key pages
- [ ] Custom domain resolves correctly
- [ ] SSL certificate active (HTTPS)

---

## Bug Reporting

When reporting a bug, include:
1. **Page URL** where the bug occurs
2. **Steps to reproduce** (numbered)
3. **Expected result** vs **Actual result**
4. **Screenshot** (if visual bug)
5. **Browser console errors** (F12 → Console tab)
6. **Device/browser** (e.g., Chrome on iPhone 14)
