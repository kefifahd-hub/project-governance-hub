import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';

const AUDIT_TYPES = ['Internal', 'External', 'Regulatory', 'ISO', 'Client', 'Supplier'];
const AUDIT_STATUSES = ['Planned', 'In Progress', 'Reporting', 'Closed'];
const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };

export default function AuditDialog({ open, onClose, projectId, audit }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm(audit ? { ...audit } : {
        auditRef: '', auditType: 'Internal', auditScope: '', auditor: '',
        auditDate: '', status: 'Planned',
      });
    }
  }, [open, audit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const { id, created_date, updated_date, created_by_id, org_id, ...payload } = data;
      if (audit?.id) return base44.entities.Audit.update(audit.id, payload);
      return base44.entities.Audit.create({ ...payload, projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audits', projectId] }); onClose(); },
  });

  const handleSubmit = (e) => { e.preventDefault(); saveMutation.mutate(form); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'rgba(10,15,40,0.99)', borderColor: 'rgba(202,220,252,0.1)' }} className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>{audit ? 'Edit Audit' : 'Add Audit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Audit Ref *</Label>
              <Input value={form.auditRef || ''} onChange={e => set('auditRef', e.target.value)} placeholder="AUD-2026-001" required style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Type</Label>
              <Select value={form.auditType} onValueChange={v => set('auditType', v)}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{AUDIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Scope</Label>
            <Textarea value={form.auditScope || ''} onChange={e => set('auditScope', e.target.value)} rows={2} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Auditor</Label>
              <Input value={form.auditor || ''} onChange={e => set('auditor', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Audit Date</Label>
              <Input type="date" value={form.auditDate || ''} onChange={e => set('auditDate', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{AUDIT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <div className="flex gap-3">
              <Button type="submit" disabled={saveMutation.isPending} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
                {saveMutation.isPending ? 'Saving…' : 'Save Audit'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Cancel</Button>
            </div>
            {audit?.id && (
              <Button type="button" variant="outline" onClick={() => { if (window.confirm('Delete this audit and all its findings?')) { base44.entities.Audit.delete(audit.id).then(() => { qc.invalidateQueries({ queryKey: ['audits', projectId] }); onClose(); }); } }} style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444' }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}