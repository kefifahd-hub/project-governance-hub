import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Plus, Pencil, Trash2, TrendingUp, Eye, Target, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';

const ENGAGEMENT_LEVELS = ['Unaware', 'Resistant', 'Neutral', 'Supportive', 'Leading'];

function classifyQuadrant(influence, interest) {
  const highInf = influence === 'High';
  const highInt = interest === 'High' || interest === 'Medium';
  if (highInf && highInt) return { label: 'Manage Closely', icon: Target, color: 'text-red-400 bg-red-500/10' };
  if (highInf && !highInt) return { label: 'Keep Satisfied', icon: TrendingUp, color: 'text-amber-400 bg-amber-500/10' };
  if (!highInf && highInt) return { label: 'Keep Informed', icon: Eye, color: 'text-blue-400 bg-blue-500/10' };
  return { label: 'Monitor', icon: Minimize2, color: 'text-slate-400 bg-slate-500/10' };
}

export default function StakeholderRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: stakeholders = [], isLoading } = useQuery({
    queryKey: ['stakeholders', projectId],
    queryFn: () => base44.entities.Stakeholder.filter({ projectId }),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editing?.id) return base44.entities.Stakeholder.update(editing.id, data);
      return base44.entities.Stakeholder.create({ ...data, projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stakeholders', projectId] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Stakeholder.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stakeholders', projectId] }),
  });

  const openNew = () => { setEditing(null); setForm({ influence: 'Medium', interest: 'Medium', engagementCurrent: 'Neutral', engagementDesired: 'Supportive', category: 'Internal' }); setDialogOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm(s); setDialogOpen(true); };
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const manageClosely = stakeholders.filter(s => classifyQuadrant(s.influence, s.interest).label === 'Manage Closely');

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}><p style={{ color: '#94A3B8' }}>Loading...</p></div>;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <div className="flex items-center gap-2">
              <div className="bg-cyan-500 p-2 rounded-lg text-white"><Users className="w-5 h-5" /></div>
              <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>Stakeholder Register</h1>
            </div>
          </div>
          <Button onClick={openNew} style={{ background: '#00A896', color: '#F8FAFC' }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}><CardContent className="pt-4"><div className="text-2xl font-bold" style={{ color: '#CADCFC' }}>{stakeholders.length}</div><div className="text-xs" style={{ color: '#94A3B8' }}>Total Stakeholders</div></CardContent></Card>
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}><CardContent className="pt-4"><div className="text-2xl font-bold text-red-400">{manageClosely.length}</div><div className="text-xs" style={{ color: '#94A3B8' }}>Manage Closely</div></CardContent></Card>
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-400">{stakeholders.filter(s => s.influence === 'High').length}</div><div className="text-xs" style={{ color: '#94A3B8' }}>High Influence</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeholders.map(s => {
            const q = classifyQuadrant(s.influence, s.interest);
            const QIcon = q.icon;
            return (
              <Card key={s.id} className="group" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold" style={{ color: '#CADCFC' }}>{s.stakeholderName}</h3>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>{s.role || '—'}{s.company ? ` · ${s.company}` : ''}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-700 action-icon-btn" style={{ color: '#94A3B8' }}><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMutation.mutate(s.id)} className="p-1.5 rounded hover:bg-red-500/20 action-icon-btn" style={{ color: '#94A3B8' }}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: s.category === 'Internal' ? 'rgba(0,168,150,0.15)' : 'rgba(168,85,247,0.15)', color: s.category === 'Internal' ? '#00A896' : '#a855f7' }}>{s.category}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-300">Inf: {s.influence || '—'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-300">Int: {s.interest || '—'}</span>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${q.color}`}><QIcon className="w-3 h-3" /> {q.label}</div>
                  {s.engagementStrategy && <p className="text-xs mt-2 line-clamp-2" style={{ color: '#94A3B8' }}>{s.engagementStrategy}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {stakeholders.length === 0 && <div className="text-center py-12" style={{ color: '#94A3B8' }}><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No stakeholders yet. Click "Add" to create one.</p></div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.2)' }}>
          <DialogHeader><DialogTitle style={{ color: '#CADCFC' }}>{editing ? 'Edit Stakeholder' : 'New Stakeholder'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label style={{ color: '#94A3B8' }}>Name *</Label><Input value={form.stakeholderName || ''} onChange={e => update('stakeholderName', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div><Label style={{ color: '#94A3B8' }}>Role</Label><Input value={form.role || ''} onChange={e => update('role', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div><Label style={{ color: '#94A3B8' }}>Company</Label><Input value={form.company || ''} onChange={e => update('company', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div><Label style={{ color: '#94A3B8' }}>Category</Label><Select value={form.category || 'Internal'} onValueChange={v => update('category', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['Internal','External'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label style={{ color: '#94A3B8' }}>Influence</Label><Select value={form.influence || 'Medium'} onValueChange={v => update('influence', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['High','Medium','Low'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label style={{ color: '#94A3B8' }}>Interest</Label><Select value={form.interest || 'Medium'} onValueChange={v => update('interest', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['High','Medium','Low'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label style={{ color: '#94A3B8' }}>Engagement Current</Label><Select value={form.engagementCurrent || 'Neutral'} onValueChange={v => update('engagementCurrent', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{ENGAGEMENT_LEVELS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label style={{ color: '#94A3B8' }}>Engagement Desired</Label><Select value={form.engagementDesired || 'Supportive'} onValueChange={v => update('engagementDesired', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{ENGAGEMENT_LEVELS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2"><Label style={{ color: '#94A3B8' }}>Engagement Strategy</Label><Textarea value={form.engagementStrategy || ''} onChange={e => update('engagementStrategy', e.target.value)} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div className="col-span-2"><Label style={{ color: '#94A3B8' }}>Contact</Label><Input value={form.contact || ''} onChange={e => update('contact', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.stakeholderName} style={{ background: '#00A896', color: '#F8FAFC' }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}