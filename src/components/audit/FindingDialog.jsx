import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ArrowUpRight } from 'lucide-react';

const SEVERITIES = ['Major', 'Minor', 'Observation', 'Opportunity'];
const FINDING_STATUSES = ['Open', 'Actioned', 'Verified', 'Closed'];
const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };

export default function FindingDialog({ open, onClose, projectId, auditId, finding, onPromoted }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm(finding ? { ...finding } : {
        findingRef: '', description: '', severity: 'Minor', clause: '', correctiveAction: '',
        owner: '', dueDate: '', evidence: '', status: 'Open', closedDate: '',
      });
    }
  }, [open, finding]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const { id, created_date, updated_date, created_by_id, org_id, linkedRiskId, ...payload } = data;
      if (finding?.id) return base44.entities.AuditFinding.update(finding.id, payload);
      return base44.entities.AuditFinding.create({ ...payload, projectId, auditId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['auditFindings', auditId] }); onClose(); },
  });

  const promoteMutation = useMutation({
    mutationFn: async () => {
      // Create a Risk in the Risk Register from this Major finding
      const risk = await base44.entities.Risk.create({
        projectId,
        riskDescription: `Audit finding (${form.findingRef || 'CAPA'}): ${form.description}`,
        category: 'Quality',
        probability: 2,
        impact: 3,
        riskScore: 6,
        riskLevel: 'High',
        mitigationPlan: form.correctiveAction || '',
        owner: form.owner || '',
        status: 'Open',
      });
      // Store the new risk id on the finding
      await base44.entities.AuditFinding.update(finding.id, { linkedRiskId: risk.id });
      return risk.id;
    },
    onSuccess: (riskId) => {
      qc.invalidateQueries({ queryKey: ['auditFindings', auditId] });
      qc.invalidateQueries({ queryKey: ['risks', projectId] });
      if (onPromoted) onPromoted(riskId);
      onClose();
    },
  });

  const handleSubmit = (e) => { e.preventDefault(); saveMutation.mutate(form); };

  const canPromote = finding?.id && form.severity === 'Major' && !form.linkedRiskId;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'rgba(10,15,40,0.99)', borderColor: 'rgba(202,220,252,0.1)' }} className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>{finding ? 'Edit Finding' : 'Add Finding'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Finding Ref</Label>
              <Input value={form.findingRef || ''} onChange={e => set('findingRef', e.target.value)} placeholder="F-001" style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Severity</Label>
              <Select value={form.severity} onValueChange={v => set('severity', v)}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{FINDING_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Description *</Label>
            <Textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} required style={inputStyle} />
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Clause / standard reference</Label>
            <Input value={form.clause || ''} onChange={e => set('clause', e.target.value)} placeholder="ISO 9001 §8.2" style={inputStyle} />
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Corrective Action (CAPA)</Label>
            <Textarea value={form.correctiveAction || ''} onChange={e => set('correctiveAction', e.target.value)} rows={2} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Owner</Label>
              <Input value={form.owner || ''} onChange={e => set('owner', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Due Date</Label>
              <Input type="date" value={form.dueDate || ''} onChange={e => set('dueDate', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Evidence</Label>
            <Textarea value={form.evidence || ''} onChange={e => set('evidence', e.target.value)} rows={2} style={inputStyle} />
          </div>
          {form.linkedRiskId && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
              ✓ Promoted to Risk Register (id: {form.linkedRiskId})
            </div>
          )}
          <div className="flex justify-between gap-3 pt-2 flex-wrap">
            <div className="flex gap-3">
              <Button type="submit" disabled={saveMutation.isPending} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
                {saveMutation.isPending ? 'Saving…' : 'Save Finding'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Cancel</Button>
            </div>
            <div className="flex gap-3">
              {canPromote && (
                <Button type="button" variant="outline" disabled={promoteMutation.isPending}
                  onClick={() => promoteMutation.mutate()}
                  style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444' }}>
                  <ArrowUpRight className="w-4 h-4 mr-1" /> {promoteMutation.isPending ? 'Promoting…' : 'Promote to Risk'}
                </Button>
              )}
              {finding?.id && (
                <Button type="button" variant="outline" onClick={() => { if (window.confirm('Delete this finding?')) { base44.entities.AuditFinding.delete(finding.id).then(() => { qc.invalidateQueries({ queryKey: ['auditFindings', auditId] }); onClose(); }); } }} style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444' }}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}