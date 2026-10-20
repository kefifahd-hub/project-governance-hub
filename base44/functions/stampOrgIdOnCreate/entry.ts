import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { stampOrgIdFromParent } from "../../shared/orgIdStamp.ts";

// Legacy entry point, kept because previously migrated workflows still carry a platform-owned
// x-base44-migrated-from-automation marker naming this function. Every stamp workflow now
// calls stampOrgId instead; both delegate to the same shared module, so the logic cannot drift.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const isService = typeof user.id === "string" && user.id.startsWith("service_");
    if (!isService && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const eventName = body && body.event ? body.event.entity_name : null;
    const entityId = body && body.event ? body.event.entity_id : null;
    if (!eventName || !entityId) {
      return Response.json({ skipped: "no entity info" });
    }

    const result = await stampOrgIdFromParent(base44, eventName, entityId);
    return Response.json(result, { status: result.rejected ? 403 : 200 });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});