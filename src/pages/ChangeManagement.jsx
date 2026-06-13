import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChangeLogTable from '../components/changemanagement/ChangeLogTable';
import ChangeRequestForm from '../components/changemanagement/ChangeRequestForm';
import ImpactAssessmentPanel from '../components/changemanagement/ImpactAssessmentPanel';
import ImpactDashboard from '../components/changemanagement/ImpactDashboard';

export default function ChangeManagement() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [view, setView] = useState('log'); // 'log' | 'new' | 'detail'
  const [selectedCR, setSelectedCR] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => { const r = await base44.entities.Project.filter({ id: projectId }); return r[0]; },
    enabled: !!projectId,
  });

  const { data: changes = [] } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => base44.entities.ChangeRequest.filter({ projectId }),
    enabled: !!projectId,
  });

  const { data: impacts = [] } = useQuery({
    queryKey: ['changeImpacts', projectId],
    queryFn: async () => {
      const ids = changes.map(c => c.id);
      if (!ids.length) return [];
      const all = await Promise.all(ids.map(id => base44.entities.ChangeImpactAssessment.filter({ crId: id })));
      return all.flat();
    },
    enabled: changes.length > 0,
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ['changeApprovals', projectId],
    queryFn: async () => {
      const ids = changes.map(c => c.id);
      if (!ids.length) return [];
      const all = await Promise.all(ids.map(id => base44.entities.ChangeApproval.filter({ crId: id })));
      return all.flat();
    },
    enabled: changes.length > 0,
  });

  const createCRMutation = useMutation({
    mutationFn: async (data) => {
      // auto-generate CR number
      const count = changes.length + 1;
      const crNumber = `CR-${String(count).padStart(3, '0')}`;
      return base44.entities.ChangeRequest.create({ ...data, crNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeRequests', projectId] });
      setView('log');
    },
  });

  const updateCRMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChangeRequest.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['changeRequests', projectId] });
      // refresh selected
      setSelectedCR(prev => ({ ...prev, ...vars.data }));
      setView('detail');
    },
  });

  const saveImpactMutation = useMutation({
    mutationFn: async (data) => {
      const existing = impacts.find(i => i.crId === data.crId);
      if (existing) return base44.entities.ChangeImpactAssessment.update(existing.id, data);
      return base44.entities.ChangeImpactAssessment.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeImpacts', projectId] });
    },
  });

  const handleSelectCR = (cr) => {
    setSelectedCR(cr);
    setView('detail');
    setActiveTab('form');
  };

  const handleSaveCR = (data) => {
    if (selectedCR?.id) {
      updateCRMutation.mutate({ id: selectedCR.id, data });
    } else {
      createCRMutation.mutate(data);
    }
  };

  const getImpactForCR = (cr) => cr ? impacts.find(i => i.crId === cr.id) : null;

  const openCRs = changes.filter(c => !['Approved','Approved with Conditions','Rejected','Withdrawn','Closed','Implemented'].includes(c.status));
  const criticalOpen = openCRs.filter(c => c.priority === 'Critical').length;
  const pendingApproval = changes.filter(c => c.status === 'Pending Approval').length;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#CADCFC' }}>Change Management</h1>
              <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                {project?.projectName || 'Project'} — Structured change workflow with approval matrix
              </p>
            </div>
            {(criticalOpen > 0 || pendingApproval > 0) && (
              <div className="flex gap-2 flex-wrap">
                {criticalOpen > 0 && (
                  <div className="text-xs px-3 py-1.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    🔴 {criticalOpen} Critical CR{criticalOpen > 1 ? 's' : ''} Open
                  </div>
                )}
                {pendingApproval > 0 && (
                  <div className="text-xs px-3 py-1.5 rounded" style={{ background: 'rgba(234,179,8,0.15)', color: '#F59E0B', border: '1px solid rgba(234,179,8,0.3)' }}>
                    ⏳ {pendingApproval} Pending Approval
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Approval Matrix Banner */}
        <div className="rounded-xl p-4 mb-6 overflow-x-auto" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#00A896' }}>Change Approval Authority Matrix</div>
          <div className="flex gap-2 min-w-max">
            {[
              { level: 'L1', title: 'Project Manager', range: '≤ $50K', color: '#10B981' },
              { level: 'L2', title: 'Project Director', range: '$50K–$250K', color: '#00A896' },
              { level: 'L3', title: 'CFO', range: '$250K–$1M', color: '#F59E0B' },
              { level: 'L4', title: 'CEO', range: '$1M–$5M', color: '#EF4444' },
              { level: 'L5', title: 'Board / Investor', range: '> $5M', color: '#8B5CF6' },
            ].map((l, i, arr) => (
              <div key={l.level} className="flex items-center gap-2">
                <div className="text-center px-3 py-2 rounded-lg" style={{ background: `${l.color}15`, border: `1px solid ${l.color}40`, minWidth: 100 }}>
                  <div className="text-xs font-bold" style={{ color: l.color }}>{l.level}</div>
                  <div className="text-xs font-semibold" style={{ color: '#CADCFC' }}>{l.title}</div>
                  <div className="text-xs" style={{ color: '#64748B' }}>{l.range}</div>
                </div>
                {i < arr.length - 1 && <div className="text-gray-600">→</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        {view === 'log' && (
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
                <TabsTrigger value="overview" style={{ color: '#94A3B8' }}>Change Log</TabsTrigger>
                <TabsTrigger value="dashboard" style={{ color: '#94A3B8' }}>Impact Dashboard</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <ChangeLogTable changes={changes} impacts={impacts} onNew={() => { setSelectedCR(null); setView('new'); }} onSelect={handleSelectCR} />
              </TabsContent>
              <TabsContent value="dashboard" className="mt-4">
                <ImpactDashboard changes={changes} impacts={impacts} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {view === 'new' && (
          <ChangeRequestForm cr={null} projectId={projectId} onSave={handleSaveCR} onBack={() => setView('log')} />
        )}

        {view === 'detail' && selectedCR && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
              <TabsTrigger value="form" style={{ color: '#94A3B8' }}>CR Details</TabsTrigger>
              <TabsTrigger value="impact" style={{ color: '#94A3B8' }}>Impact Assessment</TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="mt-4">
              <ChangeRequestForm
                cr={selectedCR}
                projectId={projectId}
                onSave={handleSaveCR}
                onBack={() => setView('log')}
              />
            </TabsContent>
            <TabsContent value="impact" className="mt-4">
              <div className="mb-4">
                <button onClick={() => setView('log')} className="text-sm" style={{ color: '#94A3B8' }}>← Back to log</button>
              </div>
              <ImpactAssessmentPanel
                cr={selectedCR}
                impact={getImpactForCR(selectedCR)}
                onSave={(data) => saveImpactMutation.mutate(data)}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}