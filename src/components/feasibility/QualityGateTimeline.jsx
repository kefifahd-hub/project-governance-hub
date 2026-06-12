import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Industrialization Quality Gate framework (QG0-QG8).
// Promoter is the Project Director through QG5, then the General Manager;
// if no PD is assigned, the PMO carries promoter responsibility.
const GATES = [
  { number: 0, name: 'QG0', full: 'Project Proposal', promoter: 'PD',
    departments: ['M&S', 'IE/IS', 'TBB', 'IT', 'PPC', 'GEC', 'GID-DM', 'QA', 'PMO', 'HR'],
    scope: 'Demand validated, allocation/blueprint approved, proposal ready for decision.' },
  { number: 1, name: 'QG1', full: 'Project Planning', promoter: 'PD',
    departments: ['IE/IS', 'GID', 'IT', 'PPC', 'GEC', 'GID-DM', 'SCM', 'QA'],
    scope: 'Charter, execution plan, financial plan baseline and master schedule L1 in place.' },
  { number: 2, name: 'QG2', full: 'Equipment & Building PO', promoter: 'PD',
    departments: ['FIN', 'GID', 'EHS', 'R&D', 'IT', 'PPC'],
    scope: 'Design inputs mature enough to commit purchase orders (if applicable).' },
  { number: 3, name: 'QG3', full: 'Detailed Design / Construction', promoter: 'PD',
    departments: ['IE/IS', 'IT', 'PPC', 'GEC'],
    scope: 'Detailed design released; construction execution underway per plan.' },
  { number: 4, name: 'QG4', full: 'Installation / Commissioning', promoter: 'PD',
    departments: ['GID', 'IT', 'PPC', 'GEC'],
    scope: 'Equipment installed, hooked up and commissioned (FAT closed, toward SAT).' },
  { number: 5, name: 'QG5', full: 'Qualification', promoter: 'PD',
    departments: ['PPC'],
    scope: 'Product line qualification: SAT entry conditions met, trial production released.' },
  { number: 6, name: 'QG6', full: 'C & D-Sample', promoter: 'GM',
    departments: ['PPC'],
    scope: 'Customer sample builds validated.' },
  { number: 7, name: 'QG7', full: 'SOP', promoter: 'GM',
    departments: ['PPC'],
    scope: 'Start of production achieved at target quality and output.' },
  { number: 8, name: 'QG8', full: 'Project Handover', promoter: 'GM',
    departments: ['PPC'],
    scope: 'Project closed out and handed to operations; lessons learned submitted.' },
];

// Overall gate maturity decision rule (traffic-light assessment of the gate checklist).
const MATURITY_RULE = [
  { status: 'Passed', light: '🟢 Green', rule: 'Approve — no follow-up actions' },
  { status: 'Passed with Reserves', light: '🟡 Yellow', rule: 'Approve with follow-up actions (track reserves to closure)' },
  { status: 'Not Passed', light: '🔴 Red', rule: 'Rejection — rework deliverables and re-review' },
];

const statusColors = {
  'Passed': { node: '#10B981', text: '✅ Passed', line: '#10B981' },
  'Passed with Reserves': { node: '#F59E0B', text: '⚠️ Reserves', line: '#F59E0B' },
  'Not Passed': { node: '#EF4444', text: '❌ Not Passed', line: '#EF4444' },
  'Active': { node: '#EF4444', text: '🔴 CURRENT', line: '#6B7280', pulse: true },
  'Not Reached': { node: 'transparent', text: '', line: '#374151' },
};

