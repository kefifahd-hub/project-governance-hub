const card = { background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' };

export default function ActiveActivitiesTab({ activities }) {
  const active = activities.filter(a => {
    const pct = a.percentComplete || 0;
    return a.status === 'In Progress' || (pct > 0 && pct < 100);
  });

  if (!active.length) return (
    <div className="flex flex-col items-center py-16 gap-2">
      <span className="text-4xl">📭</span>
      <p style={{ color: '#64748b' }}>No active activities found.</p>
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden" style={card}>
      <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '1px solid rgba(202,220,252,0.08)' }}>
        {active.length} Active Activities
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
              {['ID', 'Activity Name', 'Planned Start', 'Planned Finish', '% Complete', 'Remaining (d)', 'Contractors'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider" style={{ color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(30,39,97,0.2)', borderBottom: '1px solid rgba(202,220,252,0.04)' }}>
                <td className="px-3 py-2 font-mono" style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{a.activityId || '—'}</td>
                <td className="px-3 py-2 max-w-xs truncate" style={{ color: '#CADCFC' }} title={a.activityName}>{a.activityName}</td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#64748b' }}>{a.plannedStartDate || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#64748b' }}>{a.plannedFinishDate || '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(202,220,252,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${a.percentComplete || 0}%`, background: '#00A896' }} />
                    </div>
                    <span style={{ color: '#CADCFC' }}>{a.percentComplete || 0}%</span>
                  </div>
                </td>
                <td className="px-3 py-2" style={{ color: '#f59e0b' }}>{a.remainingDuration != null ? `${a.remainingDuration}d` : '—'}</td>
                <td className="px-3 py-2" style={{ color: '#64748b' }}>{a.contractors || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}