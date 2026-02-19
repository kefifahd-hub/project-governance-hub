import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const DEFAULT_STATUS = {
  'Action': 'To Do',
  'Issue': 'Open',
  'Decision': 'Pending',
  'RFI': 'Draft',
  'Punch List': 'Identified',
  'Deliverable': 'Not Started',
  'Risk Action': 'Planned',
};

export default function NewItemDialog({ open, onClose, projectId, defaults = {}, buckets = [], phases = [], nextKey }) {
  const [form, setForm] = useState({
    itemType: 'Action',
    priority: 'P3 - Medium',
    title: '',
    assignee: '',
    description: '',
    bucket: defaults.bucket || '',
    phase: defaults.phase || '',
    dueDate: '',
    ...defaults
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ActionItem.create({
      ...data,
      projectId,
      itemKey: nextKey,
      status: DEFAULT_STATUS[data.itemType] || 'To Do',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionItems', projectId] });
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title) return;
    createMutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'rgba(10,15,40,0.99)', borderColor: 'rgba(202,220,252,0.1)' }} className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Type</Label>
              <Select value={form.itemType} onValueChange={v => setForm({ ...form, itemType: v })}>
                <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Action', 'Issue', 'Decision', 'RFI', 'Punch List', 'Risk Action', 'Deliverable'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Title *</Label>
            <Input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Short descriptive title..."
              required
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Assignee *</Label>
              <Input
                value={form.assignee}
                onChange={e => setForm({ ...form, assignee: e.target.value })}
                placeholder="Name"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Bucket</Label>
              <Select value={form.bucket || ''} onValueChange={v => setForm({ ...form, bucket: v })}>
                <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                  <SelectValue placeholder="No bucket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No bucket</SelectItem>
                  {buckets.map(b => <SelectItem key={b.id} value={b.bucketName}>{b.bucketName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Phase</Label>
              <Select value={form.phase || ''} onValueChange={v => setForm({ ...form, phase: v })}>
                <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                  <SelectValue placeholder="No phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No phase</SelectItem>
                  {phases.map(p => <SelectItem key={p.id} value={p.phaseName}>{p.phaseName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Description</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Details, acceptance criteria..."
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createMutation.isPending} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
              {createMutation.isPending ? 'Creating…' : 'Create Item'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}