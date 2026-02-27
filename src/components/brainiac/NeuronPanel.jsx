import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, Plus, Zap } from 'lucide-react';

const healthColor = { Healthy: 'text-emerald-400', Degraded: 'text-amber-400', Error: 'text-red-400', Offline: 'text-slate-500' };

export default function NeuronPanel({ neuron, synapses, neurons, onSynapseClick, onAddSynapse }) {
  if (!neuron) return null;
  const neuronMap = {};
  neurons.forEach(n => { neuronMap[n.id] = n; });
  const inputs = synapses.filter(s => s.to_neuron_id === neuron.id);
  const outputs = synapses.filter(s => s.from_neuron_id === neuron.id);

  const SynapseRow = ({ s, dir }) => {
    const other = dir === 'in' ? neuronMap[s.from_neuron_id] : neuronMap[s.to_neuron_id];
    return (
      <div
        className="p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-all"
        style={{ background: 'rgba(15,23,42,0.6)', borderColor: `${other?.color || '#6366f1'}44` }}
        onClick={() => onSynapseClick(s.id)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium" style={{ color: '#CADCFC' }}>
            {other?.icon} {other?.display_name}
          </span>
          <Badge className="text-[10px]" style={{ background: s.is_active ? '#10b98122' : '#47556922', color: s.is_active ? '#10b981' : '#94a3b8' }}>
            {s.health_status}
          </Badge>
        </div>
        <div className="text-xs" style={{ color: '#94a3b8' }}>"{s.synapse_name}"</div>
        <div className="flex items-center gap-2 mt-1">
          <Zap className="w-3 h-3" style={{ color: '#f59e0b' }} />
          <span className="text-[10px]" style={{ color: '#64748b' }}>{s.trigger_type} · {s.fire_count_24h || 0} fires today</span>
          <span className="ml-auto text-[10px] text-blue-400 hover:underline">Configure →</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-full pr-1" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      {/* Neuron header */}
      <div className="rounded-xl p-4" style={{ background: `${neuron.color}22`, border: `1px solid ${neuron.color}44` }}>
        <div className="text-2xl mb-1">{neuron.icon}</div>
        <div className="font-bold text-lg" style={{ color: '#CADCFC' }}>{neuron.display_name}</div>
        <div className="text-xs mb-2" style={{ color: '#94a3b8' }}>{neuron.category} · <span className={healthColor[neuron.health_status]}>{neuron.health_status} ✓</span></div>
        <div className="flex gap-3 text-xs" style={{ color: '#94a3b8' }}>
          <span><ArrowDown className="inline w-3 h-3 mr-0.5" />{inputs.length} in</span>
          <span><ArrowUp className="inline w-3 h-3 mr-0.5" />{outputs.length} out</span>
          <span>⚡ {neuron.pulse_count_24h || 0}/day</span>
        </div>
        {neuron.description && <div className="mt-2 text-xs" style={{ color: '#64748b' }}>{neuron.description}</div>}
      </div>

      {/* Inputs */}
      {inputs.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#64748b' }}>
            <ArrowDown className="w-3 h-3" /> INPUTS ({inputs.length} synapses)
          </div>
          <div className="flex flex-col gap-2">
            {inputs.map(s => <SynapseRow key={s.id} s={s} dir="in" />)}
          </div>
        </div>
      )}

      {/* Outputs */}
      {outputs.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#64748b' }}>
            <ArrowUp className="w-3 h-3" /> OUTPUTS ({outputs.length} synapses)
          </div>
          <div className="flex flex-col gap-2">
            {outputs.map(s => <SynapseRow key={s.id} s={s} dir="out" />)}
          </div>
        </div>
      )}

      {inputs.length === 0 && outputs.length === 0 && (
        <div className="text-center py-6 text-sm" style={{ color: '#64748b' }}>No synapses connected</div>
      )}

      <Button variant="outline" size="sm" onClick={() => onAddSynapse(neuron.id)} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
        <Plus className="w-4 h-4 mr-1" /> Add Synapse
      </Button>
    </div>
  );
}