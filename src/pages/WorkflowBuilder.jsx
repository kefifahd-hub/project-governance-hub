import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Save, Copy, Archive, FileText, ArrowRightLeft, CheckCircle2, Wand2, Loader2 } from 'lucide-react';
import NodePalette from '@/components/workflow/NodePalette';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import NodeEditorDialog from '@/components/workflow/NodeEditorDialog';
import { makeNode, WORKFLOW_TEMPLATES } from '@/components/workflow/nodeTypes';

const CATEGORY_ICONS = {
  'Handover': ArrowRightLeft,
  'Document Creation': FileText,
  'Design Review': CheckCircle2,
  'Approval Process': CheckCircle2,
  'Custom': FileText,
};

export default function WorkflowBuilder() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Custom');
  const [showTemplates, setShowTemplates] = useState(false);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows', projectId],
    queryFn: () => base44.entities.Workflow.filter({ projectId }, '-created_date'),
    enabled: !!projectId,
  });

  const [activeWorkflowId, setActiveWorkflowId] = useState(null);
  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId) || workflows[0];
  const [nodes, setNodes] = useState([]);
  const [wfName, setWfName] = useState('');
  const [wfDescription, setWfDescription] = useState('');
  const [wfCategory, setWfCategory] = useState('Custom');

  // Sync local state when active workflow changes
  useEffect(() => {
    if (activeWorkflow) {
      try {
        setNodes(JSON.parse(activeWorkflow.nodes || '[]'));
      } catch { setNodes([]); }
      setWfName(activeWorkflow.name || '');
      setWfDescription(activeWorkflow.description || '');
      setWfCategory(activeWorkflow.category || 'Custom');
    }
  }, [activeWorkflow?.id]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Workflow.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows', projectId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Workflow.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows', projectId] }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.Workflow.update(id, { status: 'Archived' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows', projectId] }),
  });

  const handleAddNode = (type) => {
    const node = makeNode(type);
    setNodes((prev) => [...prev, node]);
  };

  const handleDeleteNode = (id) => setNodes((prev) => prev.filter((n) => n.id !== id));

  const handleSave = () => {
    if (!activeWorkflow) return;
    updateMutation.mutate({
      id: activeWorkflow.id,
      data: {
        name: wfName,
        description: wfDescription,
        category: wfCategory,
        nodes: JSON.stringify(nodes),
        status: 'Active',
      },
    });
  };

  const handleCreateNew = () => {
    if (!newName.trim()) return;
    const nodesJson = JSON.stringify([makeNode('start'), makeNode('end')]);
    createMutation.mutate(
      { projectId, name: newName, category: newCategory, description: '', nodes: nodesJson, status: 'Draft' },
      {
        onSuccess: (created) => {
          setActiveWorkflowId(created.id);
          setShowNewDialog(false);
          setNewName('');
          qc.invalidateQueries({ queryKey: ['workflows', projectId] });
        },
      }
    );
  };

  const handleUseTemplate = (template) => {
    const templateNodes = template.nodes.map((n) => ({ ...makeNode(n.type), ...n, id: makeNode(n.type).id }));
    createMutation.mutate(
      {
        projectId,
        name: template.name,
        category: template.category,
        description: template.description,
        nodes: JSON.stringify(templateNodes),
        status: 'Draft',
      },
      {
        onSuccess: (created) => {
          setActiveWorkflowId(created.id);
          setShowTemplates(false);
          qc.invalidateQueries({ queryKey: ['workflows', projectId] });
        },
      }
    );
  };

  const selectedNode = nodes.find((n) => n.id === selectedId);

  const handleSaveNode = (updated) => {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#CADCFC' }}>Workflow Builder</h1>
          <p className="mt-1 text-sm" style={{ color: '#94A3B8' }}>Design drag-and-drop workflows for handovers, document creation, design reviews and approvals</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00A896' }} /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Workflow list */}
            <div className="lg:col-span-3">
              <Card className="p-4" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: '#CADCFC' }}>Workflows</h3>
                  <Button size="icon" variant="outline" onClick={() => setShowNewDialog(true)} style={{ borderColor: 'rgba(0,168,150,0.3)', color: '#00A896', height: '32px', width: '32px' }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                  {workflows.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: '#64748b' }}>No workflows yet</p>
                  )}
                  {workflows.map((wf) => {
                    const Icon = CATEGORY_ICONS[wf.category] || FileText;
                    const isActive = activeWorkflow?.id === wf.id;
                    return (
                      <button
                        key={wf.id}
                        onClick={() => setActiveWorkflowId(wf.id)}
                        className="w-full text-left p-2.5 rounded-lg flex items-center gap-2 transition-all"
                        style={{
                          background: isActive ? 'rgba(0,168,150,0.12)' : 'transparent',
                          border: isActive ? '1px solid rgba(0,168,150,0.3)' : '1px solid transparent',
                        }}
                      >
                        <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? '#00A896' : '#64748b' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: isActive ? '#CADCFC' : '#94A3B8' }}>{wf.name}</div>
                          <div className="text-[10px]" style={{ color: '#475569' }}>{wf.category} · {wf.status}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => setShowTemplates(true)}
                  style={{ borderColor: 'rgba(167,139,250,0.3)', color: '#a78bfa' }}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  From Template
                </Button>
              </Card>
            </div>

            {/* Center: Canvas */}
            <div className="lg:col-span-6">
              {activeWorkflow ? (
                <Card className="p-4" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
                  <div className="space-y-3 mb-4">
                    <Input
                      value={wfName}
                      onChange={(e) => setWfName(e.target.value)}
                      className="text-lg font-semibold"
                      style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}
                    />
                    <Textarea
                      value={wfDescription}
                      onChange={(e) => setWfDescription(e.target.value)}
                      placeholder="Workflow description..."
                      rows={2}
                      style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}
                    />
                    <div className="flex items-center gap-3">
                      <Select value={wfCategory} onValueChange={setWfCategory}>
                        <SelectTrigger className="w-48" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['Handover', 'Document Creation', 'Design Review', 'Approval Process', 'Custom'].map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(202,220,252,0.08)', color: '#64748b' }}>{nodes.length} steps</span>
                      <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(202,220,252,0.08)', color: '#64748b' }}>
                        ~{nodes.reduce((s, n) => s + (n.durationDays || 0), 0)}d total
                      </span>
                    </div>
                  </div>
                  <WorkflowCanvas
                    nodes={nodes}
                    onReorder={setNodes}
                    onSelect={(id) => { setSelectedId(id); setEditorOpen(true); }}
                    onDelete={handleDeleteNode}
                    selectedId={selectedId}
                  />
                  <div className="flex flex-wrap justify-between gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(202,220,252,0.08)' }}>
                    <Button
                      variant="outline"
                      onClick={() => archiveMutation.mutate(activeWorkflow.id)}
                      style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#F59E0B' }}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                    <Button onClick={handleSave} disabled={updateMutation.isPending} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                      {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Workflow
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
                  <p className="mb-4" style={{ color: '#94A3B8' }}>Select a workflow or create a new one to start building</p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={() => setShowNewDialog(true)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                      <Plus className="w-4 h-4 mr-2" /> New Workflow
                    </Button>
                    <Button variant="outline" onClick={() => setShowTemplates(true)} style={{ borderColor: 'rgba(167,139,250,0.3)', color: '#a78bfa' }}>
                      <Wand2 className="w-4 h-4 mr-2" /> Use Template
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Right: Palette */}
            <div className="lg:col-span-3">
              <NodePalette onAddNode={handleAddNode} />
            </div>
          </div>
        )}
      </div>

      {/* New Workflow Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.1)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>New Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Workflow Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Mechanical Completion Handover"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Handover', 'Document Creation', 'Design Review', 'Approval Process', 'Custom'].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)} style={{ borderColor: 'rgba(202,220,252,0.3)', color: '#CADCFC' }}>Cancel</Button>
              <Button onClick={handleCreateNew} disabled={!newName.trim()} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.1)' }} className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>Workflow Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {WORKFLOW_TEMPLATES.map((tmpl) => {
              const Icon = CATEGORY_ICONS[tmpl.category] || FileText;
              return (
                <div
                  key={tmpl.name}
                  className="p-4 rounded-xl border flex items-start gap-3"
                  style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0" style={{ background: 'rgba(167,139,250,0.15)' }}>
                    <Icon className="w-5 h-5" style={{ color: '#a78bfa' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: '#CADCFC' }}>{tmpl.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{tmpl.description}</div>
                    <div className="text-[10px] mt-1" style={{ color: '#475569' }}>{tmpl.nodes.length} steps · {tmpl.category}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUseTemplate(tmpl)}
                    disabled={createMutation.isPending}
                    style={{ borderColor: 'rgba(0,168,150,0.3)', color: '#00A896' }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Use
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Node Editor */}
      <NodeEditorDialog
        node={selectedNode}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveNode}
      />
    </div>
  );
}