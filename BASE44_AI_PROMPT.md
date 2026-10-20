# Deliverable A — Ready-to-paste prompts for Base44's AI builder

These are grounded in your actual app code (`project-governance-hub`): records already carry **`org_id`**, the signed-in user's org is mirrored onto **`user.data.org_id`** (`src/lib/SessionContext.jsx` → `base44.auth.updateMe({ org_id })`), and **`role: admin`** is meant to see everything. So this is about *applying the access rules* to every entity — the infrastructure is already there.

Paste these into Base44's AI builder chat, **one at a time**, and check the result after each.

---

## Prompt 0 — Confirm the model first (do this before anything)
```
Before changing anything, confirm these facts about my app and report back:
1. Is `org_id` automatically set on new records (like created_by), or does the
   app set it on create? If it is NOT automatic, list which entities don't set it.
2. Is the signed-in user's `org_id` available inside Row Level Security rules as
   {{user.data.org_id}} ? (SessionContext.jsx syncs it via auth.updateMe.)
3. Is the built-in user `role` set to "admin" for my team via inviteUser?
Do not make changes yet — just confirm.
```

## Prompt 1 — Lock the front door
```
Set the app visibility to Private (invite-only, requires sign-in). Enable
email/password login, and enable MFA if available. Make sure users cannot
edit their own org_id, role, or platform_role — only an admin can.
```

## Prompt 2 — Client/project data: scope every record to its organization
```
Apply this Row Level Security to EACH of the entities listed below. The rule:
a user may create, read, update and delete a record only when the record's
org_id equals the signed-in user's org_id, OR the user's role is "admin"
(admins see everything).

Use exactly this rule on each entity (keep create open to logged-in users, but
make sure org_id is stamped to the creator's org on create):

"rls": {
  "create": true,
  "read":   { "$or": [ {"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"role": "admin"}} ] },
  "update": { "$or": [ {"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"role": "admin"}} ] },
  "delete": { "$or": [ {"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"role": "admin"}} ] }
}

If org_id is not already auto-set on create, also set it to the creator's
org_id automatically whenever one of these records is created, and never accept
org_id from user input.

Entities:
ActionBucket, ActionChecklist, ActionComment, ActionItem, ActionPhase, Audit,
AuditFinding, BOMAssumptions, BudgetTracking, CandidateSite, CapexPlan,
CellConfig, ChangeApproval, ChangeImpactAssessment, ChangeRequest,
ChangeWorkflow, CommunicationPlan, DCFAssumptions, DailyPrinciple,
DailySiteReport, FeasibilityStudy, FinanceModel, FinancingAssumptions,
GrantAssumptions, HeadcountPlan, LessonLearned, Milestone, NPVScenario,
NonConformity, OtherOpexAssumptions, OverheadAssumptions, Project,
ProjectCharter, QARecord, QualityGate, RaciAssignment, RaidItem, Requirement,
RevenueAssumptions, Risk, SCurveComment, ScheduleActivity, ScheduleDelta,
ScheduleRisk, ScheduleSource, ScheduleTask, ScheduleVersion, SiteAssessment,
SiteCriteria, Stakeholder, SwotItem, TaxAssumptions, TurnoverPackage,
UtilityAssumptions, WBSMapping, WbsElement, WeeklyReport, Workflow,
WorkingCapitalAssumptions
```

## Prompt 3 — Per-user chat history
```
For the AgentConversation entity, set Row Level Security so a user can only
read/update/delete their own conversations: match created_by to the user's
email, OR allow role "admin". Rule:

"rls": {
  "create": true,
  "read":   { "$or": [ {"created_by": "{{user.email}}"}, {"user_condition": {"role": "admin"}} ] },
  "update": { "$or": [ {"created_by": "{{user.email}}"}, {"user_condition": {"role": "admin"}} ] },
  "delete": { "$or": [ {"created_by": "{{user.email}}"}, {"user_condition": {"role": "admin"}} ] }
}
```

## Prompt 4 — Admin-only tables (users, orgs, roles, audit log)
```
Apply this Row Level Security to Organization, PlatformUser, and PlatformRole:
only admins can create/read/update/delete.

"rls": {
  "create": { "user_condition": {"role": "admin"} },
  "read":   { "user_condition": {"role": "admin"} },
  "update": { "user_condition": {"role": "admin"} },
  "delete": { "user_condition": {"role": "admin"} }
}

For AuditLog, use the same BUT set "delete": false so audit records can never
be deleted by anyone (immutable trail):

"rls": {
  "create": { "user_condition": {"role": "admin"} },
  "read":   { "user_condition": {"role": "admin"} },
  "update": false,
  "delete": false
}
```

## Prompt 5 — Shared knowledge graph (Brainiac)
```
Neuron, Synapse, SynapseVersion and ProcessingRule are shared platform data.
Set Row Level Security so everyone signed in can READ them, but only admins can
create/update/delete:

"rls": {
  "create": { "user_condition": {"role": "admin"} },
  "read":   true,
  "update": { "user_condition": {"role": "admin"} },
  "delete": { "user_condition": {"role": "admin"} }
}

(If these should instead be private per client, tell me and I'll scope them to
org_id like the project data.)
```

## Prompt 6 — Backend functions (these bypass the rules above)
```
List every backend function / server-side action in this app that reads or
writes entities. For each, tell me whether it filters data by the caller's
org_id. Any function that doesn't is a cross-client data risk — show me how to
add an org_id check to each.
```

## Prompt 7 — Scan
```
Run the Security Scan and list every issue, grouped by severity, with the fix.
```

---

## After the prompts: prove it (do this yourself, it's the real test)
1. Create two orgs — "Test Client A" and "Test Client B" — each with a couple of sample projects/records.
2. Invite a test user into Client A (role = user, not admin).
3. Log in as that user → you should see **only** Client A data. Try opening a Client B record by its link → it must be **denied**.
4. Log in as your admin → you should see **both**.
5. If the Client A user ever sees Client B data, a rule above was missed — fix before inviting any real client.
