import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, ListTree, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';

const STATUS_COLORS = { 'Not Started': 'bg-slate-500/20 text-slate-400', 'In Progress': 'bg-blue-500/20 text-blue-400', 'Complete': 'bg-green-500/20 text-green-400' };
const TYPE_COLORS = { 'Phase': 'bg-indigo-500/15 text-indigo-300', 'Deliverable': 'bg-purple-500/15 text-purple-300', 'Work Package': 'bg-teal-500/15 text-teal-300' };

export default function WBS() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: wbsElements = [], isLoading: wbsLoading } = useQuery({
    queryKey: ['wbsElements', projectId],
    queryFn: () => base44.entities.WbsElement.filter({ projectId }),
    enabled: !!projectId,
  });

  const { data: budgetLines = [] } = useQuery({
    queryKey: ['budgetTracking', projectId],
    queryFn: () => base44.entities.BudgetTracking.filter({ projectId }),
    enabled: !!projectId,
  });

  const { data: scheduleActivities = [] } = useQuery({
    queryKey: ['scheduleActivities', projectId],
    queryFn: () => base44.entities.ScheduleActivity.filter({ projectId }),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editing?.id) return base44.entities.WbsElement.update(editing.id, data);
      return base44.entities.WbsElement.create({ ...data, projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wbsElements', projectId] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WbsElement.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wbsElements', projectId] }),
  });

  const openNew = () => { setEditing(null); setForm({ elementType: 'Work Package', status: 'Not Started', budgetEurK: 0 }); setDialogOpen(true); };
  const openEdit = (w) => { setEditing(w); setForm(w); setDialogOpen(true); };
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Sort by wbsCode (numeric segments)
  const sorted = [...wbsElements].sort((a, b) => {
    const pad = (code) => (code || '').split('.').map(n => n.padStart(5, '0')).join('.');
    return pad(a.wbsCode).localeCompare(pad(b.wbsCode));
  });

  // Roll-up: for each WBS element, sum budget actuals and count schedule activities
  const getRollup = (wbsCode) => {
    const matchingBudget = budgetLines.filter(b => b.wbsCode === wbsCode);
    const actualCost = matchingBudget.reduce((sum, b) => sum + (b.actualEurK || 0), 0);
    const plannedCost = matchingBudget.reduce((sum, b) => sum + (b.plannedEurK || 0), 0);
    const matchingActivities = scheduleActivities.filter(a => a.wbsCode === wbsCode);
    const avgComplete = matchingActivities.length > 0 ? matchingActivities.reduce((sum, a) => sum + (a.percentComplete || 0), 0) / matchingActivities.length : 0;
    return { actualCost, plannedCost, activityCount: matchingActivities.length, avgComplete };
  };

  // Unassigned bucket
  const assignedCodes = new Set(wbsElements.map(w => w.wbsCode));
  const unassignedBudget = budgetLines.filter(b => !b.wbsCode || !assignedCodes.has(b.wbsCode));
  const unassignedActual = unassignedBudget.reduce((sum, b) => sum + (b.actualEurK || 0), 0);
  const unassignedActivities = scheduleActivities.filter(a => !a.wbsCode || !assignedCodes.has(a.wbsCode));
  const totalPlanned = wbsElements.reduce((sum, w) => sum + (w.budgetEurK || 0), 0);
  const totalActual = budgetLines.reduce((sum, b) => sum + (b.actualEurK || 0), 0);

  if (wbsLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}><p style={{ color: '#94A3B8' }}>Loading...</p></div>;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white"><ListTree className="w-5 h-5" /></div>
              <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>WBS</h1>
            </div>
          </div>
          <Button onClick={openNew} style={{ background: '#00A896', color: '#F8FAFC' }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </div>

      {/* Roll-up totals */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}><CardContent className="pt-3"><div className="text-xl font-bold" style={{ color: '#CADCFC' }}>{wbsElements.length}</div><div className="text-xs" style={{ color: '#94A3B8' }}>Elements</div></CardContent></Card>
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}><CardContent className="pt-3"><div className="text-xl font-bold text-blue-400">€{totalPlanned.toLocaleString()}K</div><div className="text-xs" style={{ color: '#94A3B8' }}>WBS Planned</div></CardContent></Card>
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}><CardContent className="pt-3"><div className="text-xl font-bold text-teal-400">€{totalActual.toLocaleString()}K</div><div className="text-xs" style={{ color: '#94A3B8' }}>Actual Cost</div></CardContent></Card>
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}><CardContent className="pt-3"><div className="text-xl font-bold text-amber-400">{scheduleActivities.length}</div><div className="text-xs" style={{ color: '#94A3B8' }}>Linked Activities</div></CardContent></Card>
        </div>
      </div>

      {/* WBS Tree */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
          <CardContent className="pt-4">
            {sorted.map(w => {
              const depth = (w.wbsCode || '').split('.').length - 1;
              const rollup = getRollup(w.wbsCode);
              return (
                <div key={w.id} className="group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-800/30 transition-all" style={{ marginLeft: `${depth * 24}px` }}>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 min-w-[60px]">{w.wbsCode}</span>
                  <span className="flex-1 font-medium" style={{ color: '#CADCFC' }}>{w.name}</span>
                  <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-xs ${TYPE_COLORS[w.elementType] || TYPE_COLORS['Work Package']}`}>{w.elementType}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[w.status] || STATUS_COLORS['Not Started']}`}>{w.status}</span>
                  <div className="hidden md:flex items-center gap-4 text-xs" style={{ color: '#94A3B8' }}>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{w.budgetEurK || 0}K</span>
                    {rollup.actualCost > 0 && <span className="text-teal-400">Act: {rollup.actualCost.toFixed(0)}K</span>}
                    {rollup.activityCount > 0 && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{rollup.activityCount} ({rollup.avgComplete.toFixed(0)}%)</span>}
                  </div>
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(w)} className="p-1.5 rounded hover:bg-slate-700 action-icon-btn" style={{ color: '#94A3B8' }}><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteMutation.mutate(w.id)} className="p-1.5 rounded hover:bg-red-500/20 action-icon-btn" style={{ color: '#94A3B8' }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
            {/* Unassigned bucket */}
            {(unassignedBudget.length > 0 || unassignedActivities.length > 0) && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="font-medium text-amber-400">Unassigned (no WBS code)</span>
                </div>
                <div className="flex items-center gap-6 text-sm" style={{ color: '#94A3B8' }}>
                  {unassignedActual > 0 && <span>Actual: €{unassignedActual.toFixed(0)}K</span>}
                  {unassignedActivities.length > 0 && <span>Activities: {unassignedActivities.length}</span>}
                </div>
              </div>
            )}
            {sorted.length === 0 && <div className="text-center py-8" style={{ color: '#94A3B8' }}><ListTree className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No WBS elements yet.</p></div>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.2)' }}>
          <DialogHeader><DialogTitle style={{ color: '#CADCFC' }}>{editing ? 'Edit WBS Element' : 'New WBS Element'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label style={{ color: '#94A3B8' }}>WBS Code *</Label><Input value={form.wbsCode || ''} onChange={e => update('wbsCode', e.target.value)} placeholder="1.2.3" className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
              <div><Label style={{ color: '#94A3B8' }}>Name *</Label><Input value={form.name || ''} onChange={e => update('name', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            </div>
            <div><Label style={{ color: '#94A3B8' }}>Description</Label><Textarea value={form.description || ''} onChange={e => update('description', e.target.value)} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label style={{ color: '#94A3B8' }}>Type</Label><Select value={form.elementType || 'Work Package'} onValueChange={v => update('elementType', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['Phase','Deliverable','Work Package'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Status</Label><Select value={form.status || 'Not Started'} onValueChange={v => update('status', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['Not Started','In Progress','Complete'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Budget (€K)</Label><Input type="number" value={form.budgetEurK || 0} onChange={e => update('budgetEurK', parseFloat(e.target.value) || 0)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            </div>
            <div><Label style={{ color: '#94A3B8' }}>Owner</Label><Input value={form.owner || ''} onChange={e => update('owner', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => saveMutation.mutate(form)} disabled={!form.wbsCode || !form.name} style={{ background: '#00A896', color: '#F8FAFC' }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}