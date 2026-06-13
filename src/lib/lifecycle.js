/**
 * lifecycle.js — Single source of truth for the industrialization lifecycle.
 *
 * Before this module the platform carried three divergent vocabularies for the
 * same process: the FEED Tracker seeded one set of milestone phases, the
 * ProjectSidebar gated tools against another copy of that list, and the
 * Feasibility quality-gate timeline used a separate QG0–QG7 scale. A project's
 * "where are we?" could not be computed consistently across modules.
 *
 * This file unifies them:
 *   - LIFECYCLE_PHASES  : the operational phases a project moves through
 *                         (drives Project.currentPhase and Milestone.phaseName)
 *   - QUALITY_GATES     : the stage-gate decision points (QG0–QG7)
 *   - PHASE_TOOLS       : which tools are relevant in each phase
 * Each phase declares the gate that closes it, so any module can map a phase to
 * its gate (and vice-versa) without re-deriving the relationship.
 */

// ---------------------------------------------------------------------------
// Operational lifecycle phases (ordered). `gate` is the Quality Gate that the
// phase drives toward / is closed by.
// ---------------------------------------------------------------------------
export const LIFECYCLE_PHASES = [
  { key: 'Feasibility',          label: 'Feasibility',          gate: 1 },
  { key: 'Pre-FEED',             label: 'Pre-FEED',             gate: 1 },
  { key: 'FEED',                 label: 'FEED',                 gate: 2 },
  { key: 'Investment Decision',  label: 'Investment Decision',  gate: 3 },
  { key: 'Project Setup',        label: 'Project Setup',        gate: 3 },
  { key: 'Detailed Engineering', label: 'Detailed Engineering', gate: 4 },
  { key: 'Procurement',          label: 'Procurement',          gate: 4 },
  { key: 'Construction',         label: 'Construction',         gate: 4 },
  { key: 'Commissioning',        label: 'Commissioning',        gate: 5 },
  { key: 'SOP',                  label: 'SOP',                  gate: 6 },
].map((phase, order) => ({ ...phase, order }));

// Default phase list used when seeding a project's milestones.
export const DEFAULT_MILESTONE_PHASES = LIFECYCLE_PHASES.map((p) => p.key);

// ---------------------------------------------------------------------------
// Quality gates (stage-gate decision points). `number` matches the persisted
// QualityGate.gateNumber and FeasibilityStudy gate scale.
// ---------------------------------------------------------------------------
export const QUALITY_GATES = [
  { number: 0, name: 'QG0', full: 'Opportunity Assessment' },
  { number: 1, name: 'QG1', full: 'Pre-Feasibility' },
  { number: 2, name: 'QG2', full: 'FEED Complete' },
  { number: 3, name: 'QG3', full: 'FID' },
  { number: 4, name: 'QG4', full: 'Mech. Completion' },
  { number: 5, name: 'QG5', full: 'Commissioning' },
  { number: 6, name: 'QG6', full: 'SOP' },
  { number: 7, name: 'QG7', full: 'Full Production' },
];

// ---------------------------------------------------------------------------
// Phase → relevant tools. Drives the ProjectSidebar phase-gating so a tool only
// appears once the project has reached a phase where it is meaningful.
// ---------------------------------------------------------------------------
export const PHASE_TOOLS = {
  'Feasibility':          ['SiteSelection', 'FeasibilityStudy', 'NPVCalculator', 'FinanceModel'],
  'Pre-FEED':             ['SiteSelection', 'FeasibilityStudy', 'NPVCalculator', 'FinanceModel', 'RiskRegister'],
  'FEED':                 ['FeasibilityStudy', 'FinanceModel', 'NPVCalculator', 'FEEDTracker', 'RiskRegister', 'BudgetDashboard'],
  'Investment Decision':  ['FinanceModel', 'NPVCalculator', 'RiskRegister', 'BudgetDashboard'],
  'Project Setup':        ['FinanceModel', 'RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring'],
  'Detailed Engineering': ['ActionTracker', 'FEEDTracker', 'RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring', 'ScheduleSync', 'ScheduleDashboard', 'WeeklyReports', 'ChangeManagement', 'UserAccess', 'Reports'],
  'Procurement':          ['ActionTracker', 'RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring', 'ScheduleSync', 'ScheduleDashboard', 'WeeklyReports', 'QAQCDashboard', 'ChangeManagement', 'UserAccess', 'Reports'],
  'Construction':         ['ActionTracker', 'RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring', 'ScheduleSync', 'ScheduleDashboard', 'WeeklyReports', 'QAQCDashboard', 'ChangeManagement', 'UserAccess', 'Reports'],
  'Commissioning':        ['ScheduleMonitoring', 'ScheduleSync', 'ScheduleDashboard', 'WeeklyReports', 'QAQCDashboard', 'BudgetDashboard', 'RiskRegister', 'ChangeManagement', 'ActionTracker', 'UserAccess', 'Reports'],
  'SOP':                  ['FinanceModel', 'BudgetDashboard', 'WeeklyReports'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Case-insensitive, trim-tolerant lookup of a phase key actually defined. */
export function matchPhaseKey(rawPhase) {
  const phase = rawPhase?.trim();
  if (!phase) return undefined;
  return (
    LIFECYCLE_PHASES.find((p) => p.key.toLowerCase() === phase.toLowerCase())?.key ||
    phase
  );
}

/** Full phase descriptor for a (possibly messy) phase string. */
export function getPhase(rawPhase) {
  const key = matchPhaseKey(rawPhase);
  return LIFECYCLE_PHASES.find((p) => p.key === key);
}

/** Zero-based position of a phase in the lifecycle, or -1 if unknown. */
export function getPhaseOrder(rawPhase) {
  return getPhase(rawPhase)?.order ?? -1;
}

/** Tools relevant in a given phase (empty array for unknown phases). */
export function getPhaseTools(rawPhase) {
  const key = matchPhaseKey(rawPhase);
  return PHASE_TOOLS[key] || [];
}

/** The Quality Gate descriptor that the given phase drives toward. */
export function getGateForPhase(rawPhase) {
  const phase = getPhase(rawPhase);
  if (!phase) return undefined;
  return QUALITY_GATES.find((g) => g.number === phase.gate);
}

/** Overall lifecycle progress (0–100) for a phase, for portfolio roll-ups. */
export function getLifecycleProgress(rawPhase) {
  const order = getPhaseOrder(rawPhase);
  if (order < 0) return 0;
  return Math.round((order / (LIFECYCLE_PHASES.length - 1)) * 100);
}
