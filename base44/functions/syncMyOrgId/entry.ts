import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { mirrorOrgIdForUser } from "../../shared/orgMirror.ts";

// Mirrors the CALLER'S OWN organization + platform role onto their built-in User record.
//
// Both identities come from the session (auth.me()), never from the request body, so a caller can
// only ever refresh their own record — this cannot be used to stamp someone else's user.
//
// The reliable, server-side path for every login is the "Mirror org_id on app user login" workflow
// (syncUserOrgId); this endpoint stays as the in-session fallback the app calls after login.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await mirrorOrgIdForUser(base44, { userId: user.id, email: user.email });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}