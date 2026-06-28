import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Workflow, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '../utils';

const DEFAULT_STAGES = [
  { id: 's1', name: 'Submitted', type: 'Stage', x: 50, y: 100, stakeholders: [] },
  { id: 's2', name: 'Impact Assessment', type: 'Stage', x: 250, y: 100, stakeholders: [] },
  { id: 's3', name: 'CCB Review', type: 'Gate', x: 450, y: 100, stakeholders: [] },
  { id: 'd1', name: 'Approved', type: 'Decision', x: 650, y: 60, stakeholders: [] },
  { id: 'd2', name: 'Rejected', type: 'Decision', x: 650, y: 160, stakeholders: [] },
  { id: 's4', name: 'Implementation', type: 'Stage', x: 850, y: 60, stakeholders: [] },
  { id: 's5', name: 'Verification', type: 'Stage', x: 1050, y: 60, stakeholders: [] },
  { id: 's6', name: 'Closed', type: 'Stage', x: 1250, y: 60, stakeholders: [] },
];

const DEFAULT_CONNECTIONS = [
  { id: 'c1', from: 's1', to: 's2' },
  { id: 'c2', from: 's2', to: 's3' },
  { id: 'c3', from: 's3', to: 'd1' },
  { id: 'c4', from: 's3', to: 'd2' },
  { id: 'c5', from: 'd1', to: 's4' },
  { id: 'c6', from: 's4', to: 's5' },
  { id: 'c7', from: 's5', to: 's6' },
];

const TYPE_COLORS = { 'Stage': '#3b82f6', 'Decision': '#f59e0b', 'Gate': '#a855f7' };
const STAKEHOLDER_ROLES = ['Owner', 'Approver', 'Reviewer', 'Informed'];

