import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Trash2, Pause, Play, History, FlaskConical, ChevronDown, ChevronUp, X, Plus, GripVertical } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };
const codeStyle = { background: 'rgba(5,10,25,0.8)', borderColor: 'rgba(202,220,252,0.15)', color: '#a5f3fc', resize: 'vertical', fontFamily: 'monospace' };

const ALL_ENTITIES = [
  'ChangeRequest','ChangeImpactAssessment','ChangeApproval',
  'ActionItem','ActionBucket','ActionPhase','ActionChecklist','ActionComment',
  'FinanceModel','CapexPlan','RevenueAssumptions','DCFAssumptions','BOMAssumptions',
  'WeeklyReport','WeeklyReportSectionConfig','DailySiteReport',
  'Milestone','QualityGate','Risk','QARecord','NonConformity',
  'ScheduleTask','ScheduleActivity','ScheduleSource','ScheduleVersion','ScheduleDelta',
  'Project','BudgetTracking','FeasibilityStudy','FEEDItem',
  'CandidateSite','SiteAssessment','SiteCriteria',
  'Neuron','Synapse','SynapseLog','SynapseVersion','ProcessingRule',
  'Organization','PlatformUser','PlatformRole','AuditLog',
];

const TRIGGER_TYPES = ['Real-time','On Event','Scheduled','On Demand','On Record Change'];
const SYNAPSE_TYPES = ['One-Way','Bidirectional','Event-Triggered','Scheduled'];
const SORT_DIRECTIONS = ['ASC','DESC'];
const TARGET_ACTIONS = ['Update','Append','Create','Merge','Alert Only'];
const RULE_TYPES = ['Formula','Filter','Aggregate','Transform','Conditional','Validate','Enrich','Lookup','Alert','Format'];
const COMMON_EVENTS = ['on_cr_approval','on_report_generation','on_schedule_import','on_risk_creation','on_gate_review','on_action_created','on_milestone_passed','on_budget_update'];

const RULE_COLORS = {
  Formula: '#f59e0b', Filter: '#3b82f6', Aggregate: '#8b5cf6',
  Transform: '#06b6d4', Conditional: '#f97316', Validate: '#10b981',
  Enrich: '#ec4899', Lookup: '#a78bfa', Alert: '#ef4444', Format: '#84cc16',
};

const RULE_PLACEHOLDERS = {
  Formula: 'budget_variance = total_capex - capex_spent;\nbudget_pct = ROUND((capex_spent / total_capex) * 100, 1)',
  Filter: "severity IN ('Critical', 'High') AND status = 'Open'",
  Aggregate: "COUNT(id) AS total_count;\nSUM(capex_impact) AS total_impact;\nGROUP BY priority",
  Transform: 'amount → currency(USD, 0);\ndate → format(DD MMM YYYY);\nstatus → map(Open=🔵, Done=🟢)',
  Conditional: "IF budget_pct <= 90 THEN cost_rag = 'Green';\nELIF budget_pct <= 100 THEN cost_rag = 'Amber';\nELSE cost_rag = 'Red'",
  Validate: "npv NOT NULL default 0;\ndue_date IS FUTURE;\nrag_status IN ('Green','Amber','Red')",
  Enrich: 'LOOKUP User WHERE id = assignee_id → ADD full_name, org_name',
  Lookup: 'LOOKUP QualityGate WHERE phase = current_phase → GET gate_date, readiness_pct',
  Alert: "WHEN contingency_pct < 50 THEN NOTIFY(Admin, PM) MESSAGE 'Contingency at {{contingency_pct}}%'",
  Format: "TEMPLATE 'Budget: ${{total_capex}} | Spent: ${{capex_spent}} ({{budget_pct}}%)'",
};

// ─── Helpers ──────────────────────────────────────────────────────────────
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

