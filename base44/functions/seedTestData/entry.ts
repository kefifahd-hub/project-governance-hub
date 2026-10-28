import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { ORG_ID_ENTITIES } from "../../shared/orgIdConfig.ts";

// Seeds a fixed, synthetic QA dataset into the "Test" organization so every release
// can be tested against the same known data. Admin-only. Hard-locked to the org named
// TEST_ORG_NAME — the caller cannot choose a different org.
//
// Body: { "action": "status" | "seed" | "reset", "confirm": "RESET TEST DATA" }
//   status (default) — report which seed projects exist; changes nothing.
//   seed             — create any missing seed projects, then fill every project tool that
//                      is still empty for them (idempotent; safe to re-run, e.g. after a timeout).
//   reset            — delete ONLY seed-tagged projects and everything under them
//                      (requires the confirm phrase). Run "seed" afterwards for a fresh set.

const TEST_ORG_NAME = "Test";
const SEED_TAG = "[QA-SEED]";
const SEED_CLIENT = "QA Seed (synthetic)";
const RESET_PHRASE = "RESET TEST DATA";

// Dates are relative to the run day so "overdue" / "due this week" stay true on every reseed.
const today = new Date();
const day = (offset: number) => {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
const monthStart = (offset: number) =>
  new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1)).toISOString().slice(0, 10);
const isoWeek = (d: Date) => {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { week: Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7), year: t.getUTCFullYear() };
};
const lastWorkdays = (n: number) => {
  const out: string[] = [];
  for (let off = -1; out.length < n; off--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + off);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) out.push(d.toISOString().slice(0, 10));
  }
  return out;
};
const json = (v: unknown) => JSON.stringify(v);

const PHASES = ["Feasibility", "Pre-FEED", "FEED", "Investment Decision", "Project Setup", "Detailed Engineering", "Procurement", "Construction", "Commissioning", "SOP"];

const PROJECTS = [
  { key: "BAT", projectName: "Atlas Battery Gigafactory", projectType: "Battery Gigafactory", currentPhase: "Construction", status: "Active", totalBudgetEurM: 1850, healthScore: 72, start: -540, end: 420, owner: "Elena Novak", rag: "Amber", asset: "cell assembly lines", contractor: "Nordbau EPC" },
  { key: "MIN", projectName: "Kestrel Copper Mine", projectType: "Mining & Minerals", currentPhase: "Feasibility", status: "Active", totalBudgetEurM: 640, healthScore: 85, start: -60, end: 1460, owner: "Tom Reyes", rag: "Green", asset: "concentrator plant", contractor: "Andes Mining Services" },
  { key: "BESS", projectName: "Meridian BESS Park", projectType: "Energy Storage (BESS)", currentPhase: "FEED", status: "Active", totalBudgetEurM: 210, healthScore: 64, start: -150, end: 600, owner: "Aisha Rahman", rag: "Amber", asset: "battery containers", contractor: "GridStore Integrators" },
  { key: "DC", projectName: "Northwind Data Center", projectType: "Data Center", currentPhase: "Commissioning", status: "Active", totalBudgetEurM: 480, healthScore: 48, start: -800, end: 45, owner: "Lukas Brandt", rag: "Red", asset: "data halls", contractor: "Polar Build" },
  { key: "STL", projectName: "Ironclad Steel Plant", projectType: "Steel & Metals", currentPhase: "Detailed Engineering", status: "On Hold", totalBudgetEurM: 1200, healthScore: 39, start: -300, end: 900, owner: "Marta Silva", rag: "Red", asset: "electric arc furnace", contractor: "Ferro Engineering" },
  { key: "REN", projectName: "Solara Renewables Hub", projectType: "Renewables (Solar / Wind)", currentPhase: "SOP", status: "Completed", totalBudgetEurM: 95, healthScore: 91, start: -900, end: -30, owner: "Jonas Berg", rag: "Green", asset: "solar arrays", contractor: "SunField Contractors" },
];
type Def = typeof PROJECTS[number];

// Same thresholds as RiskRegister.jsx so seeded levels match what the page computes.
const riskLevel = (p: number, i: number) => {
  const s = p * i;
  return s >= 6 ? "Critical" : s >= 4 ? "High" : s >= 2 ? "Medium" : "Low";
};

const GATE_DEFS = [
  { number: 0, phase: 0, name: "QG0 — Opportunity", checklist: ["Business case defined", "Market demand validated", "High-level budget range identified", "Strategic alignment confirmed"] },
  { number: 1, phase: 1, name: "QG1 — Concept", checklist: ["Concept design complete", "Site shortlist defined", "Class 5 estimate (±50%)", "Risk register initiated", "Stakeholder map created"] },
  { number: 2, phase: 2, name: "QG2 — FEED Complete", checklist: ["FEED package complete", "Class 3 estimate (±20%)", "Permitting path defined", "Procurement strategy approved", "HAZID/HAZOP completed", "Charter approved"] },
  { number: 3, phase: 3, name: "QG3 — Investment Decision", checklist: ["NPV/IRR targets met", "Funding secured", "Board approval obtained", "Project execution plan approved", "EPC contract strategy finalized"] },
  { number: 4, phase: 4, name: "QG4 — Project Setup", checklist: ["PMO team mobilized", "Master baseline schedule established", "Budget allocated to WBS", "Permits granted", "Site access secured"] },
  { number: 5, phase: 7, name: "QG5 — Construction", checklist: ["Groundbreaking complete", "Major equipment ordered", "Construction permits valid", "Quality plan in execution", "Safety program active"] },
  { number: 6, phase: 8, name: "QG6 — Commissioning", checklist: ["Mechanical completion verified", "Pre-commissioning checks done", "Commissioning plan approved", "Operator training started", "Punch list <5% open"] },
  { number: 7, phase: 9, name: "QG7 — Full Production", checklist: ["Performance tests passed", "Ramp-up curve on target", "Handover to operations complete", "Final cost reconciliation done", "Lessons learned documented"] },
];

const CHANGE_STAGES = [
  { id: "s1", name: "Submitted", type: "Stage", x: 50, y: 100, stakeholders: [] },
  { id: "s2", name: "Impact Assessment", type: "Stage", x: 250, y: 100, stakeholders: [] },
  { id: "s3", name: "CCB Review", type: "Gate", x: 450, y: 100, stakeholders: [] },
  { id: "d1", name: "Approved", type: "Decision", x: 650, y: 60, stakeholders: [] },
  { id: "d2", name: "Rejected", type: "Decision", x: 650, y: 160, stakeholders: [] },
  { id: "s4", name: "Implementation", type: "Stage", x: 850, y: 60, stakeholders: [] },
  { id: "s5", name: "Verification", type: "Stage", x: 1050, y: 60, stakeholders: [] },
  { id: "s6", name: "Closed", type: "Stage", x: 1250, y: 60, stakeholders: [] },
];
const CHANGE_CONNECTIONS = [["s1", "s2"], ["s2", "s3"], ["s3", "d1"], ["s3", "d2"], ["d1", "s4"], ["s4", "s5"], ["s5", "s6"]]
  .map(([from, to], i) => ({ id: `c${i + 1}`, from, to }));

