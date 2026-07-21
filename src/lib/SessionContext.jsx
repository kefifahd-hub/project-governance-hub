import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
