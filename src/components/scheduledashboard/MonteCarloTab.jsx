import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend,
} from 'recharts';
import { addDays, format } from 'date-fns';
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import RisksPanel from './RisksPanel';

const ITERATIONS = 1000;
const DEFAULT_DUR_MIN = 10;
const DEFAULT_DUR_MAX = 30;
const DEFAULT_COST_MIN = -5;
const DEFAULT_COST_MAX = 20;

// ── helpers ───────────────────────────────────────────────────────────────────
function getField(a, key) {
  if (key === 'building') return a.building || a.wbsCode?.split('.')[0] || null;
  if (key === 'contractor') return a.contractors || a.contractor || null;
  if (key === 'workType') return a.workType || a.activityType || null;
  return null;
}
function uniqueValues(activities, key) {
  return [...new Set(activities.map(a => getField(a, key)).filter(Boolean))].sort();
}
function pctile(sorted, p) { return sorted[Math.floor(sorted.length * p)] || 0; }
function toBins(values, binCount = 30) {
  const min = values[0];
  const max = values[values.length - 1];
  const binSize = Math.max(1, Math.ceil((max - min) / binCount));
  const bins = {};
  for (const v of values) {
    const bin = Math.floor((v - min) / binSize) * binSize + min;
    bins[bin] = (bins[bin] || 0) + 1;
  }
  return { bins, binSize };
}

