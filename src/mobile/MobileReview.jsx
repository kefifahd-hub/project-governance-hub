import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSession } from '@/lib/SessionContext';
import { MobilePage, Card, Pill, Segmented, Empty, Loading, ProjectSelect, RagDot, C, fmtDate, useMobileProjectId } from './ui';

const LEVEL_COLOR = { Critical: C.red, High: C.amber, Medium: C.blue, Low: C.green };
const CR_COLOR = (s = '') => (/Approved|Implemented|Closed/.test(s) ? C.green : /Rejected|Withdrawn/.test(s) ? C.faint : /Draft/.test(s) ? C.muted : C.amber);

// Read-only reading view: weekly reports, risks and change requests as cards.
export default function MobileReview() {
  const { can } = useSession();
  const initialProject = useMobileProjectId();
  const [projectId, setProjectId] = useState(initialProject);
  const tabs = [
    can('Reports') || can('WeeklyReports') ? { value: 'reports', label: 'Reports' } : null,
    can('RiskRegister') ? { value: 'risks', label: 'Risks' } : null,
    can('ChangeManagement') ? { value: 'changes', label: 'Changes' } : null,
  ].filter(Boolean);
  const [picked, setTab] = useState(null);
  // Permissions load asynchronously, so fall back to the first tab the user can see.
  const tab = tabs.some((t) => t.value === picked) ? picked : tabs[0]?.value;

  return (
    <MobilePage title="Reports & risks" subtitle="Read-only" back={projectId ? `/m/project?id=${projectId}` : '/m'}>
      <ProjectSelect value={projectId} onChange={setProjectId} />
      {tabs.length > 1 && <Segmented options={tabs} value={tab} onChange={setTab} />}
      {!projectId ? <Empty>Choose a project.</Empty> : tabs.length === 0 ? <Empty>You don't have access to reports, risks or changes.</Empty>
        : tab === 'reports' ? <Reports projectId={projectId} />
        : tab === 'risks' ? <Risks projectId={projectId} />
        : <Changes projectId={projectId} />}
    </MobilePage>
  );
}

function useList(entity, projectId, sort) {
  return useQuery({
    queryKey: ['m-review', entity, projectId],
    enabled: !!projectId,
    queryFn: () => base44.entities[entity].filter({ projectId }, sort, 300),
  });
}

function Expandable({ header, children }) {
  const [open, setOpen] = useState(false);
  return (
    <Card onClick={() => setOpen((o) => !o)} className="cursor-pointer">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">{header}</div>
        {open ? <ChevronUp className="w-5 h-5 shrink-0" style={{ color: C.faint }} /> : <ChevronDown className="w-5 h-5 shrink-0" style={{ color: C.faint }} />}
      </div>
      {open && <div className="mt-3 pt-3 space-y-2 text-sm" style={{ borderTop: `1px solid ${C.border}`, color: C.text }}>{children}</div>}
    </Card>
  );
}

const Para = ({ label, text }) => (text ? (
  <div>
    <div className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>{label}</div>
    <div className="whitespace-pre-line">{Array.isArray(text) ? text.join('\n') : text}</div>
  </div>
) : null);

function Reports({ projectId }) {
  const { data = [], isLoading } = useList('WeeklyReport', projectId, '-reportingPeriodEnd');
  if (isLoading) return <Loading />;
  if (!data.length) return <Empty>No weekly reports yet.</Empty>;
  return data.map((r) => (
    <Expandable key={r.id} header={
      <>
        <div className="flex items-center gap-2">
          <RagDot rag={r.overallRag} />
          <span className="font-medium" style={{ color: C.text }}>Week {r.calendarWeek}/{r.year}</span>
          <Pill color={r.status === 'Published' ? C.green : C.muted}>{r.status || 'Draft'}</Pill>
        </div>
        <div className="text-xs mt-1" style={{ color: C.faint }}>{fmtDate(r.reportingPeriodStart)} – {fmtDate(r.reportingPeriodEnd)}{r.preparedBy ? ` · ${r.preparedBy}` : ''}</div>
      </>
    }>
      <div className="flex flex-wrap gap-1.5">
        {[['Schedule', r.scheduleRag], ['Cost', r.costRag], ['Risk', r.riskRag], ['Quality', r.qualityRag]].filter(([, v]) => v).map(([k, v]) => (
          <Pill key={k} color={{ Green: C.green, Amber: C.amber, Red: C.red }[v]}>{k}: {v}</Pill>
        ))}
      </div>
      <Para label="Summary" text={r.executiveSummary} />
      <Para label="Highlights" text={r.highlights} />
      <Para label="Concerns" text={r.concerns} />
      <Para label="Next week" text={r.nextWeekFocus} />
    </Expandable>
  ));
}

function Risks({ projectId }) {
  const { data = [], isLoading } = useList('Risk', projectId, '-riskScore');
  const [showClosed, setShowClosed] = useState(false);
  if (isLoading) return <Loading />;
  const list = data.filter((r) => showClosed || r.status !== 'Closed');
  return (
    <>
      <label className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
        <input type="checkbox" className="w-4 h-4 accent-teal-500" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Show closed
      </label>
      {!list.length ? <Empty>No open risks.</Empty> : list.map((r) => (
        <Expandable key={r.id} header={
          <>
            <div className="text-sm font-medium" style={{ color: C.text }}>{r.riskDescription}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Pill color={LEVEL_COLOR[r.riskLevel] || C.muted}>{r.riskLevel || '—'} ({r.riskScore ?? '?'})</Pill>
              {r.category && <Pill>{r.category}</Pill>}
              <Pill color={r.status === 'Closed' ? C.faint : C.blue}>{r.status}</Pill>
            </div>
          </>
        }>
          <Para label="Owner" text={r.owner} />
          <Para label="Mitigation" text={r.mitigationPlan} />
          <Para label="Target closure" text={r.targetClosureDate ? fmtDate(r.targetClosureDate) : null} />
        </Expandable>
      ))}
    </>
  );
}

function Changes({ projectId }) {
  const { data = [], isLoading } = useList('ChangeRequest', projectId, '-raisedDate');
  if (isLoading) return <Loading />;
  if (!data.length) return <Empty>No change requests.</Empty>;
  return data.map((cr) => (
    <Expandable key={cr.id} header={
      <>
        <div className="text-sm font-medium" style={{ color: C.text }}>{cr.crNumber ? `${cr.crNumber} · ` : ''}{cr.title}</div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Pill color={CR_COLOR(cr.status)}>{cr.status || 'Draft'}</Pill>
          {cr.priority && <Pill color={{ Critical: C.red, High: C.amber }[cr.priority] || C.muted}>{cr.priority}</Pill>}
          {cr.category && <Pill>{cr.category}</Pill>}
        </div>
      </>
    }>
      <Para label="Description" text={cr.description} />
      <Para label="Raised" text={[cr.raisedBy, fmtDate(cr.raisedDate)].filter(Boolean).join(' · ')} />
      <Para label="Needed by" text={cr.requiredByDate ? fmtDate(cr.requiredByDate) : null} />
    </Expandable>
  ));
}
