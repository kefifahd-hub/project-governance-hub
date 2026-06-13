# Industrialization Process Map & Governance Roadmap

_Project Governance Hub — PMO platform for industrial capital projects (factory / plant build-out, QG0 → Start of Production)._

This document maps the industrialization process the platform encodes, shows where each
module sits in that process, and lays out a prioritized roadmap of governance improvements.

---

## 1. The stage-gate lifecycle

Industrial capital projects are governed through a **stage-gate** model: the project advances
through operational **phases**, and at defined **Quality Gates (QG)** a decision authority
confirms the project is fit to proceed (Pass / Pass with Reserves / Not Pass).

The platform's canonical lifecycle is now defined in a single source of truth:
[`src/lib/lifecycle.js`](../src/lib/lifecycle.js).

| Gate | Stage | Operational phase(s) | Primary modules |
|------|-------|----------------------|-----------------|
| **QG0** | Opportunity Assessment | _(entry)_ | Site Selection, NPV Calculator |
| **QG1** | Pre-Feasibility | Feasibility, Pre-FEED | Feasibility Study, Finance Model, NPV Calculator |
| **QG2** | FEED Complete | FEED | FEED Tracker, Finance Model |
| **QG3** | FID (Final Investment Decision) | Investment Decision, Project Setup | Finance Model, Risk Register, Change Mgmt |
| **QG4** | Mechanical Completion | Detailed Engineering, Procurement, Construction | Schedule (Monitoring/Sync/Dashboard), Budget, QA/QC |
| **QG5** | Commissioning | Commissioning | QA/QC (FAT/SAT), Schedule, Daily Site Reports |
| **QG6** | SOP (Start of Production) | SOP | Weekly Reports, QA/QC, Finance Model |
| **QG7** | Full Production | _(steady state)_ | Reports, Budget |

**Cross-cutting modules** (active at every gate): Action Tracker, Risk Register, Budget
Tracking, Weekly / Client Reports, Users & Access (RBAC + AuditLog), and the two AI layers —
**Brainiac** (neuron/synapse knowledge graph) and **PMO Agent**.

```
QG0 ──────── QG1 ──────── QG2 ──────── QG3 ───────── QG4 ──────── QG5 ──── QG6 ── QG7
Opportunity  Pre-Feas    FEED Done     FID          Mech.Comp.   Comm.    SOP    Full Prod
│            │           │             │            │            │        │
SiteSelect   Feasibility FEEDTracker   FinanceModel ScheduleSync QA/QC    Weekly Reports
NPVCalc      FinanceModel QualityGate  ChangeMgmt   ScheduleMon  DailySite Reports
             Milestone    Milestone    Risk         Budget       NonConf
─────────────────────── CROSS-CUTTING (all gates) ──────────────────────────────
ActionTracker · RiskRegister · BudgetTracking · Reports · UserAccess/AuditLog · Brainiac · PMOAgent
```

---

## 2. Module → process coverage

| Module | Page | Process role |
|--------|------|--------------|
| Site Selection | `SiteSelection` | Candidate site scoring & comparison (QG0–QG1) |
| NPV Calculator | `NPVCalculator` | Early viability / returns (QG0–QG1) |
| Feasibility Study | `FeasibilityStudy` | Viability assessment + **Quality Gate timeline** (QG1–QG2) |
| Finance Model | `FinanceModel` | Full P&L / Cash Flow / DCF (QG1–QG3) |
| FEED Tracker | `FEEDTracker` | Phase milestones + quality-gate deliverables (QG2) |
| Risk Register | `RiskRegister` | Risk identification & mitigation (all gates) |
| Budget Tracking | `BudgetDashboard` | Budget vs actual (QG3+) |
| Schedule Monitoring / Sync / Dashboard | `Schedule*` | P6 / MS Project integration & S-curve (QG3–QG5) |
| QA/QC | `QAQCDashboard` | FAT, SAT, inspections, non-conformities (QG4–QG6) |
| Change Management | `ChangeManagement` | Change requests, impact assessment, approval (QG3+) |
| Weekly / Client Reports | `WeeklyReports`, `ClientBriefing`, `Reports` | Status roll-ups (all gates) |
| Action Tracker | `ActionTracker` | Tasks / issues / decisions / RFIs (all gates) |
| Users & Access | `UserAccess` | RBAC, organizations, audit log (governance) |
| Brainiac | `Brainiac` | Knowledge graph wiring data between modules |
| PMO Agent | `PMOAgent` | Conversational assistant over project data |
| **Portfolio Governance** | `PortfolioDashboard` | **NEW — cross-project gate / health / exposure view** |
| **Process & Procedure Library** | `ProcessLibrary` | **NEW — phase/gate-aware procedures + interactive gate checklists** |

