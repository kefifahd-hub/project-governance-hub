import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, AlertTriangle, X, Check } from 'lucide-react';

const EMPTY_FORM = {
  name: '', description: '', linkedTaskId: '',
  durationVariationMin: -10, durationVariationMax: 30,
  costVariationMin: -5, costVariationMax: 20,
  probability: 80,
};

function NumInput({ value, onChange, min, max }) {
  return (
    <input
      type="number" value={value} min={min} max={max}
      onChange={e => onChange(Number(e.target.value))}
      className="w-16 text-center px-1 py-0.5 rounded text-xs outline-none"
      style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }}
    />
  );
}

function TaskSearchDropdown({ activities, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = activities.filter(a =>
    (a.activityName || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.activityId || '').toLowerCase().includes(search.toLowerCase())
  );
  const selected = activities.find(a => (a.id || a.activityId) === value);

  return (
    <div className="relative">
      <div
        className="px-2 py-1.5 rounded text-xs cursor-pointer flex items-center justify-between"
        style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)', color: selected ? '#CADCFC' : '#475569', minWidth: '200px' }}
        onClick={() => setOpen(!open)}
      >
        <span>{selected ? (selected.activityName || selected.activityId) : 'Link to task…'}</span>
        <div className="flex items-center gap-1">
          {value && <X className="w-3 h-3 hover:text-red-400" onClick={e => { e.stopPropagation(); onChange(''); }} />}
          <ChevronDown className="w-3 h-3" style={{ color: '#64748b' }} />
        </div>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 rounded-lg shadow-xl" style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(202,220,252,0.2)', minWidth: '260px', maxHeight: '220px', overflowY: 'auto' }}>
          <div className="p-2 sticky top-0" style={{ background: 'rgba(15,23,42,0.98)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
              className="w-full px-2 py-1 rounded text-xs outline-none"
              style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.15)', color: '#CADCFC' }}
              onClick={e => e.stopPropagation()} />
          </div>
          <div className="p-1">
            <div
              onClick={() => { onChange(''); setOpen(false); }}
              className="px-3 py-1.5 rounded cursor-pointer text-xs hover:bg-white/5"
              style={{ color: '#475569' }}
            >— No linked task (global risk)</div>
            {filtered.slice(0, 50).map(a => {
              const id = a.id || a.activityId;
              return (
                <div key={id} onClick={() => { onChange(id); setOpen(false); setSearch(''); }}
                  className="px-3 py-1.5 rounded cursor-pointer text-xs hover:bg-white/5 flex items-center gap-2"
                  style={{ color: value === id ? '#00A896' : '#CADCFC' }}
                >
                  {a.isCriticalPath && <span className="text-[9px] px-1 rounded shrink-0" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>CP</span>}
                  <span className="truncate">{a.activityName || a.activityId}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

function RiskForm({ form, setForm, activities, onSave, onCancel, saving }) {
  return (
    <div className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(2,128,144,0.3)' }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#475569' }}>Risk Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Subcontractor delay"
            className="w-full px-2 py-1.5 rounded text-xs outline-none"
            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }} />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#475569' }}>Probability %</label>
          <NumInput value={form.probability} onChange={v => setForm(f => ({ ...f, probability: v }))} min={0} max={100} />
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#475569' }}>Description</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description"
          className="w-full px-2 py-1.5 rounded text-xs outline-none"
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#475569' }}>Linked Task</label>
        <TaskSearchDropdown activities={activities} value={form.linkedTaskId} onChange={v => setForm(f => ({ ...f, linkedTaskId: v }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: '#475569' }}>Duration Variation %</label>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#64748b' }}>Min</span>
            <NumInput value={form.durationVariationMin} onChange={v => setForm(f => ({ ...f, durationVariationMin: v }))} min={-100} max={200} />
            <span className="text-xs" style={{ color: '#64748b' }}>Max</span>
            <NumInput value={form.durationVariationMax} onChange={v => setForm(f => ({ ...f, durationVariationMax: v }))} min={-100} max={200} />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: '#475569' }}>Cost Variation %</label>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#64748b' }}>Min</span>
            <NumInput value={form.costVariationMin} onChange={v => setForm(f => ({ ...f, costVariationMin: v }))} min={-100} max={200} />
            <span className="text-xs" style={{ color: '#64748b' }}>Max</span>
            <NumInput value={form.costVariationMax} onChange={v => setForm(f => ({ ...f, costVariationMax: v }))} min={-100} max={200} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 rounded text-xs" style={{ background: 'rgba(30,39,97,0.4)', color: '#94a3b8', border: '1px solid rgba(202,220,252,0.1)' }}>Cancel</button>
        <button onClick={onSave} disabled={saving || !form.name}
          className="px-3 py-1.5 rounded text-xs flex items-center gap-1 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
          <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save Risk'}
        </button>
      </div>
    </div>
  );
}

export default function RisksPanel({ projectId, activities, open, onToggle }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: risks = [] } = useQuery({
    queryKey: ['scheduleRisks', projectId],
    queryFn: () => base44.entities.ScheduleRisk.filter({ project: projectId }),
    enabled: !!projectId && open,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['scheduleRisks', projectId] });

  const createMut = useMutation({ mutationFn: d => base44.entities.ScheduleRisk.create(d), onSuccess: invalidate });
  const updateMut = useMutation({ mutationFn: ({ id, d }) => base44.entities.ScheduleRisk.update(id, d), onSuccess: invalidate });
  const deleteMut = useMutation({ mutationFn: id => base44.entities.ScheduleRisk.delete(id), onSuccess: invalidate });

  const saving = createMut.isPending || updateMut.isPending;

  const handleSave = () => {
    const data = { ...form, project: projectId };
    if (editingId) {
      updateMut.mutate({ id: editingId, d: data }, { onSuccess: () => { setEditingId(null); setShowForm(false); setForm({ ...EMPTY_FORM }); } });
    } else {
      createMut.mutate(data, { onSuccess: () => { setShowForm(false); setForm({ ...EMPTY_FORM }); } });
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({ name: r.name, description: r.description || '', linkedTaskId: r.linkedTaskId || '', durationVariationMin: r.durationVariationMin ?? -10, durationVariationMax: r.durationVariationMax ?? 30, costVariationMin: r.costVariationMin ?? -5, costVariationMax: r.costVariationMax ?? 20, probability: r.probability ?? 80 });
    setShowForm(true);
  };

  const handleCancel = () => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); };

  const linkedTaskName = (id) => {
    if (!id) return <span style={{ color: '#475569' }}>Global</span>;
    const a = activities.find(a => (a.id || a.activityId) === id);
    return a ? (a.activityName || a.activityId) : <span style={{ color: '#f59e0b' }}>Unknown task</span>;
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        style={{ background: open ? 'rgba(30,39,97,0.6)' : 'rgba(30,39,97,0.4)' }}
      >
        <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
        <span className="text-sm font-semibold" style={{ color: '#CADCFC' }}>Risk-Linked Variations</span>
        {risks.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
            {risks.length} risk{risks.length !== 1 ? 's' : ''}
          </span>
        )}
        <span className="text-xs ml-2" style={{ color: '#475569' }}>Per-task duration & cost overrides</span>
        {open ? <ChevronUp className="w-4 h-4 ml-auto" style={{ color: '#64748b' }} /> : <ChevronDown className="w-4 h-4 ml-auto" style={{ color: '#64748b' }} />}
      </button>

      {open && (
        <div className="p-4 space-y-3" style={{ background: 'rgba(15,23,42,0.5)', borderTop: '1px solid rgba(202,220,252,0.08)' }}>
          <p className="text-xs" style={{ color: '#64748b' }}>
            Risks linked to a specific task override group/default variations for that task. Unlinked risks apply globally. Priority: Risk → Group → Default.
          </p>

          {/* Risk table */}
          {risks.length > 0 && (
            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(202,220,252,0.08)' }}>
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(30,39,97,0.5)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
                    {['Risk Name', 'Linked Task', 'Prob %', 'Dur Min%', 'Dur Max%', 'Cost Min%', 'Cost Max%', ''].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium" style={{ color: '#64748b' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {risks.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(30,39,97,0.2)', borderBottom: '1px solid rgba(202,220,252,0.05)' }}>
                      <td className="px-3 py-2" style={{ color: '#CADCFC' }}>{r.name}</td>
                      <td className="px-3 py-2 max-w-[160px] truncate" style={{ color: '#94a3b8' }}>{linkedTaskName(r.linkedTaskId)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: `rgba(${r.probability >= 70 ? '239,68,68' : r.probability >= 40 ? '245,158,11' : '16,185,129'},0.15)`, color: r.probability >= 70 ? '#ef4444' : r.probability >= 40 ? '#f59e0b' : '#10b981' }}>
                          {r.probability ?? 80}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center" style={{ color: (r.durationVariationMin ?? -10) < 0 ? '#10b981' : '#f59e0b' }}>{r.durationVariationMin ?? -10}%</td>
                      <td className="px-3 py-2 text-center" style={{ color: '#ef4444' }}>{r.durationVariationMax ?? 30}%</td>
                      <td className="px-3 py-2 text-center" style={{ color: (r.costVariationMin ?? -5) < 0 ? '#10b981' : '#f59e0b' }}>{r.costVariationMin ?? -5}%</td>
                      <td className="px-3 py-2 text-center" style={{ color: '#ef4444' }}>{r.costVariationMax ?? 20}%</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(r)} className="p-1 rounded hover:bg-white/10" style={{ color: '#64748b' }}><Pencil className="w-3 h-3" /></button>
                          <button onClick={() => deleteMut.mutate(r.id)} className="p-1 rounded hover:bg-red-500/10" style={{ color: '#64748b' }}><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {risks.length === 0 && !showForm && (
            <p className="text-xs text-center py-3" style={{ color: '#334155' }}>No risks defined yet. Add one below.</p>
          )}

          {/* Form */}
          {showForm ? (
            <RiskForm form={form} setForm={setForm} activities={activities} onSave={handleSave} onCancel={handleCancel} saving={saving} />
          ) : (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(2,128,144,0.12)', color: '#00A896', border: '1px solid rgba(2,128,144,0.25)' }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Risk
            </button>
          )}
        </div>
      )}
    </div>
  );
}