export default function ChangeWorkflow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const canvasRef = useRef(null);
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [connections, setConnections] = useState(DEFAULT_CONNECTIONS);
  const [selectedStage, setSelectedStage] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { data: workflow } = useQuery({
    queryKey: ['changeWorkflow', projectId],
    queryFn: async () => { const r = await base44.entities.ChangeWorkflow.filter({ projectId }); return r[0] || null; },
    enabled: !!projectId,
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders', projectId],
    queryFn: () => base44.entities.Stakeholder.filter({ projectId }),
    enabled: !!projectId,
  });

  // Load saved workflow
  useEffect(() => {
    if (workflow) {
      try { setStages(JSON.parse(workflow.stages) || DEFAULT_STAGES); } catch { /* keep defaults */ }
      try { setConnections(JSON.parse(workflow.connections) || DEFAULT_CONNECTIONS); } catch { /* keep defaults */ }
    }
  }, [workflow]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (workflow?.id) return base44.entities.ChangeWorkflow.update(workflow.id, data);
      return base44.entities.ChangeWorkflow.create({ ...data, projectId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['changeWorkflow', projectId] }),
  });

  const handleSave = () => {
    saveMutation.mutate({ stages: JSON.stringify(stages), connections: JSON.stringify(connections) });
  };

  const handleMouseDown = (e, stageId) => {
    const stage = stages.find(s => s.id === stageId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging(stageId);
    setDragOffset({ x: e.clientX - rect.left - stage.x, y: e.clientY - rect.top - stage.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, e.clientX - rect.left - dragOffset.x);
    const newY = Math.max(0, e.clientY - rect.top - dragOffset.y);
    setStages(prev => prev.map(s => s.id === dragging ? { ...s, x: newX, y: newY } : s));
  }, [dragging, dragOffset]);

  const handleMouseUp = () => setDragging(null);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [handleMouseMove]);

  const addStakeholderToStage = (stageId, stakeholderId, role) => {
    setStages(prev => prev.map(s => {
      if (s.id !== stageId) return s;
      const existing = s.stakeholders || [];
      if (existing.some(sh => sh.stakeholderId === stakeholderId && sh.role === role)) return s;
      return { ...s, stakeholders: [...existing, { stakeholderId, role }] };
    }));
  };

  const removeStakeholderFromStage = (stageId, stakeholderId, role) => {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, stakeholders: (s.stakeholders || []).filter(sh => !(sh.stakeholderId === stakeholderId && sh.role === role)) } : s));
  };

  const getStakeholderName = (id) => stakeholders.find(s => s.id === id)?.stakeholderName || 'Unknown';

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <div className="flex items-center gap-2">
              <div className="bg-pink-600 p-2 rounded-lg text-white"><Workflow className="w-5 h-5" /></div>
              <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>Change Workflow</h1>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending} style={{ background: '#00A896', color: '#F8FAFC' }}>Save Workflow</Button>
        </div>
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Canvas */}
        <div className="flex-1 overflow-auto" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <div ref={canvasRef} className="relative" style={{ width: '1500px', height: '600px', backgroundImage: 'radial-gradient(rgba(202,220,252,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            {/* Connections */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              {connections.map(conn => {
                const from = stages.find(s => s.id === conn.from);
                const to = stages.find(s => s.id === conn.to);
                if (!from || !to) return null;
                const x1 = from.x + 120, y1 = from.y + 25;
                const x2 = to.x, y2 = to.y + 25;
                const midX = (x1 + x2) / 2;
                return (
                  <g key={conn.id}>
                    <path d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`} stroke="rgba(0,168,150,0.4)" strokeWidth="2" fill="none" />
                    <polygon points={`${x2-8},${y2-4} ${x2-8},${y2+4} ${x2},${y2}`} fill="rgba(0,168,150,0.6)" />
                  </g>
                );
              })}
            </svg>
            {/* Stages */}
            {stages.map(stage => (
              <div
                key={stage.id}
                onMouseDown={(e) => handleMouseDown(e, stage.id)}
                onClick={() => setSelectedStage(stage.id)}
                className="absolute cursor-move select-none"
                style={{ left: stage.x, top: stage.y, width: '120px' }}
              >
                <div
                  className="rounded-lg px-3 py-2 text-center text-sm font-medium transition-all"
                  style={{
                    background: selectedStage === stage.id ? 'rgba(0,168,150,0.2)' : 'rgba(30,39,97,0.8)',
                    border: `2px solid ${selectedStage === stage.id ? '#00A896' : TYPE_COLORS[stage.type] || '#3b82f6'}`,
                    color: '#CADCFC',
                  }}
                >
                  {stage.name}
                </div>
                <div className="text-xs text-center mt-0.5" style={{ color: TYPE_COLORS[stage.type] || '#3b82f6' }}>{stage.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        {selectedStage && (() => {
          const stage = stages.find(s => s.id === selectedStage);
          if (!stage) return null;
          return (
            <div className="w-80 border-l overflow-y-auto" style={{ background: 'rgba(15,23,42,0.95)', borderColor: 'rgba(202,220,252,0.1)' }}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: '#CADCFC' }}>{stage.name}</h3>
                  <button onClick={() => setSelectedStage(null)} className="p-1 rounded hover:bg-slate-700" style={{ color: '#94A3B8' }}><X className="w-4 h-4" /></button>
                </div>

                {/* Stakeholders */}
                <Label style={{ color: '#94A3B8' }} className="mb-2 block">Assigned Stakeholders</Label>
                <div className="space-y-1.5 mb-4">
                  {(stage.stakeholders || []).map((sh, idx) => (
                    <div key={idx} className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: 'rgba(30,39,97,0.5)' }}>
                      <div>
                        <span className="text-sm" style={{ color: '#CADCFC' }}>{getStakeholderName(sh.stakeholderId)}</span>
                        <span className="text-xs ml-2 px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">{sh.role}</span>
                      </div>
                      <button onClick={() => removeStakeholderFromStage(stage.id, sh.stakeholderId, sh.role)} className="p-1 rounded hover:bg-red-500/20" style={{ color: '#64748b' }}><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {(stage.stakeholders || []).length === 0 && <p className="text-xs" style={{ color: '#64748b' }}>No stakeholders assigned.</p>}
                </div>

                {/* Add stakeholder */}
                {stakeholders.length > 0 && <AddStakeholderForm stakeholders={stakeholders} onAdd={(sid, role) => addStakeholderToStage(stage.id, sid, role)} />}
                {stakeholders.length === 0 && <p className="text-xs" style={{ color: '#64748b' }}>Add stakeholders in the Stakeholder Register first.</p>}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function AddStakeholderForm({ stakeholders, onAdd }) {
  const [sid, setSid] = useState('');
  const [role, setRole] = useState('Reviewer');
  return (
    <div className="space-y-2 pt-2 border-t border-slate-700/50">
      <Label style={{ color: '#94A3B8' }} className="text-xs flex items-center gap-1"><UserPlus className="w-3 h-3" /> Assign Stakeholder</Label>
      <Select value={sid} onValueChange={setSid}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{stakeholders.map(s => <SelectItem key={s.id} value={s.id}>{s.stakeholderName}</SelectItem>)}</SelectContent></Select>
      <div className="flex gap-2">
        <Select value={role} onValueChange={setRole}><SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100 flex-1"><SelectValue /></SelectTrigger><SelectContent>{STAKEHOLDER_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        <Button size="sm" disabled={!sid} onClick={() => { onAdd(sid, role); setSid(''); }} style={{ background: '#00A896', color: '#F8FAFC' }}>Add</Button>
      </div>
    </div>
  );
}