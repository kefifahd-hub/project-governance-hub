import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Sun, CloudLightning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';
import OptimizeWithAI from '../components/governance/OptimizeWithAI';

const QUADRANTS = [
  { key: 'Strength', label: 'Strengths', icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', badge: 'bg-emerald-500/20 text-emerald-400' },
  { key: 'Weakness', label: 'Weaknesses', icon: TrendingDown, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', badge: 'bg-amber-500/20 text-amber-400' },
  { key: 'Opportunity', label: 'Opportunities', icon: Sun, color: '#028090', bg: 'rgba(2,128,144,0.08)', border: 'rgba(2,128,144,0.25)', badge: 'bg-teal-500/20 text-teal-400' },
  { key: 'Threat', label: 'Threats', icon: CloudLightning, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', badge: 'bg-red-500/20 text-red-400' },
];

const PRIORITY_BADGE = { 'High': 'bg-red-500/20 text-red-400', 'Medium': 'bg-amber-500/20 text-amber-400', 'Low': 'bg-slate-500/20 text-slate-400' };

export default function SwotAnalysis() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['swotItems', projectId],
    queryFn: () => base44.entities.SwotItem.filter({ projectId }),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editing?.id) return base44.entities.SwotItem.update(editing.id, data);
      return base44.entities.SwotItem.create({ ...data, projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['swotItems', projectId] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SwotItem.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['swotItems', projectId] }),
  });

  const openNew = (category = 'Strength') => { setEditing(null); setForm({ category, priority: 'Medium', status: 'Open' }); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(item); setDialogOpen(true); };
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}><p style={{ color: '#94A3B8' }}>Loading...</p></div>;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg text-white" style={{ background: 'linear-gradient(135deg, #10B981 0%, #EF4444 100%)' }}><Sun className="w-5 h-5" /></div>
              <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>SWOT Analysis</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OptimizeWithAI documentType="swot" projectId={projectId} currentData={items} onApplied={() => qc.invalidateQueries({ queryKey: ['swotItems', projectId] })} />
            <Button onClick={() => openNew('Strength')} style={{ background: '#00A896', color: '#F8FAFC' }}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUADRANTS.map(q => {
            const qItems = items.filter(i => i.category === q.key);
            const Icon = q.icon;
            return (
              <Card key={q.key} style={{ background: q.bg, borderColor: q.border, minHeight: '320px' }}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg" style={{ background: q.color, color: '#fff' }}><Icon className="w-4 h-4" /></div>
                      <h2 className="font-bold text-lg" style={{ color: q.color }}>{q.label}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(15,23,42,0.4)', color: '#94A3B8' }}>{qItems.length}</span>
                    </div>
                    <button onClick={() => openNew(q.key)} className="p-1.5 rounded-lg hover:bg-slate-700/50 action-icon-btn" style={{ color: q.color }}><Plus className="w-4 h-4" /></button>
                  </div>

                  <div className="space-y-2">
                    {qItems.map(item => (
                      <div key={item.id} className="group rounded-lg p-3" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(202,220,252,0.06)' }}>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm flex-1" style={{ color: '#CADCFC' }}>{item.title}</h3>
                          <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-slate-700 action-icon-btn" style={{ color: '#94A3B8' }}><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteMutation.mutate(item.id)} className="p-1 rounded hover:bg-red-500/20 action-icon-btn" style={{ color: '#94A3B8' }}><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        {item.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#94A3B8' }}>{item.description}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${PRIORITY_BADGE[item.priority] || PRIORITY_BADGE['Medium']}`}>{item.priority}</span>
                          {item.owner && <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-300">{item.owner}</span>}
                          {item.action && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: q.badge }}>{item.status}</span>}
                        </div>
                        {item.action && <p className="text-xs mt-2 italic" style={{ color: q.color }}>→ {item.action}</p>}
                      </div>
                    ))}
                    {qItems.length === 0 && (
                      <button onClick={() => openNew(q.key)} className="w-full text-left text-xs py-4 px-3 rounded-lg border border-dashed transition-colors hover:bg-slate-800/30" style={{ color: '#475569', borderColor: 'rgba(202,220,252,0.1)' }}>
                        + Add {q.label.toLowerCase().slice(0, -1)}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-8" style={{ color: '#94A3B8' }}>
            <Sun className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No SWOT items yet. Add strengths, weaknesses, opportunities, and threats to get started.</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.2)' }}>
          <DialogHeader><DialogTitle style={{ color: '#CADCFC' }}>{editing ? 'Edit SWOT Item' : 'New SWOT Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label style={{ color: '#94A3B8' }}>Quadrant *</Label>
              <Select value={form.category || 'Strength'} onValueChange={v => update('category', v)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger>
                <SelectContent>{QUADRANTS.map(q => <SelectItem key={q.key} value={q.key}>{q.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label style={{ color: '#94A3B8' }}>Title *</Label><Input value={form.title || ''} onChange={e => update('title', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div><Label style={{ color: '#94A3B8' }}>Description</Label><Textarea value={form.description || ''} onChange={e => update('description', e.target.value)} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label style={{ color: '#94A3B8' }}>Priority</Label><Select value={form.priority || 'Medium'} onValueChange={v => update('priority', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['High','Medium','Low'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Status</Label><Select value={form.status || 'Open'} onValueChange={v => update('status', v)}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger><SelectContent>{['Open','In Progress','Closed'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label style={{ color: '#94A3B8' }}>Owner</Label><Input value={form.owner || ''} onChange={e => update('owner', e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
            </div>
            <div><Label style={{ color: '#94A3B8' }}>Action / Mitigation</Label><Textarea value={form.action || ''} onChange={e => update('action', e.target.value)} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => saveMutation.mutate(form)} disabled={!form.title || !form.category} style={{ background: '#00A896', color: '#F8FAFC' }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}