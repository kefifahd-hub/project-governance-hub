const card = { background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' };

export default function DelayedActivitiesTab({ activities }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const delayed = activities.filter(a => {
    const finish = a.plannedFinishDate ? new Date(a.plannedFinishDate) : null;
    return finish && finish < today && (a.percentComplete || 0) < 100;
  }).map(a => {
    const finish = new Date(a.plannedFinishDate);
    const delayDays = Math.round((today - finish) / 86400000);
    return { ...a, delayDays };
  }).sort((a, b) => b.delayDays - a.delayDays);

  const severity = (d) => {
    if (d > 30) return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Critical' };
    if (d >= 15) return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'High' };
    return { bg: 'rgba(234,179,8,0.12)', color: '#eab308', label: 'Medium' };
  };

  if (!delayed.length) return (
    <div className="flex flex-col items-center py-16 gap-2">
      <span className="text-4xl">✅</span>
      <p style={{ color: '#64748b' }}>No delayed activities — great job!</p>
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden" style={card}>
      <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '1px solid rgba(202,220,252,0.08)' }}>
        {delayed.length} Delayed Activities
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
              {['ID', 'Activity Name', 'Planned Finish', '% Complete', 'Delay (days)', 'Severity', 'Contractors'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider" style={{ color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {delayed.map((a, i) => {
              const sev = severity(a.delayDays);
              return (
                <tr key={a.id} style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(30,39,97,0.2)', borderBottom: '1px solid rgba(202,220,252,0.04)' }}>
                  <td className="px-3 py-2 font-mono" style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{a.activityId || '—'}</td>
                  <td className="px-3 py-2 max-w-xs truncate" style={{ color: '#CADCFC' }} title={a.activityName}>{a.activityName}</td>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#ef4444' }}>{a.plannedFinishDate}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(202,220,252,0.1)' }}>
                        <div className="h-full rounded-full" style={{ width: `${a.percentComplete || 0}%`, background: '#028090' }} />
                      </div>
                      <span style={{ color: '#94A3B8' }}>{a.percentComplete || 0}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-bold" style={{ color: sev.color }}>+{a.delayDays}d</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                  </td>
                  <td className="px-3 py-2" style={{ color: '#64748b' }}>{a.contractors || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}