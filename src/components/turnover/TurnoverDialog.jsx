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

export const TURNOVER_STATUSES = [
  'Construction Complete',
  'Walkdown',
  'Punchlist A Cleared',
  'Mechanical Completion',
  'Commissioning',
  'Ready for Ops',
  'Turned Over to Ops',
];

const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };

export default function TurnoverDialog({ open, onClose, projectId, pkg, wbsOptions = [] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm(pkg ? { ...pkg } : {
        packageCode: '', systemName: '', subsystem: '', scope: '', constructionPercent: 0,
        punchlistA: 0, punchlistB: 0, custodianFrom: 'Construction', custodianTo: 'Commissioning',
        targetDate: '', actualDate: '', wbsCode: '', notes: '', status: 'Construction Complete',
      });
    }
  }, [open, pkg]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const { id, created_date, updated_date, created_by_id, org_id, ...payload } = data;
      if (pkg?.id) return base44.entities.TurnoverPackage.update(pkg.id, payload);
      return base44.entities.TurnoverPackage.create({ ...payload, projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['turnoverPackages', projectId] }); onClose(); },
  });

  const handleSubmit = (e) => { e.preventDefault(); saveMutation.mutate(form); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'rgba(10,15,40,0.99)', borderColor: 'rgba(202,220,252,0.1)' }} className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>{pkg ? 'Edit Turnover Package' : 'Add Turnover Package'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Package Code *</Label>
              <Input value={form.packageCode || ''} onChange={e => set('packageCode', e.target.value)} placeholder="TOP-014" required style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>System Name *</Label>
              <Input value={form.systemName || ''} onChange={e => set('systemName', e.target.value)} required style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Subsystem</Label>
              <Input value={form.subsystem || ''} onChange={e => set('subsystem', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>WBS Code</Label>
              <Select value={form.wbsCode || ''} onValueChange={v => set('wbsCode', v)}>
                <SelectTrigger style={inputStyle}><SelectValue placeholder="Link to WBS element" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {wbsOptions.map(w => <SelectItem key={w.id} value={w.wbsCode}>{w.wbsCode} · {w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Scope</Label>
            <Textarea value={form.scope || ''} onChange={e => set('scope', e.target.value)} rows={2} style={inputStyle} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Construction %</Label>
              <Input type="number" min={0} max={100} value={form.constructionPercent ?? 0} onChange={e => set('constructionPercent', parseFloat(e.target.value) || 0)} style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Punchlist A</Label>
              <Input type="number" min={0} value={form.punchlistA ?? 0} onChange={e => set('punchlistA', parseInt(e.target.value) || 0)} style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Punchlist B</Label>
              <Input type="number" min={0} value={form.punchlistB ?? 0} onChange={e => set('punchlistB', parseInt(e.target.value) || 0)} style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Custodian From</Label>
              <Input value={form.custodianFrom || ''} onChange={e => set('custodianFrom', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Custodian To</Label>
              <Input value={form.custodianTo || ''} onChange={e => set('custodianTo', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Target Date</Label>
              <Input type="date" value={form.targetDate || ''} onChange={e => set('targetDate', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Actual Date</Label>
              <Input type="date" value={form.actualDate || ''} onChange={e => set('actualDate', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{TURNOVER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Notes</Label>
            <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} style={inputStyle} />
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <div className="flex gap-3">
              <Button type="submit" disabled={saveMutation.isPending} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
                {saveMutation.isPending ? 'Saving…' : 'Save Package'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Cancel</Button>
            </div>
            {pkg?.id && (
              <Button type="button" variant="outline" onClick={() => { if (window.confirm('Delete this package?')) { base44.entities.TurnoverPackage.delete(pkg.id).then(() => { qc.invalidateQueries({ queryKey: ['turnoverPackages', projectId] }); onClose(); }); } }} style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444' }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}