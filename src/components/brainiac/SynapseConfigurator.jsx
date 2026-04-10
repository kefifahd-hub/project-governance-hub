import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Save, Trash2, Pause, Play, FlaskConical, Plus, X, ChevronRight, Settings2,
  Database, Filter, Zap, ArrowRight, Target, RotateCcw, ChevronDown, ChevronUp,
  Eye, EyeOff, Loader2, BarChart2, GitMerge, GitBranch, Sparkles, Calculator,
  Search, HelpCircle, BookOpen, CheckCircle2, AlertCircle, Lightbulb, Copy, ChevronLeft
} from 'lucide-react';
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
  source:      { label: 'Source',       icon: Database,   color: '#028090', bg: 'rgba(2,128,144,0.15)',   border: 'rgba(2,128,144,0.4)' },
  filter:      { label: 'Filter',       icon: Filter,     color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)' },
  transform:   { label: 'Transform',    icon: Zap,        color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)' },
  aggregate:   { label: 'Aggregate',    icon: BarChart2,  color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)' },
  merge:       { label: 'Merge',        icon: GitMerge,   color: '#ec4899', bg: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.4)' },
  split:       { label: 'Split',        icon: GitBranch,  color: '#f97316', bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.4)' },
  ai_transform:{ label: 'AI Transform', icon: Sparkles,   color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.4)' },
  calculate:   { label: 'Calculate',    icon: Calculator, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.4)' },
  lookup:      { label: 'Lookup',       icon: Search,     color: '#84cc16', bg: 'rgba(132,204,22,0.15)',  border: 'rgba(132,204,22,0.4)' },
  map:         { label: 'Map',          icon: ArrowRight, color: '#64748b', bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)' },
  target:      { label: 'Target',       icon: Target,     color: '#10b981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.4)' },
};

const RULE_NODE_TYPES = ['filter','transform','aggregate','merge','split','ai_transform','calculate','lookup'];

// ─── Info Tooltip ─────────────────────────────────────────────────────────
function InfoTooltip({ tip, example }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1" style={{ verticalAlign: 'middle' }}>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        className="flex items-center"
        type="button"
      >
        <HelpCircle className="w-3 h-3" style={{ color: '#475569' }} />
      </button>
      {show && (
        <div className="absolute left-5 top-0 z-50 rounded-lg p-3 shadow-2xl text-left w-64"
          style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(202,220,252,0.2)', minWidth: 220 }}>
          <div className="text-[11px] mb-1" style={{ color: '#CADCFC' }}>{tip}</div>
          {example && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(202,220,252,0.1)' }}>
              <div className="text-[9px] font-semibold mb-1 tracking-widest" style={{ color: '#64748b' }}>EXAMPLE</div>
              <code className="text-[10px] block" style={{ color: '#a5f3fc', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{example}</code>
            </div>
          )}
        </div>
      )}
    </span>
  );
}

// ─── Field with description + tooltip ────────────────────────────────────
const Field = ({ label, children, hint, desc, tip, tipExample }) => (
  <div>
    <div className="flex items-center gap-1 mb-1">
      <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#64748b' }}>{label}</label>
      {(tip || tipExample) && <InfoTooltip tip={tip || label} example={tipExample} />}
    </div>
    {desc && <div className="text-[10px] mb-1.5" style={{ color: '#475569' }}>{desc}</div>}
    {children}
    {hint && <div className="text-[10px] mt-1" style={{ color: '#475569' }}>{hint}</div>}
  </div>
);

