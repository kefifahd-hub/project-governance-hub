import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Mirrors the CALLER'S OWN organization + platform role onto their built-in User record.
//
// User.org_id and User.platform_role carry field-level update locks (see User.jsonc), so an
// app user can no longer write them via auth.updateMe — that closed a self-escalation path
// (a user could otherwise point their own org_id at another organization and read its data).
// The server-side RLS rules scope records by {{user.data.org_id}}, so that field still has to
// be populated for every signed-in user; this endpoint does it with the service role, and only
// after confirming the caller actually has a matching PlatformUser record (their entitlement).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve the caller's own membership (service role bypasses PlatformUser RLS).
    const matches = await base44.asServiceRole.entities.PlatformUser.filter({ email: user.email });
    const platformUser = matches && matches[0];
    if (!platformUser || !platformUser.org_id) {
      return Response.json({ synced: false, reason: "no platform membership" });
    }

    await base44.asServiceRole.entities.User.update(user.id, {
      org_id: platformUser.org_id,
      platform_role: platformUser.platform_role || "user",
    });

    return Response.json({
      synced: true,
      org_id: platformUser.org_id,
      platform_role: platformUser.platform_role || "user",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}