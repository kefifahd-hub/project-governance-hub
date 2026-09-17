import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';

const CATEGORIES = ['Technical', 'Commercial', 'Schedule', 'Safety', 'Quality', 'Procurement', 'Stakeholder', 'HSE'];
const TYPES = ['Success', 'Improvement'];
const STATUSES = ['Open', 'Actioned', 'Closed'];

const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };

export default function LessonDialog({ open, onClose, projectId, lesson, onDeleted }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm(lesson ? { ...lesson } : {
        title: '', category: 'Technical', phase: '', whatHappened: '', rootCause: '', impact: '',
        recommendation: '', lessonType: 'Improvement', owner: '', status: 'Open',
        dateIdentified: new Date().toISOString().slice(0, 10), linkedRiskId: '', linkedActionId: '',
      });
    }
  }, [open, lesson]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const { id, created_date, updated_date, created_by_id, org_id, ...payload } = data;
      if (lesson?.id) return base44.entities.LessonLearned.update(lesson.id, payload);
      return base44.entities.LessonLearned.create({ ...payload, projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lessons', projectId] }); onClose(); },
  });

  const handleSubmit = (e) => { e.preventDefault(); saveMutation.mutate(form); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'rgba(10,15,40,0.99)', borderColor: 'rgba(202,220,252,0.1)' }} className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>{lesson ? 'Edit Lesson' : 'Add Lesson Learned'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Title *</Label>
            <Input value={form.title || ''} onChange={e => set('title', e.target.value)} required style={inputStyle} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Phase</Label>
              <Input value={form.phase || ''} onChange={e => set('phase', e.target.value)} placeholder="e.g. Construction" style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Type</Label>
              <Select value={form.lessonType} onValueChange={v => set('lessonType', v)}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>What happened</Label>
            <Textarea value={form.whatHappened || ''} onChange={e => set('whatHappened', e.target.value)} rows={2} style={inputStyle} />
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Root cause</Label>
            <Textarea value={form.rootCause || ''} onChange={e => set('rootCause', e.target.value)} rows={2} style={inputStyle} />
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Impact</Label>
            <Textarea value={form.impact || ''} onChange={e => set('impact', e.target.value)} rows={2} style={inputStyle} />
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Recommendation</Label>
            <Textarea value={form.recommendation || ''} onChange={e => set('recommendation', e.target.value)} rows={2} style={inputStyle} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Owner</Label>
              <Input value={form.owner || ''} onChange={e => set('owner', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Date identified</Label>
              <Input type="date" value={form.dateIdentified || ''} onChange={e => set('dateIdentified', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Linked Risk ID (optional)</Label>
              <Input value={form.linkedRiskId || ''} onChange={e => set('linkedRiskId', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Linked Action ID (optional)</Label>
              <Input value={form.linkedActionId || ''} onChange={e => set('linkedActionId', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <div className="flex gap-3">
              <Button type="submit" disabled={saveMutation.isPending} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
                {saveMutation.isPending ? 'Saving…' : 'Save Lesson'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Cancel</Button>
            </div>
            {lesson?.id && (
              <Button type="button" variant="outline" onClick={() => onDeleted(lesson.id)} style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444' }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}