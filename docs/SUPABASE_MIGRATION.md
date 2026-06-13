# Migration off Base44 onto Supabase

The platform is moving its data layer from Base44 to Supabase (project
`ogkyhfspocplkoxftqkd`), served from `portal.buildmind-group.com`. The migration is
**incremental** — the app keeps working throughout; entities move one at a time.

## How it works

All data access goes through a single adapter, [`src/api/db.js`](../src/api/db.js), which
exposes the **same API as the Base44 SDK**:

```js
import { db } from '@/api/db';
await db.entities.Risk.filter({ projectId });   // filter / list / create / update / delete / bulkCreate / upsert
db.auth.me();                                   // auth + integrations still via Base44 for now
```

Each entity is routed to a backend by two maps in `db.js`:

- `ENTITY_SOURCE` — `'base44'` (default) or `'supabase'`
- `ENTITY_TABLE` — entity → Supabase table name (defaults to `snake_case` of the entity)

Because the default is `base44`, **nothing breaks** until you explicitly migrate an entity.

## Migrating an entity (the loop)

1. Ensure the Supabase table exists with matching columns (camelCase columns must be quoted,
   or map to `snake_case`).
2. In `db.js`, set `ENTITY_SOURCE.Risk = 'supabase'` and, if the table name differs,
   `ENTITY_TABLE.Risk = 'risks'`.
3. In the pages that use it, change the import from `@/api/base44Client` (`base44`) to
   `@/api/db` (`db`). 66 files currently import `base44`; migrate them as their entities move.
4. Verify, commit.

## Configuration

Set in `.env.local` (see [`.env.example`](../.env.example)):

```
VITE_SUPABASE_URL=https://ogkyhfspocplkoxftqkd.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable anon key>   # NEVER the service_role key
```

If `VITE_SUPABASE_ANON_KEY` is unset, `isSupabaseConfigured` is false and Supabase-routed
features fall back gracefully (e.g. the Process Library checklist saves to `localStorage`).

## SQL migrations

Versioned SQL lives in [`supabase/migrations/`](../supabase/migrations). Run via the Supabase
SQL editor or `supabase db push`.

- `0001_gate_governance.sql` — `gate_checklist_state` table (gate-readiness persistence, RLS,
  `updated_at` trigger). This is the first table created natively for Supabase.

## Status

| Concern | Backend |
|---------|---------|
| New governance tables (`gate_checklist_state`) | **Supabase** |
| Process Library checklist persistence | **Supabase** (localStorage fallback) |
| All existing entities (Project, Risk, …) | Base44 (route to Supabase as migrated) |
| Auth & integrations (InvokeLLM, UploadFile) | Base44 (migrate to Supabase Auth later) |

## Not yet done

- Migrate the ~55 existing entities table-by-table (flip `ENTITY_SOURCE`, swap imports).
- Move auth from Base44 to Supabase Auth (`AuthContext`).
- Move `integrations.Core.InvokeLLM` / `UploadFile` to Supabase Edge Functions / Storage.
