import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RefreshCw, Eye, Pencil, X, Cpu, Search, Layers, Table2, Network, CheckCircle2, AlertTriangle, ChevronDown, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import NeuralCanvas from '../components/brainiac/NeuralCanvas';
import NeuronPanel from '../components/brainiac/NeuronPanel';
import SynapseConfigurator from '../components/brainiac/SynapseConfigurator';
import AddSynapseDialog from '../components/brainiac/AddSynapseDialog';
import NeuronsManager from '../components/brainiac/NeuronsManager';
import SynapsesManager from '../components/brainiac/SynapsesManager';
import { NEURON_SEEDS, SYNAPSE_SEEDS } from '../components/brainiac/neuronSeedData';

const TAB_VIEWS = [
  { key: 'canvas', label: 'Canvas', icon: Network },
  { key: 'neurons', label: 'Neurons', icon: Layers },
  { key: 'synapses', label: 'Synapses', icon: Table2 },
];

export default function Brainiac() {
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [view, setView] = useState('canvas');
  const [selectedNeuronId, setSelectedNeuronId] = useState(null);
  const [selectedSynapseId, setSelectedSynapseId] = useState(null);
  const [addSynapseOpen, setAddSynapseOpen] = useState(false);
  const [addSynapseFromId, setAddSynapseFromId] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [panelWidth, setPanelWidth] = useState(420);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const dragRef = useRef(null);

  const startResize = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    const onMove = (ev) => {
      const delta = startX - ev.clientX;
      const newW = Math.max(300, Math.min(900, startW + delta));
      setPanelWidth(newW);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panelWidth]);

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
    const created = await base44.entities.Neuron.bulkCreate(NEURON_SEEDS);
    const synapseData = SYNAPSE_SEEDS(created);
    if (synapseData.length > 0) await base44.entities.Synapse.bulkCreate(synapseData);
    qc.invalidateQueries({ queryKey: ['neurons'] });
    qc.invalidateQueries({ queryKey: ['synapses'] });
    setSeeding(false);
  };

  const handleNeuronClick = (id) => { setSelectedNeuronId(id); setSelectedSynapseId(null); };
  const handleSynapseClick = (id) => { setSelectedSynapseId(id); setSelectedNeuronId(null); };
  const handleAddSynapse = (fromId = null) => { setAddSynapseFromId(fromId); setAddSynapseOpen(true); setAddMenuOpen(false); };
  const handleEditNeuron = (id) => { setSelectedNeuronId(id); setSelectedSynapseId(null); setView('canvas'); };

  const handleValidateAll = () => {
    const neuronIds = new Set(neurons.map(n => n.id));
    const broken = synapses.filter(s => !neuronIds.has(s.from_neuron_id) || !neuronIds.has(s.to_neuron_id));
    const errors = synapses.filter(s => s.health_status === 'Error' || s.health_status === 'Broken');
    setValidationResult({ broken: broken.length, errors: errors.length, total: synapses.length });
    setTimeout(() => setValidationResult(null), 5000);
  };

  const handleAddNeuronQuick = async () => {
    setAddMenuOpen(false);
    const name = prompt('Display name for new neuron:');
    if (!name) return;
    await base44.entities.Neuron.create({
      module_key: name.toLowerCase().replace(/\s+/g, '_'),
      display_name: name,
      short_code: name.slice(0, 4).toUpperCase(),
      category: 'Core', is_active: true, health_status: 'Healthy',
      icon: '🧠', color: '#6366f1',
      position_x: 0.5, position_y: 0.5,
    });
    qc.invalidateQueries({ queryKey: ['neurons'] });
    setView('neurons');
  };

  const isLoading = loadingNeurons || loadingSynapses;

  const showRightPanel = view === 'canvas' && (selectedNeuron || selectedSynapse);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)', background: 'linear-gradient(135deg, #080d1a 0%, #0f172a 50%, #0d1b2e 100%)' }}>

      {/* ── Toolbar ── */}
      <div className="flex-none px-4 py-2.5 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid rgba(202,220,252,0.08)' }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mr-1">
          <span className="text-xl" style={{ filter: 'drop-shadow(0 0 8px #a78bfa)' }}>🧠</span>
          <div>
            <div className="font-bold text-sm leading-tight" style={{ color: '#CADCFC' }}>Brainiac</div>
            <div className="text-[10px] leading-tight" style={{ color: '#64748b' }}>Neural Flow Center</div>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(30,39,97,0.4)' }}>
          {TAB_VIEWS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setView(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: view === key ? 'rgba(124,58,237,0.3)' : 'transparent',
                color: view === key ? '#a78bfa' : '#64748b',
                border: view === key ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
              }}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#64748b' }} />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Find neuron or synapse…" className="pl-7 h-8 text-xs" 
            style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }} />
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="hidden md:flex items-center gap-2 text-[11px]" style={{ color: '#64748b' }}>
            <span>{neurons.length} neurons</span><span>·</span>
            <span>{activeSynapses}/{synapses.length} synapses active</span><span>·</span>
            <span className={allHealthy ? 'text-emerald-400' : 'text-red-400'}>
              {allHealthy ? '✓ Healthy' : `⚠ ${errorSynapses} errors`}
            </span>
          </div>
        )}

        {/* Validation result toast */}
        {validationResult && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: validationResult.broken === 0 && validationResult.errors === 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${validationResult.broken === 0 && validationResult.errors === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: validationResult.broken === 0 && validationResult.errors === 0 ? '#10b981' : '#ef4444' }}>
            {validationResult.broken === 0 && validationResult.errors === 0
              ? <><CheckCircle2 className="w-3.5 h-3.5" />All {validationResult.total} synapses valid</>
              : <><AlertTriangle className="w-3.5 h-3.5" />{validationResult.broken} broken, {validationResult.errors} errors</>}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Validate */}
          <Button size="sm" variant="outline" onClick={handleValidateAll}
            style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#94a3b8', fontSize: 11 }}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Validate
          </Button>

          {/* Edit mode */}
          {view === 'canvas' && (
            <Button size="sm" variant="outline" onClick={() => setEditMode(e => !e)}
              style={{ borderColor: editMode ? '#a78bfa55' : 'rgba(202,220,252,0.15)', color: editMode ? '#a78bfa' : '#CADCFC', background: editMode ? '#a78bfa11' : 'transparent' }}>
              {editMode ? <><Pencil className="w-3.5 h-3.5 mr-1" />Edit Mode</> : <><Eye className="w-3.5 h-3.5 mr-1" />Live Mode</>}
            </Button>
          )}

          {/* + Add dropdown */}
          <div className="relative">
            <Button size="sm" onClick={() => setAddMenuOpen(o => !o)}
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff' }}>
              <Plus className="w-3.5 h-3.5 mr-1" />Add <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            {addMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAddMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl min-w-[160px] py-1"
                  style={{ background: 'rgba(10,15,35,0.98)', border: '1px solid rgba(202,220,252,0.15)' }}>
                  <button onClick={handleAddNeuronQuick}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                    style={{ color: '#CADCFC' }}>
                    <Layers className="w-3.5 h-3.5 text-teal-400" />Add Neuron
                  </button>
                  <button onClick={() => handleAddSynapse()}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                    style={{ color: '#CADCFC' }}>
                    <Network className="w-3.5 h-3.5 text-violet-400" />Add Synapse
                  </button>
                </div>
              </>
            )}
          </div>

          <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries()} style={{ borderColor: 'rgba(202,220,252,0.1)', color: '#64748b' }}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Canvas View ── */}
        {view === 'canvas' && (
          <>
            <div className="flex-1 min-w-0 overflow-hidden p-3">
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
                    onEditNeuron={handleEditNeuron}
                    onAddSynapseFrom={(fromId) => handleAddSynapse(fromId)}
                    editMode={editMode}
                  />
                </div>
              )}
            </div>

            {/* Right panel — detail */}
            {showRightPanel && (
              <>
                {/* Drag handle */}
                <div
                  ref={dragRef}
                  onMouseDown={startResize}
                  className="flex-none flex items-center justify-center w-3 cursor-col-resize group transition-colors"
                  style={{ background: 'transparent', borderLeft: '1px solid rgba(202,220,252,0.08)', zIndex: 10 }}
                  title="Drag to resize"
                >
                  <GripVertical className="w-3 h-5 opacity-20 group-hover:opacity-60 transition-opacity" style={{ color: '#CADCFC' }} />
                </div>

                <div className="flex-none flex flex-col" style={{ width: panelExpanded ? '100%' : panelWidth, minWidth: 300, borderLeft: '1px solid rgba(202,220,252,0.08)', height: '100%' }}>
                  <div className="flex items-center justify-between px-4 py-3 flex-none" style={{ borderBottom: '1px solid rgba(202,220,252,0.06)' }}>
                    <span className="text-xs font-semibold tracking-widest" style={{ color: '#64748b' }}>
                      {selectedSynapse ? 'SYNAPSE CONFIGURATOR' : 'NEURON INSPECTOR'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPanelExpanded(e => !e)} title={panelExpanded ? 'Shrink' : 'Expand'}>
                        {panelExpanded
                          ? <Minimize2 className="w-4 h-4" style={{ color: '#64748b' }} />
                          : <Maximize2 className="w-4 h-4" style={{ color: '#64748b' }} />}
                      </button>
                      <button onClick={() => { setSelectedNeuronId(null); setSelectedSynapseId(null); setPanelExpanded(false); }}>
                        <X className="w-4 h-4" style={{ color: '#64748b' }} />
                      </button>
                    </div>
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
              </>
            )}

            {/* Neuron mini-list when nothing selected */}
            {!selectedNeuron && !selectedSynapse && neurons.length > 0 && (
              <div className="w-56 flex-none p-3 overflow-y-auto" style={{ borderLeft: '1px solid rgba(202,220,252,0.06)' }}>
                <div className="text-[10px] font-semibold mb-3 tracking-widest" style={{ color: '#64748b' }}>ALL NEURONS</div>
                <div className="text-[10px] mb-2" style={{ color: '#334155' }}>Right-click on canvas for options</div>
                <div className="flex flex-col gap-1">
                  {neurons
                    .filter(n => !searchQuery || n.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || n.short_code?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(n => {
                      const ins = synapses.filter(s => s.to_neuron_id === n.id).length;
                      const outs = synapses.filter(s => s.from_neuron_id === n.id).length;
                      return (
                        <button key={n.id} onClick={() => handleNeuronClick(n.id)}
                          className="flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:opacity-80 transition-all w-full"
                          style={{ background: `${n.color}14`, border: `1px solid ${n.color}33` }}>
                          <span className="text-base">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate" style={{ color: '#CADCFC' }}>{n.short_code}</div>
                            <div className="text-[10px]" style={{ color: '#64748b' }}>{ins}↓ {outs}↑</div>
                          </div>
                          <div className={`w-1.5 h-1.5 rounded-full ${n.health_status === 'Healthy' ? 'bg-emerald-400' : n.health_status === 'Degraded' ? 'bg-amber-400' : 'bg-red-400'}`} />
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Neurons Manager View ── */}
        {view === 'neurons' && (
          <div className="flex-1 p-4 overflow-hidden">
            <NeuronsManager
              neurons={neurons}
              synapses={synapses}
              onNeuronClick={(id) => { handleNeuronClick(id); setView('canvas'); }}
            />
          </div>
        )}

        {/* ── Synapses Manager View ── */}
        {view === 'synapses' && (
          <div className="flex-1 p-4 overflow-hidden">
            <SynapsesManager
              synapses={synapses}
              neurons={neurons}
              onSynapseClick={(id) => { handleSynapseClick(id); setView('canvas'); }}
              onAddSynapse={() => handleAddSynapse()}
            />
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