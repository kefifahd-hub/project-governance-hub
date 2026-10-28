# Parked — "SWOT and other development" (Phase 2)

Feature idea: control how each tool (SWOT analysis, Change Management, workflows, etc.)
is used — who can use it, whether a work product stays personal or is published to the
project, and whether publishing needs approval. Build AFTER the Phase-1 tenant-isolation
work is solid.

## Three layers
1. **Who can use each tool** — role-based feature access. Foundation already exists in the
   app (`PlatformRole.module_permissions`, `parseRolePermissions`, `canPerform`), but it is
   currently **UI-only**. Must be enforced in the access rules / backend, not just hidden.
2. **Personal vs. project** — each work product has a "home":
   - *Personal*: private draft, visible only to its creator (`created_by`) + admins.
   - *Project*: published/shared, visible to the whole organization/project (org-scoped).
   - Flow: draft privately → publish to the project.
3. **Approval** — publishing to the project can require sign-off. Add a status:
   `draft → pending approval → approved`, where only an approver role can approve.

## Open questions to answer before building
- Which tools are **personal-first** (SWOT, notes…) vs **always project-level**
  (Change Management, workflows…)?
- Which actions need **approval**, and who is the approver (PM? admin?)?

## Delegated per-client admin ("Client Admin" / Org Admin)
A third role tier so each client manages its own people, without the platform owner
doing it for them.

- **Three tiers:** Platform Admin (your team — all orgs) → **Client Admin** (one or
  more per client, designated by the platform owner — *their own org only*) → Member.
- **A Client Admin can, within their own org only:** invite/remove users, and set
  which modules each user can access and whether they can read / edit / write.
- **The platform owner (you) chooses who the Client Admin is** for each client.

### Guardrails (must-haves — all enforced server-side, never UI-only)
- Client Admin is hard-scoped to their own `org_id`: cannot see, edit, or invite into
  any other org.
- Cannot grant Platform-Admin (no self/other escalation to the top tier).
- Cannot delete their organization or change its `org_id`.
- Same lesson as the data leak: if these limits live only in the screen, they're
  bypassable — they must be in the access rules / backend.

### Open questions to answer before building
- One Client Admin per client, or several?
- Can a Client Admin create custom roles, or only assign from a preset list you define?
- Exact capability list for the Client Admin vs. a Member.

## Key principle (same lesson as the data-leak fix)
Enforce "who can use what" and "needs approval" at the **data layer / backend**, never
only in the screen — UI-only gating is bypassable.
