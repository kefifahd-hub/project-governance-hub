// Shared org_id stamping + tenant enforcement for entities whose organization is derived
// from a parent record (see ORG_ID_ENTITIES in ./orgIdConfig.ts).
//
// Invoked in real time by the per-entity "Stamp org_id on <Entity> create" workflows, so a
// freshly created child always carries its parent's org_id — never whatever the client sent.
import { getConfig } from "./orgIdConfig.ts";

/**
 * 1. Resolve the parent-derived org_id for a freshly created record.
 * 2. Reject (remove) the record when the parent belongs to a different organization than
 *    the record's creator and the creator is not an admin.
 * 3. Otherwise overwrite org_id with the parent-derived value, discarding any
 *    client-supplied org_id so it cannot be spoofed.
 */
export async function stampOrgIdFromParent(base44, entityName, entityId) {
  const cfg = getConfig(entityName);
  if (!cfg) return { skipped: "not a tenant-scoped entity", entity: entityName };

  const record = await base44.asServiceRole.entities[entityName].get(entityId).catch(() => null);
  if (!record) return { skipped: "record not found", entity: entityName, id: entityId };

  const parentRef = record[cfg.parentField];
  if (!parentRef) {
    return { skipped: "no parent reference", entity: entityName, id: entityId, parentField: cfg.parentField };
  }

  const parent = await base44.asServiceRole.entities[cfg.parentEntity].get(parentRef).catch(() => null);
  const parentOrg = parent ? parent[cfg.parentOrgField] : null;
  if (!parentOrg) {
    return {
      skipped: "parent has no org_id",
      entity: entityName, id: entityId,
      parentEntity: cfg.parentEntity, parentId: parentRef,
    };
  }

  // Enforcement: the resulting org_id must be the creator's own organization, unless the
  // creator is an admin. Records we cannot attribute to a user (service-role / automation
  // writes) are stamped but not judged.
  const creator = record.created_by_id
    ? await base44.asServiceRole.entities.User.get(record.created_by_id).catch(() => null)
    : null;
  if (creator) {
    const creatorOrg = creator.org_id || (creator.data && creator.data.org_id) || null;
    const creatorIsAdmin =
      creator.role === "admin" ||
      creator.platform_role === "admin" ||
      (creator.data && creator.data.platform_role === "admin");
    if (!creatorIsAdmin && creatorOrg !== parentOrg) {
      await base44.asServiceRole.entities[entityName].delete(entityId);
      return { rejected: true, entity: entityName, id: entityId, parentOrg, creatorOrg };
    }
  }

  try {
    await base44.asServiceRole.entities[entityName].updateMany(
      { id: entityId },
      { $set: { org_id: parentOrg } }
    );
  } catch (e) {
    return { skipped: "update failed", entity: entityName, id: entityId, error: e.message };
  }

  return { stamped: true, entity: entityName, id: entityId, org_id: parentOrg };
}