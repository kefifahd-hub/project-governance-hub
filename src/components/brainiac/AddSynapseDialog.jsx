import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function AddSynapseDialog({ open, onClose, neurons, defaultFromId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ from_neuron_id: defaultFromId || '', to_neuron_id: '', synapse_name: '', synapse_type: 'One-Way', priority: 'Medium', trigger_type: 'On Event' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.from_neuron_id || !form.to_neuron_id || !form.synapse_name) return;
    setSaving(true);
    await base44.entities.Synapse.create({ ...form, is_active: true, health_status: 'Active', fire_count_24h: 0, error_count: 0, version: 1 });
    qc.invalidateQueries({ queryKey: ['synapses'] });
    setSaving(false);
    onClose();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.15)' }} className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>Add New Synapse</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>FROM NEURON</label>
            <Select value={form.from_neuron_id} onValueChange={v => set('from_neuron_id', v)}>
              <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                <SelectValue placeholder="Select source module" />
              </SelectTrigger>
              <SelectContent>
                {neurons.map(n => <SelectItem key={n.id} value={n.id}>{n.icon} {n.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>TO NEURON</label>
            <Select value={form.to_neuron_id} onValueChange={v => set('to_neuron_id', v)}>
              <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                <SelectValue placeholder="Select target module" />
              </SelectTrigger>
              <SelectContent>
                {neurons.filter(n => n.id !== form.from_neuron_id).map(n => <SelectItem key={n.id} value={n.id}>{n.icon} {n.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>SYNAPSE NAME</label>
            <Input value={form.synapse_name} onChange={e => set('synapse_name', e.target.value)} placeholder="e.g. Cost section data" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>TYPE</label>
              <Select value={form.synapse_type} onValueChange={v => set('synapse_type', v)}>
                <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['One-Way', 'Bidirectional', 'Event-Triggered', 'Scheduled'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>PRIORITY</label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['High', 'Medium', 'Low'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving || !form.synapse_name || !form.from_neuron_id || !form.to_neuron_id} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
              {saving ? 'Creating…' : 'Create Synapse'}
            </Button>
            <Button variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}