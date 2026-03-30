import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const ROW_H = 22;
const LABEL_W = 180;
const HEADER_H = 44;
const MINIMAP_H = 56;
const GANTT_H = 460;

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const PX_PER_DAY = { full: null, year: 3, quarter: 10, month: 28 };

const GROUP_OPTIONS = [
  { key: 'building',   label: 'Building'   },
  { key: 'contractor', label: 'Contractor' },
  { key: 'workType',   label: 'Work Type'  },
  { key: 'flat',       label: 'Flat'       },
];

function pd(s) { if (!s) return null; const d = new Date(s); return isNaN(d) ? null : d; }
function fmt(d) { return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }); }
function fmtMY(d) { return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); }
function diff(a, b) { return Math.round((b - a) / 86400000); }
function isLate(a) { const f = pd(a.plannedFinishDate); return f && f < TODAY && (a.percentComplete || 0) < 100; }
function color(a) {
  if ((a.percentComplete || 0) >= 100 || a.status === 'Completed') return '#10b981';
  if (isLate(a)) return '#f97316';
  if (a.isCriticalPath) return '#ef4444';
  if ((a.percentComplete || 0) > 0 || a.status === 'In Progress') return '#3b82f6';
  return '#475569';
}
function groupKey(a, by) {
  if (by === 'flat') return 'All';
  if (by === 'building') return a.building || a.wbsCode?.split('.')[0] || 'Unassigned';
  if (by === 'contractor') return a.contractors || 'Unassigned';
  if (by === 'workType') return a.workType || 'Unassigned';
  return 'All';
}

