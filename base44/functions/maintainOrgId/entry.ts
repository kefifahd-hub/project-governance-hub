import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

// Tenant-scoped entity → how to resolve its org_id from a parent.
// Order matters: parents are stamped before their children within a single run.
const ENTITY_CONFIGS = [
  // Root-ish: FinanceModel must be resolved before financeModelId-based entities.
  { name: "FinanceModel", parentEntity: "Project", parentField: "projectId", parentOrgField: "org_id" },

  // projectId-based entities (parent = Project)
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

  // SCurveComment / ScheduleRisk use a "project" field (not "projectId")
  { name: "SCurveComment", parentEntity: "Project", parentField: "project", parentOrgField: "org_id" },
  { name: "ScheduleRisk", parentEntity: "Project", parentField: "project", parentOrgField: "org_id" },

  // financeModelId-based entities (parent = FinanceModel, resolved above)
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

  // Site chain: CandidateSite ← SiteAssessment (stamped above) ; SiteCriteria ← CandidateSite
  { name: "CandidateSite", parentEntity: "SiteAssessment", parentField: "assessmentId", parentOrgField: "org_id" },
  { name: "SiteCriteria", parentEntity: "CandidateSite", parentField: "siteId", parentOrgField: "org_id" },
];

const CHUNK = 500;

async function findMissing(base44, entityName) {
  // Match records whose org_id is missing, null, or empty string.
  const byNull = await base44.asServiceRole.entities[entityName].filter({ org_id: null });
  const byEmpty = await base44.asServiceRole.entities[entityName].filter({ org_id: "" });
  const seen = new Set();
  const merged = [];
  for (const r of [...byNull, ...byEmpty]) {
    if (!seen.has(r.id)) { seen.add(r.id); merged.push(r); }
  }
  return merged;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Maintenance job — block direct non-admin invocation; allow scheduled/service invocations.
    const user = await base44.auth.me();
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const report = {};

    // Diagnostic: Project is the root org source — flag any projects still missing org_id
    // (these cannot be auto-stamped and must be assigned manually/admin-side).
    const projectsMissing = await base44.asServiceRole.entities.Project.filter({ org_id: null });
    report._projectsMissingOrgId = projectsMissing.length;

    for (const cfg of ENTITY_CONFIGS) {
      const records = await findMissing(base44, cfg.name);
      if (records.length === 0) { report[cfg.name] = 0; continue; }

      // Group records by their parent id, then resolve each parent's org_id once.
      const byParent = {};
      const noParentRef = [];
      for (const r of records) {
        const pid = r[cfg.parentField];
        if (!pid) { noParentRef.push(r.id); continue; }
        (byParent[pid] = byParent[pid] || []).push(r);
      }

      let stamped = 0;
      let skippedNoParentOrg = 0;
      for (const pid of Object.keys(byParent)) {
        const parent = await base44.asServiceRole.entities[cfg.parentEntity].get(pid).catch(() => null);
        const parentOrg = parent ? parent[cfg.parentOrgField] : null;
        if (!parentOrg) { skippedNoParentOrg += byParent[pid].length; continue; }
        // updateMany with $set bypasses full-record schema validation (old records may
        // predate required fields), and groups share one org_id per parent.
        const ids = byParent[pid].map((r) => r.id);
        for (let i = 0; i < ids.length; i += CHUNK) {
          await base44.asServiceRole.entities[cfg.name].updateMany(
            { id: { $in: ids.slice(i, i + CHUNK) } },
            { $set: { org_id: parentOrg } }
          );
        }
        stamped += ids.length;
      }

      report[cfg.name] = {
        missing: records.length,
        stamped: stamped,
        skippedNoParentOrg: skippedNoParentOrg,
        noParentRef: noParentRef.length,
      };
    }

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});