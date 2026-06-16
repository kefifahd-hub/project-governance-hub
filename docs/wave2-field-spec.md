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
- **`site_criteria`** (3-hop via `siteId`): one row per criterion per site; updated cell-wise via
  `update(id, { [field]: value })`. Holds the per-criterion answer/score keyed by criterion (e.g.
  `1.1`, `2.5`). `site_assessment.categoryWeights` (JSON) holds the editable per-category weights.

### Scoring taxonomy (`src/components/siteselection/criteriaDefinitions.jsx`)
6 categories, **default weights sum to 100** (`DEFAULT_WEIGHTS`); each criterion is keyed
`<cat#>.<n>` with a `requirement` target. Counts:
| # | Category (`id`) | Default weight | Criteria |
|---|---|---|---|
| 1 | Ownership & Development (`ownership`) | 10 | 1.1–1.13 (13) |
| 2 | Plot Characteristics (`plot`) | 20 | 2.1–2.31 (31) |
| 3 | Utilities (`utilities`) | 20 | 3.1–3.24 (24) |
| 4 | Infrastructure & Access (`infrastructure`) | 15 | 4.1–4.17 (17) |
| 5 | Workforce & Labour Market (`workforce`) | 20 | 5.1–5.18 (18) |
| 6 | Incentives & Support (`incentives`) | 15 | 6.1–6.12 (12) |

- **"Meets requirement" values:** `Yes`, `Partial`, `No`, `N/A`, `TBD` (`MEETS_COLORS`/`MEETS_ICONS`:
  Yes ✅ green · Partial ⚠️ yellow · No ❌ red · N/A ⬜ gray · TBD ⬜ gray).
