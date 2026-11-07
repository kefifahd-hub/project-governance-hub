import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Loader2, Send } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { toast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useSession } from '@/lib/SessionContext';
import { MobilePage, Card, Pill, Segmented, Empty, Loading, Choice, TextArea, C, fmtDate, isOverdue, useMyNames, myDisplayName, useMobileProjectId, useProjects } from './ui';

const STATUSES = ['To Do', 'In Progress', 'In Review', 'Blocked', 'Done'];
const STATUS_COLORS = { 'To Do': C.muted, 'In Progress': C.blue, 'In Review': '#a855f7', Blocked: C.red, Done: C.green };
const PRIORITY_COLOR = { 'P1 - Critical': C.red, 'P2 - High': C.amber, 'P3 - Medium': C.blue, 'P4 - Low': C.muted };

// "My Actions": open action items across every project the user can see, with quick
// status changes, checklist ticks and comments — the things people do from a phone.
export default function MobileActions() {
  const session = useSession();
  const { scopeFilter, domain, can } = session;
  const myNames = useMyNames();
  const focusProject = useMobileProjectId();
  const [view, setView] = useState('mine');
  const [selected, setSelected] = useState(null);
  const { data: projects = [] } = useProjects();
  const projectName = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.projectName])), [projects]);

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['m-actions', domain?.id || 'all'],
    queryFn: () => base44.entities.ActionItem.filter(scopeFilter({ status: { $nin: ['Done', "Won't Do"] } }), 'dueDate', 2000),
  });

  const isMine = (a) => myNames.includes(String(a.assignee || '').trim().toLowerCase());
  const list = actions
    .filter((a) => !a.archived)
    .filter((a) => (view === 'mine' ? isMine(a) : view === 'overdue' ? isOverdue(a) : a.projectId === focusProject))
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

  return (
    <MobilePage title="Actions" subtitle={view === 'project' ? projectName[focusProject] || 'Current project' : 'Across your projects'}>
      <Segmented
        options={[{ value: 'mine', label: 'Mine' }, { value: 'overdue', label: 'Overdue' }, ...(focusProject ? [{ value: 'project', label: 'This project' }] : [])]}
        value={view}
        onChange={setView}
      />
      {isLoading ? <Loading /> : list.length === 0 ? (
        <Empty>{view === 'mine' ? 'Nothing assigned to you right now.' : 'Nothing here.'}</Empty>
      ) : list.map((a) => (
        <Card key={a.id} onClick={() => setSelected(a)} className="cursor-pointer active:scale-[0.99] transition-transform">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium" style={{ color: C.text }}>{a.title}</div>
              <div className="text-xs mt-0.5 truncate" style={{ color: C.faint }}>
                {[a.itemKey, projectName[a.projectId], view !== 'mine' ? a.assignee : null].filter(Boolean).join(' · ')}
              </div>
            </div>
            <span className="text-xs shrink-0" style={{ color: isOverdue(a) ? C.amber : C.muted }}>{fmtDate(a.dueDate)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Pill color={STATUS_COLORS[a.status] || C.muted}>{a.status}</Pill>
            {a.priority && <Pill color={PRIORITY_COLOR[a.priority]}>{a.priority.split(' - ')[1] || a.priority}</Pill>}
            {isOverdue(a) && <Pill color={C.amber}>Overdue</Pill>}
          </div>
        </Card>
      ))}
      <ActionSheet item={selected} onClose={() => setSelected(null)} canEdit={can('ActionTracker', 'can_edit')} author={myDisplayName(session)} />
    </MobilePage>
  );
}

