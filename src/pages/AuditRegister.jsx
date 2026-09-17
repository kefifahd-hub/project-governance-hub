import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, SearchX, ClipboardCheck, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AuditDialog from '@/components/audit/AuditDialog';
import FindingDialog from '@/components/audit/FindingDialog';

const SEVERITIES = ['Major', 'Minor', 'Observation', 'Opportunity'];
const FINDING_STATUSES = ['Open', 'Actioned', 'Verified', 'Closed'];

const sevColor = (s) => ({
  Major: 'bg-red-500/20 text-red-400',
  Minor: 'bg-amber-500/20 text-amber-400',
  Observation: 'bg-blue-500/20 text-blue-400',
  Opportunity: 'bg-emerald-500/20 text-emerald-400',
}[s] || 'bg-slate-500/20 text-slate-400');

const isOverdue = (f) => f.dueDate && f.status !== 'Closed' && new Date(f.dueDate) < new Date(new Date().toDateString());

export default function AuditRegister() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState(null);
  const [findingDialogOpen, setFindingDialogOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState(null);
  const [findingFilters, setFindingFilters] = useState({});

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => { const r = await base44.entities.Project.filter({ id: projectId }); return r[0]; },
    enabled: !!projectId,
  });

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['audits', projectId],
    queryFn: () => base44.entities.Audit.filter({ projectId }, '-auditDate', 100),
    enabled: !!projectId,
  });

  const { data: allFindings = [] } = useQuery({
    queryKey: ['auditFindings', selectedAuditId],
    queryFn: () => base44.entities.AuditFinding.filter({ auditId: selectedAuditId }, '-created_date', 200),
    enabled: !!selectedAuditId,
  });

  const selectedAudit = audits.find(a => a.id === selectedAuditId) || null;
  const overdueCount = allFindings.filter(isOverdue).length;

  const findings = allFindings.filter(f => {
    if (findingFilters.severity && f.severity !== findingFilters.severity) return false;
    if (findingFilters.status && f.status !== findingFilters.status) return false;
    return true;
  });

  const openNewAudit = () => { setEditingAudit(null); setAuditDialogOpen(true); };
  const openEditAudit = (a) => { setEditingAudit(a); setAuditDialogOpen(true); };
  const openNewFinding = () => { setEditingFinding(null); setFindingDialogOpen(true); };
  const openEditFinding = (f) => { setEditingFinding(f); setFindingDialogOpen(true); };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#1E2761 0%,#0F172A 100%)' }}>
      <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#CADCFC' }}>
              <ClipboardCheck className="w-5 h-5" style={{ color: '#a855f7' }} /> Audit & Findings Register (CAPA)
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{project?.projectName} · {audits.length} audits</p>
          </div>
          <Button onClick={openNewAudit} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
            <Plus className="w-4 h-4 mr-1" /> Add Audit
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Audit list */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold mb-2" style={{ color: '#CADCFC' }}>Audits</h2>
          <div className="space-y-2">
            {isLoading ? <p style={{ color: '#94A3B8' }}>Loading…</p> : audits.length === 0 ? (
              <p className="text-xs" style={{ color: '#64748b' }}>No audits yet. Add your first audit to start tracking findings.</p>
            ) : audits.map(a => (
              <Card key={a.id} onClick={() => setSelectedAuditId(a.id)}
                className="cursor-pointer hover:-translate-y-0.5 transition-transform"
                style={{ background: selectedAuditId === a.id ? 'rgba(168,85,247,0.12)' : 'rgba(30,39,97,0.5)', borderColor: selectedAuditId === a.id ? 'rgba(168,85,247,0.4)' : 'rgba(202,220,252,0.1)' }}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold" style={{ color: '#CADCFC' }}>{a.auditRef}</span>
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{a.auditType} · {a.auditor || 'No auditor'}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className="bg-purple-500/20 text-purple-300 text-[10px]">{a.status}</Badge>
                    {a.auditDate && <span className="text-[10px]" style={{ color: '#475569' }}>{new Date(a.auditDate).toLocaleDateString()}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Findings */}
        <div className="lg:col-span-2">
          {!selectedAudit ? (
            <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
              <CardContent className="py-16 text-center">
                <SearchX className="w-10 h-10 mx-auto mb-3" style={{ color: '#475569' }} />
                <p style={{ color: '#94A3B8' }}>Select an audit to view and manage its findings.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: '#CADCFC' }}>{selectedAudit.auditRef} — Findings</h2>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>{allFindings.length} findings · {overdueCount} overdue</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditAudit(selectedAudit)} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>Edit Audit</Button>
                  <Button size="sm" onClick={openNewFinding} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Finding
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                {[
                  { key: 'severity', label: 'All Severities', options: SEVERITIES },
                  { key: 'status', label: 'All Statuses', options: FINDING_STATUSES },
                ].map(f => (
                  <Select key={f.key} value={findingFilters[f.key] || ''} onValueChange={v => setFindingFilters({ ...findingFilters, [f.key]: v === f.label ? '' : v })}>
                    <SelectTrigger className="h-8 text-xs w-36" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                      <SelectValue placeholder={f.label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={f.label}>{f.label}</SelectItem>
                      {f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ))}
              </div>

              <div className="space-y-2">
                {findings.length === 0 ? (
                  <p className="text-xs" style={{ color: '#64748b' }}>No findings match the filters.</p>
                ) : findings.map(f => {
                  const overdue = isOverdue(f);
                  return (
                    <Card key={f.id} onClick={() => openEditFinding(f)} className="cursor-pointer hover:-translate-y-0.5 transition-transform"
                      style={{ background: 'rgba(30,39,97,0.5)', borderColor: overdue ? 'rgba(239,68,68,0.4)' : 'rgba(202,220,252,0.1)' }}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {f.findingRef && <span className="text-xs font-mono" style={{ color: '#a5f3fc' }}>{f.findingRef}</span>}
                              <Badge className={sevColor(f.severity)}>{f.severity}</Badge>
                              <Badge className="bg-slate-500/20 text-slate-300">{f.status}</Badge>
                              {f.linkedRiskId && <Badge className="bg-emerald-500/20 text-emerald-400">→ Risk</Badge>}
                            </div>
                            <p className="text-sm" style={{ color: '#F8FAFC' }}>{f.description}</p>
                            {f.correctiveAction && <p className="text-xs mt-1" style={{ color: '#94A3B8' }}><span style={{ color: '#64748b' }}>CAPA: </span>{f.correctiveAction}</p>}
                            <div className="text-xs mt-1.5 flex gap-3" style={{ color: '#475569' }}>
                              <span>{f.owner ? `Owner: ${f.owner}` : ''}</span>
                              <span>Due: {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</span>
                            </div>
                          </div>
                          {overdue && (
                            <div className="flex items-center gap-1 text-xs" style={{ color: '#EF4444' }}>
                              <AlertCircle className="w-3.5 h-3.5" /> Overdue
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <AuditDialog open={auditDialogOpen} onClose={() => setAuditDialogOpen(false)} projectId={projectId} audit={editingAudit} />
      <FindingDialog open={findingDialogOpen} onClose={() => setFindingDialogOpen(false)} projectId={projectId} auditId={selectedAuditId} finding={editingFinding} />
    </div>
  );
}