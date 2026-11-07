# ServiceLoop frontend

The marketplace is connected to the NestJS API in `../backend`. Equipment, saved listings, owner inventory and quote requests come from PostgreSQL through Prisma. No sample inventory or browser-local request data is used by the routed app.

## Development

Start PostgreSQL and the backend first (see `../backend/README.md`), then:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend uses `/api` by default. Vite proxies it to `http://127.0.0.1:3001`; override `API_PROXY_TARGET` for a different local server. Waitlist apps use the same convention. No Supabase keys belong in this frontend.

Sign in or create a renter/owner account. Saved equipment, request submission, quote responses and owner inventory require an account. New listings remain pending until an administrator approves them. Owners can see incoming requests and send quotes from **My requests**. Requesters can accept, decline or cancel in the same workspace. Refresh the workspace to fetch another user's latest responses.

Sessions use HttpOnly cookies and in-memory access tokens. Page reloads restore the account through `/auth/me`. Signing out revokes the server session. Account data is never stored in localStorage. Existing demo storage is ignored.

## Booking details

Accepting a quote creates a booking and opens `/bookings/:id`. Renters and owners can reopen it from **Bookings**, or the accepted request's **View booking details** link. The page shows the reference, equipment, project contacts, inclusive start/end dates, agreed total in NGN, provider terms and project notes. References can be copied and details printed.

These details are saved at acceptance and remain unchanged if an owner edits or archives the listing. Requests include a booking link; the frontend supplies the displayed quote's `updatedAt` when accepting so a revised quote must be reviewed first. Direct links restore the signed-in account, and unrelated accounts cannot read another rental's details.

Apply backend migrations and deploy the API before this frontend. Earlier accepted quotes receive booking records during migration; their equipment/contact snapshots are labelled as imported.

## Booking dashboard

The signed-in dashboard at `/bookings` shows accepted quotes, live holds, bookings needing attention and the agreed value of non-cancelled quotes (not payments). Owners can switch between all their bookings, equipment they are renting and equipment they are providing. Every figure comes from the existing account-scoped booking API.

Filter by reservation status; search by equipment, reference, location, provider or renter; sort by acceptance or rental start date; and page through eight records at a time. These controls are stored in the URL and survive reloads. Search and status filters apply to the list; summary figures and planned dates reflect the selected renter/provider perspective. The Coming up panel excludes cancelled and past-start bookings, and labels future dates as plans awaiting confirmation.

Live countdowns, status filters and totals update together when a hold expires. Returning to the window or using Refresh bookings fetches changes made by the other party. Each card opens the booking detail page for contacts, terms, re-reservation and cancellation. Old `/requests?tab=bookings` links redirect to the dashboard. No additional database migration is needed beyond the booking and reservation migrations below.

## Handover and return previews

Equipment bookings have protected `/bookings/:id/handover` and `/bookings/:id/return` screens, linked from the booking dashboard and booking detail page. They use the existing private booking API for the equipment, parties, agreed dates and reservation state. General service bookings show a not-applicable message; cancelled bookings show a cancellation-specific lock.

The previews include condition notes, accessories, optional meter and fuel readings, photo areas, collection/return checklists and the proposed responsibilities of each party. The return screen clearly shows that no starting inspection has been recorded.

**These are intentionally locked until payments are added.** All inspection inputs, upload controls, save buttons and receipt acknowledgements are disabled. There are no inspection mutation endpoints, upload handlers, local drafts or manual-confirmation bypasses. Viewing a checklist does not confirm a booking, extend a hold or change availability. No backend changes or new migration are required for these screens.

Before enabling this workflow, implement server-verified payment/booking eligibility, ownership checks, inspection storage, secure photo uploads and both-party acknowledgements. Enabling the buttons alone is insufficient.

## Date reservations

Accepting an equipment quote now reserves its dates for **2 hours**, subject to availability. The booking page displays a server-based countdown and exact expiry in Nigeria time (WAT). Expired holds stop blocking dates automatically in the API, even when every browser is closed. The renter can check and reserve again after expiry. Retrying an active hold never extends its deadline.

The renter or owner can cancel from the booking page; cancellation releases dates immediately and keeps the agreed quote history. Older bookings start unreserved and offer **Reserve dates** to the renter. General service bookings have no equipment hold.

Equipment detail and quote forms check availability for the selected start and duration, show unavailable-date feedback, and disable submission while dates are blocked or being checked. Acceptance checks again to handle competing renters. Booking cards show the reservation state, and returning to the browser window refreshes availability/status. Payments and final rental confirmation are still to come.

Run `npm --prefix ../backend run db:deploy` and rebuild/restart the backend before running this frontend with your configured database.

## Deployment and Supabase

Set `VITE_API_URL` to the deployed backend's HTTPS `/api` URL when building the marketplace and each waitlist app. Add each frontend origin to the backend's `CORS_ORIGINS`. For frontend/API hosts on different sites, use `SESSION_COOKIE_SAMESITE=none` with `NODE_ENV=production` and HTTPS; a same-origin API proxy is preferable where browser third-party cookie restrictions apply.

Supabase is the PostgreSQL host. Add its private database connection string to **backend/.env** as `DATABASE_URL` when available, and set `DIRECT_URL` for migrations if using a transaction pooler at runtime. A Supabase anon/publishable key is not a Prisma database connection string. The current app uses the NestJS accounts/session system, not Supabase Auth. No live Supabase connection has been configured.

## Verification

```powershell
npm run build
npm run lint
npm --prefix ../backend run build
npm run test:e2e
```

The browser suite starts a real Nest API backed by a disposable PGlite PostgreSQL instance, the marketplace, and both waitlist entry points. It verifies saved-state persistence through cookies, quote acceptance into booking details, renter/owner access, private direct links, mobile layout, API failure/retry handling, owner listings awaiting approval and waitlist acknowledgements. Install dependencies in `../backend`, `../Waitlist`, and the root app before running it. The configured browser is Edge on Windows, Chromium elsewhere. The test database is ephemeral and ignores production credentials.
