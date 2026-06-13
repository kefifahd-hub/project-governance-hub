import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Search, ChevronDown, ChevronRight, CheckCircle2, Circle,
  ListChecks, FileText, ArrowUpRight, Target,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createPageUrl } from '../utils';
import { LIFECYCLE_PHASES, QUALITY_GATES, getPhase } from '../lib/lifecycle';
import { orderedLibrary, searchLibrary } from '../lib/processLibrary';

const cardStyle = { background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' };

// localStorage-backed checklist state (durable per project, no backend entity needed)
function storageKey(projectId) {
  return `pmo_checklist_${projectId || 'global'}`;
}
function loadChecks(projectId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(projectId)) || '{}');
  } catch {
    return {};
  }
}

export default function ProcessLibrary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});
  const [checks, setChecks] = useState(() => loadChecks(projectId));

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => { const r = await base44.entities.Project.filter({ id: projectId }); return r[0]; },
    enabled: !!projectId,
  });

  const currentPhaseKey = getPhase(project?.currentPhase)?.key;
  const entries = useMemo(() => orderedLibrary(), []);
  const results = useMemo(() => (query ? searchLibrary(query) : []), [query]);

  // Auto-expand the project's current phase once it's known
  useEffect(() => {
    if (currentPhaseKey) setExpanded((e) => ({ ...e, [currentPhaseKey]: true }));
  }, [currentPhaseKey]);

  // Persist checklist state
  useEffect(() => {
    localStorage.setItem(storageKey(projectId), JSON.stringify(checks));
  }, [checks, projectId]);

  const isChecked = (clId, itemId) => !!checks[`${clId}.${itemId}`];
  const toggle = (clId, itemId) =>
    setChecks((c) => ({ ...c, [`${clId}.${itemId}`]: !c[`${clId}.${itemId}`] }));

  // Mandatory-item completion drives gate readiness
  const checklistReadiness = (cl) => {
    const mandatory = cl.items.filter((i) => i.mandatory);
    const done = mandatory.filter((i) => isChecked(cl.id, i.id)).length;
    return { done, total: mandatory.length, pct: mandatory.length ? Math.round((done / mandatory.length) * 100) : 100 };
  };

  const toggleExpand = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7" style={{ color: '#00A896' }} />
            <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>Process & Procedure Library</h1>
          </div>
          <p className="mt-2" style={{ color: '#94A3B8' }}>
            The processes, procedures and gate checklists for every phase of the industrialization lifecycle.
            {project ? ` Current project phase: ` : ''}
            {project && <span style={{ color: '#00A896' }}>{getPhase(project.currentPhase)?.label || project.currentPhase}</span>}
          </p>

          <div className="mt-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search procedures and checklist items…"
              className="pl-9"
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Search results */}
        {query ? (
          <div className="space-y-2">
            <p className="text-sm mb-2" style={{ color: '#94A3B8' }}>{results.length} result(s) for “{query}”</p>
            {results.map((r, i) => (
              <Card key={i} style={cardStyle}>
                <CardContent className="p-4 flex items-center gap-3">
                  {r.kind === 'procedure' ? <FileText className="w-4 h-4" style={{ color: '#00A896' }} /> : <ListChecks className="w-4 h-4" style={{ color: '#F59E0B' }} />}
                  <div className="flex-1">
                    <div style={{ color: '#CADCFC' }}>{r.title}</div>
                    <div className="text-xs" style={{ color: '#94A3B8' }}>{r.phase} · QG{r.gate} · {r.kind}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Phase-by-phase library */
          <div className="space-y-3">
            {entries.map((entry) => {
              const phaseMeta = LIFECYCLE_PHASES.find((p) => p.key === entry.phase);
              const gate = QUALITY_GATES.find((g) => g.number === entry.gate);
              const isCurrent = entry.phase === currentPhaseKey;
              const open = !!expanded[entry.phase];
              const Chevron = open ? ChevronDown : ChevronRight;
              return (
                <Card key={entry.phase} style={{ ...cardStyle, ...(isCurrent ? { borderColor: 'rgba(0,168,150,0.5)' } : {}) }}>
                  <CardContent className="p-0">
                    {/* Phase header */}
                    <button onClick={() => toggleExpand(entry.phase)} className="w-full text-left p-5 flex items-center gap-3">
                      <Chevron className="w-5 h-5 shrink-0" style={{ color: '#64748b' }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold" style={{ color: '#CADCFC' }}>{phaseMeta?.label || entry.phase}</span>
                          {isCurrent && <Badge style={{ background: 'rgba(0,168,150,0.2)', color: '#00A896' }}>Current phase</Badge>}
                        </div>
                        <div className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>{entry.overview}</div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-1" style={{ color: '#00A896' }}>
                        <Target className="w-4 h-4" />
                        <span className="text-sm font-bold">{gate?.name}</span>
                      </div>
                    </button>

                    {open && (
                      <div className="px-5 pb-5 space-y-5">
                        {/* Procedures */}
                        {entry.procedures.map((proc) => (
                          <div key={proc.id} className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.4)' }}>
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#00A896' }} />
                              <div className="flex-1">
                                <div className="font-semibold" style={{ color: '#CADCFC' }}>{proc.title}</div>
                                <div className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>{proc.purpose}</div>
                                <div className="text-xs mt-1" style={{ color: '#64748b' }}>Owner: {proc.owner}</div>
                                <ol className="mt-3 space-y-1 list-decimal list-inside">
                                  {proc.steps.map((s, i) => (
                                    <li key={i} className="text-sm" style={{ color: '#CADCFC' }}>{s}</li>
                                  ))}
                                </ol>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {proc.outputs.map((o) => (
                                    <Badge key={o} style={{ background: 'rgba(202,220,252,0.1)', color: '#94A3B8' }}>{o}</Badge>
                                  ))}
                                </div>
                                {proc.relatedTool && projectId && (
                                  <button
                                    onClick={() => navigate(createPageUrl(`${proc.relatedTool}?id=${projectId}`))}
                                    className="mt-3 text-xs flex items-center gap-1"
                                    style={{ color: '#00A896' }}
                                  >
                                    Open {proc.relatedTool} <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Checklists */}
                        {entry.checklists.map((cl) => {
                          const r = checklistReadiness(cl);
                          return (
                            <div key={cl.id} className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.4)' }}>
                              <div className="flex items-center gap-2 mb-3">
                                <ListChecks className="w-4 h-4 shrink-0" style={{ color: '#F59E0B' }} />
                                <span className="font-semibold flex-1" style={{ color: '#CADCFC' }}>{cl.title}</span>
                                <span className="text-xs" style={{ color: r.pct === 100 ? '#10B981' : '#94A3B8' }}>
                                  {r.done}/{r.total} mandatory
                                </span>
                              </div>
                              <Progress value={r.pct} className="h-1.5 mb-3" />
                              <div className="space-y-1.5">
                                {cl.items.map((item) => {
                                  const checked = isChecked(cl.id, item.id);
                                  return (
                                    <div key={item.id} className="flex items-center gap-2.5">
                                      <button onClick={() => toggle(cl.id, item.id)} className="shrink-0">
                                        {checked
                                          ? <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                                          : <Circle className="w-4 h-4" style={{ color: '#64748b' }} />}
                                      </button>
                                      <span className="flex-1 text-sm" style={{ color: checked ? '#64748b' : '#CADCFC', textDecoration: checked ? 'line-through' : 'none' }}>
                                        {item.text}
                                      </span>
                                      {item.mandatory && <Badge style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 10 }}>required</Badge>}
                                      {item.relatedTool && projectId && (
                                        <button onClick={() => navigate(createPageUrl(`${item.relatedTool}?id=${projectId}`))} title={`Open ${item.relatedTool}`}>
                                          <ArrowUpRight className="w-3.5 h-3.5" style={{ color: '#00A896' }} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
