import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, DollarSign, TrendingUp, AlertTriangle, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '../utils';

export default function Home() {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.filter({ status: 'Active' }, '-created_date')
  });

  const { data: currentProject } = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: async () => {
      const result = await base44.entities.Project.filter({ id: selectedProjectId });
      return result[0];
    },
    enabled: !!selectedProjectId
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks', selectedProjectId],
    queryFn: () => base44.entities.Risk.filter({ projectId: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', selectedProjectId],
    queryFn: () => base44.entities.Milestone.filter({ projectId: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const getHealthStatus = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500' };
    if (score >= 60) return { label: 'Moderate Risk', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { label: 'High Risk', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const activeRisks = risks.filter(r => r.status !== 'Closed').length;
  const criticalRisks = risks.filter(r => r.riskLevel === 'Critical' && r.status !== 'Closed').length;
  
  const nextMilestone = milestones
    .filter(m => m.status !== 'Complete' && m.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
    
  const daysUntilNext = nextMilestone 
    ? Math.ceil((new Date(nextMilestone.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const currentPhaseCompletion = milestones
    .filter(m => m.phaseName === currentProject?.currentPhase)
    .reduce((sum, m) => sum + (m.completionPercent || 0), 0) / 
    Math.max(1, milestones.filter(m => m.phaseName === currentProject?.currentPhase).length);

  if (!projects.length && !isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4" style={{ color: '#CADCFC' }}>Welcome to PMO Governance Platform</h1>
          <p className="mb-8" style={{ color: '#94A3B8' }}>Get started by creating your first project</p>
          <Button 
            style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
            onClick={() => navigate(createPageUrl('NewProject'))}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }} className="shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>Dashboard</h1>
              <p className="mt-2" style={{ color: '#94A3B8' }}>Project overview and key metrics</p>
            </div>
            <Button 
              className="hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
              onClick={() => navigate(createPageUrl('NewProject'))}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Project Selector */}
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.projectName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!selectedProjectId ? (
          <div className="text-center py-12">
            <p style={{ color: '#94A3B8' }}>Select a project to view dashboard</p>
          </div>
        ) : !currentProject ? (
          <div className="text-center py-12">
            <p style={{ color: '#94A3B8' }}>Loading...</p>
          </div>
        ) : (
          <>
            {/* Health Score Card */}
            <Card className="mb-8" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 39, 97, 0.95) 100%)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
              <CardContent className="p-12 text-center">
                <div className="text-8xl font-bold mb-4" style={{ color: '#10B981', fontFamily: "'Courier New', monospace" }}>
                  {currentProject.healthScore || 0}
                </div>
                <div className="text-2xl mb-2" style={{ color: '#CADCFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Project Health Score
                </div>
                <div className={`text-lg font-semibold ${getHealthStatus(currentProject.healthScore || 0).color}`}>
                  {getHealthStatus(currentProject.healthScore || 0).label}
                </div>
                <div className="mt-6 bg-gray-700 h-3 rounded-full overflow-hidden">
                  <div 
                    className={getHealthStatus(currentProject.healthScore || 0).bg}
                    style={{ width: `${currentProject.healthScore || 0}%`, height: '100%', transition: 'width 0.5s' }}
                  />
                </div>
                <p className="mt-4 text-sm" style={{ color: '#94A3B8' }}>
                  Last updated: {new Date(currentProject.updated_date).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription style={{ color: '#94A3B8', textTransform: 'uppercase', fontSize: '0.875rem' }}>Total Budget</CardDescription>
                    <DollarSign className="w-5 h-5" style={{ color: '#028090' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{ color: '#CADCFC' }}>€{currentProject.totalBudgetEurM}M</div>
                </CardContent>
              </Card>

              <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription style={{ color: '#94A3B8', textTransform: 'uppercase', fontSize: '0.875rem' }}>Current Phase</CardDescription>
                    <Activity className="w-5 h-5" style={{ color: '#028090' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1" style={{ color: '#CADCFC' }}>{currentProject.currentPhase}</div>
                  <div className="text-sm" style={{ color: '#94A3B8' }}>{currentPhaseCompletion?.toFixed(0) || 0}% Complete</div>
                </CardContent>
              </Card>

              <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription style={{ color: '#94A3B8', textTransform: 'uppercase', fontSize: '0.875rem' }}>Active Risks</CardDescription>
                    <AlertTriangle className={`w-5 h-5 ${criticalRisks > 0 ? 'text-red-500' : ''}`} style={{ color: criticalRisks > 0 ? '#EF4444' : '#028090' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1" style={{ color: criticalRisks > 0 ? '#EF4444' : '#CADCFC' }}>{activeRisks}</div>
                  <div className="text-sm" style={{ color: '#94A3B8' }}>{criticalRisks} Critical</div>
                </CardContent>
              </Card>

              <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription style={{ color: '#94A3B8', textTransform: 'uppercase', fontSize: '0.875rem' }}>Next Milestone</CardDescription>
                    <Calendar className="w-5 h-5" style={{ color: '#028090' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#CADCFC' }}>
                    {daysUntilNext !== null ? `${daysUntilNext} days` : 'N/A'}
                  </div>
                  <div className="text-sm truncate" style={{ color: '#94A3B8' }}>{nextMilestone?.phaseName || 'No upcoming'}</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" onClick={() => navigate(createPageUrl(`RiskRegister?id=${selectedProjectId}`))} style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                Add Risk
              </Button>
              <Button variant="outline" onClick={() => navigate(createPageUrl(`FEEDTracker?id=${selectedProjectId}`))} style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                Update Milestone
              </Button>
              <Button variant="outline" onClick={() => navigate(createPageUrl(`NPVCalculator?id=${selectedProjectId}`))} style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                Run NPV
              </Button>
              <Button variant="outline" onClick={() => navigate(createPageUrl(`ProjectDashboard?id=${selectedProjectId}`))} style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                View Project
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}