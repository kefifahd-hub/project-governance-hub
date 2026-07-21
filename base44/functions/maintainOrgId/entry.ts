import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { ORG_ID_ENTITIES } from "../../shared/orgIdConfig.ts";

// Shared internal token used by the scheduled automation to authenticate (function_args).
const INTERNAL_TOKEN = "pmo_maintain_orgid_8f3a9c21";
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

    // Auth guard: reject non-admin and anonymous callers.
    // Admins pass. Service-context callers (automation/scheduled runs that authenticate
    // as the platform service principal, id starts with "service_") pass. Anonymous
    // (no user) calls are accepted ONLY with the shared internal token (header or body).
    const user = await base44.auth.me();
    if (user) {
      const isService = typeof user.id === "string" && user.id.startsWith("service_");
      if (!isService && user.role !== "admin") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      let token = req.headers.get("x-maintain-token");
      if (!token) {
        try { const b = await req.json(); token = b ? b.maintain_token : null; } catch (_) { token = null; }
      }
      if (token !== INTERNAL_TOKEN) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
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