const workflowNodes = (steps: [string, string, string, number][]) =>
  steps.map(([type, label, assignee, durationDays], i) => ({ id: `node_${i + 1}`, type, label, assignee, description: label, durationDays, condition: "" }));

// A group is one tool's records for one project. `link` is the field tying the top-level
// records to the project (used to skip tools that already have data). `after` creates
// dependent records once the parents exist and have ids.
type Rows = Record<string, unknown>[];
type Group = { entity: string; rows: Rows; link?: string; after?: (created: Rows) => Group[] };

function toolGroups(p: Def, projectId: string, orgId: string): Group[] {
  const base = { projectId, org_id: orgId };
  const done = p.status === "Completed";
  const onHold = p.status === "On Hold";
  const cur = PHASES.indexOf(p.currentPhase);
  const { week, year } = isoWeek(today);
  const prev = isoWeek(new Date(today.getTime() - 7 * 86400000));
  const open = (s: string) => (done ? "Closed" : s);

  const wbs: [string, string, string, number, string][] = [
    ["1", "Project Management", "Phase", 0.04, p.owner],
    ["1.1", "PMO & Controls", "Work Package", 0.02, "PMO Analyst"],
    ["2", "Engineering", "Phase", 0.08, "Engineering Lead"],
    ["2.1", `Process design — ${p.asset}`, "Deliverable", 0.05, "Engineering Lead"],
    ["3", "Procurement", "Phase", 0.35, "Procurement Lead"],
    ["3.1", "Long-lead equipment", "Work Package", 0.25, "Procurement Lead"],
    ["4", "Construction & Commissioning", "Phase", 0.45, "Construction Manager"],
  ];

  const actionBuckets = ["Engineering", "Procurement", "Site"];
  const actionPhases = ["Current Sprint", "Next Sprint", "Backlog"];
  const actions: [string, string, string, number, string, number][] = [
    ["Close out overdue vendor submittal review", "P1 - Critical", "In Progress", -12, p.owner, 60],
    ["Issue weekly progress update to sponsor", "P2 - High", "To Do", 3, "PMO Analyst", 0],
    ["Confirm long-lead equipment delivery dates", "P2 - High", "Blocked", 21, "Procurement Lead", 30],
    ["Update risk register after design review", "P4 - Low", "Done", -30, p.owner, 100],
    ["Prepare stage-gate evidence pack", "P3 - Medium", "In Review", 10, "Quality Manager", 80],
    ["Resolve RFI on foundation loads", "P3 - Medium", "To Do", -3, "Engineering Lead", 0],
  ];

  const scheduleActs: [string, string, number, number, number, boolean][] = [
    // name, wbs, start offset, finish offset, % complete, critical
    ["Basic engineering", "2.1", -400, -250, 100, false],
    ["Detailed engineering", "2", -260, -60, 95, true],
    ["Long-lead equipment procurement", "3.1", -200, 40, 70, true],
    ["Site preparation", "4", -150, -90, 100, false],
    ["Foundations", "4", -100, -10, 90, true],
    [`Install ${p.asset}`, "4", -20, 120, 25, true],
    ["Utilities tie-in", "4", 30, 140, 0, false],
    ["Mechanical completion", "4", 140, 160, 0, true],
    ["Commissioning", "4", 160, 220, 0, true],
    ["Handover to operations", "1", 220, 230, 0, false],
  ];

  const npv = (capex: number, opex: number, rev: number, rate: number, years: number) => {
    const cf = rev - opex;
    let v = -capex;
    for (let y = 1; y <= years; y++) v += cf / Math.pow(1 + rate / 100, y);
    return { npvResultEurM: Math.round(v * 10) / 10, annualNetCashflowEurM: cf, paybackPeriodYears: cf > 0 ? Math.round((capex / cf) * 10) / 10 : 0, isViable: v > 0 };
  };
  const capex = p.totalBudgetEurM;

  const siteKeys: Record<string, string[]> = {
    ownership: ["1.5", "1.6"], plot: ["2.13", "2.14", "2.20"], utilities: ["3.1"],
    infrastructure: ["4.1"], workforce: ["5.1"], incentives: ["6.1"],
  };

  return [
    { entity: "ActionBucket", rows: actionBuckets.map((bucketName, i) => ({ ...base, bucketName, sortOrder: i, owner: p.owner })) },
    { entity: "ActionPhase", rows: actionPhases.map((phaseName, i) => ({ ...base, phaseName, startDate: day(i * 14 - 7), endDate: day(i * 14 + 6), phaseType: "Sprint", status: i === 0 ? "Active" : "Planning", goal: `${phaseName} goals` })) },
    {
      entity: "ActionItem",
      rows: actions.map(([title, priority, status, due, assignee, progressPct], n) => ({
        ...base, itemType: n === 5 ? "RFI" : "Action", itemKey: `${p.key}-${String(n + 1).padStart(3, "0")}`,
        title, description: `${title} for the ${p.asset}.`, priority, status: done ? "Done" : status, dueDate: day(due), startDate: day(due - 14),
        assignee, reporter: p.owner, labels: "qa-seed", progressPct: done ? 100 : progressPct,
        bucket: actionBuckets[n % 3], phase: actionPhases[n % 3], wbsReference: wbs[n % wbs.length][0],
        blocked: !done && status === "Blocked", blockedReason: !done && status === "Blocked" ? "Awaiting supplier confirmation" : undefined,
        completedDate: done || status === "Done" ? day(due + 2) : undefined, resolution: done || status === "Done" ? "Done" : undefined,
      })),
      after: (items) => [
        { entity: "ActionChecklist", rows: items.slice(0, 3).flatMap((a) => ["Collect inputs", "Draft", "Review with owner"].map((checklistText, i) => ({ actionItemId: a.id, org_id: orgId, checklistText, isChecked: i === 0, sortOrder: i, assignee: a.assignee }))) },
        { entity: "ActionComment", rows: items.slice(0, 3).map((a) => ({ actionItemId: a.id, org_id: orgId, author: p.owner, commentText: "Discussed in weekly coordination meeting; owner confirmed next steps.", commentType: "Comment" })) },
      ],
    },
    {
      entity: "Risk",
      rows: ([
        ["Supply chain delay on critical equipment", "Schedule", 3, 3, "Procurement Lead"],
        ["Cost escalation on bulk materials", "Financial", 2, 3, p.owner],
        ["Permit conditions tightened by regulator", "Regulatory", 1, 2, "HSE Manager"],
        [`Performance shortfall of ${p.asset}`, "Technical", 2, 2, "Engineering Lead"],
        ["Lifting operation incident", "Safety", 1, 3, "HSE Manager"],
      ] as [string, string, number, number, string][]).map(([riskDescription, category, probability, impact, owner], i) => ({
        ...base, riskDescription, category, probability, impact, owner, riskScore: probability * impact, riskLevel: riskLevel(probability, impact),
        mitigationPlan: "Mitigation agreed at monthly risk review; owner reports progress.", status: done ? "Closed" : ["Open", "In Progress", "Mitigated", "Open", "Open"][i],
        targetClosureDate: day(30 + i * 20), actualClosureDate: done ? day(-40) : undefined,
      })),
    },
    {
      entity: "Milestone",
      rows: PHASES.map((phaseName, idx) => {
        const past = idx < cur || done;
        const current = idx === cur && !done;
        return {
          ...base, phaseName, completionPercent: past ? 100 : current ? 55 : 0,
          status: past ? "Complete" : current ? (onHold ? "Blocked" : "Active") : "Pending",
          startDate: day((idx - cur) * 90 - 45), dueDate: day((idx - cur) * 90 + 45),
          actualCompletionDate: past ? day((idx - cur) * 90 + 40) : undefined, deliverables: `${phaseName} gate deliverables`,
        };
      }),
    },
    {
      entity: "ProjectCharter",
      rows: [{
        ...base, purpose: `Deliver the ${p.projectName} on time, on budget and safely.`,
        objectives: "Reach the next stage gate; hold budget within 5%; zero lost-time incidents.",
        successCriteria: "Gate approved by sponsor; cost variance < 5%; schedule variance < 4 weeks.",
        scopeIncluded: `Engineering, procurement and construction of the ${p.asset}; commissioning support.`,
        scopeExcluded: "Off-site utilities and operations staffing.",
        deliverables: "Design package, procurement plan, construction schedule, handover dossier.",
        milestonesSummary: PHASES.slice(cur, cur + 3).join(" → "), estimatedBudgetEurM: p.totalBudgetEurM,
        assumptions: "Permits granted on current timeline; supplier capacity available.", constraints: "Fixed SOP date; grid connection capacity.",
        risksSummary: "Supply chain, cost escalation, permitting.", sponsor: "Executive Sponsor (synthetic)", projectManager: p.owner,
        stakeholdersSummary: "Board, lenders, local authority, EPC contractor.",
        approvalStatus: done ? "Approved" : "Draft", approvedBy: done ? "Executive Sponsor (synthetic)" : undefined, approvalDate: done ? day(-800) : undefined,
      }],
    },
    {
      entity: "WeeklyReport",
      rows: [
        { w: prev, start: -14, end: -8, status: "Published", n: 1 },
        { w: { week, year }, start: -7, end: -1, status: "Draft", n: 2 },
      ].map((r) => ({
        ...base, reportNumber: `WR-${p.key}-00${r.n}`, calendarWeek: r.w.week, year: r.w.year,
        reportingPeriodStart: day(r.start), reportingPeriodEnd: day(r.end), reportDate: day(r.end + 1),
        preparedBy: p.owner, reviewedBy: "PMO Director", status: r.status, publishedAt: r.status === "Published" ? new Date(today.getTime() - 6 * 86400000).toISOString() : undefined,
        executiveSummary: `Synthetic QA report for ${p.projectName}. Overall status ${p.rag}.`,
        highlights: "Key design review completed.\nSafety: no incidents this week.", concerns: "Critical equipment delivery at risk.",
        nextWeekFocus: "Close overdue submittals; confirm delivery dates.",
        overallRag: p.rag, scheduleRag: p.rag, costRag: "Green", riskRag: p.rag, qualityRag: "Green",
        enabledSections: json(["rag", "summary", "schedule", "cost", "actions", "risks", "changes", "quality", "lookahead"]),
      })),
    },
    {
      entity: "BudgetTracking",
      rows: ([
        ["Engineering", "2", 1200, 1150, -3], ["Equipment", "3.1", 4800, 5400, -2], ["Construction", "4", 3000, 2700, -1],
        ["PMO", "1.1", 300, 310, -1], ["Procurement", "3", 900, 880, 0], ["Contingency", "1", 500, 0, 0],
      ] as [string, string, number, number, number][]).map(([category, wbsCode, plannedEurK, actualEurK, m]) => {
        const varianceEurK = actualEurK - plannedEurK;
        const variancePercent = Math.round((varianceEurK / plannedEurK) * 1000) / 10;
        return { ...base, category, wbsCode, plannedEurK, actualEurK, month: monthStart(m), varianceEurK, variancePercent,
          varianceStatus: variancePercent > 2 ? "Over Budget" : variancePercent < -2 ? "Under Budget" : "On Track", notes: SEED_TAG };
      }),
    },
    {
      entity: "Stakeholder",
      rows: ([
        ["Executive Sponsor (synthetic)", "Sponsor", "Owner company", "Internal", "High", "High", "Supportive", "Leading"],
        [p.owner, "Project Director", "Owner company", "Internal", "High", "High", "Leading", "Leading"],
        ["Lender's technical advisor", "Lender's engineer", "Infra Bank", "External", "High", "Medium", "Neutral", "Supportive"],
        ["Regional permitting office", "Regulator", "Local authority", "External", "High", "Low", "Neutral", "Supportive"],
        [`${p.contractor} PM`, "EPC contractor", p.contractor, "External", "Medium", "High", "Supportive", "Supportive"],
        ["Community liaison group", "Community", "Local residents", "External", "Low", "Medium", "Resistant", "Neutral"],
      ] as string[][]).map(([stakeholderName, role, company, category, influence, interest, engagementCurrent, engagementDesired]) => ({
        ...base, stakeholderName, role, company, category, influence, interest, engagementCurrent, engagementDesired,
        engagementStrategy: influence === "High" ? "Manage closely — monthly 1:1" : "Keep informed — newsletter", contact: "contact@example.com",
      })),
    },
    { entity: "WbsElement", rows: wbs.map(([wbsCode, name, elementType, share, owner]) => ({ ...base, wbsCode, name, elementType, owner, description: name, budgetEurK: Math.round(capex * 1000 * share), status: done ? "Complete" : wbsCode.startsWith("4") ? "In Progress" : "Complete" })) },
    {
      entity: "RaciAssignment",
      rows: ([
        ["Approve project charter", "1", [["Sponsor", "A"], ["Project Director", "R"], ["PMO Lead", "C"]]],
        ["Issue design package", "2.1", [["Engineering Lead", "R"], ["Project Director", "A"], ["Quality Manager", "C"], ["Construction Manager", "I"]]],
        ["Award long-lead orders", "3.1", [["Procurement Lead", "R"], ["Project Director", "A"], ["Finance Controller", "C"]]],
        ["Site safety induction", "4", [["HSE Manager", "R"], ["Construction Manager", "A"], ["EPC Contractor", "I"]]],
      ] as [string, string, [string, string][]][]).flatMap(([activity, wbsCode, roles]) =>
        roles.map(([roleName, responsibility]) => ({ ...base, activity, wbsCode, roleName, responsibility }))),
    },
    {
      entity: "Requirement",
      rows: ([
        ["Nameplate capacity met at SOP", "Business", "Must", "Approved"], [`${p.asset} availability ≥ 95%`, "Technical", "Must", "Approved"],
        ["Comply with local emissions permit", "Regulatory", "Must", "Verified"], ["Remote monitoring dashboard", "Functional", "Should", "Proposed"],
        ["Visitor centre", "Non-functional", "Won't", "Deferred"],
      ] as string[][]).map(([description, reqType, priority, status], i) => ({
        ...base, reqCode: `REQ-${p.key}-${String(i + 1).padStart(2, "0")}`, description, reqType, priority, status: done ? "Verified" : status,
        source: "Owner's requirements", acceptanceCriteria: "Demonstrated in performance test and signed off.", wbsCode: wbs[i % wbs.length][0],
      })),
    },
    {
      entity: "CommunicationPlan",
      rows: ([
        ["Steering committee", "Status, decisions, top risks", "Weekly", "Meeting"], ["Lenders", "Progress & cost report", "Monthly", "Report"],
        ["Project team", "Look-ahead and actions", "Weekly", "Meeting"], ["Local community", "Construction updates", "Quarterly", "Workshop"],
      ] as string[][]).map(([audience, information, frequency, channel]) => ({ ...base, audience, information, purpose: "Keep stakeholders aligned", frequency, channel, format: "Slides / PDF", owner: p.owner })),
    },
    {
      entity: "QualityGate",
      rows: GATE_DEFS.map((g) => {
        const passed = done || cur > g.phase;
        const active = !passed && GATE_DEFS.find((x) => !(done || cur > x.phase))?.number === g.number;
        return {
          ...base, gateNumber: g.number, gateName: g.name,
          status: passed ? (g.number === 2 ? "Passed with Reserves" : "Passed") : active ? "Active" : "Not Reached",
          checklist: json(g.checklist.map((text, i) => ({ id: `${g.number}-${i}`, text, checked: passed || (active && i < 2) }))),
          owner: p.owner, decisionAuthority: "Steering Committee", decisionDate: passed ? day((g.phase - cur) * 90) : undefined,
          decisionNotes: passed ? "Gate criteria met." : undefined,
          reserves: passed && g.number === 2 ? "HAZOP close-out actions outstanding" : undefined,
          reservesDueDate: passed && g.number === 2 ? day(-20) : undefined, reservesResolved: passed && g.number === 2 ? done : undefined,
        };
      }),
    },
    {
      entity: "RaidItem",
      rows: ([
        ["Assumption", "Grid connection available by energisation date", "High", "Open"], ["Issue", "Late delivery of transformer", "High", "In Progress"],
        ["Dependency", "Permit approval before foundation works", "Medium", "Open"], ["Issue", "Design clash in pipe rack", "Low", "Closed"],
        ["Assumption", "Local labour availability at peak", "Medium", "Open"],
      ] as string[][]).map(([itemType, title, impact, status]) => ({ ...base, itemType, title, description: title, impact, status: open(status), owner: p.owner, dueDate: day(status === "Closed" ? -10 : 14), resolution: status === "Closed" ? "Resolved by design change." : undefined })),
    },
    {
      entity: "SwotItem",
      rows: ([
        ["Strength", "Experienced owner's team"], ["Strength", "Secured site with permits"], ["Weakness", "Single-source critical supplier"], ["Weakness", "Tight contingency"],
        ["Opportunity", "Government incentives"], ["Opportunity", "Offtake price upside"], ["Threat", "Commodity price volatility"], ["Threat", "Skilled labour shortage"],
      ] as string[][]).map(([category, title], i) => ({ ...base, category, title, description: title, priority: ["High", "Medium", "Low"][i % 3], owner: p.owner, status: open("Open"), action: "Review at next steering committee" })),
    },
    {
      entity: "LessonLearned",
      rows: ([
        ["Early supplier engagement shortened lead times", "Procurement", "Success"], ["Late HAZOP drove rework", "Safety", "Improvement"], ["Weekly look-ahead improved site coordination", "Schedule", "Success"],
      ] as string[][]).map(([title, category, lessonType]) => ({ ...base, title, category, lessonType, phase: p.currentPhase, whatHappened: title, rootCause: "See workshop notes", impact: "Moderate", recommendation: "Apply on next project", owner: p.owner, status: open("Open"), dateIdentified: day(-45) })),
    },
    {
      entity: "Audit",
      rows: [
        { auditRef: `AUD-${p.key}-01`, auditType: "Internal", auditScope: "Document control & change management", auditor: "QA Lead", auditDate: day(-60), status: "Closed" },
        { auditRef: `AUD-${p.key}-02`, auditType: "Supplier", auditScope: `Supplier of ${p.asset}`, auditor: "Supplier Quality", auditDate: day(-10), status: done ? "Closed" : "Reporting" },
      ].map((a) => ({ ...base, ...a })),
      after: (audits) => [{
        entity: "AuditFinding",
        rows: audits.flatMap((a, ai) => ([["Major", "Change requests implemented before approval"], ["Observation", "Drawing register not updated weekly"]] as string[][]).map(([severity, description], fi) => ({
          ...base, auditId: a.id, findingRef: `${a.auditRef}-F${fi + 1}`, severity, description, clause: `ISO 9001 §${8 + fi}.${ai + 2}`,
          correctiveAction: "Retrain team and add approval check to workflow.", owner: p.owner, dueDate: day(fi === 0 ? -5 : 20),
          status: done || ai === 0 ? "Closed" : fi === 0 ? "Open" : "Actioned", closedDate: done || ai === 0 ? day(-30) : undefined,
        }))),
      }],
    },
    {
      entity: "QARecord",
      rows: ([
        ["FAT", `FAT — ${p.asset}`, "Passed", -40], ["Inspection", "Weld inspection — pipe rack", "Failed", -15],
        ["SAT", "SAT — main transformer", "Scheduled", 25], ["Commissioning Test", "Cold commissioning loop check", "Conditional Pass", -5],
      ] as [string, string, string, number][]).map(([recordType, testName, status, off]) => ({
        ...base, recordType, testName, equipmentSystem: p.asset, status: done && status !== "Passed" ? "Passed" : status, scheduledDate: day(off),
        completedDate: off < 0 ? day(off) : undefined, location: off < 0 ? "Site" : "Vendor works", inspector: "QA/QC Inspector", vendor: p.contractor,
        ncCount: status === "Failed" ? "2" : "0", findings: status === "Failed" ? "Porosity on 2 welds" : "None",
      })),
      after: (qa) => [{
        entity: "NonConformity",
        rows: [["Weld porosity exceeds acceptance criteria", "Major"], ["Missing material certificate", "Minor"]].map(([description, severity], i) => ({
          ...base, qaRecordId: qa[1]?.id, ncNumber: `NC-${p.key}-${String(i + 1).padStart(3, "0")}`, description, severity,
          status: done ? "Closed" : i === 0 ? "In Progress" : "Open", detectedDate: day(-15), detectedBy: "QA/QC Inspector", assignedTo: p.contractor,
          targetCloseDate: day(i === 0 ? -2 : 14), correctiveAction: "Repair and re-inspect", actualCloseDate: done ? day(-20) : undefined,
        })),
      }],
    },
    {
      entity: "TurnoverPackage",
      rows: ([
        ["Main power distribution", "Turned Over to Ops", 100], ["Fire protection", "Commissioning", 100], [`${p.asset} — line 1`, "Mechanical Completion", 100],
        [`${p.asset} — line 2`, "Punchlist A Cleared", 95], ["HVAC", "Walkdown", 90], ["Building services", "Construction Complete", 85],
      ] as [string, string, number][]).map(([systemName, status, constructionPercent], i) => ({
        ...base, packageCode: `TOP-${p.key}-${String(i + 1).padStart(2, "0")}`, systemName, subsystem: `${systemName} — main`, scope: systemName,
        status: done ? "Turned Over to Ops" : status, constructionPercent, punchlistA: done ? 0 : Math.max(0, 4 - i), punchlistB: done ? 0 : 6 - i,
        custodianFrom: "Construction", custodianTo: "Operations", targetDate: day(i * 15 - 20), actualDate: status === "Turned Over to Ops" || done ? day(-25) : undefined, wbsCode: "4",
      })),
    },
    {
      entity: "ChangeRequest",
      rows: ([
        ["Upgrade transformer rating", "Design / Technical", "High", "Approved", "Design Development", "Modification"],
        ["Add second access road", "Scope", "Medium", "In Technical Review", "Site Condition", "Addition"],
        ["Re-sequence foundation pours", "Schedule", "Low", "Draft", "Internal Improvement", "Modification"],
        ["Substitute cable supplier", "Procurement", "Critical", "Rejected", "Supplier / Vendor", "Substitution"],
      ] as string[][]).map(([title, category, priority, status, origin, changeType], i) => ({
        ...base, crNumber: `CR-${String(i + 1).padStart(3, "0")}`, title, description: `${title} for ${p.projectName}.`, category, priority,
        status: done && status !== "Rejected" ? "Closed" : status, origin, changeType, raisedBy: p.owner, raisedDate: day(-50 + i * 10), requiredByDate: day(30 + i * 10), affectedWbs: "4",
      })),
      after: (crs) => [
        {
          entity: "ChangeImpactAssessment",
          rows: [crs[0], crs[1]].filter(Boolean).map((cr, i) => ({
            crId: cr.id, org_id: orgId, technicalReviewer: "Engineering Lead", technicalReviewDate: day(-30), technicalFeasibility: "Feasible", technicalRiskLevel: i ? "Medium" : "Low",
            technicalRecommendation: "Proceed", designReworkRequired: i === 0, qualityImpact: "Minor (documentation)", financeReviewer: "Finance Controller", financeReviewDate: day(-25),
            capexImpactUsd: 850000 * (i + 1), contingencyDrawUsd: 400000, fundingSource: "Contingency", financeRecommendation: "Acceptable", scheduleReviewer: "Planner",
            scheduleReviewDate: day(-22), scheduleImpactDays: 5 + i * 10, criticalPathAffected: i === 1, scheduleRecommendation: i ? "Recoverable with cost" : "Acceptable delay",
          })),
        },
        {
          entity: "ChangeApproval",
          rows: [crs[0], crs[3]].filter(Boolean).map((cr, i) => ({
            crId: cr.id, org_id: orgId, approvalLevel: "Level 2: Project Director", requiredApprover: p.owner, approverDecision: i ? "Rejected" : "Approved with Conditions",
            conditions: i ? undefined : "Funded from contingency", approverComments: i ? "Supplier not qualified" : "Approved at CCB", decisionDate: day(-20),
          })),
        },
      ],
    },
    { entity: "ChangeWorkflow", rows: [{ ...base, stages: json(CHANGE_STAGES), connections: json(CHANGE_CONNECTIONS) }] },
    {
      entity: "Workflow",
      rows: [
        { name: "Project Handover Workflow", category: "Handover", status: "Active", nodes: workflowNodes([["start", "Initiate Handover", "Project Manager", 0], ["document", "Prepare Handover Document", "PMO Lead", 3], ["task", "Verify Deliverables Complete", "Quality Manager", 2], ["review", "Technical Review of Handover Package", "Engineering Lead", 2], ["approval", "Handover Sign-off", "Project Sponsor", 1], ["handover", "Transfer Ownership to Operations", "Operations Director", 1], ["end", "Handover Complete", "Project Manager", 0]]) },
        { name: "Design Review Workflow", category: "Design Review", status: "Draft", nodes: workflowNodes([["start", "Submit design", "Engineering Lead", 0], ["review", "Discipline review", "Discipline Leads", 5], ["decision", "Comments resolved?", "Engineering Lead", 1], ["approval", "Approve for construction", "Project Director", 1], ["end", "Issued for construction", "Document Control", 0]]) },
      ].map((w) => ({ ...base, ...w, description: w.name, nodes: json(w.nodes) })),
    },
    {
      entity: "DailySiteReport",
      rows: lastWorkdays(3).map((reportDate, i) => ({
        ...base, reportRef: `DSR-${p.key}-${reportDate}`, reportDate, preparedBy: "Site Manager", contractorName: p.contractor, contractorRepresentative: `${p.contractor} site lead`,
        contractReference: `CON-${p.key}-001`, status: i === 0 ? "Submitted" : "Approved", approvedBy: i === 0 ? undefined : p.owner, approvedDate: i === 0 ? undefined : reportDate,
        weatherSunny: i !== 1, weatherRainy: i === 1, tempMinC: 4 + i, tempMaxC: 14 + i, windSpeedMaxMs: 6 + i * 2, weatherImpactOnWork: i === 1,
        weatherImpactDescription: i === 1 ? "Crane lifts paused 2h due to wind" : undefined,
        manpowerEntries: json([
          { zone: "A", contractor_name: p.contractor, activity_description: `Install ${p.asset}`, workforce_count: "24", worked_hours: "192", day_shift: true },
          { zone: "B", contractor_name: "Electrical subcontractor", activity_description: "Cable pulling", workforce_count: "12", worked_hours: "96", day_shift: true },
        ]),
        equipmentEntries: json([{ equipment_type: "Mobile crane", quantity: "2", operational: "2", in_repair: "0", out_of_order: "0" }, { equipment_type: "Excavator", quantity: "3", operational: "2", in_repair: "1", out_of_order: "0" }]),
        remarkableEvents: json([{ event_time: "09:30", zone: "A", event_description: "Toolbox talk on lifting safety", event_type: "Other", severity: "Info" }]),
        totalWorkers: 36, totalHours: 288,
      })),
    },
    {
      entity: "SiteAssessment",
      rows: [{ ...base, assessmentName: `${p.projectName} — site selection`, assessmentDate: day(-500), assessmentStatus: "Finalist Selected", assessmentOwner: p.owner, categoryWeights: json({ ownership: 10, plot: 20, utilities: 20, infrastructure: 15, workforce: 20, incentives: 15 }) }],
      after: (sa) => [{
        entity: "CandidateSite",
        rows: [["Site Alpha", "Selected", "Germany"], ["Site Bravo", "Finalist", "Poland"], ["Site Charlie", "Rejected", "Spain"]].map(([siteName, status, country]) => ({ assessmentId: sa[0].id, org_id: orgId, siteName, status, country, region: "Industrial park", siteAddress: `${siteName} industrial zone` })),
        after: (sites) => [{
          entity: "SiteCriteria",
          rows: sites.flatMap((s, si) => Object.entries(siteKeys).flatMap(([category, keys]) => keys.map((criterionKey, ki) => ({
            siteId: s.id, org_id: orgId, category, criterionKey, requirement: "See template",
            response: si === 2 && criterionKey === "2.14" ? "Within 100-year flood zone" : "Confirmed",
            meetsRequirement: si === 2 && criterionKey === "2.14" ? "No" : ki === 2 && si === 1 ? "Partial" : "Yes",
            score: Math.max(2, 9 - si * 2 - (ki % 2)), remarks: "Synthetic score",
          })))),
        }],
      }],
    },
    {
      entity: "FeasibilityStudy",
      rows: [{
        ...base, studyName: `${p.projectName} — feasibility`, studyDate: day(-420), studyMaturity: "Detailed", studyVersion: "1.0", studyOwner: p.owner,
        executiveSummary: "Project is technically and commercially viable subject to permit conditions.",
        capexEurM: capex, annualOpexEurM: Math.round(capex * 0.06), annualRevenueEurM: Math.round(capex * 0.22), discountRate: 8, projectLifeYears: "20",
        npvEurM: npv(capex, capex * 0.06, capex * 0.22, 8, 20).npvResultEurM, irrPercent: 13.5, paybackYears: 6.2, feasibilityScore: 78,
        recommendation: "Proceed with Conditions", conditionsRemarks: "Secure grid connection agreement", approvalStatus: cur > 0 || done ? "Approved" : "Under Review",
      }],
    },
    { entity: "FEEDItem", rows: ["Design basis", "Process flow diagrams", "Plot plan", "Equipment list", "Class 3 estimate"].map((description, i) => ({ ...base, phase: `Phase ${i + 1}`, description, completed: cur > 2 || done || i < 2 })) },
    {
      entity: "NPVScenario",
      rows: ([["Base case", 1, 1, 1], ["Downside", 1.15, 1.1, 0.85], ["Upside", 0.95, 1, 1.15]] as [string, number, number, number][]).map(([scenarioName, c, o, r]) => {
        const s = { capexEurM: Math.round(capex * c), annualOpexEurM: Math.round(capex * 0.06 * o), annualRevenueEurM: Math.round(capex * 0.22 * r) };
        return { ...base, scenarioName, ...s, discountRatePercent: 8, projectDurationYears: 20, ...npv(s.capexEurM, s.annualOpexEurM, s.annualRevenueEurM, 8, 20), notes: SEED_TAG };
      }),
    },
    {
      entity: "FinanceModel",
      rows: [{ ...base, modelName: `${p.projectName} — base model`, version: "v1", status: "Draft", currency: "EUR", startQuarter: "Q4 2025", endYear: 2040, notes: SEED_TAG }],
      after: (fm) => {
        const f = { financeModelId: fm[0].id, org_id: orgId };
        const one = (entity: string, row: Record<string, unknown>): Group => ({ entity, rows: [{ ...f, ...row }] });
        const cell = { ...f, cellNumber: "Cell 1" };
        return [
          one("CellConfig", { cellNumber: "Cell 1", cellName: "Prismatic LFP", chemistry: "LFP", cellEnergyWh: 670, energyDensityWhKg: 176.8, ppm: 18, plannedOperatingHoursQtr: 1769.25, availability: 81, initialYield: 95.12, matureYield: 96, yieldMaturityYear: 2031, isActive: true }),
          { entity: "RevenueAssumptions", rows: [["Q4 2028", 20], ["Q2 2029", 60], ["Q4 2029", 90], ["Q4 2030", 100]].map(([quarter, rampPct]) => ({ ...cell, quarter, sellingPriceEurKwh: 95, priceChangePct: -1, rampPct, yieldPct: 95 })) },
          { entity: "CapexPlan", rows: ([["Buildings", "CSA", "Construction", "Q2 2026", 120], ["Equipment", "Manufacturing Lines", "Equipment", "Q4 2026", 260], ["Equipment", "Utility Equipment", "Equipment", "Q2 2027", 90], ["Land", "Site", "Land", "Q1 2026", 25]] as [string, string, string, string, number][]).map(([category, subCategory, costType, quarter, amountMEur]) => ({ ...f, category, subCategory, costType, quarter, amountMEur, procurementStrategy: "EPCM", pmoRatePct: 3, escalationPct: 2, contingencyPct: 10 })) },
          one("BOMAssumptions", { cellNumber: "Cell 1", totalBomEurKwh: 62, camEurKwh: 28, aamEurKwh: 8, electrolyteEurKwh: 5, separatorEurKwh: 4, anodeCurrentCollectorEurKwh: 3, cathodeCurrentCollectorEurKwh: 2, containerEurKwh: 6, yieldScrapEurKwh: 2, priceChangePctPerQtr: -0.5 }),
          one("LogisticsAssumptions", { cellNumber: "Cell 1", inboundLogisticsPct: 2, inboundDutyPct: 1 }),
          one("ScrapAssumptions", { cellNumber: "Cell 1", scrapLossPctOfBom: 3 }),
          one("UtilityAssumptions", { electricityGwhPerGwh: 18, electricityCostEurMwh: 111.2, gasGwhPerGwh: 15, gasCostEurMwh: 55, waterM3PerGwh: 200, waterCostEurM3: 1.15, waterFixedFeeEurMonth: 500, wastewaterM3PerGwh: 170, wastewaterCostEurM3: 1.35 }),
          one("TaxAssumptions", { corporateTaxRatePct: 25, lossCarryForward: true }),
          one("WorkingCapitalAssumptions", { arPaymentTermsDays: 30, apPaymentTermsDays: 45, inventoryDays: 69 }),
          one("DCFAssumptions", { valuationYear: 2026, discountRatePct: 18, terminalGrowthRatePct: 1.5 }),
          one("OtherOpexAssumptions", { outboundLogisticsPctRevenue: 1, royaltyPctRevenue: 3, warrantyPctRevenue: 2, rdPctRevenue: 0 }),
          one("FinancingAssumptions", { ltDebtTotalMEur: 150, ltInterestRatePct: 8, ltDrawdownPeriodQtrs: 15, ltRepaymentPeriodQtrs: 24, wcInterestRatePct: 8, wcPctFundedByDebt: 100, equityInjections: json([{ quarter: "Q1 2026", amount: 1.5 }, { quarter: "Q2 2026", amount: 1.25 }, { quarter: "Q3 2026", amount: 25 }, { quarter: "Q1 2027", amount: 125 }]) }),
          one("GrantAssumptions", { grantName: "Regional investment grant", cashReceiptMEur: 150, receiptQuarter: "Q1 2027", amortizationStartQuarter: "Q4 2028", amortizationYears: 10 }),
          { entity: "OverheadAssumptions", rows: [["Operational", "Maintenance contracts", "Per Quarter (fixed)", 1.2], ["G&A", "Insurance", "Per Quarter (fixed)", 0.6], ["Launch", "Ramp-up support", "Per GWh (variable)", 0.3]].map(([category, lineItem, costBasis, amount]) => ({ ...f, category, lineItem, costBasis, amount })) },
          { entity: "HeadcountPlan", rows: ([["Direct", "Production", "Line operator", "Staff", 42000, 120], ["Indirect Operational", "Maintenance", "Maintenance technician", "Staff", 52000, 30], ["G&A", "Finance", "Plant controller", "Manager", 95000, 2]] as [string, string, string, string, number, number][]).map(([category, department, roleTitle, level, baseSalaryEurPa, headcountFte]) => ({ ...f, category, department, roleTitle, level, baseSalaryEurPa, headcountFte, quarter: "Q4 2028", shiftAllowancePct: 10, socialPensionPct: 20, annualWageInflationPct: 2.5 })) },
        ];
      },
    },
    {
      entity: "ScheduleActivity",
      rows: scheduleActs.map(([activityName, wbsCode, s, f, pct, isCriticalPath], i) => {
        const pc = done ? 100 : onHold ? Math.min(pct, 40) : pct;
        const slip = isCriticalPath && !done ? 12 : 0;
        return {
          ...base, activityId: `A${String((i + 1) * 10).padStart(4, "0")}`, activityName, wbsCode, plannedStartDate: day(s), plannedFinishDate: day(f),
          actualStartDate: pc > 0 ? day(s + 2) : undefined, actualFinishDate: pc === 100 ? day(f + slip) : undefined, forecastFinishDate: day(f + slip),
          percentComplete: pc, status: pc === 100 ? "Completed" : onHold && pc > 0 ? "On Hold" : pc > 0 ? "In Progress" : "Not Started",
          isCriticalPath, totalFloat: isCriticalPath ? 0 : 15, duration: f - s, remainingDuration: Math.round((f - s) * (1 - pc / 100)),
          contractors: p.contractor, responsible: p.owner, uploadVersion: 1, uploadDate: day(-7), predecessors: i ? `A${String(i * 10).padStart(4, "0")}` : undefined,
        };
      }),
      after: (acts) => [{
        entity: "ScheduleRisk",
        rows: [["Equipment delivery slip", 2, 6], ["Weather delay", 4, 8], ["Commissioning rework", 5, 15]].map(([name, i, max], n) => ({
          project: projectId, org_id: orgId, name, description: name, linkedTaskId: acts[i as number]?.id, durationVariationMin: 0, durationVariationMax: max,
          costVariationMin: 0, costVariationMax: 250 * (n + 1), probability: [40, 25, 30][n],
        })),
      }],
    },
    { entity: "SCurveComment", link: "project", rows: [-2, -1, 0].map((m) => ({ project: projectId, org_id: orgId, period: new Date(monthStart(m)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" }) + " " + monthStart(m).slice(2, 4), comment: m ? "Progress in line with recovery plan." : "Critical path slipped by ~2 weeks.", author: p.owner, createdAt: day(m * 30) })) },
    {
      entity: "ScheduleSource",
      rows: [{ ...base, sourceName: `${p.contractor} master schedule`, sourceType: "Primavera P6", sourceOwner: p.contractor, fileFormat: "XER", syncMethod: "Manual Upload", syncFrequency: "Weekly (Monday)", lastSyncDate: new Date(today.getTime() - 3 * 86400000).toISOString(), lastSyncStatus: "Success", wbsPrefix: p.key, isActive: true, dataDate: day(-3), baselineCount: 1, taskCount: 6 }],
      after: (src) => {
        const sourceId = src[0].id;
        return [{
          entity: "ScheduleVersion",
          rows: [
            { versionNumber: "1", importDate: new Date(today.getTime() - 60 * 86400000).toISOString(), dataDate: day(-60), isCurrent: false, isBaseline: true, baselineLabel: "Contract baseline", percentComplete: 35 },
            { versionNumber: "2", importDate: new Date(today.getTime() - 3 * 86400000).toISOString(), dataDate: day(-3), isCurrent: true, isBaseline: false, percentComplete: 48 },
          ].map((v) => ({ ...base, sourceId, ...v, fileName: `${p.key}_v${v.versionNumber}.xer`, taskCount: 6, milestoneCount: 2, wbsLevels: 3, projectStart: day(p.start), projectFinish: day(p.end), criticalPathLength: 230, totalFloatMin: 0, importStatus: "Complete", deltaCount: v.isCurrent ? 3 : 0, criticalDeltaCount: v.isCurrent ? 1 : 0 })),
          after: (vers) => {
            const [baseline, current] = vers;
            return [
              {
                entity: "ScheduleTask",
                rows: scheduleActs.slice(0, 6).map(([taskName, wbsCode, s, f, pct, isCritical], i) => ({
                  ...base, versionId: current.id, sourceId, externalId: `A${(i + 1) * 10}`, externalWbs: `${p.key}.${wbsCode}`, unifiedWbs: wbsCode, taskName,
                  taskType: i === 5 ? "Milestone" : "Task", wbsLevel: wbsCode.split(".").length, plannedStart: day(s), plannedFinish: day(f), baselineStart: day(s), baselineFinish: day(f - 10),
                  actualStart: pct > 0 ? day(s + 2) : undefined, actualFinish: pct === 100 ? day(f) : undefined, durationDays: f - s, percentComplete: pct, totalFloat: isCritical ? 0 : 15,
                  isCritical, status: pct === 100 ? "Complete" : pct > 0 ? "In Progress" : "Not Started", resourceNames: p.contractor, isMapped: true,
                })),
              },
              {
                entity: "ScheduleDelta",
                rows: ([["A30", "Long-lead equipment procurement", "Date Shift", "plannedFinish", 12, "Major", true], ["A50", "Foundations", "Progress Update", "percentComplete", 0, "Info", false], ["A60", `Install ${p.asset}`, "Critical Path Change", "isCritical", 0, "Critical", true]] as [string, string, string, string, number, string, boolean][]).map(([externalId, taskName, changeType, fieldChanged, varianceDays, impactLevel, affectsCriticalPath]) => ({
                  ...base, sourceId, fromVersionId: baseline.id, toVersionId: current.id, externalId, taskName, changeType, fieldChanged, oldValue: "baseline", newValue: "current", varianceDays, impactLevel, affectsCriticalPath, affectsMilestone: impactLevel === "Critical", acknowledged: false,
                })),
              },
              {
                entity: "WBSMapping",
                rows: wbs.slice(0, 4).map(([code, name], i) => ({ ...base, sourceId, externalWbsCode: `${p.key}.${code}`, externalWbsName: name, unifiedWbsCode: code, unifiedWbsName: name, workstream: i === 0 ? "PMO" : "Common/Shared", qualityGate: `QG${Math.min(i + 3, 6)}`, isMapped: true, autoMapped: i % 2 === 0 })),
              },
            ];
          },
        }];
      },
    },
  ];
}

// Base44 rate-limits each caller (e.g. entity_list: 140 requests / 60s), so every database
// call goes through this pacer, and a "Rate limit exceeded … Retry after Ns" reply is waited
// out and retried instead of failing the run.
const MAX_CALLS_PER_MINUTE = 100;
const callTimes: number[] = [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function paced<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const now = Date.now();
    while (callTimes.length && now - callTimes[0] > 60000) callTimes.shift();
    if (callTimes.length >= MAX_CALLS_PER_MINUTE) { await sleep(60000 - (now - callTimes[0]) + 50); continue; }
    callTimes.push(Date.now());
    try {
      return await fn();
    } catch (e) {
      const msg = String((e as Error)?.message || e);
      if (!/rate limit/i.test(msg) || attempt >= 6) throw e;
      const secs = Number(/retry after (\d+)/i.exec(msg)?.[1] || 5);
      await sleep((secs + 1) * 1000);
    }
  }
}

// Every record of an entity in the Test org (paginated; the API returns 50 by default).
async function listOrg(db: any, entity: string, orgId: string): Promise<Rows> {
  const out: Rows = [];
  for (let skip = 0; ; skip += 5000) {
    const page = await paced(() => db[entity].filter({ org_id: orgId }, undefined, 5000, skip));
    out.push(...page);
    if (page.length < 5000) return out;
  }
}

const clean = (r: Record<string, unknown>) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined));

// Creates groups level by level. All groups for the same entity (across every project) go
// into ONE bulkCreate, so the whole seed is roughly one request per entity type.
async function createLevels(db: any, groups: Group[], counts: Record<string, number>) {
  let pending = groups;
  while (pending.length) {
    const byEntity = new Map<string, Group[]>();
    for (const g of pending) if (g.rows.length) byEntity.set(g.entity, [...(byEntity.get(g.entity) || []), g]);
    const next: Group[] = [];
    for (const [entity, gs] of byEntity) {
      const rows = gs.flatMap((g) => g.rows.map(clean));
      const created: Rows = await paced(() => db[entity].bulkCreate(rows));
      counts[entity] = (counts[entity] || 0) + created.length;
      let i = 0;
      for (const g of gs) {
        const mine = created.slice(i, i + g.rows.length);
        i += g.rows.length;
        if (g.after) next.push(...g.after(mine));
      }
    }
    pending = next;
  }
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
    const orgs = await paced(() => db.Organization.filter({ name: TEST_ORG_NAME }));
    if (orgs.length !== 1) {
      return Response.json({ error: `Expected exactly one organization named "${TEST_ORG_NAME}", found ${orgs.length}. Nothing changed.` }, { status: 409 });
    }
    const orgId = orgs[0].id as string;

    const inOrg = await listOrg(db, "Project", orgId);
    const seeded = inOrg.filter((p: any) => typeof p.notes === "string" && p.notes.includes(SEED_TAG));

    if (action === "status") {
      return Response.json({
        org: TEST_ORG_NAME,
        seedProjects: seeded.map((p: any) => p.projectName),
        missing: PROJECTS.filter((d) => !seeded.some((p: any) => p.projectName === d.projectName)).map((d) => d.projectName),
        otherProjectsInOrg: inOrg.length - seeded.length,
      });
    }

    if (action === "reset") {
      if (body.confirm !== RESET_PHRASE) {
        return Response.json({ error: `Reset needs "confirm": "${RESET_PHRASE}". Nothing changed.` }, { status: 400 });
      }
      // Walk the same parent→child tree the org_id stamping uses (one list per entity, Test
      // org only) to find every descendant of a seed project.
      const ids: Record<string, Set<string>> = { Project: new Set(seeded.map((p: any) => p.id)) };
      const totals: Record<string, number> = { Project: inOrg.length };
      for (const cfg of ORG_ID_ENTITIES) {
        const parents = ids[cfg.parentEntity] || new Set<string>();
        const rows = await listOrg(db, cfg.name, orgId);
        totals[cfg.name] = rows.length;
        ids[cfg.name] = new Set([...(ids[cfg.name] || []), ...rows.filter((r: any) => parents.has(r[cfg.parentField])).map((r: any) => r.id)]);
      }
      // Delete children before parents. When every record of a type in the Test org is seed
      // data, one deleteMany scoped to the Test org clears it; otherwise delete one by one so
      // non-seed test records survive.
      const deleted: Record<string, number> = {};
      const order = [...new Set([...ORG_ID_ENTITIES.map((c) => c.name)].reverse().concat("Project"))];
      for (const name of order) {
        const list = [...(ids[name] || [])];
        if (!list.length) continue;
        if (list.length === totals[name]) {
          await paced(() => db[name].deleteMany({ org_id: orgId }));
        } else {
          for (const id of list) await paced(() => db[name].delete(id));
        }
        deleted[name] = list.length;
      }
      return Response.json({ org: TEST_ORG_NAME, deleted });
    }

    // seed — create missing projects, then fill every tool that is still empty for them.
    const created: Record<string, number> = {};
    const projects: Record<string, any> = {};
    const missing = PROJECTS.filter((d) => !seeded.some((p: any) => p.projectName === d.projectName));
    if (missing.length) {
      const made = await paced(() => db.Project.bulkCreate(missing.map((def) => ({
        org_id: orgId, projectName: def.projectName, clientName: SEED_CLIENT, projectType: def.projectType,
        currentPhase: def.currentPhase, status: def.status, totalBudgetEurM: def.totalBudgetEurM, healthScore: def.healthScore,
        startDate: day(def.start), targetCompletion: day(def.end), projectOwner: def.owner,
        notes: `${SEED_TAG} Synthetic test data — safe to reset.`,
      }))));
      created.Project = made.length;
      for (const p of made) projects[p.projectName] = p;
    }
    for (const p of seeded) projects[p.projectName] = p;

    // One list per tool tells us which seed projects already have data for it.
    const all = PROJECTS.map((def) => ({ def, groups: toolGroups(def, projects[def.projectName].id, orgId) }));
    const toolsAlreadyFilled: Record<string, number> = {};
    const filled: Record<string, Set<string>> = {};
    for (const g of all[0].groups) {
      const link = g.link || "projectId";
      filled[g.entity] = new Set((await listOrg(db, g.entity, orgId)).map((r: any) => r[link]));
    }
    const todo: Group[] = [];
    for (const { def, groups } of all) {
      const pid = projects[def.projectName].id;
      for (const g of groups) {
        if (filled[g.entity].has(pid)) toolsAlreadyFilled[g.entity] = (toolsAlreadyFilled[g.entity] || 0) + 1;
        else todo.push(g);
      }
    }
    await createLevels(db, todo, created);
    return Response.json({ org: TEST_ORG_NAME, created, toolsAlreadyFilled });
  } catch (error) {
    return Response.json({ error: (error as Error)?.message || String(error) }, { status: 500 });
  }
});
