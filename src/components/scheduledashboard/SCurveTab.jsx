import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, eachMonthOfInterval } from 'date-fns';

export default function SCurveTab({ activities }) {
  const data = useMemo(() => {
    const withFinish = activities.filter(a => a.plannedFinishDate);
    if (!withFinish.length) return [];

    const sorted = [...withFinish].sort((a, b) => a.plannedFinishDate.localeCompare(b.plannedFinishDate));
    const minDate = parseISO(sorted[0].plannedFinishDate);
    const maxDate = parseISO(sorted[sorted.length - 1].plannedFinishDate);

    const months = eachMonthOfInterval({ start: minDate, end: maxDate });
    const total = activities.length;

    return months.map(month => {
      const monthStr = format(month, 'MMM yy');
      const plannedDone = withFinish.filter(a => parseISO(a.plannedFinishDate) <= month).length;
      const actualDone = withFinish.filter(a => {
        return (a.percentComplete || 0) >= 100 && parseISO(a.plannedFinishDate) <= month;
      }).length;
      return {
        month: monthStr,
        Planned: Math.round((plannedDone / total) * 100),
        Actual: Math.round((actualDone / total) * 100),
      };
    });
  }, [activities]);

  if (!data.length) return (
    <div className="flex flex-col items-center py-16 gap-2">
      <span className="text-4xl">📈</span>
      <p style={{ color: '#64748b' }}>Not enough date data to build S-Curve.</p>
    </div>
  );

  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' }}>
      <div className="text-sm font-semibold mb-4" style={{ color: '#CADCFC' }}>Cumulative Progress S-Curve</div>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(202,220,252,0.07)" />
          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} angle={-45} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit="%" domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.15)', borderRadius: 8, color: '#CADCFC' }}
            formatter={(v) => [`${v}%`]}
          />
          <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
          <Line type="monotone" dataKey="Planned" stroke="#028090" strokeWidth={2} dot={false} strokeDasharray="5 3" />
          <Line type="monotone" dataKey="Actual" stroke="#00A896" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#64748b' }}>
        <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed inline-block" style={{ borderColor: '#028090' }} /> Planned baseline</span>
        <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 inline-block" style={{ borderColor: '#00A896' }} /> Actual progress</span>
      </div>
    </div>
  );
}