import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { addDays, format } from 'date-fns';

const ITERATIONS = 1000;

export default function MonteCarloTab({ activities }) {
  const results = useMemo(() => {
    const today = new Date();
    const incomplete = activities.filter(a => (a.percentComplete || 0) < 100 && a.remainingDuration > 0);
    if (!incomplete.length) return null;

    const completionDays = [];
    for (let i = 0; i < ITERATIONS; i++) {
      let maxDay = 0;
      for (const a of incomplete) {
        const base = a.remainingDuration || 1;
        const variance = base * 0.2;
        const simulated = base + (Math.random() * 2 - 1) * variance;
        if (simulated > maxDay) maxDay = simulated;
      }
      completionDays.push(Math.round(maxDay));
    }

    completionDays.sort((a, b) => a - b);
    const p50 = completionDays[Math.floor(ITERATIONS * 0.5)];
    const p80 = completionDays[Math.floor(ITERATIONS * 0.8)];
    const p90 = completionDays[Math.floor(ITERATIONS * 0.9)];

    const min = completionDays[0];
    const max = completionDays[ITERATIONS - 1];
    const binCount = 30;
    const binSize = Math.max(1, Math.ceil((max - min) / binCount));
    const bins = {};
    for (const d of completionDays) {
      const bin = Math.floor((d - min) / binSize) * binSize + min;
      bins[bin] = (bins[bin] || 0) + 1;
    }

    const chartData = Object.entries(bins)
      .map(([day, count]) => ({
        day: parseInt(day),
        label: format(addDays(today, parseInt(day)), 'd MMM yy'),
        count,
      }))
      .sort((a, b) => a.day - b.day);

    return {
      chartData,
      p50: { days: p50, date: format(addDays(today, p50), 'd MMM yyyy') },
      p80: { days: p80, date: format(addDays(today, p80), 'd MMM yyyy') },
      p90: { days: p90, date: format(addDays(today, p90), 'd MMM yyyy') },
      incompleteCount: incomplete.length,
    };
  }, [activities]);

  if (!results) return (
    <div className="flex flex-col items-center py-16 gap-2">
      <span className="text-4xl">✅</span>
      <p style={{ color: '#64748b' }}>All activities are complete — Monte Carlo not applicable.</p>
    </div>
  );

  const { chartData, p50, p80, p90, incompleteCount } = results;

  const p50Bin = chartData.find(b => b.day >= p50.days)?.label;
  const p80Bin = chartData.find(b => b.day >= p80.days)?.label;
  const p90Bin = chartData.find(b => b.day >= p90.days)?.label;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'P50 (50% confidence)', ...p50, color: '#10b981' },
          { label: 'P80 (80% confidence)', ...p80, color: '#f59e0b' },
          { label: 'P90 (90% confidence)', ...p90, color: '#ef4444' },
        ].map(p => (
          <div key={p.label} className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.5)', border: `1px solid ${p.color}30` }}>
            <div className="text-xs mb-1" style={{ color: '#64748b' }}>{p.label}</div>
            <div className="text-lg font-bold" style={{ color: p.color }}>{p.date}</div>
            <div className="text-xs mt-0.5" style={{ color: '#475569' }}>+{p.days} days from today</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-5" style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="text-sm font-semibold mb-1" style={{ color: '#CADCFC' }}>Project Completion Distribution</div>
        <div className="text-xs mb-4" style={{ color: '#64748b' }}>{ITERATIONS.toLocaleString()} iterations on {incompleteCount} incomplete activities (±20% duration variance)</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(202,220,252,0.07)" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.15)', borderRadius: 8, color: '#CADCFC' }}
              formatter={(v) => [`${v} iterations`]}
            />
            <Bar dataKey="count" fill="rgba(2,128,144,0.6)" radius={[3, 3, 0, 0]} />
            {p50Bin && <ReferenceLine x={p50Bin} stroke="#10b981" strokeDasharray="4 2" label={{ value: 'P50', fill: '#10b981', fontSize: 10, position: 'top' }} />}
            {p80Bin && <ReferenceLine x={p80Bin} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'P80', fill: '#f59e0b', fontSize: 10, position: 'top' }} />}
            {p90Bin && <ReferenceLine x={p90Bin} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'P90', fill: '#ef4444', fontSize: 10, position: 'top' }} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}