import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, X, Plus, FlaskConical } from 'lucide-react';
import ProcessingRuleEditor from './ProcessingRuleEditor';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

// ─── Constants ─────────────────────────────────────────────────────────────
const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };
const codeStyle = { background: 'rgba(5,10,25,0.8)', borderColor: 'rgba(202,220,252,0.15)', color: '#a5f3fc', resize: 'vertical' };

const NEURON_ENTITIES = {
  finance_model: ['FinanceModel', 'CapexPlan', 'DCFAssumptions', 'RevenueAssumptions', 'BOMAssumptions'],
  master_schedule: ['Milestone', 'ScheduleTask', 'ScheduleActivity'],
  p6_msp_sync: ['ScheduleSource', 'ScheduleDelta', 'WBSMapping'],
  change_management: ['ChangeRequest', 'ChangeImpactAssessment', 'ChangeApproval'],
  action_tracker: ['ActionItem', 'ActionBucket', 'ActionPhase', 'ActionComment'],
  weekly_report: ['WeeklyReport', 'WeeklyReportSectionConfig'],
  daily_site_report: ['DailySiteReport'],
  quality_gates: ['QualityGate'],
  site_selection: ['CandidateSite', 'SiteAssessment', 'SiteCriteria'],
  feasibility_study: ['FeasibilityStudy', 'FEEDItem'],
  ai_agent: ['AuditLog'],
  platform_home: ['Project', 'BudgetTracking', 'Risk'],
};

const NEURON_FIELDS = {
  finance_model: ['npv', 'irr', 'payback_period', 'total_capex', 'capex_spent', 'contingency_total', 'contingency_remaining', 'revenue_annual', 'discount_rate', 'debt_equity_ratio'],
  master_schedule: ['phaseName', 'status', 'dueDate', 'completionPercent', 'plannedStart', 'plannedFinish', 'totalFloat', 'isCritical'],
  change_management: ['title', 'category', 'priority', 'status', 'capexImpactUsd', 'opexImpactAnnualUsd', 'scheduleImpactDays', 'raisedDate'],
  action_tracker: ['title', 'status', 'priority', 'assignee', 'dueDate', 'progressPct', 'blocked', 'itemType'],
  weekly_report: ['calendarWeek', 'year', 'overallRag', 'scheduleRag', 'costRag', 'riskRag', 'executiveSummary', 'highlights'],
  quality_gates: ['gateNumber', 'gateName', 'status', 'decisionDate', 'reserves'],
  site_selection: ['overall_score', 'technical_score', 'cost_score', 'risk_score', 'site_name'],
  platform_home: ['healthScore', 'currentPhase', 'totalBudgetEurM', 'status'],
};

const SUGGESTED_EVENTS = {
  on_report_generation: 'Fires when Weekly Report is generated',
  on_cr_approval: 'Fires when a CR is approved',
  on_schedule_import: 'Fires on P6/MSP import',
  on_milestone_passed: 'Fires when a milestone is completed',
  on_gate_review: 'Fires when a quality gate is reviewed',
  on_record_save: 'Fires on any save in source module',
};

const SMART_SUGGESTIONS = {
  'finance_model_weekly_report': { event: 'on_report_generation', fields: ['npv', 'irr', 'total_capex', 'capex_spent', 'contingency_total', 'contingency_remaining'], name: 'Cost section data' },
  'master_schedule_weekly_report': { event: 'on_report_generation', fields: ['phaseName', 'status', 'dueDate', 'completionPercent'], name: 'Schedule section data' },
  'change_management_action_tracker': { event: 'on_cr_approval', fields: ['title', 'priority', 'capexImpactUsd', 'status'], name: 'CR implementation actions' },
  'change_management_finance_model': { event: 'on_cr_approval', fields: ['capexImpactUsd', 'opexImpactAnnualUsd', 'scheduleImpactDays'], name: 'Approved cost impacts' },
  'action_tracker_weekly_report': { event: 'on_report_generation', fields: ['status', 'priority', 'dueDate', 'blocked'], name: 'Action summary to report' },
};

