# BuildMind — Release QA Checklist (run every release)

**How to use.** Run **Section A (security) every release — it gates the release.** Run Section B (core modules) every release. Run C/D only for modules you changed or are putting in scope. Sample Section E every release, full quarterly. Record each as **PASS / FAIL / BLOCKED / N-A** with a one-line note, the build/date, and the account+role you used. A page loading is **not** a pass — check the saved state. IDs in brackets map to the tester handover.

**Fixtures:** two client orgs **A** and **B**, each with ≥1 project and some data. Accounts: **Operator/Admin**, **A-member (non-admin)**, **B-member**, **Outsider (registered, no membership)**, **Anonymous (no login)**. Use separate browser profiles / incognito per account.

**Fresh test data each release:** as an admin, run the `seedTestData` backend function (Base44 Dashboard → Code → Functions → seedTestData → Test) with `{"action":"reset","confirm":"RESET TEST DATA"}` then `{"action":"seed"}`. This rebuilds the same 6 synthetic projects with **every project tool filled** (actions, risks, charter, reports, budget, schedule, finance model, site selection, change management, QA/QC, audits, turnover, etc.) in the **Test** org only. `{"action":"status"}` just reports what exists.

---

## Section A — Security & isolation (P0 — every release, gates the release)
| ID | Test | Expected PASS |
|---|---|---|
| A1 [QF-05,S02] | Log in as **A-member**, view projects/records | Sees **only Client A** data; **none** of B's |
| A2 [QF-03,S01] | As **Outsider** and **Anonymous**, try to open projects/records/APIs | No client data, counts, or metadata reachable |
| A3 [S02] | As **A-member**, open a known **B** record by direct link | Denied / safely empty (not the record body) |
| A4 [QF-04,S08] | Invite a new user; watch status before they accept | Shows **Pending** until accepted; **Active only after** acceptance; resend/duplicate/expiry behave truthfully |
| A5 [QF-02] | Accept an invite on a fresh inbox | Can **set a password** and sign in to **only** the assigned scope |
| A6 [QF-01,S07] | As **A-member**, attempt an admin action (manage users/orgs) via UI **and** direct call | Denied at the **backend**, not just hidden |
| A7 [S04] | As **A-member**, try to change own `org_id` / `platform_role` / `role` | Values unchanged; normal profile edits still work |
| A8 [S05] | As **A-member**, try to create/move a record into **B**'s project | Rejected before save; no orphan/partial record |
| A9 [M37,DS-08] | As **A-member**, run **governanceAI / Governance Wizard** against a **B** project id | **403 refused** before any read/delete/generate |
| A10 [R06] | As **A-member**, try to edit/delete an **audit** record | Denied; audit is admin-read, immutable |
| A11 [S09] | Keep an A-member session open; Operator **deactivates** them → retry a protected action now and after 60s | Access **denied** without them logging out |
| A12 [S11,HF-12] | *(when files are in scope)* Upload a private file; try to fetch its URL as Outsider/B/Anonymous/revoked | Only current authorised users can fetch it |
| A13 | Invite a user typing the email with **Capitals and a trailing space** (e.g. ` Test.User@Gmail.com `); they sign in with the normal address. In Users & Access, check every email is lowercase, has no spaces, and is the address the person actually signs in with (Google vs email/password) | Invitee reaches their workspace — **never "Account not provisioned"**; saved email is lowercase/trimmed |

**If any A-row FAILs → NO-GO.** Escalate A1/A2/A6/A9 immediately (client-data / privilege issues).

---

## Section B — Core modules (P1 — every release)
For each: create a uniquely-named record, add a child/field, **reload**, confirm it persisted **in the right project**; then confirm an A-member can't see it from B.
| ID | Module | Key check | Watch (known risk) |
|---|---|---|---|
| B1 [M01] | Home | Select project; health/budget/risk reconcile to that client | Health source differs from Dashboard |
| B2 [M02] | Project Dashboard | Counts/links reference selected project | Health reads fields not in schema |
| B3 [M03] | New Project | Create persists; blank name / negative budget / foreign client **rejected** | Backend must enforce tenant on create |
| B4 [M04] | Users & Access | Invite lifecycle accurate; role change + revocation **enforced** | Failed invite must not appear Active |
| B5 [M05] | Settings | Identity correct; log-off forces re-auth; **Delete-Account wording truthful** | Currently logout-only, doesn't delete |
| B6 [M06] | Project Charter | Draft persists; approve records real actor/time; **approved content can't be silently edited** | Approved charter editable (PRE-02) |
| B7 [M16] | Action Tracker | Create + checklist + comment persist; **250+ actions: oldest critical still findable** | 200-row cap, no pagination (LEAD-04) |
| B8 [M17] | Risk Register | Risk inputs / level / counts reconcile | Probability/impact scale mismatch |
| B9 [M18] | Audit & CAPA | Finding stays attached; delete = safe cascade, **no orphan findings** | Delete sends parent only (QA-A01) |
| B10 [M23] | Reports | Publish weekly report; change source after → **issued report unchanged**; export matches | Published sections stay live; PDF mapping (LEAD-03) |
| B11 [M24] | Weekly Reports | Legacy create validates or shows a clear error; **no Invalid Date** | Schema clash with compiled Reports (LEAD-01) |
| B12 [M35] | User Manual | Renders; claims match actual behaviour | Overstates finance/AI capabilities |
| B13 [M36] | PMO Agent | Chat scoped to the authorised project only; **no other-client data** | Some unscoped context queries |

