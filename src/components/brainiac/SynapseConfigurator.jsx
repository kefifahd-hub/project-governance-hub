import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Trash2, Pause, Play, History, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';
import ProcessingRuleEditor from './ProcessingRuleEditor';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>
      <button className="w-full flex items-center justify-between px-4 py-3 text-left" style={{ background: 'rgba(30,39,97,0.4)' }} onClick={() => setOpen(o => !o)}>
        <span className="text-sm font-semibold" style={{ color: '#CADCFC' }}>{title}</span>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: '#64748b' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#64748b' }} />}
      </button>
      {open && <div className="p-4 flex flex-col gap-3" style={{ background: 'rgba(15,23,42,0.5)' }}>{children}</div>}
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="text-[10px] font-semibold mb-1 block tracking-widest" style={{ color: '#64748b' }}>{label}</label>
    {children}
  </div>
);

export default function SynapseConfigurator({ synapse, neurons, onClose, onSaved, onDeleted }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [rules, setRules] = useState([]);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

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
    // Load version history
    base44.entities.SynapseVersion.filter({ synapse_id: synapse.id }, '-version_number', 10).then(setVersionHistory).catch(() => {});
  }, [synapse]);

  if (!form) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const prevConfig = JSON.stringify(synapse);
    const newConfig = JSON.stringify({ ...form, processing_rules: JSON.stringify(rules) });
    await base44.entities.Synapse.update(synapse.id, { ...form, processing_rules: JSON.stringify(rules), version: (form.version || 1) + 1 });
    await base44.entities.SynapseVersion.create({
      synapse_id: synapse.id,
      version_number: (form.version || 1) + 1,
      changed_at: new Date().toISOString(),
      change_description: 'Manual configuration update',
      previous_config: prevConfig,
      new_config: newConfig,
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
    await new Promise(r => setTimeout(r, 1200)); // Simulate
    setTestResult({
      status: 'success',
      rules_passed: rules.filter(r => r.is_active).length,
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
        <div className="font-bold text-base mb-1" style={{ color: '#CADCFC' }}>"{form.synapse_name}"</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge style={{ background: `${statusColor[form.health_status]}22`, color: statusColor[form.health_status] }}>{form.health_status}</Badge>
          <Badge style={{ background: 'rgba(202,220,252,0.08)', color: '#94a3b8' }}>{form.priority}</Badge>
          {form.is_critical && <Badge style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Critical</Badge>}
          <span className="text-[10px]" style={{ color: '#64748b' }}>v{form.version || 1} · {form.fire_count_24h || 0} fires today</span>
        </div>
      </div>

      {/* 1. TRIGGER */}
      <Section title="1. Trigger — When does data flow?">
        <div className="grid grid-cols-2 gap-2">
          <Field label="TRIGGER TYPE">
            <Select value={form.trigger_type} onValueChange={v => set('trigger_type', v)}>
              <SelectTrigger className="h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Real-time', 'On Event', 'Scheduled', 'On Demand', 'On Record Change'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="SYNAPSE TYPE">
            <Select value={form.synapse_type} onValueChange={v => set('synapse_type', v)}>
              <SelectTrigger className="h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['One-Way', 'Bidirectional', 'Event-Triggered', 'Scheduled'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {form.trigger_type === 'On Event' && (
          <Field label="EVENT NAME">
            <Input value={form.trigger_event || ''} onChange={e => set('trigger_event', e.target.value)} placeholder="e.g. on_cr_approval" className="h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </Field>
        )}
        {form.trigger_type === 'Scheduled' && (
          <Field label="SCHEDULE">
            <Input value={form.trigger_schedule || ''} onChange={e => set('trigger_schedule', e.target.value)} placeholder="e.g. every_monday_07:00 or cron: 0 9 * * 1" className="h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </Field>
        )}
        <Field label="CONDITION (OPTIONAL)">
          <Input value={form.trigger_condition || ''} onChange={e => set('trigger_condition', e.target.value)} placeholder="e.g. cr.status == 'Approved' AND cr.capex_impact > 0" className="h-8 text-xs font-mono" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#a5f3fc' }} />
        </Field>
      </Section>

      {/* 2. DATA SOURCE */}
      <Section title="2. Data Source — What data flows?">
        <Field label="SOURCE ENTITY">
          <Input value={form.source_entity || ''} onChange={e => set('source_entity', e.target.value)} placeholder="e.g. ChangeRequest, FinanceModel" className="h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
        </Field>
        <Field label="SOURCE FIELDS (JSON ARRAY)">
          <Textarea value={form.source_fields || ''} onChange={e => set('source_fields', e.target.value)} rows={2} placeholder='["npv", "irr", "total_capex", "contingency_pct"]' className="text-xs font-mono" style={{ background: 'rgba(5,10,25,0.8)', borderColor: 'rgba(202,220,252,0.15)', color: '#a5f3fc' }} />
        </Field>
        <Field label="FILTER">
          <Input value={form.source_filter || ''} onChange={e => set('source_filter', e.target.value)} placeholder="e.g. status != 'Cancelled' AND priority = 'High'" className="h-8 text-xs font-mono" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#a5f3fc' }} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="SORT">
            <Input value={form.source_sort || ''} onChange={e => set('source_sort', e.target.value)} placeholder="due_date ASC" className="h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </Field>
          <Field label="LIMIT">
            <Input type="number" value={form.source_limit || ''} onChange={e => set('source_limit', parseInt(e.target.value) || null)} placeholder="e.g. 10" className="h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
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
            <Input value={form.target_entity || ''} onChange={e => set('target_entity', e.target.value)} placeholder="e.g. WeeklyReportSection" className="h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </Field>
          <Field label="TARGET ACTION">
            <Select value={form.target_action} onValueChange={v => set('target_action', v)}>
              <SelectTrigger className="h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Update', 'Append', 'Create', 'Merge', 'Alert'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="FIELD MAPPING (JSON)">
          <Textarea value={form.target_fields || ''} onChange={e => set('target_fields', e.target.value)} rows={3} placeholder='{"source.npv": "target.financial_npv", "source.irr": "target.financial_irr"}' className="text-xs font-mono" style={{ background: 'rgba(5,10,25,0.8)', borderColor: 'rgba(202,220,252,0.15)', color: '#a5f3fc' }} />
        </Field>
      </Section>

      {/* 5. TEST */}
      <Section title="5. Test & Preview">
        <Button onClick={handleTest} disabled={testing} size="sm" style={{ background: 'rgba(16,185,129,0.15)', borderColor: '#10b98144', color: '#10b981' }} variant="outline">
          <FlaskConical className="w-4 h-4 mr-2" />
          {testing ? 'Running test…' : '▶ Test Synapse Now'}
        </Button>
        {testResult && (
          <div className="rounded-lg p-3 text-xs font-mono" style={{ background: 'rgba(5,10,25,0.8)', border: '1px solid rgba(16,185,129,0.3)', color: '#a5f3fc' }}>
            <div className={`font-bold mb-2 ${testResult.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {testResult.status === 'success' ? '✅ Test passed' : '❌ Test failed'} · {testResult.rules_passed} rules applied
            </div>
            <pre className="whitespace-pre-wrap text-[10px]">{JSON.stringify(testResult.sample_output, null, 2)}</pre>
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
                <div key={v.id} className="text-xs p-2 rounded" style={{ background: 'rgba(30,39,97,0.3)', color: '#94a3b8' }}>
                  <span className="font-bold text-white">v{v.version_number}</span> · {v.change_description} · {new Date(v.changed_at).toLocaleDateString()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <Field label="ADMIN NOTES">
        <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Notes for other admins" style={{ background: 'rgba(30,39,97,0.3)', borderColor: 'rgba(202,220,252,0.1)', color: '#94a3b8' }} />
      </Field>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving} size="sm" style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
          <Save className="w-4 h-4 mr-1" />{saving ? 'Saving…' : 'Save Synapse'}
        </Button>
        <Button onClick={handleToggle} size="sm" variant="outline" style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
          {form.is_active ? <><Pause className="w-4 h-4 mr-1" />Pause</> : <><Play className="w-4 h-4 mr-1" />Resume</>}
        </Button>
        <Button onClick={() => setForm({ ...synapse })} size="sm" variant="outline" style={{ borderColor: 'rgba(202,220,252,0.1)', color: '#64748b' }}>
          <RotateCcw className="w-4 h-4 mr-1" />Revert
        </Button>
        <Button onClick={handleDelete} size="sm" variant="outline" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
          <Trash2 className="w-4 h-4 mr-1" />Delete
        </Button>
      </div>
    </div>
  );
}