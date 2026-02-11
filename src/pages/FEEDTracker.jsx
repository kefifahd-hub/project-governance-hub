import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Circle, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '../utils';

export default function FEEDTracker() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const result = await base44.entities.Project.filter({ id: projectId });
      return result[0];
    },
    enabled: !!projectId
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => base44.entities.Milestone.filter({ projectId }),
    enabled: !!projectId
  });

  const { data: qualityGates = [] } = useQuery({
    queryKey: ['qualityGates', projectId],
    queryFn: () => base44.entities.QualityGate.filter({ projectId }),
    enabled: !!projectId
  });

  const updateGateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.QualityGate.update(id, { 
      status,
      completionDate: status === 'Complete' ? new Date().toISOString().split('T')[0] : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityGates', projectId] });
    }
  });

  const createDefaultMilestones = useMutation({
    mutationFn: async () => {
      const phases = ['Feasibility', 'Pre-FEED', 'FEED', 'Investment Decision', 'Project Setup', 'Detailed Engineering', 'Procurement', 'Construction', 'Commissioning', 'SOP'];
      const milestoneData = phases.map(phase => ({
        projectId,
        phaseName: phase,
        completionPercent: 0,
        status: 'Pending'
      }));
      return base44.entities.Milestone.bulkCreate(milestoneData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    }
  });

  const getStatusIcon = (status) => {
    if (status === 'Complete') return <CheckCircle className="w-10 h-10 text-green-500" />;
    if (status === 'Active') return <Circle className="w-10 h-10" style={{ color: '#028090' }} />;
    return <Clock className="w-10 h-10 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    if (status === 'Complete') return { bg: 'bg-green-500', text: 'text-green-500' };
    if (status === 'Active') return { bg: 'bg-teal-500', text: 'text-teal-500' };
    return { bg: 'bg-gray-500', text: 'text-gray-500' };
  };

  const groupedGates = qualityGates.reduce((acc, gate) => {
    if (!acc[gate.phase]) acc[gate.phase] = [];
    acc[gate.phase].push(gate);
    return acc;
  }, {});

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <p style={{ color: '#94A3B8' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button variant="ghost" onClick={() => navigate(createPageUrl(`ProjectDashboard?id=${projectId}`))} className="mb-4" style={{ color: '#CADCFC' }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
          <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>FEED Tracker</h1>
          <p className="mt-2" style={{ color: '#94A3B8' }}>{project.projectName}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Milestones */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: '#CADCFC' }}>Phase Milestones</h2>
          {milestones.length === 0 && (
            <Button onClick={() => createDefaultMilestones.mutate()} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Default Milestones
            </Button>
          )}
        </div>
        {milestones.length === 0 ? (
          <Card className="mb-12" style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardContent className="p-12 text-center">
              <p className="mb-4" style={{ color: '#94A3B8' }}>No milestones yet. Create default milestones to track project phases.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-12">
            {milestones.map((milestone) => {
            const colors = getStatusColor(milestone.status);
            return (
              <Card key={milestone.id} className={milestone.status === 'Active' ? 'ring-2 ring-teal-500' : ''} style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {getStatusIcon(milestone.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold" style={{ color: '#CADCFC' }}>{milestone.phaseName}</h3>
                        <span className={`text-3xl font-bold ${colors.text}`}>{milestone.completionPercent}%</span>
                      </div>
                      <Badge style={{ background: 'rgba(202, 220, 252, 0.2)', color: '#CADCFC' }}>{milestone.status}</Badge>
                      <Progress value={milestone.completionPercent} className="mt-4 h-2" />
                      {milestone.notes && (
                        <p className="mt-3 text-sm" style={{ color: '#94A3B8' }}>{milestone.notes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}

        {/* Quality Gates */}
        <h2 className="text-2xl font-semibold mb-6" style={{ color: '#CADCFC' }}>Quality Gates</h2>
        {Object.keys(groupedGates).length === 0 ? (
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardContent className="p-12 text-center">
              <p style={{ color: '#94A3B8' }}>No quality gates defined yet. Add quality gates to track deliverables.</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedGates).map(([phase, gates]) => {
          const completed = gates.filter(g => g.status === 'Complete').length;
          const total = gates.length;
          return (
            <div key={phase} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold" style={{ color: '#CADCFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {phase} Phase
                </h3>
                <span style={{ color: '#94A3B8' }}>{completed} of {total} Complete</span>
              </div>
              <div className="space-y-2">
                {gates.map((gate) => (
                  <div
                    key={gate.id}
                    className="flex items-center gap-3 p-4 rounded-lg"
                    style={{ 
                      background: gate.status === 'Complete' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 39, 97, 0.3)',
                      border: `1px solid ${gate.status === 'Complete' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(202, 220, 252, 0.1)'}`
                    }}
                  >
                    <Checkbox
                      checked={gate.status === 'Complete'}
                      onCheckedChange={(checked) => {
                        updateGateMutation.mutate({
                          id: gate.id,
                          status: checked ? 'Complete' : 'Not Started'
                        });
                      }}
                      className="w-6 h-6"
                    />
                    <span 
                      className={`flex-1 ${gate.status === 'Complete' ? 'line-through' : ''}`}
                      style={{ color: gate.status === 'Complete' ? '#CADCFC' : '#94A3B8' }}
                    >
                      {gate.gateName}
                    </span>
                    {gate.dueDate && (
                      <span className="text-sm" style={{ color: '#94A3B8' }}>
                        Due: {new Date(gate.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}