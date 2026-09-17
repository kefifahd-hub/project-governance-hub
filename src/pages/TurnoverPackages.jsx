import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, KeyRound, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TurnoverDialog, { TURNOVER_STATUSES } from '@/components/turnover/TurnoverDialog';

const COLUMN_COLORS = ['#64748b', '#0ea5e9', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#22c55e'];

export default function TurnoverPackages() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [view, setView] = useState('board');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => { const r = await base44.entities.Project.filter({ id: projectId }); return r[0]; },
    enabled: !!projectId,
  });

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['turnoverPackages', projectId],
    queryFn: () => base44.entities.TurnoverPackage.filter({ projectId }, '-created_date', 200),
    enabled: !!projectId,
  });

  const { data: wbsElements = [] } = useQuery({
    queryKey: ['wbsElements', projectId],
    queryFn: () => base44.entities.WbsElement.filter({ projectId }),
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TurnoverPackage.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnoverPackages', projectId] }),
  });

  const total = packages.length;
  const turnedOver = packages.filter(p => p.status === 'Turned Over to Ops').length;
  const pctTurnedOver = total ? Math.round((turnedOver / total) * 100) : 0;
  const punchlistAOpen = packages.reduce((s, p) => s + (p.punchlistA || 0), 0);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p) => { setEditing(p); setDialogOpen(true); };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const pkg = packages.find(p => p.id === result.draggableId);
    const newStatus = TURNOVER_STATUSES[result.destination.droppableId];
    if (pkg && pkg.status !== newStatus) {
      updateMutation.mutate({ id: pkg.id, data: { status: newStatus } });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#1E2761 0%,#0F172A 100%)' }}>
      <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#CADCFC' }}>
              <KeyRound className="w-5 h-5" style={{ color: '#22c55e' }} /> Turnover Packages
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{project?.projectName} · {total} packages</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'rgba(30,39,97,0.6)', border: '1px solid rgba(202,220,252,0.1)' }}>
              <button onClick={() => setView('board')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ background: view === 'board' ? 'rgba(0,168,150,0.2)' : 'transparent', color: view === 'board' ? '#00A896' : '#94A3B8' }}>
                <LayoutGrid className="w-3.5 h-3.5" /> Board
              </button>
              <button onClick={() => setView('table')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ background: view === 'table' ? 'rgba(0,168,150,0.2)' : 'transparent', color: view === 'table' ? '#00A896' : '#94A3B8' }}>
                <List className="w-3.5 h-3.5" /> Table
              </button>
            </div>
            <Button onClick={openNew} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
              <Plus className="w-4 h-4 mr-1" /> Add Package
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-3 gap-4">
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
            <CardContent className="pt-4">
              <span className="text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Packages</span>
              <div className="text-2xl font-bold" style={{ color: '#CADCFC' }}>{total}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
            <CardContent className="pt-4">
              <span className="text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>% Turned Over</span>
              <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{pctTurnedOver}%</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
            <CardContent className="pt-4">
              <span className="text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Punchlist A Open</span>
              <div className="text-2xl font-bold" style={{ color: punchlistAOpen > 0 ? '#EF4444' : '#CADCFC' }}>{punchlistAOpen}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <p style={{ color: '#94A3B8' }}>Loading…</p>
        ) : view === 'board' ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {TURNOVER_STATUSES.map((status, colIdx) => {
                const colItems = packages.filter(p => p.status === status);
                return (
                  <div key={status} className="flex-none w-72">
                    <div className="rounded-lg px-3 py-2 mb-2 flex items-center justify-between" style={{ background: `${COLUMN_COLORS[colIdx]}22`, border: `1px solid ${COLUMN_COLORS[colIdx]}44` }}>
                      <span className="text-xs font-semibold" style={{ color: COLUMN_COLORS[colIdx] }}>{status}</span>
                      <span className="text-xs px-2 rounded-full" style={{ background: 'rgba(15,23,42,0.6)', color: '#94A3B8' }}>{colItems.length}</span>
                    </div>
                    <Droppable droppableId={String(colIdx)}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          className="min-h-[200px] rounded-lg p-2 space-y-2 transition-colors"
                          style={{ background: snapshot.isDraggingOver ? 'rgba(0,168,150,0.08)' : 'rgba(15,23,42,0.4)', border: '1px dashed rgba(202,220,252,0.08)' }}>
                          {colItems.map((p, idx) => (
                            <Draggable key={p.id} draggableId={p.id} index={idx}>
                              {(prov) => (
                                <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                  onClick={() => openEdit(p)}
                                  className="rounded-lg p-3 cursor-pointer hover:-translate-y-0.5 transition-transform"
                                  style={{ background: 'rgba(30,39,97,0.7)', border: '1px solid rgba(202,220,252,0.12)', ...prov.draggableProps.style }}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-mono font-semibold" style={{ color: '#CADCFC' }}>{p.packageCode}</span>
                                    {(p.punchlistA || 0) > 0 && <Badge className="bg-red-500/20 text-red-400">A:{p.punchlistA}</Badge>}
                                  </div>
                                  <div className="text-sm font-medium truncate" style={{ color: '#F8FAFC' }}>{p.systemName}</div>
                                  {p.subsystem && <div className="text-xs truncate" style={{ color: '#64748b' }}>{p.subsystem}</div>}
                                  <div className="text-[10px] mt-1.5 flex justify-between" style={{ color: '#475569' }}>
                                    <span>{p.custodianFrom || '?'} → {p.custodianTo || '?'}</span>
                                    <span>{p.targetDate ? new Date(p.targetDate).toLocaleDateString() : ''}</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {colItems.length === 0 && <div className="text-center text-xs py-6" style={{ color: '#334155' }}>Drag here</div>}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        ) : (
          <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
            <table className="w-full text-sm responsive-table">
              <thead style={{ background: 'rgba(15,23,42,0.8)' }}>
                <tr className="text-left" style={{ color: '#94A3B8' }}>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">System</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Punch A</th>
                  <th className="px-3 py-2">Punch B</th>
                  <th className="px-3 py-2">Custodian</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">Actual</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(p => (
                  <tr key={p.id} onClick={() => openEdit(p)} className="cursor-pointer hover:bg-white/5" style={{ color: '#CADCFC', borderTop: '1px solid rgba(202,220,252,0.06)' }}>
                    <td className="px-3 py-2 font-mono" data-label="Code">{p.packageCode}</td>
                    <td className="px-3 py-2" data-label="System">{p.systemName}</td>
                    <td className="px-3 py-2" data-label="Status"><span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>{p.status}</span></td>
                    <td className="px-3 py-2" data-label="Punch A" style={{ color: (p.punchlistA || 0) > 0 ? '#EF4444' : '#94A3B8' }}>{p.punchlistA || 0}</td>
                    <td className="px-3 py-2" data-label="Punch B">{p.punchlistB || 0}</td>
                    <td className="px-3 py-2 text-xs" data-label="Custodian">{p.custodianFrom} → {p.custodianTo}</td>
                    <td className="px-3 py-2 text-xs" data-label="Target">{p.targetDate ? new Date(p.targetDate).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 text-xs" data-label="Actual">{p.actualDate ? new Date(p.actualDate).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
                {packages.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center" style={{ color: '#64748b' }}>No packages yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TurnoverDialog open={dialogOpen} onClose={() => setDialogOpen(false)} projectId={projectId} pkg={editing} wbsOptions={wbsElements} />
    </div>
  );
}