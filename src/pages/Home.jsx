import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, TrendingUp, AlertTriangle, Calendar, Activity, Settings2 } from 'lucide-react';
import BudgetTrendChart from '../components/dashboard/BudgetTrendChart';
import RiskDistributionChart from '../components/dashboard/RiskDistributionChart';
import ScheduleProgressChart from '../components/dashboard/ScheduleProgressChart';
import QAQCStatsChart from '../components/dashboard/QAQCStatsChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '../utils';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('id') || '';
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const queryClient = useQueryClient();

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

  const { data: budgetData = [] } = useQuery({
    queryKey: ['budgetData', selectedProjectId],
    queryFn: () => base44.entities.BudgetTracking.filter({ projectId: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const { data: scheduleData = [] } = useQuery({
    queryKey: ['scheduleData', selectedProjectId],
    queryFn: () => base44.entities.ScheduleActivity.filter({ projectId: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const { data: qaRecords = [] } = useQuery({
    queryKey: ['qaRecords', selectedProjectId],
    queryFn: () => base44.entities.QARecord.filter({ projectId: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const { data: nonConformities = [] } = useQuery({
    queryKey: ['nonConformities', selectedProjectId],
    queryFn: () => base44.entities.NonConformity.filter({ projectId: selectedProjectId }),
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

  const updateProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(selectedProjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowEditDialog(false);
    }
  });

  const handleEditClick = () => {
    setEditFormData({
      projectName: currentProject.projectName,
      clientName: currentProject.clientName,
      projectType: currentProject.projectType,
      currentPhase: currentProject.currentPhase,
      projectOwner: currentProject.projectOwner,
      totalBudgetEurM: currentProject.totalBudgetEurM || '',
      startDate: currentProject.startDate || '',
      targetCompletion: currentProject.targetCompletion || '',
      status: currentProject.status,
      notes: currentProject.notes || ''
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateProjectMutation.mutate(editFormData);
  };

  if (!projects.length && !isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }} className="shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#CADCFC' }}>Dashboard</h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: '#94A3B8' }}>Get started by creating your first project</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#CADCFC' }}>Welcome to PMO Governance Platform</h2>
          <p className="mb-8" style={{ color: '#94A3B8' }}>Create your first project to start tracking milestones, risks, and budgets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }} className="shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#CADCFC' }}>Dashboard</h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: '#94A3B8' }}>
                {selectedProjectId ? 'Project overview and key metrics' : 'Select a project from the sidebar to get started'}
              </p>
            </div>
            {selectedProjectId && currentProject && (
              <Button 
                variant="outline"
                onClick={handleEditClick}
                className="w-full sm:w-auto"
                style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Edit Project
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription style={{ color: '#94A3B8', textTransform: 'uppercase', fontSize: '0.875rem' }}>Total Budget</CardDescription>
                    <DollarSign className="w-5 h-5" style={{ color: '#028090' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#CADCFC' }}>€{currentProject.totalBudgetEurM}M</div>
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
                  <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#CADCFC' }}>{currentProject.currentPhase}</div>
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
                  <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: criticalRisks > 0 ? '#EF4444' : '#CADCFC' }}>{activeRisks}</div>
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
                  <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#CADCFC' }}>
                    {daysUntilNext !== null ? `${daysUntilNext} days` : 'N/A'}
                  </div>
                  <div className="text-sm truncate" style={{ color: '#94A3B8' }}>{nextMilestone?.phaseName || 'No upcoming'}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="cursor-pointer" onClick={() => navigate(createPageUrl(`BudgetDashboard?id=${selectedProjectId}`))}>
                <BudgetTrendChart data={budgetData} />
              </div>
              <div className="cursor-pointer" onClick={() => navigate(createPageUrl(`RiskRegister?id=${selectedProjectId}`))}>
                <RiskDistributionChart data={risks} />
              </div>
              <div className="cursor-pointer" onClick={() => navigate(createPageUrl(`ScheduleMonitoring?id=${selectedProjectId}`))}>
                <ScheduleProgressChart data={scheduleData} />
              </div>
              <div className="cursor-pointer" onClick={() => navigate(createPageUrl(`QAQCDashboard?id=${selectedProjectId}`))}>
                <QAQCStatsChart qaData={qaRecords} ncData={nonConformities} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>Edit Project Settings</DialogTitle>
          </DialogHeader>
          {editFormData && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#94A3B8' }}>Project Name</Label>
                  <Input
                    value={editFormData.projectName}
                    onChange={(e) => setEditFormData({ ...editFormData, projectName: e.target.value })}
                    required
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: '#94A3B8' }}>Client Name</Label>
                  <Input
                    value={editFormData.clientName}
                    onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
                    required
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#94A3B8' }}>Project Type</Label>
                  <Select value={editFormData.projectType} onValueChange={(value) => setEditFormData({ ...editFormData, projectType: value })}>
                    <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Battery Gigafactory">Battery Gigafactory</SelectItem>
                      <SelectItem value="Data Center">Data Center</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label style={{ color: '#94A3B8' }}>Current Phase</Label>
                  <Select value={editFormData.currentPhase} onValueChange={(value) => setEditFormData({ ...editFormData, currentPhase: value })}>
                    <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feasibility">Feasibility</SelectItem>
                      <SelectItem value="Pre-FEED">Pre-FEED</SelectItem>
                      <SelectItem value="FEED">FEED</SelectItem>
                      <SelectItem value="Investment Decision">Investment Decision</SelectItem>
                      <SelectItem value="Project Setup">Project Setup</SelectItem>
                      <SelectItem value="Detailed Engineering">Detailed Engineering</SelectItem>
                      <SelectItem value="Procurement">Procurement</SelectItem>
                      <SelectItem value="Construction">Construction</SelectItem>
                      <SelectItem value="Commissioning">Commissioning</SelectItem>
                      <SelectItem value="SOP">SOP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#94A3B8' }}>Project Owner</Label>
                  <Input
                    value={editFormData.projectOwner}
                    onChange={(e) => setEditFormData({ ...editFormData, projectOwner: e.target.value })}
                    required
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: '#94A3B8' }}>Total Budget (€M)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editFormData.totalBudgetEurM}
                    onChange={(e) => setEditFormData({ ...editFormData, totalBudgetEurM: parseFloat(e.target.value) || '' })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#94A3B8' }}>Start Date</Label>
                  <Input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: '#94A3B8' }}>Target Completion</Label>
                  <Input
                    type="date"
                    value={editFormData.targetCompletion}
                    onChange={(e) => setEditFormData({ ...editFormData, targetCompletion: e.target.value })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Status</Label>
                <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
                  <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Notes</Label>
                <Textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}