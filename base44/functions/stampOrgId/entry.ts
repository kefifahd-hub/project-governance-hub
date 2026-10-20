import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { stampOrgIdFromParent } from "../../shared/orgIdStamp.ts";

// Real-time org_id stamp for every tenant-scoped entity. Called by the per-entity
// "Stamp org_id on <Entity> create" workflows, which pass the entity name and the new
// record's id. Stamps the parent-derived org_id and rejects cross-tenant creates.
export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const isService = typeof user.id === "string" && user.id.startsWith("service_");
  if (!isService && user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    // Explicit args are the normal path; the event shape is tolerated because previously
    // migrated workflows keep their legacy-payload marker.
    const event = body.event || {};
    const entityName = body.entity_name || event.entity_name;
    const entityId = body.entity_id || event.entity_id;
    if (!entityName || !entityId) {
      return Response.json({ skipped: "no entity info" });
    }

    const result = await stampOrgIdFromParent(base44, entityName, entityId);
    return Response.json(result, { status: result.rejected ? 403 : 200 });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}