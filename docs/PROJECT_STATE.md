# Project State & History

> Purpose: give any new Claude session (or the owner) the full context of this
> project without depending on prior chat history. Update this file as work
> progresses. Last updated: 2026-06-13.

## What this project is

Two intertwined efforts:

1. **The PMO Hub app** — a React/Vite + Base44 application for project governance
   (feasibility, finance, schedule, change management, quality gates, reporting,
   a "Brainiac" neural-canvas, etc.).
2. **A personal knowledge system ("Claude Brain")** in the owner's Google Drive
   that ingests the owner's documents, anonymizes them, and organizes them so any
   Claude session can recall them. The app is being enhanced using the governance
   knowledge captured in that brain.

## Knowledge brain (in Google Drive, not in this repo)

Folder "Claude Brain" with: Personal Brain, Governance Brain (PMO Hub), an inbox,
an archive, and `08 - Owner-Firm Methodology & IP`. Knowledge is split into three
areas, all anonymized:

- **Client-A** — the battery-standards source: the "Battery Industrialisation
  Processes" framework (2.1–2.9) + BIM/document-control/naming standards.
- **Client-B** — the owner's PMO consulting client (a Gulf-region battery/BESS
  factory).
- **Owner-Firm IP** — the owner's own reusable PMO methodology.

Authoritative index: `INDEX — Governance Brain — 2026-06-13 (v3 …)`. Rules:
`BRAIN MANUAL v3`. Real-name ↔ alias mapping lives only in the `PRIVATE - Alias
Mapping` docs in Drive (never copied into this repo).

## App work completed (branch `claude/personal-data-brain-setup-jwyurp`)

- **Quality Gates** (`src/components/feasibility/QualityGateTimeline.jsx`) —
  rebuilt around the real QG0–QG8 framework: gate names, promoter accountability
  (PD→GM at QG6, PMO fallback), Level-1 owner departments, traffic-light maturity
  rule, mandatory pre-approval reminder.
- **Change management** (`src/components/changemanagement/ImpactAssessmentPanel.jsx`)
  — approval routing uses the real change ranks: PM (no cost) / Project Director
  ≤ $100K / Change Control Board ≤ $500K / Global Capex Committee > $500K;
  critical-path > 30 days escalates to ≥ CCB.
- **Battery Industrialisation Processes framework** —
  `src/components/processframework/batteryIndustrialisationProcesses.js` (data
  model: workstreams 2.1–2.9, sub-processes, gate alignment, I/O handoffs, linked
  modules, known gaps) and `src/pages/IndustrialisationProcesses.jsx` (value-chain
  page with gate overlay + per-workstream detail). Registered in
  `src/pages.config.js`; always-visible sidebar entry in
  `src/components/ProjectSidebar.jsx`.

All built clean and pushed. Not yet merged to `main`.

## Outstanding actions

**Owner (manual, in Google Drive — Claude can only create/read, not move/delete):**
- Trash 7 stale/leaking brain docs (two contained real names) — see the Drive doc
  `SESSION HANDOFF — pending actions (2026-06-13)` for exact titles/locations.
- Delete or move the `YE` backup folder out of the shared "Claude Brain" (the owner
  confirmed a copy exists on an external disc). It holds passport/ID/insurance and
  must not stay in the shared, connector-readable folder.
- Export 3 Visio flowcharts to PDF and drop in the inbox (Risk Mgmt 2.2.10,
  Integrated Master Schedule 2.2.11, Financial Plan 2.2.8) — biggest knowledge gap.

**Code / repo:**
- Confirm whether the owner's local Mac copy is in sync with GitHub (was unresolved;
  the GitHub branch is the source of truth and builds cleanly).
- Consider merging `claude/personal-data-brain-setup-jwyurp` → `main` once reviewed.

## Next app enhancement candidates

- Drive the Quality Gate timeline from the workstream/gate mapping.
- Seed the Master Schedule with the ~1,140-day standard gigafactory baseline.
- Align the Finance Model with the financial-plan process (parametric estimate →
  investment memo → value engineering → baseline freeze).
- Add the Battery Industrialisation Processes as a layer in the Brainiac neural canvas.

## Notes / lessons

- Low-cost-model ingestion leaked real names twice (caught on review). For
  anonymization-sensitive work, use a stronger model or always verify each created
  doc before finalizing.
