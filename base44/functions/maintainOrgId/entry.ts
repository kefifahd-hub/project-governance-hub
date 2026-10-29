import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { ORG_ID_ENTITIES } from "../../shared/orgIdConfig.ts";

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

    // Auth guard: only admins and the platform service principal (scheduled/automation runs,
    // id starts with "service_") may run the backfill. Anonymous callers are refused — there is
    // no shared token, so nothing in the code or workflow can be copied to call it.
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const isService = typeof user.id === "string" && user.id.startsWith("service_");
    if (!isService && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const report = {};

    // Diagnostic: Project is the root org source — flag any projects still missing org_id.
    const projectsMissing = await base44.asServiceRole.entities.Project.filter({ org_id: null });
    report._projectsMissingOrgId = projectsMissing.length;

    for (const cfg of ORG_ID_ENTITIES) {
      const records = await findMissing(base44, cfg.name);
      if (records.length === 0) { report[cfg.name] = 0; continue; }

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