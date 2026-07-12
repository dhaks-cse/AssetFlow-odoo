# START HERE

You are 8 hours from a submission. Read this page, then stop reading and start doing.

---

## What's in this folder

| File | When you use it |
|---|---|
| **START_HERE.md** | Right now |
| **ASSETFLOW_BRIEF.md** | The strategy. Scope, the 2 innovations, the cut list, the hour-by-hour plan. **Read this once, fully.** |
| **SETUP.md** | Tonight. Getting the DB alive. |
| **setup.sh** | Tonight. `bash setup.sh` — automates most of SETUP.md. |
| **.env.example** | Tonight. Copy to `.env`, paste your Supabase URLs. |
| **prisma/schema.prisma** | Lock it at hour 1. Never touch it again. |
| **prisma/constraints.sql** | The two DB rules. **Not optional.** |
| **prisma/seed.ts** | Demo-staged data. The conflict, the booking, and the audit cycle are pre-loaded. |
| **lib/asset-state.ts** | The only place `asset.status` is ever written. |
| **CLAUDE_CODE_PROMPTS.md** | Tomorrow. 7 prompts, one per vertical slice. Feed them **one at a time.** |
| **public/qr-stickers.html** | Print tonight at 100% scale. |
| **DEMO_VIDEO_SCRIPT.md** | Hour 6:30. Shot list and timings. |
| **README_TEMPLATE.md** | Hour 6:00. Rename to `README.md`, fill in the URLs. |

---

## Tonight (≈45 min) — do not skip any of these

```bash
# 1. Scaffold Next.js INTO this folder (it keeps prisma/ and lib/)
bash setup.sh

# It will stop and tell you to fill in .env. Do that:
#   - supabase.com → New Project → save the DB password
#   - Settings → Database → Connection String → ORMs tab
#   - copy the 6543 URL → DATABASE_URL
#   - copy the 5432 URL → DIRECT_URL
#   - openssl rand -base64 32 → NEXTAUTH_SECRET

bash setup.sh        # run it again — now it migrates, constrains, seeds
```

Then, in order:

**1. Verify the constraints throw.** Supabase → SQL Editor → run both tests in `SETUP.md` §5. **Both must ERROR.** If either succeeds, your two headline business rules are fake and you'll discover it on camera. Do not proceed until both fail.

**2. Deploy empty to Vercel.** Green build of a blank page, tonight. Never let your first deploy happen at hour 8.

**3. Print the QR stickers.** `public/qr-stickers.html` → Print → **100% scale**, not "fit to page". Tape AF-0114 to a laptop, AF-0109 to a chair, AF-0105 to a monitor. **Scan each with your phone.** If it doesn't decode instantly, reprint bigger.

### Tonight's finish line

- [ ] `npx prisma studio` → 40 assets, AF-0114 is `ALLOCATED`
- [ ] Both SQL tests throw errors
- [ ] Green Vercel deploy at a live URL
- [ ] Three stickers printed, taped, phone-tested
- [ ] Repo pushed to GitHub

---

## Tomorrow

**Hour 0:** open Claude Code → feed it **Prompt 0** from `CLAUDE_CODE_PROMPTS.md`.

Then work one slice at a time. Each prompt has a test at the bottom. **Do not advance until it passes.**

**Hour 6:00 — HARD FREEZE.** No new features, ever. Video + README take 90 minutes and teams always underestimate this.

---

## The three rules

**1. Build vertically.** One complete slice working end-to-end beats six modules at 60%. Every single time.

**2. The schema is frozen at hour 1.** A schema change at hour 5 with two people building on it is how teams die.

**3. Never cut these five:** auth, asset directory, allocation + conflict panel, booking overlap, QR audit mode.

Everything else is decoration. Cut reports first, then the activity log page, then maintenance, then notifications — in that order, without debate.

---

## Why this wins

Eleven other teams will build ten mediocre CRUD screens and ship a red toast that says *"Asset already allocated."*

You ship a **resolution panel** — who holds it, how overdue, and three ways forward. And you ship an **audit mode that runs on a phone**, so your demo video opens with a hand scanning a real laptop instead of a login form.

That's the whole edge. Protect those two things and cut anything that threatens them.
