# CLAUDE.md — Project Governance Hub (PMO Platform)

> **Purpose of this file.** Persistent project memory for AI coding assistants
> (Claude Code and any other model). Read this first in every session to
> understand what this app is, how it's wired, and the conventions to follow.
> It is intentionally self-contained and portable — it assumes no prior chat
> history.

---

## 1. What this is

**Project Governance Hub** (branded in-app as **"PMO Platform"**) is a
**Base44** web application: a project / portfolio management & governance suite
aimed at running capital projects end-to-end — feasibility, finance modeling,
site selection, scheduling, change control, QA/QC, risk, reporting, and an
AI agent layer.

- **Platform:** [Base44](https://base44.com) — a low-code app builder. Any change
  pushed to this repo is also reflected in the Base44 Builder, and vice-versa.
- **Base44 App ID:** `698b0a7d6deefabee8d87716` (see `base44/.app.jsonc`).
- **Stack:** React 18 + Vite 6 + Tailwind CSS 3 + shadcn/ui (new-york style) +
  React Router 6 + TanStack Query 5 + Framer Motion. JavaScript (JSX), **not**
  TypeScript, except a couple of `.ts` util files. `checkJs` is on via
  `jsconfig.json`.
- **Backend / data:** Base44 SDK (`@base44/sdk`). There is **no custom backend
  in this repo** — entities are CRUD'd through `base44.entities.*`. Entity
  schemas live as `.jsonc` files under `base44/entities/`.

## 2. How to run / build / check

```bash
npm install            # install deps
npm run dev            # Vite dev server (Base44 plugin injects HMR/nav notifiers)
npm run build          # production build -> ./dist
npm run preview        # preview the build
npm run lint           # eslint . --quiet
npm run lint:fix       # eslint --fix
npm run typecheck      # tsc -p ./jsconfig.json  (type-checks JS via checkJs)
```

**Environment variables** (create `.env.local`, not committed):

```
VITE_BASE44_APP_ID=<app id>
VITE_BASE44_APP_BASE_URL=<backend base url>
# optional:
VITE_BASE44_FUNCTIONS_VERSION=<version>
```

App params can also arrive via URL query (`?app_id=…&access_token=…`) and are
persisted to `localStorage` — see `src/lib/app-params.js`.

## 3. Architecture & app wiring

- **Entry:** `src/main.jsx` → `src/App.jsx`.
- **`src/App.jsx`** sets up the provider tree:
  `AuthProvider → QueryClientProvider → Router → (DarkModeDetector,
  NavigationTracker, AuthenticatedApp) + Toaster`.
  - `AuthenticatedApp` gates rendering on auth/public-settings loading state and
    renders `UserNotRegisteredError` / redirects to login on `authError`.
  - `AnimatedRoutes` builds routes from `pagesConfig`, wraps each page in
    `Layout` + a Framer Motion `PageTransition`. Unknown paths → `PageNotFound`.
- **Routing is file-based via `src/pages.config.js`** — **AUTO-GENERATED**. Pages
  are auto-registered from `src/pages/*.jsx`. **Do not hand-edit the imports or
  the `PAGES` map.** The *only* manually editable value is `mainPage` (currently
  `"Home"`). URLs are derived from page names by `createPageUrl` in
  `src/utils/index.ts` (spaces → hyphens, leading `/`).
- **`src/Layout.jsx`** is the global chrome: top nav ("PMO Platform"), a Projects
  dropdown (queried via `base44.entities.Project.filter({status:'Active'})`), a
  Tools menu, Brainiac + PMO Agent entries, mobile nav, and a `ProjectSidebar`
  shown when a `?id=<projectId>` is present (hidden on `NewProject`/`Settings`).
  - **Current project context is carried in the URL query param `id`** and
    mirrored to `sessionStorage['pmo_last_project_id']`.
- **Auth:** `src/lib/AuthContext.jsx` checks app public settings and user auth
  against Base44 (`/api/apps/public/...`), exposing `isLoadingAuth`,
  `isLoadingPublicSettings`, `authError` (`auth_required` | `user_not_registered`),
  `navigateToLogin`, etc. `base44Client` is created with `requiresAuth: false`.
- **Data fetching:** TanStack Query everywhere (`src/lib/query-client.js`,
  `queryClientInstance`). Prefer `useQuery`/`useMutation` over ad-hoc fetches.
- **Navigation tracking:** `src/lib/NavigationTracker.jsx` + `src/hooks/useScrollMemory.js`.

## 4. Directory map

```
src/
  App.jsx, Layout.jsx, main.jsx, index.css, pages.config.js (auto-gen)
  api/base44Client.js          # Base44 SDK client (the data layer)
  lib/                         # AuthContext, query-client, app-params,
                               #   NavigationTracker, utils (cn), PageNotFound
  utils/index.ts               # createPageUrl
  hooks/                       # use-mobile, useScrollMemory
  pages/                       # one .jsx per route (auto-registered)
  components/
    ui/                        # shadcn/ui primitives — generated, avoid hand-edits
    <feature>/                 # feature-scoped components (see below)
base44/
  .app.jsonc                   # Base44 app id
  config.jsonc                 # name + install/build/serve commands
  entities/*.jsonc             # 58 entity schemas (the data model)
```

**Feature component folders** (under `src/components/`): `actiontracker`,
`agent`, `brainiac`, `changemanagement`, `dashboard`, `feasibility`,
`financemodel` (+ `tabs/`, `calcEngine.jsx`), `reports`, `scheduledashboard`,
`scheduleintegration`, `siteselection`, `useraccess`.

## 5. Pages (routes)

`ActionTracker, Brainiac, BudgetDashboard, ChangeManagement, ClientBriefing,
FEEDTracker, FeasibilityStudy, FinanceModel, Home (main), NPVCalculator,
NewProject, PMOAgent, ProjectDashboard, QAQCDashboard, Reports, RiskRegister,
ScheduleDashboard, ScheduleMonitoring, ScheduleSync, Settings, SiteSelection,
UserAccess, WeeklyReports`.

## 6. Data model (Base44 entities)

58 entities in `base44/entities/*.jsonc`. Each is a JSON Schema with
`properties`, optional `enum`/`default`, and a `required` array. They are
accessed at runtime as `base44.entities.<Name>` (e.g.
`base44.entities.ActionItem.filter({...}, '-created_date')`,
`.create(...)`, `.update(id, ...)`).

Grouped by domain:

- **Core / org:** `Project`, `Organization`, `PlatformUser`, `PlatformRole`,
  `AuditLog`, `Milestone`.
- **Action tracking:** `ActionItem`, `ActionBucket`, `ActionPhase`,
  `ActionChecklist`, `ActionComment`.
- **Change management:** `ChangeRequest`, `ChangeApproval`,
  `ChangeImpactAssessment`.
- **Risk / quality:** `Risk`, `ScheduleRisk`, `QARecord`, `NonConformity`,
  `QualityGate`.
- **Feasibility / site:** `FeasibilityStudy`, `CandidateSite`, `SiteAssessment`,
  `SiteCriteria`, `FEEDItem`.
- **Finance model:** `FinanceModel`, `RevenueAssumptions`, `BOMAssumptions`,
  `CapexPlan`, `HeadcountPlan`, `OverheadAssumptions`, `OtherOpexAssumptions`,
  `DCFAssumptions`, `TaxAssumptions`, `FinancingAssumptions`, `GrantAssumptions`,
  `WorkingCapitalAssumptions`, `ScrapAssumptions`, `LogisticsAssumptions`,
  `UtilityAssumptions`, `NPVScenario`, `BudgetTracking`.
- **Scheduling:** `ScheduleSource`, `ScheduleVersion`, `ScheduleActivity`,
  `ScheduleTask`, `ScheduleDelta`, `WBSMapping`, `SCurveComment`.
- **Reporting:** `WeeklyReport`, `WeeklyReportSectionConfig`, `DailySiteReport`.
- **AI layer ("Brainiac" / Agent):** `Neuron`, `Synapse`, `SynapseVersion`,
  `SynapseLog`, `ProcessingRule`, `CellConfig`, `AgentConversation`.

> Example shape (`ActionItem`): keyed by `projectId`, has `itemKey` (e.g.
> `YE-001`), `itemType` (Action/Issue/Decision/RFI/Punch List/Risk Action/
> Deliverable), `status`, `priority` (P1–P4), assignment fields, dates,
> `progressPct`, `blocked`/`blockedReason`, cross-links (`changeRequestId`,
> `riskId`, `qualityGate`, `wbsReference`, `milestoneId`), `resolution`,
> `archived`. `required`: `projectId, title, itemType, assignee`.

When changing data shapes, **edit the corresponding `base44/entities/*.jsonc`** —
that file *is* the schema of record.

## 7. Conventions

- **Imports:** path alias `@/*` → `src/*` (see `jsconfig.json`). shadcn aliases:
  `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
- **Styling:** Tailwind utility classes + the `cn()` helper
  (`src/lib/utils.js`, clsx + tailwind-merge). Dark mode is class-based
  (`document.documentElement.classList` toggled by `DarkModeDetector` from the
  OS preference). The app uses a dark navy palette (e.g. `#0F172A` bg,
  `#CADCFC` text accents, `#00A896` highlight).
