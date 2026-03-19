import { useMemo, useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import SCurveComments from './SCurveComments';

// ── helpers ───────────────────────────────────────────────────────────────────
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function periodKey(date, granularity) {
  if (granularity === 'weekly') {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); // Monday
    return d.toISOString().slice(0, 10);
  }
  // monthly
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function periodLabel(key, granularity) {
  if (granularity === 'weekly') {
    const d = new Date(key);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
  const [y, m] = key.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

function sortedKeys(set) { return [...set].sort(); }

function buildTimeline(activities, granularity, mode) {
  // Collect all relevant dates to build the full period range
  const allDates = [];
  for (const a of activities) {
    const s = parseDate(a.plannedStartDate);
    const f = parseDate(a.plannedFinishDate);
    const as = parseDate(a.actualStartDate);
    const af = parseDate(a.actualFinishDate);
    if (s) allDates.push(s);
    if (f) allDates.push(f);
    if (as) allDates.push(as);
    if (af) allDates.push(af);
  }
  if (allDates.length === 0) return { rows: [], periods: [] };

  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Generate all periods in range
  const periods = new Set();
  const cur = new Date(minDate);
  while (cur <= maxDate) {
    periods.add(periodKey(cur, granularity));
    if (granularity === 'weekly') cur.setDate(cur.getDate() + 7);
    else cur.setMonth(cur.getMonth() + 1);
  }
  const sortedPeriods = sortedKeys(periods);

  // Maps: period → cumulative value
  const baselineMap = {};
  const actualMap = {};
  const rebaselineMap = {};
  const forecastMap = {};

  const totalWeight = mode === 'weight'
    ? activities.reduce((s, a) => s + (a.duration || 1), 0)
    : activities.length;

  for (const p of sortedPeriods) {
    baselineMap[p] = 0;
    actualMap[p] = 0;
    rebaselineMap[p] = 0;
    forecastMap[p] = null;
  }

  // ── Baseline (planned finish / planned start by period) ──
  for (const a of activities) {
    const weight = mode === 'weight' ? (a.duration || 1) : 1;
    const date = mode === 'started'
      ? parseDate(a.plannedStartDate)
      : parseDate(a.plannedFinishDate);
    if (!date) continue;
    const pk = periodKey(date, granularity);
    if (baselineMap[pk] !== undefined) baselineMap[pk] += weight;
  }

  // ── Rebaseline (use forecastFinishDate if available, else plannedFinish) ──
  for (const a of activities) {
    const weight = mode === 'weight' ? (a.duration || 1) : 1;
    const date = mode === 'started'
      ? parseDate(a.plannedStartDate)
      : parseDate(a.forecastFinishDate || a.plannedFinishDate);
    if (!date) continue;
    const pk = periodKey(date, granularity);
    if (rebaselineMap[pk] !== undefined) rebaselineMap[pk] += weight;
  }

  // ── Actual ──
  for (const a of activities) {
    const weight = mode === 'weight' ? ((a.duration || 1) * (a.percentComplete || 0) / 100) : 1;
    const date = mode === 'started'
      ? (parseDate(a.actualStartDate) || (a.percentComplete > 0 ? parseDate(a.plannedStartDate) : null))
      : (parseDate(a.actualFinishDate) || ((a.percentComplete || 0) >= 100 ? parseDate(a.plannedFinishDate) : null));
    if (!date) continue;
    const pk = periodKey(date, granularity);
    if (actualMap[pk] !== undefined) actualMap[pk] += weight;
  }

  // Convert incremental → cumulative, then → percentage
  let bCum = 0, aCum = 0, rCum = 0;
  const rows = sortedPeriods.map(p => {
    bCum += baselineMap[p];
    aCum += actualMap[p];
    rCum += rebaselineMap[p];
    const today = new Date();
    const pDate = new Date(p);
    const isPast = pDate <= today;
    return {
      period: p,
      label: periodLabel(p, granularity),
      baseline: totalWeight > 0 ? Math.min(100, (bCum / totalWeight) * 100) : 0,
      rebaseline: totalWeight > 0 ? Math.min(100, (rCum / totalWeight) * 100) : 0,
      actual: isPast ? (totalWeight > 0 ? Math.min(100, (aCum / totalWeight) * 100) : 0) : null,
    };
  });

  // ── Forecast: project from today's actual rate ──
  const todayKey = periodKey(new Date(), granularity);
  const todayIdx = rows.findIndex(r => r.period >= todayKey);
  const anchorIdx = todayIdx > 0 ? todayIdx - 1 : 0;
  const anchorActual = rows[anchorIdx]?.actual ?? 0;

  // Calculate rate from first non-zero to anchor
  const firstIdx = rows.findIndex(r => r.actual !== null && r.actual > 0);
  const periodsWithActual = anchorIdx - firstIdx;
  const rate = periodsWithActual > 0 ? (anchorActual - (rows[firstIdx]?.actual ?? 0)) / periodsWithActual : 0;

  let fCum = anchorActual;
  for (let i = anchorIdx; i < rows.length; i++) {
    if (i === anchorIdx) {
      rows[i].forecast = fCum;
    } else {
      fCum = Math.min(100, fCum + rate);
      rows[i].forecast = fCum;
    }
  }

  return { rows, periods: sortedPeriods };
}

// ── Custom tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, comments }) {
  if (!active || !payload?.length) return null;
  const periodComments = comments.filter(c => c.period === label);
  return (
    <div style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(202,220,252,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 11 }}>
      <div style={{ color: '#CADCFC', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value != null ? `${p.value.toFixed(1)}%` : '—'}</strong>
        </div>
      ))}
      {periodComments.length > 0 && (
        <div style={{ marginTop: 6, borderTop: '1px solid rgba(202,220,252,0.1)', paddingTop: 6 }}>
          {periodComments.map(c => (
            <div key={c.id} style={{ color: '#fbbf24', fontSize: 10 }}>💬 {c.comment}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const MODES = [
  { id: 'finished', label: 'By Finish Date' },
  { id: 'started',  label: 'By Start Date'  },
  { id: 'weight',   label: 'Duration Weighted' },
];

const CURVES = [
  { key: 'baseline',   label: 'Baseline',   color: '#3b82f6', dash: '5 3',  type: 'line' },
  { key: 'rebaseline', label: 'Re-baseline', color: '#a78bfa', dash: '8 4',  type: 'line' },
  { key: 'actual',     label: 'Actual',      color: '#10b981', dash: '',     type: 'area' },
  { key: 'forecast',   label: 'Forecast',    color: '#f97316', dash: '3 3',  type: 'line' },
];

export default function SCurveTab({ activities, projectId }) {
  const [mode, setMode] = useState('finished');
  const [granularity, setGranularity] = useState('monthly');
  const [visible, setVisible] = useState({ baseline: true, rebaseline: true, actual: true, forecast: true });
  const [comments] = useState([]); // live comments come from SCurveComments component below

  const { rows, periods } = useMemo(
    () => buildTimeline(activities, granularity, mode),
    [activities, granularity, mode]
  );

  const periodLabels = useMemo(() => periods.map(p => periodLabel(p, granularity)), [periods, granularity]);

  // Summary stats
  const lastActual = useMemo(() => {
    const withActual = rows.filter(r => r.actual != null);
    return withActual.length > 0 ? withActual[withActual.length - 1].actual : 0;
  }, [rows]);

  const lastBaseline = useMemo(() => {
    const last = rows[rows.length - 1];
    return last ? last.baseline : 0;
  }, [rows]);

  const forecastComplete = useMemo(() => {
    const f100 = rows.find(r => r.forecast != null && r.forecast >= 99.5);
    return f100 ? f100.label : 'Beyond range';
  }, [rows]);

  const toggle = (key) => setVisible(v => ({ ...v, [key]: !v[key] }));

  const card = { background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)', borderRadius: 12, padding: 16 };

  if (activities.length === 0) return (
    <div style={{ textAlign: 'center', padding: '64px 0', color: '#64748b' }}>No activity data available.</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Controls ── */}
      <div style={{ ...card, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Mode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#475569' }}>Calculation Mode</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: mode === m.id ? 600 : 400,
                  background: mode === m.id ? 'rgba(2,128,144,0.25)' : 'rgba(30,39,97,0.4)',
                  color: mode === m.id ? '#00A896' : '#64748b',
                  border: `1px solid ${mode === m.id ? 'rgba(2,128,144,0.4)' : 'rgba(202,220,252,0.1)'}` }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: 'rgba(202,220,252,0.1)' }} />

        {/* Granularity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#475569' }}>Period</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['monthly', 'weekly'].map(g => (
              <button key={g} onClick={() => setGranularity(g)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                  background: granularity === g ? 'rgba(59,130,246,0.2)' : 'rgba(30,39,97,0.4)',
                  color: granularity === g ? '#3b82f6' : '#64748b',
                  border: `1px solid ${granularity === g ? 'rgba(59,130,246,0.4)' : 'rgba(202,220,252,0.1)'}` }}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: 'rgba(202,220,252,0.1)' }} />

        {/* Curve toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#475569' }}>Show Curves</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CURVES.map(c => (
              <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: visible[c.key] ? c.color : '#334155' }}>
                <input type="checkbox" checked={visible[c.key]} onChange={() => toggle(c.key)}
                  style={{ accentColor: c.color, width: 12, height: 12 }} />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Planned (Baseline)', value: `${lastBaseline.toFixed(1)}%`, color: '#3b82f6', sub: 'as of today per baseline' },
          { label: 'Actual Progress', value: `${lastActual.toFixed(1)}%`, color: '#10b981', sub: `${(lastActual - lastBaseline).toFixed(1)}% vs baseline` },
          { label: 'Forecast Completion', value: forecastComplete, color: '#f97316', sub: 'at current rate' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div style={{ ...card, padding: '16px 8px 8px 0' }}>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={rows} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(202,220,252,0.06)" />
            <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(202,220,252,0.1)' }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip comments={comments} />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: '#64748b' }} />

            {/* Today reference line */}
            <ReferenceLine x={periodLabel(periodKey(new Date(), granularity), granularity)}
              stroke="#fbbf24" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: 'Today', fill: '#fbbf24', fontSize: 9, position: 'top' }} />

            {visible.actual && (
              <Area dataKey="actual" name="Actual" stroke="#10b981" fill="rgba(16,185,129,0.12)"
                strokeWidth={2} dot={false} connectNulls={false} activeDot={{ r: 4 }} />
            )}
            {visible.baseline && (
              <Line dataKey="baseline" name="Baseline" stroke="#3b82f6" strokeWidth={1.5}
                strokeDasharray="5 3" dot={false} connectNulls />
            )}
            {visible.rebaseline && (
              <Line dataKey="rebaseline" name="Re-baseline" stroke="#a78bfa" strokeWidth={1.5}
                strokeDasharray="8 4" dot={false} connectNulls />
            )}
            {visible.forecast && (
              <Line dataKey="forecast" name="Forecast" stroke="#f97316" strokeWidth={1.5}
                strokeDasharray="3 3" dot={false} connectNulls />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingLeft: 16, marginTop: 4 }}>
          {CURVES.map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: visible[c.key] ? 1 : 0.3 }}>
              <svg width={20} height={8}>
                <line x1={0} y1={4} x2={20} y2={4} stroke={c.color} strokeWidth={2}
                  strokeDasharray={c.dash || 'none'} />
              </svg>
              <span style={{ fontSize: 10, color: '#64748b' }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Comments ── */}
      {projectId && <SCurveComments projectId={projectId} periods={periodLabels} />}
    </div>
  );
}