# Wave-1 verified field spec (from legacy source)

Authoritative entity/field shapes extracted from the legacy Base44 source, for the portal port.
All columns are **camelCase**; children link by **string id** (see linkage rules below). Extend
this doc per entity as each Wave-1 page is ported.

## ActionTracker stack

### Linkage (for RLS + queries)
- `action_item.projectId` = `project.id` (string / `base44_id` in portal) — **direct**
- `action_bucket.projectId` = `project.id` — direct
- `action_phase.projectId` = `project.id` — direct
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
