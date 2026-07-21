/**
 * modules.js — single source of truth for the platform's modules (pages/tools)
 * and the permission actions that can be granted on each.
 *
 * Every place that reasons about access — the nav in Layout, the role editor in
 * the admin console, and the RequirePermission gate — reads from here so the
 * lists never drift apart.
 *
 * `page`   — the route key (matches keys in pages.config.js), used for gating.
 * `label`  — human-readable name; this is ALSO the `module` key stored inside a
 *            PlatformRole's `module_permissions` JSON, so labels must stay stable.
 * `group`  — grouping for the admin editor UI.
 * `alwaysAllowed` — core pages every authenticated user can reach (no gate).
 * `adminOnly`     — only platform admins can reach it.
 */

export const PERMISSION_ACTIONS = [
  { key: 'can_view', label: 'View' },
  { key: 'can_create', label: 'Create' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
  { key: 'can_export', label: 'Export' },
  { key: 'can_approve', label: 'Approve' },
];

export const PERMISSION_KEYS = PERMISSION_ACTIONS.map((a) => a.key);

export const MODULES = [
  // Core — always reachable once authenticated
  { page: 'Home', label: 'Home', group: 'Core', alwaysAllowed: true },
  { page: 'Settings', label: 'Settings', group: 'Core', alwaysAllowed: true },
  { page: 'NewProject', label: 'New Project', group: 'Core', alwaysAllowed: true },

  // Dashboards
  { page: 'ProjectDashboard', label: 'Project Dashboard', group: 'Dashboards' },
  { page: 'BudgetDashboard', label: 'Budget Tracking', group: 'Dashboards' },
  { page: 'QAQCDashboard', label: 'QA/QC', group: 'Dashboards' },
  { page: 'ScheduleDashboard', label: 'Schedule Dashboard', group: 'Dashboards' },

  // Tools
  { page: 'ActionTracker', label: 'Action Tracker', group: 'Tools' },
  { page: 'SiteSelection', label: 'Site Selection', group: 'Tools' },
  { page: 'FeasibilityStudy', label: 'Feasibility Study', group: 'Tools' },
  { page: 'FinanceModel', label: 'Finance Model', group: 'Tools' },
  { page: 'FEEDTracker', label: 'FEED Tracker', group: 'Tools' },
  { page: 'NPVCalculator', label: 'NPV Calculator', group: 'Tools' },
  { page: 'RiskRegister', label: 'Risk Register', group: 'Tools' },
  { page: 'ScheduleMonitoring', label: 'Schedule Monitoring', group: 'Tools' },
  { page: 'ScheduleSync', label: 'Schedule Sync', group: 'Tools' },
  { page: 'ChangeManagement', label: 'Change Management', group: 'Tools' },
  { page: 'ChangeWorkflow', label: 'Change Workflow', group: 'Tools' },
  { page: 'ProjectCharter', label: 'Project Charter', group: 'Tools' },
  { page: 'StakeholderRegister', label: 'Stakeholder Register', group: 'Tools' },
  { page: 'WBS', label: 'WBS', group: 'Tools' },
  { page: 'RaidLog', label: 'RAID Log', group: 'Tools' },
  { page: 'CommunicationPlan', label: 'Communications Plan', group: 'Tools' },
  { page: 'RaciMatrix', label: 'RACI Matrix', group: 'Tools' },
  { page: 'Requirements', label: 'Requirements', group: 'Tools' },
  { page: 'QualityGates', label: 'Quality Gates', group: 'Tools' },
  { page: 'SwotAnalysis', label: 'SWOT Analysis', group: 'Tools' },
  { page: 'WorkflowBuilder', label: 'Workflow Builder', group: 'Tools' },
  { page: 'GovernanceWizard', label: 'AI Governance Wizard', group: 'Tools' },

  // Reporting
  { page: 'WeeklyReports', label: 'Weekly Reports', group: 'Reporting' },
  { page: 'Reports', label: 'Reports', group: 'Reporting' },
  { page: 'ClientBriefing', label: 'Client Briefing', group: 'Reporting' },

  // AI
  { page: 'Brainiac', label: 'Brainiac', group: 'AI' },
  { page: 'PMOAgent', label: 'PMO Agent', group: 'AI' },

  // Administration
  { page: 'UserAccess', label: 'Users & Access', group: 'Administration', adminOnly: true },
];

const BY_PAGE = Object.fromEntries(MODULES.map((m) => [m.page, m]));
const BY_LABEL = Object.fromEntries(MODULES.map((m) => [m.label, m]));

/** Look up a module by its route key (page) or its label. */
export function getModule(pageOrLabel) {
  return BY_PAGE[pageOrLabel] || BY_LABEL[pageOrLabel] || null;
}

/** The permission-map key (label) for a page/label, or the input if unknown. */
export function moduleKey(pageOrLabel) {
  const m = getModule(pageOrLabel);
  return m ? m.label : pageOrLabel;
}

/** Modules grouped by their `group`, preserving MODULES order. */
export function modulesByGroup() {
  const groups = {};
  for (const m of MODULES) {
    (groups[m.group] ||= []).push(m);
  }
  return groups;
}
