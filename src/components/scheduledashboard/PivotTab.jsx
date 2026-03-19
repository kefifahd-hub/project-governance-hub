import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Download, Search } from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
function getField(a, key) {
  if (key === 'building') return a.building || a.wbsCode?.split('.')[0] || 'Unassigned';
  if (key === 'contractor') return a.contractors || a.contractor || 'Unassigned';
  if (key === 'workType') return a.workType || a.activityType || 'Unassigned';
  return 'Unassigned';
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y.slice(2)}`;
  } catch { return d; }
}

function isDelayed(a) {
  const finish = a.plannedFinishDate ? new Date(a.plannedFinishDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return finish && finish < today && (a.percentComplete || 0) < 100;
}

function StatusBadge({ status }) {
  const cfg = {
    'Completed':   { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    'In Progress': { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    'On Hold':     { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    'Not Started': { bg: 'rgba(100,116,139,0.15)', color: '#64748b' },
  };
  const s = cfg[status] || cfg['Not Started'];
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap" style={{ background: s.bg, color: s.color }}>
      {status || 'Not Started'}
    </span>
  );
}

function exportCSV(groups, dimension) {
  const headers = ['Group', 'Activity ID', 'Name', 'Start', 'Finish', 'Duration (d)', '% Complete', 'Status', 'Float (d)'];
  const rows = [];
  for (const g of groups) {
    for (const a of g.activities) {
      rows.push([
        g.name,
        a.activityId || '',
        `"${(a.activityName || '').replace(/"/g, '""')}"`,
        a.plannedStartDate || '',
        a.plannedFinishDate || '',
        a.duration || '',
        a.percentComplete || 0,
        a.status || 'Not Started',
        a.totalFloat ?? '',
      ].join(','));
    }
  }
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pivot_by_${dimension}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const SORT_COLS = [
  { key: 'activityId',       label: 'ID' },
  { key: 'activityName',     label: 'Name' },
  { key: 'plannedStartDate', label: 'Start' },
  { key: 'plannedFinishDate',label: 'Finish' },
  { key: 'duration',         label: 'Dur' },
  { key: 'percentComplete',  label: '%' },
  { key: 'status',           label: 'Status' },
  { key: 'totalFloat',       label: 'Float' },
];

function SortTh({ col, sortKey, sortDir, onSort }) {
  const active = sortKey === col.key;
  return (
    <th
      onClick={() => onSort(col.key)}
      className="px-3 py-2.5 text-left font-medium whitespace-nowrap cursor-pointer select-none group"
      style={{ color: active ? '#00A896' : '#64748b', borderRight: '1px solid rgba(202,220,252,0.06)' }}
    >
      <div className="flex items-center gap-1">
        {col.label}
        <span style={{ color: active ? '#00A896' : 'rgba(100,116,139,0.3)' }}>
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </div>
    </th>
  );
}