// ─── Rule Card ───────────────────────────────────────────────────────────
function RuleCard({ rule, index, total, onUpdate, onDelete, onMove }) {
  const [open, setOpen] = useState(false);
  const color = RULE_COLORS[rule.rule_type] || '#94a3b8';

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: `${color}33` }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: `${color}11` }}>
        <span className="text-[10px] font-bold w-5 text-center" style={{ color: '#64748b' }}>{rule.step_order}</span>
        <Badge className="text-[10px] px-1.5 py-0 h-5" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>{rule.rule_type}</Badge>
        <span className="flex-1 text-xs truncate font-medium" style={{ color: '#CADCFC' }}>{rule.rule_name || 'Untitled rule'}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(index, -1)} disabled={index === 0} className="p-0.5 opacity-50 hover:opacity-100 disabled:opacity-20">
            <ChevronUp className="w-3 h-3" style={{ color: '#94a3b8' }} />
          </button>
          <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="p-0.5 opacity-50 hover:opacity-100 disabled:opacity-20">
            <ChevronDown className="w-3 h-3" style={{ color: '#94a3b8' }} />
          </button>
          <button onClick={() => onUpdate({ ...rule, is_active: !rule.is_active })}
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: rule.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: rule.is_active ? '#10b981' : '#64748b' }}>
            {rule.is_active ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setOpen(o => !o)} className="p-0.5">
            {open ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#64748b' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#64748b' }} />}
          </button>
          <button onClick={() => onDelete(index)} className="p-0.5">
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
      {open && (
        <div className="p-3 flex flex-col gap-2" style={{ background: 'rgba(5,10,25,0.6)' }}>
          <div className="grid grid-cols-2 gap-2">
            <Field label="RULE TYPE">
              <Select value={rule.rule_type} onValueChange={v => onUpdate({ ...rule, rule_type: v })}>
                <SelectTrigger className="h-7 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{RULE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="RULE NAME">
              <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
                placeholder="e.g. Calculate budget variance" className="h-7 text-xs" style={inputStyle} />
            </Field>
          </div>
          <Field label="EXPRESSION">
            <Textarea value={rule.expression || ''} onChange={e => onUpdate({ ...rule, expression: e.target.value })}
              rows={4} placeholder={RULE_PLACEHOLDERS[rule.rule_type] || 'Enter rule logic...'}
              className="text-xs" style={codeStyle} />
          </Field>
          <Field label="OUTPUT FIELDS" hint="Comma-separated field names this rule produces">
            <Input value={rule.output_fields || ''} onChange={e => onUpdate({ ...rule, output_fields: e.target.value })}
              placeholder="e.g. budget_variance, cost_rag, formatted_summary" className="h-7 text-xs" style={inputStyle} />
          </Field>
          <Field label="DESCRIPTION">
            <Textarea value={rule.description || ''} onChange={e => onUpdate({ ...rule, description: e.target.value })}
              rows={2} placeholder="Plain English: what does this rule do?"
              style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.1)', color: '#94a3b8' }} />
          </Field>
        </div>
      )}
    </div>
  );
}

