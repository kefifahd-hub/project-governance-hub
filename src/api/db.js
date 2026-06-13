import { base44 } from './base44Client';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * db — incremental data-access layer for the migration off Base44 onto Supabase.
 *
 * It exposes the SAME shape as the Base44 SDK (`db.entities.X.filter/list/
 * create/update/delete/bulkCreate`, `db.auth`, `db.integrations`) so migrating a
 * page is a one-line import swap: `base44` -> `db`.
 *
 * Each entity is routed to a backend via ENTITY_SOURCE:
 *   - 'base44'   (default) — not yet migrated, keeps working as-is
 *   - 'supabase' — migrated, or a new governance table that only lives in Supabase
 *
 * Migrate an entity by adding it to ENTITY_SOURCE/ENTITY_TABLE — no page changes
 * beyond swapping the import. If a 'supabase' entity is requested while Supabase
 * is not configured, the call throws a clear error so callers can fall back.
 */

// entity -> backend. Add entries here as tables are migrated to Supabase.
// Flip an entity to 'supabase' only AFTER its table exists (0002_core_schema.sql)
// and its data has been imported — otherwise reads return empty.
const ENTITY_SOURCE = {
  GateChecklistState: 'supabase', // new governance table (roadmap D), Supabase-only
  // Project: 'supabase',   // <- uncomment per entity once schema applied + data migrated
  // Risk: 'supabase',
  // Milestone: 'supabase',
  // QualityGate: 'supabase',
  // NonConformity: 'supabase',
  // QARecord: 'supabase',
  // ChangeRequest: 'supabase',
  // BudgetTracking: 'supabase',
};

// entity -> Supabase table name (columns match the app's camelCase fields).
const ENTITY_TABLE = {
  GateChecklistState: 'gate_checklist_state',
  Project: 'project',
  Risk: 'risk',
  Milestone: 'milestone',
  QualityGate: 'quality_gate',
  NonConformity: 'non_conformity',
  QARecord: 'qa_record',
  ChangeRequest: 'change_request',
  BudgetTracking: 'budget_tracking',
};

const toSnake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
const tableFor = (name) => ENTITY_TABLE[name] || toSnake(name);
const sourceFor = (name) => ENTITY_SOURCE[name] || 'base44';

// --- Supabase implementation of the Base44 entity interface ---------------
function supabaseEntity(name) {
  const table = tableFor(name);
  const guard = () => {
    if (!isSupabaseConfigured) {
      throw new Error(
        `Supabase is not configured (VITE_SUPABASE_ANON_KEY missing) but entity "${name}" is routed to Supabase.`
      );
    }
  };
  const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
  };
  return {
    async filter(query = {}, sort) {
      guard();
      let q = supabase.from(table).select('*');
      for (const [k, v] of Object.entries(query)) q = q.eq(k, v);
      if (sort) q = q.order(sort.replace(/^-/, ''), { ascending: !sort.startsWith('-') });
      return unwrap(await q) || [];
    },
    list(sort) {
      return this.filter({}, sort);
    },
    async create(obj) {
      guard();
      return unwrap(await supabase.from(table).insert(obj).select().single());
    },
    async bulkCreate(arr) {
      guard();
      return unwrap(await supabase.from(table).insert(arr).select()) || [];
    },
    async update(id, obj) {
      guard();
      return unwrap(await supabase.from(table).update(obj).eq('id', id).select().single());
    },
    async delete(id) {
      guard();
      return unwrap(await supabase.from(table).delete().eq('id', id));
    },
    async upsert(obj, onConflict) {
      guard();
      return unwrap(
        await supabase.from(table).upsert(obj, onConflict ? { onConflict } : undefined).select()
      );
    },
  };
}

const entities = new Proxy(
  {},
  {
    get(_target, name) {
      if (typeof name !== 'string') return undefined;
      return sourceFor(name) === 'supabase' ? supabaseEntity(name) : base44.entities[name];
    },
  }
);

export const db = {
  entities,
  // Auth + integrations still served by Base44 during the incremental migration.
  auth: base44.auth,
  integrations: base44.integrations,
  isSupabaseConfigured,
};

export { isSupabaseConfigured };
