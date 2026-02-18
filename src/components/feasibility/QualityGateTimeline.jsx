import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const GATES = [
  { number: 0, name: 'QG0', full: 'Opportunity Assessment' },
  { number: 1, name: 'QG1', full: 'Pre-Feasibility' },
  { number: 2, name: 'QG2', full: 'FEED Complete' },
  { number: 3, name: 'QG3', full: 'FID' },
  { number: 4, name: 'QG4', full: 'Mech. Completion' },
  { number: 5, name: 'QG5', full: 'Commissioning' },
  { number: 6, name: 'QG6', full: 'SOP' },
  { number: 7, name: 'QG7', full: 'Full Production' },
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
                <div className="text-xs text-center leading-tight" style={{ color: isReached ? '#94A3B8' : '#374155', maxWidth: 60, fontSize: 9 }}>{gate.full}</div>
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
      <div>
        <Label style={{ color: '#94A3B8' }}>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['Not Reached', 'Active', 'Passed', 'Passed with Reserves', 'Not Passed'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
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