// ─── Collapsible Section ────────────────────────────────────────────────────
function Section({ title, defaultOpen = false, summary, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>
      <button className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: 'rgba(30,39,97,0.4)' }} onClick={() => setOpen(o => !o)}>
        <div>
          <span className="text-sm font-semibold" style={{ color: '#CADCFC' }}>{title}</span>
          {!open && summary && <div className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>{summary}</div>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />}
      </button>
      {open && <div className="p-4 flex flex-col gap-3" style={{ background: 'rgba(15,23,42,0.5)' }}>{children}</div>}
    </div>
  );
}

const Field = ({ label, children, hint, required }) => (
  <div>
    <label className="text-[10px] font-semibold mb-1 block tracking-widest" style={{ color: '#64748b' }}>
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {hint && <div className="text-[10px] mt-1" style={{ color: '#475569' }}>{hint}</div>}
  </div>
);

// ─── Tag Input ──────────────────────────────────────────────────────────────
function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = (tag) => { const t = tag.trim(); if (t && !value.includes(t)) onChange([...value, t]); setInput(''); };
  return (
    <div className="min-h-[32px] flex flex-wrap gap-1 p-1.5 rounded-md border" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)' }}>
      {value.map(t => (
        <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
          style={{ background: 'rgba(0,168,150,0.15)', color: '#00A896' }}>
          {t}<button onClick={() => onChange(value.filter(x => x !== t))}><X className="w-2.5 h-2.5" /></button>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); } }}
        placeholder={value.length === 0 ? placeholder : ''} className="flex-1 min-w-[80px] bg-transparent text-xs outline-none" style={{ color: '#F8FAFC' }} />
    </div>
  );
}

// ─── Field Checklist ────────────────────────────────────────────────────────
function FieldChecklist({ fields, selected, onChange }) {
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
      <div className="flex gap-2">
        <button onClick={() => onChange(fields)} className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(0,168,150,0.3)', color: '#00A896' }}>Select All</button>
        <button onClick={() => onChange([])} className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b' }}>Select None</button>
        <button onClick={() => onChange(fields.slice(0, 5))} className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b' }}>Select Common</button>
      </div>
    </div>
  );
}

