const card = { background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' };

export default function CriticalPathTab({ activities }) {
  const critical = activities.filter(a => a.isCriticalPath || (a.totalFloat != null && a.totalFloat <= 0));

  if (!critical.length) return (
    <div className="flex flex-col items-center py-16 gap-2">
      <span className="text-4xl">✅</span>
      <p style={{ color: '#64748b' }}>No critical path activities found.</p>
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden" style={{ ...card, border: '1px solid rgba(239,68,68,0.2)' }}>
      <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#ef4444', borderBottom: '1px solid rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.05)' }}>
        ⚡ {critical.length} Critical Path Activities
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'rgba(239,68,68,0.08)' }}>
              {['ID', 'Activity Name', 'Planned Start', 'Planned Finish', 'Total Float', '% Complete', 'Status'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider" style={{ color: '#ef4444', fontSize: '0.65rem', opacity: 0.7, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {critical.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.02)', borderBottom: '1px solid rgba(239,68,68,0.06)' }}>
                <td className="px-3 py-2 font-mono" style={{ color: '#f87171', whiteSpace: 'nowrap' }}>{a.activityId || '—'}</td>
                <td className="px-3 py-2 max-w-xs truncate font-medium" style={{ color: '#CADCFC' }} title={a.activityName}>{a.activityName}</td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#64748b' }}>{a.plannedStartDate || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#64748b' }}>{a.plannedFinishDate || '—'}</td>
                <td className="px-3 py-2 font-bold" style={{ color: '#ef4444' }}>{a.totalFloat != null ? `${a.totalFloat}d` : '0d'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.15)' }}>
                      <div className="h-full rounded-full" style={{ width: `${a.percentComplete || 0}%`, background: '#ef4444' }} />
                    </div>
                    <span style={{ color: '#CADCFC' }}>{a.percentComplete || 0}%</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
                    background: a.status === 'Completed' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: a.status === 'Completed' ? '#10b981' : '#f87171',
                  }}>{a.status || 'Not Started'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}