export default function QualityGateTimeline({ projectId }) {
  const [selectedGate, setSelectedGate] = useState(null);
  const queryClient = useQueryClient();

  const { data: gates = [] } = useQuery({
    queryKey: ['qualityGates', projectId],
    queryFn: () => base44.entities.QualityGate.filter({ projectId }),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const existing = gates.find(g => g.gateNumber === data.gateNumber);
      if (existing) return base44.entities.QualityGate.update(existing.id, data);
      return base44.entities.QualityGate.create({ ...data, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityGates', projectId] });
      setSelectedGate(null);
    }
  });

  const getGateData = (num) => gates.find(g => g.gateNumber === num) || { gateNumber: num, status: num === 0 ? 'Active' : 'Not Reached' };

  const unresolvedReserves = gates.filter(g => g.status === 'Passed with Reserves' && !g.reservesResolved);

  return (
    <div className="mb-6" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)', padding: '16px 24px' }}>
      {/* Timeline */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {GATES.map((gate, i) => {
          const data = getGateData(gate.number);
          const s = statusColors[data.status] || statusColors['Not Reached'];
          const isReached = data.status !== 'Not Reached';
          const reserveCount = data.status === 'Passed with Reserves' && !data.reservesResolved ? 1 : 0;

          return (
            <div key={gate.number} className="flex items-center" style={{ flex: i < GATES.length - 1 ? '1' : 'none' }}>
              {/* Node */}
              <button
                onClick={() => setSelectedGate({ ...data, ...gate })}
                className="flex flex-col items-center shrink-0"
                style={{ minWidth: 56 }}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center relative ${data.status === 'Active' ? 'animate-pulse' : ''}`}
                  style={{
                    background: isReached && data.status !== 'Not Reached' ? s.node : 'transparent',
                    borderColor: isReached ? s.node : '#374151',
                  }}
                >
                  {data.status === 'Not Reached' && <div className="w-2 h-2 rounded-full" style={{ background: '#374151' }} />}
                  {reserveCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-xs bg-amber-500 text-black rounded-full w-4 h-4 flex items-center justify-center font-bold">{reserveCount}</span>
                  )}
                </div>
                <div className="text-xs font-bold mt-1" style={{ color: isReached ? s.node : '#475569' }}>{gate.name}</div>
                <div className="text-xs text-center leading-tight" style={{ color: isReached ? '#94A3B8' : '#374155', maxWidth: 64, fontSize: 9 }}>{gate.full}</div>
                <div style={{ color: '#475569', fontSize: 8 }}>{gate.promoter}</div>
                {s.text && <div className="text-xs mt-0.5" style={{ color: s.node, fontSize: 9, whiteSpace: 'nowrap' }}>{s.text}</div>}
                {data.decisionDate && <div style={{ color: '#64748B', fontSize: 9 }}>{data.decisionDate}</div>}
              </button>

              {/* Line */}
              {i < GATES.length - 1 && (
                <div className="flex-1 h-0.5 mx-1" style={{ background: isReached && data.status !== 'Not Reached' ? s.node : '#374151', borderTop: isReached && data.status !== 'Not Reached' ? 'none' : '1px dashed #374151' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Unresolved reserves warning */}
      {unresolvedReserves.length > 0 && (
        <div className="mt-2 text-xs px-3 py-1.5 rounded" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
          ⚠️ {unresolvedReserves.map(g => `QG${g.gateNumber}`).join(', ')} {unresolvedReserves.length === 1 ? 'has' : 'have'} unresolved reserves.{' '}
          <button onClick={() => setSelectedGate({ ...unresolvedReserves[0], ...GATES[unresolvedReserves[0].gateNumber] })} className="underline">View Reserves →</button>
        </div>
      )}

      {/* Gate Detail Dialog */}
      {selectedGate && (
        <Dialog open={!!selectedGate} onOpenChange={() => setSelectedGate(null)}>
          <DialogContent style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ color: '#CADCFC' }}>{selectedGate.name} — {selectedGate.full}</DialogTitle>
            </DialogHeader>
            <GateForm gate={selectedGate} onSave={(d) => saveMutation.mutate(d)} onClose={() => setSelectedGate(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function GateForm({ gate, onSave, onClose }) {
  const [form, setForm] = useState({
    gateNumber: gate.gateNumber,
    status: gate.status || 'Not Reached',
    decisionDate: gate.decisionDate || '',
    decisionAuthority: gate.decisionAuthority || '',
    reserves: gate.reserves || '',
    reservesDueDate: gate.reservesDueDate || '',
    reservesResolved: gate.reservesResolved || false,
    evidenceNotes: gate.evidenceNotes || '',
    nextGateCriteria: gate.nextGateCriteria || '',
  });

  return (
    <div className="space-y-3">
      {/* Framework reference for this gate */}
      <div className="rounded p-3 text-xs space-y-1.5" style={{ background: 'rgba(0, 168, 150, 0.08)', border: '1px solid rgba(0, 168, 150, 0.25)', color: '#94A3B8' }}>
        {gate.scope && <div style={{ color: '#CADCFC' }}>{gate.scope}</div>}
        {gate.promoter && (
          <div><span style={{ color: '#00A896' }}>Promoter:</span> {gate.promoter === 'PD' ? 'Project Director' : 'General Manager'} (PMO if no PD assigned)</div>
        )}
        {gate.departments?.length > 0 && (
          <div><span style={{ color: '#00A896' }}>Level 1 gate owners:</span> {gate.departments.join(', ')}</div>
        )}
        <div>
          <span style={{ color: '#00A896' }}>Decision rule:</span>
          {MATURITY_RULE.map(m => (
            <div key={m.status} style={{ paddingLeft: 8 }}>{m.light} → {m.rule}</div>
          ))}
        </div>
        <div style={{ color: '#F59E0B' }}>Pre-approval review with all Level 1 owners is mandatory 1 week before expected gate completion.</div>
      </div>
      <div>
        <Label style={{ color: '#94A3B8' }}>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['Not Reached', 'Active', 'Passed', 'Passed with Reserves', 'Not Passed'].map(s => {
              const light = MATURITY_RULE.find(m => m.status === s);
              return <SelectItem key={s} value={s}>{light ? `${s} (${light.light.slice(0, 2)})` : s}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label style={{ color: '#94A3B8' }}>Decision Date</Label>
          <Input type="date" value={form.decisionDate} onChange={e => setForm({ ...form, decisionDate: e.target.value })} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
        </div>
        <div>
          <Label style={{ color: '#94A3B8' }}>Decision Authority</Label>
          <Input value={form.decisionAuthority} onChange={e => setForm({ ...form, decisionAuthority: e.target.value })} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
        </div>
      </div>
      {form.status === 'Passed with Reserves' && (
        <div className="space-y-3">
          <div>
            <Label style={{ color: '#94A3B8' }}>Reserves / Conditions</Label>
            <Textarea value={form.reserves} onChange={e => setForm({ ...form, reserves: e.target.value })} rows={3} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <Label style={{ color: '#94A3B8' }}>Reserves Due Date</Label>
              <Input type="date" value={form.reservesDueDate} onChange={e => setForm({ ...form, reservesDueDate: e.target.value })} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" checked={form.reservesResolved} onChange={e => setForm({ ...form, reservesResolved: e.target.checked })} />
              <Label style={{ color: '#94A3B8' }}>Resolved</Label>
            </div>
          </div>
        </div>
      )}
      <div>
        <Label style={{ color: '#94A3B8' }}>Evidence Notes</Label>
        <Textarea value={form.evidenceNotes} onChange={e => setForm({ ...form, evidenceNotes: e.target.value })} rows={2} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
      </div>
      <div>
        <Label style={{ color: '#94A3B8' }}>Criteria for Next Gate</Label>
        <Textarea value={form.nextGateCriteria} onChange={e => setForm({ ...form, nextGateCriteria: e.target.value })} rows={2} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>Save Gate</Button>
        <Button variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.3)', color: '#CADCFC' }}>Cancel</Button>
      </div>
    </div>
  );
}