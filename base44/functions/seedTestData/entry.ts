import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

// Seeds a fixed, synthetic QA dataset into the "Test" organization so every release
// can be tested against the same known data. Admin-only. Hard-locked to the org named
// TEST_ORG_NAME — the caller cannot choose a different org.
//
// Body: { "action": "status" | "seed" | "reset", "confirm": "RESET TEST DATA" }
//   status (default) — report which seed projects exist; changes nothing.
//   seed             — create any missing seed projects + their child records (idempotent).
//   reset            — delete ONLY seed-tagged projects and their child records
//                      (requires the confirm phrase). Run "seed" afterwards for a fresh set.

const TEST_ORG_NAME = "Test";
const SEED_TAG = "[QA-SEED]";
const SEED_CLIENT = "QA Seed (synthetic)";
const RESET_PHRASE = "RESET TEST DATA";
const CHILD_ENTITIES = ["ActionItem", "Risk", "Milestone", "ProjectCharter", "WeeklyReport", "BudgetTracking"];

// Dates are relative to the run day so "overdue" / "due this week" stay true on every reseed.
const today = new Date();
const day = (offset: number) => {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
const monthStart = (offset: number) => {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1));
  return d.toISOString().slice(0, 10);
};
const isoWeek = (d: Date) => {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { week: Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7), year: t.getUTCFullYear() };
};

const PROJECTS = [
  { key: "BAT", projectName: "Atlas Battery Gigafactory", projectType: "Battery Gigafactory", currentPhase: "Construction", status: "Active", totalBudgetEurM: 1850, healthScore: 72, start: -540, end: 420, owner: "Elena Novak", rag: "Amber" },
  { key: "MIN", projectName: "Kestrel Copper Mine", projectType: "Mining & Minerals", currentPhase: "Feasibility", status: "Active", totalBudgetEurM: 640, healthScore: 85, start: -60, end: 1460, owner: "Tom Reyes", rag: "Green" },
  { key: "BESS", projectName: "Meridian BESS Park", projectType: "Energy Storage (BESS)", currentPhase: "FEED", status: "Active", totalBudgetEurM: 210, healthScore: 64, start: -150, end: 600, owner: "Aisha Rahman", rag: "Amber" },
  { key: "DC", projectName: "Northwind Data Center", projectType: "Data Center", currentPhase: "Commissioning", status: "Active", totalBudgetEurM: 480, healthScore: 48, start: -800, end: 45, owner: "Lukas Brandt", rag: "Red" },
  { key: "STL", projectName: "Ironclad Steel Plant", projectType: "Steel & Metals", currentPhase: "Detailed Engineering", status: "On Hold", totalBudgetEurM: 1200, healthScore: 39, start: -300, end: 900, owner: "Marta Silva", rag: "Red" },
  { key: "REN", projectName: "Solara Renewables Hub", projectType: "Renewables (Solar / Wind)", currentPhase: "SOP", status: "Completed", totalBudgetEurM: 95, healthScore: 91, start: -900, end: -30, owner: "Jonas Berg", rag: "Green" },
];

const riskLevel = (p: number, i: number) => {
  const s = p * i;
  return s >= 9 ? "Critical" : s >= 6 ? "High" : s >= 3 ? "Medium" : "Low";
};

