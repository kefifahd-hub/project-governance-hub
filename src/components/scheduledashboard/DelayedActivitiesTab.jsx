import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const card = { background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' };
const inp = { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.12)', borderRadius: 4, color: '#CADCFC', fontSize: 10, padding: '3px 7px', outline: 'none', width: '100%' };

const COLS = [
  { key: 'activityId',       label: 'ID',            filterable: 'text',   sortable: true  },
  { key: 'activityName',     label: 'Activity Name', filterable: 'text',   sortable: true  },
  { key: 'plannedFinishDate',label: 'Planned Finish', filterable: false,   sortable: true  },
  { key: 'percentComplete',  label: '% Complete',    filterable: false,    sortable: true  },
  { key: 'delayDays',        label: 'Delay (days)',  filterable: false,    sortable: true  },
  { key: 'severity',         label: 'Severity',      filterable: 'select', sortable: true, options: ['Critical', 'High', 'Medium'] },
  { key: 'contractors',      label: 'Contractors',   filterable: 'text',   sortable: true  },
];

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <ChevronsUpDown style={{ width: 10, height: 10, opacity: 0.3 }} />;
  return sortDir === 'asc'
    ? <ChevronUp style={{ width: 10, height: 10, color: '#00A896' }} />
    : <ChevronDown style={{ width: 10, height: 10, color: '#00A896' }} />;
}

export default function DelayedActivitiesTab({ activities }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState('delayDays');
  const [sortDir, setSortDir] = useState('desc');

  const severity = (d) => {
    if (d > 30) return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Critical' };
    if (d >= 15) return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'High' };
    return { bg: 'rgba(234,179,8,0.12)', color: '#eab308', label: 'Medium' };
  };

  const enriched = useMemo(() => activities.filter(a => {
    const finish = a.plannedFinishDate ? new Date(a.plannedFinishDate) : null;
    return finish && finish < today && (a.percentComplete || 0) < 100;
  }).map(a => {
    const finish = new Date(a.plannedFinishDate);
    const delayDays = Math.round((today - finish) / 86400000);
    const sev = severity(delayDays);
    return { ...a, delayDays, severityLabel: sev.label };
  }), [activities]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const filtered = useMemo(() => {
    let rows = [...enriched];
    // apply text filters
    if (filters.activityId) rows = rows.filter(r => (r.activityId || '').toLowerCase().includes(filters.activityId.toLowerCase()));
    if (filters.activityName) rows = rows.filter(r => (r.activityName || '').toLowerCase().includes(filters.activityName.toLowerCase()));
    if (filters.severity) rows = rows.filter(r => r.severityLabel.toLowerCase().includes(filters.severity.toLowerCase()));
    if (filters.contractors) rows = rows.filter(r => (r.contractors || '').toLowerCase().includes(filters.contractors.toLowerCase()));
    // sort
    rows.sort((a, b) => {
      let av = sortKey === 'severity' ? a.severityLabel : a[sortKey];
      let bv = sortKey === 'severity' ? b.severityLabel : b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return rows;
  }, [enriched, filters, sortKey, sortDir]);

  if (!enriched.length) return (
    <div className="flex flex-col items-center py-16 gap-2">
      <span className="text-4xl">✅</span>
      <p style={{ color: '#64748b' }}>No delayed activities — great job!</p>
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden" style={card}>
      <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '1px solid rgba(202,220,252,0.08)' }}>
        {filtered.length} / {enriched.length} Delayed Activities
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            {/* Sort row */}
            <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
              {COLS.map(c => (
                <th key={c.key} className="px-3 py-2 text-left" style={{ whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => c.sortable && handleSort(c.key === 'severity' ? 'severityLabel' : c.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: c.sortable ? 'pointer' : 'default', background: 'none', border: 'none', padding: 0 }}>
                    {c.label}
                    {c.sortable && <SortIcon col={c.key === 'severity' ? 'severityLabel' : c.key} sortKey={sortKey} sortDir={sortDir} />}
                  </button>
                </th>
              ))}
            </tr>
            {/* Filter row */}
            <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(202,220,252,0.06)' }}>
              {COLS.map(c => (
                <td key={c.key} className="px-2 py-1.5">
                  {c.filterable
                    ? <input
                        placeholder={`Filter…`}
                        value={filters[c.key] || ''}
                        onChange={e => setFilter(c.key, e.target.value)}
                        style={inp}
                      />
                    : <div style={{ height: 22 }} />
                  }
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => {
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