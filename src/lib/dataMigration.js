/**
 * dataMigration.js — one-off Base44 → Supabase data copy.
 *
 * Runs in the browser (where the app already holds a Base44 session and can
 * reach Supabase with the anon key). For each entity it reads all records from
 * Base44 and upserts them into the matching Supabase table, keeping the same
 * `id` so it is idempotent and safe to re-run.
 *
 * Only whitelisted columns (matching 0002_core_schema.sql) are copied, so stray
 * Base44 internal fields don't break the insert. Empty strings are coerced to
 * null so date/numeric columns accept them.
 */
import { base44 } from '@/api/base44Client';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

// entity -> { table, columns } (columns mirror 0002_core_schema.sql)
export const MIGRATION_SPEC = {
  Project: {
    table: 'project',
    columns: ['id', 'projectName', 'clientName', 'projectType', 'currentPhase', 'status',
      'projectOwner', 'totalBudgetEurM', 'startDate', 'targetCompletion', 'healthScore',
      'notes', 'created_date', 'updated_date'],
  },
  Risk: {
    table: 'risk',
    columns: ['id', 'projectId', 'riskDescription', 'category', 'probability', 'impact',
      'mitigationPlan', 'owner', 'targetClosureDate', 'riskScore', 'riskLevel', 'status',
      'created_date', 'updated_date'],
  },
  Milestone: {
    table: 'milestone',
    columns: ['id', 'projectId', 'phaseName', 'completionPercent', 'status', 'dueDate',
      'notes', 'created_date', 'updated_date'],
  },
  QualityGate: {
    table: 'quality_gate',
    columns: ['id', 'projectId', 'gateNumber', 'gateName', 'phase', 'status', 'completionDate',
      'dueDate', 'decisionDate', 'decisionAuthority', 'reserves', 'reservesDueDate',
      'reservesResolved', 'evidenceNotes', 'nextGateCriteria', 'created_date', 'updated_date'],
  },
  NonConformity: {
    table: 'non_conformity',
    columns: ['id', 'projectId', 'ncNumber', 'description', 'severity', 'status', 'detectedDate',
      'detectedBy', 'assignedTo', 'targetCloseDate', 'correctiveAction', 'created_date', 'updated_date'],
  },
  QARecord: {
    table: 'qa_record',
    columns: ['id', 'projectId', 'recordType', 'testName', 'equipmentSystem', 'status',
      'scheduledDate', 'location', 'inspector', 'vendor', 'notes', 'ncCount', 'findings',
      'created_date', 'updated_date'],
  },
  ChangeRequest: {
    table: 'change_request',
    columns: ['id', 'projectId', 'crNumber', 'title', 'description', 'category', 'subCategory',
      'priority', 'changeType', 'origin', 'raisedBy', 'raisedDate', 'requiredByDate',
      'affectedModules', 'affectedWbs', 'notes', 'status', 'created_date', 'updated_date'],
  },
  BudgetTracking: {
    table: 'budget_tracking',
    columns: ['id', 'projectId', 'month', 'category', 'plannedEurK', 'actualEurK', 'varianceEurK',
      'variancePercent', 'varianceStatus', 'created_date', 'updated_date'],
  },
};

export const MIGRATION_ENTITIES = Object.keys(MIGRATION_SPEC);

function pickColumns(record, columns) {
  const out = {};
  for (const col of columns) {
    let v = record[col];
    if (v === '' || v === undefined) v = null; // date/numeric cols reject ''
    out[col] = v;
  }
  return out;
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

/**
 * Copy one entity. Returns { entity, read, written, error }.
 * onProgress(partial) is called as batches complete.
 */
export async function migrateEntity(entity, { onProgress } = {}) {
  if (!isSupabaseConfigured) {
    return { entity, read: 0, written: 0, error: 'Supabase not configured (VITE_SUPABASE_ANON_KEY missing)' };
  }
  const spec = MIGRATION_SPEC[entity];
  try {
    const records = await base44.entities[entity].list();
    const rows = records.map((r) => pickColumns(r, spec.columns));
    let written = 0;
    for (const batch of chunk(rows, 500)) {
      const { error } = await supabase.from(spec.table).upsert(batch, { onConflict: 'id' });
      if (error) throw error;
      written += batch.length;
      onProgress?.({ entity, read: records.length, written });
    }
    return { entity, read: records.length, written, error: null };
  } catch (e) {
    return { entity, read: 0, written: 0, error: e.message || String(e) };
  }
}

/** Copy all core entities in dependency order (Project first). */
export async function migrateAll({ onProgress } = {}) {
  const results = [];
  for (const entity of MIGRATION_ENTITIES) {
    const res = await migrateEntity(entity, { onProgress });
    results.push(res);
    onProgress?.({ ...res, done: true });
  }
  return results;
}