- Rendered by `SiteScoringView` / `SiteComparisonView` / `SiteQuestionnaireView`. The full criterion
  labels/requirements live in `criteriaDefinitions.jsx` — port that file as-is (it's pure data).
- Weighted score = per-category criterion scores rolled up by `categoryWeights`; replicate the rollup
  from `SiteScoringView` when building (computed in UI, not stored as a single column).

## ChangeManagement chain (components in `src/components/changemanagement/`)
Pages/components: `ChangeLogTable`, `ChangeRequestForm`, `ImpactAssessmentPanel`, `ImpactDashboard`.
CR save: create when no id (`createCRMutation`, stamps `crNumber`), else update. Impact is an
**upsert per CR** (`impacts.find(i => i.crId === data.crId)` → update existing else create).

### `change_request` (direct `projectId`)
`crNumber` auto = `CR-{count padded to 3}` (e.g. `CR-001`, count = changes.length+1).
Form columns: `projectId`, `title`, `description`, `category`, `subCategory`, `priority`
(default `Medium`), `changeType` (default `Modification`), `origin`, `raisedBy`, `raisedDate`
(default today), `requiredByDate`, `affectedModules`, `affectedWbs`, `notes`, `status` (default `Draft`).
- **`category` (9):** `Client Request`, `Design Development`, `Site Condition`,
  `Regulatory Requirement`, `Value Engineering`, `Risk Mitigation`, `Supplier / Vendor`,
  `Internal Improvement`, `Force Majeure`.
- **`subCategory`** depends on category (cascading select):
  - Client Request → `Client scope addition`, `Scope reduction`, `Scope clarification`
  - Design Development → `Equipment specification`, `Process design`, `Layout change`,
    `Material change`, `Chemistry change`
  - Value Engineering → `CAPEX increase`, `CAPEX decrease`, `OPEX change`, `Contingency draw`,
    `Value engineering`
  - Site Condition → `Acceleration`, `Delay`, `Resequencing`, `Milestone change`
  - Supplier / Vendor → `Supplier change`, `Price escalation`, `Lead time change`,
    `Specification change`
  - Risk Mitigation → `Standard upgrade`, `Test requirement change`, `Yield target change`
  - Regulatory Requirement → `Permit condition`, `Environmental requirement`, `Safety requirement`
  - Force Majeure / Internal Improvement → `Force majeure`, `Stakeholder request`, `Lessons learned`
- **`affectedModules`** options: `Finance Model`, `Master Schedule`, `Site Selection`,
  `Feasibility Study`, `Equipment`, `Building`, `Product`.
- **`status` is a workflow state machine** (the editable next-states per current status):
  `Draft → [Submitted, Withdrawn]` · `Submitted → [In Technical Review, Withdrawn]` ·
  `In Technical Review → [Technical Review Complete, Rejected]` ·
  `Technical Review Complete → [In Finance Review]` ·
  `In Finance Review → [Finance Review Complete, Rejected]` ·
  `Finance Review Complete → [In Schedule Review]` ·
  `In Schedule Review → [Schedule Review Complete, Rejected]` ·
  `Schedule Review Complete → [Pending Approval]` ·
  `Pending Approval → [Approved, Approved with Conditions, Rejected, On Hold]` ·
  `Approved → [Implementation In Progress]` · `Implementation In Progress → [Implemented]` ·
  `Implemented → [Closed]`. (Open CRs = not in Approved/Approved w/ Conditions/Rejected/Withdrawn/Closed/Implemented.)

### `change_impact_assessment` (2-hop via `crId`) — three review sections
`crId` + a `status` mirroring the workflow. Fields by section:
- **Technical:** `technicalReviewer`, `technicalReviewDate`, `technicalAssessment`,
  `technicalFeasibility` (`Feasible`|`Feasible with conditions`|`Not feasible`|`Needs further study`),
  `technicalRiskLevel` (`No risk`|`Low`|`Medium`|`High`|`Critical`), `technicalConditions`,
  `designReworkRequired` (bool), `specificationImpact`,
  `qualityImpact` (`None`|`Minor (documentation)`|`Moderate (process change)`|`Major (requalification required)`),
  `technicalRecommendation` (`Proceed`|`Proceed with conditions`|`Do not proceed`|`Needs more study`),
  `technicalSignOff`.
- **Finance:** `financeReviewer`, `financeReviewDate`, `capexImpactUsd`, `opexImpactAnnualUsd`,
  `revenueImpactAnnualUsd`, `contingencyDrawUsd`, `accelerationCostUsd` (all numeric, default 0),
  `costBreakdown`, `fundingSource` (`Existing Budget`|`Contingency`|`Additional Funding Required`|`Savings Offset`|`Client Funded`),
  `financeRecommendation` (`Acceptable`|`Acceptable with offsets`|`Not acceptable`|`Needs CEO review`),
  `financeSignOff`.
- **Schedule:** `scheduleReviewer`, `scheduleReviewDate`, `scheduleImpactDays` (0),
  `criticalPathAffected` (bool), `milestoneDateChanges`, `floatConsumedDays` (0),
  schedule recommendation (`No schedule impact`|`Acceptable delay`|`Recoverable with cost`|`Critical delay — escalate`|`Acceleration opportunity`).

### `change_approval` (2-hop via `crId`)
Read in this page via `filter({ crId })` (one-per-CR list); **no create/update in the
ChangeManagement components** — approval rows are written elsewhere or seeded. Capture the exact
write path when that flow is built. The **approval authority matrix** (drives required approver by
cost impact): L1 Project Manager ≤ $50K · L2 Project Director $50K–$250K · L3 CFO $250K–$1M ·
L4 CEO $1M–$5M · L5 Board/Investor > $5M.

## DailySiteReport → `daily_site_report` (direct `projectId`, order `-reportDate`)
Rendered in `src/components/reports/DailySiteReportView.jsx`. **Heavy entity with JSON sub-arrays.**
- **Scalars:** `projectId`, `reportDate` (default today), `preparedBy`, `contractor`, `status`
  (default `Draft`), `additionalNotes`, `reportRef` (**computed** = `DSR-{reportDate w/o dashes}`).
- **Weather (individual boolean columns):** `weatherSunny`, `weatherCloudy`, `weatherRainy`,
  `weatherSnow`, `weatherFrost`, `weatherLightning`; plus `tempMinC`, `tempMaxC`, `windSpeedMaxMs`,
  `weatherImpactOnWork` (bool), `weatherImpactDescription`.
- **JSON-string columns** (each `JSON.stringify`'d on save; parsed via `JSON.parse(report?.<col> || '[]')`).
  ⚠️ Note the inner objects use **snake_case** keys even though top-level columns are camelCase:
  - `manpowerEntries`: `[{ zone, contractor_name, activity_description, workforce_count, worked_hours, day_shift(bool) }]`
  - `equipmentEntries`: `[{ equipment_type, quantity, operational, in_repair, out_of_order }]`
  - `remarkableEvents`: `[{ event_time, zone, event_description, event_type (default 'Other'), severity (default 'Info') }]`
- **Computed-and-stored on save:** `totalWorkers` = Σ `workforce_count`, `totalHours` = Σ `worked_hours`
  (from `manpowerEntries`), plus `reportRef` (above).
- Save: `create` when new, else `update(report.id, data)`.

---
### Status of this spec
**Fully spec'd — no build-time gaps remain.** Covers: linkage map (incl. 2-hop/3-hop chains),
NewProject/Project (+ the `organization`/`base44_id` stamping), WeeklyReport (status transitions),
FeasibilityStudy (enums), the full SiteSelection chain + 6-category scoring taxonomy,
ChangeRequest (cascading category→subCategory + workflow state machine), ChangeImpactAssessment
(technical/finance/schedule sections + enums), and DailySiteReport (boolean weather cols + JSON
sub-arrays w/ snake_case inner keys + stored totals).
One residual: `change_approval`'s **write** path isn't in the ChangeManagement components (read-only
there) — capture it if/when that approval flow is built.
