import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, Trash2, GripVertical, Plus, X } from 'lucide-react';

const RULE_TYPES = ['Formula', 'Filter', 'Aggregate', 'Transform', 'Enrich', 'Validate', 'Format', 'Conditional', 'Lookup', 'Alert'];
const RULE_COLORS = { Formula: '#a78bfa', Filter: '#f59e0b', Aggregate: '#10b981', Transform: '#06b6d4', Enrich: '#0ea5e9', Validate: '#ec4899', Format: '#84cc16', Conditional: '#f97316', Lookup: '#8b5cf6', Alert: '#ef4444' };
const RULE_ICONS = { Formula: '📐', Filter: '🔍', Aggregate: '📊', Transform: '🔄', Enrich: '📎', Validate: '✅', Format: '📝', Conditional: '❓', Lookup: '🔎', Alert: '🔔' };

const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };
const codeStyle = { background: 'rgba(5,10,25,0.8)', borderColor: 'rgba(202,220,252,0.15)', color: '#a5f3fc', resize: 'vertical' };
const label10 = { color: '#64748b' };

// ─── Formula Rule ───────────────────────────────────────────────────────────
function FormulaForm({ rule, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] font-medium mb-1 block" style={label10}>EXPRESSION</label>
        <Textarea value={rule.rule_config || ''} onChange={e => onChange({ ...rule, rule_config: e.target.value })}
          rows={4} placeholder={"budget_variance = total_capex - capex_spent\nbudget_pct = (capex_spent / total_capex) * 100\ncontingency_pct = (contingency_remaining / contingency_total) * 100"}
          className="text-xs font-mono" style={codeStyle} />
        <div className="text-[10px] mt-1" style={{ color: '#475569' }}>
          Available functions: SUM(), AVG(), COUNT(), MAX(), MIN(), ROUND(), ABS(), IF(), today(), now()
        </div>
      </div>
    </div>
  );
}

// ─── Filter Rule ─────────────────────────────────────────────────────────────
function FilterForm({ rule, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] font-medium mb-1 block" style={label10}>FILTER CONDITION</label>
        <Textarea value={rule.rule_config || ''} onChange={e => onChange({ ...rule, rule_config: e.target.value })}
          rows={3} placeholder={"status = 'Approved' AND capex_impact > 0\n-- or --\npriority IN ('Critical', 'High') AND due_date < today()"}
          className="text-xs font-mono" style={codeStyle} />
        <div className="text-[10px] mt-1" style={{ color: '#475569' }}>
          Operators: =, !=, &gt;, &lt;, &gt;=, &lt;=, IN, NOT IN, LIKE, IS NULL, IS NOT NULL
        </div>
      </div>
    </div>
  );
}

