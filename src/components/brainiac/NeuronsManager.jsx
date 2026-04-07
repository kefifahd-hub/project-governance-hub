import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react';

const CATEGORIES = ['Core', 'Integration', 'Governance', 'Output', 'Intelligence'];
const HEALTH_OPTIONS = ['Healthy', 'Degraded', 'Error', 'Offline'];
const ICONS = ['🧠','📊','📅','⚡','🔧','🏗️','📋','🎯','🔬','💰','🌐','🤖','📈','🔗','⚙️','🗂️'];
const COLORS = ['#6366f1','#00A896','#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316'];

const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };

function NeuronForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    module_key: '', display_name: '', short_code: '', description: '',
    icon: '🧠', color: '#6366f1', category: 'Core',
    is_active: true, health_status: 'Healthy',
    position_x: 0.5, position_y: 0.5,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: 'rgba(30,39,97,0.3)', border: '1px solid rgba(202,220,252,0.12)' }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold tracking-widest block mb-1" style={{ color: '#64748b' }}>MODULE KEY *</label>
          <Input value={form.module_key} onChange={e => set('module_key', e.target.value)} placeholder="e.g. finance_model" className="h-8 text-xs" style={inputStyle} />
        </div>
        <div>
          <label className="text-[10px] font-semibold tracking-widest block mb-1" style={{ color: '#64748b' }}>DISPLAY NAME *</label>
          <Input value={form.display_name} onChange={e => set('display_name', e.target.value)} placeholder="e.g. Finance Model" className="h-8 text-xs" style={inputStyle} />
        </div>
        <div>
          <label className="text-[10px] font-semibold tracking-widest block mb-1" style={{ color: '#64748b' }}>SHORT CODE</label>
          <Input value={form.short_code} onChange={e => set('short_code', e.target.value.toUpperCase().slice(0, 6))} placeholder="FIN" className="h-8 text-xs font-mono" style={inputStyle} />
        </div>
        <div>
          <label className="text-[10px] font-semibold tracking-widest block mb-1" style={{ color: '#64748b' }}>CATEGORY</label>
          <Select value={form.category} onValueChange={v => set('category', v)}>
            <SelectTrigger className="h-8 text-xs" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold tracking-widest block mb-1" style={{ color: '#64748b' }}>DESCRIPTION</label>
        <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does this neuron do?" className="h-8 text-xs" style={inputStyle} />
      </div>

      <div>
        <label className="text-[10px] font-semibold tracking-widest block mb-1.5" style={{ color: '#64748b' }}>ICON</label>
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map(ic => (
            <button key={ic} onClick={() => set('icon', ic)}
              className="w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all"
              style={{ background: form.icon === ic ? 'rgba(167,139,250,0.25)' : 'rgba(30,39,97,0.4)', border: `1px solid ${form.icon === ic ? '#a78bfa' : 'rgba(202,220,252,0.1)'}` }}>
              {ic}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold tracking-widest block mb-1.5" style={{ color: '#64748b' }}>COLOR</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button key={c} onClick={() => set('color', c)}
              className="w-7 h-7 rounded-full transition-all"
              style={{ background: c, border: form.color === c ? '2px solid white' : '2px solid transparent', transform: form.color === c ? 'scale(1.2)' : 'scale(1)' }} />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={() => onSave(form)} size="sm" style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#fff', flex: 1 }}>
          <Check className="w-3.5 h-3.5 mr-1" />{initial?.id ? 'Update' : 'Create'} Neuron
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline" style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94a3b8' }}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function NeuronsManager({ neurons, synapses, onNeuronClick }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return neurons.filter(n =>
      n.display_name?.toLowerCase().includes(q) ||
      n.module_key?.toLowerCase().includes(q) ||
      n.short_code?.toLowerCase().includes(q) ||
      n.category?.toLowerCase().includes(q)
    );
  }, [neurons, search]);

  const connectedCount = (n) => synapses.filter(s => s.from_neuron_id === n.id || s.to_neuron_id === n.id).length;

  const handleCreate = async (form) => {
    await base44.entities.Neuron.create(form);
    qc.invalidateQueries({ queryKey: ['neurons'] });
    setShowAdd(false);
  };

  const handleUpdate = async (form) => {
    await base44.entities.Neuron.update(form.id, form);
    qc.invalidateQueries({ queryKey: ['neurons'] });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.Neuron.delete(id);
    qc.invalidateQueries({ queryKey: ['neurons'] });
    setConfirmDelete(null);
  };

  const toggleActive = async (n) => {
    await base44.entities.Neuron.update(n.id, { is_active: !n.is_active });
    qc.invalidateQueries({ queryKey: ['neurons'] });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#64748b' }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search neurons…" className="pl-7 h-8 text-xs" style={inputStyle} />
        </div>
        <Button size="sm" onClick={() => { setShowAdd(true); setEditingId(null); }}
          style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#fff', whiteSpace: 'nowrap' }}>
          <Plus className="w-3.5 h-3.5 mr-1" />Add
        </Button>
      </div>

      <div className="text-[10px] mb-2" style={{ color: '#475569' }}>
        {filtered.length} of {neurons.length} neurons
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-3">
          <NeuronForm onSave={handleCreate} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(202,220,252,0.1) transparent' }}>
        {filtered.map(n => (
          <div key={n.id}>
            {editingId === n.id ? (
              <NeuronForm initial={n} onSave={handleUpdate} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg group transition-all"
                style={{ background: `${n.color}12`, border: `1px solid ${n.color}28` }}>
                {/* Icon + name */}
                <button onClick={() => onNeuronClick(n.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  <span className="text-lg flex-shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: '#CADCFC' }}>{n.display_name}</div>
                    <div className="text-[10px] flex items-center gap-1.5" style={{ color: '#64748b' }}>
                      <span className="font-mono">{n.short_code}</span>
                      <span>·</span>
                      <span>{n.category}</span>
                      <span>·</span>
                      <span>{connectedCount(n)} synapses</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 flex-shrink-0" style={{ color: '#CADCFC' }} />
                </button>

                {/* Status toggle */}
                <button onClick={() => toggleActive(n)} title={n.is_active ? 'Deactivate' : 'Activate'}>
                  {n.is_active
                    ? <ToggleRight className="w-5 h-5" style={{ color: '#10b981' }} />
                    : <ToggleLeft className="w-5 h-5" style={{ color: '#475569' }} />}
                </button>

                {/* Health dot */}
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: n.health_status === 'Healthy' ? '#10b981' : n.health_status === 'Degraded' ? '#f59e0b' : n.health_status === 'Error' ? '#ef4444' : '#475569' }} />

                {/* Edit */}
                <button onClick={() => setEditingId(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/5">
                  <Pencil className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                </button>

                {/* Delete */}
                {confirmDelete === n.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(n.id)} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Delete</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-[10px] px-2 py-0.5 rounded" style={{ color: '#64748b' }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: '#475569' }}>
            {search ? 'No neurons match your search' : 'No neurons yet'}
          </div>
        )}
      </div>
    </div>
  );
}