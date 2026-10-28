import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSession } from '@/lib/SessionContext';

/**
 * Portfolio summary for the Home welcome screen.
 *
 * Everything here is derived from data the signed-in user may read, restricted to
 * the same org-scoped project list that powers "Your Projects" (`projects`).
 * Nothing is hardcoded: with no projects the stats fall to zero and the feed is empty.
 */

const formatWhen = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const truncate = (text = '', max = 60) => {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

export default function useWelcomeSummary(projects = []) {
  const { scopeFilter } = useSession();
  const projectIds = useMemo(() => projects.map((p) => p.id).filter(Boolean), [projects]);
  const scopeKey = projectIds.join(',');

  // People with work assigned on the user's own projects.
  const { data: teamCount = 0 } = useQuery({
    queryKey: ['welcome-team-members', scopeKey],
    enabled: projectIds.length > 0,
    queryFn: async () => {
      const page = await base44.entities.ActionItem.filter(
        scopeFilter({ projectId: { $in: projectIds } }),
        { limit: 500 }
      );
      const people = new Set();
      (page?.items || []).forEach((item) => {
        const names = [item.assignee, ...(item.coAssignees ? String(item.coAssignees).split(',') : [])];
        names
          .map((n) => String(n || '').trim().toLowerCase())
          .filter(Boolean)
          .forEach((n) => people.add(n));
      });
      return people.size;
    },
  });

  const { data: feed = [] } = useQuery({
    queryKey: ['welcome-activity', scopeKey],
    enabled: projectIds.length > 0,
    queryFn: async () => {
      const scope = scopeFilter({ projectId: { $in: projectIds } });
      const options = { sort: '-updated_date', limit: 3 };
      const [reports, risks, changes, siteReports] = await Promise.all([
        base44.entities.WeeklyReport.filter(scope, options),
        base44.entities.Risk.filter(scope, options),
        base44.entities.ChangeRequest.filter(scope, options),
        base44.entities.DailySiteReport.filter(scope, options),
      ]);

      const rows = [];
      const add = (page, type, describe) => {
        (page?.items || []).forEach((record) => {
          const text = describe(record);
          if (text) {
            rows.push({
              id: `${type}-${record.id}`,
              type,
              text,
              at: record.updated_date || record.created_date,
              projectId: record.projectId,
            });
          }
        });
      };

      add(reports, 'report', (r) =>
        `Weekly report ${r.reportNumber || ''} ${r.status ? String(r.status).toLowerCase() : 'updated'}`.trim()
      );
      add(risks, 'risk', (r) =>
        r.riskDescription ? `${r.riskLevel || 'Open'} risk: ${truncate(r.riskDescription, 56)}` : ''
      );
      add(changes, 'change', (c) =>
        c.title ? `${c.crNumber || 'Change request'} · ${truncate(c.title, 52)}` : ''
      );
      add(siteReports, 'site', (s) =>
        `Daily site report ${s.reportRef || ''} ${s.status ? String(s.status).toLowerCase() : 'updated'}`.trim()
      );

      return rows
        .filter((row) => row.at)
        .sort((a, b) => new Date(b.at) - new Date(a.at))
        .slice(0, 6);
    },
  });

  const activity = useMemo(() => {
    const codeById = new Map(projects.map((p) => [p.id, (p.projectName || '').slice(0, 2).toUpperCase()]));
    return feed.map((row) => ({
      ...row,
      code: codeById.get(row.projectId) || '',
      time: formatWhen(row.at),
    }));
  }, [feed, projects]);

  const stats = useMemo(() => {
    const investment = projects.reduce((sum, p) => sum + (Number(p.totalBudgetEurM) || 0), 0);
    return [
      { label: 'Active Projects', value: String(projects.length), icon: '📁' },
      {
        label: 'Total Investment',
        value: `€${investment % 1 === 0 ? investment : investment.toFixed(1)}M`,
        icon: '💰',
      },
      // No capacity field exists on any project record, so the tile stays neutral
      // instead of borrowing another project's figure.
      { label: 'Total Capacity', value: '—', icon: '⚡' },
      { label: 'Team Members', value: String(teamCount), icon: '👥' },
    ];
  }, [projects, teamCount]);

  return { stats, activity };
}