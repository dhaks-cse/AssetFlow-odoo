import { PrismaClient, Role, AssetStatus, AssetCondition, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// This seed is DEMO-STAGED. It pre-loads:
//   • AF-0114 MacBook Pro — held by Priya, 4 days OVERDUE
//     (so Raj's allocation attempt triggers the Conflict Panel)
//   • Room B2 — booked 9:00–10:00 today
//     (so 9:30–10:30 is rejected, 10:00–11:00 is accepted)
//   • 3 similar available laptops (so "Find Similar" has results)
//   • An open audit cycle with items (so QR scanning has targets)
//
// Login for the demo:
//   admin@assetflow.io     / password123   (Admin)
//   manager@assetflow.io   / password123   (Asset Manager)
//   priya@assetflow.io     / password123   (Employee — holds AF-0114)
//   raj@assetflow.io       / password123   (Employee — will try to take it)
// ═══════════════════════════════════════════════════════════════

const PW = "password123";

const DEPARTMENTS = [
  ["Engineering", "ENG"], ["Design", "DSN"], ["Sales", "SLS"],
  ["Marketing", "MKT"], ["Finance", "FIN"], ["Human Resources", "HR"],
  ["Operations", "OPS"], ["Legal", "LGL"], ["Customer Support", "CS"],
  ["Facilities", "FAC"], ["IT Infrastructure", "ITI"], ["Research", "RND"],
];

const CATEGORIES: [string, any][] = [
  ["Electronics", { warrantyMonths: 24 }],
  ["Furniture", { material: "text" }],
  ["Vehicles", { fuelType: "text" }],
  ["Meeting Rooms", { capacity: "number" }],
  ["Lab Equipment", { calibrationDueMonths: 12 }],
];

function daysAgo(n: number) { return new Date(Date.now() - n * 864e5); }
function daysAhead(n: number) { return new Date(Date.now() + n * 864e5); }
function todayAt(h: number, m = 0) {
  const d = new Date(); d.setHours(h, m, 0, 0); return d;
}

async function main() {
  console.log("🧹 Clearing...");
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();

  const hash = await bcrypt.hash(PW, 10);

  // ── Departments ──────────────────────────────────────────────
  console.log("🏢 Departments...");
  const depts = await Promise.all(
    DEPARTMENTS.map(([name, code]) =>
      prisma.department.create({ data: { name, code } })
    )
  );
  const byCode = Object.fromEntries(depts.map((d) => [d.code, d]));

  // ── Categories ───────────────────────────────────────────────
  console.log("🗂  Categories...");
  const cats = await Promise.all(
    CATEGORIES.map(([name, customFields]) =>
      prisma.assetCategory.create({ data: { name, customFields } })
    )
  );
  const byCat = Object.fromEntries(cats.map((c) => [c.name, c]));

  // ── People ───────────────────────────────────────────────────
  console.log("👥 Employees...");
  const admin = await prisma.employee.create({
    data: { name: "Ananya Rao", email: "admin@assetflow.io", passwordHash: hash,
            role: Role.ADMIN, departmentId: byCode.OPS.id },
  });
  const manager = await prisma.employee.create({
    data: { name: "Vikram Mehta", email: "manager@assetflow.io", passwordHash: hash,
            role: Role.ASSET_MANAGER, departmentId: byCode.ITI.id },
  });
  const priya = await prisma.employee.create({
    data: { name: "Priya Sharma", email: "priya@assetflow.io", passwordHash: hash,
            role: Role.EMPLOYEE, departmentId: byCode.DSN.id },
  });
  const raj = await prisma.employee.create({
    data: { name: "Raj Patel", email: "raj@assetflow.io", passwordHash: hash,
            role: Role.EMPLOYEE, departmentId: byCode.ENG.id },
  });
  const deptHead = await prisma.employee.create({
    data: { name: "Sneha Iyer", email: "head@assetflow.io", passwordHash: hash,
            role: Role.DEPT_HEAD, departmentId: byCode.ENG.id },
  });
  await prisma.department.update({
    where: { id: byCode.ENG.id }, data: { headId: deptHead.id },
  });

  // A few more bodies so the directory doesn't look empty
  const FILLER = ["Arjun Nair", "Meera Krishnan", "Karthik Reddy", "Divya Menon",
                  "Rohan Gupta", "Ishita Bose", "Aditya Verma", "Nithya Raman"];
  const filler = await Promise.all(
    FILLER.map((name, i) =>
      prisma.employee.create({
        data: {
          name,
          email: name.toLowerCase().replace(" ", ".") + "@assetflow.io",
          passwordHash: hash,
          role: Role.EMPLOYEE,
          departmentId: depts[i % depts.length].id,
        },
      })
    )
  );
  const allEmployees = [priya, raj, deptHead, ...filler];

  // ── Assets ───────────────────────────────────────────────────
  // Tags run AF-0101 .. AF-0140. Position 14 lands on AF-0114 —
  // the MacBook from the spec's Priya/Raj example. Deliberate.
  console.log("💻 Assets...");

  const SPEC: [string, string, string, number, boolean][] = [
    // name, category, location, cost, bookable
    ["Dell Latitude 5540",     "Electronics", "Floor 2 — Engineering", 82000,  false], // AF-0101
    ["Dell Latitude 5540",     "Electronics", "Floor 2 — Engineering", 82000,  false],
    ["ThinkPad X1 Carbon",     "Electronics", "Floor 2 — Engineering", 145000, false],
    ["Dell UltraSharp U2723",  "Electronics", "Floor 2 — Engineering", 38000,  false],
    ["Dell UltraSharp U2723",  "Electronics", "Floor 3 — Design",      38000,  false],
    ["Dell UltraSharp U2723",  "Electronics", "Floor 3 — Design",      38000,  false],
    ["Logitech MX Master 3S",  "Electronics", "Floor 2 — Engineering", 8500,   false],
    ["HP LaserJet Pro M404",   "Electronics", "Floor 1 — Reception",   24000,  false],
    ["Herman Miller Aeron",    "Furniture",   "Floor 3 — Design",      95000,  false],
    ["Herman Miller Aeron",    "Furniture",   "Floor 3 — Design",      95000,  false],
    ["Standing Desk (Electric)","Furniture",  "Floor 2 — Engineering", 42000,  false],
    ["Standing Desk (Electric)","Furniture",  "Floor 2 — Engineering", 42000,  false],
    ["Steelcase Series 1",     "Furniture",   "Floor 1 — Sales",       28000,  false],
    ["MacBook Pro 14\"",       "Electronics", "Floor 3 — Design",      210000, false], // ★ AF-0114
    ["MacBook Pro 14\"",       "Electronics", "Floor 3 — Design",      210000, false], // similar #1
    ["MacBook Pro 14\"",       "Electronics", "IT Store Room",         210000, false], // similar #2
    ["MacBook Air 13\"",       "Electronics", "IT Store Room",         115000, false], // similar #3
    ["iPad Pro 11\"",          "Electronics", "Floor 3 — Design",      92000,  false],
    ["Wacom Cintiq 16",        "Electronics", "Floor 3 — Design",      68000,  false],
    ["Canon EOS R6",           "Electronics", "Marketing Store",       185000, false],
    ["Conference Room B2",     "Meeting Rooms", "Floor 2",             0,      true],  // ★ bookable
    ["Conference Room C1",     "Meeting Rooms", "Floor 3",             0,      true],
    ["Huddle Room A1",         "Meeting Rooms", "Floor 1",             0,      true],
    ["Board Room",             "Meeting Rooms", "Floor 4",             0,      true],
    ["Toyota Innova (TN-01-AB-1234)", "Vehicles", "Basement Parking",  1850000, true],
    ["Maruti Ertiga (TN-01-CD-5678)", "Vehicles", "Basement Parking",  1150000, true],
    ["Tata Ace (TN-01-EF-9012)",      "Vehicles", "Basement Parking",  650000,  true],
    ["Oscilloscope DSOX1204G", "Lab Equipment", "R&D Lab",             120000, true],
    ["Logic Analyzer DSLogic", "Lab Equipment", "R&D Lab",             18000,  true],
    ["Soldering Station JBC",  "Lab Equipment", "R&D Lab",             45000,  false],
    ["3D Printer Prusa MK4",   "Lab Equipment", "R&D Lab",             98000,  true],
    ["Projector Epson EB-L200","Electronics", "Floor 2",               78000,  false],
    ["Projector Epson EB-L200","Electronics", "Floor 3",               78000,  false],
    ["Filing Cabinet",         "Furniture",   "Floor 1 — Finance",     15000,  false],
    ["Whiteboard (Large)",     "Furniture",   "Floor 2",               9000,   false],
    ["Whiteboard (Large)",     "Furniture",   "Floor 3",               9000,   false],
    ["Office Sofa (3-seat)",   "Furniture",   "Floor 1 — Reception",   55000,  false],
    ["Water Dispenser",        "Furniture",   "Floor 2 — Pantry",      12000,  false],
    ["Dell OptiPlex 7010",     "Electronics", "Floor 1 — Sales",       65000,  false],
    ["Dell OptiPlex 7010",     "Electronics", "Floor 1 — Sales",       65000,  false],
  ];

  const assets = [];
  for (let i = 0; i < SPEC.length; i++) {
    const [name, cat, location, cost, bookable] = SPEC[i];
    const tag = `AF-${String(101 + i).padStart(4, "0")}`;
    assets.push(
      await prisma.asset.create({
        data: {
          assetTag: tag,
          name,
          serialNumber: `SN-${tag}-${Math.floor(Math.random() * 9e5 + 1e5)}`,
          categoryId: byCat[cat].id,
          location,
          acquisitionDate: daysAgo(Math.floor(Math.random() * 900) + 60),
          acquisitionCost: cost,
          condition: AssetCondition.GOOD,
          isBookable: bookable,
          status: AssetStatus.AVAILABLE,
          departmentId: bookable ? null : depts[i % depts.length].id,
        },
      })
    );
  }
  const byTag = Object.fromEntries(assets.map((a) => [a.assetTag, a]));

  // ── ★ THE DEMO CONFLICT: Priya holds AF-0114, 4 days overdue ──
  console.log("⚔️  Staging the conflict (AF-0114 → Priya, overdue)...");
  const macbook = byTag["AF-0114"];
  await prisma.allocation.create({
    data: {
      assetId: macbook.id,
      holderId: priya.id,
      departmentId: byCode.DSN.id,
      allocatedById: manager.id,
      allocatedAt: daysAgo(38),
      expectedReturnDate: daysAgo(4), // ← OVERDUE. This is the red flag on the dashboard.
    },
  });
  await prisma.asset.update({
    where: { id: macbook.id }, data: { status: AssetStatus.ALLOCATED },
  });

  // ── More allocations, some overdue, some healthy ──────────────
  console.log("📦 Allocation history...");
  const toAllocate = ["AF-0101", "AF-0103", "AF-0109", "AF-0111", "AF-0118", "AF-0119"];
  for (let i = 0; i < toAllocate.length; i++) {
    const a = byTag[toAllocate[i]];
    const holder = allEmployees[i % allEmployees.length];
    const overdue = i % 3 === 0;
    await prisma.allocation.create({
      data: {
        assetId: a.id,
        holderId: holder.id,
        departmentId: holder.departmentId,
        allocatedById: manager.id,
        allocatedAt: daysAgo(20 + i * 5),
        expectedReturnDate: overdue ? daysAgo(i + 1) : daysAhead(10 + i),
      },
    });
    await prisma.asset.update({ where: { id: a.id }, data: { status: AssetStatus.ALLOCATED } });
  }

  // Closed allocations → gives assets a real history tab
  for (const tag of ["AF-0102", "AF-0104", "AF-0113"]) {
    await prisma.allocation.create({
      data: {
        assetId: byTag[tag].id,
        holderId: filler[0].id,
        departmentId: filler[0].departmentId,
        allocatedById: manager.id,
        allocatedAt: daysAgo(120),
        expectedReturnDate: daysAgo(70),
        returnedAt: daysAgo(68),
        checkInNotes: "Returned in good condition. Screen cleaned, no damage.",
        returnCondition: AssetCondition.GOOD,
      },
    });
  }

  // ── ★ THE DEMO BOOKING: Room B2, 9:00–10:00 today ─────────────
  console.log("📅 Staging the booking (Room B2, 9–10)...");
  const roomB2 = byTag["AF-0121"];
  await prisma.booking.create({
    data: {
      assetId: roomB2.id,
      bookedById: priya.id,
      startTime: todayAt(9),
      endTime: todayAt(10),
      purpose: "Design sync",
      status: "UPCOMING",
    },
  });
  // Load Room B2 up so the heatmap shows it as hot, C1 as cold
  for (const [s, e] of [[11, 12], [14, 15], [15, 16], [16, 17]] as [number, number][]) {
    await prisma.booking.create({
      data: {
        assetId: roomB2.id, bookedById: filler[1].id,
        startTime: todayAt(s), endTime: todayAt(e),
        purpose: "Team meeting", status: "UPCOMING",
      },
    });
  }

  // ── Maintenance ──────────────────────────────────────────────
  console.log("🔧 Maintenance...");
  await prisma.maintenanceRequest.create({
    data: {
      assetId: byTag["AF-0108"].id, raisedById: filler[2].id,
      issue: "Paper jam recurring; roller assembly appears worn.",
      priority: Priority.HIGH, status: "PENDING",
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      assetId: byTag["AF-0130"].id, raisedById: raj.id, approvedById: manager.id,
      issue: "Tip temperature unstable, needs recalibration.",
      priority: Priority.MEDIUM, status: "IN_PROGRESS", technician: "Suresh (Facilities)",
    },
  });
  await prisma.asset.update({
    where: { id: byTag["AF-0130"].id }, data: { status: AssetStatus.UNDER_MAINTENANCE },
  });

  // ── ★ THE DEMO AUDIT CYCLE (QR scanning targets) ──────────────
  console.log("🔍 Staging the audit cycle...");
  const cycle = await prisma.auditCycle.create({
    data: {
      name: "Q3 Floor 3 — Design Wing Audit",
      scopeLoc: "Floor 3 — Design",
      startDate: daysAgo(2),
      endDate: daysAhead(5),
      status: "OPEN",
      auditors: { connect: [{ id: manager.id }, { id: deptHead.id }] },
    },
  });
  // Every asset on Floor 3 becomes a scannable audit item
  const floor3 = assets.filter((a) => a.location.includes("Floor 3"));
  for (const a of floor3) {
    await prisma.auditItem.create({
      data: { auditCycleId: cycle.id, assetId: a.id, result: "PENDING" },
    });
  }

  // ── Notifications ────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { employeeId: priya.id, title: "Overdue Return",
        body: "AF-0114 (MacBook Pro 14\") was due 4 days ago. Please return or request an extension." },
      { employeeId: manager.id, title: "Maintenance Approval Pending",
        body: "AF-0108 (HP LaserJet Pro M404) — HIGH priority request awaiting your approval." },
      { employeeId: manager.id, title: "Audit Cycle Open",
        body: "Q3 Floor 3 — Design Wing Audit. " + floor3.length + " assets to verify." },
    ],
  });

  console.log(`
✅ Seed complete.
   ${depts.length} departments · ${cats.length} categories · ${assets.length} assets
   ${floor3.length} assets staged for QR audit

   ★ AF-0114 (MacBook Pro 14") → Priya Sharma, 4 DAYS OVERDUE
   ★ Room B2 (AF-0121) booked 09:00–10:00 today
   ★ 3 similar MacBooks AVAILABLE for "Find Similar"

   Login: admin@assetflow.io / ${PW}
          manager@assetflow.io / ${PW}
          raj@assetflow.io / ${PW}      ← demo the conflict as Raj
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
