/**
 * permissions.js — pure helpers for reading a PlatformRole's permission matrix.
 *
 * A PlatformRole stores `module_permissions` as a JSON string: an array of
 * objects shaped like:
 *   { module: "Risk Register", can_view: true, can_create: false, ..., data_scope: "All" }
 *
 * These helpers turn that into a fast lookup and answer can(module, action).
 * The React binding lives in SessionContext; keep this file free of React so it
 * stays trivially testable and reusable (e.g. from backend functions later).
 */

import { moduleKey, PERMISSION_KEYS } from './modules';

/** Parse a role's module_permissions JSON into a { [moduleLabel]: permObj } map. */
export function parseRolePermissions(role) {
  if (!role) return {};
  let list = [];
  try {
    list = JSON.parse(role.module_permissions || '[]');
  } catch {
    list = [];
  }
  const map = {};
  for (const entry of Array.isArray(list) ? list : []) {
    if (entry && entry.module) map[entry.module] = entry;
  }
  return map;
}

/** Serialize a { [moduleLabel]: permObj } map back to the stored JSON string. */
export function serializeRolePermissions(permMap) {
  const list = Object.entries(permMap).map(([module, perms]) => ({ module, ...perms }));
  return JSON.stringify(list);
}

/**
 * Can this permission map perform `action` on `pageOrLabel`?
 * `isAdmin` short-circuits to true (platform admins bypass module gating).
 */
export function canPerform(permMap, pageOrLabel, action = 'can_view', isAdmin = false) {
  if (isAdmin) return true;
  if (!PERMISSION_KEYS.includes(action)) return false;
  const entry = permMap?.[moduleKey(pageOrLabel)];
  return !!(entry && entry[action]);
}

/** An all-false permission object for a module (used when adding rows in the editor). */
export function emptyPermission() {
  return PERMISSION_KEYS.reduce((acc, k) => ({ ...acc, [k]: false }), { data_scope: 'All' });
}