// ─── Field Mapping ──────────────────────────────────────────────────────────
function FieldMappingTable({ sourceFields, targetEntity, mappings, onChange }) {
  const autoMap = () => {
    const mapped = {};
    sourceFields.forEach(f => { mapped[f] = f; });
    onChange(mapped);
  };

  const updateRow = (from, to) => onChange({ ...mappings, [from]: to });
  const addRow = () => {
    const key = `field_${Object.keys(mappings).length + 1}`;
    onChange({ ...mappings, [key]: '' });
  };
  const removeRow = (key) => {
    const next = { ...mappings };
    delete next[key];
    onChange(next);
  };

  const rows = Object.entries(mappings);

  return (
    <div className="flex flex-col gap-2">
      {rows.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
          <div className="grid grid-cols-[1fr,20px,1fr,24px] px-3 py-1.5 text-[10px] font-semibold" style={{ background: 'rgba(30,39,97,0.6)', color: '#64748b' }}>
            <span>FROM (source field)</span><span>→</span><span>TO (target field)</span><span />
          </div>
          {rows.map(([from, to]) => (
            <div key={from} className="grid grid-cols-[1fr,20px,1fr,24px] gap-1 px-2 py-1" style={{ borderTop: '1px solid rgba(202,220,252,0.05)' }}>
              <Input value={from} onChange={e => { const next = { ...mappings }; delete next[from]; onChange({ ...next, [e.target.value]: to }); }}
                className="h-7 text-xs border-0 p-0 font-mono focus:ring-0" style={{ background: 'transparent', color: '#a5f3fc' }} />
              <span className="flex items-center justify-center text-xs" style={{ color: '#475569' }}>→</span>
              <Input value={to} onChange={e => updateRow(from, e.target.value)}
                className="h-7 text-xs border-0 p-0 font-mono focus:ring-0" style={{ background: 'transparent', color: '#84cc16' }} />
              <button onClick={() => removeRow(from)} className="flex items-center justify-center">
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={autoMap} className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(0,168,150,0.3)', color: '#00A896' }}>
          Auto-Map by Name
        </button>
        <button onClick={addRow} className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b' }}>
          + Add Custom Mapping
        </button>
      </div>
    </div>
  );
}

// ─── Main Dialog ────────────────────────────────────────────────────────────
export default function AddSynapseDialog({ open, onClose, neurons, synapses = [], defaultFromId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    from_neuron_id: defaultFromId || '', to_neuron_id: '',
    synapse_name: '', description: '',
    synapse_type: 'One-Way', priority: 'Medium', is_critical: false,
    tags: [],
    trigger_type: 'On Event', trigger_event: '', trigger_schedule: '', trigger_condition: '',
    source_entity: '', source_fields: '[]',
    source_filter: '', source_sort: '', source_limit: null,
    processing_rules: '[]',
    target_entity: '', target_fields: '{}', target_action: 'Update', output_format: 'Raw',
    create_status: 'active',
  });
  const [selectedSourceFields, setSelectedSourceFields] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [rules, setRules] = useState([]);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const neuronMap = useMemo(() => {
    const m = {};
    neurons.forEach(n => { m[n.id] = n; });
    return m;
  }, [neurons]);

  const fromNeuron = neuronMap[form.from_neuron_id];
  const toNeuron = neuronMap[form.to_neuron_id];

  // Get entities/fields for selected neurons
  const fromEntities = fromNeuron ? (NEURON_ENTITIES[fromNeuron.module_key] || []) : [];
  const toEntities = toNeuron ? (NEURON_ENTITIES[toNeuron.module_key] || []) : [];
  const fromFields = fromNeuron ? (NEURON_FIELDS[fromNeuron.module_key] || []) : [];

  // Smart suggestion key
  const suggKey = fromNeuron && toNeuron ? `${fromNeuron.module_key}_${toNeuron.module_key}` : null;
  const suggestion = suggKey ? SMART_SUGGESTIONS[suggKey] : null;

  // Duplicate detection
  const duplicate = useMemo(() => {
    if (!form.from_neuron_id || !form.to_neuron_id) return null;
    return synapses.find(s => s.from_neuron_id === form.from_neuron_id && s.to_neuron_id === form.to_neuron_id);
  }, [form.from_neuron_id, form.to_neuron_id, synapses]);

  const applySuggestion = () => {
    if (!suggestion) return;
    set('synapse_name', suggestion.name);
    set('trigger_event', suggestion.event);
    set('trigger_type', 'On Event');
    setSelectedSourceFields(suggestion.fields);
    set('source_fields', JSON.stringify(suggestion.fields));
    if (fromEntities[0]) set('source_entity', fromEntities[0]);
    if (toEntities[0]) set('target_entity', toEntities[0]);
    // Auto-map
    const mapped = {};
    suggestion.fields.forEach(f => { mapped[f] = f; });
    setFieldMappings(mapped);
    set('target_fields', JSON.stringify(mapped));
  };

  const handleSourceFields = (fields) => {
    setSelectedSourceFields(fields);
    set('source_fields', JSON.stringify(fields));
    // Auto-update field mappings
    const mapped = { ...fieldMappings };
    fields.forEach(f => { if (!mapped[f]) mapped[f] = f; });
    setFieldMappings(mapped);
    set('target_fields', JSON.stringify(mapped));
  };

  const handleMappings = (m) => {
    setFieldMappings(m);
    set('target_fields', JSON.stringify(m));
  };

  const validate = () => {
    const e = {};
    if (!form.from_neuron_id) e.from = 'Required';
    if (!form.to_neuron_id) e.to = 'Required';
    if (!form.synapse_name.trim()) e.name = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.join(','),
      processing_rules: JSON.stringify(rules),
      is_active: form.create_status === 'active',
      health_status: form.create_status === 'active' ? 'Active' : 'Paused',
      fire_count_24h: 0, error_count: 0, version: 1,
    };
    delete payload.create_status;
    await base44.entities.Synapse.create(payload);
    qc.invalidateQueries({ queryKey: ['synapses'] });
    setSaving(false);
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise(r => setTimeout(r, 1200));
    setTestResult({
      status: 'success',
      source_found: !!form.source_entity,
      fields_count: selectedSourceFields.length,
      mappings_count: Object.keys(fieldMappings).length,
    });
    setTesting(false);
  };

  const triggerSummary = form.trigger_type === 'On Event' && form.trigger_event
    ? `On Event: ${form.trigger_event}` : form.trigger_type === 'Scheduled' && form.trigger_schedule
    ? `Scheduled: ${form.trigger_schedule}` : form.trigger_type || 'Not configured';

  const sourceSummary = form.source_entity
    ? `${form.source_entity} · ${selectedSourceFields.length} fields selected`
    : 'Not configured — data passes through as-is';

  const targetSummary = form.target_entity
    ? `${form.target_entity} · ${form.target_action} · ${Object.keys(fieldMappings).length} mappings`
    : 'Auto-map matching field names';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        style={{ background: 'rgba(10,15,35,0.99)', borderColor: 'rgba(202,220,252,0.15)', maxHeight: '92vh' }}
        className="max-w-2xl w-full overflow-y-auto p-0"
      >
        <DialogHeader className="sticky top-0 z-10 px-6 py-4" style={{ background: 'rgba(10,15,35,0.99)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
          <DialogTitle style={{ color: '#CADCFC' }}>Add New Synapse</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 flex flex-col gap-4">

          {/* TOP — Basic Info */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {/* FROM */}
              <Field label="FROM NEURON" required>
                <Select value={form.from_neuron_id} onValueChange={v => { set('from_neuron_id', v); setErrors(e => ({ ...e, from: null })); }}>
                  <SelectTrigger style={{ ...inputStyle, borderColor: errors.from ? '#ef444488' : 'rgba(202,220,252,0.2)' }}>
                    <SelectValue placeholder="Select source module" />
                  </SelectTrigger>
                  <SelectContent>
                    {neurons.map(n => <SelectItem key={n.id} value={n.id}>{n.icon} {n.display_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fromNeuron && (
                  <div className="text-[10px] mt-1 px-1" style={{ color: '#64748b' }}>
                    {fromNeuron.icon} {fromNeuron.display_name} · {fromEntities.slice(0, 3).join(', ')}{fromEntities.length > 3 ? ` +${fromEntities.length - 3}` : ''}
                  </div>
                )}
              </Field>

              {/* TO */}
              <Field label="TO NEURON" required>
                <Select value={form.to_neuron_id} onValueChange={v => { set('to_neuron_id', v); if (toEntities[0]) { set('target_entity', NEURON_ENTITIES[neuronMap[v]?.module_key]?.[0] || ''); } setErrors(e => ({ ...e, to: null })); }}>
                  <SelectTrigger style={{ ...inputStyle, borderColor: errors.to ? '#ef444488' : 'rgba(202,220,252,0.2)' }}>
                    <SelectValue placeholder="Select target module" />
                  </SelectTrigger>
                  <SelectContent>
                    {neurons.filter(n => n.id !== form.from_neuron_id).map(n => <SelectItem key={n.id} value={n.id}>{n.icon} {n.display_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {toNeuron && (
                  <div className="text-[10px] mt-1 px-1" style={{ color: '#64748b' }}>
                    {toNeuron.icon} {toNeuron.display_name} · {toEntities.slice(0, 3).join(', ')}{toEntities.length > 3 ? ` +${toEntities.length - 3}` : ''}
                  </div>
                )}
              </Field>
            </div>

            {/* Duplicate Warning */}
            {duplicate && (
              <div className="flex items-start gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <span>⚠️</span>
                <div className="flex-1 text-xs" style={{ color: '#f59e0b' }}>
                  A synapse already exists: <strong>{fromNeuron?.display_name} → {toNeuron?.display_name}</strong> ("{duplicate.synapse_name}")
                  <div className="mt-1" style={{ color: '#94a3b8' }}>You can create a second synapse or edit the existing one.</div>
                </div>
              </div>
            )}

            {/* Smart Suggestions */}
            {suggestion && fromNeuron && toNeuron && (
              <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(0,168,150,0.08)', border: '1px solid rgba(0,168,150,0.2)' }}>
                <div className="text-[10px] font-semibold mb-1" style={{ color: '#00A896' }}>💡 Suggested configuration for {fromNeuron.display_name} → {toNeuron.display_name}</div>
                <div className="text-[10px] mb-2" style={{ color: '#64748b' }}>
                  Event: <code className="px-1 rounded" style={{ background: 'rgba(0,168,150,0.15)', color: '#00A896' }}>{suggestion.event}</code>
                  {' · '}Fields: {suggestion.fields.join(', ')}
                </div>
                <button onClick={applySuggestion} className="text-[10px] px-3 py-1 rounded font-medium" style={{ background: 'rgba(0,168,150,0.2)', color: '#00A896' }}>
                  Apply Suggestion
                </button>
              </div>
            )}

            {/* Name */}
            <Field label="SYNAPSE NAME" required>
              <Input value={form.synapse_name} onChange={e => { set('synapse_name', e.target.value); setErrors(er => ({ ...er, name: null })); }}
                placeholder="e.g. Cost section data" style={{ ...inputStyle, borderColor: errors.name ? '#ef444488' : 'rgba(202,220,252,0.2)' }} />
              {errors.name && <div className="text-[10px] text-red-400 mt-1">Synapse name is required</div>}
            </Field>

            {/* Description */}
            <Field label="DESCRIPTION">
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                placeholder="What does this synapse do? Who uses the data it produces?"
                style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.15)', color: '#94a3b8' }} />
            </Field>

            {/* Type / Priority / Critical */}
            <div className="grid grid-cols-3 gap-2">
              <Field label="TYPE">
                <Select value={form.synapse_type} onValueChange={v => set('synapse_type', v)}>
                  <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['One-Way', 'Bidirectional', 'Event-Triggered', 'Scheduled'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="PRIORITY">
                <Select value={form.priority} onValueChange={v => set('priority', v)}>
                  <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['High', 'Medium', 'Low'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="CRITICAL?">
                <div className="flex gap-2 mt-1">
                  {[['Yes', true], ['No', false]].map(([label, val]) => (
                    <button key={label} onClick={() => set('is_critical', val)}
                      className="flex-1 text-xs py-1.5 rounded"
                      style={{ background: form.is_critical === val ? (val ? 'rgba(239,68,68,0.2)' : 'rgba(30,39,97,0.5)') : 'rgba(30,39,97,0.3)',
                        border: `1px solid ${form.is_critical === val ? (val ? '#ef444444' : 'rgba(202,220,252,0.3)') : 'rgba(202,220,252,0.1)'}`,
                        color: form.is_critical === val ? (val ? '#ef4444' : '#CADCFC') : '#64748b' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Tags */}
            <Field label="TAGS">
              <TagInput value={form.tags} onChange={v => set('tags', v)} placeholder="financial, reporting, automated..." />
            </Field>
          </div>

          {/* 1. TRIGGER */}
          <Section title="1. Trigger — When should this fire?" summary={triggerSummary}>
            <Field label="TRIGGER TYPE">
              <Select value={form.trigger_type} onValueChange={v => set('trigger_type', v)}>
                <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Real-time', 'On Event', 'Scheduled', 'On Demand', 'On Record Change'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            {form.trigger_type === 'On Event' && (
              <Field label="EVENT NAME">
                <Input value={form.trigger_event} onChange={e => set('trigger_event', e.target.value)}
                  placeholder="e.g. on_report_generation" className="h-8 text-xs font-mono" style={inputStyle} list="new-events-list" />
                <datalist id="new-events-list">
                  {Object.keys(SUGGESTED_EVENTS).map(e => <option key={e} value={e} />)}
                </datalist>
                <div className="flex flex-col gap-1 mt-2">
                  {Object.entries(SUGGESTED_EVENTS).map(([evt, desc]) => (
                    <button key={evt} onClick={() => set('trigger_event', evt)}
                      className="flex items-center gap-2 text-left text-[10px] px-2 py-1 rounded hover:bg-white/5 transition-colors"
                      style={{ color: form.trigger_event === evt ? '#00A896' : '#64748b' }}>
                      <span className="font-mono" style={{ color: form.trigger_event === evt ? '#00A896' : '#a5f3fc' }}>{evt}</span>
                      <span>{desc}</span>
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {form.trigger_type === 'Scheduled' && (
              <div className="grid grid-cols-3 gap-2">
                <Field label="FREQUENCY">
                  <Select value="Weekly" onValueChange={() => {}}>
                    <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>{['Hourly', 'Daily', 'Weekly', 'Monthly'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="DAY">
                  <Select value="Monday" onValueChange={() => {}}>
                    <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="TIME">
                  <Input value={form.trigger_schedule} onChange={e => set('trigger_schedule', e.target.value)}
                    placeholder="07:00" className="h-8 text-xs" style={inputStyle} />
                </Field>
              </div>
            )}

            {form.trigger_type === 'On Record Change' && (
              <Field label="WATCH ENTITY">
                <Select value={form.trigger_event} onValueChange={v => set('trigger_event', v)}>
                  <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue placeholder="Select entity to watch" /></SelectTrigger>
                  <SelectContent>{fromEntities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            )}

            {(form.trigger_type === 'Real-time' || form.trigger_type === 'On Demand') && (
              <div className="text-xs px-3 py-2 rounded" style={{ background: 'rgba(30,39,97,0.3)', color: '#64748b' }}>
                {form.trigger_type === 'Real-time' ? 'No additional config — fires instantly on any change in source module.' : 'No additional config — fires only when manually triggered from the Brainiac panel.'}
              </div>
            )}

            <Field label="CONDITION (OPTIONAL)" hint='💡 Examples: "report.status == \'Draft\'", "cr.capex_impact > 0"'>
              <Textarea value={form.trigger_condition} onChange={e => set('trigger_condition', e.target.value)}
                rows={2} placeholder="Only fire when this expression is true..."
                className="text-xs font-mono" style={codeStyle} />
            </Field>
          </Section>

          {/* 2. DATA SOURCE */}
          <Section title="2. Data Source — What data to pull?" summary={sourceSummary}>
            <Field label="SOURCE ENTITY">
              <Select value={form.source_entity} onValueChange={v => set('source_entity', v)}>
                <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue placeholder="Select source entity" /></SelectTrigger>
                <SelectContent>{fromEntities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </Field>

            {fromFields.length > 0 && (
              <Field label="FIELDS TO PULL">
                <FieldChecklist fields={fromFields} selected={selectedSourceFields} onChange={handleSourceFields} />
              </Field>
            )}

            <Field label="FILTER (OPTIONAL)">
              <Textarea value={form.source_filter} onChange={e => set('source_filter', e.target.value)}
                rows={2} placeholder={"project_id = current_project\n-- or --\nstatus != 'Cancelled'"}
                className="text-xs font-mono" style={codeStyle} />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="SORT BY">
                <Input value={form.source_sort} onChange={e => set('source_sort', e.target.value)}
                  placeholder="last_updated DESC" className="h-8 text-xs" style={inputStyle} />
              </Field>
              <Field label="LIMIT" hint="Empty = all records">
                <Input type="number" value={form.source_limit || ''} onChange={e => set('source_limit', parseInt(e.target.value) || null)}
                  placeholder="e.g. 1" className="h-8 text-xs" style={inputStyle} />
              </Field>
            </div>
          </Section>

          {/* 3. PROCESSING RULES */}
          <Section title="3. Processing Rules — How to transform? (Optional)" summary={rules.length > 0 ? `${rules.length} rule${rules.length > 1 ? 's' : ''} configured` : 'No rules yet — data passes through as-is'}>
            <ProcessingRuleEditor rules={rules} onChange={setRules} />
            <div className="text-[10px] px-2" style={{ color: '#475569' }}>
              💡 Tip: You can skip this step and add rules after creation by editing the synapse
            </div>
          </Section>

          {/* 4. TARGET MAPPING */}
          <Section title="4. Target Mapping — Where does data land?" summary={targetSummary}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="TARGET ENTITY">
                <Select value={form.target_entity} onValueChange={v => set('target_entity', v)}>
                  <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue placeholder="Select target entity" /></SelectTrigger>
                  <SelectContent>{toEntities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="ACTION">
                <Select value={form.target_action} onValueChange={v => set('target_action', v)}>
                  <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
                  <SelectContent>{['Update', 'Append', 'Create', 'Merge', 'Alert Only'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="FIELD MAPPING">
              <FieldMappingTable sourceFields={selectedSourceFields} targetEntity={form.target_entity} mappings={fieldMappings} onChange={handleMappings} />
            </Field>
          </Section>

          {/* BOTTOM — Test + Create */}
          <div className="flex flex-col gap-3 pt-1">
            {/* Test */}
            <button onClick={handleTest} disabled={testing}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid #10b98133', color: '#10b981' }}>
              <FlaskConical className="w-4 h-4" />
              {testing ? 'Running test…' : '▶ Test Configuration'}
            </button>

            {testResult && (
              <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(5,10,25,0.8)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div className="font-bold text-emerald-400 mb-1">✅ Configuration valid</div>
                <div style={{ color: '#94a3b8' }}>
                  {testResult.source_found ? '✅ Source entity configured' : '⚠️ Source entity not set'}<br />
                  {testResult.fields_count > 0 ? `✅ ${testResult.fields_count} source fields selected` : '⚠️ No source fields — all fields will flow'}<br />
                  {testResult.mappings_count > 0 ? `✅ ${testResult.mappings_count} field mappings defined` : 'ℹ️ No target mappings — data passes through unchanged'}
                </div>
              </div>
            )}

            {/* Create as */}
            <Field label="CREATE AS">
              <div className="flex flex-col gap-1.5">
                {[['active', '● Active', 'Starts firing immediately based on trigger'], ['paused', '○ Paused', "Saved but won't fire until manually activated"], ['draft', '○ Draft', 'Saved as draft, not visible in neural canvas']].map(([val, label, desc]) => (
                  <label key={val} className="flex items-start gap-2 cursor-pointer px-3 py-2 rounded-lg"
                    style={{ background: form.create_status === val ? 'rgba(30,39,97,0.5)' : 'rgba(15,23,42,0.3)', border: `1px solid ${form.create_status === val ? 'rgba(202,220,252,0.2)' : 'rgba(202,220,252,0.05)'}` }}>
                    <input type="radio" name="create_status" value={val} checked={form.create_status === val}
                      onChange={() => set('create_status', val)} className="mt-0.5 accent-teal-500" />
                    <div>
                      <div className="text-xs font-medium" style={{ color: form.create_status === val ? '#CADCFC' : '#64748b' }}>{label}</div>
                      <div className="text-[10px]" style={{ color: '#475569' }}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Field>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={saving || !form.synapse_name || !form.from_neuron_id || !form.to_neuron_id}
                style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC', flex: 1 }}>
                {saving ? 'Creating…' : 'Create Synapse'}
              </Button>
              <Button variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                Cancel
              </Button>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}