function ActionSheet({ item, onClose, canEdit, author }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [status, setLocalStatus] = useState(item?.status);
  useEffect(() => setLocalStatus(item?.status), [item?.id, item?.status]);
  const id = item?.id;

  const { data: checklist = [] } = useQuery({
    queryKey: ['m-checklist', id],
    enabled: !!id,
    queryFn: () => base44.entities.ActionChecklist.filter({ actionItemId: id }, 'sortOrder', 100),
  });
  const { data: comments = [] } = useQuery({
    queryKey: ['m-comments', id],
    enabled: !!id,
    queryFn: () => base44.entities.ActionComment.filter({ actionItemId: id }, '-created_date', 20),
  });

  const setStatus = useMutation({
    mutationFn: async (status) => {
      const data = { status, ...(status === 'Done' ? { completedDate: new Date().toISOString().slice(0, 10), progressPct: 100, resolution: 'Done' } : {}), blocked: status === 'Blocked' };
      await base44.entities.ActionItem.update(id, data);
      await base44.entities.ActionComment.create({ actionItemId: id, author, commentText: `Status changed to ${status}`, commentType: 'Status Change' });
    },
    onSuccess: (_, status) => {
      setLocalStatus(status);
      qc.invalidateQueries({ queryKey: ['m-actions'] });
      qc.invalidateQueries({ queryKey: ['m-comments', id] });
      toast({ title: `Marked "${status}"` });
      if (status === 'Done') onClose();
    },
    onError: (e) => toast({ title: 'Could not update', description: e?.message, variant: 'destructive' }),
  });
  const toggle = useMutation({
    mutationFn: ({ cid, isChecked }) => base44.entities.ActionChecklist.update(cid, { isChecked }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m-checklist', id] }),
    onError: (e) => toast({ title: 'Could not update checklist', description: e?.message, variant: 'destructive' }),
  });
  const addComment = useMutation({
    mutationFn: () => base44.entities.ActionComment.create({ actionItemId: id, author, commentText: comment.trim(), commentType: 'Comment' }),
    onSuccess: () => { setComment(''); qc.invalidateQueries({ queryKey: ['m-comments', id] }); },
    onError: (e) => toast({ title: 'Could not add comment', description: e?.message, variant: 'destructive' }),
  });

  return (
    <Drawer open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: C.border, color: C.text }}>
        {item && (
          <div className="px-4 pb-6 max-h-[80vh] overflow-y-auto space-y-4">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle style={{ color: C.text }}>{item.title}</DrawerTitle>
              <p className="text-xs" style={{ color: C.muted }}>{[item.itemKey, item.assignee, `due ${fmtDate(item.dueDate)}`].filter(Boolean).join(' · ')}</p>
            </DrawerHeader>
            {item.description && <p className="text-sm" style={{ color: C.text }}>{item.description}</p>}
            {item.blockedReason && <p className="text-sm" style={{ color: C.red }}>Blocked: {item.blockedReason}</p>}

            {canEdit && (
              <div>
                <p className="text-xs mb-2" style={{ color: C.muted }}>Status</p>
                <Choice options={STATUSES} value={status} colors={STATUS_COLORS} onChange={(s) => s !== status && setStatus.mutate(s)} />
                {setStatus.isPending && <Loader2 className="w-4 h-4 animate-spin mt-2" style={{ color: C.muted }} />}
              </div>
            )}

            {checklist.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs mb-1" style={{ color: C.muted }}>Checklist</p>
                {checklist.map((c) => (
                  <button key={c.id} type="button" disabled={!canEdit} onClick={() => toggle.mutate({ cid: c.id, isChecked: !c.isChecked })} className="w-full flex items-center gap-2 py-2 text-left">
                    {c.isChecked ? <CheckCircle2 className="w-5 h-5" style={{ color: C.green }} /> : <Circle className="w-5 h-5" style={{ color: C.faint }} />}
                    <span className="text-sm" style={{ color: c.isChecked ? C.muted : C.text, textDecoration: c.isChecked ? 'line-through' : 'none' }}>{c.checklistText}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs" style={{ color: C.muted }}>Comments</p>
              {comments.map((c) => (
                <div key={c.id} className="text-sm rounded-xl p-2.5" style={{ background: 'rgba(30,41,59,0.6)' }}>
                  <span style={{ color: C.text }}>{c.commentText}</span>
                  <div className="text-[11px] mt-1" style={{ color: C.faint }}>{c.author} · {fmtDate(c.created_date)}</div>
                </div>
              ))}
              <div className="flex gap-2 items-end">
                <TextArea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" />
                <button type="button" aria-label="Send comment" disabled={!comment.trim() || addComment.isPending} onClick={() => addComment.mutate()} className="p-3 rounded-xl disabled:opacity-40" style={{ background: C.accent, color: '#04201d' }}>
                  {addComment.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
