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

### C. Enforce gate-keeping (not just record it) — _proposed_
Quality gates can be marked complete and can carry "Passed with Reserves" + unresolved
reserves, but nothing surfaces or blocks downstream work when a gate is advanced with open
reserves or missing mandatory evidence / decision authority. **Propose:** a gate-readiness
checklist that aggregates open risks, unapproved high-impact changes, open NCs and overdue
actions, and warns (or soft-blocks) on gate advance.

### D. Tie cross-cutting registers to gates — _proposed_
Risk Register, Budget and Change Management are not linked to gate criteria. A critical open
risk or an unapproved high-impact change should be a gate-exit blocker. **Propose:** surface
these on the gate-readiness checklist (builds on C).

### E. Use the AI layer for governance, not just chat — _proposed_
Brainiac (knowledge graph) and PMO Agent are well-built but disconnected from gate decisions.
**Propose:** an automated "gate-readiness assessment" the Agent generates from live entity
data, attached to each Quality Gate.

---

## 4. Changelog

- Added `src/lib/lifecycle.js` — single source of truth for phases, gates and phase→tool mapping.
- Refactored `FEEDTracker`, `ProjectSidebar`, `QualityGateTimeline` to consume it.
- Added `PortfolioDashboard` page + bottom-nav entry for cross-project governance.