// ─── Aggregate Rule ───────────────────────────────────────────────────────────
function AggregateForm({ rule, onChange }) {
  let config = { group_by: '', operations: [{ field: '', func: 'COUNT', output: '' }] };
  try { const p = JSON.parse(rule.rule_config || '{}'); if (p.group_by !== undefined) config = p; } catch {}

  const save = (updated) => onChange({ ...rule, rule_config: JSON.stringify(updated) });
  const AGG_FUNCS = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'FIRST', 'LAST'];

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] font-medium mb-1 block" style={label10}>GROUP BY (optional)</label>
        <Input value={config.group_by || ''} onChange={e => save({ ...config, group_by: e.target.value })}
          placeholder="priority, status (leave empty to aggregate all)" className="h-8 text-xs" style={inputStyle} />
      </div>
      <div>
        <label className="text-[10px] font-medium mb-1 block" style={label10}>OPERATIONS</label>
        <div className="flex flex-col gap-1">
          {(config.operations || []).map((op, i) => (
            <div key={i} className="grid grid-cols-[1fr,auto,1fr,auto] gap-1 items-center">
              <Input value={op.field} onChange={e => { const ops = [...config.operations]; ops[i] = { ...op, field: e.target.value }; save({ ...config, operations: ops }); }}
                placeholder="field" className="h-7 text-xs" style={inputStyle} />
              <Select value={op.func} onValueChange={v => { const ops = [...config.operations]; ops[i] = { ...op, func: v }; save({ ...config, operations: ops }); }}>
                <SelectTrigger className="h-7 text-xs w-20" style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{AGG_FUNCS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={op.output} onChange={e => { const ops = [...config.operations]; ops[i] = { ...op, output: e.target.value }; save({ ...config, operations: ops }); }}
                placeholder="output_name" className="h-7 text-xs" style={inputStyle} />
              <button onClick={() => save({ ...config, operations: config.operations.filter((_, j) => j !== i) })}>
                <X className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
          <button onClick={() => save({ ...config, operations: [...(config.operations || []), { field: '', func: 'COUNT', output: '' }] })}
            className="text-[10px] text-left px-2 py-1 rounded border mt-1" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b' }}>
            + Add Operation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Conditional Rule ─────────────────────────────────────────────────────────
function ConditionalForm({ rule, onChange }) {
  let rows = [{ condition: '', action: '', type: 'IF' }];
  try { const p = JSON.parse(rule.rule_config || '[]'); if (Array.isArray(p)) rows = p; } catch {}

  const save = (updated) => onChange({ ...rule, rule_config: JSON.stringify(updated) });

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-medium mb-1 block" style={label10}>CONDITIONS</label>
      <div className="flex flex-col gap-1">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[50px,1fr,auto,1fr,auto] gap-1 items-center">
            <span className="text-[10px] font-bold px-2 py-1 rounded text-center"
              style={{ background: i === 0 ? 'rgba(59,130,246,0.2)' : i < rows.length - 1 ? 'rgba(245,158,11,0.2)' : 'rgba(100,116,139,0.2)',
                color: i === 0 ? '#3b82f6' : i < rows.length - 1 ? '#f59e0b' : '#64748b' }}>
              {i === 0 ? 'IF' : i < rows.length - 1 ? 'ELIF' : 'ELSE'}
            </span>
            <Input value={row.condition || ''} onChange={e => { const r = [...rows]; r[i] = { ...row, condition: e.target.value }; save(r); }}
              placeholder={i === rows.length - 1 ? '(catch all)' : 'budget_pct > 100'} className="h-7 text-xs font-mono" style={inputStyle}
              disabled={i === rows.length - 1} />
            <span className="text-[10px]" style={{ color: '#64748b' }}>→</span>
            <Input value={row.action || ''} onChange={e => { const r = [...rows]; r[i] = { ...row, action: e.target.value }; save(r); }}
              placeholder='cost_rag = "Red"' className="h-7 text-xs font-mono" style={inputStyle} />
            <button onClick={() => save(rows.filter((_, j) => j !== i))} disabled={rows.length <= 1}>
              <X className="w-3.5 h-3.5 text-red-400 disabled:opacity-30" />
            </button>
          </div>
        ))}
        <div className="flex gap-1 mt-1">
          <button onClick={() => save([...rows.slice(0, -1), { condition: '', action: '', type: 'ELIF' }, rows[rows.length - 1]])}
            className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b' }}>
            + Add ELIF
          </button>
          {rows[rows.length - 1]?.type !== 'ELSE' && (
            <button onClick={() => save([...rows, { condition: '', action: '', type: 'ELSE' }])}
              className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b' }}>
              + Add ELSE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Transform Rule ───────────────────────────────────────────────────────────
function TransformForm({ rule, onChange }) {
  let rows = [{ field: '', transform: 'Map Values', config: '' }];
  try { const p = JSON.parse(rule.rule_config || '[]'); if (Array.isArray(p)) rows = p; } catch {}

  const save = (updated) => onChange({ ...rule, rule_config: JSON.stringify(updated) });
  const TRANSFORMS = ['Map Values', 'Currency', 'Date Format', 'Round', 'Uppercase', 'Lowercase', 'Trim', 'Number Format', 'Percentage', 'Custom'];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-medium mb-1 block" style={label10}>TRANSFORMATIONS</label>
      <div className="flex flex-col gap-1">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr,auto,1fr,auto] gap-1 items-start">
            <Input value={row.field} onChange={e => { const r = [...rows]; r[i] = { ...row, field: e.target.value }; save(r); }}
              placeholder="field_name" className="h-7 text-xs" style={inputStyle} />
            <Select value={row.transform} onValueChange={v => { const r = [...rows]; r[i] = { ...row, transform: v }; save(r); }}>
              <SelectTrigger className="h-7 text-xs w-28" style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{TRANSFORMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={row.config} onChange={e => { const r = [...rows]; r[i] = { ...row, config: e.target.value }; save(r); }}
              placeholder="config / template" className="h-7 text-xs" style={inputStyle} />
            <button onClick={() => save(rows.filter((_, j) => j !== i))}>
              <X className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        ))}
        <button onClick={() => save([...rows, { field: '', transform: 'Map Values', config: '' }])}
          className="text-[10px] text-left px-2 py-1 rounded border mt-1" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b' }}>
          + Add Transformation
        </button>
      </div>
    </div>
  );
}

