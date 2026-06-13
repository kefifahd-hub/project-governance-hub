-- Core schema for the Project Governance Hub (migration off Base44).
--
-- Design choices:
--  * Column names match the app's camelCase fields exactly (quoted identifiers),
--    so src/api/db.js is a true drop-in — no field renaming across the app.
--  * `id` is TEXT with a uuid default, so existing Base44 record ids (which are
--    not necessarily uuids) import cleanly, while new rows still get a uuid.
--  * created_date / updated_date follow the Base44 convention the app sorts on.
--  * RLS is enabled with an authenticated read/write policy; tighten to
--    org/project membership once auth is migrated to Supabase.
--
-- Run in the Supabase SQL editor or via `supabase db push`.

-- Shared trigger to keep updated_date fresh ---------------------------------
create or replace function public.set_updated_date()
returns trigger language plpgsql as $$
begin
  new."updated_date" = now();
  return new;
end;
$$;

-- PROJECT -------------------------------------------------------------------
create table if not exists public.project (
  "id"                text primary key default gen_random_uuid()::text,
  "projectName"       text,
  "clientName"        text,
  "projectType"       text,            -- Battery Gigafactory | Data Center | Other
  "currentPhase"      text,            -- Feasibility … SOP (see lifecycle.js)
  "status"            text default 'Active',  -- Active | On Hold | Completed | Cancelled
  "projectOwner"      text,
  "totalBudgetEurM"   numeric,
  "startDate"         date,
  "targetCompletion"  date,
  "healthScore"       numeric default 75,
  "notes"             text,
  "created_date"      timestamptz not null default now(),
  "updated_date"      timestamptz not null default now()
);

-- RISK ----------------------------------------------------------------------
create table if not exists public.risk (
  "id"                 text primary key default gen_random_uuid()::text,
  "projectId"          text references public.project("id") on delete cascade,
  "riskDescription"    text,
  "category"           text,           -- Technical | Financial | Schedule | Regulatory | Environmental | Safety
  "probability"        integer,        -- 1..3
  "impact"             integer,        -- 1..3
  "mitigationPlan"     text,
  "owner"              text,
  "targetClosureDate"  date,
  "riskScore"          integer,        -- computed probability*impact
  "riskLevel"          text,           -- Critical | High | Medium | Low (computed)
  "status"             text default 'Open',  -- Open | In Progress | Mitigated | Closed
  "created_date"       timestamptz not null default now(),
  "updated_date"       timestamptz not null default now()
);

-- MILESTONE -----------------------------------------------------------------
create table if not exists public.milestone (
  "id"                 text primary key default gen_random_uuid()::text,
  "projectId"          text references public.project("id") on delete cascade,
  "phaseName"          text,
  "completionPercent"  numeric default 0,
  "status"             text default 'Pending',  -- Pending | Active | Complete
  "dueDate"            date,
  "notes"              text,
  "created_date"       timestamptz not null default now(),
  "updated_date"       timestamptz not null default now()
);

-- QUALITY GATE --------------------------------------------------------------
create table if not exists public.quality_gate (
  "id"                 text primary key default gen_random_uuid()::text,
  "projectId"          text references public.project("id") on delete cascade,
  "gateNumber"         integer,
  "gateName"           text,
  "phase"              text,
  "status"             text default 'Not Reached',
  "completionDate"     date,
  "dueDate"            date,
  "decisionDate"       date,
  "decisionAuthority"  text,
  "reserves"           text,
  "reservesDueDate"    date,
  "reservesResolved"   boolean default false,
  "evidenceNotes"      text,
  "nextGateCriteria"   text,
  "created_date"       timestamptz not null default now(),
  "updated_date"       timestamptz not null default now()
);

-- NON-CONFORMITY ------------------------------------------------------------
create table if not exists public.non_conformity (
  "id"                 text primary key default gen_random_uuid()::text,
  "projectId"          text references public.project("id") on delete cascade,
  "ncNumber"           text,
  "description"        text,
  "severity"           text,           -- Minor | Major | Critical
  "status"             text default 'Open',  -- Open | In Progress | Closed
  "detectedDate"       date,
  "detectedBy"         text,
  "assignedTo"         text,
  "targetCloseDate"    date,
  "correctiveAction"   text,
  "created_date"       timestamptz not null default now(),
  "updated_date"       timestamptz not null default now()
);

-- QA RECORD -----------------------------------------------------------------
create table if not exists public.qa_record (
  "id"                 text primary key default gen_random_uuid()::text,
  "projectId"          text references public.project("id") on delete cascade,
  "recordType"         text,           -- FAT | SAT | Inspection | Audit | Commissioning Test | Other
  "testName"           text,
  "equipmentSystem"    text,
  "status"             text,           -- Scheduled | In Progress | Passed | Failed | Conditional Pass
  "scheduledDate"      date,
  "location"           text,
  "inspector"          text,
  "vendor"             text,
  "notes"              text,
  "ncCount"            integer default 0,
  "findings"           text,
  "created_date"       timestamptz not null default now(),
  "updated_date"       timestamptz not null default now()
);

-- CHANGE REQUEST ------------------------------------------------------------
create table if not exists public.change_request (
  "id"                 text primary key default gen_random_uuid()::text,
  "projectId"          text references public.project("id") on delete cascade,
  "crNumber"           text,
  "title"              text,
  "description"        text,
  "category"           text,
  "subCategory"        text,
  "priority"           text,           -- Critical | High | Medium | Low
  "changeType"         text,
  "origin"             text,
  "raisedBy"           text,
  "raisedDate"         date,
  "requiredByDate"     date,
  "affectedModules"    text,           -- comma-joined string (not array)
  "affectedWbs"        text,
  "notes"              text,
  "status"             text default 'Draft',
  "created_date"       timestamptz not null default now(),
  "updated_date"       timestamptz not null default now()
);

-- BUDGET TRACKING -----------------------------------------------------------
create table if not exists public.budget_tracking (
  "id"                 text primary key default gen_random_uuid()::text,
  "projectId"          text references public.project("id") on delete cascade,
  "month"              text,           -- "YYYY-MM"
  "category"           text,
  "plannedEurK"        numeric,
  "actualEurK"         numeric,
  "varianceEurK"       numeric,
  "variancePercent"    numeric,
  "varianceStatus"     text,
  "created_date"       timestamptz not null default now(),
  "updated_date"       timestamptz not null default now()
);

-- Indexes on the projectId foreign keys -------------------------------------
create index if not exists risk_project_idx           on public.risk("projectId");
create index if not exists milestone_project_idx       on public.milestone("projectId");
create index if not exists quality_gate_project_idx     on public.quality_gate("projectId");
create index if not exists non_conformity_project_idx   on public.non_conformity("projectId");
create index if not exists qa_record_project_idx        on public.qa_record("projectId");
create index if not exists change_request_project_idx   on public.change_request("projectId");
create index if not exists budget_tracking_project_idx  on public.budget_tracking("projectId");

-- RLS + updated_date triggers for every table -------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'project','risk','milestone','quality_gate','non_conformity',
    'qa_record','change_request','budget_tracking'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_rw', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true);',
      t || '_rw', t
    );
    execute format('drop trigger if exists %I on public.%I;', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_date();',
      t || '_touch', t
    );
  end loop;
end $$;