function GroupSection({ group, search, globalSortKey, globalSortDir, onSort }) {
  const [open, setOpen] = useState(true);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? group.activities.filter(a =>
          (a.activityName || '').toLowerCase().includes(q) ||
          (a.activityId || '').toLowerCase().includes(q)
        )
      : group.activities;
  }, [group.activities, search]);

  const sorted = useMemo(() => {
    if (!globalSortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[globalSortKey] ?? '';
      const vb = b[globalSortKey] ?? '';
      if (va < vb) return globalSortDir === 'asc' ? -1 : 1;
      if (va > vb) return globalSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, globalSortKey, globalSortDir]);

  const pct = group.totalActivities > 0
    ? Math.round(group.activities.reduce((s, a) => s + (a.percentComplete || 0), 0) / group.totalActivities)
    : 0;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
      {/* Group header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: open ? 'rgba(30,39,97,0.65)' : 'rgba(30,39,97,0.4)' }}
      >
        <span className="text-sm font-semibold flex-1 truncate" style={{ color: '#CADCFC' }}>{group.name}</span>

        <div className="flex items-center gap-2 flex-wrap">
          <Pill label="Total" value={group.totalActivities} color="#94a3b8" />
          <Pill label="Done" value={group.completed} color="#10b981" />
          <Pill label="Active" value={group.inProgress} color="#3b82f6" />
          <Pill label="Delayed" value={group.delayed} color="#ef4444" />
          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-20 h-1.5 rounded-full" style={{ background: 'rgba(202,220,252,0.1)' }}>
              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }} />
            </div>
            <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>{pct}%</span>
          </div>
        </div>

        {open ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#64748b' }} /> : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#64748b' }} />}
      </button>

      {open && (
        <div className="overflow-x-auto" style={{ background: 'rgba(15,23,42,0.4)' }}>
          {sorted.length === 0 ? (
            <p className="px-4 py-6 text-xs text-center" style={{ color: '#334155' }}>No matching activities.</p>
          ) : (
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(30,39,97,0.5)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
                  {SORT_COLS.map(col => (
                    <SortTh key={col.key} col={col} sortKey={globalSortKey} sortDir={globalSortDir} onSort={onSort} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((a, i) => {
                  const delayed = isDelayed(a);
                  return (
                    <tr key={a.id || i}
                      style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(30,39,97,0.2)', borderBottom: '1px solid rgba(202,220,252,0.04)' }}
                      className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-3 py-2 font-mono" style={{ color: '#64748b', borderRight: '1px solid rgba(202,220,252,0.04)' }}>
                        <div className="flex items-center gap-1">
                          {a.isCriticalPath && <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>CP</span>}
                          {a.activityId || '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2 max-w-[200px]" style={{ color: delayed ? '#ef4444' : '#CADCFC', borderRight: '1px solid rgba(202,220,252,0.04)' }}>
                        <div className="truncate" title={a.activityName}>{a.activityName || '—'}</div>
                      </td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: '#64748b' }}>{fmtDate(a.plannedStartDate)}</td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: delayed ? '#ef4444' : '#64748b' }}>{fmtDate(a.plannedFinishDate)}</td>
                      <td className="px-3 py-2 text-center font-mono" style={{ color: '#94a3b8' }}>{a.duration != null ? `${a.duration}d` : '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full" style={{ background: 'rgba(202,220,252,0.1)' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${a.percentComplete || 0}%`, background: (a.percentComplete || 0) >= 100 ? '#10b981' : '#3b82f6' }} />
                          </div>
                          <span className="font-mono" style={{ color: '#94a3b8' }}>{a.percentComplete || 0}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                      <td className="px-3 py-2 text-center font-mono" style={{ color: a.totalFloat != null && a.totalFloat <= 0 ? '#ef4444' : '#64748b' }}>
                        {a.totalFloat != null ? `${a.totalFloat}d` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function Pill({ label, value, color }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {label}: <strong>{value}</strong>
    </span>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
const DIMENSIONS = [
  { key: 'building',   label: '🏗 By Building' },
  { key: 'contractor', label: '👷 By Contractor' },
  { key: 'workType',   label: '🔧 By Type of Work' },
];

export default function PivotTab({ activities }) {
  const [dimension, setDimension] = useState('building');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('plannedStartDate');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedGroups, setSelectedGroups] = useState(null); // null = all selected

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const groups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = {};
    for (const a of activities) {
      const key = getField(a, dimension);
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return Object.entries(map)
      .map(([name, acts]) => ({
        name,
        activities: acts,
        totalActivities: acts.length,
        completed: acts.filter(a => (a.percentComplete || 0) >= 100 || a.status === 'Completed').length,
        inProgress: acts.filter(a => a.status === 'In Progress' || ((a.percentComplete || 0) > 0 && (a.percentComplete || 0) < 100)).length,
        delayed: acts.filter(a => isDelayed(a)).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activities, dimension]);

  // Summary totals
  const totals = useMemo(() => ({
    total: activities.length,
    completed: groups.reduce((s, g) => s + g.completed, 0),
    inProgress: groups.reduce((s, g) => s + g.inProgress, 0),
    delayed: groups.reduce((s, g) => s + g.delayed, 0),
    avgPct: activities.length > 0
      ? Math.round(activities.reduce((s, a) => s + (a.percentComplete || 0), 0) / activities.length)
      : 0,
  }), [groups, activities]);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-2">
        <span className="text-4xl">📊</span>
        <p style={{ color: '#64748b' }}>No activities to pivot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── CONTROLS ── */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Dimension toggles */}
          <div className="flex gap-1">
            {DIMENSIONS.map(d => (
              <button key={d.key} onClick={() => setDimension(d.key)} className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: dimension === d.key ? 'rgba(2,128,144,0.25)' : 'rgba(30,39,97,0.4)', color: dimension === d.key ? '#00A896' : '#64748b', border: `1px solid ${dimension === d.key ? 'rgba(2,128,144,0.4)' : 'rgba(202,220,252,0.1)'}` }}>
                {d.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: '#475569' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activities…"
              className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
              style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }} />
            {search && <button onClick={() => setSearch('')} className="text-xs" style={{ color: '#ef4444' }}>✕</button>}
          </div>

          {/* Export */}
          <button onClick={() => exportCSV(selectedGroups ? groups.filter(g => selectedGroups.has(g.name)) : groups, dimension)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
            style={{ background: 'rgba(2,128,144,0.12)', color: '#00A896', border: '1px solid rgba(2,128,144,0.25)' }}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        <div className="text-xs mt-2" style={{ color: '#475569' }}>
          {groups.length} groups · {activities.length} total activities
        </div>

        {/* Group selector for export */}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(202,220,252,0.08)' }}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-medium" style={{ color: '#64748b' }}>Export groups:</span>
            <button
              onClick={() => setSelectedGroups(null)}
              className="text-[10px] px-2 py-0.5 rounded"
              style={{ background: selectedGroups === null ? 'rgba(2,128,144,0.2)' : 'rgba(30,39,97,0.4)', color: selectedGroups === null ? '#00A896' : '#64748b', border: `1px solid ${selectedGroups === null ? 'rgba(2,128,144,0.35)' : 'rgba(202,220,252,0.1)'}` }}>
              All
            </button>
            <button
              onClick={() => setSelectedGroups(new Set())}
              className="text-[10px] px-2 py-0.5 rounded"
              style={{ background: 'rgba(30,39,97,0.4)', color: '#64748b', border: '1px solid rgba(202,220,252,0.1)' }}>
              None
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {groups.map(g => {
              const checked = selectedGroups === null || selectedGroups.has(g.name);
              return (
                <label key={g.name} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded text-[11px]"
                  style={{ background: checked ? 'rgba(2,128,144,0.12)' : 'rgba(15,23,42,0.4)', border: `1px solid ${checked ? 'rgba(2,128,144,0.25)' : 'rgba(202,220,252,0.08)'}`, color: checked ? '#CADCFC' : '#475569' }}>
                  <input type="checkbox" checked={checked} style={{ accentColor: '#00A896', width: 11, height: 11 }}
                    onChange={() => {
                      const next = new Set(selectedGroups ?? groups.map(g => g.name));
                      if (next.has(g.name)) next.delete(g.name); else next.add(g.name);
                      setSelectedGroups(next.size === groups.length ? null : next);
                    }} />
                  {g.name}
                  <span style={{ color: '#475569', fontSize: 9 }}>({g.totalActivities})</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── GROUP SECTIONS ── */}
      {groups.map(g => (
        <GroupSection
          key={g.name}
          group={g}
          search={search}
          globalSortKey={sortKey}
          globalSortDir={sortDir}
          onSort={handleSort}
        />
      ))}

      {/* ── SUMMARY ROW ── */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(2,128,144,0.2)' }}>
        <div className="text-xs font-semibold mb-3" style={{ color: '#00A896' }}>∑ Summary — All Groups</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: totals.total, color: '#CADCFC' },
            { label: 'Completed', value: totals.completed, color: '#10b981' },
            { label: 'In Progress', value: totals.inProgress, color: '#3b82f6' },
            { label: 'Delayed', value: totals.delayed, color: '#ef4444' },
            { label: 'Avg % Complete', value: `${totals.avgPct}%`, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(202,220,252,0.07)' }}>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>{s.label}</div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}