function ticks(ps, totalDays, pxd) {
  const out = [];
  const interval = pxd >= 20 ? 1 : pxd >= 6 ? 1 : pxd >= 2 ? 3 : 6;
  const cur = new Date(ps.getFullYear(), ps.getMonth(), 1);
  const end = new Date(ps.getTime() + totalDays * 86400000);
  while (cur <= end) { out.push(new Date(cur)); cur.setMonth(cur.getMonth() + interval); }
  return out;
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ tip }) {
  if (!tip) return null;
  const { x, y, a } = tip;
  const late = isLate(a);
  return (
    <div style={{ position: 'fixed', left: x + 14, top: y - 10, zIndex: 9999, pointerEvents: 'none',
      background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(202,220,252,0.15)',
      borderRadius: 8, padding: '8px 12px', minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ color: '#CADCFC', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{a.activityName}</div>
      <div style={{ color: '#64748b', fontSize: 10, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px' }}>
        <span>ID:</span><span style={{ color: '#94a3b8' }}>{a.activityId || '—'}</span>
        <span>Start:</span><span style={{ color: '#94a3b8' }}>{a.plannedStartDate ? fmt(pd(a.plannedStartDate)) : '—'}</span>
        <span>Finish:</span><span style={{ color: late ? '#f97316' : '#94a3b8' }}>{a.plannedFinishDate ? fmt(pd(a.plannedFinishDate)) : '—'}</span>
        <span>Progress:</span><span style={{ color: '#94a3b8' }}>{a.percentComplete || 0}%</span>
        <span>Status:</span><span style={{ color: color(a) }}>{a.status || 'Not Started'}{a.isCriticalPath ? ' · CP' : ''}{late ? ' · LATE' : ''}</span>
        {a.contractors && <><span>Contractor:</span><span style={{ color: '#94a3b8' }}>{a.contractors}</span></>}
      </div>
    </div>
  );
}

// ── MiniMap ──────────────────────────────────────────────────────────────────
// mmW = canvasViewW only (no labels), positioned offset by LABEL_W
function MiniMap({ allActs, ps, totalDays, canvasFullW, scrollLeft, canvasViewW, onSeek }) {
  const ref = useRef(null);
  const dragging = useRef(false);

  // Minimap always shows the FULL project timeline compressed into canvasViewW px.
  // day d → minimap x = (d / totalDays) * canvasViewW
  const dmx = (d) => (d / Math.max(1, totalDays)) * canvasViewW;

  // Viewport rect: scrollLeft in canvas-px → minimap-px via same scale (canvasViewW / canvasFullW)
  const mmScale = canvasViewW / Math.max(1, canvasFullW);
  const vpX = scrollLeft * mmScale;
  const vpW = Math.max(8, canvasViewW * mmScale);

  const todayX = dmx(diff(ps, TODAY));
  const rowH = Math.max(1, MINIMAP_H / Math.max(1, allActs.length));

  const seek = useCallback((clientX) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, canvasViewW));
    // minimap x → canvas scrollLeft (center the viewport on the clicked point)
    const newScroll = (x / canvasViewW) * canvasFullW - canvasViewW / 2;
    onSeek(Math.max(0, Math.min(newScroll, canvasFullW - canvasViewW)));
  }, [canvasViewW, canvasFullW, onSeek]);

  return (
    <div style={{ display: 'flex' }}>
      {/* spacer matching label column */}
      <div style={{ width: LABEL_W, flexShrink: 0, background: 'rgba(10,15,30,0.5)', borderRight: '1px solid rgba(202,220,252,0.08)' }} />
      <svg ref={ref} width={canvasViewW} height={MINIMAP_H}
        style={{ display: 'block', flex: 1, cursor: 'crosshair', userSelect: 'none', background: 'rgba(15,23,42,0.7)' }}
        onMouseDown={(e) => { dragging.current = true; seek(e.clientX); }}
        onMouseMove={(e) => { if (dragging.current) seek(e.clientX); }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
      >
        {allActs.map((a, i) => {
          const s = pd(a.plannedStartDate); const f = pd(a.plannedFinishDate);
          if (!s || !f) return null;
          const sx = dmx(diff(ps, s));
          const w = Math.max(1, dmx(diff(s, f)));
          return <rect key={i} x={Math.max(0, sx)} y={i * rowH} width={w} height={rowH} fill={color(a)} opacity={0.8} />;
        })}
        {todayX > 0 && todayX < canvasViewW &&
          <line x1={todayX} y1={0} x2={todayX} y2={MINIMAP_H} stroke="#fbbf24" strokeWidth={1.5} />}
        {/* viewport rect */}
        <rect x={Math.max(0, vpX)} y={0}
          width={Math.min(vpW, canvasViewW - Math.max(0, vpX))} height={MINIMAP_H}
          fill="rgba(202,220,252,0.12)" stroke="rgba(202,220,252,0.7)" strokeWidth={1.5} rx={1} />
      </svg>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function TimelineMapTab({ activities }) {
  const [groupBy, setGroupBy] = useState('building');
  const [zoomKey, setZoomKey] = useState('full');
  const [scrollLeft, setScrollLeft] = useState(0);
  const [tip, setTip] = useState(null);

  const outerRef = useRef(null);       // full component width
  const ganttRef = useRef(null);       // scrollable gantt pane
  const labelRef = useRef(null);       // label pane (vertical sync)
  const [outerW, setOuterW] = useState(900);

  useEffect(() => {
    const obs = new ResizeObserver(e => { const w = e[0]?.contentRect.width; if (w) setOuterW(w); });
    if (outerRef.current) obs.observe(outerRef.current);
    return () => obs.disconnect();
  }, []);

  const valid = useMemo(() => activities.filter(a => pd(a.plannedStartDate) && pd(a.plannedFinishDate)), [activities]);

  const { ps, pe, totalDays } = useMemo(() => {
    if (!valid.length) return { ps: TODAY, pe: new Date(TODAY.getTime() + 365 * 86400000), totalDays: 365 };
    const ss = valid.map(a => pd(a.plannedStartDate).getTime());
    const es = valid.map(a => pd(a.plannedFinishDate).getTime());
    const p = new Date(Math.min(...ss));
    const e = new Date(Math.max(...es));
    return { ps: p, pe: e, totalDays: Math.max(1, diff(p, e)) };
  }, [valid]);

  const groups = useMemo(() => {
    const m = {};
    for (const a of valid) { const k = groupKey(a, groupBy); if (!m[k]) m[k] = []; m[k].push(a); }
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0])).map(([name, acts]) => ({ name, activities: acts }));
  }, [valid, groupBy]);

  const allActs = useMemo(() => groups.flatMap(g => g.activities), [groups]);

  const rows = useMemo(() => {
    const r = [];
    for (const g of groups) {
      r.push({ type: 'group', name: g.name, count: g.activities.length });
      for (const a of g.activities) r.push({ type: 'act', a });
    }
    return r;
  }, [groups]);

  // canvas dimensions
  const canvasViewW = Math.max(200, outerW - LABEL_W);
  const pxd = zoomKey === 'full' ? canvasViewW / totalDays : (PX_PER_DAY[zoomKey] || 3);
  const canvasFullW = Math.max(canvasViewW, Math.ceil(pxd * totalDays));
  const totalH = rows.length * ROW_H + HEADER_H;

  const dx = useCallback((date) => diff(ps, date) * pxd, [ps, pxd]);

  const tckList = useMemo(() => ticks(ps, totalDays, pxd), [ps, totalDays, pxd]);
  const todayX = dx(TODAY);

  // scroll handler — keeps labels in sync vertically
  const onScroll = useCallback(() => {
    const el = ganttRef.current;
    if (!el) return;
    setScrollLeft(el.scrollLeft);
    if (labelRef.current) labelRef.current.scrollTop = el.scrollTop;
  }, []);

  // minimap seek
  const onSeek = useCallback((target) => {
    if (ganttRef.current) { ganttRef.current.scrollLeft = target; setScrollLeft(target); }
  }, []);

  const ZOOM_KEYS = ['full', 'year', 'quarter', 'month'];
  const ZOOM_LABELS = { full: 'Full', year: 'Year', quarter: 'Qtr', month: 'Month' };

  if (!valid.length) return (
    <div className="flex flex-col items-center py-20 gap-2">
      <span className="text-4xl">📅</span>
      <p style={{ color: '#64748b' }}>No activities with valid dates.</p>
    </div>
  );

  return (
    <div ref={outerRef}>
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap mb-3 p-3 rounded-xl"
        style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
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
        <div className="flex items-center gap-1">
          {ZOOM_KEYS.map(k => (
            <button key={k} onClick={() => { setZoomKey(k); onSeek(0); }}
              className="px-2 py-1 rounded text-[11px] font-medium"
              style={{ background: zoomKey === k ? 'rgba(59,130,246,0.2)' : 'rgba(30,39,97,0.4)', color: zoomKey === k ? '#3b82f6' : '#64748b', border: `1px solid ${zoomKey === k ? 'rgba(59,130,246,0.4)' : 'rgba(202,220,252,0.1)'}` }}>
              {ZOOM_LABELS[k]}
            </button>
          ))}
          <button onClick={() => { const i = ZOOM_KEYS.indexOf(zoomKey); if (i < ZOOM_KEYS.length-1) setZoomKey(ZOOM_KEYS[i+1]); }} className="p-1 rounded" style={{ color: '#64748b' }}><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={() => { const i = ZOOM_KEYS.indexOf(zoomKey); if (i > 0) setZoomKey(ZOOM_KEYS[i-1]); }} className="p-1 rounded" style={{ color: '#64748b' }}><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setZoomKey('full'); onSeek(0); }} className="p-1 rounded" style={{ color: '#64748b' }}><Maximize2 className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex gap-3 ml-auto flex-wrap">
          {[['#10b981','Completed'],['#3b82f6','In Progress'],['#f97316','Delayed'],['#ef4444','Critical'],['#475569','Not Started']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1">
              <div style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
              <span style={{ color: '#64748b', fontSize: 10 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overview / MiniMap */}
      <div className="mb-2 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.12)' }}>
        <div className="flex items-center px-2 py-1" style={{ background: 'rgba(15,23,42,0.85)', fontSize: 10, color: '#475569' }}>
          <span>Overview — drag to navigate</span>
          <span style={{ marginLeft: 'auto' }}>{fmt(ps)} → {fmt(pe)} ({totalDays}d)</span>
        </div>
        <MiniMap
          allActs={allActs}
          ps={ps}
          totalDays={totalDays}
          canvasFullW={canvasFullW}
          scrollLeft={scrollLeft}
          canvasViewW={canvasViewW}
          onSeek={onSeek}
        />
      </div>

      {/* Gantt */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)', background: 'rgba(15,23,42,0.5)' }}>
        <div style={{ display: 'flex', height: GANTT_H }}>

          {/* Labels — fixed width, vertical scroll synced */}
          <div style={{ width: LABEL_W, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(202,220,252,0.08)', overflow: 'hidden' }}>
            <div style={{ height: HEADER_H, flexShrink: 0, background: 'rgba(30,39,97,0.7)', borderBottom: '1px solid rgba(202,220,252,0.1)' }} />
            <div ref={labelRef} style={{ flex: 1, overflow: 'hidden' }}>
              {rows.map((row, i) => row.type === 'group'
                ? <div key={i} style={{ height: ROW_H, display: 'flex', alignItems: 'center', paddingLeft: 8, background: 'rgba(30,39,97,0.5)', borderBottom: '1px solid rgba(202,220,252,0.06)', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#00A896', fontFamily: 'sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                    <span style={{ fontSize: 9, color: '#334155', marginLeft: 3, flexShrink: 0 }}>({row.count})</span>
                  </div>
                : <div key={i} style={{ height: ROW_H, display: 'flex', alignItems: 'center', paddingLeft: 16, borderBottom: '1px solid rgba(202,220,252,0.03)', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.a.activityName}>{row.a.activityName}</span>
                  </div>
              )}
            </div>
          </div>

          {/* Gantt canvas — scrollable H+V */}
          <div ref={ganttRef} onScroll={onScroll}
            style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}
            onMouseLeave={() => setTip(null)}>
            <svg width={canvasFullW} height={totalH} style={{ display: 'block' }}>
              {/* header bg */}
              <rect x={0} y={0} width={canvasFullW} height={HEADER_H} fill="rgba(30,39,97,0.7)" />

              {/* ticks */}
              {tckList.map((t, i) => {
                const x = dx(t);
                if (x < -50 || x > canvasFullW + 50) return null;
                return (
                  <g key={i}>
                    <line x1={x} y1={HEADER_H} x2={x} y2={totalH} stroke="rgba(202,220,252,0.05)" strokeWidth={1} />
                    <text x={x + 3} y={HEADER_H - 28} fill="#475569" fontSize={9} fontFamily="sans-serif">{fmtMY(t)}</text>
                    <line x1={x} y1={HEADER_H - 4} x2={x} y2={HEADER_H} stroke="rgba(202,220,252,0.25)" strokeWidth={1} />
                  </g>
                );
              })}

              <line x1={0} y1={HEADER_H} x2={canvasFullW} y2={HEADER_H} stroke="rgba(202,220,252,0.1)" strokeWidth={1} />

              {/* rows */}
              {rows.map((row, i) => {
                const y = HEADER_H + i * ROW_H;
                if (row.type === 'group') return <rect key={i} x={0} y={y} width={canvasFullW} height={ROW_H} fill="rgba(30,39,97,0.3)" />;
                const { a } = row;
                const s = pd(a.plannedStartDate); const f = pd(a.plannedFinishDate);
                if (!s || !f) return null;
                const sx = dx(s);
                const fw = Math.max(2, dx(f) - sx);
                const c = color(a);
                const pct = a.percentComplete || 0;
                const bY = y + 4; const bH = ROW_H - 8;
                return (
                  <g key={i} style={{ cursor: 'pointer' }}
                    onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, a })}
                    onMouseLeave={() => setTip(null)}>
                    <rect x={sx} y={bY} width={fw} height={bH} rx={2} fill={c} opacity={0.22} />
                    <rect x={sx} y={bY} width={Math.max(0, fw * pct / 100)} height={bH} rx={2} fill={c} opacity={0.9} />
                    <rect x={sx} y={bY} width={fw} height={bH} rx={2} fill="none" stroke={c} strokeWidth={0.8} opacity={0.55} />
                  </g>
                );
              })}

              {/* today */}
              {todayX >= 0 && todayX <= canvasFullW && (
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

      <Tooltip tip={tip} />

      {/* Stats */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {[
          ['Total', valid.length, '#CADCFC'],
          ['Groups', groups.length, '#94a3b8'],
          ['Completed', valid.filter(a => (a.percentComplete || 0) >= 100).length, '#10b981'],
          ['Delayed', valid.filter(isLate).length, '#f97316'],
          ['Critical', valid.filter(a => a.isCriticalPath).length, '#ef4444'],
        ].map(([l, v, c]) => (
          <div key={l} className="flex items-center gap-1.5 text-xs">
            <span style={{ color: '#475569' }}>{l}:</span>
            <span style={{ fontWeight: 600, color: c }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}