import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Lock, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const DEFAULT_WEEKLY_SECTIONS = [
  { id: 'rag', label: 'RAG Status Overview', icon: '🚦', source: 'Manual', locked: true },
  { id: 'summary', label: 'Executive Summary', icon: '📝', source: 'Manual', locked: true },
  { id: 'schedule', label: 'Schedule Status', icon: '📅', source: 'Schedule', locked: false },
  { id: 'cost', label: 'Cost & Financial', icon: '💰', source: 'Finance Model', locked: false },
  { id: 'actions', label: 'Action Tracker', icon: '📋', source: 'Action Tracker', locked: false },
  { id: 'risks', label: 'Risk Status', icon: '⚠️', source: 'Risk Register', locked: false },
  { id: 'changes', label: 'Change Management', icon: '🔄', source: 'Change Management', locked: false },
  { id: 'site', label: 'Site Activity', icon: '🏗️', source: 'Daily Site Reports', locked: false },
  { id: 'quality', label: 'Quality Gates', icon: '🚩', source: 'Quality Gates', locked: false },
  { id: 'lookahead', label: '2-Week Look-Ahead', icon: '🔭', source: 'All Modules', locked: false },
  { id: 'feasibility', label: 'Feasibility Score', icon: '📊', source: 'Feasibility Study', locked: false },
  { id: 'procurement', label: 'Procurement Status', icon: '📦', source: 'Action Tracker', locked: false },
  { id: 'hse', label: 'HSE / Safety', icon: '🦺', source: 'Daily Site Reports', locked: false },
  { id: 'stakeholder', label: 'Stakeholder Update', icon: '👥', source: 'Manual', locked: false },
  { id: 'photos', label: 'Photo Documentation', icon: '📷', source: 'Daily Site Reports', locked: false },
];

export default function SectionConfigModal({ projectId, reportType, enabledSections, onSave, onClose }) {
  const allSections = DEFAULT_WEEKLY_SECTIONS;
  const [enabled, setEnabled] = useState(new Set(enabledSections));
  const [customSections, setCustomSections] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('📌');

  function toggle(id) {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    const ordered = [...allSections.filter(s => enabled.has(s.id)).map(s => s.id), ...customSections.filter(s => enabled.has(s.id)).map(s => s.id)];
    onSave(ordered);
  }

  function addCustom() {
    if (!newLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    setCustomSections(prev => [...prev, { id, label: newLabel.trim(), icon: newIcon, source: 'Manual', locked: false, isCustom: true }]);
    setEnabled(prev => new Set([...prev, id]));
    setNewLabel('');
    setNewIcon('📌');
  }

  const allVisible = [...allSections, ...customSections];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: 'rgba(15,23,42,0.99)', border: '1px solid rgba(202,220,252,0.2)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>
          <div>
            <h2 className="font-bold" style={{ color: '#CADCFC' }}>⚙️ Section Configuration</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Toggle, reorder, and add custom sections</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#64748b' }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-1">
          {allVisible.map(section => (
            <div key={section.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all" style={{ background: enabled.has(section.id) ? 'rgba(0,168,150,0.08)' : 'rgba(30,39,97,0.3)', border: '1px solid ' + (enabled.has(section.id) ? 'rgba(0,168,150,0.2)' : 'transparent') }}>
              <GripVertical className="w-4 h-4 shrink-0" style={{ color: '#334155' }} />
              <span className="text-base">{section.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm" style={{ color: '#CADCFC' }}>{section.label}</span>
                <span className="text-xs ml-2" style={{ color: '#334155' }}>{section.source}</span>
              </div>
              {section.locked ? (
                <Lock className="w-4 h-4 shrink-0" style={{ color: '#475569' }} />
              ) : section.isCustom ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => setEnabled(prev => { const n = new Set(prev); n.has(section.id) ? n.delete(section.id) : n.add(section.id); return n; })} className="w-8 h-4 rounded-full transition-all relative" style={{ background: enabled.has(section.id) ? '#00A896' : '#1e293b' }}>
                    <span className="absolute top-0.5 transition-all" style={{ left: enabled.has(section.id) ? '50%' : '2px', width: 12, height: 12, borderRadius: '50%', background: '#fff', display: 'block' }} />
                  </button>
                  <button onClick={() => setCustomSections(prev => prev.filter(s => s.id !== section.id))}><Trash2 className="w-3.5 h-3.5 ml-1" style={{ color: '#ef4444' }} /></button>
                </div>
              ) : (
                <button onClick={() => toggle(section.id)} className="w-8 h-4 rounded-full transition-all relative shrink-0" style={{ background: enabled.has(section.id) ? '#00A896' : '#1e293b' }}>
                  <span className="absolute top-0.5 transition-all" style={{ left: enabled.has(section.id) ? '50%' : '2px', width: 12, height: 12, borderRadius: '50%', background: '#fff', display: 'block' }} />
                </button>
              )}
            </div>
          ))}
          {/* Add custom */}
          <div className="pt-3 border-t" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: '#64748b' }}>+ Add Custom Section</p>
            <div className="flex gap-2">
              <Input value={newIcon} onChange={e => setNewIcon(e.target.value)} className="w-12 text-center" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Section name..." className="flex-1" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              <Button size="sm" onClick={addCustom} style={{ background: 'rgba(0,168,150,0.2)', color: '#00A896', border: '1px solid rgba(0,168,150,0.3)' }}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>
          <span className="text-xs" style={{ color: '#64748b' }}>{enabled.size} of {allVisible.length} sections active</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>Done</Button>
          </div>
        </div>
      </div>
    </div>
  );
}