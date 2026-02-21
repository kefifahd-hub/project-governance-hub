import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { Loader2, CheckCircle2, AlertTriangle, Flag } from 'lucide-react';

const STATUS_ICON = {
  Complete: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  'Partial (warnings)': <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  Failed: <AlertTriangle className="w-4 h-4 text-red-400" />,
};

export default function SyncHistoryTab({ projectId }) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['scheduleVersions', projectId],
    queryFn: () => base44.entities.ScheduleVersion.filter({ projectId }, '-importDate'),
    enabled: !!projectId,
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['scheduleSources', projectId],
    queryFn: () => base44.entities.ScheduleSource.filter({ projectId }),
    enabled: !!projectId,
  });

  const sourceMap = Object.fromEntries(sources.map(s => [s.id, s]));

  if (isLoading) return <div className="flex justify-center pt-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#64748b' }} /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold" style={{ color: '#CADCFC' }}>🔄 Sync History</h3>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(30,39,97,0.6)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
              {['Version', 'Source', 'Date', 'Method', 'Tasks', 'Deltas', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {versions.map((v, i) => (
              <tr key={v.id} style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(30,39,97,0.2)', borderBottom: '1px solid rgba(202,220,252,0.05)' }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: '#CADCFC' }}>
                  {v.versionNumber}
                  {v.isBaseline && <span className="ml-2 text-[9px] px-1 rounded" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>BL</span>}
                  {v.isCurrent && <span className="ml-1 text-[9px] px-1 rounded" style={{ background: 'rgba(0,168,150,0.2)', color: '#00A896', border: '1px solid rgba(0,168,150,0.3)' }}>NOW</span>}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>{sourceMap[v.sourceId]?.sourceName || v.sourceId}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>{v.importDate ? format(parseISO(v.importDate), 'd MMM yy HH:mm') : '—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>Upload</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#CADCFC' }}>{v.taskCount ?? '—'}</td>
                <td className="px-4 py-3 text-xs">
                  <span style={{ color: v.criticalDeltaCount > 0 ? '#ef4444' : '#94A3B8' }}>
                    {v.deltaCount ?? 0}
                    {v.criticalDeltaCount > 0 && ` (${v.criticalDeltaCount} 🔴)`}
                  </span>
                </td>
                <td className="px-4 py-3">{STATUS_ICON[v.importStatus] || STATUS_ICON.Complete}</td>
              </tr>
            ))}
            {versions.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: '#475569' }}>No imports yet. Upload a schedule file to begin.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}