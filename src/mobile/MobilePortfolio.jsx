import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSession } from '@/lib/SessionContext';
import { MobilePage, LinkCard, RagDot, Pill, Segmented, Empty, Loading, Stat, C, healthRag, isOverdue, useProjects } from './ui';

// Phone landing page: every project the user can see as a tappable status card.
export default function MobilePortfolio() {
  const { scopeFilter, domain, isAdmin } = useSession();
  const [filter, setFilter] = useState('live');
  const { data: projects = [], isLoading } = useProjects();

  // One org-wide query each for open actions and open risks, grouped per project below.
  const { data: actions = [] } = useQuery({
    queryKey: ['m-open-actions', domain?.id || 'all'],
    queryFn: () => base44.entities.ActionItem.filter(scopeFilter({ status: { $nin: ['Done', "Won't Do"] } }), 'dueDate', 2000),
  });
  const { data: risks = [] } = useQuery({
    queryKey: ['m-open-risks', domain?.id || 'all'],
    queryFn: () => base44.entities.Risk.filter(scopeFilter({ status: { $ne: 'Closed' } }), '-riskScore', 2000),
  });

  const byProject = useMemo(() => {
    const m = {};
    for (const a of actions) if (isOverdue(a)) (m[a.projectId] ||= { overdue: 0, critical: 0 }).overdue++;
    for (const r of risks) if (r.riskLevel === 'Critical') (m[r.projectId] ||= { overdue: 0, critical: 0 }).critical++;
    return m;
  }, [actions, risks]);

  const shown = projects.filter((p) => (filter === 'live' ? ['Active', 'On Hold'].includes(p.status || 'Active') : true));
  const counts = {
    active: projects.filter((p) => (p.status || 'Active') === 'Active').length,
    overdue: Object.values(byProject).reduce((s, v) => s + v.overdue, 0),
    critical: Object.values(byProject).reduce((s, v) => s + v.critical, 0),
  };

  return (
    <MobilePage title="Portfolio" subtitle={isAdmin ? 'All workspaces' : domain?.name}>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Active projects" value={counts.active} />
        <Stat label="Overdue actions" value={counts.overdue} color={counts.overdue ? C.amber : C.text} />
        <Stat label="Critical risks" value={counts.critical} color={counts.critical ? C.red : C.text} />
      </div>

      <Segmented options={[{ value: 'live', label: 'Active & on hold' }, { value: 'all', label: 'All' }]} value={filter} onChange={setFilter} />

      {isLoading ? <Loading /> : shown.length === 0 ? <Empty>No projects yet.</Empty> : shown.map((p) => {
        const rag = healthRag(p.healthScore);
        const stats = byProject[p.id] || { overdue: 0, critical: 0 };
        return (
          <LinkCard key={p.id} to={`/m/project?id=${p.id}`}>
            <div className="flex items-center gap-2">
              <RagDot rag={rag} />
              <span className="font-semibold truncate" style={{ color: C.text }}>{p.projectName}</span>
            </div>
            <div className="text-xs mt-1 truncate" style={{ color: C.muted }}>
              {[p.projectType, p.currentPhase, p.totalBudgetEurM != null ? `€${p.totalBudgetEurM}M` : null].filter(Boolean).join(' · ')}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {p.status && p.status !== 'Active' && <Pill color={p.status === 'On Hold' ? C.amber : C.muted}>{p.status}</Pill>}
              {p.healthScore != null && <Pill color={RAGColor(rag)}>Health {p.healthScore}</Pill>}
              {stats.overdue > 0 && <Pill color={C.amber}>{stats.overdue} overdue</Pill>}
              {stats.critical > 0 && <Pill color={C.red}>{stats.critical} critical risk{stats.critical > 1 ? 's' : ''}</Pill>}
            </div>
          </LinkCard>
        );
      })}
    </MobilePage>
  );
}

const RAGColor = (rag) => ({ Green: C.green, Amber: C.amber, Red: C.red }[rag] || C.muted);
