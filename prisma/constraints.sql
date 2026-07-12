-- ═══════════════════════════════════════════════════════════════
-- AssetFlow — DB-LEVEL BUSINESS RULES
-- Prisma cannot express these. Run AFTER `prisma migrate dev`.
--
--   npx prisma db execute --file prisma/constraints.sql --schema prisma/schema.prisma
--
-- These are what make your app unbreakable when a judge
-- double-clicks fast. Other teams validate in JavaScript.
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- RULE 1: An asset can have at most ONE active allocation.
--
-- Spec: "Priya has Laptop AF-0114. If Raj tries to allocate it too,
--        the system blocks it."
--
-- returnedAt IS NULL means "currently held". A partial unique index
-- makes a second concurrent allocation physically impossible.
-- ───────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS one_active_allocation
  ON "Allocation" ("assetId")
  WHERE "returnedAt" IS NULL;


-- ───────────────────────────────────────────────────────────────
-- RULE 2: Bookings for the same asset must not overlap in time.
--
-- Spec: "Room B2 is booked 9:00-10:00. A request for 9:30-10:30 gets
--        rejected since it overlaps; a request for 10:00-11:00 is fine
--        since it starts right after."
--
-- tstzrange defaults to '[)' — half-open. So [09:00,10:00) and
-- [10:00,11:00) do NOT overlap, but [09:30,10:30) DOES.
-- That is exactly the spec's rule, enforced by Postgres itself.
--
-- Cancelled bookings are excluded from the constraint.
-- ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS no_booking_overlap;

ALTER TABLE "Booking" ADD CONSTRAINT no_booking_overlap
  EXCLUDE USING gist (
    "assetId" WITH =,
    tstzrange("startTime", "endTime") WITH &&
  )
  WHERE (status <> 'CANCELLED');


-- ───────────────────────────────────────────────────────────────
-- RULE 3: Sanity — a booking can't end before it starts.
-- ───────────────────────────────────────────────────────────────

ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS booking_time_sane;

ALTER TABLE "Booking" ADD CONSTRAINT booking_time_sane
  CHECK ("endTime" > "startTime");


-- ═══════════════════════════════════════════════════════════════
-- CATCHING THE VIOLATIONS IN YOUR CODE
--
-- Both constraints throw Prisma error code P2010 / raw Postgres 23P01
-- (exclusion_violation) or 23505 (unique_violation).
--
-- try {
--   await prisma.booking.create({ data });
-- } catch (e) {
--   if (e.code === 'P2002' || e.message.includes('no_booking_overlap')) {
--     return { error: 'That slot overlaps an existing booking.' };
--   }
--   throw e;
-- }
--
-- For allocation, catch the unique violation and return the
-- CONFLICT PANEL payload (current holder, since when, due date,
-- overdue flag, similar available assets) — not a plain error.
-- ═══════════════════════════════════════════════════════════════
