import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, GitBranch, CheckCircle2, Circle, Clock, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '../utils';
import OptimizeWithAI from '../components/governance/OptimizeWithAI';

const GATE_DEFS = [
  { number: 0, name: 'QG0 — Opportunity', checklist: ['Business case defined', 'Market demand validated', 'High-level budget range identified', 'Strategic alignment confirmed'] },
  { number: 1, name: 'QG1 — Concept', checklist: ['Concept design complete', 'Site shortlist defined', 'Class 5 estimate (±50%)', 'Risk register initiated', 'Stakeholder map created'] },
  { number: 2, name: 'QG2 — FEED Complete', checklist: ['FEED package complete', 'Class 3 estimate (±20%)', 'Permitting path defined', 'Procurement strategy approved', 'HAZID/HAZOP completed', 'Charter approved'] },
  { number: 3, name: 'QG3 — Investment Decision', checklist: ['NPV/IRR targets met', 'Funding secured', 'Board approval obtained', 'Project execution plan approved', 'EPC contract strategy finalized'] },
  { number: 4, name: 'QG4 — Project Setup', checklist: ['PMO team mobilized', 'Master baseline schedule established', 'Budget allocated to WBS', 'Permits granted', 'Site access secured'] },
  { number: 5, name: 'QG5 — Construction', checklist: ['Groundbreaking complete', 'Major equipment ordered', 'Construction permits valid', 'Quality plan in execution', 'Safety program active'] },
  { number: 6, name: 'QG6 — Commissioning', checklist: ['Mechanical completion verified', 'Pre-commissioning checks done', 'Commissioning plan approved', 'Operator training started', 'Punch list <5% open'] },
  { number: 7, name: 'QG7 — Full Production', checklist: ['Performance tests passed', 'Ramp-up curve on target', 'Handover to operations complete', 'Final cost reconciliation done', 'Lessons learned documented'] },
];

const STATUS_STYLES = {
  'Not Reached': { icon: Circle, color: 'text-slate-500 bg-slate-500/10' },
  'Active': { icon: Clock, color: 'text-blue-400 bg-blue-500/10' },
  'Passed': { icon: CheckCircle2, color: 'text-green-400 bg-green-500/10' },
  'Passed with Reserves': { icon: CheckCircle2, color: 'text-amber-400 bg-amber-500/10' },
  'Not Passed': { icon: XCircle, color: 'text-red-400 bg-red-500/10' },
};

