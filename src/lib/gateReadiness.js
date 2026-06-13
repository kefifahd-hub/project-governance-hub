/**
 * gateReadiness.js — roadmap item D: derive checklist readiness from LIVE data.
 *
 * Some gate-checklist items can be answered automatically from the project's
 * registers instead of a manual tick. Each auto-evaluator is keyed by the
 * checklist item id and, given a context of live records, returns whether the
 * item is satisfied plus a short human-readable reason.
 *
 * Items without an evaluator stay manual (ticked by the user, persisted in
 * Supabase). This wires the Process Library to the monitor/control side: the
 * checklist reflects the actual state of risks, changes and non-conformities.
 */

const isOpenRisk = (r) => r.status !== 'Closed';
const isHighRisk = (r) => ['Critical', 'High'].includes(r.riskLevel);
const isOpenNC = (n) => !['Closed', 'Resolved', 'Dispositioned'].includes(n.status);

// itemId -> (ctx) => { satisfied: boolean, detail: string }
export const AUTO_EVALUATORS = {
  // Risk register exists / initiated
  f5: (ctx) => riskLogged(ctx),
  pf4: (ctx) => riskLogged(ctx),
  // High/critical risks all have an owner and a mitigation plan
  fid4: (ctx) => {
    const open = (ctx.risks || []).filter((r) => isOpenRisk(r) && isHighRisk(r));
    const missing = open.filter((r) => !r.owner || !r.mitigationPlan);
    return {
      satisfied: open.length > 0 && missing.length === 0,
      detail: missing.length
        ? `${missing.length} high/critical risk(s) missing owner or mitigation plan`
        : open.length
        ? `${open.length} high/critical risk(s), all owned & mitigated`
        : 'no open high/critical risks logged yet',
    };
  },
  fe5: (ctx) => {
    const open = (ctx.risks || []).filter(isOpenRisk);
    return { satisfied: open.length > 0, detail: `${open.length} open risk(s) in register` };
  },
  // Open non-conformities resolved / dispositioned
  c2: (ctx) => {
    const open = (ctx.nonConformities || []).filter(isOpenNC);
    return {
      satisfied: open.length === 0,
      detail: open.length ? `${open.length} open non-conformity(ies)` : 'no open non-conformities',
    };
  },
  // Change log current
  d3: (ctx) => {
    const crs = ctx.changeRequests || [];
    return { satisfied: crs.length > 0, detail: `${crs.length} change request(s) in log` };
  },
};

function riskLogged(ctx) {
  const n = (ctx.risks || []).length;
  return { satisfied: n > 0, detail: `${n} risk(s) logged` };
}

/** Auto result for a single checklist item, or null if the item stays manual. */
export function evaluateItem(itemId, ctx) {
  const fn = AUTO_EVALUATORS[itemId];
  return fn ? { auto: true, ...fn(ctx) } : null;
}

/** Does this checklist item have a live evaluator? */
export function isAutoItem(itemId) {
  return Boolean(AUTO_EVALUATORS[itemId]);
}
