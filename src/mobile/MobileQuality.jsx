import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { toast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useSession } from '@/lib/SessionContext';
import { MobilePage, Card, Pill, Segmented, Empty, Loading, Field, TextInput, TextArea, Choice, PrimaryButton, ProjectSelect, C, todayIso, fmtDate, myDisplayName, useMobileProjectId } from './ui';
import { PhotoCapture, PhotoStrip, parsePhotos } from './Photos';

const SEVERITY_COLOR = { Minor: C.amber, Major: C.red, Critical: '#dc2626' };
const STATUS_COLOR = { Open: C.amber, 'In Progress': C.blue, Resolved: C.green, Closed: C.muted, Rejected: C.faint };
const OPEN = ['Open', 'In Progress'];

// Quality issues (NonConformity records) — log one from the field with photos, and follow
// open issues through to close-out.
export default function MobileQuality() {
  const session = useSession();
  const canCreate = session.can('QAQCDashboard', 'can_create');
  const canEdit = session.can('QAQCDashboard', 'can_edit');
  const initialProject = useMobileProjectId();
  const [projectId, setProjectId] = useState(initialProject);
  const [view, setView] = useState('open');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: ncs = [], isLoading } = useQuery({
    queryKey: ['m-ncs', projectId],
    enabled: !!projectId,
    queryFn: () => base44.entities.NonConformity.filter({ projectId }, '-detectedDate', 500),
  });
  const list = ncs.filter((n) => (view === 'open' ? OPEN.includes(n.status || 'Open') : true));

  return (
    <MobilePage
      title="Quality issues"
      subtitle="Non-conformities"
      back={projectId ? `/m/project?id=${projectId}` : '/m'}
      right={canCreate && projectId ? (
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: C.accent, color: '#04201d' }}>
          <Plus className="w-4 h-4" /> Log
        </button>
      ) : null}
    >
      <ProjectSelect value={projectId} onChange={setProjectId} />
      <Segmented options={[{ value: 'open', label: `Open (${ncs.filter((n) => OPEN.includes(n.status || 'Open')).length})` }, { value: 'all', label: `All (${ncs.length})` }]} value={view} onChange={setView} />

      {!projectId ? <Empty>Choose a project.</Empty> : isLoading ? <Loading /> : list.length === 0 ? <Empty>No {view === 'open' ? 'open ' : ''}quality issues.</Empty> : list.map((n) => (
        <Card key={n.id} onClick={() => setSelected(n)} className="cursor-pointer active:scale-[0.99] transition-transform">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium" style={{ color: C.text }}>{n.description}</div>
              <div className="text-xs mt-0.5 truncate" style={{ color: C.faint }}>{[n.ncNumber, n.location, n.assignedTo].filter(Boolean).join(' · ')}</div>
            </div>
            <span className="text-xs shrink-0" style={{ color: C.muted }}>{fmtDate(n.detectedDate)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Pill color={SEVERITY_COLOR[n.severity] || C.muted}>{n.severity}</Pill>
            <Pill color={STATUS_COLOR[n.status] || C.muted}>{n.status || 'Open'}</Pill>
            {parsePhotos(n.photos).length > 0 && <Pill color={C.blue}>📷 {parsePhotos(n.photos).length}</Pill>}
            {n.targetCloseDate && n.targetCloseDate < todayIso() && OPEN.includes(n.status || 'Open') && <Pill color={C.red}>Past due</Pill>}
          </div>
        </Card>
      ))}

      <NewIssueSheet open={creating} onClose={() => setCreating(false)} projectId={projectId} ncs={ncs} author={myDisplayName(session)} />
      <IssueSheet item={selected} onClose={() => setSelected(null)} canEdit={canEdit} />
    </MobilePage>
  );
}

function nextNumber(ncs) {
  const max = ncs.reduce((m, n) => Math.max(m, parseInt(String(n.ncNumber || '').replace(/\D+/g, ''), 10) || 0), 0);
  return `NC-${String(max + 1).padStart(3, '0')}`;
}