---

## 3. Findings & roadmap

Ordered by governance impact.

### A. Unify the stage-gate model — single source of truth ✅ _(done)_
The platform previously carried **three divergent vocabularies** for the same process:
`FEEDTracker` seeded one milestone phase list, `ProjectSidebar` kept its own copy for tool
gating, and `QualityGateTimeline` used a separate QG0–QG7 scale — with no mapping between
phases and gates. A project's "current gate" could not be computed consistently.

**Resolved** by [`src/lib/lifecycle.js`](../src/lib/lifecycle.js): one definition of phases,
gates, the phase→gate mapping, and the phase→tools mapping. `FEEDTracker`, `ProjectSidebar`
and `QualityGateTimeline` now consume it.

### B. Portfolio / cross-project governance ✅ _(first cut done)_
Everything was single-project (`?id=`); a PMO governs a **portfolio**. The new
`PortfolioDashboard` lists every project with its current phase + gate, RAG health, lifecycle
progress, budget and open critical-risk count, plus a lifecycle-distribution strip.
_Next: drill-downs, budget-variance roll-up, exportable portfolio report._

### C. Process & Procedure Library + gate checklists ✅ _(first cut done)_
The hub is not only a monitor/control surface — it is also the **library** of how the work
should be governed. `src/lib/processLibrary.js` is a code-defined catalog of procedures and
gate checklists for every lifecycle phase; the `ProcessLibrary` page browses it, auto-opens
the project's current phase, and offers **interactive gate-readiness checklists** whose
mandatory-item completion drives a readiness bar (state persisted per project in
`localStorage`). Each checklist item can deep-link to the platform tool that provides its
evidence — wiring the library to the monitor/control side.
_Next: persist checklist completion to a backend entity and surface readiness on the gate itself._

### D. Tie cross-cutting registers to gates — _proposed_
Risk Register, Budget and Change Management are not yet linked to gate criteria. A critical
open risk or an unapproved high-impact change should be a gate-exit blocker. **Propose:**
auto-tick (or block) library checklist items from live register data.

### E. AI agent as guide over the library ✅ _(first cut done)_
The PMO Agent now receives the current phase's library guidance in its context and advertises
`/procedure` and `/checklist` commands, so it can guide the user through the right process for
where the project is — not just answer from live data.
_Next: have the Agent generate an automated gate-readiness assessment attached to each Quality Gate._

---

## 4. Changelog

- Added `src/lib/lifecycle.js` — single source of truth for phases, gates and phase→tool mapping.
- Refactored `FEEDTracker`, `ProjectSidebar`, `QualityGateTimeline` to consume it.
- Added `PortfolioDashboard` page + bottom-nav entry for cross-project governance.
- Added `src/lib/processLibrary.js` — code-defined catalog of procedures and gate checklists per phase.
- Added `ProcessLibrary` page (browse by phase, interactive gate checklists, deep-links to tools) + Library nav entry.
- Made the PMO Agent library-aware (`/procedure`, `/checklist`, phase guidance in its context).
