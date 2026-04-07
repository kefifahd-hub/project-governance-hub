import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ArrowRight, ArrowLeftRight, ChevronRight, RefreshCw } from 'lucide-react';

const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return d; }
}

function healthColor(s) {
  if (s?.health_status === 'Error' || s?.health_status === 'Broken') return '#ef4444';
  if (s?.health_status === 'Paused') return '#475569';
  if (!s?.is_active) return '#475569';
  return '#10b981';
}

export default function SynapsesManager({ synapses, neurons, onSynapseClick, onAddSynapse }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const neuronMap = useMemo(() => {
    const m = {};
    neurons.forEach(n => { m[n.id] = n; });
    return m;
  }, [neurons]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return synapses.filter(s => {
      const from = neuronMap[s.from_neuron_id];
      const to = neuronMap[s.to_neuron_id];
      if (filterFrom && s.from_neuron_id !== filterFrom) return false;
      if (filterTo && s.to_neuron_id !== filterTo) return false;
      if (filterStatus === 'active' && !s.is_active) return false;
      if (filterStatus === 'inactive' && s.is_active) return false;
      if (filterStatus === 'error' && s.health_status !== 'Error' && s.health_status !== 'Broken') return false;
      if (!q) return true;
      return s.synapse_name?.toLowerCase().includes(q) ||
        from?.display_name?.toLowerCase().includes(q) ||
        to?.display_name?.toLowerCase().includes(q);
    });
  }, [synapses, search, filterFrom, filterTo, filterStatus, neuronMap]);

  const toggleActive = async (s) => {
    await base44.entities.Synapse.update(s.id, { is_active: !s.is_active, health_status: !s.is_active ? 'Active' : 'Paused' });
    qc.invalidateQueries({ queryKey: ['synapses'] });
  };

  const handleDelete = async (id) => {
    await base44.entities.Synapse.delete(id);
    qc.invalidateQueries({ queryKey: ['synapses'] });
    setConfirmDelete(null);
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const bulkEnable = async () => {
    await Promise.all([...selected].map(id => base44.entities.Synapse.update(id, { is_active: true, health_status: 'Active' })));
    qc.invalidateQueries({ queryKey: ['synapses'] });
    setSelected(new Set());
  };

  const bulkDisable = async () => {
    await Promise.all([...selected].map(id => base44.entities.Synapse.update(id, { is_active: false, health_status: 'Paused' })));
    qc.invalidateQueries({ queryKey: ['synapses'] });
    setSelected(new Set());
  };

  const clearFilters = () => { setSearch(''); setFilterFrom(''); setFilterTo(''); setFilterStatus(''); };

  const hasFilters = search || filterFrom || filterTo || filterStatus;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#64748b' }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search synapses…" className="pl-7 h-8 text-xs" style={inputStyle} />
        </div>
        <Button size="sm" onClick={onAddSynapse}
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', whiteSpace: 'nowrap' }}>
          <Plus className="w-3.5 h-3.5 mr-1" />Add
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <Select value={filterFrom} onValueChange={setFilterFrom}>
          <SelectTrigger className="h-7 text-[10px]" style={inputStyle}><SelectValue placeholder="From neuron" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All sources</SelectItem>
            {neurons.map(n => <SelectItem key={n.id} value={n.id}>{n.icon} {n.short_code}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTo} onValueChange={setFilterTo}>
          <SelectTrigger className="h-7 text-[10px]" style={inputStyle}><SelectValue placeholder="To neuron" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All targets</SelectItem>
            {neurons.map(n => <SelectItem key={n.id} value={n.id}>{n.icon} {n.short_code}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-7 text-[10px]" style={inputStyle}><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px]" style={{ color: '#475569' }}>
          {filtered.length} of {synapses.length} synapses
          {selected.size > 0 && <span className="ml-2 text-violet-400">· {selected.size} selected</span>}
        </div>
        <div className="flex items-center gap-1">
          {selected.size > 0 && (
            <>
              <button onClick={bulkEnable} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Enable all</button>
              <button onClick={bulkDisable} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(71,85,105,0.3)', color: '#94a3b8' }}>Disable all</button>
            </>
          )}
          {hasFilters && (
            <button onClick={clearFilters} className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1" style={{ color: '#64748b' }}>
              <RefreshCw className="w-2.5 h-2.5" />Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(202,220,252,0.1) transparent' }}>
        {filtered.map(s => {
          const from = neuronMap[s.from_neuron_id];
          const to = neuronMap[s.to_neuron_id];
          const hc = healthColor(s);
          const isSel = selected.has(s.id);

          return (
            <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg group transition-all"
              style={{
                background: isSel ? 'rgba(124,58,237,0.12)' : 'rgba(30,39,97,0.25)',
                border: `1px solid ${isSel ? 'rgba(124,58,237,0.4)' : 'rgba(202,220,252,0.08)'}`,
              }}>

              {/* Checkbox */}
              <input type="checkbox" checked={isSel} onChange={() => toggleSelect(s.id)}
                className="w-3 h-3 accent-violet-500 flex-shrink-0 cursor-pointer" />

              {/* Main content */}
              <button onClick={() => onSynapseClick(s.id)} className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold truncate" style={{ color: '#CADCFC' }}>{s.synapse_name}</span>
                  {s.is_critical && <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>CRITICAL</span>}
                </div>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#64748b' }}>
                  <span>{from?.icon} {from?.short_code || '?'}</span>
                  {s.synapse_type === 'Bidirectional'
                    ? <ArrowLeftRight className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    : <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: '#64748b' }} />}
                  <span>{to?.icon} {to?.short_code || '?'}</span>
                  <span>·</span>
                  <span>{s.fire_count_24h || 0} fires/day</span>
                  {s.last_fired && <><span>·</span><span>{formatDate(s.last_fired)}</span></>}
                </div>
              </button>

              {/* Health dot */}
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hc }} />

              {/* Toggle */}
              <button onClick={() => toggleActive(s)}>
                {s.is_active
                  ? <ToggleRight className="w-5 h-5" style={{ color: '#10b981' }} />
                  : <ToggleLeft className="w-5 h-5" style={{ color: '#475569' }} />}
              </button>

              {/* Edit */}
              <button onClick={() => onSynapseClick(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/5">
                <Pencil className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
              </button>

              {/* Delete */}
              {confirmDelete === s.id ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDelete(s.id)} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Delete</button>
                  <button onClick={() => setConfirmDelete(null)} className="text-[10px] px-1 py-0.5 rounded" style={{ color: '#64748b' }}>✕</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: '#475569' }}>
            {hasFilters ? 'No synapses match filters' : 'No synapses yet'}
          </div>
        )}
      </div>
    </div>
  );
}