function NewIssueSheet({ open, onClose, projectId, ncs, author }) {
  const qc = useQueryClient();
  const blank = { description: '', severity: 'Minor', location: '', assignedTo: '', targetCloseDate: '', notes: '' };
  const [form, setForm] = useState(blank);
  const [photos, setPhotos] = useState([]);
  useEffect(() => { if (open) { setForm(blank); setPhotos([]); } }, [open]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () => {
      const payload = {
        projectId, ncNumber: nextNumber(ncs), description: form.description.trim(), severity: form.severity, status: 'Open',
        detectedDate: todayIso(), detectedBy: author, location: form.location, assignedTo: form.assignedTo, notes: form.notes,
        photos: JSON.stringify(photos), ...(form.targetCloseDate ? { targetCloseDate: form.targetCloseDate } : {}),
      };
      return base44.entities.NonConformity.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['m-ncs', projectId] }); toast({ title: 'Quality issue logged' }); onClose(); },
    onError: (e) => toast({ title: 'Could not log the issue', description: e?.message || 'Check your connection and try again.', variant: 'destructive' }),
  });

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: C.border, color: C.text }}>
        <div className="px-4 pb-6 max-h-[85vh] overflow-y-auto space-y-3">
          <DrawerHeader className="px-0 text-left"><DrawerTitle style={{ color: C.text }}>Log a quality issue</DrawerTitle></DrawerHeader>
          <Field label="What's wrong? *"><TextArea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="e.g. Weld porosity on pipe rack beam B4" /></Field>
          <Field group label="Severity"><Choice options={['Minor', 'Major', 'Critical']} value={form.severity} colors={SEVERITY_COLOR} onChange={(v) => set('severity', v)} /></Field>
          <Field group label="Photos"><PhotoCapture value={photos} onChange={setPhotos} /></Field>
          <Field label="Location"><TextInput value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Building / zone / grid line" /></Field>
          <Field label="Assign to"><TextInput value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} placeholder="Contractor or person" /></Field>
          <Field label="Close by"><TextInput type="date" min={todayIso()} value={form.targetCloseDate} onChange={(e) => set('targetCloseDate', e.target.value)} /></Field>
          <Field label="Notes"><TextArea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
          <PrimaryButton disabled={!form.description.trim() || create.isPending} onClick={() => create.mutate()}>{create.isPending ? 'Saving…' : 'Log issue'}</PrimaryButton>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function IssueSheet({ item, onClose, canEdit }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(item?.status);
  const [action, setAction] = useState(item?.correctiveAction || '');
  useEffect(() => { setStatus(item?.status || 'Open'); setAction(item?.correctiveAction || ''); }, [item?.id]);

  const update = useMutation({
    mutationFn: () => base44.entities.NonConformity.update(item.id, {
      status, correctiveAction: action,
      ...(['Resolved', 'Closed'].includes(status) && !item.actualCloseDate ? { actualCloseDate: todayIso() } : {}),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['m-ncs'] }); toast({ title: 'Issue updated' }); onClose(); },
    onError: (e) => toast({ title: 'Could not update', description: e?.message, variant: 'destructive' }),
  });

  return (
    <Drawer open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: C.border, color: C.text }}>
        {item && (
          <div className="px-4 pb-6 max-h-[85vh] overflow-y-auto space-y-3">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle style={{ color: C.text }}>{item.ncNumber} · {item.severity}</DrawerTitle>
              <p className="text-xs" style={{ color: C.muted }}>Found {fmtDate(item.detectedDate)} by {item.detectedBy || '—'}{item.location ? ` · ${item.location}` : ''}</p>
            </DrawerHeader>
            <p className="text-sm" style={{ color: C.text }}>{item.description}</p>
            <PhotoStrip uris={parsePhotos(item.photos)} />
            {item.notes && <p className="text-sm" style={{ color: C.muted }}>{item.notes}</p>}
            <p className="text-xs" style={{ color: C.muted }}>Assigned to {item.assignedTo || '—'} · close by {fmtDate(item.targetCloseDate)}</p>
            {canEdit ? (
              <>
                <Field group label="Status"><Choice options={['Open', 'In Progress', 'Resolved', 'Closed']} value={status} colors={STATUS_COLOR} onChange={setStatus} /></Field>
                <Field label="Corrective action"><TextArea value={action} onChange={(e) => setAction(e.target.value)} placeholder="What was done to fix it?" /></Field>
                <PrimaryButton disabled={update.isPending} onClick={() => update.mutate()}>{update.isPending ? 'Saving…' : 'Save'}</PrimaryButton>
              </>
            ) : (
              item.correctiveAction && <p className="text-sm" style={{ color: C.text }}>Corrective action: {item.correctiveAction}</p>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
