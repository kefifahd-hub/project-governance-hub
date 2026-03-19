import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// ── constants ─────────────────────────────────────────────────────────────────
const ROW_H = 18;
const ROW_GAP = 4;
const LABEL_W = 160;
const HEADER_H = 48;
const MINIMAP_H = 48;
const MINIMAP_LABEL_W = 0;
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const ZOOM_LEVELS = [
  { id: 'full',    label: 'Full' },
  { id: 'year',    label: 'Year' },
  { id: 'quarter', label: 'Qtr'  },
  { id: 'month',   label: 'Month'},
];

const GROUP_OPTIONS = [
  { key: 'flat',       label: 'Flat List' },
  { key: 'building',   label: 'Building'  },
  { key: 'contractor', label: 'Contractor'},
  { key: 'workType',   label: 'Work Type' },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function fmtShort(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function fmtMonthYear(d) {
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function daysDiff(a, b) {
  return Math.round((b - a) / 86400000);
}

function isDelayed(a) {
  const finish = parseDate(a.plannedFinishDate);
  return finish && finish < TODAY && (a.percentComplete || 0) < 100;
}

function barColor(a) {
  if ((a.percentComplete || 0) >= 100 || a.status === 'Completed') return '#10b981';
  if (isDelayed(a)) return '#f97316';
  if (a.isCriticalPath) return '#ef4444';
  if (a.status === 'In Progress' || (a.percentComplete || 0) > 0) return '#3b82f6';
  return '#475569';
}

function getGroupKey(a, groupBy) {
  if (groupBy === 'flat') return 'All Activities';
  if (groupBy === 'building') return a.building || a.wbsCode?.split('.')[0] || 'Unassigned';
  if (groupBy === 'contractor') return a.contractors || 'Unassigned';
  if (groupBy === 'workType') return a.workType || 'Unassigned';
  return 'All Activities';
}

function ticksForRange(startMs, totalDays, zoomLevel) {
  const ticks = [];
  const start = new Date(startMs);

  if (zoomLevel === 'month') {
    // weekly ticks
    const cur = new Date(start);
    cur.setDate(cur.getDate() - cur.getDay()); // align to Sunday
    while (daysDiff(new Date(startMs), cur) < totalDays) {
      if (cur >= new Date(startMs)) ticks.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }
  } else if (zoomLevel === 'quarter') {
    // monthly ticks
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (daysDiff(new Date(startMs), cur) < totalDays) {
      if (cur >= new Date(startMs)) ticks.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
  } else {
    // quarterly ticks
    const cur = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
    while (daysDiff(new Date(startMs), cur) < totalDays) {
      if (cur >= new Date(startMs)) ticks.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 3);
    }
  }
  return ticks;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({ tooltip, containerRef }) {
  if (!tooltip) return null;
  const { x, y, a } = tooltip;
  const finish = parseDate(a.plannedFinishDate);
  const delayed = isDelayed(a);

  return (
    <div style={{
      position: 'fixed', left: x + 12, top: y - 10, zIndex: 9999, pointerEvents: 'none',
      background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(202,220,252,0.15)',
      borderRadius: 8, padding: '8px 12px', minWidth: 220, maxWidth: 300,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <div style={{ color: '#CADCFC', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{a.activityName}</div>
      <div style={{ color: '#64748b', fontSize: 10, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px' }}>
        <span>ID:</span><span style={{ color: '#94a3b8' }}>{a.activityId || '—'}</span>
        <span>Start:</span><span style={{ color: '#94a3b8' }}>{a.plannedStartDate ? fmtShort(parseDate(a.plannedStartDate)) : '—'}</span>
        <span>Finish:</span><span style={{ color: delayed ? '#f97316' : '#94a3b8' }}>{finish ? fmtShort(finish) : '—'}</span>
        <span>Duration:</span><span style={{ color: '#94a3b8' }}>{a.duration != null ? `${a.duration}d` : '—'}</span>
        <span>Progress:</span><span style={{ color: '#94a3b8' }}>{a.percentComplete || 0}%</span>
        <span>Status:</span><span style={{ color: barColor(a) }}>{a.status || 'Not Started'}{a.isCriticalPath ? ' · CP' : ''}{delayed ? ' · DELAYED' : ''}</span>
        {a.contractors ? <><span>Contractor:</span><span style={{ color: '#94a3b8' }}>{a.contractors}</span></> : null}
      </div>
    </div>
  );
}

// ── MiniMap ───────────────────────────────────────────────────────────────────
function MiniMap({ rows, projectStart, totalDays, viewStartDay, viewDays, width, onViewportClick }) {
  const svgRef = useRef(null);
  const mmW = width;

  const dayToX = useCallback((d) => (d / totalDays) * mmW, [totalDays, mmW]);

  const vpX = dayToX(viewStartDay);
  const vpW = Math.max(4, dayToX(viewDays));

  const handleClick = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newStartDay = (clickX / mmW) * totalDays - viewDays / 2;
    onViewportClick(Math.max(0, Math.min(newStartDay, totalDays - viewDays)));
  };

  return (
    <svg ref={svgRef} width={mmW} height={MINIMAP_H} onClick={handleClick}
      style={{ cursor: 'crosshair', background: 'rgba(15,23,42,0.6)', borderRadius: 6, display: 'block' }}>
      {/* bars */}
      {rows.map((row, ri) => {
        const yBase = (ri / rows.length) * MINIMAP_H;
        const rowH = Math.max(1, (MINIMAP_H / rows.length) - 0.5);
        return row.activities.map((a, ai) => {
          const s = parseDate(a.plannedStartDate);
          const f = parseDate(a.plannedFinishDate);
          if (!s || !f) return null;
          const sx = dayToX(daysDiff(projectStart, s));
          const fw = Math.max(1, dayToX(daysDiff(s, f)));
          return <rect key={ai} x={Math.max(0, sx)} y={yBase} width={fw} height={rowH} fill={barColor(a)} opacity={0.7} />;
        });
      })}
      {/* today */}
      {(() => {
        const tx = dayToX(daysDiff(projectStart, TODAY));
        return tx >= 0 && tx <= mmW ? <line x1={tx} y1={0} x2={tx} y2={MINIMAP_H} stroke="#fbbf24" strokeWidth={1} opacity={0.8} /> : null;
      })()}
      {/* viewport */}
      <rect x={Math.max(0, vpX)} y={0} width={Math.min(vpW, mmW - Math.max(0, vpX))} height={MINIMAP_H}
        fill="rgba(202,220,252,0.08)" stroke="rgba(202,220,252,0.4)" strokeWidth={1} />
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TimelineMapTab({ activities }) {
  const [groupBy, setGroupBy] = useState('building');
  const [zoomLevel, setZoomLevel] = useState('full');
  const [viewStartDay, setViewStartDay] = useState(0);
  const [tooltip, setTooltip] = useState(null);
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(900);

  // Pan state
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, startDay: 0 });
  const svgScrollRef = useRef(null);
  const [verticalScroll, setVerticalScroll] = useState(0);

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerW(w);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Parse & filter valid activities
  const validActivities = useMemo(() =>
    activities.filter(a => parseDate(a.plannedStartDate) && parseDate(a.plannedFinishDate)),
    [activities]
  );

  // Project bounds
  const { projectStart, projectEnd, totalDays } = useMemo(() => {
    if (validActivities.length === 0) return { projectStart: TODAY, projectEnd: addDays(TODAY, 365), totalDays: 365 };
    const starts = validActivities.map(a => parseDate(a.plannedStartDate).getTime());
    const ends = validActivities.map(a => parseDate(a.plannedFinishDate).getTime());
    const ps = new Date(Math.min(...starts));
    const pe = new Date(Math.max(...ends));
    const td = Math.max(1, daysDiff(ps, pe));
    return { projectStart: ps, projectEnd: pe, totalDays: td };
  }, [validActivities]);

  // Groups
  const groups = useMemo(() => {
    const map = {};
    for (const a of validActivities) {
      const k = getGroupKey(a, groupBy);
      if (!map[k]) map[k] = [];
      map[k].push(a);
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([name, acts]) => ({ name, activities: acts }));
  }, [validActivities, groupBy]);

  // Rows = group headers + activity rows
  const rows = useMemo(() => {
    const r = [];
    for (const g of groups) {
      r.push({ type: 'group', name: g.name, count: g.activities.length });
      for (const a of g.activities) r.push({ type: 'activity', a });
    }
    return r;
  }, [groups]);

  // Zoom → visible days
  const viewDays = useMemo(() => {
    if (zoomLevel === 'full') return totalDays;
    if (zoomLevel === 'year') return 365;
    if (zoomLevel === 'quarter') return 90;
    if (zoomLevel === 'month') return 30;
    return totalDays;
  }, [zoomLevel, totalDays]);

  const canvasW = Math.max(containerW - LABEL_W, 200);

  const dayToX = useCallback((day) => ((day - viewStartDay) / viewDays) * canvasW, [viewStartDay, viewDays, canvasW]);

  // Ticks
  const ticks = useMemo(() => {
    const startMs = addDays(projectStart, viewStartDay).getTime();
    return ticksForRange(startMs, viewDays, zoomLevel);
  }, [projectStart, viewStartDay, viewDays, zoomLevel]);

  // Today line
  const todayX = dayToX(daysDiff(projectStart, TODAY));
  const todayVisible = todayX >= 0 && todayX <= canvasW;

  // Zoom handlers
  const zoomIn = () => {
    const idx = ZOOM_LEVELS.findIndex(z => z.id === zoomLevel);
    if (idx < ZOOM_LEVELS.length - 1) {
      setZoomLevel(ZOOM_LEVELS[idx + 1].id);
      setViewStartDay(prev => Math.max(0, prev));
    }
  };
  const zoomOut = () => {
    const idx = ZOOM_LEVELS.findIndex(z => z.id === zoomLevel);
    if (idx > 0) {
      setZoomLevel(ZOOM_LEVELS[idx - 1].id);
      setViewStartDay(0);
    }
  };
  const resetZoom = () => { setZoomLevel('full'); setViewStartDay(0); };

  // Scroll sync
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const pct = el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth);
      setViewStartDay(Math.max(0, Math.min(pct * (totalDays - viewDays), totalDays - viewDays)));
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [totalDays, viewDays]);

  const totalH = rows.length * (ROW_H + ROW_GAP) + HEADER_H;

  if (validActivities.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-2">
        <span className="text-4xl">📅</span>
        <p style={{ color: '#64748b' }}>No activities with valid dates to display.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ fontFamily: 'monospace' }}>
      {/* ── Controls ── */}
      <div className="flex items-center gap-3 flex-wrap mb-3 p-3 rounded-xl" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        {/* Group by */}
        <div className="flex gap-1">
          {GROUP_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setGroupBy(o.key)}
              className="px-2.5 py-1 rounded text-[11px] font-medium"
              style={{ background: groupBy === o.key ? 'rgba(2,128,144,0.25)' : 'rgba(30,39,97,0.4)', color: groupBy === o.key ? '#00A896' : '#64748b', border: `1px solid ${groupBy === o.key ? 'rgba(2,128,144,0.4)' : 'rgba(202,220,252,0.1)'}` }}>
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: 'rgba(202,220,252,0.1)' }} />
        {/* Zoom */}
        <div className="flex items-center gap-1">
          {ZOOM_LEVELS.map(z => (
            <button key={z.id} onClick={() => { setZoomLevel(z.id); setViewStartDay(0); }}
              className="px-2 py-1 rounded text-[11px] font-medium"
              style={{ background: zoomLevel === z.id ? 'rgba(59,130,246,0.2)' : 'rgba(30,39,97,0.4)', color: zoomLevel === z.id ? '#3b82f6' : '#64748b', border: `1px solid ${zoomLevel === z.id ? 'rgba(59,130,246,0.4)' : 'rgba(202,220,252,0.1)'}` }}>
              {z.label}
            </button>
          ))}
          <button onClick={zoomIn} className="p-1 rounded" style={{ color: '#64748b' }}><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={zoomOut} className="p-1 rounded" style={{ color: '#64748b' }}><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={resetZoom} className="p-1 rounded" style={{ color: '#64748b' }}><Maximize2 className="w-3.5 h-3.5" /></button>
        </div>
        {/* Legend */}
        <div className="flex gap-3 ml-auto flex-wrap">
          {[['#10b981','Completed'],['#3b82f6','In Progress'],['#f97316','Delayed'],['#ef4444','Critical'],['#475569','Not Started']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1">
              <div style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
              <span style={{ color: '#64748b', fontSize: 10 }}>{l}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div style={{ width: 1, height: 10, background: '#fbbf24' }} />
            <span style={{ color: '#64748b', fontSize: 10 }}>Today</span>
          </div>
        </div>
      </div>

      {/* ── Mini-map ── */}
      <div className="mb-2 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center gap-2 px-2 py-1" style={{ background: 'rgba(15,23,42,0.8)', fontSize: 10, color: '#475569' }}>
          <span>Overview</span>
          <span style={{ marginLeft: 'auto' }}>{fmtShort(projectStart)} → {fmtShort(projectEnd)} ({totalDays}d)</span>
        </div>
        <MiniMap
          rows={groups}
          projectStart={projectStart}
          totalDays={totalDays}
          viewStartDay={viewStartDay}
          viewDays={viewDays}
          width={containerW}
          onViewportClick={setViewStartDay}
        />
      </div>

      {/* ── Gantt ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)', background: 'rgba(15,23,42,0.5)' }}>
        <div style={{ display: 'flex', maxHeight: 520, overflow: 'hidden' }}>
          {/* Label column */}
          <div style={{ width: LABEL_W, flexShrink: 0, overflowY: 'hidden', borderRight: '1px solid rgba(202,220,252,0.08)' }}>
            {/* Header spacer */}
            <div style={{ height: HEADER_H, background: 'rgba(30,39,97,0.6)', borderBottom: '1px solid rgba(202,220,252,0.1)' }} />
            {/* Row labels */}
            <div style={{ overflowY: 'auto', maxHeight: 520 - HEADER_H }} id="label-scroll">
              {rows.map((row, i) => {
                if (row.type === 'group') {
                  return (
                    <div key={i} style={{ height: ROW_H + ROW_GAP, display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 4, background: 'rgba(30,39,97,0.5)', borderBottom: '1px solid rgba(202,220,252,0.06)' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#00A896', fontFamily: 'sans-serif', truncate: true }} className="truncate">{row.name}</span>
                      <span style={{ fontSize: 9, color: '#334155', marginLeft: 4 }}>({row.count})</span>
                    </div>
                  );
                }
                const { a } = row;
                return (
                  <div key={i} style={{ height: ROW_H + ROW_GAP, display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 4, borderBottom: '1px solid rgba(202,220,252,0.03)' }}>
                    <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'sans-serif' }} className="truncate" title={a.activityName}>
                      {a.activityName || '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canvas column */}
          <div ref={scrollRef} style={{ flex: 1, overflowX: zoomLevel !== 'full' ? 'auto' : 'hidden', overflowY: 'auto' }}
            onMouseLeave={() => setTooltip(null)}>
            <svg width={canvasW} height={totalH} style={{ display: 'block' }}>
              {/* Header background */}
              <rect x={0} y={0} width={canvasW} height={HEADER_H} fill="rgba(30,39,97,0.6)" />

              {/* Tick lines & labels */}
              {ticks.map((tick, i) => {
                const x = dayToX(daysDiff(projectStart, tick));
                if (x < 0 || x > canvasW) return null;
                return (
                  <g key={i}>
                    <line x1={x} y1={HEADER_H - 8} x2={x} y2={totalH} stroke="rgba(202,220,252,0.05)" strokeWidth={1} />
                    <text x={x + 3} y={HEADER_H - 16} fill="#334155" fontSize={9} fontFamily="sans-serif">
                      {zoomLevel === 'month' ? fmtShort(tick) : fmtMonthYear(tick)}
                    </text>
                    <line x1={x} y1={HEADER_H - 4} x2={x} y2={HEADER_H} stroke="rgba(202,220,252,0.2)" strokeWidth={1} />
                  </g>
                );
              })}

              {/* Header border */}
              <line x1={0} y1={HEADER_H} x2={canvasW} y2={HEADER_H} stroke="rgba(202,220,252,0.1)" strokeWidth={1} />

              {/* Activity bars */}
              {rows.map((row, i) => {
                const y = HEADER_H + i * (ROW_H + ROW_GAP) + ROW_GAP / 2;
                if (row.type === 'group') {
                  return <rect key={i} x={0} y={y} width={canvasW} height={ROW_H + ROW_GAP} fill="rgba(30,39,97,0.3)" />;
                }
                const { a } = row;
                const s = parseDate(a.plannedStartDate);
                const f = parseDate(a.plannedFinishDate);
                if (!s || !f) return null;
                const sx = dayToX(daysDiff(projectStart, s));
                const fw = Math.max(2, dayToX(daysDiff(s, f)));
                const color = barColor(a);
                const pct = a.percentComplete || 0;
                const barY = y + 3;
                const barH = ROW_H - 6;

                return (
                  <g key={i}
                    onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, a })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: 'pointer' }}>
                    {/* bar background */}
                    <rect x={sx} y={barY} width={fw} height={barH} rx={2} fill={color} opacity={0.25} />
                    {/* bar fill */}
                    <rect x={sx} y={barY} width={fw * pct / 100} height={barH} rx={2} fill={color} opacity={0.9} />
                    {/* border */}
                    <rect x={sx} y={barY} width={fw} height={barH} rx={2} fill="none" stroke={color} strokeWidth={0.8} opacity={0.6} />
                  </g>
                );
              })}

              {/* Today line */}
              {todayVisible && (
                <g>
                  <line x1={todayX} y1={0} x2={todayX} y2={totalH} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.85} />
                  <rect x={todayX - 14} y={4} width={28} height={14} rx={3} fill="rgba(251,191,36,0.15)" />
                  <text x={todayX} y={15} textAnchor="middle" fill="#fbbf24" fontSize={8} fontFamily="sans-serif" fontWeight="bold">TODAY</text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      <Tooltip tooltip={tooltip} containerRef={containerRef} />

      {/* Stats row */}
      <div className="flex gap-3 mt-3 flex-wrap">
        {[
          { label: 'Total', value: validActivities.length, color: '#CADCFC' },
          { label: 'Groups', value: groups.length, color: '#94a3b8' },
          { label: 'Completed', value: validActivities.filter(a => (a.percentComplete || 0) >= 100).length, color: '#10b981' },
          { label: 'Delayed', value: validActivities.filter(isDelayed).length, color: '#f97316' },
          { label: 'Critical', value: validActivities.filter(a => a.isCriticalPath).length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <span style={{ color: '#475569' }}>{s.label}:</span>
            <span style={{ color: s.color, fontWeight: 600 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}