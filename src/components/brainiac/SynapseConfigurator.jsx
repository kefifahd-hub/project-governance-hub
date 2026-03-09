import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, Pause, Play, FlaskConical, Plus, X, ChevronRight, Settings2, Database, Filter, Zap, ArrowRight, Target, RotateCcw, ChevronDown, ChevronUp, Eye, EyeOff, Loader2 } from 'lucide-react';
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

const NODE_TYPES = {
  source:    { label: 'Source',    icon: Database,   color: '#028090', bg: 'rgba(2,128,144,0.15)',   border: 'rgba(2,128,144,0.4)' },
  filter:    { label: 'Filter',    icon: Filter,     color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)' },
  transform: { label: 'Transform', icon: Zap,        color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)' },
  map:       { label: 'Map',       icon: ArrowRight, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.4)' },
  target:    { label: 'Target',    icon: Target,     color: '#10b981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.4)' },
};

const RULE_NODE_TYPES = ['filter','transform'];

const Field = ({ label, children, hint }) => (
  <div>
    <label className="text-[10px] font-semibold mb-1 block tracking-widest" style={{ color: '#64748b' }}>{label}</label>
    {children}
    {hint && <div className="text-[10px] mt-1" style={{ color: '#475569' }}>{hint}</div>}
  </div>
);

