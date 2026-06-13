# Entity Migration Backlog — Base44 → Supabase (portal)

**Source of truth for the port.** This repo (`project-governance-hub`) is the legacy
Base44 app being replaced by `buildmind-pmo-portal` (Next.js + Supabase). The strategic
goal is **full independence from Base44**. This document maps every Base44 entity in the
legacy app to its target Supabase table, the page that owns it, and the wave in which it
should be ported.

> Generated from the legacy source: `grep` of `*.entities.X` across `src/`. ~54 distinct
> entities across 23 pages / 13 component domains.

## Key finding
The portal's Supabase project **already contains snake_case tables for almost every entity**
(visible in the Supabase Table Editor: `action_bucket`, `bom_assumptions`, `capex_plan`,
`change_approval`, `daily_site_report`, `finance_model`, …). But the portal app currently
only *queries* 9 of them. **So the remaining work is mostly wiring pages + write paths + RLS
— not creating schema.**

> ⚠️ Column convention: portal tables are **snake_case** (`project_name`), while the legacy
> Base44 app uses **camelCase** (`projectName`). The portal data layer must map between them
> consistently when wiring each page.

## Status legend
- ✅ **ported** — already read in the portal today (one of its 9 queried tables)
- 🟢 **schema-exists** — table present in Supabase; needs the portal page wired to it
- 🆕 **new** — confirm/create table before wiring
- 🔐 **auth** — superseded by Supabase auth/RLS, not a straight table port

---

## Wave 0 — Already ported (read-only) ✅
These render in the portal today; remaining work is enabling **writes**.

| Entity | Table | Owning page | Notes |
|---|---|---|---|
| Project | `project` | ProjectDashboard / Home | core; write path = NewProject (Wave 2) |
| Milestone | `milestone` | ProjectDashboard | inline on dashboard |
| Risk | `risk` | RiskRegister | read inline; dedicated page = Wave 1 |
| ActionItem | `action_item` | ActionTracker | read inline; full page = Wave 1 |
| BudgetTracking | `budget_tracking` | BudgetDashboard | read inline; dedicated page = Wave 1 |
| ScheduleActivity | `schedule_activity` | ScheduleMonitoring | queried by portal |
| Neuron | `neuron` | Brainiac | canvas works |
| Synapse | `synapse` | Brainiac | canvas works |
| AgentConversation | `agent_conversation` | PMOAgent | agent itself is Wave 3 |

---

## Wave 1 — Shallow pages, tables exist, add read+write 🟢
Quick wins: dedicated pages over entities whose tables already exist.

| Entity | Table | Owning page | Consumers | Status |
|---|---|---|---|---|
| ActionItem (write) | `action_item` | ActionTracker | ActionTracker, ItemDetailPanel, MyTasksView, NewItemDialog | 🟢 |
| ActionBucket | `action_bucket` | ActionTracker | ActionTracker | 🟢 |
| ActionPhase | `action_phase` | ActionTracker | ActionTracker | 🟢 |
| ActionChecklist | `action_checklist` | ActionTracker → ItemDetailPanel | ItemDetailPanel | 🟢 |
| ActionComment | `action_comment` | ActionTracker → ItemDetailPanel | ItemDetailPanel | 🟢 |
| Risk (write) | `risk` | RiskRegister | RiskRegister, PortfolioDashboard | ✅→write |
| BudgetTracking (write) | `budget_tracking` | BudgetDashboard | BudgetDashboard, Home | ✅→write |
| ScheduleActivity (write) | `schedule_activity` | ScheduleMonitoring | ScheduleDashboard, ScheduleSync | ✅→write |
| GateChecklistState | `gate_checklist_state` | ProcessLibrary | ProcessLibrary | 🟢 governance ticks |
| QARecord | `qa_record` | QAQCDashboard | QAQCDashboard, Home | 🟢 |
| QualityGate | `quality_gate` | FEEDTracker / FeasibilityStudy | QualityGateTimeline, ExportPdfButton | 🟢 |
| NonConformity | `non_conformity` | QAQCDashboard | QAQCDashboard, ProcessLibrary, Home | 🟢 |

---

## Wave 2 — Medium domains + write paths 🟢/🆕

| Entity | Table | Owning page | Consumers | Status |
|---|---|---|---|---|
| ChangeRequest | `change_request` | ChangeManagement | ChangeManagement, ExportPdfButton, ProcessLibrary | 🟢 |
| ChangeApproval | `change_approval` | ChangeManagement | ChangeManagement | 🟢 |
| ChangeImpactAssessment | `change_impact_assessment` | ChangeManagement | ChangeManagement | 🟢 |
| WeeklyReport | `weekly_report` | WeeklyReports / Reports | WeeklyReportEditor/View/ReadOnly, ReportArchive | 🆕 |
| DailySiteReport | `daily_site_report` | Reports | DailySiteReportView, ReportArchive | 🟢 |
| CandidateSite | `candidate_site` | SiteSelection | SiteScoringView, SiteQuestionnaireView | 🟢 |
| SiteAssessment | `site_assessment` | SiteSelection | SiteScoringView | 🆕 |
| SiteCriteria | `site_criteria` | SiteSelection | SiteQuestionnaireView | 🆕 |
| FeasibilityStudy | `feasibility_study` | FeasibilityStudy | FeasibilityStudy | 🟢 |
| Project (write) | `project` | NewProject | NewProject | ✅→write |

