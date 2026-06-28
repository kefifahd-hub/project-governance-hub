import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, ClipboardList, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';

const PRIORITY_COLORS = { 'Must': 'bg-red-500/20 text-red-400', 'Should': 'bg-amber-500/20 text-amber-400', 'Could': 'bg-blue-500/20 text-blue-400', "Won't": 'bg-slate-500/20 text-slate-400' };
const STATUS_COLORS = { 'Proposed': 'bg-slate-500/20 text-slate-300', 'Approved': 'bg-blue-500/20 text-blue-400', 'Implemented': 'bg-teal-500/20 text-teal-400', 'Verified': 'bg-green-500/20 text-green-400', 'Deferred': 'bg-amber-500/20 text-amber-400' };

export default function Requirements() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['requirements', projectId],
    queryFn: () => base44.entities.Requirement.filter({ projectId }),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editing?.id) return base44.entities.Requirement.update(editing.id, data);
      return base44.entities.Requirement.create({ ...data, projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['requirements', projectId] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Requirement.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requirements', projectId] }),
  });

  const openNew = () => { setEditing(null); setForm({ reqType: 'Functional', priority: 'Should', status: 'Proposed' }); setDialogOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm(r); setDialogOpen(true); };
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = priorityFilter === 'all' ? requirements : requirements.filter(r => r.priority === priorityFilter);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}><p style={{ color: '#94A3B8' }}>Loading...</p></div>;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <div className="flex items-center gap-2">
              <div className="bg-teal-600 p-2 rounded-lg text-white"><ClipboardList className="w-5 h-5" /></div>
              <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>Requirements</h1>
            </div>
          </div>
          <Button onClick={openNew} style={{ background: '#00A896', color: '#F8FAFC' }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 mb-4">
          {['all','Must','Should','Could',"Won't"].map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all" style={{ background: priorityFilter === p ? 'rgba(0,168,150,0.2)' : 'rgba(30,39,97,0.5)', color: priorityFilter === p ? '#00A896' : '#94A3B8', border: `1px solid ${priorityFilter === p ? 'rgba(0,168,150,0.3)' : 'rgba(202,220,252,0.1)'}` }}>{p === 'all' ? 'All' : p}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <Card key={r.id} className="group" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {r.reqCode && <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">{r.reqCode}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[r.priority] || PRIORITY_COLORS['Should']}`}>{r.priority}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-slate-700 action-icon-btn" style={{ color: '#94A3B8' }}><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteMutation.mutate(r.id)} className="p-1.5 rounded hover:bg-red-500/20 action-icon-btn" style={{ color: '#94A3B8' }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-sm mb-2" style={{ color: '#CADCFC' }}>{r.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-300">{r.reqType}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[r.status] || STATUS_COLORS['Proposed']}`}>{r.status}</span>
                  {r.wbsCode && <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-300">WBS: {r.wbsCode}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && <div className="text-center py-12" style={{ color: '#94A3B8' }}><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No requirements yet.</p></div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.2)' }}>
          <DialogHeader><DialogTitle style={{ color: '#CADCFC' }}>{editing ? 'Edit Requirement' : 'New Requirement'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label style={{ color: '#94A3B8' }}>Code</Label><Input value={form.reqCode || ''} onChange={e => update('reqCode', e.target.value)} placeholder="REQ-001" className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
              <div><Label style={{ color: '#94A3B8' }}>Source</Label><Input value={form.source || ''} onChange={e => update('source', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            </div>
            <div><Label style={{ color: '#94A3B8' }}>Description *</Label><Textarea value={form.description || ''} onChange={e => update('description', e.target.value)} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label style={{ color: '#94A3B8' }}>Type</Label><Select value={form.reqType || 'Functional'} onValueChange={v => update('reqType', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['Functional','Non-functional','Business','Technical','Regulatory'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Priority</Label><Select value={form.priority || 'Should'} onValueChange={v => update('priority', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['Must','Should','Could',"Won't"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Status</Label><Select value={form.status || 'Proposed'} onValueChange={v => update('status', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['Proposed','Approved','Implemented','Verified','Deferred'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label style={{ color: '#94A3B8' }}>Acceptance Criteria</Label><Textarea value={form.acceptanceCriteria || ''} onChange={e => update('acceptanceCriteria', e.target.value)} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div><Label style={{ color: '#94A3B8' }}>WBS Code</Label><Input value={form.wbsCode || ''} onChange={e => update('wbsCode', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => saveMutation.mutate(form)} disabled={!form.description} style={{ background: '#00A896', color: '#F8FAFC' }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}