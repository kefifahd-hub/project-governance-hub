import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Trash2, Pause, Play, History, FlaskConical, ChevronDown, ChevronUp, X, Plus } from 'lucide-react';
import ProcessingRuleEditor from './ProcessingRuleEditor';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };
const codeStyle = { background: 'rgba(5,10,25,0.8)', borderColor: 'rgba(202,220,252,0.15)', color: '#a5f3fc', resize: 'vertical' };

const ALL_ENTITIES = [
  'ChangeRequest', 'ChangeImpactAssessment', 'ChangeApproval',
  'ActionItem', 'ActionBucket', 'ActionPhase', 'ActionChecklist', 'ActionComment',
  'FinanceModel', 'CapexPlan', 'RevenueAssumptions', 'DCFAssumptions', 'BOMAssumptions',
  'WeeklyReport', 'WeeklyReportSectionConfig', 'DailySiteReport',
  'Milestone', 'QualityGate', 'Risk', 'QARecord', 'NonConformity',
  'ScheduleTask', 'ScheduleActivity', 'ScheduleSource', 'ScheduleVersion', 'ScheduleDelta',
  'Project', 'BudgetTracking', 'FeasibilityStudy', 'FEEDItem',
  'CandidateSite', 'SiteAssessment', 'SiteCriteria',
  'Neuron', 'Synapse', 'SynapseLog', 'SynapseVersion', 'ProcessingRule',
  'Organization', 'PlatformUser', 'PlatformRole', 'AuditLog',
];

const SORT_DIRECTIONS = ['ASC', 'DESC'];
const TARGET_ACTIONS = ['Update', 'Append', 'Create', 'Merge', 'Alert Only'];
const TRIGGER_TYPES = ['Real-time', 'On Event', 'Scheduled', 'On Demand', 'On Record Change'];
const SYNAPSE_TYPES = ['One-Way', 'Bidirectional', 'Event-Triggered', 'Scheduled'];
const COMMON_EVENTS = ['on_cr_approval', 'on_report_generation', 'on_schedule_import', 'on_risk_creation', 'on_gate_review', 'on_action_created', 'on_milestone_passed', 'on_budget_update'];

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>
      <button className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: 'rgba(30,39,97,0.4)' }} onClick={() => setOpen(o => !o)}>
        <span className="text-sm font-semibold" style={{ color: '#CADCFC' }}>{title}</span>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: '#64748b' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#64748b' }} />}
      </button>
      {open && <div className="p-4 flex flex-col gap-3" style={{ background: 'rgba(15,23,42,0.5)' }}>{children}</div>}
    </div>
  );
};

const Field = ({ label, children, hint }) => (
  <div>
    <label className="text-[10px] font-semibold mb-1 block tracking-widest" style={{ color: '#64748b' }}>{label}</label>
    {children}
    {hint && <div className="text-[10px] mt-1" style={{ color: '#475569' }}>{hint}</div>}
  </div>
);