---

## Wave 3 — Deep entity graphs (largest effort) 🟢/🆕

### Finance / NPV — FinanceModel + NPVCalculator (15 entities)
The deepest stack: one `FinanceModel` fans out to ~13 assumption tables + scenarios.

| Entity | Table | Owning page |
|---|---|---|
| FinanceModel | `finance_model` | FinanceModel (ModelSetupTab) |
| CellConfig | `cell_config` | FinanceModel (ModelSetupTab) |
| CapexPlan | `capex_plan` | FinanceModel (CapexTab) |
| HeadcountPlan | `headcount_plan` | FinanceModel (HeadcountTab) |
| BOMAssumptions | `bom_assumptions` | FinanceModel (BOMTab) |
| RevenueAssumptions | `revenue_assumptions` | FinanceModel (RevenueTab) |
| DCFAssumptions | `dcf_assumptions` | FinanceModel (AssumptionsTab) |
| FinancingAssumptions | `financing_assumptions` | FinanceModel (AssumptionsTab) |
| GrantAssumptions | `grant_assumptions` | FinanceModel (AssumptionsTab) |
| OtherOpexAssumptions | `other_opex_assumptions` | FinanceModel (AssumptionsTab) |
| OverheadAssumptions | `overhead_assumptions` | FinanceModel (AssumptionsTab) |
| TaxAssumptions | `tax_assumptions` | FinanceModel (AssumptionsTab) |
| UtilityAssumptions | `utility_assumptions` | FinanceModel (AssumptionsTab) |
| WorkingCapitalAssumptions | `working_capital_assumptions` | FinanceModel (AssumptionsTab) |
| NPVScenario | `npv_scenario` | NPVCalculator |

### Schedule sync — ScheduleSync / ScheduleDashboard (8 entities)
| Entity | Table | Owning page |
|---|---|---|
| ScheduleVersion | `schedule_version` | ScheduleSync |
| ScheduleDelta | `schedule_delta` | ScheduleSync (DeltaTab) |
| ScheduleSource | `schedule_source` | ScheduleSync (RegisterSourceModal) |
| ScheduleTask | `schedule_task` | ScheduleSync |
| WBSMapping | `wbs_mapping` | ScheduleSync (WBSMappingTab) |
| ScheduleRisk | `schedule_risk` | ScheduleDashboard (MonteCarloTab) |
| SCurveComment | `s_curve_comment` | ScheduleDashboard (SCurveComments) |

### Brainiac advanced — Brainiac (2 entities)
| Entity | Table | Owning page |
|---|---|---|
| SynapseVersion | `synapse_version` | Brainiac (SynapseConfigurator) |
| ProcessingRule | `processing_rule` | Brainiac (SynapseConfigurator) |

### Agent — PMOAgent
| Entity | Table | Owning page |
|---|---|---|
| AgentConversation (write) | `agent_conversation` | PMOAgent | (Wave-3 agent on Claude) |

---

## Auth / Access — replaced by Supabase auth 🔐
Not straight ports. The legacy `UserAccess` page is superseded by Supabase email+password auth.

| Entity | Maps to | Notes |
|---|---|---|
| PlatformUser | Supabase `auth.users` + `profiles` | identity handled by Supabase auth |
| PlatformRole | `roles` / RLS policies | encode roles as RLS, not app data |
| Organization | `organization` | tenant table; drives RLS scoping |
| AuditLog | `audit_log` | keep as table; write via triggers/server |

---

## Recommended sequencing rationale
1. **Wave 1 first** — dedicated pages whose tables already exist (action stack, risk, budget,
   schedule monitoring, QA/QC, governance ticks). Fastest visible progress, low risk.
2. **Wave 2** — medium domains and the first real **write paths** (change, reports, site,
   feasibility, NewProject).
3. **Wave 3** — the deep graphs (finance/NPV 15 entities, schedule sync 8). Highest effort;
   tackle once write patterns + RLS are proven on shallower domains.
4. **Auth** — fold `UserAccess` into Supabase auth + RLS in parallel; it gates safe writes.

## Cross-cutting before writes
- **Tighten RLS** — current policies read "any authenticated user sees everything." Scope by
  `organization` / project membership before enabling writes.
- **Column casing** — portal tables are snake_case; ensure the portal data layer maps
  app camelCase ↔ db snake_case consistently.
- **`project_id` foreign keys** — most entities hang off `project`; confirm FKs + indexes.

## Count summary
- Total entities: **~54**
- Wave 0 (ported, read-only): 9
- Wave 1 (shallow, write): 12
- Wave 2 (medium + writes): 10
- Wave 3 (deep graphs): 25 (finance 15, schedule 8, brainiac 2)
- Auth/access: 4 (handled via Supabase auth)
