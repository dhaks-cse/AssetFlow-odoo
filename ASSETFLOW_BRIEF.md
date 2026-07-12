# AssetFlow — 8-Hour Hackathon Build Brief

**Team size:** 2
**Problem:** AssetFlow — Enterprise Asset & Resource Management System
**Goal:** Ship a working, demoable app. Not a complete one.

---

## 0. The Core Strategy

The spec is a **menu, not a contract**. It's ~10 screens, 9 entities, 4 roles, 5 workflows — a 2–3 week build. Nobody in the room will finish it.

The real test: **identify the 30% that matters, build it flawlessly, and defend the cut.**

Real build time is ~5 hours, not 8. Setup, integration friction, debugging, seed data, and demo rehearsal eat the other 3.

**Build vertically, not horizontally.** One complete slice working end-to-end beats six modules at 60%.

---

## 1. Tech Stack (LOCKED — do not revisit)

```
Next.js 14 (App Router, TypeScript)
Prisma ORM
Postgres → Supabase (hosted, free tier)
Auth: Supabase Auth  (fallback: Auth.js credentials)
shadcn/ui + Tailwind CSS
Recharts (3 fixed charts only)
html5-qrcode + qrcode.react  ← the novelty
Deploy: Vercel
```

One repo. One deploy. No CORS. No separate backend.

### Setup (do this BEFORE the clock starts)

```bash
npx create-next-app@latest assetflow --typescript --tailwind --app
cd assetflow
npx shadcn@latest init
npx shadcn@latest add button card table dialog form input select \
  badge tabs calendar sonner dropdown-menu avatar sheet skeleton
npm i prisma @prisma/client @supabase/supabase-js bcryptjs zod recharts \
  html5-qrcode qrcode.react date-fns
npx prisma init
```

Then: create the Supabase project, paste the connection string into `.env`, and **deploy the empty app to Vercel immediately.** Never let your first deploy happen under pressure at hour 8.

---

## 2. The Two Innovations (this is what wins)

### Innovation 1 — QR Audit Mode (~50 min)

Auditor opens app on a phone → camera on → walks the floor → scans a QR sticker on a real asset → asset card appears instantly → taps **Verified / Missing / Damaged** → next. Offline queue in `localStorage`, syncs on reconnect.

Closing the cycle auto-generates the discrepancy report and flips confirmed-missing assets to `LOST`.

**Why it wins:** it's the only demo in the room that leaves the screen. You stand up, hold your phone to a real laptop, and it appears on the projector.

**Prep:** print 5 QR stickers before the hackathon. Stick them on a laptop, a chair, a monitor. The QR just encodes the asset tag (`AF-0001`).

### Innovation 2 — Conflict → Workflow, not Conflict → Error (~40 min)

The Priya/Raj example in the spec is the most-judged interaction in the whole document. Most teams ship a red toast: *"Asset already allocated."* Dead end.

You ship a resolution panel:

> **AF-0114 · MacBook Pro 14"** — held by **Priya Sharma** (Design)
> Allocated Nov 3 · Due Dec 15 · **4 days overdue**
>
> `[Request Transfer]` `[Notify Priya]` `[Find Similar Available]`

- **Find Similar** → queries same category, shows 3 free alternatives
- **Request Transfer** → fires the real approval workflow (Requested → Approved by Asset Manager → auto-reallocated, history updated)

**The line for the judges:** *"We treated the conflict as a workflow, not an error."*

### Innovation budget = ~90 minutes. Total.

That's it. That's the two above. Do not plan for a third.

**Stretch (only if genuinely ahead at hour 6):** centralized asset state machine visualized on the asset detail page, or an "Idle Asset Recovery" worklist with action buttons.

---

## 3. The Two SQL Constraints That Beat Everyone

Enforce the core business rules **at the database layer**, not in JavaScript. Other teams will validate in JS; a judge double-clicking fast will break theirs.

**Rule 1 — no double-allocation:**
```sql
CREATE UNIQUE INDEX one_active_allocation
  ON "Allocation" ("assetId") WHERE "returnedAt" IS NULL;
```

**Rule 2 — no overlapping bookings:**
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking" ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    "assetId" WITH =,
    tstzrange("startTime", "endTime") WITH &&
  ) WHERE (status <> 'CANCELLED');
