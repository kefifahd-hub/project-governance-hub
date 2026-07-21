import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { parseRolePermissions, canPerform } from '@/lib/permissions';

/**
 * SessionContext — the tenant + permission layer that sits on top of Base44 auth.
 *
 * Base44 authenticates the person (login on the right domain). We then resolve:
 *   Base44 user (email)  ->  PlatformUser  ->  Organization (domain) + PlatformRole
 * and expose a single `can(page, action)` gate plus the current domain scope.
 *
 * "Domain" == Organization: each client is one Organization, and every Project
 * carries that org_id, so a user only ever sees their own workspace's data.
 */

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const email = user?.email || null;
  const queryClient = useQueryClient();
  const syncedRef = useRef(null);

  // Resolve the PlatformUser record for the logged-in email.
  const { data: platformUser, isLoading: loadingUser } = useQuery({
    queryKey: ['session-platform-user', email],
    enabled: !!email,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const matches = await base44.entities.PlatformUser.filter({ email });
        return matches?.[0] || null;
      } catch {
        return null;
      }
    },
  });

  const roleId = platformUser?.role_id || null;
  const orgId = platformUser?.org_id || null;

  const { data: role, isLoading: loadingRole } = useQuery({
    queryKey: ['session-role', roleId],
    enabled: !!roleId,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const matches = await base44.entities.PlatformRole.filter({ id: roleId });
        return matches?.[0] || null;
      } catch {
        return null;
      }
    },
  });

  const { data: domain, isLoading: loadingDomain } = useQuery({
    queryKey: ['session-domain', orgId],
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const matches = await base44.entities.Organization.filter({ id: orgId });
        return matches?.[0] || null;
      } catch {
        return null;
      }
    },
  });

  /**
   * Login-time provisioning sync.
   *
   * The backend row-level security rules scope data by `{{user.data.org_id}}` —
   * a field on the *built-in User*, not on PlatformUser (RLS can't read
   * PlatformUser). Nothing else writes it, so without this a freshly-invited
   * user would pass their PlatformUser lookup yet see zero records server-side.
   *
   * Here we mirror the resolved PlatformUser's org_id (and platform_role, as a
   * readable copy) onto the built-in User via auth.updateMe, then refetch the
   * now-unblocked queries. We deliberately do NOT set the built-in `role` from
   * the client — that would be a self-escalation path; the admin role is set
   * server-side at invite time (InviteUserModal -> users.inviteUser).
   *
   * syncedRef guards re-entry: auth.me() in AuthContext isn't refetched, so the
   * local `user` stays stale after the PUT; without the ref the mismatch would
   * loop updateMe on every render.
   */
  useEffect(() => {
    if (!platformUser?.org_id) return;
    const targetOrg = platformUser.org_id;
    const currentOrg = user?.org_id ?? user?.data?.org_id ?? null;
    const sig = `${platformUser.id}:${targetOrg}:${platformUser.platform_role || 'user'}`;

    if (currentOrg === targetOrg) { syncedRef.current = sig; return; }
    if (syncedRef.current === sig) return; // already attempted this target
    syncedRef.current = sig; // set before await to prevent re-entry loops

    base44.auth
      .updateMe({ org_id: targetOrg, platform_role: platformUser.platform_role || 'user' })
      .then(() => {
        // User.data.org_id now set server-side → re-run RLS-scoped queries.
        queryClient.invalidateQueries();
      })
      .catch(() => {
        syncedRef.current = null; // allow a retry on next resolve
      });
  }, [platformUser, user, queryClient]);

  // Platform admin bypasses module gating and sees every domain.
  const isAdmin =
    platformUser?.platform_role === 'admin' || user?.role === 'admin';

  const permMap = useMemo(() => parseRolePermissions(role), [role]);

  const value = useMemo(() => {
    const can = (pageOrLabel, action = 'can_view') =>
      canPerform(permMap, pageOrLabel, action, isAdmin);

    return {
      // identity
      user,
      platformUser: platformUser || null,
      isAuthenticated,
      isRegistered: !!platformUser,
      // tenancy
      domain: domain || null,
      orgId: isAdmin ? null : orgId, // admins are unscoped (see all domains)
      isAdmin,
      // authorization
      role: role || null,
      permissions: permMap,
      can,
      /**
       * Add the domain scope to an entity filter. Admins get the base filter
       * unchanged (all domains); everyone else is pinned to their org_id.
       */
      scopeFilter: (base = {}) => (isAdmin || !orgId ? base : { ...base, org_id: orgId }),
      loading: loadingUser || loadingRole || loadingDomain,
    };
  }, [
    user, platformUser, isAuthenticated, domain, orgId, isAdmin, role,
    permMap, loadingUser, loadingRole, loadingDomain,
  ]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
};
