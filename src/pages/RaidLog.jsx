import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, Flag, ArrowRightCircle, AlertTriangle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';

const TYPE_ICONS = { 'Assumption': Flag, 'Issue': AlertTriangle, 'Dependency': Link2 };
const TYPE_COLORS = { 'Assumption': 'bg-blue-500/15 text-blue-400', 'Issue': 'bg-red-500/15 text-red-400', 'Dependency': 'bg-purple-500/15 text-purple-400' };
const IMPACT_COLORS = { 'High': 'bg-red-500/20 text-red-400', 'Medium': 'bg-amber-500/20 text-amber-400', 'Low': 'bg-slate-500/20 text-slate-400' };
const STATUS_COLORS = { 'Open': 'bg-red-500/15 text-red-400', 'In Progress': 'bg-blue-500/15 text-blue-400', 'Closed': 'bg-green-500/15 text-green-400' };

export default function RaidLog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: raidItems = [], isLoading } = useQuery({
    queryKey: ['raidItems', projectId],
    queryFn: () => base44.entities.RaidItem.filter({ projectId }),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editing?.id) return base44.entities.RaidItem.update(editing.id, data);
      return base44.entities.RaidItem.create({ ...data, projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['raidItems', projectId] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RaidItem.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['raidItems', projectId] }),
  });

  // Promote to Risk
  const promoteMutation = useMutation({
    mutationFn: async (item) => {
      const impactMap = { 'High': 4, 'Medium': 3, 'Low': 2 };
      const probMap = { 'High': 4, 'Medium': 3, 'Low': 2 };
      const risk = await base44.entities.Risk.create({
        projectId,
        riskDescription: `[From RAID] ${item.title}`,
        category: 'Technical',
        probability: probMap[item.impact] || 3,
        impact: impactMap[item.impact] || 3,
        mitigationPlan: item.resolution || '',
        owner: item.owner || '',
        status: 'Open',
      });
      return base44.entities.RaidItem.update(item.id, { linkedRiskId: risk.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['raidItems', projectId] });
      qc.invalidateQueries({ queryKey: ['risks', projectId] });
    },
  });

  const openNew = () => { setEditing(null); setForm({ itemType: 'Issue', impact: 'Medium', status: 'Open' }); setDialogOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm(r); setDialogOpen(true); };
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = typeFilter === 'all' ? raidItems : raidItems.filter(r => r.itemType === typeFilter);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}><p style={{ color: '#94A3B8' }}>Loading...</p></div>;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <div className="flex items-center gap-2">
              <div className="bg-amber-600 p-2 rounded-lg text-white"><Flag className="w-5 h-5" /></div>
              <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>RAID Log</h1>
            </div>
          </div>
          <Button onClick={openNew} style={{ background: '#00A896', color: '#F8FAFC' }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {['all','Assumption','Issue','Dependency'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all" style={{ background: typeFilter === t ? 'rgba(0,168,150,0.2)' : 'rgba(30,39,97,0.5)', color: typeFilter === t ? '#00A896' : '#94A3B8', border: `1px solid ${typeFilter === t ? 'rgba(0,168,150,0.3)' : 'rgba(202,220,252,0.1)'}` }}>{t === 'all' ? 'All' : t + 's'}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => {
            const TIcon = TYPE_ICONS[r.itemType] || Flag;
            return (
              <Card key={r.id} className="group" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${TYPE_COLORS[r.itemType] || TYPE_COLORS['Issue']}`}><TIcon className="w-3.5 h-3.5" /></div>
                      <h3 className="font-semibold" style={{ color: '#CADCFC' }}>{r.title}</h3>
                    </div>
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-slate-700 action-icon-btn" style={{ color: '#94A3B8' }}><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMutation.mutate(r.id)} className="p-1.5 rounded hover:bg-red-500/20 action-icon-btn" style={{ color: '#94A3B8' }}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: '#94A3B8' }}>{r.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${IMPACT_COLORS[r.impact] || IMPACT_COLORS['Medium']}`}>{r.impact}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[r.status] || STATUS_COLORS['Open']}`}>{r.status}</span>
                    {r.owner && <span className="px-2 py-0.5 rounded-full text-xs bg-teal-500/15 text-teal-400">{r.owner}</span>}
                    {r.dueDate && <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-300">{r.dueDate}</span>}
                  </div>
                  {r.linkedRiskId && <div className="mt-2 text-xs flex items-center gap-1 text-red-400"><Link2 className="w-3 h-3" /> Linked to Risk</div>}
                  {!r.linkedRiskId && r.itemType !== 'Assumption' && (
                    <button onClick={() => promoteMutation.mutate(r)} disabled={promoteMutation.isPending} className="mt-2 text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors">
                      <ArrowRightCircle className="w-3.5 h-3.5" /> Promote to Risk
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && <div className="text-center py-12" style={{ color: '#94A3B8' }}><Flag className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No RAID items yet.</p></div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.2)' }}>
          <DialogHeader><DialogTitle style={{ color: '#CADCFC' }}>{editing ? 'Edit Item' : 'New RAID Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label style={{ color: '#94A3B8' }}>Type</Label><Select value={form.itemType || 'Issue'} onValueChange={v => update('itemType', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['Assumption','Issue','Dependency'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Title *</Label><Input value={form.title || ''} onChange={e => update('title', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            </div>
            <div><Label style={{ color: '#94A3B8' }}>Description</Label><Textarea value={form.description || ''} onChange={e => update('description', e.target.value)} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label style={{ color: '#94A3B8' }}>Impact</Label><Select value={form.impact || 'Medium'} onValueChange={v => update('impact', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['High','Medium','Low'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Status</Label><Select value={form.status || 'Open'} onValueChange={v => update('status', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['Open','In Progress','Closed'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Owner</Label><Input value={form.owner || ''} onChange={e => update('owner', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            </div>
            <div><Label style={{ color: '#94A3B8' }}>Due Date</Label><Input type="date" value={form.dueDate || ''} onChange={e => update('dueDate', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div><Label style={{ color: '#94A3B8' }}>Resolution</Label><Textarea value={form.resolution || ''} onChange={e => update('resolution', e.target.value)} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => saveMutation.mutate(form)} disabled={!form.title} style={{ background: '#00A896', color: '#F8FAFC' }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}