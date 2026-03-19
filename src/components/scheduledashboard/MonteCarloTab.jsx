import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { addDays, format } from 'date-fns';
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

const ITERATIONS = 1000;
const DEFAULT_MIN = 10;
const DEFAULT_MAX = 30;

// ── helpers ──────────────────────────────────────────────────────────────────
function getField(a, key) {
  // Try various field names used in ScheduleActivity entity
  if (key === 'building') return a.building || a.wbsCode?.split('.')[0] || null;
  if (key === 'contractor') return a.contractors || a.contractor || null;
  if (key === 'workType') return a.workType || a.activityType || a.status || null;
  return null;
}

function uniqueValues(activities, key) {
  const vals = activities.map(a => getField(a, key)).filter(Boolean);
  return [...new Set(vals)].sort();
}

// ── small reusable UI ─────────────────────────────────────────────────────────
function FilterDropdown({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs px-2 py-1.5 rounded outline-none"
        style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC', minWidth: '130px' }}
      >
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function MultiSelect({ options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOptions = options.filter(o => selected.includes(o.id));

  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else onChange([...selected, id]);
  };

  return (
    <div className="relative">
      <div
        className="min-h-[38px] px-3 py-1.5 rounded-lg cursor-pointer flex flex-wrap gap-1.5 items-center"
        style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)' }}
        onClick={() => setOpen(!open)}
      >
        {selectedOptions.length === 0 && <span style={{ color: '#475569', fontSize: '13px' }}>{placeholder}</span>}
        {selectedOptions.map(o => (
          <span key={o.id} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(2,128,144,0.25)', color: '#00A896', border: '1px solid rgba(2,128,144,0.3)' }}>
            {o.label.slice(0, 30)}{o.label.length > 30 ? '…' : ''}
            <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={e => { e.stopPropagation(); toggle(o.id); }} />
          </span>
        ))}
        <ChevronDown className="w-4 h-4 ml-auto shrink-0" style={{ color: '#64748b' }} />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-lg shadow-xl" style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(202,220,252,0.2)', maxHeight: '280px', overflowY: 'auto' }}>
          <div className="p-2 sticky top-0" style={{ background: 'rgba(15,23,42,0.98)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="w-full px-3 py-1.5 rounded text-xs outline-none"
              style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.15)', color: '#CADCFC' }}
              onClick={e => e.stopPropagation()} />
          </div>
          <div className="p-1">
            {filtered.length === 0 && <div className="px-3 py-2 text-xs" style={{ color: '#64748b' }}>No results</div>}
            {filtered.map(o => (
              <div key={o.id} onClick={() => toggle(o.id)} className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-xs hover:bg-white/5" style={{ color: selected.includes(o.id) ? '#00A896' : '#CADCFC' }}>
                <span className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0" style={{ borderColor: selected.includes(o.id) ? '#00A896' : 'rgba(202,220,252,0.3)', background: selected.includes(o.id) ? 'rgba(0,168,150,0.2)' : 'transparent' }}>
                  {selected.includes(o.id) && <span style={{ color: '#00A896', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
                </span>
                <span className="flex-1">{o.label}</span>
                {o.isCritical && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>CP</span>}
                {o.type === 'milestone' && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>MS</span>}
              </div>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="p-2 sticky bottom-0" style={{ borderTop: '1px solid rgba(202,220,252,0.1)', background: 'rgba(15,23,42,0.98)' }}>
              <button onClick={() => onChange([])} className="w-full text-xs py-1 rounded hover:bg-white/5" style={{ color: '#ef4444' }}>Clear all ({selected.length})</button>
            </div>
          )}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

// ── Group variation editor ────────────────────────────────────────────────────
function GroupVariationTable({ groupType, groups, variations, onChange }) {
  if (groups.length === 0) return <p className="text-xs py-2" style={{ color: '#475569' }}>No {groupType} groups found in activity data.</p>;

  return (
    <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
          <th className="text-left py-1.5 pr-3 font-medium" style={{ color: '#64748b' }}>Group Name</th>
          <th className="py-1.5 pr-3 font-medium text-center" style={{ color: '#64748b' }}>Min Var %</th>
          <th className="py-1.5 font-medium text-center" style={{ color: '#64748b' }}>Max Var %</th>
        </tr>
      </thead>
      <tbody>
        {groups.map(g => {
          const key = `${groupType}::${g}`;
          const min = variations[key]?.min ?? DEFAULT_MIN;
          const max = variations[key]?.max ?? DEFAULT_MAX;
          return (
            <tr key={g} style={{ borderBottom: '1px solid rgba(202,220,252,0.05)' }}>
              <td className="py-1.5 pr-3" style={{ color: '#CADCFC' }}>{g}</td>
              <td className="py-1 pr-3">
                <input
                  type="number" min={0} max={200} value={min}
                  onChange={e => onChange(key, 'min', Number(e.target.value))}
                  className="w-16 text-center px-2 py-0.5 rounded text-xs outline-none"
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }}
                />
              </td>
              <td className="py-1">
                <input
                  type="number" min={0} max={200} value={max}
                  onChange={e => onChange(key, 'max', Number(e.target.value))}
                  className="w-16 text-center px-2 py-0.5 rounded text-xs outline-none"
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function MonteCarloTab({ activities }) {
  // Filters
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterContractor, setFilterContractor] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('');

  // Target selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Group variations: { "building::BlockA": { min: 10, max: 30 }, ... }
  const [variations, setVariations] = useState({});
  const [variationsOpen, setVariationsOpen] = useState(false);
  const [variationGroupTab, setVariationGroupTab] = useState('building');

  const handleVariationChange = (key, field, value) => {
    setVariations(prev => ({ ...prev, [key]: { ...(prev[key] || { min: DEFAULT_MIN, max: DEFAULT_MAX }), [field]: value } }));
  };

  // All incomplete activities
  const incompleteActivities = useMemo(() =>
    activities.filter(a => (a.percentComplete || 0) < 100 && (a.remainingDuration || 0) > 0),
    [activities]);

  // Unique filter values
  const buildings = useMemo(() => uniqueValues(incompleteActivities, 'building'), [incompleteActivities]);
  const contractors = useMemo(() => uniqueValues(incompleteActivities, 'contractor'), [incompleteActivities]);
  const workTypes = useMemo(() => uniqueValues(incompleteActivities, 'workType'), [incompleteActivities]);

  // Filtered activities (by header filters)
  const filteredActivities = useMemo(() => incompleteActivities.filter(a => {
    if (filterBuilding && getField(a, 'building') !== filterBuilding) return false;
    if (filterContractor && getField(a, 'contractor') !== filterContractor) return false;
    if (filterWorkType && getField(a, 'workType') !== filterWorkType) return false;
    return true;
  }), [incompleteActivities, filterBuilding, filterContractor, filterWorkType]);

  // Options for target selector
  const options = useMemo(() => filteredActivities.map(a => ({
    id: a.id || a.activityId || a.activityName,
    label: a.activityName || a.activityId || 'Unnamed',
    isCritical: !!a.isCriticalPath,
    type: a.isMilestone ? 'milestone' : 'task',
    remainingDuration: a.remainingDuration || 1,
    building: getField(a, 'building'),
    contractor: getField(a, 'contractor'),
    workType: getField(a, 'workType'),
  })).sort((a, b) => {
    if (a.isCritical !== b.isCritical) return b.isCritical - a.isCritical;
    if (a.type !== b.type) return a.type === 'milestone' ? -1 : 1;
    return a.label.localeCompare(b.label);
  }), [filteredActivities]);

  // Final simulation targets
  const targetActivities = useMemo(() => {
    if (selectedIds.length === 0) return options;
    return options.filter(o => selectedIds.includes(o.id));
  }, [options, selectedIds]);

  // Variance lookup for an activity
  const getVariance = (activity) => {
    // Check group-specific overrides (building > contractor > workType > default)
    for (const [groupType, field] of [['building','building'],['contractor','contractor'],['workType','workType']]) {
      const val = activity[field];
      if (val) {
        const key = `${groupType}::${val}`;
        if (variations[key]) {
          const { min, max } = variations[key];
          return { minPct: min / 100, maxPct: max / 100 };
        }
      }
    }
    return { minPct: DEFAULT_MIN / 100, maxPct: DEFAULT_MAX / 100 };
  };

  // Monte Carlo simulation
  const results = useMemo(() => {
    if (!targetActivities.length) return null;

    const completionDays = [];
    for (let i = 0; i < ITERATIONS; i++) {
      let maxDay = 0;
      for (const a of targetActivities) {
        const base = a.remainingDuration || 1;
        const { minPct, maxPct } = getVariance(a);
        const variancePct = minPct + Math.random() * (maxPct - minPct);
        const sign = Math.random() < 0.5 ? -1 : 1;
        const simulated = base + sign * base * variancePct;
        if (simulated > maxDay) maxDay = simulated;
      }
      completionDays.push(Math.round(maxDay));
    }

    completionDays.sort((a, b) => a - b);
    const today = new Date();
    const p50 = completionDays[Math.floor(ITERATIONS * 0.5)];
    const p80 = completionDays[Math.floor(ITERATIONS * 0.8)];
    const p90 = completionDays[Math.floor(ITERATIONS * 0.9)];

    const min = completionDays[0];
    const max = completionDays[ITERATIONS - 1];
    const binSize = Math.max(1, Math.ceil((max - min) / 30));
    const bins = {};
    for (const d of completionDays) {
      const bin = Math.floor((d - min) / binSize) * binSize + min;
      bins[bin] = (bins[bin] || 0) + 1;
    }

    const chartData = Object.entries(bins)
      .map(([day, count]) => ({ day: parseInt(day), label: format(addDays(today, parseInt(day)), 'd MMM yy'), count }))
      .sort((a, b) => a.day - b.day);

    return {
      chartData,
      p50: { days: p50, date: format(addDays(today, p50), 'd MMM yyyy') },
      p80: { days: p80, date: format(addDays(today, p80), 'd MMM yyyy') },
      p90: { days: p90, date: format(addDays(today, p90), 'd MMM yyyy') },
      targetCount: targetActivities.length,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetActivities, variations]);

  const activeFilters = [filterBuilding, filterContractor, filterWorkType].filter(Boolean).length;
  const hasGroupData = buildings.length > 0 || contractors.length > 0 || workTypes.length > 0;

  if (incompleteActivities.length === 0) return (
    <div className="flex flex-col items-center py-16 gap-2">
      <span className="text-4xl">✅</span>
      <p style={{ color: '#64748b' }}>All activities are complete — Monte Carlo not applicable.</p>
    </div>
  );

  const { chartData, p50, p80, p90, targetCount } = results || {};
  const p50Bin = chartData?.find(b => b.day >= p50?.days)?.label;
  const p80Bin = chartData?.find(b => b.day >= p80?.days)?.label;
  const p90Bin = chartData?.find(b => b.day >= p90?.days)?.label;

  return (
    <div className="space-y-4">

      {/* ── FILTER HEADER ── */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4" style={{ color: '#028090' }} />
          <span className="text-sm font-semibold" style={{ color: '#CADCFC' }}>Activity Filters</span>
          {activeFilters > 0 && (
            <>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>{activeFilters} active</span>
              <button onClick={() => { setFilterBuilding(''); setFilterContractor(''); setFilterWorkType(''); }}
                className="text-xs hover:opacity-70 ml-auto" style={{ color: '#ef4444' }}>Clear filters</button>
            </>
          )}
          <span className="text-xs ml-auto" style={{ color: '#475569' }}>
            {filteredActivities.length} / {incompleteActivities.length} activities
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          <FilterDropdown label="Building" options={buildings} value={filterBuilding} onChange={setFilterBuilding} />
          <FilterDropdown label="Contractor" options={contractors} value={filterContractor} onChange={setFilterContractor} />
          <FilterDropdown label="Type of Work" options={workTypes} value={filterWorkType} onChange={setFilterWorkType} />
        </div>
        {activeFilters > 0 && filteredActivities.length === 0 && (
          <p className="text-xs mt-3" style={{ color: '#f59e0b' }}>⚠️ No activities match the current filters.</p>
        )}
      </div>

      {/* ── TARGET SELECTOR ── */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-sm font-semibold" style={{ color: '#CADCFC' }}>Simulation Target</div>
          <div className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(2,128,144,0.15)', color: '#94a3b8' }}>
            {selectedIds.length === 0 ? `All ${options.length} filtered activities` : `${selectedIds.length} selected`}
          </div>
          {selectedIds.length > 0 && (
            <button onClick={() => setSelectedIds([])} className="text-xs ml-auto hover:opacity-70" style={{ color: '#ef4444' }}>Reset to all</button>
          )}
        </div>
        <MultiSelect
          options={options}
          selected={selectedIds}
          onChange={setSelectedIds}
          placeholder={`Simulate all ${options.length} filtered activities (click to narrow down)`}
        />
        <div className="flex gap-3 mt-2 text-xs" style={{ color: '#475569' }}>
          <span>🔴 <span style={{ color: '#ef4444' }}>CP</span> = Critical Path</span>
          <span>🟣 <span style={{ color: '#a855f7' }}>MS</span> = Milestone</span>
        </div>
      </div>

      {/* ── GROUP VARIATION CONTROLS ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
        <button
          onClick={() => setVariationsOpen(!variationsOpen)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left"
          style={{ background: variationsOpen ? 'rgba(30,39,97,0.6)' : 'rgba(30,39,97,0.4)' }}
        >
          <SlidersHorizontal className="w-4 h-4" style={{ color: '#028090' }} />
          <span className="text-sm font-semibold" style={{ color: '#CADCFC' }}>Group Variation Controls</span>
          {Object.keys(variations).length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(2,128,144,0.2)', color: '#00A896' }}>
              {Object.keys(variations).length} custom
            </span>
          )}
          <span className="text-xs ml-2" style={{ color: '#475569' }}>Set min/max duration variance per group</span>
          {variationsOpen ? <ChevronUp className="w-4 h-4 ml-auto" style={{ color: '#64748b' }} /> : <ChevronDown className="w-4 h-4 ml-auto" style={{ color: '#64748b' }} />}
        </button>

        {variationsOpen && (
          <div className="p-4" style={{ background: 'rgba(15,23,42,0.5)', borderTop: '1px solid rgba(202,220,252,0.08)' }}>
            {!hasGroupData && (
              <p className="text-xs mb-3" style={{ color: '#f59e0b' }}>
                ⚠️ No building / contractor / work type data found on activities. Enrich your schedule data to use group variations.
              </p>
            )}
            <p className="text-xs mb-3" style={{ color: '#64748b' }}>
              Override the default ±{DEFAULT_MIN}–{DEFAULT_MAX}% variance for specific groups. Priority order: Building → Contractor → Work Type → Default.
            </p>

            {/* Sub-tabs */}
            <div className="flex gap-1 mb-4">
              {[['building', 'Building', buildings], ['contractor', 'Contractor', contractors], ['workType', 'Work Type', workTypes]].map(([key, label, vals]) => (
                <button
                  key={key}
                  onClick={() => setVariationGroupTab(key)}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                  style={{
                    background: variationGroupTab === key ? 'rgba(2,128,144,0.25)' : 'rgba(30,39,97,0.4)',
                    color: variationGroupTab === key ? '#00A896' : '#64748b',
                    border: `1px solid ${variationGroupTab === key ? 'rgba(2,128,144,0.4)' : 'rgba(202,220,252,0.1)'}`,
                  }}
                >
                  {label}
                  {vals.length > 0 && <span className="ml-1.5 opacity-60">({vals.length})</span>}
                </button>
              ))}
            </div>

            {variationGroupTab === 'building' && (
              <GroupVariationTable groupType="building" groups={buildings} variations={variations} onChange={handleVariationChange} />
            )}
            {variationGroupTab === 'contractor' && (
              <GroupVariationTable groupType="contractor" groups={contractors} variations={variations} onChange={handleVariationChange} />
            )}
            {variationGroupTab === 'workType' && (
              <GroupVariationTable groupType="workType" groups={workTypes} variations={variations} onChange={handleVariationChange} />
            )}

            {Object.keys(variations).length > 0 && (
              <button onClick={() => setVariations({})} className="mt-3 text-xs hover:opacity-70" style={{ color: '#ef4444' }}>
                Reset all to default (±{DEFAULT_MIN}–{DEFAULT_MAX}%)
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── RESULTS ── */}
      {results && (
        <>
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
            <div className="text-xs mb-4" style={{ color: '#64748b' }}>
              {ITERATIONS.toLocaleString()} iterations · {targetCount} activit{targetCount === 1 ? 'y' : 'ies'}
              {Object.keys(variations).length > 0 ? ` · ${Object.keys(variations).length} group variance overrides` : ` · ±${DEFAULT_MIN}–${DEFAULT_MAX}% default variance`}
              {activeFilters > 0 && ` · ${activeFilters} filter${activeFilters > 1 ? 's' : ''} applied`}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(202,220,252,0.07)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.15)', borderRadius: 8, color: '#CADCFC' }}
                  formatter={v => [`${v} iterations`]}
                />
                <Bar dataKey="count" fill="rgba(2,128,144,0.6)" radius={[3, 3, 0, 0]} />
                {p50Bin && <ReferenceLine x={p50Bin} stroke="#10b981" strokeDasharray="4 2" label={{ value: 'P50', fill: '#10b981', fontSize: 10, position: 'top' }} />}
                {p80Bin && <ReferenceLine x={p80Bin} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'P80', fill: '#f59e0b', fontSize: 10, position: 'top' }} />}
                {p90Bin && <ReferenceLine x={p90Bin} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'P90', fill: '#ef4444', fontSize: 10, position: 'top' }} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}