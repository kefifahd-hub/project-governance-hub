import { useMemo, useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { ArrowUpDown, ChevronDown } from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
function daysDiff(dateA, dateB) {
  if (!dateA || !dateB) return null;
  try { return differenceInDays(parseISO(dateB), parseISO(dateA)); } catch { return null; }
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y.slice(2)}`;
  } catch { return d; }
}

function DeltaCell({ value, unit = 'd', invertColor = false }) {
  if (value === null || value === undefined) return <td className="px-3 py-2 text-center" style={{ color: '#334155' }}>—</td>;
  const isPositive = value > 0;
  const isBad = invertColor ? isPositive : isPositive; // slippage = positive days delta
  const color = value === 0 ? '#475569' : isBad ? '#ef4444' : '#10b981';
  const prefix = value > 0 ? '+' : '';
  return (
    <td className="px-3 py-2 text-center font-mono text-xs">
      <span className="px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>
        {prefix}{value}{unit}
      </span>
    </td>
  );
}

function ProgressDeltaCell({ value }) {
  if (value === null || value === undefined) return <td className="px-3 py-2 text-center" style={{ color: '#334155' }}>—</td>;
  const color = value === 0 ? '#475569' : value > 0 ? '#10b981' : '#ef4444'; // progress increase = good
  const prefix = value > 0 ? '+' : '';
  return (
    <td className="px-3 py-2 text-center font-mono text-xs">
      <span className="px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>
        {prefix}{value}%
      </span>
    </td>
  );
}

function getField(a, key) {
  if (key === 'building') return a.building || a.wbsCode?.split('.')[0] || null;
  if (key === 'contractor') return a.contractors || a.contractor || null;
  if (key === 'workType') return a.workType || a.activityType || null;
  return null;
}
function uniqueVals(list, key) {
  return [...new Set(list.map(a => getField(a, key)).filter(Boolean))].sort();
}

function FilterSelect({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="text-xs px-2 py-1.5 rounded outline-none"
        style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC', minWidth: '130px' }}>
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function ComparisonTab({ activities }) {
  const [compareMode, setCompareMode] = useState('prev'); // 'prev' | 'baseline'
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterContractor, setFilterContractor] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('');
  const [filterSlippage, setFilterSlippage] = useState(false);

  // Group activities by activityId, sort versions
  const grouped = useMemo(() => {
    const map = {};
    for (const a of activities) {
      const key = a.activityId || a.activityName;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    // Sort each group by uploadVersion desc, then created_date desc
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const vA = a.uploadVersion || 1;
        const vB = b.uploadVersion || 1;
        if (vB !== vA) return vB - vA;
        return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      });
    }
    return map;
  }, [activities]);

  // Versions available
  const allVersions = useMemo(() => {
    const vs = [...new Set(activities.map(a => a.uploadVersion || 1))].sort((a, b) => b - a);
    return vs;
  }, [activities]);

  const latestVersion = allVersions[0] || 1;
  const hasMultipleVersions = allVersions.length > 1;

  // Build comparison rows
  const rows = useMemo(() => {
    const result = [];
    for (const [key, versions] of Object.entries(grouped)) {
      const current = versions[0]; // latest
      let previous = null;

      if (compareMode === 'prev') {
        previous = versions[1] || null; // second most recent
      } else {
        // baseline = oldest version
        previous = versions[versions.length - 1] !== versions[0] ? versions[versions.length - 1] : null;
      }

      if (!previous) continue; // skip if only one version

      const deltaStart = daysDiff(previous.plannedStartDate, current.plannedStartDate);
      const deltaFinish = daysDiff(previous.plannedFinishDate, current.plannedFinishDate);
      const prevDur = previous.duration || null;
      const curDur = current.duration || null;
      const deltaDur = prevDur !== null && curDur !== null ? curDur - prevDur : null;
      const prevPct = previous.percentComplete || 0;
      const curPct = current.percentComplete || 0;
      const deltaPct = curPct - prevPct;

      result.push({
        id: key,
        activityId: current.activityId || '—',
        activityName: current.activityName || '—',
        building: getField(current, 'building'),
        contractor: getField(current, 'contractor'),
        workType: getField(current, 'workType'),
        isCritical: !!current.isCriticalPath,
        // Previous
        prevStart: previous.plannedStartDate,
        prevFinish: previous.plannedFinishDate,
        prevDur,
        prevPct,
        prevVersion: previous.uploadVersion || 1,
        prevDate: previous.uploadDate || previous.created_date?.slice(0, 10),
        // Current
        curStart: current.plannedStartDate,
        curFinish: current.plannedFinishDate,
        curDur,
        curPct,
        curVersion: current.uploadVersion || 1,
        curDate: current.uploadDate || current.created_date?.slice(0, 10),
        // Deltas
        deltaStart,
        deltaFinish,
        deltaDur,
        deltaPct,
        hasSlippage: (deltaFinish !== null && deltaFinish > 0) || (deltaStart !== null && deltaStart > 0),
      });
    }
    return result;
  }, [grouped, compareMode]);

  // Filter
  const filtered = useMemo(() => rows.filter(r => {
    if (filterBuilding && r.building !== filterBuilding) return false;
    if (filterContractor && r.contractor !== filterContractor) return false;
    if (filterWorkType && r.workType !== filterWorkType) return false;
    if (filterSlippage && !r.hasSlippage) return false;
    return true;
  }), [rows, filterBuilding, filterContractor, filterWorkType, filterSlippage]);

  const buildings = useMemo(() => uniqueVals(activities, 'building'), [activities]);
  const contractors = useMemo(() => uniqueVals(activities, 'contractor'), [activities]);
  const workTypes = useMemo(() => uniqueVals(activities, 'workType'), [activities]);

  const slippageCount = rows.filter(r => r.hasSlippage).length;
  const improvementCount = rows.filter(r => !r.hasSlippage && r.deltaFinish !== null && r.deltaFinish < 0).length;

  if (!hasMultipleVersions) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <span className="text-4xl">📂</span>
        <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No version history to compare</p>
        <p className="text-xs text-center max-w-sm" style={{ color: '#475569' }}>
          Upload a new schedule version to compare against the current one. Each import should increment the <code className="px-1 rounded text-[10px]" style={{ background: 'rgba(202,220,252,0.08)' }}>uploadVersion</code> field.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── HEADER / MODE ── */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <ArrowUpDown className="w-4 h-4" style={{ color: '#028090' }} />
          <span className="text-sm font-semibold" style={{ color: '#CADCFC' }}>Version Comparison</span>
          <div className="flex gap-1">
            {[['prev', 'Current vs Previous'], ['baseline', 'Current vs Baseline']].map(([mode, label]) => (
              <button key={mode} onClick={() => setCompareMode(mode)} className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: compareMode === mode ? 'rgba(2,128,144,0.25)' : 'rgba(30,39,97,0.4)', color: compareMode === mode ? '#00A896' : '#64748b', border: `1px solid ${compareMode === mode ? 'rgba(2,128,144,0.4)' : 'rgba(202,220,252,0.1)'}` }}>
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span style={{ color: '#475569' }}>Versions: <span style={{ color: '#CADCFC' }}>{allVersions.join(', ')}</span></span>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex gap-3 mt-3 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(30,39,97,0.6)', color: '#94a3b8', border: '1px solid rgba(202,220,252,0.1)' }}>
            {rows.length} activities compared
          </span>
          {slippageCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠ {slippageCount} slipped
            </span>
          )}
          {improvementCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
              ✓ {improvementCount} improved
            </span>
          )}
          <button onClick={() => setFilterSlippage(!filterSlippage)} className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: filterSlippage ? 'rgba(239,68,68,0.2)' : 'rgba(30,39,97,0.4)', color: filterSlippage ? '#ef4444' : '#64748b', border: `1px solid ${filterSlippage ? 'rgba(239,68,68,0.3)' : 'rgba(202,220,252,0.1)'}` }}>
            {filterSlippage ? '✕ Slippage only' : 'Show slippage only'}
          </button>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.3)', border: '1px solid rgba(202,220,252,0.08)' }}>
        <div className="flex flex-wrap gap-4">
          <FilterSelect label="Building" options={buildings} value={filterBuilding} onChange={setFilterBuilding} />
          <FilterSelect label="Contractor" options={contractors} value={filterContractor} onChange={setFilterContractor} />
          <FilterSelect label="Type of Work" options={workTypes} value={filterWorkType} onChange={setFilterWorkType} />
          {(filterBuilding || filterContractor || filterWorkType) && (
            <button onClick={() => { setFilterBuilding(''); setFilterContractor(''); setFilterWorkType(''); }}
              className="self-end text-xs px-3 py-1.5 rounded" style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              Clear filters
            </button>
          )}
        </div>
        {filtered.length !== rows.length && (
          <p className="text-xs mt-2" style={{ color: '#475569' }}>Showing {filtered.length} of {rows.length} activities</p>
        )}
      </div>

      {/* ── TABLE ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: '#334155' }}>No matching activities.</div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(30,39,97,0.7)', borderBottom: '1px solid rgba(202,220,252,0.12)' }}>
                  {[
                    'Activity ID', 'Name',
                    'Prev Start', 'Cur Start', 'Δ Start',
                    'Prev Finish', 'Cur Finish', 'Δ Finish',
                    'Prev Dur', 'Cur Dur', 'Δ Dur',
                    'Prev %', 'Cur %', 'Δ %',
                  ].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium whitespace-nowrap"
                      style={{ color: '#64748b', borderRight: '1px solid rgba(202,220,252,0.06)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id}
                    style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(30,39,97,0.25)', borderBottom: '1px solid rgba(202,220,252,0.05)' }}
                    className="hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: '#94a3b8', borderRight: '1px solid rgba(202,220,252,0.05)' }}>
                      <div className="flex items-center gap-1">
                        {r.isCritical && <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>CP</span>}
                        {r.activityId}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-[180px]" style={{ color: '#CADCFC', borderRight: '1px solid rgba(202,220,252,0.05)' }}>
                      <div className="truncate" title={r.activityName}>{r.activityName}</div>
                    </td>
                    {/* Start */}
                    <td className="px-3 py-2 whitespace-nowrap font-mono" style={{ color: '#64748b' }}>{fmtDate(r.prevStart)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono" style={{ color: '#CADCFC' }}>{fmtDate(r.curStart)}</td>
                    <DeltaCell value={r.deltaStart} />
                    {/* Finish */}
                    <td className="px-3 py-2 whitespace-nowrap font-mono" style={{ color: '#64748b' }}>{fmtDate(r.prevFinish)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono" style={{ color: '#CADCFC' }}>{fmtDate(r.curFinish)}</td>
                    <DeltaCell value={r.deltaFinish} />
                    {/* Duration */}
                    <td className="px-3 py-2 text-center font-mono" style={{ color: '#64748b' }}>{r.prevDur !== null ? `${r.prevDur}d` : '—'}</td>
                    <td className="px-3 py-2 text-center font-mono" style={{ color: '#CADCFC' }}>{r.curDur !== null ? `${r.curDur}d` : '—'}</td>
                    <DeltaCell value={r.deltaDur} />
                    {/* % Complete */}
                    <td className="px-3 py-2 text-center font-mono" style={{ color: '#64748b' }}>{r.prevPct}%</td>
                    <td className="px-3 py-2 text-center font-mono" style={{ color: '#CADCFC' }}>{r.curPct}%</td>
                    <ProgressDeltaCell value={r.deltaPct} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 text-xs flex items-center justify-between" style={{ background: 'rgba(15,23,42,0.6)', borderTop: '1px solid rgba(202,220,252,0.08)' }}>
            <span style={{ color: '#334155' }}>{filtered.length} rows</span>
            <div className="flex gap-4" style={{ color: '#334155' }}>
              <span><span style={{ color: '#ef4444' }}>■</span> Slippage / increase</span>
              <span><span style={{ color: '#10b981' }}>■</span> Improvement / early</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}