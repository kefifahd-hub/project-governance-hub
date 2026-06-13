import { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Loader2, Cloud, CloudOff, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isSupabaseConfigured } from '@/api/supabaseClient';
import { MIGRATION_ENTITIES, migrateEntity, migrateAll } from '../lib/dataMigration';

const cardStyle = { background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' };

export default function SupabaseMigration() {
  const [results, setResults] = useState({}); // entity -> { read, written, error, running }
  const [busy, setBusy] = useState(false);

  const setOne = (entity, patch) =>
    setResults((r) => ({ ...r, [entity]: { ...r[entity], ...patch } }));

  const runOne = async (entity) => {
    setOne(entity, { running: true, error: null });
    const res = await migrateEntity(entity, { onProgress: (p) => setOne(entity, p) });
    setOne(entity, { ...res, running: false });
  };

  const runAll = async () => {
    setBusy(true);
    MIGRATION_ENTITIES.forEach((e) => setOne(e, { running: true, error: null }));
    await migrateAll({
      onProgress: (p) => setOne(p.entity, { ...p, running: !p.done }),
    });
    setBusy(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <Database className="w-7 h-7" style={{ color: '#00A896' }} />
            <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>Base44 → Supabase Migration</h1>
          </div>
          <p className="mt-2" style={{ color: '#94A3B8' }}>
            Copies your existing records from Base44 into Supabase, keeping the same ids
            (safe to re-run). Run this once per environment after the schema is applied.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-sm">
            {isSupabaseConfigured
              ? <><Cloud className="w-4 h-4" style={{ color: '#10B981' }} /><span style={{ color: '#10B981' }}>Supabase connected</span></>
              : <><CloudOff className="w-4 h-4" style={{ color: '#EF4444' }} /><span style={{ color: '#EF4444' }}>Supabase not configured — set VITE_SUPABASE_ANON_KEY</span></>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {!isSupabaseConfigured && (
          <Card className="mb-6" style={{ ...cardStyle, borderColor: 'rgba(239,68,68,0.3)' }}>
            <CardContent className="p-5 text-sm" style={{ color: '#94A3B8' }}>
              Add <code style={{ color: '#CADCFC' }}>VITE_SUPABASE_ANON_KEY</code> (and run the SQL
              migrations in <code style={{ color: '#CADCFC' }}>supabase/migrations/</code>) before migrating.
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: '#CADCFC' }}>Core entities</h2>
          <Button onClick={runAll} disabled={!isSupabaseConfigured || busy}
            style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
            Migrate all
          </Button>
        </div>

        <div className="space-y-2">
          {MIGRATION_ENTITIES.map((entity) => {
            const r = results[entity] || {};
            return (
              <Card key={entity} style={cardStyle}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: '#CADCFC' }}>{entity}</div>
                    {(r.read != null || r.error) && (
                      <div className="text-xs mt-0.5" style={{ color: r.error ? '#EF4444' : '#94A3B8' }}>
                        {r.error ? r.error : `${r.written ?? 0} of ${r.read ?? 0} records copied`}
                      </div>
                    )}
                  </div>
                  {r.running && <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#00A896' }} />}
                  {!r.running && r.error && <AlertCircle className="w-4 h-4" style={{ color: '#EF4444' }} />}
                  {!r.running && !r.error && r.written != null && (
                    <Badge style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />Done
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => runOne(entity)}
                    disabled={!isSupabaseConfigured || r.running || busy} style={{ color: '#CADCFC' }}>
                    Migrate
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
