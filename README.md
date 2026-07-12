# AssetFlow

**Enterprise Asset & Resource Management System**
Built in 8 hours by 2 people.

🔗 **Live:** https://asset-flow-odoo.vercel.app

🎥 **Demo:** https://drive.google.com/drive/folders/1xSvmN7R9oaIRoDFMfvTK1uG31-NwItAg?usp=sharing

---

## Try it in 10 seconds

The login page has one-click role buttons. No typing.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@assetflow.io` | `password123` |
| Asset Manager | `manager@assetflow.io` | `password123` |
| Department Head | `head@assetflow.io` | `password123` |
| Employee | `raj@assetflow.io` | `password123` |

**Three things worth trying, in order:**

1. **Log in as Raj → try to allocate `AF-0114`.** It's held by Priya, 4 days overdue. Watch what happens instead of an error.
2. **Book Room B2 (`AF-0121`) for 9:30–10:30 today.** Rejected — 9:00–10:00 is taken. Now try 10:00–11:00. Accepted.
3. **Open the audit cycle on your phone.** Scan any QR from `/qr-stickers`. Mark it Verified.

---

## What makes this different

### 1. Conflict as a workflow, not an error

The spec's example: *Priya has laptop AF-0114. Raj tries to allocate it too.*

Most implementations return `"Asset already allocated"` and stop. A dead end.

AssetFlow returns a **resolution panel**: who holds it, since when, whether it's overdue, and three ways forward — Request Transfer, Notify Holder, or Find Similar Available. `Request Transfer` fires the real approval chain and, on approval, closes the old allocation and opens the new one in a single transaction.

The rejection becomes the entry point to the next action.

### 2. Business rules live in the database, not in JavaScript

Two rules in the spec are the ones a user will actually try to break. Both are enforced by Postgres itself:

```sql
-- An asset cannot be allocated twice.
CREATE UNIQUE INDEX one_active_allocation
  ON "Allocation" ("assetId") WHERE "returnedAt" IS NULL;

-- Bookings for one resource cannot overlap.
ALTER TABLE "Booking" ADD CONSTRAINT no_booking_overlap
  EXCLUDE USING gist (
    "assetId" WITH =,
    tstzrange("startTime", "endTime") WITH &&
  ) WHERE (status <> 'CANCELLED');
```

`tstzrange` is half-open, so `[09:00, 10:00)` and `[10:00, 11:00)` do **not** conflict, while `[09:30, 10:30)` does — exactly the rule in the spec, expressed once, in the one place that can't be bypassed.

Application-layer validation loses to a fast double-click. This doesn't.

### 3. QR audit mode — auditors walk the floor

Auditors don't sit at a desk with a spreadsheet. Open the audit cycle on a phone, point the camera at an asset's QR tag, tap Verified / Missing / Damaged, move to the next one. Results queue in `localStorage` when offline and sync on reconnect.

Closing a cycle is one transaction: lock the cycle, generate the discrepancy report, and cascade every `MISSING` asset to `LOST`.

### 4. One state machine, not fifteen scattered assignments

Four subsystems mutate asset status — allocation, booking, maintenance, audit. Every one of them goes through a single `transitionAsset()` function ([`lib/asset-state.ts`](lib/asset-state.ts)) that rejects illegal transitions and appends to an immutable activity log.

You can't allocate an asset that's under maintenance. Not because we remembered to check, but because the transition table says so.

---

## Stack

Next.js 14 (App Router) · TypeScript · Prisma · Postgres (Supabase) · Auth.js · shadcn/ui · Tailwind · Recharts · html5-qrcode · Vercel

Server Components + Server Actions throughout. No separate API layer.

---

## What we built

- [x] Auth with real RBAC — **signup creates an Employee only.** There is no role dropdown, because self-assigning as Admin isn't a thing in a real org. Roles are granted by an Admin in the Employee Directory.
- [x] Organization setup — departments, asset categories, employee directory
- [x] Asset registry — full lifecycle across 7 states, auto-generated tags, search & filter
- [x] Allocation, transfer approval chain, and returns with condition check-in
- [x] Resource booking with DB-enforced overlap prevention
- [x] Maintenance approval workflow with automatic status transitions
- [x] Audit cycles + QR scanning + discrepancy reports
- [x] Dashboard, notifications, immutable activity log

## What we deliberately cut

We had 8 hours and 2 people. These were dropped **on purpose**, so that everything above actually works:

- Custom report builder → three fixed charts instead
- Document management → single image field per asset
- Email notifications → in-app only
- Parent-department hierarchy
- Technician assignment UI in the maintenance flow

We'd rather ship five workflows that hold up under pressure than ten that fall over.

---

## Run it locally

```bash
git clone <repo> && cd assetflow
npm install
cp .env.example .env          # add your Postgres URLs

npx prisma migrate dev
npm run db:constraints        # ← the two rules above. Not optional.
npx prisma db seed

npm run dev
```

`db:constraints` applies the raw SQL that Prisma can't express. Skip it and the app still runs — it just stops being correct.

---

## Seed data

40 assets across 12 departments, with allocation history, an open audit cycle, and a few things deliberately broken so the demo has something to show:

- `AF-0114` (MacBook Pro) — held by Priya, **4 days overdue**
- `AF-0121` (Room B2) — booked 09:00–10:00 today
- Three MacBooks sitting Available, so *Find Similar* has real answers
- Every Floor 3 asset pre-loaded as a pending audit item
