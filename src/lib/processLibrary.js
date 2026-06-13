/**
 * processLibrary.js — The governance "library": processes, procedures and
 * checklists a PMO needs, organized along the industrialization lifecycle.
 *
 * The Project Governance Hub is two things at once:
 *   1. Tools to MONITOR & CONTROL a live project (dashboards, registers, schedule)
 *   2. A LIBRARY of the processes / procedures / checklists that govern HOW the
 *      work should be done at each phase and quality gate.
 *
 * This file is the code-defined catalog behind (2). It is keyed to the shared
 * lifecycle (see lifecycle.js) so a project always sees the right guidance for
 * where it is, and each checklist item can declare the platform tool that
 * provides the evidence — wiring the library to the monitor/control side.
 */
import { LIFECYCLE_PHASES, QUALITY_GATES, getPhase } from './lifecycle';

// Each entry: { phase, gate, overview, procedures[], checklists[] }
//   procedure: { id, title, purpose, owner, steps[], outputs[], relatedTool? }
//   checklist: { id, title, gate, items[] }
//     item:    { id, text, mandatory, relatedTool? }
export const PROCESS_LIBRARY = [
  {
    phase: 'Feasibility',
    gate: 1,
    overview:
      'Establish whether the opportunity is worth pursuing: market, technology, indicative economics and candidate sites.',
    procedures: [
      {
        id: 'feas-business-case',
        title: 'Develop the Outline Business Case',
        purpose: 'Frame the opportunity and the order-of-magnitude economics for a QG1 go/no-go decision.',
        owner: 'Project Sponsor / Business Development',
        steps: [
          'Define product scope, target capacity and target market.',
          'Build a high-level (Class 5) capex/opex estimate.',
          'Run an indicative NPV/IRR with conservative assumptions.',
          'Identify the 3–5 make-or-break risks and assumptions.',
        ],
        outputs: ['Outline Business Case', 'Class 5 cost estimate', 'Indicative NPV model'],
        relatedTool: 'NPVCalculator',
      },
      {
        id: 'feas-site-screening',
        title: 'Screen Candidate Sites',
        purpose: 'Narrow the long-list of sites to a credible short-list using structured criteria.',
        owner: 'Site Selection Lead',
        steps: [
          'Assemble candidate sites and define weighted scoring criteria.',
          'Score each site (utilities, logistics, permitting, incentives, workforce).',
          'Compare scores and document the rationale for the short-list.',
        ],
        outputs: ['Scored site matrix', 'Short-list with rationale'],
        relatedTool: 'SiteSelection',
      },
    ],
    checklists: [
      {
        id: 'feas-qg1',
        title: 'QG1 — Pre-Feasibility Gate Readiness',
        gate: 1,
        items: [
          { id: 'f1', text: 'Outline Business Case approved by sponsor', mandatory: true },
          { id: 'f2', text: 'Class 5 cost estimate complete', mandatory: true, relatedTool: 'FinanceModel' },
          { id: 'f3', text: 'Indicative NPV/IRR meets hurdle rate', mandatory: true, relatedTool: 'NPVCalculator' },
          { id: 'f4', text: 'Candidate site short-list documented', mandatory: true, relatedTool: 'SiteSelection' },
          { id: 'f5', text: 'Top make-or-break risks logged', mandatory: false, relatedTool: 'RiskRegister' },
        ],
      },
    ],
  },
  {
    phase: 'Pre-FEED',
    gate: 1,
    overview: 'Mature the preferred concept and selected site enough to scope a FEED.',
    procedures: [
      {
        id: 'prefeed-concept',
        title: 'Concept Selection',
        purpose: 'Choose the preferred technical concept from screened options.',
        owner: 'Engineering Lead',
        steps: [
          'Document 2–3 viable technical concepts.',
          'Evaluate against cost, schedule, risk and scalability.',
          'Record the concept-selection decision and assumptions.',
        ],
        outputs: ['Concept selection report', 'Basis of design (draft)'],
        relatedTool: 'FeasibilityStudy',
      },
    ],
    checklists: [
      {
        id: 'prefeed-qg1',
        title: 'Pre-FEED Exit Checklist',
        gate: 1,
        items: [
          { id: 'pf1', text: 'Preferred site confirmed', mandatory: true, relatedTool: 'SiteSelection' },
          { id: 'pf2', text: 'Concept selected and documented', mandatory: true, relatedTool: 'FeasibilityStudy' },
          { id: 'pf3', text: 'Class 4 estimate prepared', mandatory: true, relatedTool: 'FinanceModel' },
          { id: 'pf4', text: 'Risk register initiated', mandatory: true, relatedTool: 'RiskRegister' },
        ],
      },
    ],
  },
  {
    phase: 'FEED',
    gate: 2,
    overview: 'Front-End Engineering Design — define scope, cost and schedule to ±10–15% for the investment decision.',
    procedures: [
      {
        id: 'feed-deliverables',
        title: 'Manage FEED Deliverables',
        purpose: 'Produce the engineering deliverable set required to close QG2.',
        owner: 'FEED Manager',
        steps: [
          'Issue the FEED deliverables register (P&IDs, layouts, datasheets, specs).',
          'Track deliverable status to completion in the FEED Tracker.',
          'Hold the FEED close-out review before declaring QG2 ready.',
        ],
        outputs: ['FEED deliverables register', 'Class 3 estimate', 'Execution strategy'],
        relatedTool: 'FEEDTracker',
      },
    ],
    checklists: [
      {
        id: 'feed-qg2',
        title: 'QG2 — FEED Complete Gate Readiness',
        gate: 2,
        items: [
          { id: 'fe1', text: 'FEED deliverables register 100% complete', mandatory: true, relatedTool: 'FEEDTracker' },
          { id: 'fe2', text: 'Class 3 cost estimate finalized', mandatory: true, relatedTool: 'FinanceModel' },
          { id: 'fe3', text: 'Execution & contracting strategy defined', mandatory: true },
          { id: 'fe4', text: 'Updated NPV confirms viability', mandatory: true, relatedTool: 'NPVCalculator' },
          { id: 'fe5', text: 'Risk register reviewed and quantified', mandatory: true, relatedTool: 'RiskRegister' },
        ],
      },
    ],
  },
  {
    phase: 'Investment Decision',
    gate: 3,
    overview: 'Final Investment Decision (FID) — secure funding approval to execute.',
    procedures: [
      {
        id: 'fid-paper',
        title: 'Prepare the FID Paper',
        purpose: 'Give the investment board everything needed to approve (or reject) execution funding.',
        owner: 'Project Director',
        steps: [
          'Consolidate final business case, cost, schedule and risk.',
          'Confirm financing structure and funding sources.',
          'Document decision authority, conditions and any reserves.',
        ],
        outputs: ['FID paper', 'Approved budget', 'Sanctioned baseline schedule'],
        relatedTool: 'FinanceModel',
      },
    ],
    checklists: [
      {
        id: 'fid-qg3',
        title: 'QG3 — FID Gate Readiness',
        gate: 3,
        items: [
          { id: 'fid1', text: 'Final business case approved', mandatory: true, relatedTool: 'FinanceModel' },
          { id: 'fid2', text: 'Financing secured / committed', mandatory: true },
          { id: 'fid3', text: 'Sanctioned baseline budget set', mandatory: true, relatedTool: 'BudgetDashboard' },
          { id: 'fid4', text: 'All high/critical risks have mitigation owners', mandatory: true, relatedTool: 'RiskRegister' },
          { id: 'fid5', text: 'Decision authority & reserves recorded', mandatory: true },
        ],
      },
    ],
  },
  {
    phase: 'Project Setup',
    gate: 3,
    overview: 'Stand up the execution organization, controls and contracts post-FID.',
    procedures: [
      {
        id: 'setup-controls',
        title: 'Mobilize Project Controls',
        purpose: 'Establish the baseline and the cadence for monitoring & control.',
        owner: 'Project Controls Manager',
        steps: [
          'Baseline the schedule and import into Schedule Monitoring.',
          'Set up the cost breakdown structure and budget baseline.',
          'Define the reporting cadence and RACI.',
        ],
        outputs: ['Baseline schedule', 'Budget baseline', 'Reporting plan'],
        relatedTool: 'ScheduleMonitoring',
      },
    ],
    checklists: [
      {
        id: 'setup-check',
        title: 'Project Setup Checklist',
        gate: 3,
        items: [
          { id: 's1', text: 'Baseline schedule loaded', mandatory: true, relatedTool: 'ScheduleMonitoring' },
          { id: 's2', text: 'Budget baseline established', mandatory: true, relatedTool: 'BudgetDashboard' },
          { id: 's3', text: 'Project team & access provisioned', mandatory: true, relatedTool: 'UserAccess' },
          { id: 's4', text: 'Change management process active', mandatory: true, relatedTool: 'ChangeManagement' },
        ],
      },
    ],
  },
  {
    phase: 'Detailed Engineering',
    gate: 4,
    overview: 'Develop construction-ready (IFC) design and procure long-lead items.',
    procedures: [
      {
        id: 'de-change',
        title: 'Engineering Change Control',
        purpose: 'Keep scope, cost and schedule under control as the design matures.',
        owner: 'Engineering Manager',
        steps: [
          'Log every change request with impact assessment.',
          'Route high-impact changes through formal approval.',
          'Update baselines only on approved changes.',
        ],
        outputs: ['Change log', 'Impact assessments'],
        relatedTool: 'ChangeManagement',
      },
    ],
    checklists: [
      {
        id: 'de-check',
        title: 'Detailed Engineering Health Checklist',
        gate: 4,
        items: [
          { id: 'd1', text: 'IFC drawings progressing to plan', mandatory: true, relatedTool: 'ScheduleMonitoring' },
          { id: 'd2', text: 'Long-lead items ordered', mandatory: true },
          { id: 'd3', text: 'Change log current with impacts assessed', mandatory: true, relatedTool: 'ChangeManagement' },
          { id: 'd4', text: 'Cost trending within tolerance', mandatory: false, relatedTool: 'BudgetDashboard' },
        ],
      },
    ],
  },
  {
    phase: 'Procurement',
    gate: 4,
    overview: 'Award packages and manage suppliers and expediting.',
    procedures: [
      {
        id: 'proc-award',
        title: 'Package Award & Expediting',
        purpose: 'Award work packages and ensure on-time delivery of equipment.',
        owner: 'Procurement Manager',
        steps: [
          'Run tender, evaluate bids, award package.',
          'Set up expediting and inspection plan with QA/QC.',
          'Track delivery against the schedule.',
        ],
        outputs: ['Award recommendations', 'Expediting reports'],
        relatedTool: 'QAQCDashboard',
      },
    ],
    checklists: [
      {
        id: 'proc-check',
        title: 'Procurement Readiness Checklist',
        gate: 4,
        items: [
          { id: 'p1', text: 'Critical packages awarded', mandatory: true },
          { id: 'p2', text: 'Supplier QA/QC plans agreed', mandatory: true, relatedTool: 'QAQCDashboard' },
          { id: 'p3', text: 'Deliveries tracked against schedule', mandatory: true, relatedTool: 'ScheduleMonitoring' },
        ],
      },
    ],
  },
  {
    phase: 'Construction',
    gate: 4,
    overview: 'Build to mechanical completion with HSE and quality control.',
    procedures: [
      {
        id: 'con-hse-quality',
        title: 'Site HSE & Quality Control',
        purpose: 'Deliver construction safely and to specification toward QG4.',
        owner: 'Construction Manager',
        steps: [
          'Run daily site reporting and HSE observations.',
          'Raise and close non-conformities (NCRs).',
          'Track progress against the construction schedule.',
        ],
        outputs: ['Daily site reports', 'NCR log', 'Progress S-curve'],
        relatedTool: 'QAQCDashboard',
      },
    ],
    checklists: [
      {
        id: 'con-qg4',
        title: 'QG4 — Mechanical Completion Gate Readiness',
        gate: 4,
        items: [
          { id: 'c1', text: 'All systems mechanically complete', mandatory: true, relatedTool: 'ScheduleMonitoring' },
          { id: 'c2', text: 'Open non-conformities resolved or dispositioned', mandatory: true, relatedTool: 'QAQCDashboard' },
          { id: 'c3', text: 'Punch list captured', mandatory: true },
          { id: 'c4', text: 'HSE incidents reviewed, no open critical items', mandatory: true },
          { id: 'c5', text: 'Budget reconciled to date', mandatory: false, relatedTool: 'BudgetDashboard' },
        ],
      },
    ],
  },
  {
    phase: 'Commissioning',
    gate: 5,
    overview: 'Test and prove the facility: FAT, SAT, and performance runs.',
    procedures: [
      {
        id: 'comm-fat-sat',
        title: 'FAT / SAT & Performance Testing',
        purpose: 'Demonstrate the facility performs to specification before SOP.',
        owner: 'Commissioning Manager',
        steps: [
          'Execute Factory Acceptance Tests on key equipment.',
          'Execute Site Acceptance Tests after installation.',
          'Run performance tests and capture results in QA/QC.',
        ],
        outputs: ['FAT/SAT records', 'Performance test results'],
        relatedTool: 'QAQCDashboard',
      },
    ],
    checklists: [
      {
        id: 'comm-qg5',
        title: 'QG5 — Commissioning Gate Readiness',
        gate: 5,
        items: [
          { id: 'cm1', text: 'FAT complete for critical equipment', mandatory: true, relatedTool: 'QAQCDashboard' },
          { id: 'cm2', text: 'SAT complete and signed off', mandatory: true, relatedTool: 'QAQCDashboard' },
          { id: 'cm3', text: 'Performance tests meet acceptance criteria', mandatory: true },
          { id: 'cm4', text: 'Punch list closed to agreed threshold', mandatory: true },
          { id: 'cm5', text: 'Operations team trained & ready', mandatory: false },
        ],
      },
    ],
  },
  {
    phase: 'SOP',
    gate: 6,
    overview: 'Start of Production — ramp up and hand over to operations.',
    procedures: [
      {
        id: 'sop-handover',
        title: 'Handover to Operations',
        purpose: 'Transfer the asset to operations and begin the production ramp.',
        owner: 'Project Director / Plant Manager',
        steps: [
          'Complete handover dossier and as-built documentation.',
          'Confirm ramp-up plan and yield targets.',
          'Capture lessons learned and close the project.',
        ],
        outputs: ['Handover dossier', 'Ramp-up plan', 'Lessons learned'],
        relatedTool: 'WeeklyReports',
      },
    ],
    checklists: [
      {
        id: 'sop-qg6',
        title: 'QG6 — SOP Gate Readiness',
        gate: 6,
        items: [
          { id: 'so1', text: 'Handover dossier accepted by operations', mandatory: true },
          { id: 'so2', text: 'As-built documentation complete', mandatory: true },
          { id: 'so3', text: 'Ramp-up plan approved', mandatory: true },
          { id: 'so4', text: 'Final cost reconciled vs sanctioned budget', mandatory: true, relatedTool: 'BudgetDashboard' },
          { id: 'so5', text: 'Lessons learned captured', mandatory: false },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Library entry for a (possibly messy) phase string. */
export function getLibraryForPhase(rawPhase) {
  const key = getPhase(rawPhase)?.key;
  return PROCESS_LIBRARY.find((e) => e.phase === key);
}

/** All checklists that gate a given Quality Gate number. */
export function getChecklistsForGate(gateNumber) {
  return PROCESS_LIBRARY.flatMap((e) =>
    e.checklists.filter((c) => c.gate === gateNumber).map((c) => ({ ...c, phase: e.phase }))
  );
}

/** Flat, ordered list of every library entry following the lifecycle order. */
export function orderedLibrary() {
  return LIFECYCLE_PHASES.map((p) => getLibraryForPhase(p.key)).filter(Boolean);
}

/** Lightweight full-text search across procedures and checklist items. */
export function searchLibrary(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results = [];
  for (const entry of PROCESS_LIBRARY) {
    for (const proc of entry.procedures) {
      if (
        proc.title.toLowerCase().includes(q) ||
        proc.purpose.toLowerCase().includes(q) ||
        proc.steps.some((s) => s.toLowerCase().includes(q))
      ) {
        results.push({ kind: 'procedure', phase: entry.phase, gate: entry.gate, title: proc.title, item: proc });
      }
    }
    for (const cl of entry.checklists) {
      if (cl.title.toLowerCase().includes(q) || cl.items.some((i) => i.text.toLowerCase().includes(q))) {
        results.push({ kind: 'checklist', phase: entry.phase, gate: cl.gate, title: cl.title, item: cl });
      }
    }
  }
  return results;
}

/** Compact text summary of a phase's library, for the AI agent context. */
export function librarySummaryForAgent(rawPhase) {
  const entry = getLibraryForPhase(rawPhase);
  if (!entry) return '(no library guidance for this phase)';
  const gate = QUALITY_GATES.find((g) => g.number === entry.gate);
  const procs = entry.procedures.map((p) => `  - ${p.title} (owner: ${p.owner})`).join('\n');
  const checks = entry.checklists
    .map((c) => `  - ${c.title}: ${c.items.length} items (${c.items.filter((i) => i.mandatory).length} mandatory)`)
    .join('\n');
  return [
    `Phase "${entry.phase}" drives ${gate?.name} — ${gate?.full}.`,
    `Procedures:\n${procs}`,
    `Gate checklists:\n${checks}`,
  ].join('\n');
}