// ─── Alert Rule ────────────────────────────────────────────────────────────
function AlertForm({ rule, onChange }) {
  let config = { condition: '', severity: 'Warning', message: '', notify: [], channel: [] };
  try { const p = JSON.parse(rule.rule_config || '{}'); if (p.severity) config = p; } catch {}

  const save = (updated) => onChange({ ...rule, rule_config: JSON.stringify(updated) });
  const toggleArr = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-medium mb-1 block" style={label10}>CONDITION</label>
          <Input value={config.condition || ''} onChange={e => save({ ...config, condition: e.target.value })}
            placeholder="contingency_pct < 50" className="h-8 text-xs font-mono" style={inputStyle} />
        </div>
        <div>
          <label className="text-[10px] font-medium mb-1 block" style={label10}>SEVERITY</label>
          <Select value={config.severity || 'Warning'} onValueChange={v => save({ ...config, severity: v })}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Info', 'Warning', 'Critical'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-medium mb-1 block" style={label10}>MESSAGE TEMPLATE</label>
        <Textarea value={config.message || ''} onChange={e => save({ ...config, message: e.target.value })}
          rows={2} placeholder="Contingency at {{contingency_pct}}% — below 50% threshold. Immediate review required."
          className="text-xs font-mono" style={codeStyle} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium mb-1 block" style={label10}>NOTIFY</label>
          {['Platform Admin', 'Project Manager', 'Finance Controller', 'All Stakeholders'].map(n => (
            <label key={n} className="flex items-center gap-1.5 text-xs cursor-pointer mb-1" style={{ color: '#94a3b8' }}>
              <input type="checkbox" checked={(config.notify || []).includes(n)}
                onChange={() => save({ ...config, notify: toggleArr(config.notify || [], n) })} className="w-3 h-3" />
              {n}
            </label>
          ))}
        </div>
        <div>
          <label className="text-[10px] font-medium mb-1 block" style={label10}>CHANNEL</label>
          {['Platform notification', 'Email', 'Slack'].map(c => (
            <label key={c} className="flex items-center gap-1.5 text-xs cursor-pointer mb-1" style={{ color: '#94a3b8' }}>
              <input type="checkbox" checked={(config.channel || []).includes(c)}
                onChange={() => save({ ...config, channel: toggleArr(config.channel || [], c) })} className="w-3 h-3" />
              {c}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Format Rule ────────────────────────────────────────────────────────────
function FormatForm({ rule, onChange }) {
  const [preview, setPreview] = useState('');
  const template = rule.rule_config || '';

  const generatePreview = () => {
    setPreview(template.replace(/\{\{([^}]+)\}\}/g, (_, key) => `[${key}]`));
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] font-medium mb-1 block" style={label10}>OUTPUT TEMPLATE</label>
        <Textarea value={template} onChange={e => onChange({ ...rule, rule_config: e.target.value })}
          rows={3} placeholder={'summary = "Budget: €{{total_capex}}M | Spent: €{{capex_spent}}M ({{budget_pct}}%) | Contingency: {{contingency_pct}}%"'}
          className="text-xs font-mono" style={codeStyle} />
        <div className="text-[10px] mt-1" style={{ color: '#475569' }}>Use {'{{'} field_name {'}}' } to insert field values</div>
      </div>
      <button onClick={generatePreview} className="text-[10px] px-2 py-1 rounded border w-fit" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b' }}>
        Preview Output
      </button>
      {preview && (
        <div className="text-[11px] p-2 rounded font-mono" style={{ background: 'rgba(5,10,25,0.8)', color: '#84cc16', border: '1px solid rgba(132,204,22,0.3)' }}>
          {preview}
        </div>
      )}
    </div>
  );
}

// ─── Enrich / Lookup / Validate — generic textarea ────────────────────────
function GenericTextForm({ rule, onChange, placeholder }) {
  return (
    <div>
      <label className="text-[10px] font-medium mb-1 block" style={label10}>CONFIGURATION</label>
      <Textarea value={rule.rule_config || ''} onChange={e => onChange({ ...rule, rule_config: e.target.value })}
        rows={4} placeholder={placeholder} className="text-xs font-mono" style={codeStyle} />
    </div>
  );
}

// ─── Rule Card ────────────────────────────────────────────────────────────
function RuleCard({ rule, index, total, onChange, onDelete, onMove }) {
  const [open, setOpen] = useState(true);
  const color = RULE_COLORS[rule.rule_type] || '#6366f1';

  const renderForm = () => {
    switch (rule.rule_type) {
      case 'Formula': return <FormulaForm rule={rule} onChange={onChange} />;
      case 'Filter': return <FilterForm rule={rule} onChange={onChange} />;
      case 'Aggregate': return <AggregateForm rule={rule} onChange={onChange} />;
      case 'Conditional': return <ConditionalForm rule={rule} onChange={onChange} />;
      case 'Transform': return <TransformForm rule={rule} onChange={onChange} />;
      case 'Alert': return <AlertForm rule={rule} onChange={onChange} />;
      case 'Format': return <FormatForm rule={rule} onChange={onChange} />;
      case 'Enrich': return <GenericTextForm rule={rule} onChange={onChange} placeholder={"lookup User WHERE id = assignee_id\nadd fields: full_name, org_name"} />;
      case 'Validate': return <GenericTextForm rule={rule} onChange={onChange} placeholder={"npv: not_null → use_default 0\ndue_date: is_future → flag_warning\nstatus: in ['Active','Closed'] → reject"} />;
      case 'Lookup': return <GenericTextForm rule={rule} onChange={onChange} placeholder={"FROM QualityGate WHERE phase = current_phase\nRETURN gate_date, readiness_pct"} />;
      default: return <GenericTextForm rule={rule} onChange={onChange} placeholder="Enter configuration..." />;
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: `${color}44`, background: 'rgba(15,23,42,0.7)' }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: `${color}18` }}>
        <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: '#475569' }} />
        <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${color}33`, color }}>
          {RULE_ICONS[rule.rule_type]} {rule.rule_type}
        </span>
        <button className="flex-1 text-left" onClick={() => setOpen(o => !o)}>
          <span className="text-sm font-medium" style={{ color: '#CADCFC' }}>{rule.rule_name || 'Unnamed Rule'}</span>
        </button>
        <button onClick={e => { e.stopPropagation(); onChange({ ...rule, is_active: !rule.is_active }); }}
          className="text-[10px] px-2 py-0.5 rounded flex-shrink-0"
          style={{ background: rule.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: rule.is_active ? '#10b981' : '#64748b' }}>
          {rule.is_active ? '● ON' : '○ OFF'}
        </button>
        <button onClick={() => onMove(index, -1)} disabled={index === 0} className="disabled:opacity-20">
          <ChevronUp className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
        </button>
        <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="disabled:opacity-20">
          <ChevronDown className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
        </button>
        <button onClick={() => onDelete(index)}>
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
        <button onClick={() => setOpen(o => !o)}>
          {open ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#64748b' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#64748b' }} />}
        </button>
      </div>
      {open && (
        <div className="p-3 flex flex-col gap-3">
          <div>
            <label className="text-[10px] font-medium mb-1 block" style={label10}>RULE NAME</label>
            <Input value={rule.rule_name} onChange={e => onChange({ ...rule, rule_name: e.target.value })}
              className="h-8 text-xs" placeholder="Describe what this rule does"
              style={inputStyle} />
          </div>
          {renderForm()}
          <Input value={rule.description || ''} onChange={e => onChange({ ...rule, description: e.target.value })}
            className="h-7 text-xs" placeholder="Plain-English note for other admins (optional)"
            style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.1)', color: '#64748b' }} />
        </div>
      )}
    </div>
  );
}

export default function ProcessingRuleEditor({ rules, onChange }) {
  const [showMenu, setShowMenu] = useState(false);

  const addRule = (type) => {
    const newRule = { id: `new_${Date.now()}`, rule_type: type, rule_name: '', rule_config: '', is_active: true, description: '', step_order: rules.length + 1 };
    onChange([...rules, newRule]);
    setShowMenu(false);
  };

  const updateRule = (i, updated) => { const next = [...rules]; next[i] = updated; onChange(next); };
  const deleteRule = (i) => onChange(rules.filter((_, idx) => idx !== i));
  const moveRule = (i, dir) => {
    const next = [...rules];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  if (rules.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-center py-6 rounded-lg" style={{ border: '1px dashed rgba(202,220,252,0.15)', color: '#475569' }}>
          <div className="text-2xl mb-2">⚙️</div>
          <div className="text-sm">No processing rules yet</div>
          <div className="text-xs mt-1">Add rules to transform data as it flows through this synapse</div>
        </div>
        <AddRuleButton showMenu={showMenu} setShowMenu={setShowMenu} addRule={addRule} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] mb-1" style={{ color: '#475569' }}>Rules execute top to bottom. Disable individual rules without deleting them.</div>
      {rules.map((r, i) => (
        <RuleCard key={r.id || i} rule={r} index={i} total={rules.length}
          onChange={u => updateRule(i, u)} onDelete={deleteRule} onMove={moveRule} />
      ))}
      <AddRuleButton showMenu={showMenu} setShowMenu={setShowMenu} addRule={addRule} />
    </div>
  );
}

function AddRuleButton({ showMenu, setShowMenu, addRule }) {
  return (
    <div className="relative">
      <button onClick={() => setShowMenu(m => !m)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border w-full justify-center"
        style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#64748b', background: 'rgba(30,39,97,0.2)' }}>
        <Plus className="w-3.5 h-3.5" /> Add Processing Rule
      </button>
      {showMenu && (
        <div className="absolute left-0 right-0 z-20 rounded-lg overflow-hidden shadow-xl mt-1"
          style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(202,220,252,0.15)' }}>
          {RULE_TYPES.map(t => (
            <button key={t} onClick={() => addRule(t)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors"
              style={{ color: '#CADCFC', borderBottom: '1px solid rgba(202,220,252,0.05)' }}>
              <span>{RULE_ICONS[t]}</span>
              <span className="font-medium" style={{ color: RULE_COLORS[t] }}>{t}</span>
              <span className="ml-auto text-[10px]" style={{ color: '#475569' }}>
                {t === 'Formula' && 'Calculate values'}
                {t === 'Filter' && 'Restrict records'}
                {t === 'Aggregate' && 'SUM / COUNT / AVG'}
                {t === 'Transform' && 'Format & rename'}
                {t === 'Conditional' && 'IF / THEN / ELSE'}
                {t === 'Validate' && 'Check data quality'}
                {t === 'Enrich' && 'Add from lookup'}
                {t === 'Lookup' && 'Pull reference data'}
                {t === 'Alert' && 'Notify on condition'}
                {t === 'Format' && 'Output template'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}