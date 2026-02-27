import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Eye, Pencil, X, Cpu } from 'lucide-react';
import NeuralCanvas from '../components/brainiac/NeuralCanvas';
import NeuronPanel from '../components/brainiac/NeuronPanel';
import SynapseConfigurator from '../components/brainiac/SynapseConfigurator';
import AddSynapseDialog from '../components/brainiac/AddSynapseDialog';
import { NEURON_SEEDS, SYNAPSE_SEEDS } from '../components/brainiac/neuronSeedData';

export default function Brainiac() {
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [selectedNeuronId, setSelectedNeuronId] = useState(null);
  const [selectedSynapseId, setSelectedSynapseId] = useState(null);
  const [addSynapseOpen, setAddSynapseOpen] = useState(false);
  const [addSynapseFromId, setAddSynapseFromId] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const { data: neurons = [], isLoading: loadingNeurons } = useQuery({
    queryKey: ['neurons'],
    queryFn: () => base44.entities.Neuron.list('-pulse_count_24h', 50),
  });

  const { data: synapses = [], isLoading: loadingSynapses } = useQuery({
    queryKey: ['synapses'],
    queryFn: () => base44.entities.Synapse.list('-fire_count_24h', 100),
  });

  const selectedNeuron = neurons.find(n => n.id === selectedNeuronId) || null;
  const selectedSynapse = synapses.find(s => s.id === selectedSynapseId) || null;

  const totalPulses = neurons.reduce((sum, n) => sum + (n.pulse_count_24h || 0), 0);
  const activeSynapses = synapses.filter(s => s.is_active).length;
  const errorSynapses = synapses.filter(s => s.health_status === 'Error' || s.health_status === 'Broken').length;
  const allHealthy = errorSynapses === 0;

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const created = await base44.entities.Neuron.bulkCreate(NEURON_SEEDS);
      const synapseData = SYNAPSE_SEEDS(created);
      if (synapseData.length > 0) {
        await base44.entities.Synapse.bulkCreate(synapseData);
      }
      qc.invalidateQueries({ queryKey: ['neurons'] });
      qc.invalidateQueries({ queryKey: ['synapses'] });
    } catch (err) {
      console.error(err);
    }
    setSeeding(false);
  };

  const handleNeuronClick = (id) => {
    setSelectedNeuronId(id);
    setSelectedSynapseId(null);
  };

  const handleSynapseClick = (id) => {
    setSelectedSynapseId(id);
    setSelectedNeuronId(null);
  };

  const handleAddSynapse = (fromId = null) => {
    setAddSynapseFromId(fromId);
    setAddSynapseOpen(true);
  };

  const isLoading = loadingNeurons || loadingSynapses;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #080d1a 0%, #0f172a 50%, #0d1b2e 100%)' }}>
      {/* Top Bar */}
      <div className="flex-none px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(202,220,252,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px #a78bfa)' }}>🧠</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: '#CADCFC' }}>Brainiac</div>
            <div className="text-xs" style={{ color: '#64748b' }}>Neural Flow Control Center</div>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-3 ml-4 text-xs" style={{ color: '#64748b' }}>
              <span>{neurons.length} neurons</span>
              <span>·</span>
              <span>{synapses.length} synapses</span>
              <span>·</span>
              <span>{totalPulses.toLocaleString()} pulses/day</span>
              <span>·</span>
              <span className={allHealthy ? 'text-emerald-400' : 'text-red-400'}>
                {allHealthy ? '✅ All healthy' : `⚠️ ${errorSynapses} error${errorSynapses > 1 ? 's' : ''}`}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditMode(e => !e)}
            style={{ borderColor: editMode ? '#a78bfa55' : 'rgba(202,220,252,0.15)', color: editMode ? '#a78bfa' : '#CADCFC', background: editMode ? '#a78bfa11' : 'transparent' }}
          >
            {editMode ? <><Pencil className="w-4 h-4 mr-1" />Edit Mode</> : <><Eye className="w-4 h-4 mr-1" />Live Mode</>}
          </Button>
          {editMode && (
            <Button size="sm" onClick={() => handleAddSynapse()} style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff' }}>
              <Plus className="w-4 h-4 mr-1" />Add Synapse
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries()} style={{ borderColor: 'rgba(202,220,252,0.1)', color: '#64748b' }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Canvas area */}
        <div className="flex-1 min-w-0 overflow-hidden" style={{ padding: '12px' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Cpu className="w-12 h-12 mx-auto mb-3 animate-pulse" style={{ color: '#a78bfa' }} />
                <div style={{ color: '#64748b' }}>Initialising neural network…</div>
              </div>
            </div>
          ) : neurons.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <div className="text-6xl mb-4">🧠</div>
                <div className="text-xl font-bold mb-2" style={{ color: '#CADCFC' }}>Brainiac is Empty</div>
                <div className="text-sm mb-6" style={{ color: '#64748b' }}>Load the 12 pre-configured neurons and 20 synapses that map the platform's data flows.</div>
                <Button onClick={handleSeedData} disabled={seeding} style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff' }}>
                  {seeding ? 'Seeding…' : '🧬 Initialise Neural Network'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.06)', background: 'rgba(5,8,20,0.8)' }}>
              <NeuralCanvas
                neurons={neurons}
                synapses={synapses}
                selectedNeuronId={selectedNeuronId}
                selectedSynapseId={selectedSynapseId}
                onNeuronClick={handleNeuronClick}
                onSynapseClick={handleSynapseClick}
                editMode={editMode}
              />
            </div>
          )}
        </div>

        {/* Right panel */}
        {(selectedNeuron || selectedSynapse) && (
          <div className="flex-none flex flex-col" style={{ width: '420px', minWidth: '380px', maxWidth: '440px', borderLeft: '1px solid rgba(202,220,252,0.08)', height: '100%' }}>
            <div className="flex items-center justify-between px-4 py-3 flex-none" style={{ borderBottom: '1px solid rgba(202,220,252,0.06)' }}>
              <span className="text-xs font-semibold tracking-widest" style={{ color: '#64748b' }}>
                {selectedSynapse ? 'SYNAPSE CONFIGURATOR' : 'NEURON INSPECTOR'}
              </span>
              <button onClick={() => { setSelectedNeuronId(null); setSelectedSynapseId(null); }}>
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(202,220,252,0.1) transparent' }}>
              {selectedSynapse ? (
                <SynapseConfigurator
                  synapse={selectedSynapse}
                  neurons={neurons}
                  onSaved={() => {}}
                  onDeleted={() => setSelectedSynapseId(null)}
                />
              ) : selectedNeuron ? (
                <NeuronPanel
                  neuron={selectedNeuron}
                  synapses={synapses}
                  neurons={neurons}
                  onSynapseClick={handleSynapseClick}
                  onAddSynapse={handleAddSynapse}
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Neuron list (no selection) */}
        {!selectedNeuron && !selectedSynapse && neurons.length > 0 && (
          <div className="w-56 flex-none p-3 overflow-y-auto" style={{ borderLeft: '1px solid rgba(202,220,252,0.06)' }}>
            <div className="text-[10px] font-semibold mb-3 tracking-widest" style={{ color: '#64748b' }}>ALL NEURONS</div>
            <div className="flex flex-col gap-1">
              {neurons.map(n => {
                const ins = synapses.filter(s => s.to_neuron_id === n.id).length;
                const outs = synapses.filter(s => s.from_neuron_id === n.id).length;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNeuronClick(n.id)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:opacity-80 transition-all w-full"
                    style={{ background: `${n.color}14`, border: `1px solid ${n.color}33` }}
                  >
                    <span className="text-base">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: '#CADCFC' }}>{n.short_code}</div>
                      <div className="text-[10px]" style={{ color: '#64748b' }}>{ins}↓ {outs}↑</div>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${n.health_status === 'Healthy' ? 'bg-emerald-400' : n.health_status === 'Degraded' ? 'bg-amber-400' : 'bg-red-400'}`} />
                  </button>
                );
              })}
              {editMode && (
                <button
                  onClick={async () => {
                    const name = prompt('Module key for new neuron (e.g. my_module):');
                    if (!name) return;
                    await base44.entities.Neuron.create({ module_key: name, display_name: name, short_code: name.slice(0, 4).toUpperCase(), category: 'Core', is_active: true, health_status: 'Healthy', position_x: 0.5, position_y: 0.5 });
                    qc.invalidateQueries({ queryKey: ['neurons'] });
                  }}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs w-full mt-1"
                  style={{ border: '1px dashed rgba(167,139,250,0.3)', color: '#a78bfa' }}
                >
                  <Plus className="w-3 h-3" /> Add Neuron
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <AddSynapseDialog
        open={addSynapseOpen}
        onClose={() => setAddSynapseOpen(false)}
        neurons={neurons}
        synapses={synapses}
        defaultFromId={addSynapseFromId}
      />
    </div>
  );
}