function childRecords(p: typeof PROJECTS[number], projectId: string, orgId: string) {
  const base = { projectId, org_id: orgId };
  const done = p.status === "Completed";
  const { week, year } = isoWeek(today);

  const actions = [
    { title: `Close out overdue vendor submittal review`, priority: "P1 - Critical", status: done ? "Done" : "In Progress", dueDate: day(-12), assignee: p.owner },
    { title: `Issue weekly progress update to sponsor`, priority: "P2 - High", status: done ? "Done" : "To Do", dueDate: day(3), assignee: "PMO Analyst" },
    { title: `Confirm long-lead equipment delivery dates`, priority: "P3 - Medium", status: done ? "Done" : "Blocked", dueDate: day(21), assignee: "Procurement Lead", blocked: !done, blockedReason: done ? undefined : "Awaiting supplier confirmation" },
    { title: `Update risk register after design review`, priority: "P4 - Low", status: "Done", dueDate: day(-30), completedDate: day(-28), assignee: p.owner, progressPct: 100 },
  ].map((a, n) => ({ ...base, itemType: "Action", itemKey: `${p.key}-${String(n + 1).padStart(3, "0")}`, reporter: p.owner, labels: "qa-seed", ...a }));

  const risks = [
    { riskDescription: "Supply chain delay on critical equipment", category: "Schedule", probability: 3, impact: 3, owner: "Procurement Lead" },
    { riskDescription: "Cost escalation on bulk materials", category: "Financial", probability: 2, impact: 3, owner: p.owner },
    { riskDescription: "Permit conditions tightened by regulator", category: "Regulatory", probability: 1, impact: 2, owner: "HSE Manager" },
  ].map((r) => ({
    ...base, ...r,
    riskScore: r.probability * r.impact,
    riskLevel: riskLevel(r.probability, r.impact),
    mitigationPlan: "Mitigation agreed at monthly risk review; owner to report progress.",
    status: done ? "Closed" : "Open",
    targetClosureDate: day(60),
  }));

  const phases = ["Feasibility", "Pre-FEED", "FEED", "Investment Decision", "Project Setup", "Detailed Engineering", "Procurement", "Construction", "Commissioning", "SOP"];
  const cur = phases.indexOf(p.currentPhase);
  const milestones = [Math.max(cur - 1, 0), cur, Math.min(cur + 1, phases.length - 1)]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .map((idx) => {
      const past = idx < cur || done;
      const current = idx === cur && !done;
      return {
        ...base,
        phaseName: phases[idx],
        completionPercent: past ? 100 : current ? 55 : 0,
        status: past ? "Complete" : current ? (p.status === "On Hold" ? "Blocked" : "Active") : "Pending",
        startDate: day((idx - cur) * 120 - 60),
        dueDate: day((idx - cur) * 120 + 60),
        actualCompletionDate: past ? day((idx - cur) * 120 + 55) : undefined,
        deliverables: `${phases[idx]} gate deliverables`,
      };
    });

  const charter = {
    ...base,
    purpose: `Deliver the ${p.projectName} on time, on budget and safely.`,
    objectives: "Reach the next stage gate; hold budget within 5%; zero lost-time incidents.",
    successCriteria: "Gate approved by sponsor; cost variance < 5%; schedule variance < 4 weeks.",
    scopeIncluded: "Engineering, procurement, construction management, commissioning support.",
    scopeExcluded: "Off-site utilities and operations staffing.",
    deliverables: "Design package, procurement plan, construction schedule, handover dossier.",
    estimatedBudgetEurM: p.totalBudgetEurM,
    sponsor: "Executive Sponsor (synthetic)",
    projectManager: p.owner,
    approvalStatus: "Draft",
  };

  const weeklyReport = {
    ...base,
    reportNumber: `WR-${p.key}-001`,
    calendarWeek: week,
    year,
    reportingPeriodStart: day(-7),
    reportingPeriodEnd: day(-1),
    reportDate: day(0),
    preparedBy: p.owner,
    status: "Draft",
    executiveSummary: `Synthetic QA report for ${p.projectName}. Overall status ${p.rag}.`,
    highlights: "Key design review completed.",
    concerns: "Critical equipment delivery at risk.",
    nextWeekFocus: "Close overdue submittals; confirm delivery dates.",
    overallRag: p.rag, scheduleRag: p.rag, costRag: "Green", riskRag: p.rag, qualityRag: "Green",
  };

  const budget = [
    { category: "Engineering", plannedEurK: 1200, actualEurK: 1150, month: monthStart(-2) },
    { category: "Equipment", plannedEurK: 4800, actualEurK: 5400, month: monthStart(-1) },
    { category: "Construction", plannedEurK: 3000, actualEurK: 2700, month: monthStart(0) },
  ].map((b) => {
    const varianceEurK = b.actualEurK - b.plannedEurK;
    const variancePercent = Math.round((varianceEurK / b.plannedEurK) * 1000) / 10;
    return {
      ...base, ...b, varianceEurK, variancePercent,
      varianceStatus: variancePercent > 2 ? "Over Budget" : variancePercent < -2 ? "Under Budget" : "On Track",
      notes: SEED_TAG,
    };
  });

  return {
    ActionItem: actions,
    Risk: risks,
    Milestone: milestones,
    ProjectCharter: [charter],
    WeeklyReport: [weeklyReport],
    BudgetTracking: budget,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    let body: { action?: string; confirm?: string } = {};
    try { body = (await req.json()) || {}; } catch (_) { body = {}; }
    const action = body.action || "status";
    if (!["status", "seed", "reset"].includes(action)) {
      return Response.json({ error: `Unknown action "${action}". Use status, seed or reset.` }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    const orgs = await db.Organization.filter({ name: TEST_ORG_NAME });
    if (orgs.length !== 1) {
      return Response.json({ error: `Expected exactly one organization named "${TEST_ORG_NAME}", found ${orgs.length}. Nothing changed.` }, { status: 409 });
    }
    const orgId = orgs[0].id;

    const inOrg = await db.Project.filter({ org_id: orgId });
    const seeded = inOrg.filter((p) => typeof p.notes === "string" && p.notes.includes(SEED_TAG));

    if (action === "status") {
      return Response.json({
        org: TEST_ORG_NAME,
        seedProjects: seeded.map((p) => p.projectName),
        missing: PROJECTS.filter((d) => !seeded.some((p) => p.projectName === d.projectName)).map((d) => d.projectName),
        otherProjectsInOrg: inOrg.length - seeded.length,
      });
    }

    if (action === "reset") {
      if (body.confirm !== RESET_PHRASE) {
        return Response.json({ error: `Reset needs "confirm": "${RESET_PHRASE}". Nothing changed.` }, { status: 400 });
      }
      const deleted: Record<string, number> = {};
      for (const p of seeded) {
        for (const name of CHILD_ENTITIES) {
          const rows = await db[name].filter({ projectId: p.id });
          for (const r of rows) await db[name].delete(r.id);
          deleted[name] = (deleted[name] || 0) + rows.length;
        }
        await db.Project.delete(p.id);
      }
      deleted.Project = seeded.length;
      return Response.json({ org: TEST_ORG_NAME, deleted });
    }

    // seed — only create projects that don't already exist, so re-running is safe.
    const created: Record<string, number> = {};
    const skipped: string[] = [];
    for (const def of PROJECTS) {
      if (seeded.some((p) => p.projectName === def.projectName)) { skipped.push(def.projectName); continue; }
      const project = await db.Project.create({
        org_id: orgId,
        projectName: def.projectName,
        clientName: SEED_CLIENT,
        projectType: def.projectType,
        currentPhase: def.currentPhase,
        status: def.status,
        totalBudgetEurM: def.totalBudgetEurM,
        healthScore: def.healthScore,
        startDate: day(def.start),
        targetCompletion: day(def.end),
        projectOwner: def.owner,
        notes: `${SEED_TAG} Synthetic test data — safe to reset.`,
      });
      created.Project = (created.Project || 0) + 1;
      const children = childRecords(def, project.id, orgId);
      for (const [name, rows] of Object.entries(children)) {
        for (const row of rows) await db[name].create(row);
        created[name] = (created[name] || 0) + rows.length;
      }
    }
    return Response.json({ org: TEST_ORG_NAME, created, skipped });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