- **Icons:** `lucide-react`.
- **UI primitives:** shadcn/ui in `src/components/ui/*` are generated — extend or
  compose rather than hand-editing; add new ones via the shadcn workflow.
- **Forms/validation:** `react-hook-form` + `zod` (+ `@hookform/resolvers`).
- **Charts:** `recharts`. **Drag & drop:** `@hello-pangea/dnd`.
  **Rich text:** `react-quill`, `react-markdown`. **PDF/export:** `jspdf`,
  `html2canvas`, `xlsx`. **Maps:** `react-leaflet`. **3D:** `three`.
  **Dates:** `date-fns` (preferred) — `moment` is also present (legacy).
- **State/server cache:** TanStack Query; invalidate relevant query keys after
  mutations rather than refetching manually.
- **Project scoping:** most data is scoped by `projectId`; read it from the `id`
  URL search param (fallback `sessionStorage['pmo_last_project_id']`).

## 8. Working agreements for AI assistants

- **Don't edit auto-generated files** (`src/pages.config.js` beyond `mainPage`,
  `src/components/ui/*`) by hand unless explicitly asked.
- **Match the surrounding code** — JSX, functional components + hooks, Tailwind,
  alias imports. No TypeScript in `.jsx` files.
- **New page** → add `src/pages/<Name>.jsx` (it auto-registers); link to it via
  `createPageUrl('<Name>')`. **New data field** → edit the entity `.jsonc`.
- **Verify before claiming done:** run `npm run lint` and `npm run typecheck`;
  if behavior changed, run `npm run dev` / `npm run build` as appropriate.
- **Git:** develop on the designated feature branch, commit with clear messages,
  push with `git push -u origin <branch>`. Do **not** open PRs unless asked.
- Keep this file current: when you change architecture, add a page, or reshape
  the data model, update the relevant section here.

## 9. Quick reference

| Need | Where |
| --- | --- |
| Add/important wiring | `src/App.jsx` |
| Global nav / chrome / project context | `src/Layout.jsx` |
| Routes (auto) / landing page | `src/pages.config.js` (`mainPage`) |
| Data access | `base44.entities.*` via `src/api/base44Client.js` |
| Data schema | `base44/entities/<Entity>.jsonc` |
| Auth state | `src/lib/AuthContext.jsx` |
| App config / build commands | `base44/config.jsonc`, `package.json` |
| URL helper | `createPageUrl` in `src/utils/index.ts` |
| classnames helper | `cn` in `src/lib/utils.js` |
