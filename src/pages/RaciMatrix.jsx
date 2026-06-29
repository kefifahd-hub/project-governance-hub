import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Grid3x3, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';
import OptimizeWithAI from '../components/governance/OptimizeWithAI';

const RACI_STYLES = {
  'R': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Responsible' },
  'A': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Accountable' },
  'C': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Consulted' },
  'I': { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Informed' },
};

export default function RaciMatrix() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({});

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['raciAssignments', projectId],
    queryFn: () => base44.entities.RaciAssignment.filter({ projectId }),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.RaciAssignment.create({ ...data, projectId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['raciAssignments', projectId] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RaciAssignment.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['raciAssignments', projectId] }),
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Group by activity
  const grouped = assignments.reduce((acc, a) => {
    if (!acc[a.activity]) acc[a.activity] = [];
    acc[a.activity].push(a);
    return acc;
  }, {});
  const activities = Object.keys(grouped).sort();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}><p style={{ color: '#94A3B8' }}>Loading...</p></div>;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <div className="flex items-center gap-2">
              <div className="bg-purple-600 p-2 rounded-lg text-white"><Grid3x3 className="w-5 h-5" /></div>
              <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>RACI Matrix</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OptimizeWithAI documentType="raci" projectId={projectId} currentData={assignments} onApplied={() => qc.invalidateQueries({ queryKey: ['raciAssignments', projectId] })} />
            <Button onClick={() => { setForm({ responsibility: 'C' }); setDialogOpen(true); }} style={{ background: '#00A896', color: '#F8FAFC' }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          {Object.entries(RACI_STYLES).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${v.bg} ${v.text}`}>{k}</span>
              <span className="text-xs" style={{ color: '#94A3B8' }}>{v.label}</span>
            </div>
          ))}
          <span className="text-xs flex items-center gap-1 ml-auto" style={{ color: '#64748b' }}><Info className="w-3 h-3" /> One "A" per activity</span>
        </div>

        <div className="space-y-3">
          {activities.map(activity => {
            const rows = grouped[activity];
            const accountableCount = rows.filter(r => r.responsibility === 'A').length;
            return (
              <Card key={activity} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold" style={{ color: '#CADCFC' }}>{activity}</h3>
                    {accountableCount > 1 && <span className="text-xs text-amber-400">⚠ Multiple A's</span>}
                    {accountableCount === 0 && <span className="text-xs text-red-400">No Accountable</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rows.map(r => {
                      const style = RACI_STYLES[r.responsibility] || RACI_STYLES['I'];
                      return (
                        <div key={r.id} className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)' }}>
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${style.bg} ${style.text}`}>{r.responsibility}</span>
                          <span className="text-sm" style={{ color: '#CADCFC' }}>{r.roleName}</span>
                          {r.wbsCode && <span className="text-xs px-1 rounded bg-indigo-500/15 text-indigo-300">{r.wbsCode}</span>}
                          <button onClick={() => deleteMutation.mutate(r.id)} className="sm:opacity-0 sm:group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 transition-all" style={{ color: '#64748b' }}><Trash2 className="w-3 h-3" /></button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {activities.length === 0 && <div className="text-center py-12" style={{ color: '#94A3B8' }}><Grid3x3 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No RACI assignments yet.</p></div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.2)' }}>
          <DialogHeader><DialogTitle style={{ color: '#CADCFC' }}>Add RACI Assignment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label style={{ color: '#94A3B8' }}>Activity *</Label><Input value={form.activity || ''} onChange={e => update('activity', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label style={{ color: '#94A3B8' }}>Role / Name *</Label><Input value={form.roleName || ''} onChange={e => update('roleName', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
              <div><Label style={{ color: '#94A3B8' }}>Responsibility</Label><Select value={form.responsibility || 'C'} onValueChange={v => update('responsibility', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['R','A','C','I'].map(v => <SelectItem key={v} value={v}>{v} — {RACI_STYLES[v].label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label style={{ color: '#94A3B8' }}>WBS Code (optional)</Label><Input value={form.wbsCode || ''} onChange={e => update('wbsCode', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div><Label style={{ color: '#94A3B8' }}>Notes</Label><Input value={form.notes || ''} onChange={e => update('notes', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => saveMutation.mutate(form)} disabled={!form.activity || !form.roleName} style={{ background: '#00A896', color: '#F8FAFC' }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}