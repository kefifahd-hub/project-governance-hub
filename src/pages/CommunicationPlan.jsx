import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';

const FREQ_OPTIONS = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Milestone', 'Ad-hoc'];
const CHANNEL_OPTIONS = ['Email', 'Meeting', 'Report', 'Dashboard', 'Call', 'Workshop'];
const FREQ_COLORS = { 'Daily': 'bg-red-500/15 text-red-400', 'Weekly': 'bg-blue-500/15 text-blue-400', 'Bi-weekly': 'bg-indigo-500/15 text-indigo-300', 'Monthly': 'bg-purple-500/15 text-purple-400', 'Quarterly': 'bg-amber-500/15 text-amber-400', 'Milestone': 'bg-teal-500/15 text-teal-400', 'Ad-hoc': 'bg-slate-500/15 text-slate-400' };

export default function CommunicationPlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: comms = [], isLoading } = useQuery({
    queryKey: ['comms', projectId],
    queryFn: () => base44.entities.CommunicationPlan.filter({ projectId }),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editing?.id) return base44.entities.CommunicationPlan.update(editing.id, data);
      return base44.entities.CommunicationPlan.create({ ...data, projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comms', projectId] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CommunicationPlan.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comms', projectId] }),
  });

  const openNew = () => { setEditing(null); setForm({ frequency: 'Weekly', channel: 'Email' }); setDialogOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm(c); setDialogOpen(true); };
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}><p style={{ color: '#94A3B8' }}>Loading...</p></div>;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 p-2 rounded-lg text-white"><Mail className="w-5 h-5" /></div>
              <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>Communications Plan</h1>
            </div>
          </div>
          <Button onClick={openNew} style={{ background: '#00A896', color: '#F8FAFC' }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comms.map(c => (
            <Card key={c.id} className="group" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold" style={{ color: '#CADCFC' }}>{c.audience}</h3>
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-slate-700 action-icon-btn" style={{ color: '#94A3B8' }}><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteMutation.mutate(c.id)} className="p-1.5 rounded hover:bg-red-500/20 action-icon-btn" style={{ color: '#94A3B8' }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: '#94A3B8' }}>{c.information}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${FREQ_COLORS[c.frequency] || FREQ_COLORS['Ad-hoc']}`}>{c.frequency}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-300">{c.channel}</span>
                  {c.owner && <span className="px-2 py-0.5 rounded-full text-xs bg-teal-500/15 text-teal-400">{c.owner}</span>}
                </div>
                {c.purpose && <p className="text-xs mt-2" style={{ color: '#64748b' }}>Purpose: {c.purpose}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {comms.length === 0 && <div className="text-center py-12" style={{ color: '#94A3B8' }}><Mail className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No communications planned yet.</p></div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.2)' }}>
          <DialogHeader><DialogTitle style={{ color: '#CADCFC' }}>{editing ? 'Edit Entry' : 'New Communication'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label style={{ color: '#94A3B8' }}>Audience *</Label><Input value={form.audience || ''} onChange={e => update('audience', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div><Label style={{ color: '#94A3B8' }}>Information</Label><Textarea value={form.information || ''} onChange={e => update('information', e.target.value)} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div><Label style={{ color: '#94A3B8' }}>Purpose</Label><Input value={form.purpose || ''} onChange={e => update('purpose', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label style={{ color: '#94A3B8' }}>Frequency</Label><Select value={form.frequency || 'Weekly'} onValueChange={v => update('frequency', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{FREQ_OPTIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Channel</Label><Select value={form.channel || 'Email'} onValueChange={v => update('channel', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{CHANNEL_OPTIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Owner</Label><Input value={form.owner || ''} onChange={e => update('owner', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            </div>
            <div><Label style={{ color: '#94A3B8' }}>Format</Label><Input value={form.format || ''} onChange={e => update('format', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div><Label style={{ color: '#94A3B8' }}>Notes</Label><Textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => saveMutation.mutate(form)} disabled={!form.audience} style={{ background: '#00A896', color: '#F8FAFC' }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}