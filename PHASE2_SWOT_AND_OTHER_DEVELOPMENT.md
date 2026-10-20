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

## Key principle (same lesson as the data-leak fix)
Enforce "who can use what" and "needs approval" at the **data layer / backend**, never
only in the screen — UI-only gating is bypassable.
