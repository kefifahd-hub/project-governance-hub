# Wave-2 field spec (from legacy source)

Pre-staged for the portal port, same method as `wave1-field-spec.md`. **Read the universal
linkage rule in the Wave-1 doc first** — it applies here too (`child.projectId = project.base44_id`).
Wave 2 adds **deeper linkage chains** (2-hop and 3-hop) — get these right before writing RLS.

## ⚠️ Wave-2 linkage map (the part inference gets wrong)
| Entity | Links by | Hops to project |
|---|---|---|
| `change_request` | `projectId` = project.base44_id | direct |
| `change_impact_assessment` | **`crId`** = change_request.id | **2-hop** via change_request |
| `change_approval` | **`crId`** = change_request.id | **2-hop** via change_request |
| `weekly_report` | `projectId` | direct |
| `daily_site_report` | `projectId` | direct |
| `feasibility_study` | `projectId` | direct |
| `site_assessment` | `projectId` | direct |
| `candidate_site` | **`assessmentId`** = site_assessment.id | **2-hop** via site_assessment |
| `site_criteria` | **`siteId`** = candidate_site.id | **3-hop** (candidate_site → site_assessment → project) |
| `project` | — (root) | NewProject write path — see below |

RLS for the 2-hop change tables resolves org via `crId → change_request.projectId → project.organization`;
`site_criteria` needs the full 3-hop subquery. Don't try to scope these on `projectId` (they don't have it).

## NewProject → `project` write path (Wave-2 task: enable create)
`Project.create(formData)`. Form fields + defaults:
`projectName`, `clientName`, `projectType` (`Battery Gigafactory`|`Data Center`|`Other`, default
`Battery Gigafactory`), `currentPhase` (default `Feasibility`; options: Feasibility, Pre-FEED, FEED,
Investment Decision, Project Setup, Detailed Engineering, Procurement, Construction, Commissioning,
SOP), `status` (default `Active`), `projectOwner`, `totalBudgetEurM`, `startDate`, `targetCompletion`,
`healthScore` (default `75`), `notes`.

