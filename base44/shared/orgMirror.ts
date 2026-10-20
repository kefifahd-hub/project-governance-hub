// Mirrors a user's organization + platform role from their own PlatformUser record onto their
// built-in User record — the fields the row-level security rules scope data by
// ({{user.data.org_id}}).
//
// User.org_id and User.platform_role carry field-level update locks (see User.jsonc), so an app
// user cannot write them via auth.updateMe. That closed a self-escalation path (a user pointing
// their own org_id at another organization to read its data), which means the app has to populate
// them server-side. The only source is the user's own membership record, so this can never grant
// more than the entitlement already says.
//
// Used by two functions, so it lives here rather than being copied into each:
//   - syncMyOrgId   — a signed-in user syncing their own record
//   - syncUserOrgId — the "Mirror org_id on app user login" workflow, on every login / signup
export async function mirrorOrgIdForUser(base44, { userId = null, email = null } = {}) {
  if (!email) return { synced: false, reason: 'no email to resolve membership by' };

  // The membership record IS the entitlement: org_id is the active/primary domain.
  const memberships = await base44.asServiceRole.entities.PlatformUser.filter({ email });
  const platformUser = memberships && memberships[0];
  if (!platformUser || !platformUser.org_id) {
    return { synced: false, reason: 'no platform membership' };
  }

  // Resolve which User record to stamp, preferring the id the caller/trigger supplied.
  let targetUserId = userId;
  if (!targetUserId) {
    const users = await base44.asServiceRole.entities.User.filter({ email });
    targetUserId = users && users[0] && users[0].id;
  }
  if (!targetUserId) return { synced: false, reason: 'no user record' };

  const orgId = platformUser.org_id;
  const platformRole = platformUser.platform_role || 'user';

  await base44.asServiceRole.entities.User.update(targetUserId, {
    org_id: orgId,
    platform_role: platformRole,
  });

  return { synced: true, org_id: orgId, platform_role: platformRole };
}