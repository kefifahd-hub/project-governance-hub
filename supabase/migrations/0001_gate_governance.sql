-- Gate governance: persists gate-readiness checklist state per project.
-- Replaces the localStorage-only persistence in the Process & Procedure Library
-- and underpins roadmap item D (gate readiness from live + manual signals).
--
-- Run in the Supabase SQL editor (or via `supabase db push`).

create table if not exists public.gate_checklist_state (
  id            uuid primary key default gen_random_uuid(),
  project_id    text not null,
  checklist_id  text not null,
  item_id       text not null,
  checked       boolean not null default false,
  checked_by    text,
  updated_at    timestamptz not null default now(),
  unique (project_id, checklist_id, item_id)
);

create index if not exists gate_checklist_state_project_idx
  on public.gate_checklist_state (project_id);

-- Row Level Security: enable and allow authenticated users to read/write.
-- Tighten to org/project membership once the auth model is migrated to Supabase.
alter table public.gate_checklist_state enable row level security;

drop policy if exists gate_checklist_state_rw on public.gate_checklist_state;
create policy gate_checklist_state_rw
  on public.gate_checklist_state
  for all
  to authenticated
  using (true)
  with check (true);

-- Keep updated_at fresh on writes.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gate_checklist_state_touch on public.gate_checklist_state;
create trigger gate_checklist_state_touch
  before update on public.gate_checklist_state
  for each row execute function public.set_updated_at();
