import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

const SOURCE_BADGE = {
  'Primavera P6': { label: 'P6', bg: 'rgba(59,130,246,0.2)', color: '#3b82f6' },
  'Microsoft Project': { label: 'MSP', bg: 'rgba(16,185,129,0.2)', color: '#10b981' },
};

const TASK_TYPE_COLOR = { Milestone: '#f59e0b', Summary: '#94A3B8', Task: '#CADCFC', LOE: '#64748b' };

export default function ScheduleOverviewTab({ projectId }) {
  const { data: sources = [] } = useQuery({
    queryKey: ['scheduleSources', projectId],
    queryFn: () => base44.entities.ScheduleSource.filter({ projectId }),
    enabled: !!projectId,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['scheduleVersions', projectId],
    queryFn: () => base44.entities.ScheduleVersion.filter({ projectId, isCurrent: true }),
    enabled: !!projectId,
  });

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['scheduleTasks', projectId],
    queryFn: async () => {
      const tasks = await base44.entities.ScheduleTask.filter({ projectId });
      // Only show current versions tasks
      const currentVersionIds = new Set(versions.map(v => v.id));
      return tasks.filter(t => currentVersionIds.has(t.versionId));
    },
    enabled: !!projectId && versions.length > 0,
  });

  const sourceMap = Object.fromEntries(sources.map(s => [s.id, s]));

  const criticalTasks = allTasks.filter(t => t.isCritical).length;
  const milestones = allTasks.filter(t => t.taskType === 'Milestone');
  const lowFloat = allTasks.filter(t => !t.isCritical && t.totalFloat !== undefined && t.totalFloat < 10 && t.status !== 'Complete');

  if (isLoading) return <div className="flex justify-center pt-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#64748b' }} /></div>;

  if (allTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-5xl">📊</span>
        <p className="text-sm" style={{ color: '#64748b' }}>No schedule data yet. Import a file from the Import tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: allTasks.length, color: '#CADCFC' },
          { label: 'Milestones', value: milestones.length, color: '#f59e0b' },
          { label: 'Critical Path', value: criticalTasks, color: '#ef4444' },
          { label: 'Low Float (<10d)', value: lowFloat.length, color: '#f97316' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
            <div className="text-xs" style={{ color: '#64748b' }}>{s.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#CADCFC' }}>Key Milestones</h3>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(30,39,97,0.6)' }}>
                  {['ID', 'Name', 'Source', 'Baseline', 'Planned', 'Variance', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider" style={{ color: '#64748b', fontSize: '0.65rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {milestones.slice(0, 20).map((t, i) => {
                  const src = sourceMap[t.sourceId];
                  const badge = src ? SOURCE_BADGE[src.sourceType] : null;
                  const varDays = t.baselineFinish && t.plannedFinish
                    ? Math.round((new Date(t.plannedFinish) - new Date(t.baselineFinish)) / 86400000)
                    : null;
                  return (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(30,39,97,0.2)', borderBottom: '1px solid rgba(202,220,252,0.05)' }}>
                      <td className="px-3 py-2 font-mono" style={{ color: '#64748b' }}>{t.externalId}</td>
                      <td className="px-3 py-2 font-medium" style={{ color: '#CADCFC' }}>{t.taskName}</td>
                      <td className="px-3 py-2">
                        {badge && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>}
                      </td>
                      <td className="px-3 py-2" style={{ color: '#64748b' }}>{t.baselineFinish ? format(parseISO(t.baselineFinish), 'd MMM yy') : '—'}</td>
                      <td className="px-3 py-2" style={{ color: '#CADCFC' }}>{t.plannedFinish ? format(parseISO(t.plannedFinish), 'd MMM yy') : '—'}</td>
                      <td className="px-3 py-2" style={{ color: varDays > 0 ? '#ef4444' : varDays < 0 ? '#10b981' : '#64748b' }}>
                        {varDays !== null ? `${varDays > 0 ? '+' : ''}${varDays}d` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
                          background: t.status === 'Complete' ? 'rgba(16,185,129,0.2)' : t.isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.2)',
                          color: t.status === 'Complete' ? '#10b981' : t.isCritical ? '#ef4444' : '#94A3B8'
                        }}>{t.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All tasks table */}
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: '#CADCFC' }}>All Activities ({allTasks.length})</h3>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ background: 'rgba(30,39,97,0.95)' }}>
                <tr>
                  {['ID', 'Name', 'Type', 'Source', 'Start', 'Finish', '% Comp', 'Float', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider" style={{ color: '#64748b', fontSize: '0.65rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTasks.map((t, i) => {
                  const src = sourceMap[t.sourceId];
                  const badge = src ? SOURCE_BADGE[src.sourceType] : null;
                  return (
                    <tr key={t.id} style={{ background: t.isCritical ? 'rgba(239,68,68,0.06)' : i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(30,39,97,0.2)', borderBottom: '1px solid rgba(202,220,252,0.04)' }}>
                      <td className="px-3 py-1.5 font-mono" style={{ color: '#64748b' }}>{t.externalId}</td>
                      <td className="px-3 py-1.5" style={{ color: '#CADCFC', paddingLeft: `${(t.wbsLevel || 0) * 12 + 12}px` }}>{t.taskName}</td>
                      <td className="px-3 py-1.5" style={{ color: TASK_TYPE_COLOR[t.taskType] || '#CADCFC' }}>{t.taskType}</td>
                      <td className="px-3 py-1.5">
                        {badge && <span className="px-1 py-0.5 rounded text-[9px] font-bold" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>}
                      </td>
                      <td className="px-3 py-1.5" style={{ color: '#64748b' }}>{t.plannedStart ? format(parseISO(t.plannedStart), 'd MMM yy') : '—'}</td>
                      <td className="px-3 py-1.5" style={{ color: '#64748b' }}>{t.plannedFinish ? format(parseISO(t.plannedFinish), 'd MMM yy') : '—'}</td>
                      <td className="px-3 py-1.5" style={{ color: '#CADCFC' }}>{t.percentComplete ?? 0}%</td>
                      <td className="px-3 py-1.5" style={{ color: t.isCritical ? '#ef4444' : t.totalFloat < 10 ? '#f97316' : '#64748b' }}>
                        {t.isCritical ? '⚡ 0' : t.totalFloat !== undefined ? `${t.totalFloat}d` : '—'}
                      </td>
                      <td className="px-3 py-1.5" style={{ color: t.status === 'Complete' ? '#10b981' : '#94A3B8' }}>{t.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}