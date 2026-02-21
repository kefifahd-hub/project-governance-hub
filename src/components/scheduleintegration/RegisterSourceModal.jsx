import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2 } from 'lucide-react';

export default function RegisterSourceModal({ projectId, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    sourceName: '',
    sourceType: 'Primavera P6',
    sourceOwner: '',
    fileFormat: 'XER',
    syncMethod: 'Manual Upload',
    syncFrequency: 'On Demand',
    wbsPrefix: '',
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ScheduleSource.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduleSources', projectId] });
      onClose();
    },
  });

  const FILE_FORMATS = form.sourceType === 'Primavera P6' ? ['XER', 'XML (P6)', 'CSV'] : ['MPP', 'XML (MSP)', 'XLSX', 'CSV'];

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl" style={{ background: 'rgba(15,23,42,0.99)', border: '1px solid rgba(202,220,252,0.15)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: '#CADCFC' }}>Register Schedule Source</h2>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#64748b' }} /></button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs" style={{ color: '#94A3B8' }}>Source Name *</Label>
              <Input value={form.sourceName} onChange={e => set('sourceName', e.target.value)} placeholder="e.g. LDC Construction Schedule" className="mt-1" style={{ background: 'rgba(30,39,97,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" style={{ color: '#94A3B8' }}>Source Type *</Label>
                <Select value={form.sourceType} onValueChange={v => { set('sourceType', v); set('fileFormat', v === 'Primavera P6' ? 'XER' : 'MPP'); }}>
                  <SelectTrigger className="mt-1 text-sm" style={{ background: 'rgba(30,39,97,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primavera P6">Primavera P6</SelectItem>
                    <SelectItem value="Microsoft Project">Microsoft Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#94A3B8' }}>File Format</Label>
                <Select value={form.fileFormat} onValueChange={v => set('fileFormat', v)}>
                  <SelectTrigger className="mt-1 text-sm" style={{ background: 'rgba(30,39,97,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" style={{ color: '#94A3B8' }}>Owner</Label>
                <Input value={form.sourceOwner} onChange={e => set('sourceOwner', e.target.value)} placeholder="e.g. FK / LDC" className="mt-1" style={{ background: 'rgba(30,39,97,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#94A3B8' }}>WBS Prefix</Label>
                <Input value={form.wbsPrefix} onChange={e => set('wbsPrefix', e.target.value)} placeholder="e.g. CON- or PMO-" className="mt-1" style={{ background: 'rgba(30,39,97,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              </div>
            </div>

            <div>
              <Label className="text-xs" style={{ color: '#94A3B8' }}>Sync Frequency</Label>
              <Select value={form.syncFrequency} onValueChange={v => set('syncFrequency', v)}>
                <SelectTrigger className="mt-1 text-sm" style={{ background: 'rgba(30,39,97,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['On Demand', 'Daily', 'Weekly (Monday)', 'Weekly (Friday)'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <Button variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, projectId })} disabled={!form.sourceName || createMutation.isPending} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Register Source
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}