> 🔑 **Critical for RLS:** the create path must also stamp **`organization`** (from the creating
> user's `profiles.organization`) and assign a **`base44_id`** (new unique string) — otherwise the
> new project is invisible under the org RLS and its children have nothing to link to. NewProject is
> the one place where `organization` gets set on new rows; wire it carefully.

## WeeklyReports → `weekly_report` (direct `projectId`, order `-weekEnding`)
Columns: `projectId`, `weekEnding`, `highlights`, `concerns`, `nextWeek`, `overallStatus`, `status`,
`publishedAt`.
- **`overallStatus` (3):** `Green`, `Yellow`, `Red` (default `Green`).
- **`status` (3):** `Draft`, `Under Review`, `Published`.
- **Status transitions** (update calls): Publish → `{ status:'Published', publishedAt: now }`;
  Submit → `{ status:'Under Review' }`; Unpublish → `{ status:'Draft', publishedAt: null }`.
- Create form: `weekEnding:''`, `highlights:''`, `concerns:''`, `nextWeek:''`, `overallStatus:'Green'`.
- Related components: `WeeklyReportEditor/ReadOnly/View`, `WeeklyAutoSections`, `ReportArchive`,
  `ExportPdfButton`, `SectionConfigModal`. Daily reports render in `DailySiteReportView` (below).

## FeasibilityStudy → `feasibility_study` (direct `projectId`, order `-created_date`)
All user-entered (no computed). Columns/form:
`projectId`, `studyName`, `studyDate`, `studyMaturity`, `studyVersion` (default `v1.0`), `studyOwner`,
`executiveSummary`, `capexEurM`, `annualOpexEurM`, `annualRevenueEurM`, `npvEurM`, `irrPercent`,
`paybackYears`, `feasibilityScore` (0–100), `recommendation`, `conditionsRemarks`, `approvalStatus`.
- **`studyMaturity` (3):** `Preliminary` (default), `Detailed`, `Executive`.
- **`recommendation` (4):** `Proceed` (default), `Proceed with Conditions`, `Further Study Required`,
  `Do Not Proceed`.
- **`approvalStatus` (4):** `Draft` (default), `Under Review`, `Approved`, `Rejected`.

## SiteSelection chain (3 entities — weighted scoring model)
- **`site_assessment`** (direct `projectId`): `projectId`, `assessmentName`, `assessmentOwner`,
  `assessmentDate` (set to `new Date()` on create), `categoryWeights` (**JSON string** of per-category
  weights, updated via `update(id, { categoryWeights: JSON.stringify(weights) })`).
  Create form: `{ assessmentName:'', assessmentOwner:'' }` + `projectId` + `assessmentDate`.
- **`candidate_site`** (2-hop via `assessmentId`): `assessmentId`, `siteName`, `status`
  (e.g. `Active Candidate`), `location`. First site auto-created as `{ assessmentId, siteName:'Site 1',
  status:'Active Candidate' }`.
- **`site_criteria`** (3-hop via `siteId`): `siteId`, `category`, `field`, `score`, `weight`, … one row
  per criterion per site; updated cell-wise via `update(id, { [field]: value })`.
- **Scoring model** is defined in `src/components/siteselection/criteriaDefinitions.jsx` (categories +
  criteria + weights) and rendered by `SiteScoringView` / `SiteComparisonView` / `SiteQuestionnaireView`.
  ⚠️ **Needs a focused extraction at build time** — the category/criteria taxonomy and weight math are
  too detailed to inline here reliably.

## ChangeManagement chain (3 entities + approval authority matrix)
- **`change_request`** (direct `projectId`): `crNumber` auto = `CR-{count padded to 3}` (e.g. `CR-001`).
  **`status`** values seen: `Draft`, `Submitted`, `Pending Approval`, `Approved`,
  `Approved with Conditions`, `Rejected`, `Withdrawn`, `Closed`, `Implemented`. **`priority`** includes
  `Critical`. Full form field set (title/description/changeType/requestedBy/justification/cost+schedule
  impact) ⚠️ **needs build-time extraction** (multi-view form, not a simple useState block).
- **`change_impact_assessment`** (2-hop via `crId`): upsert per CR (`filter({crId})` → update existing
  else create). Field set ⚠️ build-time.
- **`change_approval`** (2-hop via `crId`): `filter({ crId })`. Field set ⚠️ build-time.
- **Approval authority matrix** (drives required approver by cost impact, for UI + validation):
  L1 Project Manager ≤ $50K · L2 Project Director $50K–$250K · L3 CFO $250K–$1M ·
  L4 CEO $1M–$5M · L5 Board/Investor > $5M.

## DailySiteReport → `daily_site_report` (direct `projectId`, order `-reportDate`)
Rendered in `src/components/reports/DailySiteReportView.jsx`. **Heavy entity with JSON sub-arrays.**
- Scalars: `projectId`, `reportDate`, `preparedBy`, `contractor`.
- **Weather as individual boolean columns:** `weatherSunny`, `weatherCloudy`, `weatherRainy`,
  `weatherSnow`, `weatherFrost`, `weatherLightning`; plus `tempMinC`, `tempMaxC`, `windSpeedMaxMs`,
  `weatherImpactOnWork` (bool), `weatherImpactDescription`.
- **JSON-string columns:** `manpowerEntries` (array of `{workforce_count, worked_hours, …}`),
  equipment entries, and events — each `JSON.stringify`'d on save.
- **Computed-and-stored on save:** `totalWorkers` = Σ workforce_count, `totalHours` = Σ worked_hours
  (derived from `manpowerEntries`, then persisted).
- ⚠️ Confirm the exact equipment/events column names at build time (they parse from
  `report?.<col> || '[]'`).

---
### Status of this spec
Confident & complete: linkage map, NewProject/Project, WeeklyReport, FeasibilityStudy, SiteAssessment,
the Site chain linkage, DailySiteReport structure. **Flagged for build-time extraction** (too detailed
to pre-stage reliably): ChangeRequest/Impact/Approval full forms, SiteCriteria scoring taxonomy, and
DailySiteReport's equipment/events column names.
