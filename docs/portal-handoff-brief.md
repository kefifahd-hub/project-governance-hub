# Handoff Brief — Finish the Base44→Supabase port in `buildmind-pmo-portal`

> Paste this into a fresh Claude Code session **scoped to `buildmind-pmo-portal`** to start
> executing. It summarizes the cross-repo situation, the goal, the key finding, and the exact
> first tasks (Wave 1). The full per-entity spec lives in the legacy repo at
> `project-governance-hub/docs/entity-migration-backlog.md`.

## The situation
Two repos, two generations of the **same product**:
- **`project-governance-hub`** (legacy) — Vite + React 18 + `@base44/sdk`. Feature-complete:
  23 pages, ~54 entities. Now **frozen, read-only** as the migration reference/spec.
- **`buildmind-pmo-portal`** (this repo, the target) — Next.js 16 + React 19 + Supabase +
  Tailwind v4. ~30% ported, currently **read-only**.

**Goal: full independence from Base44.** That means finishing the port of all ~54 entities /
remaining pages into this portal (Supabase), then archiving the legacy app.

## Key finding (changes the size of the job)
The portal's Supabase project **already contains snake_case tables for almost every entity**
(`action_bucket`, `bom_assumptions`, `capex_plan`, `change_approval`, `daily_site_report`,
`finance_model`, …) — visible in the Supabase Table Editor. The portal app only **queries 9**
of them today. So the remaining work is mostly **wiring pages + enabling writes + RLS**, not
building schema.

## Hard caveats before writing anything
1. **RLS is too loose.** Current policies effectively let any authenticated user read
   everything. **Tighten RLS** (scope by `organization` / project membership) **before**
   enabling any write path.
2. **Column casing.** Portal tables are **snake_case** (`project_name`); the legacy app is
   **camelCase** (`projectName`). The portal data layer must map between them consistently.
3. **`project_id` foreign keys.** Most entities hang off `project`; confirm FKs + indexes
   exist before wiring child tables.
4. There's a debug commit in middleware in this repo's history (flagged in the consolidation
   analysis) — clean it out before serious merge work.

## Port sequencing (by entity-graph depth, not page count)
- **Wave 0 (done, read-only):** project, milestone, risk, action_item, budget_tracking,
  schedule_activity, neuron, synapse, agent_conversation.
- **Wave 1 (do now — shallow, tables exist, add read+write):** ActionTracker stack
  (action_item/bucket/phase/checklist/comment), RiskRegister (risk), BudgetDashboard
  (budget_tracking), ScheduleMonitoring (schedule_activity), QA/QC (qa_record, quality_gate,
  non_conformity), governance ticks (gate_checklist_state).
- **Wave 2:** ChangeManagement, Reports (weekly/daily), SiteSelection, FeasibilityStudy,
  NewProject write path.
- **Wave 3 (deep graphs):** Finance/NPV (15 entities), Schedule sync (8), Brainiac advanced (2).
- **Auth:** fold legacy `UserAccess` (PlatformUser/Role, Organization, AuditLog) into Supabase
  auth + RLS; this gates safe writes.

## First concrete tasks (Wave 1)
1. **RLS pass** on the Wave 1 tables: add policies scoped to the signed-in user's org/project.
2. **ActionTracker page** — build the full page over `action_item` (+ `action_bucket`,
   `action_phase`, and `action_checklist`/`action_comment` in the detail panel). Enable
   create/update/delete. Reference legacy `src/pages/ActionTracker.jsx` +
   `components/actiontracker/*` for behavior.
3. **RiskRegister page** — dedicated page over `risk` with write path (legacy
   `src/pages/RiskRegister.jsx`).
4. **BudgetDashboard** — enable writes over `budget_tracking` (legacy
   `src/pages/BudgetDashboard.jsx`).
5. **ScheduleMonitoring** — writes over `schedule_activity` (legacy
   `src/pages/ScheduleMonitoring.jsx`).

For each page: confirm the Supabase table's columns, wire the data layer with snake_case↔
camelCase mapping, port the UI from the cited legacy file, then enable writes **after** the
RLS policy for that table is in place.

## Reference map
- **Full per-entity spec:** `project-governance-hub/docs/entity-migration-backlog.md`
  (entity → table → owning page → consumers → wave).
- **Legacy source of behavior:** `project-governance-hub/src/pages/*` and
  `project-governance-hub/src/components/*` — the unported pages ARE the spec.

## Naming note
The portal is branded "Project Governance Hub" internally but the repo is
`buildmind-pmo-portal`. Pick one canonical name post-consolidation to avoid confusion.
