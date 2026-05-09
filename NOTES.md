# Card Show Central — Project Notes

## What This App Is

A platform for organizing and attending Pokemon/trading card shows. Show hosts can create and manage events; vendors apply for table spots, get approved, and pay. Attendees can browse shows, view vendor rosters, and follow along via a show forum.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Railway |
| ORM | Prisma |
| Auth | Custom JWT (httpOnly cookie) |
| Email | Resend |
| Image/Video uploads | Cloudinary |
| Hosting | Railway |
| Styling | Tailwind CSS + custom `ps-*` design tokens |

---

## Feature Map

### Shows
- Create a show with name, location, date, description, flier, vendor map, floor plan
- Custom slug (URL-friendly identifier)
- Published/unpublished toggle
- Announcement banner
- Show countdown timer
- Applications open/closed toggle with timestamp tracking
- Per-show color theme (red, blue, green, etc.)
- Tagline and social links (Instagram, etc.)
- OnTreasure marketplace embed (via `ontreasureUsername` + `ontreasureEventSlug`)
- Custom content blocks (flexible sections: text, links, schedule, etc.)
- FAQ section (JSON)
- Logistics notes
- Schedule (JSON)

### Table Tiers
- Hosts define tiers per show (e.g. "Standard — $50", "Premium — $100")
- Each tier has: name, description, price, quantity cap, color label, sort order
- Vendors request a specific tier when applying; host can override on approval

### Vendor Applications
- Vendors apply via show page — picks a tier, quantity, inventory types, estimated value, Instagram, website, note
- Statuses: `pending` → `approved` → `confirmed` (paid), or `rejected`, or `invited`
- Hosts can approve with custom tier/quantity/table number assignment
- Hosts can invite vendors directly by email (generates invite token)
- Revenue tracking: paid (confirmed) vs pending (approved) shown in dashboard

### Emails (via Resend)
- **Application received** — sent to vendor when they apply
- **Approved** — sent to vendor when host approves; includes Venmo payment link if host has `venmoHandle` set
- **Rejected** — sent to vendor when declined
- **Confirmed** — sent to vendor when host marks as paid/confirmed
- **Invite** — sent to vendor when host invites them directly; links to `/shows/[slug]/apply?token=...`
- **Email blast** — host sends custom message to a group (active, confirmed, approved, pending, or all)

### User Profiles
- Name, business name, bio, profile image (Cloudinary)
- Instagram handle
- Inventory showcase (photos with captions — shown on profile page)
- Shows they've vendored at

### Forum
- Per-show discussion forum with threaded replies
- Post tagging (general, etc.)
- Upvote system (one vote per user per post)

### Direct Messages
- DM between users, tied to a show context
- Can be initiated from forum posts

### Dashboard
- Host dashboard: shows they're running, vendor stats
- Vendor dashboard: shows they've applied to, statuses

---

## Current Environment Variables

```
DATABASE_URL          # PostgreSQL (Railway auto-provides in production)
JWT_SECRET            # Auth token signing
NEXT_PUBLIC_APP_URL   # Full domain (http://localhost:3000 locally, Railway URL in prod)
RESEND_API_KEY        # Resend email sending
RESEND_FROM           # Sender address (currently onboarding@resend.dev for testing)
CLOUDINARY_CLOUD_NAME # Image/video uploads
CLOUDINARY_UPLOAD_PRESET # Cloudinary upload preset (unsigned)
```

---

## TODO / Known Issues

### High Priority
- [ ] **Verify sending domain in Resend** — `onboarding@resend.dev` can only deliver to the Resend account's own email. All vendor emails (approval, blast, etc.) will be dropped for anyone else. Go to resend.com/domains, add your domain, add the DNS records, then update `RESEND_FROM` in both `.env` and Railway env vars to `Card Show Central <noreply@cardshowcentral.com>`. Once done, blast will use the batch API (already in place) which is efficient for large lists.
- [ ] **Invite acceptance flow** — The invite email links to `/shows/[slug]/apply?token=...` but the apply page may not currently read or validate the token param. Verify this works end-to-end and handle the case where a user without an account receives an invite.

### Medium Priority
- [ ] **Messages UI** — `DirectMessage` model and `/messages` page exist but the full real-time/notification experience may need polish. Check unread count in navbar, notification badge.
- [ ] **Socket/real-time** — `src/lib/socket.ts` exists suggesting real-time was started. Determine if this is wired up or a stub.
- [ ] **Inventory showcase** — Users can add inventory items (photos) to their profile. Verify the profile page displays these in a clean grid and the upload flow works end-to-end.
- [ ] **Forum tags** — Forum posts have a `tag` field defaulting to "general". Expand tag options and add filtering UI if more tag types are wanted.
- [ ] **Show floor plan** — `floorPlan` is a JSON field on Show. Determine if there's a UI for viewing/editing this or if it's still a stub.

### Low Priority / Nice to Have
- [ ] **Password reset flow** — No forgot-password/reset route exists. Users who forget their password have no recovery path.
- [ ] **Pagination** — Vendor list, forum, and inventory grids all load everything at once. Add pagination or infinite scroll once data volumes grow.
- [ ] **Email unsubscribe** — No unsubscribe link in blast or transactional emails. Needed for CAN-SPAM compliance at scale.
- [ ] **Show search / discovery** — Homepage shows all shows but no search or filter by location/date.
- [ ] **Vendor public profile** — `/users/[id]` page exists. Confirm it shows their business name, bio, inventory, and past shows in a way that's useful to hosts reviewing applicants.
- [ ] **ADD ALSO A TEXT BLAST FOR URGENT MESSAGES**

---

## Key File Locations

```
src/lib/email.ts                          — All email templates + send functions
src/lib/auth.ts                           — JWT auth helpers
src/lib/themes.ts                         — Show color theme definitions
src/app/api/shows/[slug]/vendors/route.ts — Vendor apply, approve, reject, confirm, invite
src/app/api/shows/[slug]/blast/route.ts   — Email blast
src/app/api/shows/[slug]/tiers/route.ts   — Table tier CRUD
src/app/api/shows/[slug]/blocks/route.ts  — Content block CRUD
src/app/shows/[slug]/edit/VendorDashboard.tsx — Full host vendor management UI
src/app/shows/[slug]/edit/TableTierManager.tsx — Tier setup UI
src/app/shows/[slug]/edit/ContentBlockEditor.tsx — Custom content blocks UI
prisma/schema.prisma                      — Full data model
```