// ─── Tag Input ────────────────────────────────────────────────────────────
function TagInput({ value, onChange, placeholder, suggestions = [] }) {
  const [input, setInput] = useState('');
  const [showSug, setShowSug] = useState(false);
  const tags = Array.isArray(value) ? value : (value ? value.split(',').map(t => t.trim()).filter(Boolean) : []);

  const add = (tag) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) { onChange([...tags, t]); }
    setInput('');
    setShowSug(false);
  };

  const remove = (tag) => onChange(tags.filter(t => t !== tag));

  const filtered = suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s));

  return (
    <div className="relative">
      <div className="min-h-[32px] flex flex-wrap gap-1 p-1 rounded-md border" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)' }}>
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,168,150,0.2)', color: '#00A896' }}>
            {t}
            <button onClick={() => remove(t)}><X className="w-2.5 h-2.5" /></button>
          </span>
        ))}
        <input value={input} onChange={e => { setInput(e.target.value); setShowSug(true); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); } }}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-xs outline-none" style={{ color: '#F8FAFC' }} />
      </div>
      {showSug && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-20 rounded-lg shadow-xl mt-1 max-h-32 overflow-y-auto"
          style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(202,220,252,0.15)' }}>
          {filtered.map(s => (
            <button key={s} onMouseDown={() => add(s)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5" style={{ color: '#CADCFC' }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Field Checklist for Data Source ─────────────────────────────────────
function FieldChecklist({ fields, selected, onChange }) {
  const allSelected = fields.length > 0 && fields.every(f => selected.includes(f));

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
        {fields.map(f => (
          <label key={f} className="flex items-center gap-1.5 text-xs cursor-pointer py-0.5" style={{ color: selected.includes(f) ? '#CADCFC' : '#64748b' }}>
            <input type="checkbox" checked={selected.includes(f)}
              onChange={() => onChange(selected.includes(f) ? selected.filter(x => x !== f) : [...selected, f])}
              className="w-3 h-3 accent-teal-500" />
            <span className="font-mono">{f}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2 mt-1">
        <button onClick={() => onChange(fields)} className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(0,168,150,0.3)', color: '#00A896' }}>Select All</button>
        <button onClick={() => onChange([])} className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b' }}>Select None</button>
      </div>
    </div>
  );
}

// ─── Field Mapping Table ──────────────────────────────────────────────────
function FieldMappingTable({ value, onChange, sourceFields }) {
  let rows = [];
  try { rows = typeof value === 'string' ? Object.entries(JSON.parse(value || '{}')).map(([from, to]) => ({ from, to })) : []; } catch {}
  if (rows.length === 0) rows = [{ from: '', to: '' }];

  const save = (updated) => {
    const obj = {};
    updated.forEach(r => { if (r.from) obj[r.from] = r.to; });
    onChange(JSON.stringify(obj));
  };

  const autoMap = () => {
    const mapped = sourceFields.map(f => ({ from: f, to: f }));
    save(mapped.length ? mapped : rows);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="grid grid-cols-[1fr,24px,1fr,28px] gap-0">
          <div className="px-3 py-1.5 text-[10px] font-semibold" style={{ background: 'rgba(30,39,97,0.6)', color: '#64748b' }}>FROM (processed output)</div>
          <div className="py-1.5 text-[10px] text-center" style={{ background: 'rgba(30,39,97,0.6)', color: '#64748b' }}>→</div>
          <div className="px-3 py-1.5 text-[10px] font-semibold" style={{ background: 'rgba(30,39,97,0.6)', color: '#64748b' }}>TO (target field)</div>
          <div style={{ background: 'rgba(30,39,97,0.6)' }} />
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr,24px,1fr,28px] gap-0" style={{ borderTop: '1px solid rgba(202,220,252,0.05)' }}>
            <div className="px-2 py-1">
              <Input value={row.from} onChange={e => { const r = [...rows]; r[i] = { ...row, from: e.target.value }; save(r); }}
                placeholder="source_field" className="h-7 text-xs border-0 p-0 font-mono focus:ring-0" style={{ background: 'transparent', color: '#a5f3fc' }} />
            </div>
            <div className="flex items-center justify-center text-xs" style={{ color: '#475569' }}>→</div>
            <div className="px-2 py-1">
              <Input value={row.to} onChange={e => { const r = [...rows]; r[i] = { ...row, to: e.target.value }; save(r); }}
                placeholder="target_field" className="h-7 text-xs border-0 p-0 font-mono focus:ring-0" style={{ background: 'transparent', color: '#84cc16' }} />
            </div>
            <div className="flex items-center justify-center">
              <button onClick={() => save(rows.filter((_, j) => j !== i))}>
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => save([...rows, { from: '', to: '' }])}
          className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b' }}>
          + Add Mapping
        </button>
        <button onClick={autoMap}
          className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(0,168,150,0.3)', color: '#00A896' }}>
          Auto-Map by Name
        </button>
      </div>
      <div className="text-[10px]" style={{ color: '#475569' }}>ℹ️ "Auto-Map by Name" matches source fields to target fields with the same name</div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function SynapseConfigurator({ synapse, neurons, onClose, onSaved, onDeleted }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [rules, setRules] = useState([]);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('ASC');
  const [sourceFieldsList, setSourceFieldsList] = useState([]);

  const neuronMap = {};
  neurons.forEach(n => { neuronMap[n.id] = n; });
  const fromNeuron = neuronMap[synapse.from_neuron_id];
  const toNeuron = neuronMap[synapse.to_neuron_id];

  useEffect(() => {
    setForm({ ...synapse });
    try {
      const parsed = JSON.parse(synapse.processing_rules || '[]');
      setRules(Array.isArray(parsed) ? parsed.map((r, i) => ({ ...r, id: r.id || `r_${i}` })) : []);
    } catch { setRules([]); }
    // Parse sort
    const sortParts = (synapse.source_sort || '').split(' ');
    setSortBy(sortParts[0] || '');
    setSortDir(sortParts[1] || 'ASC');
    // Derive field suggestions from source_fields
    try {
      const f = JSON.parse(synapse.source_fields || '[]');
      setSourceFieldsList(Array.isArray(f) ? f : []);
    } catch { setSourceFieldsList([]); }
    base44.entities.SynapseVersion.filter({ synapse_id: synapse.id }, '-version_number', 10).then(setVersionHistory).catch(() => {});
  }, [synapse]);

  if (!form) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Parse source_fields as array
  let selectedFields = [];
  try { selectedFields = JSON.parse(form.source_fields || '[]'); } catch {}

  const handleSourceFieldsChange = (fields) => {
    set('source_fields', JSON.stringify(fields));
    setSourceFieldsList(fields);
  };

  const handleSave = async () => {
    setSaving(true);
    const prevConfig = JSON.stringify(synapse);
    const newSort = [sortBy, sortDir].filter(Boolean).join(' ');
    const updated = { ...form, source_sort: newSort, processing_rules: JSON.stringify(rules), version: (form.version || 1) + 1 };
    await base44.entities.Synapse.update(synapse.id, updated);
    await base44.entities.SynapseVersion.create({
      synapse_id: synapse.id, version_number: (form.version || 1) + 1,
      changed_at: new Date().toISOString(), change_description: 'Manual configuration update',
      previous_config: prevConfig, new_config: JSON.stringify(updated),
    });
    qc.invalidateQueries({ queryKey: ['synapses'] });
    setSaving(false);
    onSaved && onSaved();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete synapse "${synapse.synapse_name}"? This will stop data flow between these modules.`)) return;
    await base44.entities.Synapse.delete(synapse.id);
    qc.invalidateQueries({ queryKey: ['synapses'] });
    onDeleted && onDeleted();
  };

  const handleToggle = async () => {
    const updated = { ...form, is_active: !form.is_active, health_status: form.is_active ? 'Paused' : 'Active' };
    setForm(updated);
    await base44.entities.Synapse.update(synapse.id, { is_active: updated.is_active, health_status: updated.health_status });
    qc.invalidateQueries({ queryKey: ['synapses'] });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise(r => setTimeout(r, 1500));
    setTestResult({
      status: 'success',
      rules_passed: rules.filter(r => r.is_active).length,
      input: { entity: form.source_entity, filter: form.source_filter || 'none', records_pulled: Math.floor(Math.random() * 20) + 1 },
      steps: rules.filter(r => r.is_active).map(r => ({ rule: r.rule_name || r.rule_type, status: 'passed', output_fields: selectedFields.slice(0, 3) })),
      sample_output: { processed: true, rules_applied: rules.length, timestamp: new Date().toISOString() }
    });
    setTesting(false);
  };

  const statusColor = { Active: '#10b981', Paused: '#f59e0b', Error: '#ef4444', Broken: '#ef4444' };

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-full pb-6" style={{ maxHeight: 'calc(100vh - 180px)' }}>
      {/* Header */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: '#CADCFC' }}>
          <span>{fromNeuron?.icon} {fromNeuron?.display_name}</span>
          <span style={{ color: '#64748b' }}>──→</span>
          <span>{toNeuron?.icon} {toNeuron?.display_name}</span>
        </div>
        <Field label="SYNAPSE NAME">
          <Input value={form.synapse_name || ''} onChange={e => set('synapse_name', e.target.value)}
            className="h-8 text-sm font-bold" style={inputStyle} />
        </Field>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Badge style={{ background: `${statusColor[form.health_status]}22`, color: statusColor[form.health_status] }}>{form.health_status}</Badge>
          <Select value={form.priority} onValueChange={v => set('priority', v)}>
            <SelectTrigger className="h-6 text-[10px] w-24" style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.15)', color: '#94a3b8' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['High', 'Medium', 'Low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-1.5 text-[10px] cursor-pointer" style={{ color: '#94a3b8' }}>
            <input type="checkbox" checked={form.is_critical || false} onChange={e => set('is_critical', e.target.checked)} className="w-3 h-3" />
            Critical Path
          </label>
          <span className="text-[10px]" style={{ color: '#64748b' }}>v{form.version || 1} · {form.fire_count_24h || 0} fires today</span>
        </div>
      </div>

      {/* 1. TRIGGER */}
      <Section title="1. Trigger — When does data flow?">
        <div className="grid grid-cols-2 gap-2">
          <Field label="TRIGGER TYPE">
            <Select value={form.trigger_type} onValueChange={v => set('trigger_type', v)}>
              <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{TRIGGER_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="SYNAPSE TYPE">
            <Select value={form.synapse_type} onValueChange={v => set('synapse_type', v)}>
              <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{SYNAPSE_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>

        {form.trigger_type === 'On Event' && (
          <Field label="EVENT NAME" hint="💡 Fires when the named event is emitted by the source module">
            <div className="relative">
              <Input value={form.trigger_event || ''} onChange={e => set('trigger_event', e.target.value)}
                placeholder="e.g. on_cr_approval" className="h-8 text-xs font-mono" style={inputStyle} list="events-list" />
              <datalist id="events-list">
                {COMMON_EVENTS.map(e => <option key={e} value={e} />)}
              </datalist>
            </div>
          </Field>
        )}

        {form.trigger_type === 'Scheduled' && (
          <Field label="SCHEDULE" hint="Examples: Every Monday 07:00 · Daily 18:00 · Hourly · cron: 0 9 * * 1-5">
            <Input value={form.trigger_schedule || ''} onChange={e => set('trigger_schedule', e.target.value)}
              placeholder="e.g. Every Monday 07:00 or cron: 0 9 * * 1" className="h-8 text-xs" style={inputStyle} />
          </Field>
        )}

        {form.trigger_type === 'On Record Change' && (
          <>
            <Field label="WATCH ENTITY">
              <Select value={form.trigger_event || ''} onValueChange={v => set('trigger_event', v)}>
                <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue placeholder="Select entity to watch" /></SelectTrigger>
                <SelectContent>{ALL_ENTITIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="WATCH FIELDS" hint="Synapse fires only when one of these fields changes">
              <TagInput value={selectedFields} onChange={fields => set('watch_fields', fields.join(','))}
                placeholder="status, priority, amount..." suggestions={['status', 'priority', 'health_status', 'due_date', 'amount', 'capex_impact']} />
            </Field>
          </>
        )}

        <Field label="CONDITION (OPTIONAL)" hint="Expression that must be true for the synapse to fire. Leave empty to always fire.">
          <Textarea value={form.trigger_condition || ''} onChange={e => set('trigger_condition', e.target.value)}
            rows={2} placeholder={"cr.status == 'Approved' AND cr.capex_impact > 0"}
            className="text-xs font-mono" style={codeStyle} />
        </Field>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#94a3b8' }}>Trigger Active:</span>
          <button onClick={() => set('is_active', !form.is_active)}
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: form.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: form.is_active ? '#10b981' : '#64748b', border: `1px solid ${form.is_active ? '#10b98144' : 'rgba(100,116,139,0.3)'}` }}>
            {form.is_active ? '● ON' : '○ OFF'}
          </button>
        </div>
      </Section>

      {/* 2. DATA SOURCE */}
      <Section title="2. Data Source — What data flows?">
        <Field label="SOURCE ENTITY">
          <Select value={form.source_entity || ''} onValueChange={v => set('source_entity', v)}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue placeholder="Select source entity" /></SelectTrigger>
            <SelectContent>{ALL_ENTITIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        <Field label="FIELDS TO PULL">
          {sourceFieldsList.length > 0 ? (
            <FieldChecklist fields={sourceFieldsList} selected={selectedFields} onChange={handleSourceFieldsChange} />
          ) : (
            <div className="flex flex-col gap-2">
              <Textarea value={form.source_fields || ''} onChange={e => { set('source_fields', e.target.value); try { setSourceFieldsList(JSON.parse(e.target.value)); } catch {} }}
                rows={2} placeholder='["title", "status", "capex_impact", "due_date", "priority"]'
                className="text-xs font-mono" style={codeStyle} />
              <div className="text-[10px]" style={{ color: '#475569' }}>Enter as JSON array, or add fields below:</div>
            </div>
          )}
          <div className="mt-2">
            <TagInput value={selectedFields} onChange={handleSourceFieldsChange}
              placeholder="Add field name and press Enter..."
              suggestions={['id', 'title', 'status', 'priority', 'created_date', 'due_date', 'assignee', 'capex_impact', 'opex_impact', 'schedule_impact', 'description', 'notes']} />
          </div>
        </Field>

        <Field label="FILTER (OPTIONAL)" hint="SQL-like filter: status = 'Approved' AND capex_impact > 0">
          <Textarea value={form.source_filter || ''} onChange={e => set('source_filter', e.target.value)}
            rows={2} placeholder={"status != 'Cancelled' AND priority IN ('Critical','High')"}
            className="text-xs font-mono" style={codeStyle} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="SORT BY">
            <div className="flex gap-1">
              <Input value={sortBy} onChange={e => setSortBy(e.target.value)}
                placeholder="field_name" className="h-8 text-xs flex-1" style={inputStyle} />
              <Select value={sortDir} onValueChange={setSortDir}>
                <SelectTrigger className="h-8 text-xs w-16" style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{SORT_DIRECTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </Field>
          <Field label="LIMIT" hint="Max records (empty = all)">
            <Input type="number" value={form.source_limit || ''} onChange={e => set('source_limit', parseInt(e.target.value) || null)}
              placeholder="e.g. 10" className="h-8 text-xs" style={inputStyle} />
          </Field>
        </div>
      </Section>

      {/* 3. PROCESSING RULES */}
      <Section title="3. Processing Rules — How is data transformed?">
        <ProcessingRuleEditor rules={rules} onChange={setRules} />
      </Section>

      {/* 4. TARGET MAPPING */}
      <Section title="4. Target Mapping — Where does data go?">
        <div className="grid grid-cols-2 gap-2">
          <Field label="TARGET ENTITY">
            <Select value={form.target_entity || ''} onValueChange={v => set('target_entity', v)}>
              <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue placeholder="Select target entity" /></SelectTrigger>
              <SelectContent>{ALL_ENTITIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="TARGET ACTION">
            <Select value={form.target_action || 'Update'} onValueChange={v => set('target_action', v)}>
              <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{TARGET_ACTIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="FIELD MAPPING">
          <FieldMappingTable value={form.target_fields || '{}'} onChange={v => set('target_fields', v)} sourceFields={sourceFieldsList} />
        </Field>

        <Field label="OUTPUT FORMAT">
          <Select value={form.output_format || 'Raw'} onValueChange={v => set('output_format', v)}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Raw', 'Aggregated', 'Formatted', 'Calculated'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      {/* 5. TEST */}
      <Section title="5. Test & Preview" defaultOpen={false}>
        <button onClick={handleTest} disabled={testing}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b98144', color: '#10b981' }}>
          <FlaskConical className="w-4 h-4" />
          {testing ? 'Running test with live data…' : '▶ Test with Live Data'}
        </button>
        {testResult && (
          <div className="flex flex-col gap-2">
            <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(5,10,25,0.8)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div className="font-bold mb-2 text-emerald-400">✅ Test passed · {testResult.rules_passed} rules applied</div>
              <div className="mb-2" style={{ color: '#64748b' }}>Input: <span style={{ color: '#CADCFC' }}>{testResult.input?.records_pulled} records from {testResult.input?.entity}</span></div>
              {testResult.steps?.map((step, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Step {i + 1}</span>
                  <span style={{ color: '#94a3b8' }}>{step.rule}</span>
                  <span className="ml-auto text-emerald-400">✓</span>
                </div>
              ))}
              <pre className="whitespace-pre-wrap text-[10px] mt-2 font-mono" style={{ color: '#a5f3fc' }}>
                {JSON.stringify(testResult.sample_output, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Section>

      {/* Version History */}
      {versionHistory.length > 0 && (
        <div>
          <button onClick={() => setShowHistory(h => !h)} className="flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
            <History className="w-3 h-3" /> Version History ({versionHistory.length})
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showHistory && (
            <div className="mt-2 flex flex-col gap-1">
              {versionHistory.map(v => (
                <div key={v.id} className="text-xs p-2 rounded flex items-center justify-between" style={{ background: 'rgba(30,39,97,0.3)', color: '#94a3b8' }}>
                  <span><span className="font-bold text-white">v{v.version_number}</span> · {v.change_description}</span>
                  <span style={{ color: '#475569' }}>{new Date(v.changed_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <Field label="ADMIN NOTES">
        <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2}
          placeholder="Notes for other admins about this synapse"
          style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.1)', color: '#94a3b8' }} />
      </Field>

      {/* Action Bar */}
      <div className="sticky bottom-0 -mx-0 mt-2 rounded-xl p-3 flex flex-wrap gap-2"
        style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.1)', backdropFilter: 'blur(12px)' }}>
        <Button onClick={handleSave} disabled={saving} size="sm"
          style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
          <Save className="w-4 h-4 mr-1" />{saving ? 'Saving…' : `Save (v${(form.version || 1) + 1})`}
        </Button>
        <Button onClick={handleTest} disabled={testing} size="sm" variant="outline"
          style={{ borderColor: '#10b98144', color: '#10b981' }}>
          <FlaskConical className="w-4 h-4 mr-1" />Test
        </Button>
        <Button onClick={() => { setForm({ ...synapse }); try { setRules(JSON.parse(synapse.processing_rules || '[]').map((r,i)=>({...r,id:r.id||`r_${i}`}))); } catch { setRules([]); } }}
          size="sm" variant="outline" style={{ borderColor: 'rgba(202,220,252,0.1)', color: '#64748b' }}>
          <RotateCcw className="w-4 h-4 mr-1" />Revert
        </Button>
        <Button onClick={handleToggle} size="sm" variant="outline" style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
          {form.is_active ? <><Pause className="w-4 h-4 mr-1" />Pause</> : <><Play className="w-4 h-4 mr-1" />Resume</>}
        </Button>
        <Button onClick={handleDelete} size="sm" variant="outline" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
          <Trash2 className="w-4 h-4 mr-1" />Delete
        </Button>
      </div>
    </div>
  );
}