// ── small UI ──────────────────────────────────────────────────────────────────
function FilterDropdown({ label, options, value, onChange }) {
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

function MultiSelect({ options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOptions = options.filter(o => selected.includes(o.id));
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);

  return (
    <div className="relative">
      <div className="min-h-[38px] px-3 py-1.5 rounded-lg cursor-pointer flex flex-wrap gap-1.5 items-center"
        style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)' }}
        onClick={() => setOpen(!open)}>
        {selectedOptions.length === 0
          ? <span style={{ color: '#475569', fontSize: '13px' }}>{placeholder}</span>
          : selectedOptions.map(o => (
            <span key={o.id} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{ background: 'rgba(2,128,144,0.25)', color: '#00A896', border: '1px solid rgba(2,128,144,0.3)' }}>
              {o.label.slice(0, 30)}{o.label.length > 30 ? '…' : ''}
              <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={e => { e.stopPropagation(); toggle(o.id); }} />
            </span>
          ))}
        <ChevronDown className="w-4 h-4 ml-auto shrink-0" style={{ color: '#64748b' }} />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-lg shadow-xl"
          style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(202,220,252,0.2)', maxHeight: '280px', overflowY: 'auto' }}>
          <div className="p-2 sticky top-0" style={{ background: 'rgba(15,23,42,0.98)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="w-full px-3 py-1.5 rounded text-xs outline-none"
              style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.15)', color: '#CADCFC' }}
              onClick={e => e.stopPropagation()} />
          </div>
          <div className="p-1">
            {filtered.length === 0 && <div className="px-3 py-2 text-xs" style={{ color: '#64748b' }}>No results</div>}
            {filtered.map(o => (
              <div key={o.id} onClick={() => toggle(o.id)} className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-xs hover:bg-white/5"
                style={{ color: selected.includes(o.id) ? '#00A896' : '#CADCFC' }}>
                <span className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                  style={{ borderColor: selected.includes(o.id) ? '#00A896' : 'rgba(202,220,252,0.3)', background: selected.includes(o.id) ? 'rgba(0,168,150,0.2)' : 'transparent' }}>
                  {selected.includes(o.id) && <span style={{ color: '#00A896', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
                </span>
                <span className="flex-1">{o.label}</span>
                {o.isCritical && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>CP</span>}
                {o.isRisk && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>RISK</span>}
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

function GroupVariationTable({ groupType, groups, variations, onChange }) {
  if (groups.length === 0) {
    return <p className="text-xs py-2" style={{ color: '#475569' }}>No {groupType} groups found in activity data.</p>;
  }
  return (
    <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
          <th className="text-left py-1.5 pr-3 font-medium" style={{ color: '#64748b' }}>Group Name</th>
          <th className="py-1.5 pr-3 font-medium text-center" style={{ color: '#64748b' }}>Dur Min %</th>
          <th className="py-1.5 font-medium text-center" style={{ color: '#64748b' }}>Dur Max %</th>
        </tr>
      </thead>
      <tbody>
        {groups.map(g => {
          const key = `${groupType}::${g}`;
          const min = variations[key]?.min ?? DEFAULT_DUR_MIN;
          const max = variations[key]?.max ?? DEFAULT_DUR_MAX;
          return (
            <tr key={g} style={{ borderBottom: '1px solid rgba(202,220,252,0.05)' }}>
              <td className="py-1.5 pr-3" style={{ color: '#CADCFC' }}>{g}</td>
              <td className="py-1 pr-3">
                <input type="number" min={-100} max={200} value={min}
                  onChange={e => onChange(key, 'min', Number(e.target.value))}
                  className="w-16 text-center px-2 py-0.5 rounded text-xs outline-none"
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }} />
              </td>
              <td className="py-1">
                <input type="number" min={-100} max={200} value={max}
                  onChange={e => onChange(key, 'max', Number(e.target.value))}
                  className="w-16 text-center px-2 py-0.5 rounded text-xs outline-none"
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── summary card ──────────────────────────────────────────────────────────────
function PCard({ label, durDays, durDate, costPct, color }) {
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(30,39,97,0.5)', border: `1px solid ${color}30` }}>
      <div className="text-xs" style={{ color: '#64748b' }}>{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{durDate}</div>
      <div className="text-xs" style={{ color: '#475569' }}>+{durDays} days from today</div>
      <div className="text-xs mt-1 pt-1" style={{ borderTop: '1px solid rgba(202,220,252,0.08)', color: costPct > 0 ? '#ef4444' : '#10b981' }}>
        Cost impact: {costPct > 0 ? '+' : ''}{costPct.toFixed(1)}% avg
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function MonteCarloTab({ activities, projectId }) {
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterContractor, setFilterContractor] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [variations, setVariations] = useState({});
  const [variationsOpen, setVariationsOpen] = useState(false);
  const [variationGroupTab, setVariationGroupTab] = useState('building');
  const [risksOpen, setRisksOpen] = useState(false);
  const [chartMode, setChartMode] = useState('duration'); // 'duration' | 'cost'

  const handleVariationChange = (key, field, value) =>
    setVariations(prev => ({ ...prev, [key]: { ...(prev[key] || { min: DEFAULT_DUR_MIN, max: DEFAULT_DUR_MAX }), [field]: value } }));

  const { data: scheduleRisks = [] } = useQuery({
    queryKey: ['scheduleRisks', projectId],
    queryFn: () => base44.entities.ScheduleRisk.filter({ project: projectId }),
    enabled: !!projectId,
  });

  // Build a map: activityId → risk
  const riskByTask = useMemo(() => {
    const map = {};
    for (const r of scheduleRisks) {
      if (r.linkedTaskId) map[r.linkedTaskId] = r;
    }
    return map;
  }, [scheduleRisks]);

  const incompleteActivities = useMemo(() =>
    activities.filter(a => (a.percentComplete || 0) < 100 && (a.remainingDuration || 0) > 0),
    [activities]);

  const buildings = useMemo(() => uniqueValues(incompleteActivities, 'building'), [incompleteActivities]);
  const contractors = useMemo(() => uniqueValues(incompleteActivities, 'contractor'), [incompleteActivities]);
  const workTypes = useMemo(() => uniqueValues(incompleteActivities, 'workType'), [incompleteActivities]);

  const filteredActivities = useMemo(() => incompleteActivities.filter(a => {
    if (filterBuilding && getField(a, 'building') !== filterBuilding) return false;
    if (filterContractor && getField(a, 'contractor') !== filterContractor) return false;
    if (filterWorkType && getField(a, 'workType') !== filterWorkType) return false;
    return true;
  }), [incompleteActivities, filterBuilding, filterContractor, filterWorkType]);

  const options = useMemo(() => filteredActivities.map(a => {
    const actId = a.id || a.activityId || a.activityName;
    const linkedRisk = riskByTask[actId];
    return {
      id: actId,
      label: a.activityName || a.activityId || 'Unnamed',
      isCritical: !!a.isCriticalPath,
      type: a.isMilestone ? 'milestone' : 'task',
      remainingDuration: a.remainingDuration || 1,
      building: getField(a, 'building'),
      contractor: getField(a, 'contractor'),
      workType: getField(a, 'workType'),
      isRisk: !!linkedRisk,
      risk: linkedRisk || null,
    };
  }).sort((a, b) => {
    if (a.isCritical !== b.isCritical) return b.isCritical - a.isCritical;
    if (a.type !== b.type) return a.type === 'milestone' ? -1 : 1;
    return a.label.localeCompare(b.label);
  }), [filteredActivities, riskByTask]);

  const targetActivities = useMemo(() =>
    selectedIds.length === 0 ? options : options.filter(o => selectedIds.includes(o.id)),
    [options, selectedIds]);

  // Variance lookup: risk > group > default
  const getVariances = (activity) => {
    // Duration variance
    let durMin, durMax, costMin, costMax;
    if (activity.risk) {
      const r = activity.risk;
      // apply probability: if random > probability, use neutral (0) variation
      durMin = r.durationVariationMin ?? DEFAULT_DUR_MIN * -1;
      durMax = r.durationVariationMax ?? DEFAULT_DUR_MAX;
      costMin = r.costVariationMin ?? DEFAULT_COST_MIN;
      costMax = r.costVariationMax ?? DEFAULT_COST_MAX;
    } else {
      // group variation (duration only; cost falls back to default)
      let groupFound = false;
      for (const [groupType, field] of [['building', 'building'], ['contractor', 'contractor'], ['workType', 'workType']]) {
        const val = activity[field];
        if (val) {
          const key = `${groupType}::${val}`;
          if (variations[key]) {
            durMin = variations[key].min;
            durMax = variations[key].max;
            groupFound = true;
            break;
          }
        }
      }
      if (!groupFound) {
        durMin = DEFAULT_DUR_MIN;
        durMax = DEFAULT_DUR_MAX;
      }
      costMin = DEFAULT_COST_MIN;
      costMax = DEFAULT_COST_MAX;
    }
    return { durMin, durMax, costMin, costMax };
  };

  const results = useMemo(() => {
    if (targetActivities.length === 0) return null;

    const durDays = [];
    const costPcts = [];

    for (let i = 0; i < ITERATIONS; i++) {
      let maxDur = 0;
      let totalCostVar = 0;
      for (const a of targetActivities) {
        const { durMin, durMax, costMin, costMax, risk } = { ...getVariances(a), risk: a.risk };
        const base = a.remainingDuration || 1;

        // Apply risk probability: if risk exists and random roll > probability, skip risk (use default tiny variance)
        let effectiveDurMin = durMin;
        let effectiveDurMax = durMax;
        let effectiveCostMin = costMin;
        let effectiveCostMax = costMax;

        if (risk) {
          const prob = (risk.probability ?? 80) / 100;
          if (Math.random() > prob) {
            // Risk doesn't trigger — use default variance
            effectiveDurMin = DEFAULT_DUR_MIN * -1;
            effectiveDurMax = DEFAULT_DUR_MIN;
            effectiveCostMin = 0;
            effectiveCostMax = 0;
          }
        }

        const durVarPct = (effectiveDurMin + Math.random() * (effectiveDurMax - effectiveDurMin)) / 100;
        const simDur = base * (1 + durVarPct);
        if (simDur > maxDur) maxDur = simDur;

        const costVarPct = effectiveCostMin + Math.random() * (effectiveCostMax - effectiveCostMin);
        totalCostVar += costVarPct;
      }
      durDays.push(Math.round(maxDur));
      costPcts.push(totalCostVar / targetActivities.length);
    }

    durDays.sort((a, b) => a - b);
    costPcts.sort((a, b) => a - b);

    const today = new Date();
    const dp50 = pctile(durDays, 0.5);
    const dp80 = pctile(durDays, 0.8);
    const dp90 = pctile(durDays, 0.9);
    const cp50 = pctile(costPcts, 0.5);
    const cp80 = pctile(costPcts, 0.8);
    const cp90 = pctile(costPcts, 0.9);

    // Duration bins
    const { bins: durBins } = toBins(durDays);
    const durChartData = Object.entries(durBins)
      .map(([day, count]) => ({ day: parseInt(day), label: format(addDays(today, parseInt(day)), 'd MMM yy'), count }))
      .sort((a, b) => a.day - b.day);

    // Cost bins (rounded to 1 decimal)
    const costRounded = costPcts.map(v => Math.round(v * 10) / 10);
    const { bins: costBins } = toBins(costRounded, 25);
    const costChartData = Object.entries(costBins)
      .map(([pct, count]) => ({ pct: parseFloat(pct), label: `${parseFloat(pct) > 0 ? '+' : ''}${parseFloat(pct).toFixed(1)}%`, count }))
      .sort((a, b) => a.pct - b.pct);

    return {
      durChartData, costChartData,
      p50: { days: dp50, date: format(addDays(today, dp50), 'd MMM yyyy'), costPct: cp50 },
      p80: { days: dp80, date: format(addDays(today, dp80), 'd MMM yyyy'), costPct: cp80 },
      p90: { days: dp90, date: format(addDays(today, dp90), 'd MMM yyyy'), costPct: cp90 },
      targetCount: targetActivities.length,
      riskLinkedCount: targetActivities.filter(a => a.risk).length,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetActivities, variations, scheduleRisks]);

  const activeFilters = [filterBuilding, filterContractor, filterWorkType].filter(Boolean).length;
  const hasGroupData = buildings.length > 0 || contractors.length > 0 || workTypes.length > 0;

  if (incompleteActivities.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-2">
        <span className="text-4xl">✅</span>
        <p style={{ color: '#64748b' }}>All activities are complete — Monte Carlo not applicable.</p>
      </div>
    );
  }

  const { durChartData, costChartData, p50, p80, p90, targetCount, riskLinkedCount } = results || {};

  const dp50Bin = durChartData?.find(b => b.day >= (p50?.days || 0))?.label || null;
  const dp80Bin = durChartData?.find(b => b.day >= (p80?.days || 0))?.label || null;
  const dp90Bin = durChartData?.find(b => b.day >= (p90?.days || 0))?.label || null;
  const cp50Bin = costChartData?.find(b => b.pct >= (p50?.costPct || 0))?.label || null;
  const cp80Bin = costChartData?.find(b => b.pct >= (p80?.costPct || 0))?.label || null;
  const cp90Bin = costChartData?.find(b => b.pct >= (p90?.costPct || 0))?.label || null;

  return (
    <div className="space-y-4">

      {/* ── FILTER HEADER ── */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4" style={{ color: '#028090' }} />
          <span className="text-sm font-semibold" style={{ color: '#CADCFC' }}>Activity Filters</span>
          {activeFilters > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>{activeFilters} active</span>
          )}
          <span className="text-xs ml-auto" style={{ color: '#475569' }}>
            {filteredActivities.length} / {incompleteActivities.length} activities
          </span>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterBuilding(''); setFilterContractor(''); setFilterWorkType(''); }}
              className="text-xs hover:opacity-70" style={{ color: '#ef4444' }}>Clear</button>
          )}
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
        <MultiSelect options={options} selected={selectedIds} onChange={setSelectedIds}
          placeholder={`Simulate all ${options.length} filtered activities (click to narrow down)`} />
        <div className="flex gap-4 mt-2 text-xs" style={{ color: '#475569' }}>
          <span>🔴 <span style={{ color: '#ef4444' }}>CP</span> = Critical Path</span>
          <span>🟡 <span style={{ color: '#f59e0b' }}>RISK</span> = Risk Linked</span>
          <span>🟣 <span style={{ color: '#a855f7' }}>MS</span> = Milestone</span>
        </div>
      </div>

      {/* ── GROUP VARIATION CONTROLS ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
        <button onClick={() => setVariationsOpen(!variationsOpen)} className="w-full flex items-center gap-2 px-4 py-3 text-left"
          style={{ background: variationsOpen ? 'rgba(30,39,97,0.6)' : 'rgba(30,39,97,0.4)' }}>
          <SlidersHorizontal className="w-4 h-4" style={{ color: '#028090' }} />
          <span className="text-sm font-semibold" style={{ color: '#CADCFC' }}>Group Variation Controls</span>
          {Object.keys(variations).length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(2,128,144,0.2)', color: '#00A896' }}>
              {Object.keys(variations).length} custom
            </span>
          )}
          <span className="text-xs ml-2" style={{ color: '#475569' }}>Duration variance per group</span>
          {variationsOpen
            ? <ChevronUp className="w-4 h-4 ml-auto" style={{ color: '#64748b' }} />
            : <ChevronDown className="w-4 h-4 ml-auto" style={{ color: '#64748b' }} />}
        </button>
        {variationsOpen && (
          <div className="p-4" style={{ background: 'rgba(15,23,42,0.5)', borderTop: '1px solid rgba(202,220,252,0.08)' }}>
            {!hasGroupData && (
              <p className="text-xs mb-3" style={{ color: '#f59e0b' }}>
                ⚠️ No building / contractor / work type data found. Enrich your schedule data to use group variations.
              </p>
            )}
            <p className="text-xs mb-3" style={{ color: '#64748b' }}>
              Override duration variance per group. Priority: Risk → Group → Default (±{DEFAULT_DUR_MIN}–{DEFAULT_DUR_MAX}%).
            </p>
            <div className="flex gap-1 mb-4">
              {[['building', 'Building', buildings], ['contractor', 'Contractor', contractors], ['workType', 'Work Type', workTypes]].map(([key, label, vals]) => (
                <button key={key} onClick={() => setVariationGroupTab(key)} className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                  style={{ background: variationGroupTab === key ? 'rgba(2,128,144,0.25)' : 'rgba(30,39,97,0.4)', color: variationGroupTab === key ? '#00A896' : '#64748b', border: `1px solid ${variationGroupTab === key ? 'rgba(2,128,144,0.4)' : 'rgba(202,220,252,0.1)'}` }}>
                  {label}{vals.length > 0 ? ` (${vals.length})` : ''}
                </button>
              ))}
            </div>
            {variationGroupTab === 'building' && <GroupVariationTable groupType="building" groups={buildings} variations={variations} onChange={handleVariationChange} />}
            {variationGroupTab === 'contractor' && <GroupVariationTable groupType="contractor" groups={contractors} variations={variations} onChange={handleVariationChange} />}
            {variationGroupTab === 'workType' && <GroupVariationTable groupType="workType" groups={workTypes} variations={variations} onChange={handleVariationChange} />}
            {Object.keys(variations).length > 0 && (
              <button onClick={() => setVariations({})} className="mt-3 text-xs hover:opacity-70" style={{ color: '#ef4444' }}>
                Reset all to default
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── RISKS PANEL ── */}
      <RisksPanel projectId={projectId} activities={activities} open={risksOpen} onToggle={() => setRisksOpen(!risksOpen)} />

      {/* ── RESULTS ── */}
      {results && (
        <>
          {/* P50/P80/P90 summary */}
          <div className="grid grid-cols-3 gap-3">
            <PCard label="P50 — 50% confidence" color="#10b981" {...p50} />
            <PCard label="P80 — 80% confidence" color="#f59e0b" {...p80} />
            <PCard label="P90 — 90% confidence" color="#ef4444" {...p90} />
          </div>

          {/* Chart toggle */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' }}>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <div className="text-sm font-semibold" style={{ color: '#CADCFC' }}>
                {chartMode === 'duration' ? 'Duration Distribution' : 'Cost Impact Distribution'}
              </div>
              <div className="flex gap-1 ml-auto">
                {[['duration', '📅 Duration'], ['cost', '💰 Cost']].map(([mode, lbl]) => (
                  <button key={mode} onClick={() => setChartMode(mode)} className="px-3 py-1 rounded text-xs font-medium"
                    style={{ background: chartMode === mode ? 'rgba(2,128,144,0.3)' : 'rgba(30,39,97,0.4)', color: chartMode === mode ? '#00A896' : '#64748b', border: `1px solid ${chartMode === mode ? 'rgba(2,128,144,0.4)' : 'rgba(202,220,252,0.1)'}` }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs mb-4" style={{ color: '#64748b' }}>
              {ITERATIONS.toLocaleString()} iterations · {targetCount} activit{targetCount === 1 ? 'y' : 'ies'}
              {riskLinkedCount > 0 ? ` · ${riskLinkedCount} risk-linked` : ''}
              {Object.keys(variations).length > 0 ? ` · ${Object.keys(variations).length} group overrides` : ''}
              {activeFilters > 0 ? ` · ${activeFilters} filter${activeFilters > 1 ? 's' : ''} applied` : ''}
            </div>

            {chartMode === 'duration' ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={durChartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(202,220,252,0.07)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.15)', borderRadius: 8, color: '#CADCFC' }} formatter={v => [`${v} iterations`, 'Count']} />
                  <Bar dataKey="count" name="Iterations" fill="rgba(2,128,144,0.6)" radius={[3, 3, 0, 0]} />
                  {dp50Bin && <ReferenceLine x={dp50Bin} stroke="#10b981" strokeDasharray="4 2" label={{ value: 'P50', fill: '#10b981', fontSize: 10, position: 'top' }} />}
                  {dp80Bin && <ReferenceLine x={dp80Bin} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'P80', fill: '#f59e0b', fontSize: 10, position: 'top' }} />}
                  {dp90Bin && <ReferenceLine x={dp90Bin} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'P90', fill: '#ef4444', fontSize: 10, position: 'top' }} />}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costChartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(202,220,252,0.07)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.15)', borderRadius: 8, color: '#CADCFC' }} formatter={v => [`${v} iterations`, 'Count']} />
                  <Bar dataKey="count" name="Iterations" fill="rgba(245,158,11,0.55)" radius={[3, 3, 0, 0]} />
                  {cp50Bin && <ReferenceLine x={cp50Bin} stroke="#10b981" strokeDasharray="4 2" label={{ value: 'P50', fill: '#10b981', fontSize: 10, position: 'top' }} />}
                  {cp80Bin && <ReferenceLine x={cp80Bin} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'P80', fill: '#f59e0b', fontSize: 10, position: 'top' }} />}
                  {cp90Bin && <ReferenceLine x={cp90Bin} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'P90', fill: '#ef4444', fontSize: 10, position: 'top' }} />}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}