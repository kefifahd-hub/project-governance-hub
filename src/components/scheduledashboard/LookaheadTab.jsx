import { addDays, format, parseISO, isWithinInterval, startOfDay } from 'date-fns';

const card = { background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' };

export default function LookaheadTab({ activities }) {
  const today = startOfDay(new Date());
  const end14 = addDays(today, 14);

  const lookahead = activities.filter(a => {
    const s = a.plannedStartDate ? parseISO(a.plannedStartDate) : null;
    const f = a.plannedFinishDate ? parseISO(a.plannedFinishDate) : null;
    const range = { start: today, end: end14 };
    return (s && isWithinInterval(s, range)) || (f && isWithinInterval(f, range));
  });

  const week1 = lookahead.filter(a => {
    const s = a.plannedStartDate ? parseISO(a.plannedStartDate) : null;
    const f = a.plannedFinishDate ? parseISO(a.plannedFinishDate) : null;
    const w1end = addDays(today, 7);
    return (s && s <= w1end) || (f && f <= w1end);
  });
  const week2 = lookahead.filter(a => !week1.includes(a));

  const projectStart = activities.reduce((min, a) => {
    if (!a.plannedStartDate) return min;
    return !min || a.plannedStartDate < min ? a.plannedStartDate : min;
  }, null);

  const projectEnd = activities.reduce((max, a) => {
    if (!a.plannedFinishDate) return max;
    return !max || a.plannedFinishDate > max ? a.plannedFinishDate : max;
  }, null);

  const ganttStart = today;
  const ganttEnd = end14;
  const totalMs = ganttEnd - ganttStart;

  const barStyle = (a) => {
    const s = a.plannedStartDate ? Math.max(parseISO(a.plannedStartDate), ganttStart) : ganttStart;
    const f = a.plannedFinishDate ? Math.min(parseISO(a.plannedFinishDate), ganttEnd) : ganttEnd;
    const left = ((s - ganttStart) / totalMs) * 100;
    const width = Math.max(1, ((f - s) / totalMs) * 100);
    const pct = a.percentComplete || 0;
    const isCrit = a.isCriticalPath || (a.totalFloat != null && a.totalFloat <= 0);
    return { left: `${left}%`, width: `${width}%`, pct, isCrit };
  };

  if (!lookahead.length) return (
    <div className="flex flex-col items-center py-16 gap-2">
      <span className="text-4xl">📅</span>
      <p style={{ color: '#64748b' }}>No activities starting or finishing in the next 14 days.</p>
    </div>
  );

  const WeekSection = ({ title, items, weekColor }) => (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: weekColor }}>{title} — {items.length} activities</div>
      <div className="rounded-xl overflow-hidden" style={card}>
        {/* Gantt header */}
        <div className="flex text-[10px] px-4 py-1.5" style={{ borderBottom: '1px solid rgba(202,220,252,0.08)', color: '#475569' }}>
          <div className="w-64 shrink-0">Activity</div>
          <div className="flex-1 flex justify-between">
            {Array.from({ length: 7 }, (_, d) => (
              <span key={d}>{format(addDays(ganttStart, d + (title.includes('Week 2') ? 7 : 0)), 'dd/MM')}</span>
            ))}
          </div>
        </div>
        {items.map((a, i) => {
          const { left, width, pct, isCrit } = barStyle(a);
          return (
            <div key={a.id} className="flex items-center px-4 py-1.5 gap-3" style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.3)' : 'transparent', borderBottom: '1px solid rgba(202,220,252,0.04)' }}>
              <div className="w-64 shrink-0 flex flex-col">
                <span className="text-xs truncate" style={{ color: '#CADCFC' }} title={a.activityName}>{a.activityName}</span>
                <span className="text-[10px]" style={{ color: '#475569' }}>{a.activityId || ''}</span>
              </div>
              <div className="flex-1 relative h-5 rounded" style={{ background: 'rgba(202,220,252,0.05)' }}>
                <div className="absolute top-0 h-full rounded overflow-hidden" style={{ left, width, background: isCrit ? 'rgba(239,68,68,0.25)' : 'rgba(2,128,144,0.15)', border: `1px solid ${isCrit ? '#ef4444' : '#028090'}` }}>
                  <div className="h-full rounded" style={{ width: `${pct}%`, background: isCrit ? 'rgba(239,68,68,0.6)' : 'rgba(0,168,150,0.6)' }} />
                </div>
                <span className="absolute right-1 top-0 text-[9px] leading-5" style={{ color: '#64748b' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 text-xs" style={{ color: '#64748b' }}>
        <span>📅 {format(today, 'd MMM')} — {format(end14, 'd MMM yyyy')}</span>
        <span>|</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded" style={{ background: 'rgba(0,168,150,0.6)' }} /> Normal</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded" style={{ background: 'rgba(239,68,68,0.6)' }} /> Critical</span>
      </div>
      {week1.length > 0 && <WeekSection title="Week 1" items={week1} weekColor="#00A896" />}
      {week2.length > 0 && <WeekSection title="Week 2" items={week2} weekColor="#f59e0b" />}
    </div>
  );
}