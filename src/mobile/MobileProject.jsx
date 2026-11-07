import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, HardHat, ShieldAlert, FileText, Monitor } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSession } from '@/lib/SessionContext';
import { createPageUrl } from '@/utils';
import { MobilePage, Card, SectionTitle, RagDot, Pill, Stat, Empty, Loading, C, RAG, healthRag, fmtDate, isOverdue, useMobileProjectId, useProject } from './ui';

// One scrolling page per project: the status an executive or PM wants at a glance.
export default function MobileProject() {
  const projectId = useMobileProjectId();
  const { can } = useSession();
  const { data: project, isLoading } = useProject(projectId);

  useEffect(() => {
    if (projectId) try { sessionStorage.setItem('pmo_last_project_id', projectId); } catch { /* storage blocked */ }
  }, [projectId]);

  const q = (key, entity, sort, limit = 200) => ({
    queryKey: ['m-proj', key, projectId],
    enabled: !!projectId,
    queryFn: () => base44.entities[entity].filter({ projectId }, sort, limit),
  });
  const { data: reports = [] } = useQuery(q('reports', 'WeeklyReport', '-reportingPeriodEnd', 1));
  const { data: risks = [] } = useQuery(q('risks', 'Risk', '-riskScore'));
  const { data: milestones = [] } = useQuery(q('milestones', 'Milestone', 'dueDate'));
  const { data: actions = [] } = useQuery(q('actions', 'ActionItem', 'dueDate', 1000));
  const { data: ncs = [] } = useQuery(q('ncs', 'NonConformity', '-detectedDate'));
  const { data: budget = [] } = useQuery(q('budget', 'BudgetTracking', '-month', 1000));

  if (!projectId) return <MobilePage title="Project" back="/m"><Empty>Pick a project from the portfolio.</Empty></MobilePage>;
  if (isLoading) return <MobilePage title="Project" back="/m"><Loading /></MobilePage>;
  if (!project) return <MobilePage title="Project" back="/m"><Empty>Project not found or not accessible.</Empty></MobilePage>;

  const report = reports[0];
  const openRisks = risks.filter((r) => r.status !== 'Closed');
  const nextMilestones = milestones.filter((m) => m.status !== 'Complete').slice(0, 3);
  const overdue = actions.filter(isOverdue);
  const openNcs = ncs.filter((n) => !['Closed', 'Resolved', 'Rejected'].includes(n.status));
  const planned = budget.reduce((s, b) => s + (Number(b.plannedEurK) || 0), 0);
  const actual = budget.reduce((s, b) => s + (Number(b.actualEurK) || 0), 0);
  const rag = report?.overallRag || healthRag(project.healthScore);

  const shortcuts = [
    can('ActionTracker') && { to: `/m/actions?id=${projectId}`, icon: CheckSquare, label: 'Actions', badge: overdue.length || null },
    can('Reports') && { to: `/m/site-report?id=${projectId}`, icon: HardHat, label: 'Site report' },
    can('QAQCDashboard') && { to: `/m/quality?id=${projectId}`, icon: ShieldAlert, label: 'Quality', badge: openNcs.length || null },
    { to: `/m/review?id=${projectId}`, icon: FileText, label: 'Reports & risks' },
  ].filter(Boolean);

  return (
    <MobilePage title={project.projectName} subtitle={[project.projectType, project.currentPhase].filter(Boolean).join(' · ')} back="/m">
      <Card>
        <div className="flex items-center gap-2">
          <RagDot rag={rag} size={12} />
          <span className="font-semibold" style={{ color: RAG[rag] || C.text }}>{rag ? `Overall ${rag}` : 'No status yet'}</span>
          {project.status && project.status !== 'Active' && <Pill color={C.amber}>{project.status}</Pill>}
        </div>
        {report?.executiveSummary && <p className="text-sm mt-2" style={{ color: C.text }}>{report.executiveSummary}</p>}
        {report && <p className="text-xs mt-2" style={{ color: C.faint }}>Week {report.calendarWeek}/{report.year} report · {report.status}</p>}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Budget (€M)" value={project.totalBudgetEurM ?? '—'} />
        <Stat label="Target completion" value={fmtDate(project.targetCompletion)} />
        <Stat label="Spend vs plan (€k)" value={planned ? `${Math.round(actual).toLocaleString()} / ${Math.round(planned).toLocaleString()}` : '—'} color={actual > planned * 1.02 ? C.amber : C.text} />
        <Stat label="Health score" value={project.healthScore ?? '—'} color={RAG[healthRag(project.healthScore)] || C.text} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {shortcuts.map(({ to, icon: Icon, label, badge }) => (
          <Link key={to} to={to} className="relative flex items-center gap-2 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}>
            <Icon className="w-5 h-5" style={{ color: C.accent }} />
            <span className="text-sm font-medium">{label}</span>
            {badge ? <span className="ml-auto text-[11px] font-semibold px-1.5 rounded-full" style={{ background: C.amber, color: '#1f1300' }}>{badge}</span> : null}
          </Link>
        ))}
      </div>

      <SectionTitle>Top risks</SectionTitle>
      <Card className="space-y-3">
        {openRisks.length === 0 ? <Empty>No open risks.</Empty> : openRisks.slice(0, 3).map((r) => (
          <div key={r.id} className="flex items-start gap-2">
            <Pill color={levelColor(r.riskLevel)}>{r.riskLevel || '—'}</Pill>
            <div className="min-w-0">
              <div className="text-sm" style={{ color: C.text }}>{r.riskDescription}</div>
              <div className="text-xs" style={{ color: C.faint }}>{[r.category, r.owner].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
        ))}
      </Card>

      <SectionTitle>Next milestones</SectionTitle>
      <Card className="space-y-3">
        {nextMilestones.length === 0 ? <Empty>No upcoming milestones.</Empty> : nextMilestones.map((m) => (
          <div key={m.id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm" style={{ color: C.text }}>{m.phaseName}</div>
              <div className="h-1.5 rounded-full mt-1.5" style={{ background: 'rgba(148,163,184,0.2)' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${m.completionPercent || 0}%`, background: m.status === 'Blocked' ? C.red : C.accent }} />
              </div>
            </div>
            <div className="text-xs text-right shrink-0" style={{ color: m.status === 'Blocked' ? C.red : C.muted }}>
              {m.status === 'Blocked' ? 'Blocked' : fmtDate(m.dueDate)}
            </div>
          </div>
        ))}
      </Card>

      <SectionTitle>Overdue actions</SectionTitle>
      <Card className="space-y-2">
        {overdue.length === 0 ? <Empty>Nothing overdue. 🎉</Empty> : overdue.slice(0, 4).map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2">
            <span className="text-sm truncate" style={{ color: C.text }}>{a.title}</span>
            <span className="text-xs shrink-0" style={{ color: C.amber }}>{fmtDate(a.dueDate)}</span>
          </div>
        ))}
      </Card>

      <a href={createPageUrl(`ProjectDashboard?id=${projectId}&full=1`)} className="flex items-center justify-center gap-2 py-3 text-sm" style={{ color: C.muted }}>
        <Monitor className="w-4 h-4" /> Open all tools (best on a larger screen)
      </a>
    </MobilePage>
  );
}

const levelColor = (l) => ({ Critical: C.red, High: C.amber, Medium: C.blue, Low: C.green }[l] || C.muted);