// ─── Field Mapping Textarea ───────────────────────────────────────────────
function FieldMappingTextarea({ value, onChange }) {
  // Convert JSON object to "key → value" per line
  const toText = (v) => {
    if (!v) return '';
    try {
      const obj = typeof v === 'string' ? JSON.parse(v) : v;
      return Object.entries(obj).map(([k, val]) => `${k} → ${val}`).join('\n');
    } catch { return typeof v === 'string' ? v : ''; }
  };

  const toJson = (text) => {
    const obj = {};
    text.split('\n').forEach(line => {
      const parts = line.split('→');
      if (parts.length === 2) {
        const k = parts[0].trim();
        const v = parts[1].trim();
        if (k) obj[k] = v;
      }
    });
    return JSON.stringify(obj);
  };

  const [text, setText] = useState(() => toText(value));

  useEffect(() => { setText(toText(value)); }, [value]);

  return (
    <Textarea
      value={text}
      onChange={e => { setText(e.target.value); onChange(toJson(e.target.value)); }}
      rows={6}
      placeholder={"npv → financial_npv\nirr → financial_irr\nbudget_pct → budget_percentage\ncost_rag → cost_rag_status"}
      className="text-xs"
      style={codeStyle}
    />
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function SynapseConfigurator({ synapse, neurons, onClose, onSaved, onDeleted }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [rules, setRules] = useState([]);       // local editing state for ProcessingRule records
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const neuronMap = {};
  neurons.forEach(n => { neuronMap[n.id] = n; });
  const fromNeuron = neuronMap[synapse.from_neuron_id];
  const toNeuron = neuronMap[synapse.to_neuron_id];

  // Load ProcessingRule records from DB
  const { data: dbRules = [], refetch: refetchRules } = useQuery({
    queryKey: ['processingRules', synapse.id],
    queryFn: () => base44.entities.ProcessingRule.filter({ synapse_id: synapse.id }, 'step_order'),
  });

  useEffect(() => {
    setForm({ ...synapse });
    base44.entities.SynapseVersion.filter({ synapse_id: synapse.id }, '-version_number', 10).then(setVersionHistory).catch(() => {});
  }, [synapse]);

  useEffect(() => {
    // Sync local rules from DB records
    setRules(dbRules.map(r => ({ ...r, _localId: r.id })));
  }, [dbRules]);

  if (!form) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRuleUpdate = (idx, updated) => {
    setRules(rs => rs.map((r, i) => i === idx ? updated : r));
  };

  const handleRuleDelete = (idx) => {
    setRules(rs => rs.filter((_, i) => i !== idx).map((r, i) => ({ ...r, step_order: i + 1 })));
  };

  const handleRuleMove = (idx, dir) => {
    const next = [...rules];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    next.forEach((r, i) => { r.step_order = i + 1; });
    setRules([...next]);
  };

  const handleAddRule = () => {
    setRules(rs => [...rs, {
      _localId: `new_${Date.now()}`,
      synapse_id: synapse.id,
      step_order: rs.length + 1,
      rule_type: 'Formula',
      rule_name: '',
      expression: '',
      output_fields: '',
      description: '',
      is_active: true,
    }]);
  };

  const handleSave = async () => {
    setSaving(true);
    const prevConfig = JSON.stringify(synapse);

    // Save synapse fields
    const updated = {
      ...form,
      version: (form.version || 1) + 1,
      processing_rules: JSON.stringify(rules.map(r => ({ rule_type: r.rule_type, rule_name: r.rule_name, expression: r.expression }))),
    };
    await base44.entities.Synapse.update(synapse.id, updated);

    // Sync ProcessingRule records
    const existing = dbRules;
    const existingIds = new Set(existing.map(r => r.id));
    const savedIds = new Set(rules.filter(r => r.id).map(r => r.id));

    // Delete removed rules
    await Promise.all(existing.filter(r => !savedIds.has(r.id)).map(r => base44.entities.ProcessingRule.delete(r.id)));

    // Update or create
    await Promise.all(rules.map(r => {
      const payload = {
        synapse_id: synapse.id,
        step_order: r.step_order,
        rule_type: r.rule_type,
        rule_name: r.rule_name || 'Untitled',
        expression: r.expression || '',
        output_fields: r.output_fields || '',
        description: r.description || '',
        is_active: r.is_active !== false,
        rule_config: JSON.stringify({ expression: r.expression, output_fields: r.output_fields }),
      };
      if (r.id && existingIds.has(r.id)) {
        return base44.entities.ProcessingRule.update(r.id, payload);
      } else {
        return base44.entities.ProcessingRule.create(payload);
      }
    }));

    // Version log
    await base44.entities.SynapseVersion.create({
      synapse_id: synapse.id, version_number: (form.version || 1) + 1,
      changed_at: new Date().toISOString(), change_description: 'Manual configuration update',
      previous_config: prevConfig, new_config: JSON.stringify(updated),
    });

    qc.invalidateQueries({ queryKey: ['synapses'] });
    qc.invalidateQueries({ queryKey: ['processingRules', synapse.id] });
    setSaving(false);
    onSaved && onSaved();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete synapse "${synapse.synapse_name}"?`)) return;
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
    setTesting(true); setTestResult(null);
    await new Promise(r => setTimeout(r, 1500));
    setTestResult({ rules_passed: rules.filter(r => r.is_active).length, records: Math.floor(Math.random() * 20) + 1 });
    setTesting(false);
  };

  const statusColor = { Active: '#10b981', Paused: '#f59e0b', Error: '#ef4444', Broken: '#ef4444' };

  // Parse sort field + dir
  const sortParts = (form.source_sort || '').split(' ');
  const sortField = sortParts[0] || '';
  const sortDir = sortParts[1] || 'DESC';

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Header */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: '#CADCFC' }}>
          <span>{fromNeuron?.icon} {fromNeuron?.display_name}</span>
          <span style={{ color: '#64748b' }}>──→</span>
          <span>{toNeuron?.icon} {toNeuron?.display_name}</span>
        </div>
        <Field label="SYNAPSE NAME">
          <Input value={form.synapse_name || ''} onChange={e => set('synapse_name', e.target.value)}
            className="h-8 text-sm font-bold" style={inputStyle} />
        </Field>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Badge style={{ background: `${statusColor[form.health_status] || '#64748b'}22`, color: statusColor[form.health_status] || '#64748b' }}>{form.health_status}</Badge>
          <Select value={form.priority} onValueChange={v => set('priority', v)}>
            <SelectTrigger className="h-6 text-[10px] w-24" style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.15)', color: '#94a3b8' }}><SelectValue /></SelectTrigger>
            <SelectContent>{['High','Medium','Low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
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
            <Select value={form.trigger_type || 'On Event'} onValueChange={v => set('trigger_type', v)}>
              <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{TRIGGER_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="SYNAPSE TYPE">
            <Select value={form.synapse_type || 'One-Way'} onValueChange={v => set('synapse_type', v)}>
              <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{SYNAPSE_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>

        {(!form.trigger_type || form.trigger_type === 'On Event') && (
          <Field label="EVENT NAME" hint="Fires when the named event is emitted by the source module">
            <Input value={form.trigger_event || ''} onChange={e => set('trigger_event', e.target.value)}
              placeholder="e.g. on_cr_approval, on_report_generation" className="h-8 text-xs font-mono" style={inputStyle} list="events-list" />
            <datalist id="events-list">{COMMON_EVENTS.map(e => <option key={e} value={e} />)}</datalist>
          </Field>
        )}

        {form.trigger_type === 'Scheduled' && (
          <div className="grid grid-cols-3 gap-2">
            <Field label="FREQUENCY">
              <Select value={form.trigger_schedule?.split(' ')[0] || 'Weekly'} onValueChange={v => set('trigger_schedule', `${v} ${form.trigger_schedule?.split(' ').slice(1).join(' ') || 'Monday 07:00'}`)}>
                <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{['Hourly','Daily','Weekly','Monthly'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="DAY (if weekly)">
              <Select value="" onValueChange={() => {}}>
                <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue placeholder="Day" /></SelectTrigger>
                <SelectContent>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="TIME">
              <Input value={form.trigger_schedule || ''} onChange={e => set('trigger_schedule', e.target.value)}
                placeholder="07:00" className="h-8 text-xs" style={inputStyle} />
            </Field>
          </div>
        )}

        {form.trigger_type === 'On Record Change' && (
          <>
            <Field label="WATCH ENTITY" hint="Synapse fires when a record in this entity changes">
              <Input value={form.trigger_event || ''} onChange={e => set('trigger_event', e.target.value)}
                placeholder="e.g. ChangeRequest, FinanceModel" className="h-8 text-xs font-mono" style={inputStyle} list="entity-list" />
              <datalist id="entity-list">{ALL_ENTITIES.map(e => <option key={e} value={e} />)}</datalist>
            </Field>
            <Field label="WATCH FIELDS" hint="Only fire when one of these fields changes (comma-separated)">
              <Textarea value={form.trigger_condition || ''} onChange={e => set('trigger_condition', e.target.value)}
                rows={2} placeholder="e.g. status, capex_impact, rag_status" className="text-xs" style={codeStyle} />
            </Field>
          </>
        )}

        <Field label="CONDITION (OPTIONAL)" hint="Expression that must be true for synapse to fire. Leave empty to always fire.">
          <Textarea value={form.trigger_condition || ''} onChange={e => set('trigger_condition', e.target.value)}
            rows={3} placeholder={"cr.status == 'Approved' AND cr.capex_impact > 0"}
            className="text-xs" style={codeStyle} />
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
        <Field label="SOURCE ENTITY" required>
          <Input value={form.source_entity || ''} onChange={e => set('source_entity', e.target.value)}
            placeholder="e.g. ChangeRequest, FinanceModel, ActionItem, WeeklyReport" className="h-8 text-xs font-mono" style={inputStyle} list="entity-list2" />
          <datalist id="entity-list2">{ALL_ENTITIES.map(e => <option key={e} value={e} />)}</datalist>
        </Field>

        <Field label="SOURCE FIELDS" hint="Comma-separated field names to pull from source entity">
          <Textarea value={(() => { try { const f = JSON.parse(form.source_fields || '[]'); return Array.isArray(f) ? f.join(', ') : form.source_fields; } catch { return form.source_fields || ''; } })()}
            onChange={e => {
              const raw = e.target.value;
              const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
              set('source_fields', JSON.stringify(arr));
            }}
            rows={3} placeholder="npv, irr, payback_period, total_capex, capex_spent, contingency_total, contingency_remaining, revenue_annual"
            className="text-xs" style={codeStyle} />
        </Field>

        <Field label="FILTER (OPTIONAL)" hint="SQL-like condition: status = 'Approved' AND capex_impact > 0">
          <Textarea value={form.source_filter || ''} onChange={e => set('source_filter', e.target.value)}
            rows={3} placeholder={"status != 'Cancelled' AND priority IN ('Critical','High')"}
            className="text-xs" style={codeStyle} />
        </Field>

        <div className="grid grid-cols-[1fr,80px,80px] gap-2">
          <Field label="SORT BY">
            <Input value={sortField} onChange={e => set('source_sort', `${e.target.value} ${sortDir}`.trim())}
              placeholder="e.g. approved_date, due_date" className="h-8 text-xs" style={inputStyle} />
          </Field>
          <Field label="DIRECTION">
            <Select value={sortDir} onValueChange={v => set('source_sort', `${sortField} ${v}`.trim())}>
              <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{SORT_DIRECTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="LIMIT" hint="0 = all">
            <Input type="number" value={form.source_limit || ''} onChange={e => set('source_limit', parseInt(e.target.value) || null)}
              placeholder="e.g. 1" className="h-8 text-xs" style={inputStyle} />
          </Field>
        </div>
      </Section>

      {/* 3. PROCESSING RULES */}
      <Section title="3. Processing Rules — How is data transformed?">
        {rules.length === 0 && (
          <div className="text-xs text-center py-4" style={{ color: '#475569' }}>
            No rules yet — data passes through unchanged
          </div>
        )}
        <div className="flex flex-col gap-2">
          {rules.map((rule, i) => (
            <RuleCard
              key={rule._localId || rule.id || i}
              rule={rule}
              index={i}
              total={rules.length}
              onUpdate={(updated) => handleRuleUpdate(i, updated)}
              onDelete={() => handleRuleDelete(i)}
              onMove={(idx, dir) => handleRuleMove(idx, dir)}
            />
          ))}
        </div>
        <button onClick={handleAddRule}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg w-full"
          style={{ border: '1px dashed rgba(167,139,250,0.3)', color: '#a78bfa' }}>
          <Plus className="w-3.5 h-3.5" /> Add Rule
        </button>
        <div className="text-[10px]" style={{ color: '#475569' }}>
          💡 Rules execute in order. Each rule can reference fields produced by previous rules.
        </div>
      </Section>

      {/* 4. TARGET MAPPING */}
      <Section title="4. Target Mapping — Where does data go?">
        <div className="grid grid-cols-2 gap-2">
          <Field label="TARGET ENTITY" required>
            <Input value={form.target_entity || ''} onChange={e => set('target_entity', e.target.value)}
              placeholder="e.g. WeeklyReportSection, DashboardMetric" className="h-8 text-xs font-mono" style={inputStyle} list="entity-list3" />
            <datalist id="entity-list3">{ALL_ENTITIES.map(e => <option key={e} value={e} />)}</datalist>
          </Field>
          <Field label="TARGET ACTION">
            <Select value={form.target_action || 'Update'} onValueChange={v => set('target_action', v)}>
              <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{TARGET_ACTIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="TARGET SECTION (OPTIONAL)" hint="If target entity has named sections, specify which one">
          <Input value={form.notes?.startsWith('target_section:') ? form.notes.replace('target_section:', '').split('\n')[0] : ''}
            onChange={e => set('target_section_temp', e.target.value)}
            placeholder="e.g. Cost & Financial, Schedule, Risk" className="h-8 text-xs" style={inputStyle} />
        </Field>

        <Field label="FIELD MAPPING" hint="One mapping per line: source_field → target_field">
          <FieldMappingTextarea value={form.target_fields || '{}'} onChange={v => set('target_fields', v)} />
        </Field>

        <Field label="AUTO-MAP BY NAME">
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: '#94a3b8' }}>
            <input type="checkbox" checked={false} onChange={() => {
              // Auto-populate mapping from source fields
              try {
                const fields = JSON.parse(form.source_fields || '[]');
                const obj = {};
                fields.forEach(f => { obj[f] = f; });
                set('target_fields', JSON.stringify(obj));
              } catch {}
            }} className="w-3 h-3 accent-teal-500" />
            Click to auto-map source fields to matching target field names
          </label>
        </Field>

        <Field label="OUTPUT FORMAT">
          <Select value={form.output_format || 'Raw'} onValueChange={v => set('output_format', v)}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{['Raw','Aggregated','Formatted','Calculated'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </Section>

      {/* 5. TEST */}
      <Section title="5. Test & Preview" defaultOpen={false}>
        <button onClick={handleTest} disabled={testing}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b98144', color: '#10b981' }}>
          <FlaskConical className="w-4 h-4" />
          {testing ? 'Running test…' : '▶ Test with Live Data'}
        </button>
        {testResult && (
          <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(5,10,25,0.8)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="font-bold mb-1 text-emerald-400">✅ Test passed · {testResult.rules_passed} rules applied</div>
            <div style={{ color: '#94a3b8' }}>
              Pulled {testResult.records} records from <span style={{ color: '#CADCFC' }}>{form.source_entity || '(no entity)'}</span>
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

      {/* Admin Notes */}
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
        <Button onClick={handleTest} disabled={testing} size="sm" variant="outline" style={{ borderColor: '#10b98144', color: '#10b981' }}>
          <FlaskConical className="w-4 h-4 mr-1" />Test
        </Button>
        <Button onClick={() => { setForm({ ...synapse }); setRules(dbRules.map(r => ({ ...r, _localId: r.id }))); }}
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