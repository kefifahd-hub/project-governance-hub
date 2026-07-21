import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { getConfig } from "../../shared/orgIdConfig.ts";

// Real-time stamp: invoked by per-entity "create" automations. Overwrites org_id with the
// parent-derived value (ignoring any client-supplied org_id) so it cannot be spoofed.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Auth guard: same policy as maintainOrgId — admin or service-context pass; anonymous
    // calls are allowed only when they carry an entity-create event payload (i.e. a real
    // automation invocation). The operation is idempotent and harmless (only enforces the
    // correct parent-derived org_id), so automation invocation must not be blocked.
    const user = await base44.auth.me();
    if (user) {
      const isService = typeof user.id === "string" && user.id.startsWith("service_");
      if (!isService && user.role !== "admin") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      const isAutomation = body && body.event && body.event.entity_name;
      if (!isAutomation) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const eventName = body && body.event ? body.event.entity_name : null;
    const entityId = body && body.event ? body.event.entity_id : null;
    if (!eventName || !entityId) {
      return Response.json({ skipped: "no entity info" });
    }

    const cfg = getConfig(eventName);
    if (!cfg) {
      return Response.json({ skipped: "not a tenant-scoped entity", entity: eventName });
    }

    let record = body.data;
    if (!record || body.payload_too_large) {
      record = await base44.asServiceRole.entities[eventName].get(entityId).catch(() => null);
    }
    if (!record) {
      return Response.json({ skipped: "record not found", entity: eventName, id: entityId });
    }

    const parentField = record[cfg.parentField];
    if (!parentField) {
      return Response.json({ skipped: "no parent reference", entity: eventName, id: entityId });
    }

    const parent = await base44.asServiceRole.entities[cfg.parentEntity].get(parentField).catch(() => null);
    const parentOrg = parent ? parent[cfg.parentOrgField] : null;
    if (!parentOrg) {
      return Response.json({
        skipped: "parent has no org_id",
        entity: eventName, id: entityId, parentEntity: cfg.parentEntity, parentId: parentField,
      });
    }

    // Overwrite org_id with the parent-derived value (ignore any client-supplied org_id).
    try {
      await base44.asServiceRole.entities[eventName].updateMany(
        { id: entityId },
        { $set: { org_id: parentOrg } }
      );
    } catch (e) {
      return Response.json({ skipped: "update failed", entity: eventName, id: entityId, error: e.message });
    }

    return Response.json({ stamped: true, entity: eventName, id: entityId, org_id: parentOrg });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});