export default function QualityGates() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [expandedGate, setExpandedGate] = useState(null);
  const [editing, setEditing] = useState({});

  const { data: gates = [], isLoading } = useQuery({
    queryKey: ['qualityGates', projectId],
    queryFn: () => base44.entities.QualityGate.filter({ projectId }),
    enabled: !!projectId,
  });

  // Merge gate definitions with saved data; seed if missing
  const mergedGates = GATE_DEFS.map(def => {
    const saved = gates.find(g => g.gateNumber === def.number);
    let checklist = def.checklist;
    if (saved?.checklist) {
      try { checklist = JSON.parse(saved.checklist); } catch { /* keep default */ }
    }
    return { ...def, ...saved, checklist };
  });

  // Auto-seed gates on first load
  const seedMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.QualityGate.filter({ projectId });
      const toCreate = GATE_DEFS.filter(def => !existing.some(g => g.gateNumber === def.number));
      if (toCreate.length > 0) {
        await base44.entities.QualityGate.bulkCreate(
          toCreate.map(def => ({
            projectId,
            gateNumber: def.number,
            gateName: def.name,
            status: def.number === 0 ? 'Active' : 'Not Reached',
            checklist: JSON.stringify(def.checklist.map((text, i) => ({ id: `${def.number}-${i}`, text, checked: false }))),
          }))
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qualityGates', projectId] }),
  });

  useEffect(() => {
    if (projectId && gates.length === 0 && !isLoading && !seedMutation.isPending) {
      seedMutation.mutate();
    }
  }, [projectId, gates.length, isLoading]);

  const updateGate = useMutation({
    mutationFn: async ({ gate, changes }) => {
      if (gate.id) return base44.entities.QualityGate.update(gate.id, changes);
      return base44.entities.QualityGate.create({ projectId, gateNumber: gate.number, gateName: gate.name, status: 'Not Reached', ...changes });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qualityGates', projectId] }),
  });

  const toggleChecklistItem = (gate, itemIdx) => {
    const newChecklist = gate.checklist.map((item, i) => i === itemIdx ? { ...item, checked: !item.checked } : item);
    const checkedCount = newChecklist.filter(i => i.checked).length;
    const changes = { checklist: JSON.stringify(newChecklist) };
    // Auto-set status to Active if any items checked and currently Not Reached
    if (checkedCount > 0 && gate.status === 'Not Reached') changes.status = 'Active';
    updateGate.mutate({ gate, changes });
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}><p style={{ color: '#94A3B8' }}>Loading...</p></div>;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <div className="flex items-center gap-2">
              <div className="bg-green-600 p-2 rounded-lg text-white"><GitBranch className="w-5 h-5" /></div>
              <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>Quality Gates</h1>
            </div>
          </div>
          <OptimizeWithAI documentType="qualityGates" projectId={projectId} currentData={gates} onApplied={() => qc.invalidateQueries({ queryKey: ['qualityGates', projectId] })} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Ladder */}
        <div className="space-y-3">
          {mergedGates.map(gate => {
            const style = STATUS_STYLES[gate.status] || STATUS_STYLES['Not Reached'];
            const SIcon = style.icon;
            const isOpen = expandedGate === gate.number;
            const checkedCount = gate.checklist?.filter(i => i.checked).length || 0;
            const totalCount = gate.checklist?.length || 0;
            return (
              <Card key={gate.number} style={{ background: 'rgba(30,39,97,0.5)', borderColor: gate.status === 'Active' ? 'rgba(0,168,150,0.3)' : 'rgba(202,220,252,0.1)' }}>
                <CardContent className="pt-4">
                  <button onClick={() => setExpandedGate(isOpen ? null : gate.number)} className="w-full flex items-center gap-3 text-left">
                    <div className={`p-2 rounded-lg ${style.color}`}><SIcon className="w-5 h-5" /></div>
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: '#CADCFC' }}>{gate.name}</h3>
                      <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                        <span>{gate.status}</span>
                        {totalCount > 0 && <span>Checklist: {checkedCount}/{totalCount}</span>}
                        {gate.owner && <span>Owner: {gate.owner}</span>}
                      </div>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4" style={{ color: '#94A3B8' }} /> : <ChevronRight className="w-4 h-4" style={{ color: '#94A3B8' }} />}
                  </button>

                  {isOpen && (
                    <div className="mt-4 space-y-4 pl-2">
                      {/* Checklist */}
                      <div className="space-y-1.5">
                        <Label style={{ color: '#94A3B8' }} className="text-xs uppercase tracking-wide">Readiness Checklist</Label>
                        {gate.checklist?.map((item, idx) => (
                          <button key={item.id || idx} onClick={() => toggleChecklistItem(gate, idx)} className="w-full flex items-center gap-2 py-1.5 text-left group">
                            {item.checked ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />}
                            <span className="text-sm" style={{ color: item.checked ? '#CADCFC' : '#94A3B8', textDecoration: item.checked ? 'none' : 'none' }}>{item.text}</span>
                          </button>
                        ))}
                      </div>

                      {/* Gate controls */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
                        <div>
                          <Label style={{ color: '#94A3B8' }} className="text-xs">Status</Label>
                          <Select value={gate.status || 'Not Reached'} onValueChange={v => updateGate.mutate({ gate, changes: { status: v } })}>
                            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100 mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.keys(STATUS_STYLES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label style={{ color: '#94A3B8' }} className="text-xs">Owner</Label>
                          <Input value={gate.owner || ''} onChange={e => setEditing(p => ({ ...p, [gate.number]: { ...p[gate.number], owner: e.target.value } }))} onBlur={() => updateGate.mutate({ gate, changes: { owner: editing[gate.number]?.owner || gate.owner || '' } })} className="bg-slate-900/50 border-slate-700 text-slate-100 mt-1" />
                        </div>
                        <div>
                          <Label style={{ color: '#94A3B8' }} className="text-xs">Decision Date</Label>
                          <Input type="date" value={gate.decisionDate || ''} onChange={e => updateGate.mutate({ gate, changes: { decisionDate: e.target.value } })} className="bg-slate-900/50 border-slate-700 text-slate-100 mt-1" />
                        </div>
                        <div>
                          <Label style={{ color: '#94A3B8' }} className="text-xs">Decision Authority</Label>
                          <Input value={gate.decisionAuthority || ''} onChange={e => updateGate.mutate({ gate, changes: { decisionAuthority: e.target.value } })} className="bg-slate-900/50 border-slate-700 text-slate-100 mt-1" />
                        </div>
                        <div className="col-span-2">
                          <Label style={{ color: '#94A3B8' }} className="text-xs">Decision Notes</Label>
                          <Textarea value={gate.decisionNotes || ''} onChange={e => updateGate.mutate({ gate, changes: { decisionNotes: e.target.value } })} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100 mt-1" />
                        </div>
                        <div className="col-span-2">
                          <Label style={{ color: '#94A3B8' }} className="text-xs">Next Gate Criteria</Label>
                          <Textarea value={gate.nextGateCriteria || ''} onChange={e => updateGate.mutate({ gate, changes: { nextGateCriteria: e.target.value } })} rows={2} className="bg-slate-900/50 border-slate-700 text-slate-100 mt-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}