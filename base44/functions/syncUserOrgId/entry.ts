import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { mirrorOrgIdForUser } from "../../shared/orgMirror.ts";

// Called by the "Mirror org_id on app user login" workflow on every app-user signup and login.
//
// This runs as the workflow's creator (an app admin) and its URL is public, so it must prove the
// admin context before it touches another user's record with the service role. The identity being
// stamped comes from the auth trigger, never from the caller's own session.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const email = body && body.email;
    if (!email) return Response.json({ error: "email is required" }, { status: 400 });

    const result = await mirrorOrgIdForUser(base44, {
      userId: (body && body.user_id) || null,
      email,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}