---

## Section C — Extended modules (P1 — when changed / in scope)
Each: create → reload → persists in correct project; confirm cross-project isolation; check the watch item.
| ID | Module | Watch (known risk) |
|---|---|---|
| C1 [M07] | Stakeholder Register | AI "optimize" may overwrite records |
| C2 [M08] | WBS | Rollup is exact-code, not hierarchical |
| C3 [M09] | RACI Matrix | RACI roles ≠ app permissions |
| C4 [M10] | Requirements | Acceptance criteria are text only |
| C5 [M11] | Communications Plan | A plan row does **not** send anything |
| C6 [M12] | Quality Gates | Auto-seeds gates; vocab differs from FEED |
| C7 [M13] | RAID Log | Promote-to-risk can duplicate/orphan |
| C8 [M14] | SWOT Analysis | Qualitative aid; AI optimize needs review |
| C9 [M15] | Lessons Learned | No auto follow-up actions |
| C10 [M19] | QA/QC | Narrow-screen overflow; status not externally validated |
| C11 [M20] | Turnover Packages | Board status is a direct update, not a gate |
| C12 [M21] | Change Management | CR numbering by count; diagram doesn't enforce routing |
| C13 [M22] | Change Workflow | Design-only; no execution engine |
| C14 [M25] | Client Briefing | Output is Markdown, not a sent comms |
| C15 [M26] | Site Selection | Weights are templates, not due diligence |
| C16 [M27] | Feasibility Study | NPV/IRR are entered values, not calculated |
| C17 [M28] | FEED Tracker | Uses Milestone/QualityGate; seed = 10 phases |
| C18 [M29] | Budget Tracking | Doesn't reconcile with all finance views |

---

## Section D — Specialist / excluded (P2 — reachability + "honest labelling" only)
Don't functionally certify these; confirm they're **reachable or cleanly disabled** and make **no fabricated claims**.
| ID | Module | Check |
|---|---|---|
| D1 [M30] | NPV Calculator | Zero/negative cases don't show fake viable result/NaN |
| D2 [M31] | Finance Model | Outputs labelled **not certified**; rename-only save doesn't wipe other fields (LEAD-05) |
| D3 [M32-34] | Schedule Sync/Monitoring/Dashboard | Import failures handled; simulation labelled as assumptions, not forecast |
| D4 [M37] | Governance Wizard | (see A9) tenant-checked; AI drafts marked for review |
| D5 [M38] | Workflow Builder | "Active" = saved design, **not** executed |
| D6 [M39] | Brainiac | Test counts labelled simulation, not real runs |
| D7 [M40] | OAuthConsent | Reachable only when registered; no unintended grant |

---

## Section E — Cross-cutting (sample every release; full quarterly)
| ID | Test | Expected |
|---|---|---|
| E1 | Force a save to fail (offline/bad input) | **Visible error** — never a silent fail (our global fix) |
| E2 [U03] | Blank / whitespace / long Unicode / HTML-like / zero / negative / reversed dates | Rejected safely in UI **and** backend; renders safely; no NaN/Invalid Date |
| E3 [U06] | No records / slow response / backend error / expired session | No endless spinner, false success, or lost draft |
| E4 [U07] | Export a long report | Correct totals/labels/project; **no cross-client content** |
| E5 [U05] | 390px mobile & 768px tablet | No clipped/overlapping/inaccessible controls |
| E6 [R02] | Two editors save the same record from the same version | Explicit conflict or merge; **no silent lost update** |
| E7 [R04] | 250+ actions: search oldest sentinel, page through filters | Every match once; counts reconcile; no 200 cap |
| E8 [R08] *(quarterly)* | Export then **restore** a small graph + files | Counts, links, hashes, and access all match |

---

## Release decision
- **GO** for a controlled demo/pilot only when **all of Section A passes** and no open P0.
- **Record** per release: build/commit, date, tester, and a count of PASS / FAIL / BLOCKED / N-A **with the denominator** (don't report a % without "out of how many").
- Keep this as your baseline; add a new status column (or copy this into a sheet tab) each release so you can see regressions.