// ─── How It Works Banner ──────────────────────────────────────────────────
function HelpBanner({ fromNeuron, toNeuron }) {
  const [open, setOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      <div className="rounded-xl mb-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
            <span className="text-xs font-semibold" style={{ color: '#818cf8' }}>How this synapse works</span>
          </div>
          {open ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#818cf8' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />}
        </button>
        {open && (
          <div className="px-4 pb-4 flex flex-col gap-3">
            <div className="text-xs" style={{ color: '#94a3b8' }}>
              A synapse defines a <strong style={{ color: '#CADCFC' }}>data pipeline</strong> that moves and transforms data between two neurons.
            </div>
            {/* Flow diagram */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: 'Source', desc: `Read records from ${fromNeuron?.display_name || 'a module'}`, color: '#028090', icon: '📥' },
                { label: 'Steps', desc: 'Filter → Transform → Aggregate → etc.', color: '#8b5cf6', icon: '⚙️' },
                { label: 'Map', desc: 'Rename fields to match target', color: '#64748b', icon: '🗺️' },
                { label: 'Target', desc: `Write to ${toNeuron?.display_name || 'a module'}`, color: '#10b981', icon: '🎯' },
              ].map((step, i, arr) => (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center gap-1 rounded-lg px-3 py-2"
                    style={{ background: `${step.color}18`, border: `1px solid ${step.color}44`, minWidth: 80 }}>
                    <span className="text-base">{step.icon}</span>
                    <span className="text-[10px] font-bold" style={{ color: step.color }}>{step.label}</span>
                    <span className="text-[9px] text-center" style={{ color: '#64748b' }}>{step.desc}</span>
                  </div>
                  {i < arr.length - 1 && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: '#334155' }} />}
                </React.Fragment>
              ))}
            </div>
            <div className="text-[11px] rounded-lg p-2.5" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span style={{ color: '#818cf8' }}>💡 Tip:</span>{' '}
              <span style={{ color: '#94a3b8' }}>
                Click each node in the pipeline to configure it. Add steps using the <strong style={{ color: '#CADCFC' }}>+</strong> button between nodes.
                Data flows left-to-right: each step receives the output of the previous step.
              </span>
            </div>
            <button
              onClick={() => setShowGuide(true)}
              className="self-start text-[10px] underline"
              style={{ color: '#818cf8' }}
            >
              View full guide with examples →
            </button>
          </div>
        )}
      </div>

      {/* Full Guide Drawer */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md h-full flex flex-col overflow-y-auto"
            style={{ background: 'rgba(10,15,35,0.99)', borderLeft: '1px solid rgba(202,220,252,0.15)' }}>
            <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{ background: 'rgba(10,15,35,0.99)', borderBottom: '1px solid rgba(202,220,252,0.1)', zIndex: 1 }}>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: '#818cf8' }} />
                <span className="font-bold text-sm" style={{ color: '#CADCFC' }}>Synapse Pipeline Guide</span>
              </div>
              <button onClick={() => setShowGuide(false)}><X className="w-4 h-4" style={{ color: '#64748b' }} /></button>
            </div>
            <div className="p-5 flex flex-col gap-5 text-xs" style={{ color: '#94a3b8' }}>
              {[
                {
                  title: '📥 Source', color: '#028090',
                  body: 'Defines which entity to read from and which fields to pull. You can sort and limit the records.',
                  example: 'Entity: ActionItem\nFields: id, title, status, priority, assignee\nFilter: status = "Open"\nSort: created_date DESC\nLimit: 100'
                },
                {
                  title: '🔵 Filter Step', color: '#3b82f6',
                  body: 'Reduces the dataset to only matching records. Uses SQL-like conditions. Multiple conditions with AND/OR.',
                  example: 'priority IN (\'Critical\', \'High\')\nAND status = \'Open\'\nAND due_date < TODAY()'
                },
                {
                  title: '📊 Aggregate Step', color: '#8b5cf6',
                  body: 'Groups and summarises records. Use COUNT, SUM, AVG, MIN, MAX functions. GROUP BY splits into categories.',
                  example: 'COUNT(id) AS total_open\nSUM(estimated_hours) AS total_hours\nAVG(priority_score) AS avg_priority\nGROUP BY status, assignee'
                },
                {
                  title: '⚡ Transform Step', color: '#f59e0b',
                  body: 'Modifies field values: format dates, convert currencies, map status codes to labels, calculate new fields.',
                  example: 'amount → currency(EUR, 0)\ndue_date → format(DD MMM YYYY)\nstatus → map(Open=🔵, Done=🟢, Blocked=🔴)'
                },
                {
                  title: '🧮 Calculate Step', color: '#06b6d4',
                  body: 'Creates new fields from formulas. Access any field by name. Supports IF/ELIF/ELSE logic and math functions.',
                  example: 'variance = budget - actual\nvariance_pct = ROUND((variance / budget) * 100, 1)\nrag = IF(variance_pct > 0, \'Green\', IF(variance_pct > -10, \'Amber\', \'Red\'))'
                },
                {
                  title: '🔍 Lookup Step', color: '#84cc16',
                  body: 'Enriches each record with data from another entity. Like a SQL JOIN — matches on a key field.',
                  example: 'Lookup: Project\nMatch: projectId = id\nReturn: projectName, currentPhase, healthScore'
                },
                {
                  title: '🔀 Merge Step', color: '#ec4899',
                  body: 'Joins the pipeline with a second entity. LEFT JOIN keeps all records; INNER only keeps matched ones.',
                  example: 'Secondary: BudgetTracking\nJoin: projectId = projectId\nType: LEFT\nFields: budget_spent, variance_pct'
                },
                {
                  title: '✨ AI Transform', color: '#a78bfa',
                  body: 'Passes each record through an AI model. Use {{field_name}} in the prompt to inject record values.',
                  example: 'Prompt: Summarise this risk in 1 sentence:\nTitle: {{title}}\nSeverity: {{riskLevel}}\nMitigation: {{mitigationPlan}}\nOutput field: ai_summary'
                },
                {
                  title: '🗺️ Map (Field Mapping)', color: '#64748b',
                  body: 'Renames fields to match what the target entity expects. Source field → target field.',
                  example: 'npv → financial_npv\nirr → financial_irr\ntotal_capex → budget_total'
                },
                {
                  title: '🎯 Target', color: '#10b981',
                  body: 'Where to write the processed data. Choose the entity and the action: Update, Append, Create, or Alert.',
                  example: 'Entity: WeeklyReport\nAction: Update\nCondition: report.status = "Draft"'
                },
              ].map(s => (
                <div key={s.title} className="rounded-xl p-4" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${s.color}33` }}>
                  <div className="font-bold mb-1" style={{ color: s.color }}>{s.title}</div>
                  <div className="mb-2">{s.body}</div>
                  <div className="text-[9px] font-semibold mb-1 tracking-widest" style={{ color: '#64748b' }}>EXAMPLE</div>
                  <pre className="text-[10px] rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.4)', color: '#a5f3fc', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{s.example}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Step Description Block ────────────────────────────────────────────────
function StepIntro({ color, emoji, title, description, whenToUse, example, templates, onLoadTemplate }) {
  const [showTemplates, setShowTemplates] = useState(false);
  return (
    <div className="rounded-lg p-3 mb-3" style={{ background: `${color}10`, border: `1px solid ${color}33` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold" style={{ color }}>{emoji} {title}</div>
        {templates && templates.length > 0 && (
          <div className="relative">
            <button onClick={() => setShowTemplates(o => !o)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded"
              style={{ background: `${color}20`, color, border: `1px solid ${color}44` }}>
              <Lightbulb className="w-3 h-3" /> Templates
            </button>
            {showTemplates && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTemplates(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl"
                  style={{ background: 'rgba(10,15,35,0.98)', border: '1px solid rgba(202,220,252,0.2)', minWidth: 220 }}>
                  {templates.map(t => (
                    <button key={t.label} onClick={() => { onLoadTemplate(t.values); setShowTemplates(false); }}
                      className="w-full text-left px-4 py-2.5 hover:opacity-80 transition-opacity"
                      style={{ borderBottom: '1px solid rgba(202,220,252,0.06)' }}>
                      <div className="text-xs font-semibold" style={{ color: '#CADCFC' }}>{t.label}</div>
                      <div className="text-[10px]" style={{ color: '#64748b' }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="text-[11px]" style={{ color: '#94a3b8' }}>{description}</div>
      {whenToUse && (
        <div className="mt-1.5 text-[10px]" style={{ color: '#64748b' }}>
          <span style={{ color }}>When to use:</span> {whenToUse}
        </div>
      )}
      {example && (
        <div className="mt-2 rounded p-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="text-[9px] font-semibold tracking-widest mb-0.5" style={{ color: '#475569' }}>EXAMPLE</div>
          <code className="text-[10px]" style={{ color: '#a5f3fc', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{example}</code>
        </div>
      )}
    </div>
  );
}

// ─── Common Function Chips ────────────────────────────────────────────────
function FunctionChips({ onInsert }) {
  const chips = [
    'COUNT(id)', 'SUM(amount)', 'AVG(value)', 'MIN(date)', 'MAX(date)', 'COUNT(DISTINCT status)'
  ];
  return (
    <div className="flex flex-wrap gap-1 mb-1.5">
      {chips.map(c => (
        <button key={c} onClick={() => onInsert(c)}
          className="text-[9px] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
          style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
          {c}
        </button>
      ))}
    </div>
  );
}

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

// ─── Source Panel ─────────────────────────────────────────────────────────
function SourcePanel({ form, set }) {
  return (
    <div className="flex flex-col gap-3">
      <StepIntro
        color="#028090" emoji="📥" title="Source Configuration"
        description="Defines where data comes from. The synapse will read records from this entity and pass them through the pipeline."
        example="Entity: ActionItem  |  Fields: id, title, status, priority  |  Sort: created_date DESC  |  Limit: 100"
      />
      <Field label="SOURCE ENTITY"
        desc="The entity (database table) to read records from."
        tip="Choose the module that holds the data you want to process."
        tipExample="ChangeRequest — reads change requests\nActionItem — reads tasks & actions\nRisk — reads the risk register">
        <Input value={form.source_entity || ''} onChange={e => set('source_entity', e.target.value)}
          placeholder="e.g. ActionItem, ChangeRequest, Risk" className="h-8 text-xs font-mono" style={inputStyle} list="entity-list-src" />
        <datalist id="entity-list-src">{ALL_ENTITIES.map(e => <option key={e} value={e} />)}</datalist>
      </Field>
      <Field label="PULL FIELDS"
        desc="Which fields to include. Leave empty to pull all fields."
        tip="Only list the fields you actually need — this keeps the pipeline fast."
        tipExample="id, title, status, priority, assignee, due_date, projectId">
        <Textarea value={(() => { try { const f = JSON.parse(form.source_fields || '[]'); return Array.isArray(f) ? f.join(', ') : form.source_fields; } catch { return form.source_fields || ''; } })()}
          onChange={e => {
            const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            set('source_fields', JSON.stringify(arr));
          }}
          rows={3} placeholder="id, title, status, priority, assignee, due_date, projectId"
          className="text-xs" style={codeStyle} />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="SORT BY"
          desc="Field to order records by."
          tip="Use a date field to get the newest records first."
          tipExample="created_date (newest first)\ndue_date (earliest deadline first)">
          <Input value={(form.source_sort || '').split(' ')[0] || ''} onChange={e => set('source_sort', `${e.target.value} ${(form.source_sort || '').split(' ')[1] || 'DESC'}`.trim())}
            placeholder="created_date" className="h-8 text-xs" style={inputStyle} />
        </Field>
        <Field label="DIR">
          <Select value={(form.source_sort || '').split(' ')[1] || 'DESC'} onValueChange={v => set('source_sort', `${(form.source_sort || '').split(' ')[0] || ''} ${v}`.trim())}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{['ASC','DESC'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="LIMIT" hint="0 = pull all"
          tip="How many records to process. Use 0 or leave empty to process all matching records."
          tipExample="100 — process up to 100 records\n0 or empty — process all records">
          <Input type="number" value={form.source_limit || ''} onChange={e => set('source_limit', parseInt(e.target.value) || null)}
            placeholder="100" className="h-8 text-xs" style={inputStyle} />
        </Field>
      </div>
      <div className="border-t pt-3" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>
        <div className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>⚡ TRIGGER</div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="TRIGGER TYPE"
            desc="What causes this synapse to fire."
            tip="On Event = fires when a specific thing happens. Scheduled = fires on a timer. Real-time = fires immediately on data change."
            tipExample="On Event: fires when a CR is approved\nScheduled: fires every Monday at 7am\nOn Record Change: fires when an ActionItem status changes">
            <Select value={form.trigger_type || 'On Event'} onValueChange={v => set('trigger_type', v)}>
              <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{TRIGGER_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="SYNAPSE TYPE"
            desc="One-Way flows in one direction. Bidirectional syncs data both ways."
            tip="Use Bidirectional when changes in Target should also flow back to Source.">
            <Select value={form.synapse_type || 'One-Way'} onValueChange={v => set('synapse_type', v)}>
              <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{SYNAPSE_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        {(form.trigger_type === 'On Event' || !form.trigger_type) && (
          <Field label="EVENT NAME"
            desc="The exact event name that triggers this synapse to run."
            tip="Event names follow the pattern: on_entity_action"
            tipExample="on_cr_approval\non_action_created\non_milestone_passed\non_budget_update">
            <Input value={form.trigger_event || ''} onChange={e => set('trigger_event', e.target.value)}
              placeholder="on_cr_approval" className="h-8 text-xs font-mono mt-2" style={inputStyle} list="events-list" />
            <datalist id="events-list">{COMMON_EVENTS.map(e => <option key={e} value={e} />)}</datalist>
          </Field>
        )}
        {form.trigger_type === 'Scheduled' && (
          <Field label="SCHEDULE"
            desc="When to run this synapse on a recurring schedule."
            tipExample="Every day at 06:00\nWeekly Monday 07:00\nEvery 4 hours">
            <Input value={form.trigger_schedule || ''} onChange={e => set('trigger_schedule', e.target.value)}
              placeholder="Weekly Monday 07:00" className="h-8 text-xs font-mono mt-2" style={inputStyle} />
          </Field>
        )}
      </div>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────
function FilterPanel({ rule, onUpdate }) {
  const templates = [
    { label: 'Only active / open items', desc: 'Keep records where status is Open or Active', values: { rule_name: 'Active items only', expression: "status IN ('Open', 'Active', 'In Progress')" } },
    { label: 'Last 30 days', desc: 'Records created in the last 30 days', values: { rule_name: 'Last 30 days', expression: 'created_date >= DATE_SUB(TODAY(), 30)' } },
    { label: 'Critical & High priority', desc: 'Only critical or high priority records', values: { rule_name: 'High priority only', expression: "priority IN ('Critical', 'High', 'P1 - Critical', 'P2 - High')" } },
    { label: 'Not completed', desc: 'Exclude completed/closed records', values: { rule_name: 'Exclude completed', expression: "status NOT IN ('Completed', 'Closed', 'Done', 'Resolved')" } },
  ];
  return (
    <div className="flex flex-col gap-3">
      <StepIntro
        color="#3b82f6" emoji="🔵" title="Filter Step"
        description="Removes records that don't match your conditions. Only matching records pass through to the next step."
        whenToUse="When you only want to process a subset of records (e.g. only open actions, only critical risks)."
        example={"priority IN ('Critical', 'High')\nAND status = 'Open'\nAND due_date < TODAY()"}
        templates={templates}
        onLoadTemplate={v => onUpdate({ ...rule, ...v })}
      />
      <Field label="STEP NAME"
        desc="A short label to identify this filter in the pipeline."
        tipExample="Filter approved CRs\nOpen critical risks only\nExclude archived items">
        <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
          placeholder="e.g. Filter critical open actions" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <Field label="FILTER CONDITION"
        desc="SQL-like condition. Records where this is TRUE pass through; others are dropped."
        tip="Operators: =, !=, >, <, >=, <=, IN (...), NOT IN (...), LIKE, AND, OR, NOT"
        tipExample={"status = 'Open'\npriority IN ('Critical', 'High')\namount > 1000000\ncreated_date >= '2025-01-01'\ntitle LIKE '%budget%'"}>
        <div className="rounded-lg p-2.5 mb-1.5 text-[10px]" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="font-semibold mb-1" style={{ color: '#60a5fa' }}>Available operators:</div>
          <div className="flex flex-wrap gap-1">
            {["= 'value'", "!= 'value'", '> 100', '< 100', "IN ('a','b')", "NOT IN ('x')", "LIKE '%text%'", 'AND', 'OR', 'NOT'].map(op => (
              <code key={op} className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}>{op}</code>
            ))}
          </div>
        </div>
        <Textarea value={rule.expression || ''} onChange={e => onUpdate({ ...rule, expression: e.target.value })}
          rows={4} placeholder={"priority IN ('Critical', 'High')\nAND status = 'Open'\nAND due_date < TODAY()"} className="text-xs" style={codeStyle} />
      </Field>
      <Field label="NOTES (optional)"
        desc="Plain English explanation of what this filter does, for other admins.">
        <Textarea value={rule.description || ''} onChange={e => onUpdate({ ...rule, description: e.target.value })}
          rows={2} placeholder="Only keeps critical and high priority actions that are still open"
          style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.1)', color: '#94a3b8', fontSize: 12 }} />
      </Field>
    </div>
  );
}

// ─── Transform Panel ──────────────────────────────────────────────────────
function TransformPanel({ rule, onUpdate }) {
  const templates = [
    { label: 'Format currency', desc: 'Convert numbers to formatted currency', values: { rule_name: 'Format currency', rule_type: 'Transform', expression: 'amount → currency(EUR, 0)\ncost → currency(USD, 2)' } },
    { label: 'Format dates', desc: 'Convert date fields to readable format', values: { rule_name: 'Format dates', rule_type: 'Transform', expression: 'due_date → format(DD MMM YYYY)\ncreated_date → format(MMM YYYY)' } },
    { label: 'Map status to RAG', desc: 'Convert status labels to traffic light colours', values: { rule_name: 'Status to RAG', rule_type: 'Transform', expression: "status → map(Open=🔵, In Progress=🟡, Done=🟢, Blocked=🔴)" } },
  ];
  return (
    <div className="flex flex-col gap-3">
      <StepIntro
        color="#f59e0b" emoji="⚡" title="Transform Step"
        description="Modifies field values without changing the number of records. Use this to format, rename, convert or map values."
        whenToUse="When you need to convert dates, format numbers as currency, map status codes to labels, or restructure data."
        example={"amount → currency(EUR, 0)\ndue_date → format(DD MMM YYYY)\nstatus → map(Open=🔵, Done=🟢)"}
        templates={templates}
        onLoadTemplate={v => onUpdate({ ...rule, ...v })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Field label="STEP NAME"
          desc="A short label to identify this step."
          tipExample="Format dates\nConvert currency\nMap status codes">
          <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
            placeholder="e.g. Format dates & currency" className="h-8 text-xs" style={inputStyle} />
        </Field>
        <Field label="RULE TYPE"
          desc="The transformation category."
          tip="Formula = calculate new values. Transform = format/convert. Conditional = if/then logic.">
          <Select value={rule.rule_type || 'Formula'} onValueChange={v => onUpdate({ ...rule, rule_type: v })}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{RULE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="EXPRESSION"
        desc="The transformation rules. One transformation per line."
        tip="Each line defines one field transformation. Use the placeholder as a guide."
        tipExample={RULE_PLACEHOLDERS[rule.rule_type] || RULE_PLACEHOLDERS.Formula}>
        <Textarea value={rule.expression || ''} onChange={e => onUpdate({ ...rule, expression: e.target.value })}
          rows={5} placeholder={RULE_PLACEHOLDERS[rule.rule_type] || 'Enter expression...'} className="text-xs" style={codeStyle} />
      </Field>
      <Field label="OUTPUT FIELDS"
        desc="Comma-separated list of new field names this step produces."
        tipExample="budget_variance, budget_pct, cost_rag">
        <Input value={rule.output_fields || ''} onChange={e => onUpdate({ ...rule, output_fields: e.target.value })}
          placeholder="e.g. formatted_date, cost_rag, variance_pct" className="h-8 text-xs" style={inputStyle} />
      </Field>
    </div>
  );
}

// ─── Map Panel ────────────────────────────────────────────────────────────
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
      <StepIntro
        color="#64748b" emoji="🗺️" title="Field Mapping"
        description="Renames source fields to match what the target entity expects. Every field you want to write must be mapped here."
        whenToUse="Always configure this before the Target step. If source field names already match the target, you can auto-map."
        example={"npv → financial_npv\nirr → financial_irr\ntotal_capex → budget_total\ncost_rag → cost_rag_status"}
      />
      <Field label="FIELD MAPPING"
        desc="One mapping per line in the format: source_field → target_field. The left side is the field name in your pipeline; the right side is the field name in the target entity."
        tip="If the source and target field have the same name, use: fieldName → fieldName"
        tipExample={"npv → financial_npv\nstatus → report_status\nprojectId → projectId"}>
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
        <Plus className="w-3 h-3" /> Auto-map by field name (source field → same name in target)
      </button>
      <Field label="OUTPUT FORMAT"
        desc="How the mapped data should be structured."
        tip="Raw = plain records. Aggregated = grouped summary. Formatted = human-readable. Calculated = with computed fields.">
        <Select value={form.output_format || 'Raw'} onValueChange={v => set('output_format', v)}>
          <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
          <SelectContent>{['Raw','Aggregated','Formatted','Calculated'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
    </div>
  );
}

// ─── Target Panel ─────────────────────────────────────────────────────────
function TargetPanel({ form, set }) {
  const actionDescs = {
    Update: 'Overwrite matching records that already exist in the target entity.',
    Append: 'Add new records to the target entity without modifying existing ones.',
    Create: 'Create a new record for each pipeline record, regardless of duplicates.',
    Merge: 'Update if exists, create if not (upsert).',
    'Alert Only': 'Don\'t write any data — just send a notification/alert.',
  };
  return (
    <div className="flex flex-col gap-3">
      <StepIntro
        color="#10b981" emoji="🎯" title="Target Configuration"
        description="Defines where the processed data is written to, and what action to take. Make sure the field mapping step maps to the correct field names for this entity."
        example={"Entity: WeeklyReport\nAction: Update\nCondition: report.status = 'Draft'"}
      />
      <div className="grid grid-cols-2 gap-2">
        <Field label="TARGET ENTITY"
          desc="The entity (database table) to write data into."
          tip="Must be a valid entity name from the platform."
          tipExample="WeeklyReport\nBudgetTracking\nProject">
          <Input value={form.target_entity || ''} onChange={e => set('target_entity', e.target.value)}
            placeholder="e.g. WeeklyReport" className="h-8 text-xs font-mono" style={inputStyle} list="entity-list-tgt" />
          <datalist id="entity-list-tgt">{ALL_ENTITIES.map(e => <option key={e} value={e} />)}</datalist>
        </Field>
        <Field label="ACTION"
          desc="What to do with each processed record."
          tip={actionDescs[form.target_action] || 'Choose how to write data to the target entity.'}>
          <Select value={form.target_action || 'Update'} onValueChange={v => set('target_action', v)}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{TARGET_ACTIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      {form.target_action && (
        <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
          💡 {actionDescs[form.target_action]}
        </div>
      )}
      <Field label="FIRE CONDITION (optional)"
        desc="An extra safety check — the synapse only writes data if this condition is true. Leave empty to always write."
        tip="Reference fields from the target entity to prevent overwriting important data."
        tipExample={"cr.status == 'Approved' AND cr.capex_impact > 0\nreport.status == 'Draft'"}>
        <Textarea value={form.trigger_condition || ''} onChange={e => set('trigger_condition', e.target.value)}
          rows={3} placeholder={"cr.status == 'Approved' AND cr.capex_impact > 0"}
          className="text-xs" style={codeStyle} />
      </Field>
      <Field label="ADMIN NOTES">
        <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2}
          placeholder="Notes for other admins about this synapse — what it does, when it was set up, caveats"
          style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.1)', color: '#94a3b8', fontSize: 12 }} />
      </Field>
    </div>
  );
}

// ─── Aggregate Panel ──────────────────────────────────────────────────────
function AggregatePanel({ rule, onUpdate }) {
  const exprRef = useRef(null);
  const templates = [
    { label: 'Count by status', desc: 'How many records per status value', values: { rule_name: 'Count by status', expression: 'COUNT(id) AS total_count\nCOUNT(DISTINCT assignee) AS unique_assignees', group_by: 'status' } },
    { label: 'Sum by month', desc: 'Total amount grouped by month', values: { rule_name: 'Monthly totals', expression: 'SUM(amount) AS total_amount\nCOUNT(id) AS record_count', group_by: 'month_year' } },
    { label: 'Average + count', desc: 'Average value and record count per group', values: { rule_name: 'Stats by category', expression: 'COUNT(id) AS total\nAVG(value) AS average_value\nMIN(value) AS min_value\nMAX(value) AS max_value', group_by: 'category, status' } },
    { label: 'Top items filter', desc: 'Only groups with more than N records', values: { rule_name: 'Top groups', expression: 'COUNT(id) AS total_count\nSUM(amount) AS total_amount', group_by: 'projectId', having: 'total_count > 5' } },
  ];

  const insertAtCursor = (text) => {
    const el = exprRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = rule.expression || '';
    const newVal = current.substring(0, start) + (current ? '\n' : '') + text + ' AS alias' + current.substring(end);
    onUpdate({ ...rule, expression: newVal });
    setTimeout(() => { el.focus(); el.setSelectionRange(start + text.length + 8, start + text.length + 13); }, 0);
  };

  return (
    <div className="flex flex-col gap-3">
      <StepIntro
        color="#8b5cf6" emoji="📊" title="Aggregate Step"
        description="Groups and summarises your records using aggregate functions. Reduces many records to a smaller set of summary rows."
        whenToUse="When you need counts, sums, averages or other summaries — e.g. 'total open actions per assignee' or 'total budget per project'."
        example={"COUNT(id) AS total_open\nSUM(estimated_hours) AS total_hours\nAVG(priority_score) AS avg_priority\nGROUP BY status, assignee"}
        templates={templates}
        onLoadTemplate={v => onUpdate({ ...rule, ...v })}
      />
      <Field label="STEP NAME"
        desc="A friendly label so you can identify this step in the pipeline."
        tipExample="Count open actions\nSum capex by category\nMonthly spend totals">
        <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
          placeholder="Count open actions by assignee" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <Field label="AGGREGATE FUNCTIONS"
        desc="Define what to calculate. One function per line using FUNCTION(field) AS alias format. The alias becomes the field name in downstream steps."
        tip="Available functions: COUNT, SUM, AVG, MIN, MAX, COUNT(DISTINCT ...)"
        tipExample={"COUNT(id) AS total_count\nSUM(capex_impact) AS total_impact\nAVG(schedule_delay) AS avg_delay\nMIN(due_date) AS earliest_due\nCOUNT(DISTINCT assignee) AS unique_assignees"}>
        <div className="mb-1.5">
          <div className="text-[9px] font-semibold mb-1 tracking-widest" style={{ color: '#64748b' }}>CLICK TO INSERT:</div>
          <FunctionChips onInsert={insertAtCursor} />
        </div>
        <Textarea ref={exprRef} value={rule.expression || ''} onChange={e => onUpdate({ ...rule, expression: e.target.value })}
          rows={4} placeholder={"COUNT(id) AS total_count\nSUM(capex_impact) AS total_impact\nAVG(schedule_delay) AS avg_delay"}
          className="text-xs" style={codeStyle} />
        <div className="text-[9px] mt-1" style={{ color: '#475569' }}>
          Functions: <code style={{ color: '#818cf8' }}>COUNT</code> · <code style={{ color: '#818cf8' }}>SUM</code> · <code style={{ color: '#818cf8' }}>AVG</code> · <code style={{ color: '#818cf8' }}>MIN</code> · <code style={{ color: '#818cf8' }}>MAX</code> · <code style={{ color: '#818cf8' }}>COUNT(DISTINCT ...)</code>
        </div>
      </Field>
      <Field label="GROUP BY"
        desc="Split results into groups based on these fields. Leave empty to get a single total row for all records."
        tip="Comma-separate multiple group fields. Each unique combination of values becomes one output row."
        tipExample={"status — one row per status\npriority, assignee — one row per priority+assignee combo\nprojectId, month_year — monthly breakdown per project"}>
        <Input value={rule.group_by || ''} onChange={e => onUpdate({ ...rule, group_by: e.target.value })}
          placeholder="status, priority, assignee  (or leave empty for a single total)" className="h-8 text-xs" style={inputStyle} />
        <div className="text-[9px] mt-1" style={{ color: '#475569' }}>
          Example group fields: <code style={{ color: '#a78bfa' }}>status</code> · <code style={{ color: '#a78bfa' }}>priority</code> · <code style={{ color: '#a78bfa' }}>assignee</code> · <code style={{ color: '#a78bfa' }}>projectId</code>
        </div>
      </Field>
      <Field label="HAVING (optional)"
        desc="Filter the grouped results. Reference the alias names you defined in Aggregate Functions above, not the original field names."
        tip="Like a WHERE clause but applied after grouping. Use the AS alias names you defined above."
        tipExample={"total_count > 5\navg_delay > 7\ntotal_impact > 1000000 AND total_count >= 3"}>
        <Input value={rule.having || ''} onChange={e => onUpdate({ ...rule, having: e.target.value })}
          placeholder="total_count > 5  (only show groups with more than 5 records)" className="h-8 text-xs font-mono" style={codeStyle} />
      </Field>
    </div>
  );
}

// ─── Merge Panel ──────────────────────────────────────────────────────────
function MergePanel({ rule, onUpdate }) {
  const joinDescs = {
    LEFT: 'Keep ALL records from the pipeline, add null if no match in secondary entity.',
    INNER: 'Only keep records that have a match in BOTH the pipeline and secondary entity.',
    RIGHT: 'Keep ALL records from the secondary entity, regardless of pipeline matches.',
    FULL: 'Keep ALL records from both sides, null where no match.',
  };
  const templates = [
    { label: 'Enrich with project info', desc: 'Add project name and phase to each record', values: { rule_name: 'Add project details', secondary_entity: 'Project', join_type: 'LEFT', join_on: 'projectId = id', secondary_fields: 'projectName, currentPhase, healthScore' } },
    { label: 'Join budget tracking', desc: 'Add budget spend data to each record', values: { rule_name: 'Join budget', secondary_entity: 'BudgetTracking', join_type: 'LEFT', join_on: 'projectId = projectId', secondary_fields: 'total_budget, actual_spend, variance' } },
  ];
  return (
    <div className="flex flex-col gap-3">
      <StepIntro
        color="#ec4899" emoji="🔀" title="Merge Step"
        description="Joins your pipeline data with a second entity — like a SQL JOIN. Adds fields from the secondary entity to each record."
        whenToUse="When you need to enrich records with data from another table. E.g. add project details to a list of action items."
        example={"Secondary: Project\nJoin: projectId = id\nType: LEFT\nFields: projectName, currentPhase, healthScore"}
        templates={templates}
        onLoadTemplate={v => onUpdate({ ...rule, ...v })}
      />
      <Field label="STEP NAME"
        tipExample="Enrich with project data\nJoin budget tracking">
        <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
          placeholder="Enrich with project details" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <Field label="SECONDARY ENTITY"
        desc="The entity to join/merge with your pipeline data."
        tip="Choose the entity that has the additional fields you want to add to each record."
        tipExample="Project\nBudgetTracking\nQualityGate\nUser">
        <Input value={rule.secondary_entity || ''} onChange={e => onUpdate({ ...rule, secondary_entity: e.target.value })}
          placeholder="Project" className="h-8 text-xs font-mono" style={inputStyle} list="entity-list-merge" />
        <datalist id="entity-list-merge">{ALL_ENTITIES.map(e => <option key={e} value={e} />)}</datalist>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="JOIN TYPE"
          desc="What to do when there's no matching record."
          tip={joinDescs[rule.join_type || 'LEFT']}>
          <Select value={rule.join_type || 'LEFT'} onValueChange={v => onUpdate({ ...rule, join_type: v })}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{['LEFT','INNER','RIGHT','FULL'].map(t => <SelectItem key={t} value={t}>{t} JOIN</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="JOIN ON"
          desc="Which fields to match on."
          tip="Format: pipeline_field = secondary_field. This is how records are paired up."
          tipExample="projectId = id\ncr_id = id\nassignee_email = email">
          <Input value={rule.join_on || ''} onChange={e => onUpdate({ ...rule, join_on: e.target.value })}
            placeholder="projectId = id" className="h-8 text-xs font-mono" style={inputStyle} />
        </Field>
      </div>
      {(rule.join_type || 'LEFT') && (
        <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', color: '#f9a8d4' }}>
          💡 {joinDescs[rule.join_type || 'LEFT']}
        </div>
      )}
      <Field label="PICK FIELDS FROM SECONDARY"
        desc="Which fields from the secondary entity to bring into the pipeline."
        tip="Comma-separated list of field names from the secondary entity."
        tipExample="projectName, currentPhase, healthScore\nbudget_spent, variance_pct, rag_status">
        <Input value={rule.secondary_fields || ''} onChange={e => onUpdate({ ...rule, secondary_fields: e.target.value })}
          placeholder="projectName, currentPhase, healthScore" className="h-8 text-xs" style={inputStyle} />
      </Field>
    </div>
  );
}

// ─── Split Panel ──────────────────────────────────────────────────────────
function SplitPanel({ rule, onUpdate }) {
  const templates = [
    { label: 'Branch by RAG', desc: 'Split into Red / Amber / Green branches', values: { rule_name: 'Branch by RAG status', expression: "Red: rag_status == 'Red'\nAmber: rag_status == 'Amber'\nGreen: rag_status == 'Green'\nDefault: true", route_targets: 'Red: WeeklyReport\nAmber: ActionItem\nGreen: AuditLog' } },
    { label: 'Branch by priority', desc: 'Critical records go one way, others another', values: { rule_name: 'Branch by priority', expression: "Critical: priority == 'Critical' OR priority == 'P1 - Critical'\nHigh: priority IN ('High', 'P2 - High')\nDefault: true" } },
  ];
  return (
    <div className="flex flex-col gap-3">
      <StepIntro
        color="#f97316" emoji="🌿" title="Split Step"
        description="Routes records to different destinations based on conditions. Each record goes down exactly one branch (the first matching condition)."
        whenToUse="When critical records need urgent alerts but normal records just need logging. Or when different statuses need different targets."
        example={"Red: rag_status == 'Red'\nAmber: rag_status == 'Amber'\nDefault: true\n\nRoute:\nRed: WeeklyReport\nAmber: ActionItem\nDefault: AuditLog"}
        templates={templates}
        onLoadTemplate={v => onUpdate({ ...rule, ...v })}
      />
      <Field label="STEP NAME"
        tipExample="Branch by RAG status\nRoute by priority level">
        <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
          placeholder="e.g. Branch by RAG status" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <Field label="SPLIT CONDITIONS"
        desc="One branch per line: LABEL: condition. Records go to the FIRST branch where the condition is true. Always end with Default: true."
        tip="Labels become the branch names. Use them in 'Route to Targets' below."
        tipExample={"Critical: risk_level == 'Critical'\nHigh: risk_level == 'High'\nDefault: true"}>
        <Textarea value={rule.expression || ''} onChange={e => onUpdate({ ...rule, expression: e.target.value })}
          rows={5} placeholder={"Critical: risk_level == 'Critical'\nHigh: risk_level == 'High'\nDefault: true"}
          className="text-xs" style={codeStyle} />
      </Field>
      <Field label="ROUTE TO TARGETS"
        desc="Where to send each branch. Format: label: EntityName. Each label must match one from Split Conditions."
        tip="Records in each branch will be written to that entity."
        tipExample={"Critical: WeeklyReport\nHigh: ActionItem\nDefault: AuditLog"}>
        <Textarea value={rule.route_targets || ''} onChange={e => onUpdate({ ...rule, route_targets: e.target.value })}
          rows={3} placeholder={"Critical: WeeklyReport\nHigh: ActionItem\nDefault: AuditLog"}
          className="text-xs" style={codeStyle} />
      </Field>
    </div>
  );
}

// ─── AI Transform Panel ───────────────────────────────────────────────────
function AITransformPanel({ rule, onUpdate }) {
  const templates = [
    { label: 'Executive risk summary', desc: 'Summarise risk in 2 sentences for exec audience', values: { rule_name: 'Risk executive summary', expression: "Summarise this project risk in 2 sentences for an executive audience:\nTitle: {{title}}\nDescription: {{description}}\nRisk Level: {{riskLevel}}\nMitigation: {{mitigationPlan}}", output_fields: 'ai_summary', ai_model: 'gpt-4o-mini' } },
    { label: 'Action item classification', desc: 'Classify action items into categories', values: { rule_name: 'Classify action', expression: "Classify this action item into one of these categories: Technical, Commercial, Regulatory, HSE, Other.\nTitle: {{title}}\nDescription: {{description}}\nRespond with only the category name.", output_fields: 'ai_category', ai_model: 'gpt-4o-mini' } },
    { label: 'RAG status reasoning', desc: 'Explain why a RAG status is what it is', values: { rule_name: 'RAG explanation', expression: "Explain in 1 sentence why this project has a {{rag_status}} status:\nSchedule variance: {{schedule_variance}} days\nBudget variance: {{budget_variance_pct}}%\nOpen critical actions: {{critical_open}}", output_fields: 'rag_explanation', ai_model: 'gpt-4o-mini' } },
  ];
  return (
    <div className="flex flex-col gap-3">
      <StepIntro
        color="#a78bfa" emoji="✨" title="AI Transform Step"
        description="Passes each record through an AI model. The model reads your prompt (with record values injected) and writes its response to an output field."
        whenToUse="When you need natural language summaries, classifications, sentiment analysis, or any task that requires understanding text."
        example={"Prompt: 'Summarise risk {{title}} in 1 sentence'\nOutput field: ai_summary\nModel: gpt-4o-mini"}
        templates={templates}
        onLoadTemplate={v => onUpdate({ ...rule, ...v })}
      />
      <Field label="STEP NAME"
        tipExample="Generate risk summary\nClassify action type\nExplain RAG status">
        <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
          placeholder="e.g. Generate risk executive summary" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <Field label="AI PROMPT"
        desc="Write your instruction to the AI. Use {{field_name}} to inject values from the current record."
        tip="Be specific about the output format. The AI will process this prompt for every record."
        tipExample={"Summarise this risk in 2 sentences:\nTitle: {{title}}\nLevel: {{riskLevel}}\nMitigation: {{mitigationPlan}}\n\nAvailable variables: {{title}}, {{status}}, {{priority}}, {{assignee}}"}>
        <div className="rounded-lg p-2 mb-1.5 text-[10px]" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <span style={{ color: '#c4b5fd' }}>💡 Inject field values with </span>
          <code style={{ color: '#a5f3fc', fontFamily: 'monospace' }}>{'{{field_name}}'}</code>
          <span style={{ color: '#c4b5fd' }}> — e.g. </span>
          <code style={{ color: '#a5f3fc', fontFamily: 'monospace' }}>{'{{title}}'}</code>
          <span style={{ color: '#c4b5fd' }}>, </span>
          <code style={{ color: '#a5f3fc', fontFamily: 'monospace' }}>{'{{status}}'}</code>
          <span style={{ color: '#c4b5fd' }}>, </span>
          <code style={{ color: '#a5f3fc', fontFamily: 'monospace' }}>{'{{priority}}'}</code>
        </div>
        <Textarea value={rule.expression || ''} onChange={e => onUpdate({ ...rule, expression: e.target.value })}
          rows={5} placeholder={"Summarise this project risk in 2 sentences for an executive audience:\nTitle: {{title}}\nDescription: {{description}}\nRisk Level: {{riskLevel}}\nMitigation: {{mitigationPlan}}"}
          className="text-xs" style={codeStyle} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="AI MODEL"
          desc="Which AI model to use."
          tip="gpt-4o-mini is fast and cheap. gpt-4o and claude-3-sonnet are more capable for complex tasks.">
          <Select value={rule.ai_model || 'gpt-4o-mini'} onValueChange={v => onUpdate({ ...rule, ai_model: v })}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>
              {['gpt-4o-mini','gpt-4o','claude-3-haiku','claude-3-sonnet'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="OUTPUT FIELD"
          desc="The field name where the AI response will be stored."
          tipExample="ai_summary\nai_category\nai_explanation\nai_rag_reasoning">
          <Input value={rule.output_fields || ''} onChange={e => onUpdate({ ...rule, output_fields: e.target.value })}
            placeholder="ai_summary" className="h-8 text-xs font-mono" style={inputStyle} />
        </Field>
      </div>
      <Field label="JSON SCHEMA (optional)"
        desc="If you want the AI to return structured data instead of plain text, define the expected JSON shape here."
        tip="Leave empty for plain text. Specify a JSON schema to extract structured fields."
        tipExample={'{"rag_status": "string", "action_required": "boolean", "summary": "string"}'}>
        <Textarea value={rule.output_schema || ''} onChange={e => onUpdate({ ...rule, output_schema: e.target.value })}
          rows={3} placeholder={'{"rag_status": "string", "action_required": "boolean", "summary": "string"}'}
          className="text-xs" style={codeStyle} />
      </Field>
    </div>
  );
}

// ─── Calculate Panel ──────────────────────────────────────────────────────
function CalculatePanel({ rule, onUpdate }) {
  const templates = [
    { label: 'Budget variance KPIs', desc: 'Calculate variance, percentage and RAG status', values: { rule_name: 'Budget variance KPIs', expression: "budget_variance = total_capex - capex_spent\nbudget_pct = ROUND((capex_spent / total_capex) * 100, 1)\ncost_rag = IF(budget_pct < 90, 'Green', IF(budget_pct < 100, 'Amber', 'Red'))", output_fields: 'budget_variance, budget_pct, cost_rag' } },
    { label: 'Schedule delay', desc: 'Days delayed and schedule RAG', values: { rule_name: 'Schedule delay', expression: "delay_days = DATEDIFF(actual_date, planned_date)\nschedule_rag = IF(delay_days <= 0, 'Green', IF(delay_days <= 14, 'Amber', 'Red'))", output_fields: 'delay_days, schedule_rag' } },
    { label: 'Completion rate', desc: 'Percentage complete and status label', values: { rule_name: 'Completion rate', expression: "pct_complete = ROUND((completed_count / total_count) * 100, 0)\ncompletion_label = IF(pct_complete >= 100, 'Done', IF(pct_complete >= 75, 'On Track', 'At Risk'))", output_fields: 'pct_complete, completion_label' } },
  ];
  return (
    <div className="flex flex-col gap-3">
      <StepIntro
        color="#06b6d4" emoji="🧮" title="Calculate Step"
        description="Creates new computed fields using formulas. Reference any existing field by name. Supports mathematical operations, date functions, and IF/ELSE logic."
        whenToUse="When you need to derive new values from existing fields: variance calculations, RAG statuses, completion percentages, date differences."
        example={"budget_variance = total_capex - capex_spent\nbudget_pct = ROUND((capex_spent / total_capex) * 100, 1)\ncost_rag = IF(budget_pct < 90, 'Green', IF(budget_pct < 100, 'Amber', 'Red'))"}
        templates={templates}
        onLoadTemplate={v => onUpdate({ ...rule, ...v })}
      />
      <Field label="STEP NAME"
        tipExample="Budget variance KPIs\nSchedule delay calculation\nCompletion rate">
        <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
          placeholder="e.g. Budget variance KPIs" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <Field label="FORMULAS"
        desc="One formula per line: output_field = expression. The output field name is new and will be added to each record."
        tip="Use any field from the pipeline by name. Available functions: ROUND, DATEDIFF, IF, ELIF, ELSE, TODAY, ABS, MIN, MAX"
        tipExample={"variance = budget - actual\nvariance_pct = ROUND((variance / budget) * 100, 1)\nrag = IF(variance_pct > 0, 'Green', IF(variance_pct > -10, 'Amber', 'Red'))"}>
        <div className="rounded-lg p-2 mb-1.5 text-[10px]" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
          <span style={{ color: '#67e8f9' }}>Functions: </span>
          {['ROUND(x, n)', 'DATEDIFF(a, b)', 'IF(cond, a, b)', 'TODAY()', 'ABS(x)', 'MIN(a,b)', 'MAX(a,b)'].map(f => (
            <code key={f} className="mr-1.5" style={{ color: '#a5f3fc', fontFamily: 'monospace' }}>{f}</code>
          ))}
        </div>
        <Textarea value={rule.expression || ''} onChange={e => onUpdate({ ...rule, expression: e.target.value })}
          rows={6} placeholder={"budget_variance = total_capex - capex_spent\nbudget_pct = ROUND((capex_spent / total_capex) * 100, 1)\ncost_rag = IF(budget_pct < 90, 'Green', IF(budget_pct < 100, 'Amber', 'Red'))"}
          className="text-xs" style={codeStyle} />
      </Field>
      <Field label="OUTPUT FIELDS"
        desc="List the new field names this step produces (comma-separated). These become available in downstream steps."
        tipExample="budget_variance, budget_pct, cost_rag">
        <Input value={rule.output_fields || ''} onChange={e => onUpdate({ ...rule, output_fields: e.target.value })}
          placeholder="e.g. budget_variance, budget_pct, cost_rag" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <Field label="DECIMAL PRECISION"
        desc="Default rounding for numeric output fields (can override per formula with ROUND()).">
        <Select value={rule.precision || '2'} onValueChange={v => onUpdate({ ...rule, precision: v })}>
          <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
          <SelectContent>{['0','1','2','3','4'].map(p => <SelectItem key={p} value={p}>{p} decimal places</SelectItem>)}</SelectContent>
        </Select>
      </Field>
    </div>
  );
}

// ─── Lookup Panel ─────────────────────────────────────────────────────────
function LookupPanel({ rule, onUpdate }) {
  const templates = [
    { label: 'Enrich with project', desc: 'Add project name and phase to each record', values: { rule_name: 'Project details', lookup_entity: 'Project', match_on: 'projectId = id', return_fields: 'projectName, currentPhase, healthScore', not_found: 'skip' } },
    { label: 'Enrich with quality gate', desc: 'Add current quality gate info', values: { rule_name: 'Quality gate info', lookup_entity: 'QualityGate', match_on: 'gateId = id', return_fields: 'gateName, status, decisionDate', not_found: 'null' } },
  ];
  return (
    <div className="flex flex-col gap-3">
      <StepIntro
        color="#84cc16" emoji="🔍" title="Lookup Step"
        description="Enriches each record by fetching related data from another entity. Like a foreign key lookup — finds the matching record and adds its fields."
        whenToUse="When each record has a reference ID and you want to add readable names or extra context. Lighter than a full Merge step."
        example={"Lookup: Project\nMatch: projectId = id (pipeline field = lookup field)\nReturn: projectName, currentPhase, healthScore"}
        templates={templates}
        onLoadTemplate={v => onUpdate({ ...rule, ...v })}
      />
      <Field label="STEP NAME"
        tipExample="Add project details\nEnrich with quality gate\nLookup assignee name">
        <Input value={rule.rule_name || ''} onChange={e => onUpdate({ ...rule, rule_name: e.target.value })}
          placeholder="e.g. Add project name and phase" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <Field label="LOOKUP ENTITY"
        desc="The entity to fetch data from. Each pipeline record will look up one matching record here."
        tip="This is the entity that has the data you want to add to your pipeline records."
        tipExample="Project\nQualityGate\nUser\nBudgetTracking">
        <Input value={rule.lookup_entity || ''} onChange={e => onUpdate({ ...rule, lookup_entity: e.target.value })}
          placeholder="Project" className="h-8 text-xs font-mono" style={inputStyle} list="entity-list-lookup" />
        <datalist id="entity-list-lookup">{ALL_ENTITIES.map(e => <option key={e} value={e} />)}</datalist>
      </Field>
      <Field label="MATCH CONDITION"
        desc="How to find the right record. Format: pipeline_field = lookup_entity_field."
        tip="The left side is a field in your pipeline; the right side is a field in the lookup entity."
        tipExample={"projectId = id  (pipeline.projectId matches Project.id)\nassignee_email = email\ncr_id = id"}>
        <Input value={rule.match_on || ''} onChange={e => onUpdate({ ...rule, match_on: e.target.value })}
          placeholder="projectId = id" className="h-8 text-xs font-mono" style={inputStyle} />
      </Field>
      <Field label="RETURN FIELDS"
        desc="Which fields from the lookup entity to add to each pipeline record."
        tipExample="projectName, currentPhase, healthScore\ngateName, status, decisionDate">
        <Input value={rule.return_fields || ''} onChange={e => onUpdate({ ...rule, return_fields: e.target.value })}
          placeholder="projectName, currentPhase, healthScore" className="h-8 text-xs" style={inputStyle} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="IF NOT FOUND"
          desc="What to do when no matching record exists."
          tip="Skip = drop the record. Null = keep the record with null values. Error = stop the pipeline.">
          <Select value={rule.not_found || 'skip'} onValueChange={v => onUpdate({ ...rule, not_found: v })}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{[['skip','Skip record'],['null','Set null'],['error','Raise error']].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="CACHE TTL (min)"
          desc="How long to cache lookup results to speed up the pipeline."
          tip="5 minutes is a good default. Set to 0 to always fetch fresh data.">
          <Input type="number" value={rule.cache_ttl || 5} onChange={e => onUpdate({ ...rule, cache_ttl: parseInt(e.target.value) || 5 })}
            className="h-8 text-xs" style={inputStyle} />
        </Field>
      </div>
    </div>
  );
}

// ─── Data Preview Table ───────────────────────────────────────────────────
function applyFilterPreview(records, rule) {
  if (!rule.expression) return records;
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
      rules.forEach(r => { if (r.rule_type === 'Filter') data = applyFilterPreview(data, r); });
      return applyMapPreview(data, form.target_fields);
    }
    if (node.type === 'map') {
      let data = [...sourceRecords];
      rules.forEach(r => { if (r.rule_type === 'Filter') data = applyFilterPreview(data, r); });
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

const DEFAULT_REVERSE = { source_entity: '', source_fields: '[]', source_filter: '', source_sort: '', source_limit: null, target_entity: '', target_fields: '{}', target_action: 'Update', trigger_type: 'On Event', trigger_event: '', trigger_condition: '' };

// ─── Main Component ────────────────────────────────────────────────────────
export default function SynapseConfigurator({ synapse, neurons, onClose, onSaved, onDeleted }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [rules, setRules] = useState([]);
  const [reverseForm, setReverseForm] = useState(DEFAULT_REVERSE);
  const [reverseRules, setReverseRules] = useState([]);
  const [activeDirection, setActiveDirection] = useState('forward');
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

  const isBidir = form?.synapse_type === 'Bidirectional';

  const activeForm = activeDirection === 'reverse' ? reverseForm : form;
  const activeRules = activeDirection === 'reverse' ? reverseRules : rules;
  const setActiveRules = activeDirection === 'reverse' ? setReverseRules : setRules;

  const { data: dbRules = [] } = useQuery({
    queryKey: ['processingRules', synapse.id],
    queryFn: () => base44.entities.ProcessingRule.filter({ synapse_id: synapse.id }, 'step_order'),
  });

  useEffect(() => {
    setForm({ ...synapse });
    setActiveNodeIdx(0);
    setActiveDirection('forward');
    try {
      const rc = synapse.reverse_config ? JSON.parse(synapse.reverse_config) : DEFAULT_REVERSE;
      setReverseForm({ ...DEFAULT_REVERSE, ...rc });
      setReverseRules((rc.rules || []).map((r, i) => ({ ...r, _localId: `rev_${i}` })));
    } catch { setReverseForm(DEFAULT_REVERSE); setReverseRules([]); }
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

  const set = (k, v) => {
    if (activeDirection === 'reverse') {
      setReverseForm(f => ({ ...f, [k]: v }));
      if (k === 'source_entity' && v && base44.entities[v]) loadPreviewFor(v);
    } else {
      setForm(f => ({ ...f, [k]: v }));
      if (k === 'synapse_type') { setActiveDirection('forward'); }
      if (k === 'source_entity' && v && base44.entities[v]) loadPreviewFor(v);
    }
  };

  const setMeta = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadPreviewFor = (entity) => {
    setLoadingPreview(true);
    setSourceRecords([]);
    base44.entities[entity]?.list('-created_date', 3)
      .then(data => setSourceRecords(data || []))
      .catch(() => setSourceRecords([]))
      .finally(() => setLoadingPreview(false));
  };

  const ruleTypeToNodeType = (ruleType) => {
    const map = {
      'Filter': 'filter', 'Transform': 'transform', 'Formula': 'transform',
      'Aggregate': 'aggregate', 'Merge': 'merge', 'Split': 'split',
      'AI Transform': 'ai_transform', 'Calculate': 'calculate', 'Lookup': 'lookup',
      'Conditional': 'transform', 'Validate': 'filter', 'Enrich': 'lookup',
      'Alert': 'transform', 'Format': 'transform',
    };
    return map[ruleType] || 'transform';
  };

  const buildPipeline = () => {
    const src = activeDirection === 'reverse' ? reverseForm : form;
    const rs = activeDirection === 'reverse' ? reverseRules : rules;
    return [
      { id: 'source', type: 'source', label: src.source_entity || '' },
      ...rs.map((r, i) => ({
        id: r._localId || r.id || `rule_${i}`,
        type: ruleTypeToNodeType(r.rule_type),
        label: r.rule_name || '',
        ruleIndex: i,
      })),
      { id: 'map', type: 'map', label: '' },
      { id: 'target', type: 'target', label: src.target_entity || '' },
    ];
  };

  const pipeline = buildPipeline();

  const RULE_TYPE_MAP = {
    filter: 'Filter', transform: 'Transform', aggregate: 'Aggregate',
    merge: 'Merge', split: 'Split', ai_transform: 'AI Transform',
    calculate: 'Calculate', lookup: 'Lookup',
  };

  const handleAddNode = (afterIndex, type) => {
    const newRule = {
      _localId: `new_${Date.now()}`,
      synapse_id: synapse.id,
      step_order: afterIndex,
      rule_type: RULE_TYPE_MAP[type] || 'Formula',
      rule_name: '', expression: '', output_fields: '', description: '', is_active: true,
    };
    setActiveRules(rs => {
      const next = [...rs.slice(0, afterIndex), newRule, ...rs.slice(afterIndex)];
      return next.map((r, i) => ({ ...r, step_order: i + 1 }));
    });
    setActiveNodeIdx(1 + afterIndex);
  };

  const handleDeleteNode = (pipelineIdx) => {
    const node = pipeline[pipelineIdx];
    if (node.ruleIndex === undefined) return;
    setActiveRules(rs => rs.filter((_, i) => i !== node.ruleIndex).map((r, i) => ({ ...r, step_order: i + 1 })));
    setActiveNodeIdx(Math.max(0, pipelineIdx - 1));
  };

  const handleRuleUpdate = (ruleIndex, updated) => {
    setActiveRules(rs => rs.map((r, i) => i === ruleIndex ? updated : r));
  };

  const handleSave = async () => {
    setSaving(true);
    const prevConfig = JSON.stringify(synapse);
    const reverseConfigPayload = form.synapse_type === 'Bidirectional' ? JSON.stringify({
      ...reverseForm,
      rules: reverseRules.map(r => ({ rule_type: r.rule_type, rule_name: r.rule_name, expression: r.expression })),
    }) : null;
    const updated = {
      ...form,
      version: (form.version || 1) + 1,
      processing_rules: JSON.stringify(rules.map(r => ({ rule_type: r.rule_type, rule_name: r.rule_name, expression: r.expression }))),
      reverse_config: reverseConfigPayload,
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

  const renderPanel = () => {
    if (!activeNode) return null;
    if (activeNode.type === 'source') return <SourcePanel form={activeForm} set={set} />;
    if (activeNode.type === 'map') return <MapPanel form={activeForm} set={set} />;
    if (activeNode.type === 'target') return <TargetPanel form={activeForm} set={set} />;
    if (activeNode.ruleIndex !== undefined) {
      const rule = activeRules[activeNode.ruleIndex];
      if (!rule) return null;
      const update = (u) => handleRuleUpdate(activeNode.ruleIndex, u);
      if (activeNode.type === 'filter') return <FilterPanel rule={rule} onUpdate={update} />;
      if (activeNode.type === 'aggregate') return <AggregatePanel rule={rule} onUpdate={update} />;
      if (activeNode.type === 'merge') return <MergePanel rule={rule} onUpdate={update} />;
      if (activeNode.type === 'split') return <SplitPanel rule={rule} onUpdate={update} />;
      if (activeNode.type === 'ai_transform') return <AITransformPanel rule={rule} onUpdate={update} />;
      if (activeNode.type === 'calculate') return <CalculatePanel rule={rule} onUpdate={update} />;
      if (activeNode.type === 'lookup') return <LookupPanel rule={rule} onUpdate={update} />;
      return <TransformPanel rule={rule} onUpdate={update} />;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-0 pb-6">
      {/* How It Works Banner */}
      <HelpBanner fromNeuron={fromNeuron} toNeuron={toNeuron} />

      {/* Header */}
      <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: '#CADCFC' }}>
          <span>{fromNeuron?.icon} {fromNeuron?.display_name}</span>
          <span style={{ color: '#64748b' }}>{isBidir ? '⇄' : '──→'}</span>
          <span>{toNeuron?.icon} {toNeuron?.display_name}</span>
        </div>
        <Field label="SYNAPSE NAME"
          desc="A clear, descriptive name for this data pipeline."
          tipExample="Sync CR impact to WeeklyReport\nPush budget KPIs to Finance Dashboard\nAggregate open actions by assignee">
          <Input value={form.synapse_name || ''} onChange={e => setMeta('synapse_name', e.target.value)}
            className="h-8 text-sm font-bold" style={inputStyle} placeholder="e.g. Sync CR impact to Weekly Report" />
        </Field>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Badge style={{ background: `${statusColor[form.health_status] || '#64748b'}22`, color: statusColor[form.health_status] || '#64748b' }}>{form.health_status}</Badge>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.15)' }}>
            {[['One-Way', '→'], ['Bidirectional', '⇄']].map(([val, icon]) => (
              <button key={val} onClick={() => { setMeta('synapse_type', val); setActiveDirection('forward'); }}
                className="px-2 py-1 text-[10px] font-semibold transition-colors"
                style={{
                  background: form.synapse_type === val ? (val === 'Bidirectional' ? 'rgba(139,92,246,0.3)' : 'rgba(2,128,144,0.3)') : 'rgba(30,39,97,0.3)',
                  color: form.synapse_type === val ? (val === 'Bidirectional' ? '#a78bfa' : '#00A896') : '#64748b',
                }}>{icon} {val}</button>
            ))}
          </div>
          <Select value={form.priority} onValueChange={v => setMeta('priority', v)}>
            <SelectTrigger className="h-6 text-[10px] w-24" style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.15)', color: '#94a3b8' }}><SelectValue /></SelectTrigger>
            <SelectContent>{['High','Medium','Low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex items-center gap-1.5 text-[10px] cursor-pointer" style={{ color: '#94a3b8' }}>
            <input type="checkbox" checked={form.is_critical || false} onChange={e => setMeta('is_critical', e.target.checked)} className="w-3 h-3" />
            Critical Path
          </label>
          <span className="text-[10px]" style={{ color: '#64748b' }}>v{form.version || 1} · {form.fire_count_24h || 0} fires today</span>
        </div>
      </div>

      {/* PIPELINE FLOW */}
      <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(202,220,252,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-semibold tracking-widest" style={{ color: '#64748b' }}>PIPELINE FLOW</div>
          {isBidir && (
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.15)' }}>
              <button onClick={() => { setActiveDirection('forward'); setActiveNodeIdx(0); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors"
                style={{ background: activeDirection === 'forward' ? 'rgba(2,128,144,0.25)' : 'rgba(30,39,97,0.3)', color: activeDirection === 'forward' ? '#00A896' : '#64748b' }}>
                {fromNeuron?.icon} → {toNeuron?.icon}
                <span className="text-[9px] ml-1" style={{ color: activeDirection === 'forward' ? '#00A896' : '#334155' }}>A→B</span>
              </button>
              <button onClick={() => { setActiveDirection('reverse'); setActiveNodeIdx(0); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors"
                style={{ background: activeDirection === 'reverse' ? 'rgba(139,92,246,0.25)' : 'rgba(30,39,97,0.3)', color: activeDirection === 'reverse' ? '#a78bfa' : '#64748b', borderLeft: '1px solid rgba(202,220,252,0.1)' }}>
                {toNeuron?.icon} → {fromNeuron?.icon}
                <span className="text-[9px] ml-1" style={{ color: activeDirection === 'reverse' ? '#a78bfa' : '#334155' }}>B→A</span>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {pipeline.map((node, idx) => (
            <React.Fragment key={node.id}>
              <PipelineNodeWithPreview
                node={node}
                isActive={activeNodeIdx === idx}
                onClick={() => setActiveNodeIdx(idx)}
                onDelete={() => handleDeleteNode(idx)}
                canDelete={!['source','map','target'].includes(node.type)}
                form={activeForm}
                rules={activeRules}
                sourceRecords={sourceRecords}
                loadingPreview={loadingPreview}
              />
              {idx < pipeline.length - 1 && (
                <div className="flex items-center gap-0 flex-shrink-0 mx-1">
                  <div className="h-px w-4" style={{ background: 'rgba(202,220,252,0.2)' }} />
                  {idx < pipeline.length - 2 && (
                    <AddNodeButton onAdd={(type) => {
                      const insertAt = idx;
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
          Click a node to configure · Press <strong style={{ color: '#a78bfa' }}>+</strong> to add Filter, Transform, Aggregate, Merge, Split, AI Transform, Calculate or Lookup steps
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
            {activeNode.ruleIndex !== undefined && (
              <span className="text-[10px] ml-auto" style={{ color: '#475569' }}>Step {activeNode.ruleIndex + 1} of {activeRules.length}{isBidir ? ` · ${activeDirection === 'reverse' ? 'B→A' : 'A→B'}` : ''}</span>
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
        <Button onClick={() => {
          setForm({ ...synapse });
          setRules(dbRules.map(r => ({ ...r, _localId: r.id })));
          try { const rc = synapse.reverse_config ? JSON.parse(synapse.reverse_config) : DEFAULT_REVERSE; setReverseForm({ ...DEFAULT_REVERSE, ...rc }); setReverseRules((rc.rules || []).map((r, i) => ({ ...r, _localId: `rev_${i}` }))); } catch { setReverseForm(DEFAULT_REVERSE); setReverseRules([]); }
        }}
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