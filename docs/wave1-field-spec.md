# Wave-1 verified field spec (from legacy source)

Authoritative entity/field shapes extracted from the legacy Base44 source, for the portal port.
All columns are **camelCase**; children link by **string id** (see universal rule below). Extend
this doc per entity as each Wave-1 page is ported.

## ⚠️ UNIVERSAL LINKAGE RULE (read first — applies to EVERY entity)
In the legacy app this is **uniform — there is no per-table variation**. For every child entity:

```
child.projectId === Project.id === searchParams.get('id') === portal `base44_id` (string)
```

The legacy `Project.id` is the **Base44 string id**, which the portal stores in the
**`base44_id`** column — **NOT** the portal's own UUID primary key (`project.id` in the portal).
So every page must: query children by `projectId = <base44_id from the ?id= URL param>`, and write
`projectId = base44_id`. Keep this **consistent across all pages** (ActionTracker, Risk, Budget,
Schedule, …). Do **not** switch any single table to the portal UUID — mixing conventions silently
breaks queries against Base44-imported rows. (Migrating to UUID FKs, if ever, must be done for all
tables at once, deliberately.)

## ActionTracker stack

### Linkage (for RLS + queries)
- `action_item.projectId` = `project.base44_id` (string) — **direct**
- `action_bucket.projectId` = `project.base44_id` — direct
- `action_phase.projectId` = `project.base44_id` — direct
- `action_checklist.actionItemId` = `action_item.id` — **2-hop** to project via `action_item`
- `action_comment.actionItemId` = `action_item.id` — **2-hop** to project via `action_item`

### `action_item`
Columns: `projectId`, `itemKey` (e.g. `PR-001`), `itemType`, `title`, `description`,
`priority`, `status`, `assignee`, `dueDate`, `bucket`, `phase`, `completedDate`, `archived`.

> ⚠️ Field is **`itemType`**, not `type`. And **`status` is type-dependent** — not a flat enum.

- **`itemType` values (7):** `Action`, `Issue`, `Decision`, `RFI`, `Punch List`,
  `Deliverable`, `Risk Action`.
- **`priority` values (4):** `P1 - Critical`, `P2 - High`, `P3 - Medium`, `P4 - Low`
  (default `P3 - Medium`).
- **`status` by `itemType`** (`STATUS_BY_TYPE`):
  | itemType | statuses | default on create |
  |---|---|---|
  | Action | To Do, In Progress, In Review, Done, Blocked, Won't Do | To Do |
  | Issue | Open, Under Investigation, Solution Proposed, Implementing, Resolved, Closed, Escalated | Open |
  | Decision | Pending, Under Discussion, Decision Made, Communicated, Deferred | Pending |
  | RFI | Draft, Submitted, Response Received, Closed, Overdue | Draft |
  | Punch List | Identified, Assigned, In Rectification, Reinspection, Closed, Accepted As-Is | Identified |
  | Deliverable | Not Started, In Progress, Draft Complete, Under Review, Approved, Submitted | Not Started |
  | Risk Action | Planned, In Progress, Complete, Verified Effective, Ineffective | Planned |
- **New-item create** sets: `...form, projectId, itemKey: nextKey, status: DEFAULT_STATUS[itemType]`.
  Form fields: `itemType` (default `Action`), `priority`, `title`, `assignee`, `description`,
  `bucket`, `phase`, `dueDate`.

### `action_bucket`
Columns: `projectId`, `bucketName`, `bucketColor` (hex), `sortOrder` (int). Query order: `sortOrder`.

`DEFAULT_BUCKETS` (auto-setup seed, 10, verbatim): Product Development `#8b5cf6` · Process
Engineering `#3b82f6` · Procurement `#f97316` · Building & Construction `#10b981` · MEP &
Utilities `#06b6d4` · Commissioning `#1e3a8a` · Regulatory & Permits `#ef4444` · Commercial &
Finance `#eab308` · Project Management `#6b7280` · Quality & Testing `#ec4899` (sortOrder 1–10).

### `action_phase`
Columns: `projectId`, `phaseName`, `startDate` (YYYY-MM-DD), `endDate`, `phaseType`
(e.g. `Gate Phase`), `status` (Complete/Active/Planning/…), `goal`. Query order: `startDate`.
`DEFAULT_PHASES` = the 7 Pre-Gate-0 → Gate-6 phases (see legacy `ActionTracker.jsx`).

### `action_checklist`
Columns: `actionItemId`, `checklistText`, `isChecked` (bool), `sortOrder`. Query order: `sortOrder`.
Writes: create `{ actionItemId, checklistText, isChecked: false, sortOrder: <len> }`;
update `{ isChecked }`.

### `action_comment`
Columns: `actionItemId`, `author`, `commentText`, `commentType` (default `Comment`),
`created_date`. Query order: `created_date`.
Writes: create `{ actionItemId, author, commentText, commentType: 'Comment' }`.

## RiskRegister (`risk`)

Single-file page (`src/pages/RiskRegister.jsx`); no sub-components.

### Linkage
- `risk.projectId` = `project.base44_id` (string) — **direct**, same as the action stack.
  (Do NOT use the portal UUID — see universal linkage rule.)

### `risk` columns (camelCase)
`projectId`, `riskDescription`, `category`, `probability` (int **1–3**), `impact` (int **1–3**),
`riskScore` (int, **computed**), `riskLevel` (string, **computed**), `mitigationPlan`, `owner`,
`targetClosureDate`, `status`.