// ─── Pipeline Node Card ───────────────────────────────────────────────────
function PipelineNode({ node, isActive, onClick, onDelete, canDelete }) {
  const cfg = NODE_TYPES[node.type] || NODE_TYPES.transform;
  const Icon = cfg.icon;
  return (
    <div className="relative flex flex-col items-center" style={{ minWidth: 100 }}>
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all"
        style={{
          background: isActive ? cfg.bg : 'rgba(15,23,42,0.8)',
          border: `2px solid ${isActive ? cfg.color : 'rgba(202,220,252,0.15)'}`,
          boxShadow: isActive ? `0 0 16px ${cfg.color}44` : 'none',
          minWidth: 90,
        }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
        </div>
        <span className="text-[11px] font-semibold" style={{ color: isActive ? cfg.color : '#CADCFC' }}>{cfg.label}</span>
        {node.label && (
          <span className="text-[9px] truncate max-w-[80px] text-center" style={{ color: '#64748b' }}>{node.label}</span>
        )}
      </button>
      {canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center z-10"
          style={{ background: 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.5)' }}
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}

// ─── Pipeline Node with Preview ───────────────────────────────────────────
function PipelineNodeWithPreview({ node, isActive, onClick, onDelete, canDelete, form, rules, sourceRecords, loadingPreview }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <PipelineNode node={node} isActive={isActive} onClick={onClick} onDelete={onDelete} canDelete={canDelete} />
      <NodePreviewPanel node={node} form={form} rules={rules} sourceRecords={sourceRecords} loadingPreview={loadingPreview} />
    </div>
  );
}

// ─── Add Node Button ──────────────────────────────────────────────────────
function AddNodeButton({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: 'rgba(167,139,250,0.2)', border: '1px dashed rgba(167,139,250,0.5)', color: '#a78bfa' }}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(202,220,252,0.2)', minWidth: 140 }}>
          {RULE_NODE_TYPES.map(t => {
            const cfg = NODE_TYPES[t];
            const Icon = cfg.icon;
            return (
              <button key={t} onClick={() => { onAdd(t); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80 transition-opacity"
                style={{ color: cfg.color }}>
                <Icon className="w-3.5 h-3.5" /> {cfg.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Node Detail Panels ───────────────────────────────────────────────────
function SourcePanel({ form, set }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-semibold mb-1" style={{ color: '#028090' }}>📥 Source Configuration</div>
      <Field label="SOURCE ENTITY">
        <Input value={form.source_entity || ''} onChange={e => set('source_entity', e.target.value)}
          placeholder="e.g. ChangeRequest, FinanceModel" className="h-8 text-xs font-mono" style={inputStyle} list="entity-list-src" />
        <datalist id="entity-list-src">{ALL_ENTITIES.map(e => <option key={e} value={e} />)}</datalist>
      </Field>
      <Field label="PULL FIELDS" hint="Comma-separated field names">
        <Textarea value={(() => { try { const f = JSON.parse(form.source_fields || '[]'); return Array.isArray(f) ? f.join(', ') : form.source_fields; } catch { return form.source_fields || ''; } })()}
          onChange={e => {
            const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            set('source_fields', JSON.stringify(arr));
          }}
          rows={3} placeholder="npv, irr, total_capex, capex_spent, contingency_remaining"
          className="text-xs" style={codeStyle} />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="SORT BY">
          <Input value={(form.source_sort || '').split(' ')[0] || ''} onChange={e => set('source_sort', `${e.target.value} ${(form.source_sort || '').split(' ')[1] || 'DESC'}`.trim())}
            placeholder="field name" className="h-8 text-xs" style={inputStyle} />
        </Field>
        <Field label="DIR">
          <Select value={(form.source_sort || '').split(' ')[1] || 'DESC'} onValueChange={v => set('source_sort', `${(form.source_sort || '').split(' ')[0] || ''} ${v}`.trim())}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{['ASC','DESC'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="LIMIT" hint="0=all">
          <Input type="number" value={form.source_limit || ''} onChange={e => set('source_limit', parseInt(e.target.value) || null)}
            placeholder="e.g. 1" className="h-8 text-xs" style={inputStyle} />
        </Field>
      </div>
      <div className="border-t pt-3" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>
        <div className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>⚡ TRIGGER</div>
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
        {(form.trigger_type === 'On Event' || !form.trigger_type) && (
          <Field label="EVENT NAME">
            <Input value={form.trigger_event || ''} onChange={e => set('trigger_event', e.target.value)}
              placeholder="e.g. on_cr_approval" className="h-8 text-xs font-mono mt-2" style={inputStyle} list="events-list" />
            <datalist id="events-list">{COMMON_EVENTS.map(e => <option key={e} value={e} />)}</datalist>
          </Field>
        )}
        {form.trigger_type === 'Scheduled' && (
          <Field label="SCHEDULE">
            <Input value={form.trigger_schedule || ''} onChange={e => set('trigger_schedule', e.target.value)}
              placeholder="e.g. Weekly Monday 07:00" className="h-8 text-xs font-mono mt-2" style={inputStyle} />
          </Field>
        )}
      </div>
    </div>
  );
}

function FilterPanel({ rule, onUpdate }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-semibold mb-1" style={{ color: '#3b82f6' }}>🔵 Filter Step</div>
      <Field label="STEP NAME">
        <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
          placeholder="e.g. Filter approved only" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <Field label="FILTER CONDITION" hint="SQL-like condition expression">
        <Textarea value={rule.expression || ''} onChange={e => onUpdate({ ...rule, expression: e.target.value })}
          rows={5} placeholder={RULE_PLACEHOLDERS.Filter} className="text-xs" style={codeStyle} />
      </Field>
      <Field label="DESCRIPTION">
        <Textarea value={rule.description || ''} onChange={e => onUpdate({ ...rule, description: e.target.value })}
          rows={2} placeholder="Plain English: what does this filter do?"
          style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.1)', color: '#94a3b8', fontSize: 12 }} />
      </Field>
    </div>
  );
}

function TransformPanel({ rule, onUpdate }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-semibold mb-1" style={{ color: '#f59e0b' }}>⚡ Transform Step</div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="STEP NAME">
          <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
            placeholder="e.g. Calculate variance" className="h-8 text-xs" style={inputStyle} />
        </Field>
        <Field label="RULE TYPE">
          <Select value={rule.rule_type || 'Formula'} onValueChange={v => onUpdate({ ...rule, rule_type: v })}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{RULE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="EXPRESSION">
        <Textarea value={rule.expression || ''} onChange={e => onUpdate({ ...rule, expression: e.target.value })}
          rows={5} placeholder={RULE_PLACEHOLDERS[rule.rule_type] || 'Enter expression...'} className="text-xs" style={codeStyle} />
      </Field>
      <Field label="OUTPUT FIELDS" hint="Comma-separated field names this step produces">
        <Input value={rule.output_fields || ''} onChange={e => onUpdate({ ...rule, output_fields: e.target.value })}
          placeholder="e.g. budget_variance, cost_rag" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <Field label="DESCRIPTION">
        <Textarea value={rule.description || ''} onChange={e => onUpdate({ ...rule, description: e.target.value })}
          rows={2} placeholder="Plain English: what does this step do?"
          style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.1)', color: '#94a3b8', fontSize: 12 }} />
      </Field>
    </div>
  );
}

function MapPanel({ form, set }) {
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
        const k = parts[0].trim(); const v = parts[1].trim();
        if (k) obj[k] = v;
      }
    });
    return JSON.stringify(obj);
  };
  const [text, setText] = useState(() => toText(form.target_fields));
  useEffect(() => { setText(toText(form.target_fields)); }, [form.target_fields]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-semibold mb-1" style={{ color: '#8b5cf6' }}>🗺️ Field Mapping</div>
      <Field label="FIELD MAPPING" hint="One mapping per line: source_field → target_field">
        <Textarea value={text}
          onChange={e => { setText(e.target.value); set('target_fields', toJson(e.target.value)); }}
          rows={7} placeholder={"npv → financial_npv\nirr → financial_irr\nbudget_pct → budget_percentage\ncost_rag → cost_rag_status"}
          className="text-xs" style={codeStyle} />
      </Field>
      <button className="flex items-center gap-1.5 text-xs" style={{ color: '#8b5cf6' }}
        onClick={() => {
          try {
            const fields = JSON.parse(form.source_fields || '[]');
            const obj = {}; fields.forEach(f => { obj[f] = f; });
            set('target_fields', JSON.stringify(obj));
          } catch {}
        }}>
        <Plus className="w-3 h-3" /> Auto-map by field name
      </button>
      <Field label="OUTPUT FORMAT">
        <Select value={form.output_format || 'Raw'} onValueChange={v => set('output_format', v)}>
          <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
          <SelectContent>{['Raw','Aggregated','Formatted','Calculated'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function TargetPanel({ form, set }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-semibold mb-1" style={{ color: '#10b981' }}>🎯 Target Configuration</div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="TARGET ENTITY">
          <Input value={form.target_entity || ''} onChange={e => set('target_entity', e.target.value)}
            placeholder="e.g. WeeklyReport" className="h-8 text-xs font-mono" style={inputStyle} list="entity-list-tgt" />
          <datalist id="entity-list-tgt">{ALL_ENTITIES.map(e => <option key={e} value={e} />)}</datalist>
        </Field>
        <Field label="ACTION">
          <Select value={form.target_action || 'Update'} onValueChange={v => set('target_action', v)}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{TARGET_ACTIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="CONDITION" hint="Condition that must be true for synapse to fire. Leave empty to always fire.">
        <Textarea value={form.trigger_condition || ''} onChange={e => set('trigger_condition', e.target.value)}
          rows={3} placeholder={"cr.status == 'Approved' AND cr.capex_impact > 0"}
          className="text-xs" style={codeStyle} />
      </Field>
      <Field label="ADMIN NOTES">
        <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2}
          placeholder="Notes for other admins about this synapse"
          style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.1)', color: '#94a3b8', fontSize: 12 }} />
      </Field>
    </div>
  );
}

// ─── Data Preview Panel ───────────────────────────────────────────────────
function applyFilterPreview(records, rule) {
  if (!rule.expression) return records;
  // Best-effort: try to evaluate simple field=value conditions
  try {
    return records.filter(r => {
      const expr = rule.expression
        .replace(/AND/gi, '&&').replace(/OR/gi, '||')
        .replace(/=/g, '==').replace(/!==|==/g, m => m)
        .replace(/([a-zA-Z_][a-zA-Z0-9_]*)/g, (m) => {
          if (['true','false','null','undefined','&&','||','==','!=','>=','<=','>','<'].includes(m)) return m;
          const val = r[m];
          if (val === undefined) return 'undefined';
          return typeof val === 'string' ? `"${val}"` : val;
        });
      // eslint-disable-next-line no-new-func
      return new Function(`return !!(${expr})`)();
    });
  } catch { return records; }
}

function applyMapPreview(records, targetFields) {
  if (!targetFields) return records;
  try {
    const mapping = typeof targetFields === 'string' ? JSON.parse(targetFields) : targetFields;
    if (!Object.keys(mapping).length) return records;
    return records.map(r => {
      const out = {};
      Object.entries(mapping).forEach(([src, tgt]) => { if (r[src] !== undefined) out[tgt] = r[src]; });
      return out;
    });
  } catch { return records; }
}

function DataPreviewTable({ records, title, color }) {
  if (!records || !records.length) return (
    <div className="text-[10px] py-2 text-center" style={{ color: '#475569' }}>No records</div>
  );
  const keys = [...new Set(records.flatMap(r => Object.keys(r)))].slice(0, 6);
  return (
    <div className="overflow-x-auto rounded-lg mt-2" style={{ border: '1px solid rgba(202,220,252,0.08)' }}>
      {title && <div className="text-[9px] px-2 py-1 font-semibold tracking-widest" style={{ color, background: 'rgba(0,0,0,0.3)' }}>{title}</div>}
      <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.4)' }}>
            {keys.map(k => (
              <th key={k} className="px-2 py-1 text-left truncate max-w-[80px]" style={{ color: '#64748b', borderBottom: '1px solid rgba(202,220,252,0.06)', fontWeight: 600 }}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(202,220,252,0.04)', background: i % 2 === 0 ? 'rgba(30,39,97,0.2)' : 'transparent' }}>
              {keys.map(k => (
                <td key={k} className="px-2 py-1 truncate max-w-[80px]" style={{ color: '#94a3b8' }} title={String(r[k] ?? '')}>
                  {r[k] !== undefined && r[k] !== null ? String(r[k]).slice(0, 20) + (String(r[k]).length > 20 ? '…' : '') : <span style={{ color: '#334155' }}>—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NodePreviewPanel({ node, form, rules, sourceRecords, loadingPreview }) {
  const [open, setOpen] = useState(false);

  const getPreviewData = () => {
    if (!sourceRecords || !sourceRecords.length) return [];
    if (node.type === 'source') return sourceRecords;
    if (node.type === 'target') {
      let data = [...sourceRecords];
      rules.forEach(r => {
        if (r.rule_type === 'Filter') data = applyFilterPreview(data, r);
      });
      return applyMapPreview(data, form.target_fields);
    }
    if (node.type === 'map') {
      let data = [...sourceRecords];
      rules.forEach(r => {
        if (r.rule_type === 'Filter') data = applyFilterPreview(data, r);
      });
      return data;
    }
    if (node.ruleIndex !== undefined) {
      let data = [...sourceRecords];
      for (let i = 0; i <= node.ruleIndex; i++) {
        const r = rules[i];
        if (r && r.rule_type === 'Filter') data = applyFilterPreview(data, r);
      }
      return data;
    }
    return sourceRecords;
  };

  const cfg = NODE_TYPES[node.type] || NODE_TYPES.transform;
  const preview = getPreviewData();

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded transition-opacity hover:opacity-80"
        style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
      >
        {loadingPreview ? <Loader2 className="w-3 h-3 animate-spin" /> : open ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        {loadingPreview ? 'Loading…' : open ? 'Hide preview' : `Preview (${preview.length})`}
      </button>
      {open && !loadingPreview && (
        <DataPreviewTable records={preview} color={cfg.color} />
      )}
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
  const [activeNodeIdx, setActiveNodeIdx] = useState(0);
  const [sourceRecords, setSourceRecords] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const neuronMap = {};
  neurons.forEach(n => { neuronMap[n.id] = n; });
  const fromNeuron = neuronMap[synapse.from_neuron_id];
  const toNeuron = neuronMap[synapse.to_neuron_id];

  const { data: dbRules = [], refetch: refetchRules } = useQuery({
    queryKey: ['processingRules', synapse.id],
    queryFn: () => base44.entities.ProcessingRule.filter({ synapse_id: synapse.id }, 'step_order'),
  });

  useEffect(() => {
    setForm({ ...synapse });
    setActiveNodeIdx(0);
    // Fetch preview records when synapse changes
    if (synapse.source_entity) {
      setLoadingPreview(true);
      setSourceRecords([]);
      base44.entities[synapse.source_entity]?.list('-created_date', 3)
        .then(data => setSourceRecords(data || []))
        .catch(() => setSourceRecords([]))
        .finally(() => setLoadingPreview(false));
    }
  }, [synapse]);

  useEffect(() => {
    setRules(dbRules.map(r => ({ ...r, _localId: r.id })));
  }, [dbRules]);

  if (!form) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Build pipeline nodes: [source] + [rule nodes] + [map] + [target]
  const buildPipeline = () => {
    const nodes = [
      { id: 'source', type: 'source', label: form.source_entity || '' },
      ...rules.map((r, i) => ({
        id: r._localId || r.id || `rule_${i}`,
        type: r.rule_type === 'Filter' ? 'filter' : 'transform',
        label: r.rule_name || '',
        ruleIndex: i,
      })),
      { id: 'map', type: 'map', label: '' },
      { id: 'target', type: 'target', label: form.target_entity || '' },
    ];
    return nodes;
  };

  const pipeline = buildPipeline();

  const handleAddNode = (afterIndex, type) => {
    const newRule = {
      _localId: `new_${Date.now()}`,
      synapse_id: synapse.id,
      step_order: afterIndex,
      rule_type: type === 'filter' ? 'Filter' : 'Formula',
      rule_name: '',
      expression: '',
      output_fields: '',
      description: '',
      is_active: true,
    };
    setRules(rs => {
      // afterIndex here is the index in the rules array to insert after
      const next = [...rs.slice(0, afterIndex), newRule, ...rs.slice(afterIndex)];
      return next.map((r, i) => ({ ...r, step_order: i + 1 }));
    });
    // Activate the new node: its pipeline index = 1 + afterIndex
    setActiveNodeIdx(1 + afterIndex);
  };

  const handleDeleteNode = (pipelineIdx) => {
    const node = pipeline[pipelineIdx];
    if (node.ruleIndex === undefined) return;
    setRules(rs => rs.filter((_, i) => i !== node.ruleIndex).map((r, i) => ({ ...r, step_order: i + 1 })));
    setActiveNodeIdx(Math.max(0, pipelineIdx - 1));
  };

  const handleRuleUpdate = (ruleIndex, updated) => {
    setRules(rs => rs.map((r, i) => i === ruleIndex ? updated : r));
  };

  const handleSave = async () => {
    setSaving(true);
    const prevConfig = JSON.stringify(synapse);
    const updated = {
      ...form,
      version: (form.version || 1) + 1,
      processing_rules: JSON.stringify(rules.map(r => ({ rule_type: r.rule_type, rule_name: r.rule_name, expression: r.expression }))),
    };
    await base44.entities.Synapse.update(synapse.id, updated);
    const existing = dbRules;
    const existingIds = new Set(existing.map(r => r.id));
    const savedIds = new Set(rules.filter(r => r.id).map(r => r.id));
    await Promise.all(existing.filter(r => !savedIds.has(r.id)).map(r => base44.entities.ProcessingRule.delete(r.id)));
    await Promise.all(rules.map(r => {
      const payload = {
        synapse_id: synapse.id, step_order: r.step_order, rule_type: r.rule_type,
        rule_name: r.rule_name || 'Untitled', expression: r.expression || '',
        output_fields: r.output_fields || '', description: r.description || '',
        is_active: r.is_active !== false,
        rule_config: JSON.stringify({ expression: r.expression, output_fields: r.output_fields }),
      };
      if (r.id && existingIds.has(r.id)) return base44.entities.ProcessingRule.update(r.id, payload);
      else return base44.entities.ProcessingRule.create(payload);
    }));
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
  const activeNode = pipeline[activeNodeIdx];

  // Render the detail panel for the active node
  const renderPanel = () => {
    if (!activeNode) return null;
    if (activeNode.type === 'source') return <SourcePanel form={form} set={set} />;
    if (activeNode.type === 'map') return <MapPanel form={form} set={set} />;
    if (activeNode.type === 'target') return <TargetPanel form={form} set={set} />;
    if (activeNode.ruleIndex !== undefined) {
      const rule = rules[activeNode.ruleIndex];
      if (!rule) return null;
      const update = (u) => handleRuleUpdate(activeNode.ruleIndex, u);
      if (activeNode.type === 'filter') return <FilterPanel rule={rule} onUpdate={update} />;
      return <TransformPanel rule={rule} onUpdate={update} />;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-0 pb-6">
      {/* Header */}
      <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
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

      {/* PIPELINE FLOW */}
      <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(202,220,252,0.08)' }}>
        <div className="text-[10px] font-semibold mb-3 tracking-widest" style={{ color: '#64748b' }}>PIPELINE FLOW</div>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {pipeline.map((node, idx) => (
            <React.Fragment key={node.id}>
              <PipelineNode
                node={node}
                isActive={activeNodeIdx === idx}
                onClick={() => setActiveNodeIdx(idx)}
                onDelete={() => handleDeleteNode(idx)}
                canDelete={node.type === 'filter' || node.type === 'transform'}
              />
              {idx < pipeline.length - 1 && (
                <div className="flex items-center gap-0 flex-shrink-0 mx-1">
                  <div className="h-px w-4" style={{ background: 'rgba(202,220,252,0.2)' }} />
                  {/* Only allow adding between source/rules and before map */}
                  {idx < pipeline.length - 2 && (
                    <AddNodeButton onAdd={(type) => {
                      // insert after current rule nodes; ruleIndex offset
                      const rulesBeforeMap = pipeline.filter((n, i) => i > 0 && i < pipeline.length - 2);
                      const insertAt = idx; // rules array insert position
                      handleAddNode(insertAt, type);
                    }} />
                  )}
                  <div className="h-px w-4" style={{ background: 'rgba(202,220,252,0.2)' }} />
                  <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(202,220,252,0.2)' }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="text-[10px] mt-2" style={{ color: '#334155' }}>
          Click a node to configure · Press + to add a Filter or Transform step
        </div>
      </div>

      {/* ACTIVE NODE DETAIL PANEL */}
      {activeNode && (
        <div className="rounded-xl p-4 mb-3 transition-all" style={{
          background: 'rgba(15,23,42,0.8)',
          border: `1px solid ${NODE_TYPES[activeNode.type]?.border || 'rgba(202,220,252,0.1)'}`,
        }}>
          <div className="flex items-center gap-2 mb-3">
            {React.createElement(NODE_TYPES[activeNode.type]?.icon || Settings2, {
              className: 'w-4 h-4', style: { color: NODE_TYPES[activeNode.type]?.color || '#94a3b8' }
            })}
            <span className="text-sm font-semibold" style={{ color: NODE_TYPES[activeNode.type]?.color || '#CADCFC' }}>
              {NODE_TYPES[activeNode.type]?.label} Settings
            </span>
            {(activeNode.type === 'filter' || activeNode.type === 'transform') && activeNode.ruleIndex !== undefined && (
              <span className="text-[10px] ml-auto" style={{ color: '#475569' }}>Step {activeNode.ruleIndex + 1} of {rules.length}</span>
            )}
          </div>
          {renderPanel()}
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className="rounded-lg p-3 text-xs mb-3" style={{ background: 'rgba(5,10,25,0.8)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div className="font-bold mb-1 text-emerald-400">✅ Test passed · {testResult.rules_passed} rules applied</div>
          <div style={{ color: '#94a3b8' }}>Pulled {testResult.records} records from <span style={{ color: '#CADCFC' }}>{form.source_entity || '(no entity)'}</span></div>
        </div>
      )}

      {/* Action Bar */}
      <div className="sticky bottom-0 rounded-xl p-3 flex flex-wrap gap-2 mt-2"
        style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.1)', backdropFilter: 'blur(12px)' }}>
        <Button onClick={handleSave} disabled={saving} size="sm"
          style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
          <Save className="w-4 h-4 mr-1" />{saving ? 'Saving…' : `Save (v${(form.version || 1) + 1})`}
        </Button>
        <Button onClick={handleTest} disabled={testing} size="sm" variant="outline" style={{ borderColor: '#10b98144', color: '#10b981' }}>
          <FlaskConical className="w-4 h-4 mr-1" />{testing ? 'Testing…' : 'Test'}
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