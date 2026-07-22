// Shared org_id resolution config for tenant-scoped entities.
// Used by maintainOrgId (backfill/safety-net) and stampOrgIdOnCreate (real-time on create).
// Order matters for backfill: parents are stamped before their children within a single run.

export const ORG_ID_ENTITIES = [
  { name: "FinanceModel", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },

  { name: "Risk", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "Milestone", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "BudgetTracking", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ScheduleActivity", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "QARecord", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "NonConformity", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "SwotItem", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "Workflow", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "QualityGate", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ProjectCharter", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "Requirement", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "Stakeholder", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ChangeWorkflow", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ChangeRequest", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "WbsElement", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "RaciAssignment", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "RaidItem", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "CommunicationPlan", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ScheduleTask", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ScheduleVersion", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ScheduleSource", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ScheduleDelta", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "WeeklyReport", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "DailySiteReport", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ActionItem", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ActionBucket", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "ActionPhase", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "FEEDItem", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "FeasibilityStudy", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "SiteAssessment", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "NPVScenario", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "WBSMapping", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },
  { name: "WeeklyReportSectionConfig", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },

  { name: "SCurveComment", parentEntity: "Project", parentField: "project", parentOrgField: "org_id" },
  { name: "ScheduleRisk", parentEntity: "Project", parentField: "project", parentOrgField: "org_id" },

  { name: "CapexPlan", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "BOMAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "CellConfig", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "DCFAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "FinancingAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "GrantAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "HeadcountPlan", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "LogisticsAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "OtherOpexAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "OverheadAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "RevenueAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "ScrapAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "TaxAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "UtilityAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },
  { name: "WorkingCapitalAssumptions", parentEntity: "FinanceModel", parentField: "financeModelId", parentOrgField: "org_id" },

  { name: "CandidateSite", parentEntity: "SiteAssessment", parentField: "assessmentId", parentOrgField: "org_id" },
  { name: "SiteCriteria", parentEntity: "CandidateSite", parentField: "siteId", parentOrgField: "org_id" },

  // Grandchildren of Project (parent = ActionItem, itself child of Project)
  { name: "ActionChecklist", parentEntity: "ActionItem", parentField: "actionItemId", parentOrgField: "org_id" },
  { name: "ActionComment", parentEntity: "ActionItem", parentField: "actionItemId", parentOrgField: "org_id" },

  // Grandchildren of Project (parent = ChangeRequest, itself child of Project)
  { name: "ChangeApproval", parentEntity: "ChangeRequest", parentField: "crId", parentOrgField: "org_id" },
  { name: "ChangeImpactAssessment", parentEntity: "ChangeRequest", parentField: "crId", parentOrgField: "org_id" },
];

export function getConfig(entityName) {
  return ORG_ID_ENTITIES.find((c) => c.name === entityName);
}