> ⚠️ Description column is **`riskDescription`** (not `title`/`description`).
> probability/impact are a **1–3** scale, not 1–5.

### Enums
- **`category` (6):** `Technical`, `Financial`, `Schedule`, `Regulatory`, `Environmental`, `Safety`.
- **`status` (4):** `Open`, `In Progress`, `Mitigated`, `Closed` (default **`Open`** on create).
- **`riskLevel` (4, derived):** `Critical`, `High`, `Medium`, `Low`.

### Computed on create (server-side, not user-entered)
```
riskScore = probability * impact            // 1..9
riskLevel = riskScore >= 6 ? 'Critical'
          : riskScore >= 4 ? 'High'
          : riskScore >= 2 ? 'Medium'
          : 'Low'
status    = 'Open'
```

### Create form (`newRisk`) initial state
`riskDescription:''`, `category:'Technical'`, `probability:2`, `impact:2`, `mitigationPlan:''`,
`owner:''`, `targetClosureDate:''`.

### Page UI structure (single page, card list — no table, no sub-components)
- **Header:** `Risk Register` h1 + "Add Risk" button opening a dialog.
- **Add dialog fields (in order):** Risk Description* (textarea) · Category (select) · Owner (input)
  · Probability (1-3) select · Impact (1-3) select · Mitigation Plan · Target Closure Date.
  Probability/Impact selects show labels `Low (1)`, `Medium (2)`, `High (3)` (value = int).
- **Stats cards (4, `grid-cols-2 sm:grid-cols-4`):** Total Risks, Critical (count of
  `riskLevel==='Critical'`), High, Open. Derived from the loaded rows.
- **Filters (3, all default `all`):** Status, Category, Level (`riskLevel`). Pure client-side
  filtering over the fetched list.
- **List:** `filteredRisks.map(...)` → one card per risk showing `riskScore`, a `riskLevel`
  badge (color: Critical=red, High=orange, Medium=yellow, Low=green), description, category,
  owner, status, target date.
- **Query:** `Risk.filter({ projectId })` (no explicit sort).

## BudgetDashboard (`budget_tracking`)

Single-file page (`src/pages/BudgetDashboard.jsx`); no sub-components.

### Linkage
- `budget_tracking.projectId` = `project.base44_id` (string) — **direct** (see universal rule).

### `budget_tracking` columns (camelCase)
`projectId`, `month`, `category`, `plannedEurK` (float), `actualEurK` (float),
`varianceEurK` (**computed**), `variancePercent` (**computed**), `varianceStatus` (**computed**).
Query order: `-month` (descending).

> ⚠️ The legacy columns are **`plannedEurK` / `actualEurK`** (verified: 0 refs to
> `budgetedAmount`/`actualAmount` anywhere in the legacy source — those are NOT legacy fields).
> Standardize the dashboard inline query + the BudgetDashboard page on `plannedEurK`/`actualEurK`.

### Enums
- **`category` (7):** `Engineering`, `Equipment`, `Construction`, `Procurement`, `PMO`,
  `Contingency`, `Other` (default `Engineering`).
- **`varianceStatus` (3, derived):** `On Track`, `Over Budget`, `Under Budget`.

### Computed on create (server-side, not user-entered)
```
varianceEurK    = (actualEurK || 0) - plannedEurK
variancePercent = plannedEurK > 0 ? (varianceEurK / plannedEurK) * 100 : 0
varianceStatus  = variancePercent > 10  ? 'Over Budget'
                : variancePercent < -10 ? 'Under Budget'
                : 'On Track'
```
On submit, `plannedEurK`/`actualEurK` are parsed to float (`actualEurK` defaults 0 if blank).

### Create form initial state
`month:''`, `category:'Engineering'`, `plannedEurK:''`, `actualEurK:''`.

### UI
Header + Add Entry dialog (Month, Category, Planned €K, Actual €K). Totals row:
`totalPlanned`/`totalActual` summed from rows. List per entry shows `€{actualEurK}K / €{plannedEurK}K`
and a `varianceStatus` label colored red (Over) / green (Under) / muted (On Track).

## ScheduleMonitoring (`schedule_activity`)

Single-file page (`src/pages/ScheduleMonitoring.jsx`); no sub-components.

### Linkage
- `schedule_activity.projectId` = `project.base44_id` (string) — **direct** (see universal rule).

### `schedule_activity` columns (camelCase)
`projectId`, `activityId`, `activityName`, `wbsCode`, `plannedStartDate`, `plannedFinishDate`,
`actualStartDate`, `percentComplete` (int 0–100), `status`, `isCriticalPath` (bool), `duration`,
`responsible`, `notes`. Query order: `plannedStartDate`.

> Note: form field is `plannedFinishDate`; there is no `actualFinishDate` in the create form.

### Enums
- **`status` (4):** `Not Started`, `In Progress`, `Completed`, `On Hold` (default `Not Started`).

### Create form initial state
`activityId:''`, `activityName:''`, `wbsCode:''`, `plannedStartDate:''`, `plannedFinishDate:''`,
`actualStartDate:''`, `percentComplete:0`, `status:'Not Started'`, `isCriticalPath:false`,
`duration:''`, `responsible:''`, `notes:''`. Create writes `{ ...data, projectId }` (no derived fields).

### UI
Header + Add Activity dialog; status filter (`all` + the 4 statuses); list/table of activities
showing name, WBS, planned/actual dates, `percentComplete`, status, critical-path flag.
