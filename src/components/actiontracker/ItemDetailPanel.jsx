import { useState } from 'react';
import { X, Plus, CheckSquare, Square, MessageSquare, Clock, Link, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const STATUS_BY_TYPE = {
  'Action': ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked', "Won't Do"],
  'Issue': ['Open', 'Under Investigation', 'Solution Proposed', 'Implementing', 'Resolved', 'Closed', 'Escalated'],
  'Decision': ['Pending', 'Under Discussion', 'Decision Made', 'Communicated', 'Deferred'],
  'RFI': ['Draft', 'Submitted', 'Response Received', 'Closed', 'Overdue'],
  'Punch List': ['Identified', 'Assigned', 'In Rectification', 'Reinspection', 'Closed', 'Accepted As-Is'],
  'Deliverable': ['Not Started', 'In Progress', 'Draft Complete', 'Under Review', 'Approved', 'Submitted'],
  'Risk Action': ['Planned', 'In Progress', 'Complete', 'Verified Effective', 'Ineffective'],
};

const PRIORITY_OPTIONS = ['P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'];

export default function ItemDetailPanel({ item, onClose, onUpdate, buckets, phases }) {
  const [form, setForm] = useState({ ...item });
  const [newComment, setNewComment] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['actionComments', item.id],
    queryFn: () => base44.entities.ActionComment.filter({ actionItemId: item.id }, 'created_date')
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ['actionChecklists', item.id],
    queryFn: () => base44.entities.ActionChecklist.filter({ actionItemId: item.id }, 'sortOrder')
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ActionItem.update(item.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionItems'] });
      onUpdate && onUpdate({ ...item, ...form });
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: () => base44.entities.ActionComment.create({ actionItemId: item.id, author: 'Me', commentText: newComment, commentType: 'Comment' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['actionComments', item.id] }); setNewComment(''); }
  });

  const toggleCheckMutation = useMutation({
    mutationFn: ({ id, isChecked }) => base44.entities.ActionChecklist.update(id, { isChecked }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actionChecklists', item.id] })
  });

  const addCheckItemMutation = useMutation({
    mutationFn: () => base44.entities.ActionChecklist.create({ actionItemId: item.id, checklistText: newCheckItem, isChecked: false, sortOrder: checklists.length }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['actionChecklists', item.id] }); setNewCheckItem(''); }
  });

  const handleSave = () => updateMutation.mutate(form);

  const checkedCount = checklists.filter(c => c.isChecked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl h-full overflow-y-auto flex flex-col" style={{ background: 'rgba(10,15,40,0.99)', borderLeft: '1px solid rgba(202,220,252,0.1)' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ background: 'rgba(10,15,40,0.99)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm" style={{ color: '#475569' }}>{item.itemKey}</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>{item.itemType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
              Save
            </Button>
            <button onClick={onClose} style={{ color: '#94A3B8' }}><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 px-6 py-4 space-y-5">
          {/* Title */}
          <Input
            value={form.title || ''}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="text-lg font-semibold border-0 border-b rounded-none px-0 bg-transparent focus-visible:ring-0"
            style={{ color: '#CADCFC', borderColor: 'rgba(202,220,252,0.15)' }}
          />

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#94A3B8' }}>Status</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-9" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(STATUS_BY_TYPE[form.itemType] || STATUS_BY_TYPE['Action']).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#94A3B8' }}>Priority</label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger className="h-9" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'assignee', label: 'Assignee' },
              { key: 'reporter', label: 'Reporter' },
              { key: 'dueDate', label: 'Due Date', type: 'date' },
              { key: 'startDate', label: 'Start Date', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#94A3B8' }}>{f.label}</label>
                <Input
                  type={f.type || 'text'}
                  value={form[f.key] || ''}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="h-9 text-sm"
                  style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
                />
              </div>
            ))}

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#94A3B8' }}>Bucket</label>
              <Select value={form.bucket || ''} onValueChange={v => setForm({ ...form, bucket: v })}>
                <SelectTrigger className="h-9" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                  <SelectValue placeholder="No bucket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No bucket</SelectItem>
                  {buckets.map(b => <SelectItem key={b.id} value={b.bucketName}>{b.bucketName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#94A3B8' }}>Phase</label>
              <Select value={form.phase || ''} onValueChange={v => setForm({ ...form, phase: v })}>
                <SelectTrigger className="h-9" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                  <SelectValue placeholder="No phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No phase</SelectItem>
                  {phases.map(p => <SelectItem key={p.id} value={p.phaseName}>{p.phaseName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: '#94A3B8' }}>Description</label>
            <Textarea
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
              placeholder="Add description..."
            />
          </div>

          {/* Blocked */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="blocked"
              checked={form.blocked || false}
              onChange={e => setForm({ ...form, blocked: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="blocked" className="text-sm" style={{ color: '#CADCFC' }}>Blocked</label>
            {form.blocked && (
              <Input
                value={form.blockedReason || ''}
                onChange={e => setForm({ ...form, blockedReason: e.target.value })}
                placeholder="Reason for being blocked..."
                className="flex-1 h-8 text-xs"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(239,68,68,0.4)', color: '#F8FAFC' }}
              />
            )}
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={{ color: '#CADCFC' }}>
                Checklist {checklists.length > 0 && <span style={{ color: '#94A3B8' }}>({checkedCount}/{checklists.length})</span>}
              </h3>
            </div>
            {checklists.length > 0 && (
              <div className="mb-2 h-1.5 rounded-full" style={{ background: 'rgba(202,220,252,0.1)' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${(checkedCount / checklists.length) * 100}%`, background: '#00A896' }} />
              </div>
            )}
            <div className="space-y-1.5 mb-2">
              {checklists.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <button onClick={() => toggleCheckMutation.mutate({ id: c.id, isChecked: !c.isChecked })}>
                    {c.isChecked
                      ? <CheckSquare className="w-4 h-4" style={{ color: '#10b981' }} />
                      : <Square className="w-4 h-4" style={{ color: '#475569' }} />}
                  </button>
                  <span className="text-sm" style={{ color: c.isChecked ? '#475569' : '#CADCFC', textDecoration: c.isChecked ? 'line-through' : 'none' }}>{c.checklistText}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                placeholder="Add checklist item..."
                className="h-8 text-sm flex-1"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
                onKeyDown={e => e.key === 'Enter' && newCheckItem && addCheckItemMutation.mutate()}
              />
              <Button size="sm" variant="ghost" onClick={() => newCheckItem && addCheckItemMutation.mutate()} style={{ color: '#00A896' }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: '#94A3B8' }}>Progress %</label>
            <input
              type="range"
              min={0} max={100}
              value={form.progressPct || 0}
              onChange={e => setForm({ ...form, progressPct: +e.target.value })}
              className="w-full"
            />
            <div className="text-xs text-right mt-0.5" style={{ color: '#94A3B8' }}>{form.progressPct || 0}%</div>
          </div>

          {/* Activity / Comments */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#CADCFC' }}>Activity</h3>
            <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                    {(c.author || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color: '#CADCFC' }}>{c.author}</span>
                      <span className="text-xs" style={{ color: '#475569' }}>{new Date(c.created_date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm" style={{ color: '#94A3B8' }}>{c.commentText}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 h-9 text-sm"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
                onKeyDown={e => e.key === 'Enter' && newComment && addCommentMutation.mutate()}
              />
              <Button size="sm" variant="ghost" onClick={() => newComment && addCommentMutation.mutate()} style={{ color: '#00A896' }}>
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}