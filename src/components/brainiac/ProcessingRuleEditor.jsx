import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, Trash2, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';

const RULE_TYPES = ['Formula', 'Filter', 'Aggregate', 'Transform', 'Enrich', 'Validate', 'Format', 'Conditional', 'Lookup', 'Alert'];
const RULE_COLORS = { Formula: '#a78bfa', Filter: '#f59e0b', Aggregate: '#10b981', Transform: '#06b6d4', Enrich: '#0ea5e9', Validate: '#ec4899', Format: '#84cc16', Conditional: '#f97316', Lookup: '#8b5cf6', Alert: '#ef4444' };

const PLACEHOLDERS = {
  Formula: 'budget_variance = total_capex - capex_spent\nbudget_pct = (capex_spent / total_capex) * 100',
  Filter: "status != 'Cancelled' AND due_date < today()",
  Aggregate: 'GROUP BY priority\nCOUNT id AS total_count\nSUM capex_impact AS total_impact',
  Transform: 'format date AS "DD MMM YYYY"\nmap status: {"In Progress": "🔵", "Done": "🟢"}',
  Enrich: 'lookup User WHERE id = assignee_id\nadd fields: full_name, org_name',
  Validate: 'npv: not_null → use_default 0\ndue_date: is_future → flag_warning',
  Format: 'summary = "Budget: ${{total_capex}} | Spent: ${{capex_spent}} ({{budget_pct}}%)"',
  Conditional: 'IF budget_pct > 100 THEN cost_rag = "Red"\nIF budget_pct > 90 THEN cost_rag = "Amber"\nELSE cost_rag = "Green"',
  Lookup: 'FROM QualityGate WHERE phase = current_phase\nRETURN gate_date, readiness_pct',
  Alert: 'IF contingency_pct < 50\nALERT "Contingency below 50%: {{contingency_pct}}%"\nNOTIFY Platform Admin, Project Manager',
};

function RuleCard({ rule, index, total, onChange, onDelete, onMove }) {
  const [open, setOpen] = useState(true);
  const color = RULE_COLORS[rule.rule_type] || '#6366f1';

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: `${color}44`, background: 'rgba(15,23,42,0.7)' }}>
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" style={{ background: `${color}18` }} onClick={() => setOpen(o => !o)}>
        <GripVertical className="w-4 h-4" style={{ color: '#475569' }} />
        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}33`, color }}>{rule.rule_type}</span>
        <span className="text-sm font-medium flex-1" style={{ color: '#CADCFC' }}>{rule.rule_name || 'Unnamed Rule'}</span>
        <button onClick={(e) => { e.stopPropagation(); onChange({ ...rule, is_active: !rule.is_active }); }}>
          {rule.is_active ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMove(index, -1); }} disabled={index === 0} className="disabled:opacity-30">
          <ChevronUp className="w-4 h-4" style={{ color: '#94a3b8' }} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMove(index, 1); }} disabled={index === total - 1} className="disabled:opacity-30">
          <ChevronDown className="w-4 h-4" style={{ color: '#94a3b8' }} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(index); }}>
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: '#64748b' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#64748b' }} />}
      </div>
      {open && (
        <div className="p-3 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium mb-1 block" style={{ color: '#64748b' }}>RULE TYPE</label>
              <Select value={rule.rule_type} onValueChange={v => onChange({ ...rule, rule_type: v })}>
                <SelectTrigger className="h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-medium mb-1 block" style={{ color: '#64748b' }}>RULE NAME</label>
              <Input
                value={rule.rule_name}
                onChange={e => onChange({ ...rule, rule_name: e.target.value })}
                className="h-8 text-xs"
                placeholder="Name this rule"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium mb-1 block" style={{ color: '#64748b' }}>EXPRESSION / CONFIG</label>
            <Textarea
              value={rule.rule_config || ''}
              onChange={e => onChange({ ...rule, rule_config: e.target.value })}
              rows={3}
              placeholder={PLACEHOLDERS[rule.rule_type] || ''}
              className="text-xs font-mono"
              style={{ background: 'rgba(5,10,25,0.8)', borderColor: 'rgba(202,220,252,0.15)', color: '#a5f3fc', resize: 'vertical' }}
            />
          </div>
          {rule.description !== undefined && (
            <Input
              value={rule.description || ''}
              onChange={e => onChange({ ...rule, description: e.target.value })}
              className="h-7 text-xs"
              placeholder="Plain-English description (optional)"
              style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.1)', color: '#94a3b8' }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function ProcessingRuleEditor({ rules, onChange }) {
  const addRule = (type) => {
    const newRule = { id: `new_${Date.now()}`, rule_type: type, rule_name: '', rule_config: '', is_active: true, description: '', step_order: rules.length + 1 };
    onChange([...rules, newRule]);
  };

  const updateRule = (i, updated) => {
    const next = [...rules];
    next[i] = updated;
    onChange(next);
  };

  const deleteRule = (i) => onChange(rules.filter((_, idx) => idx !== i));

  const moveRule = (i, dir) => {
    const next = [...rules];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {rules.map((r, i) => (
        <RuleCard key={r.id || i} rule={r} index={i} total={rules.length} onChange={u => updateRule(i, u)} onDelete={deleteRule} onMove={moveRule} />
      ))}
      <div className="flex flex-wrap gap-1 mt-1">
        {RULE_TYPES.map(t => (
          <button
            key={t}
            onClick={() => addRule(t)}
            className="text-[10px] px-2 py-1 rounded border transition-all hover:opacity-80"
            style={{ borderColor: `${RULE_COLORS[t]}44`, color: RULE_COLORS[t], background: `${RULE_COLORS[t]}12` }}
          >
            + {t}
          </button>
        ))}
      </div>
    </div>
  );
}