```

`tstzrange` is half-open, so 9:00–10:00 and 10:00–11:00 correctly do **not** overlap — which is the spec's exact example. 9:30–10:30 against 9:00–10:00 correctly **does**.

**Say this out loud in the demo.** 30 seconds of pure engineering credibility.

---

## 4. Other Implementation Non-Negotiables

- **Overdue is DERIVED, never stored.** `expectedReturnDate < now() AND returnedAt IS NULL`. One query powers dashboard + notifications + conflict panel. No cron job, no stale boolean.
- **Asset status transitions go through ONE function.** Seven states (`AVAILABLE, ALLOCATED, RESERVED, UNDER_MAINTENANCE, LOST, RETIRED, DISPOSED`) mutated by four subsystems. Scatter `asset.status = "X"` across twelve files and you'll spend hour 7 in a bug swamp. Centralize it. Reject illegal transitions.
- **RBAC must be real.** The spec is explicit: **signup creates an Employee only.** Roles are assigned exclusively by Admin in the Employee Directory. Putting a role dropdown on the signup form is an instant credibility hit with any judge who read the spec.
- **Audit cycle closure is transactional.** Lock the cycle + generate the discrepancy report + cascade asset status changes — atomically. It's the only multi-entity transaction in the spec, and 90% of teams will leave it half-built because it's the last screen listed.

---

## 5. The 8-Hour Plan (2 people)

**Person A — "Data & Rules"** (schema, business logic, the stuff judges test)
**Person B — "Surface"** (UI, dashboard, the stuff judges see)

### Hour 0–1 — TOGETHER. Do not skip.
Lock the schema. Both of you, one screen, 45 minutes. **Nobody touches it after hour 1.** A schema change at hour 5 with two people building on it is how teams die.

Then: repo, auth scaffold, first deploy.

| Hour | Person A | Person B |
|------|----------|----------|
| 1–2 | Schema + seed script (12 depts, 40 assets, allocation history, one pre-loaded overdue return for the demo) | Design system, layout shell, nav, auth screens (employee-only signup) |
| 2–3 | Asset registry: register, search, filter, lifecycle. Auto asset tag `AF-0001` | Asset directory UI + asset detail page (history tabs) |
| 3–4 | **Allocation + conflict rule + transfer workflow** ← highest-value hour of the day | **Conflict resolution panel** (Innovation 2) |
| 4–5 | Booking overlap constraint. Maintenance approval workflow | Booking calendar UI. Maintenance request UI |
| 5–6 | Audit cycle: create, assign auditors, mark assets, discrepancy report, close → flip missing to LOST | **QR Audit Mode** (Innovation 1). Scanner + mobile view |
| 6–7 | Notifications + activity log (one append-only `events` table). Overdue flagging | Dashboard: KPI cards, overdue vs upcoming, quick actions. 3 fixed charts |
| 7–8 | **BOTH: FREEZE CODE.** Seed final demo data. Print QR stickers. Rehearse the demo 3× out loud with a timer. Fix only demo-blocking bugs. | |

**Hour 7 is not build time. It's demo time.** Teams that code until 7:55 lose to teams that rehearsed.

---

## 6. The Cut List (decide NOW, not at hour 6)

| BUILD | CUT |
|-------|-----|
| Auth + 4 roles | Forgot password (fake it) |
| Org setup (3 tabs) | Parent-department hierarchy |
| Asset registry + lifecycle | Document management (one image field only) |
| **Allocation + conflict + transfer** | Waitlist |
| **Booking + overlap** | Reschedule (cancel + rebook is fine) |
| Maintenance approval workflow | Technician assignment |
| **Audit cycles + QR mode** | — |
| Dashboard + notifications + activity log | Email notifications (in-app only) |
| 3 fixed charts | Exportable / custom reports |

---

## 7. The 5-Minute Demo Script (rehearse this 3×)

1. **(20s) The line:** *"Most asset trackers tell you where things are. AssetFlow tells you what to do when there's a conflict — and lets you audit an entire floor with your phone."*
2. **(40s)** Admin creates a department, promotes an employee to Asset Manager. *Shows RBAC is real, not self-assigned.*
3. **(60s)** Raj tries to allocate Priya's laptop → **conflict panel** → *"we treated the conflict as a workflow, not an error"* → Request Transfer → approve as manager → history updates live.
4. **(45s)** Book Room B2 9:00–10:00. Try 9:30–10:30 → rejected. Try 10:00–11:00 → accepted. **Say the rule out loud, mention it's a DB-level exclusion constraint.**
5. **(90s)** **Stand up. Hold up your phone.** Scan the QR sticker on a real laptop → Verified. Scan a chair → Missing. Close the cycle → discrepancy report generates → the chair is now `LOST`.
6. **(30s)** Dashboard. Overdue returns in red. Activity log — every action, who, when.
7. **(15s)** *"Two people, eight hours. We deliberately cut reporting and document management to make sure every core workflow actually works."*

**Say that last line.** Scoping discipline reads as a strength, not an apology.

---

## 8. Failure Modes to Avoid

- Changing the schema after hour 1
- Building horizontally (six modules at 60%) instead of vertically
- Starting the innovations before the spine works
- First deploy at hour 8
- Coding until 7:55 with no rehearsal
- A role dropdown on the signup form
- Validating booking overlap in JavaScript only

---

## Next Step

Write the Prisma schema (9 models) + seed script. Lock it before hour 0.
