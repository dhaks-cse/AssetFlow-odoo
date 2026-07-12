# AssetFlow — Demo Video Script

**Target: 3:00. Hard ceiling 4:00.** Judges watch a dozen of these. Respect their time and they'll like you for it.

**Record at 1080p minimum. Use a real mic (even earbuds beat laptop mic).**

---

## ⚠️ Read this before you record

**Do a silent dry run first.** Click through the entire path with no recording, no talking. Find the bug. There is always a bug. Fix it, then record.

**Record in segments, not one take.** Screen recording is not a live demo — you can stitch. If you fluff a line, stop, re-record that segment only.

**Script your words. Actually write them. Actually read them aloud.** Unscripted narration is full of "um, so, basically, as you can see here..." and it makes 3 minutes feel like 10.

**Hide your bookmarks bar. Close other tabs. Full-screen the browser.** Free professionalism.

---

## SHOT LIST

### 🎬 0:00–0:12 — COLD OPEN. No talking. No logo. No title card.

**Shot:** Phone camera, held in hand, scanning the QR sticker taped to a real laptop.
**Cut to:** The app on screen — asset card slides in: *AF-0114 · MacBook Pro 14" · Floor 3 — Design*.
**Thumb taps:** `Verified`. Scanner resumes instantly.

*Sound: nothing but the scan beep. Let it breathe.*

> **Why:** Every other video in that queue opens with a login screen. Yours opens with a hand touching a real object. A judge on submission #9 will sit up.

---

### 🎬 0:12–0:30 — The line

**Shot:** Dashboard, clean, seeded, with red overdue cards visible.

> *"Most asset trackers tell you where things are.*
> *AssetFlow tells you what to do when there's a conflict — and lets you audit an entire floor with your phone.*
> *Built in eight hours by two people."*

Say the last sentence. It reframes everything they're about to see.

---

### 🎬 0:30–1:00 — RBAC is real

**Shot:** Sign up as a new user. Land in the app. **Point at the absence of a role picker.**

> *"The spec is explicit: signup creates an Employee. There's no role dropdown — because in a real organization you don't self-assign as Admin.*
> *Roles are granted here, by an Admin, in the Employee Directory."*

**Cut to:** Admin promotes that new employee to Asset Manager. Their permissions change live.

> **Why:** Half the teams will ship a role dropdown on signup. Calling this out shows you *read* the spec instead of skimming it.

---

### 🎬 1:00–1:50 — ★ THE CONFLICT PANEL (your best 50 seconds)

**Shot:** Logged in as **Raj**. He tries to allocate **AF-0114**.

**A panel appears — not a red toast:**

> 🔒 **AF-0114 · MacBook Pro 14"** — held by **Priya Sharma** (Design)
> Allocated Nov 3 · Due Dec 15 · ⚠️ **4 days overdue**
> `[Request Transfer]` `[Notify Priya]` `[Find Similar Available]`

> *"Most systems would stop here with 'asset unavailable.' A dead end.*
> *We treated the conflict as a workflow, not an error."*

**Click `Find Similar`** → three available MacBooks appear.
**Click `Request Transfer`** → switch to the Asset Manager → approve → **cut back to Raj's screen, the laptop is now his**, and the asset history shows the handover.

> *"One click from blocked to resolved. Priya's allocation closed, Raj's opened, history updated — one database transaction."*

---

### 🎬 1:50–2:20 — The constraint flex

**Shot:** Booking calendar. Room B2 already shows **9:00–10:00**.

- Try **9:30–10:30** → rejected, clean message
- Try **10:00–11:00** → accepted

> *"Overlapping bookings aren't validated in JavaScript. They're a Postgres exclusion constraint — a half-open time range, so 10-to-11 is legal but 9:30-to-10:30 isn't.*
> *The database physically cannot store an overlap. Same for double-allocation: a partial unique index. No race condition, no matter how fast you click."*

**Optional 5-second shot:** two browser windows, both click Allocate simultaneously. One wins. One gets the conflict panel.

> **Why:** This is the single most engineering-credible thing in your video. It takes 30 seconds and almost nobody else will have thought about concurrency.

---

### 🎬 2:20–2:50 — ★ CLOSE THE LOOP ON THE QR

**Callback to the cold open.** Now you explain it.

**Shot:** Phone. Scan the chair (**AF-0109**) → tap **Missing**. Scan the monitor (**AF-0105**) → tap **Verified**. Progress bar climbs.

> *"Auditors don't sit at a desk with a spreadsheet. They walk the floor.*
> *Works offline — results queue locally and sync when you reconnect."*

**Cut to desktop:** Asset Manager clicks **Close Cycle**.
→ Discrepancy report generates.
→ **AF-0109 flips to `LOST` automatically.**

> *"Closing the cycle locks it, generates the discrepancy report, and cascades the status changes — atomically."*

---

### 🎬 2:50–3:00 — The close (say this exactly)

**Shot:** Dashboard. Overdue in red. Activity log scrolling.

> *"Two people, eight hours.*
> *We deliberately cut custom reporting and document management — because we'd rather have five workflows that actually work than ten that half-work.*
> *Everything you just saw is live at the link below."*

**End card:** Deployed URL · GitHub URL · demo credentials.

**Do not** end on a "Thank you!" slide with a stock image. End on the URL.

---

## What NOT to put in the video

- ❌ A team intro slide with your photos
- ❌ A "Tech Stack" slide with logos. (Show the code briefly if you must. Nobody cares about the Next.js logo.)
- ❌ A "Problem Statement" recap — *the judges wrote it*
- ❌ An architecture diagram you narrate for 40 seconds
- ❌ Scrolling through code
- ❌ Background music with vocals
- ❌ Any screen where something is loading for more than 2 seconds — **cut it out in the edit**

Every second spent on the above is a second not spent on the conflict panel or the QR scan.

---

## Recording setup

| | |
|---|---|
| Screen | OBS (free) or Loom. 1080p. |
| Phone shots | Second phone, or ask a friend. Steady, good light. |
| Editing | CapCut / DaVinci Resolve (free). You only need cuts, not effects. |
| Audio | Record narration separately over the footage if your live take is shaky. Much easier. |
| Music | Instrumental, low, or none. Never vocals. |

---

## Final checklist before you export

- [ ] Bookmarks bar hidden, no personal tabs visible
- [ ] No console errors visible on screen
- [ ] No loading spinner on screen for >2s
- [ ] Deployed URL and demo credentials on the end card
- [ ] Video is under 4:00
- [ ] Audio is audible at 50% volume
- [ ] You watched it back once, all the way through, without skipping

Then upload. **Give yourself 30 minutes for the upload to fail.** It will.
