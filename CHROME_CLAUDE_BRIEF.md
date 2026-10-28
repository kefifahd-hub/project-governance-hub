# Paste this into Claude for Chrome (one time, at the start)

> Copy everything between the lines below and paste it as your **first message** to
> Claude in the Chrome side-panel, with the BuildMind tab open. It tells that Claude
> what the app is, what it may touch, and exactly what to build. Then let it work.

---

You are helping me seed **synthetic test data** into a project-governance web app so I
can QA it. Work only in the browser tab I have open.

**The app**
- It's "Project Governance Hub" (built on Base44), live at **buildmindnetwork.com**.
- I'm already signed in as **buildmind.clt@gmail.com**.
- My active organization is **"Test"**. This is a throwaway org for testing — everything
  you create here is fake sample data, not real client data. That's intended.
- New projects are created with the **"+ New Project"** button (top of the Projects /
  Home area). Child items (actions, risks, etc.) are created from inside each project's
  tools (Action Tracker, Risk Register, Project Charter, Weekly Reports, Budget, etc.).

**Ground rules**
1. Only ever work inside the **"Test"** organization. If you ever see data that looks
   like a real company or client, **stop and tell me** — do not edit or delete it.
2. Never change account settings, users, roles, passwords, org settings, or billing.
   Never click "Publish". You are only entering project data through the normal screens.
3. Create, don't delete. If something already exists, leave it; just add the new items.
4. Go one project at a time. After each project, give me a one-line confirmation of what
   you created (name + that it saved), then move to the next.
5. If a field is required and you're unsure, use a sensible placeholder and note it to me.
   If a screen behaves oddly (error, blank save, "Invalid Date", a spinner that never
   ends), **screenshot it / describe it to me** — those are exactly the bugs I'm hunting.

**Task 1 — create these 6 projects** (use "+ New Project" for each). Vary the industry,
phase, and status as shown so I get a realistic mix:

| # | Project name | Type / industry | Phase | Status |
|---|---|---|---|---|
| 1 | Atlas Battery Gigafactory | Battery manufacturing | Construction | Active |
| 2 | Kestrel Copper Mine | Mining | Feasibility | Planning |
| 3 | Meridian BESS Park | Battery energy storage (BESS) | FEED | Active |
| 4 | Northwind Data Center | Data center | Commissioning | Active |
| 5 | Ironclad Steel Plant | Steel / heavy industry | Detailed Engineering | On Hold |
| 6 | Solara Renewables Hub | Renewables (solar/wind) | Start of Production | Complete |

Give each a short description and a plausible budget (e.g. €50M–€2B range, varied). Fill
any other required fields with reasonable values. Confirm each one saved before moving on.

**Task 2 — add child data (only after all 6 projects exist).** Pick **2 or 3** of the
Active projects and, inside each, add a bit of real-world-looking content so the tools
have something to show:
- **Action Tracker:** 3–4 actions, with at least **one overdue** (due date in the past)
  and one due this week. Mix of owners and priorities.
- **Risk Register:** 2–3 risks at different probability/impact levels.
- **Project Charter:** fill the basics (objectives, scope, sponsor) and save as draft.
- **Weekly Report:** create one weekly report with a status note.
- **Budget:** 2–3 budget lines if the screen allows it.
- **Milestones:** 2–3 milestones with dates.

**When you're done**, give me a short summary: which projects you created, which ones you
added child data to, and anything that looked broken or confusing while you worked. I'll
take that list back to my other Claude session, which is tracking all of this.

---

_Note to myself (not for the Chrome Claude): this file lives in the repo so I can re-use
the brief. The other Claude session (the one with our full history and the Google Sheet
tracker) stays the source of truth — I'll paste the Chrome Claude's summary back there so
it records results and updates the QA checklist._
