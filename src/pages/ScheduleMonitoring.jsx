import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Calendar, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { createPageUrl } from '../utils';

export default function ScheduleMonitoring() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCriticalPath, setFilterCriticalPath] = useState(false);
  const [formData, setFormData] = useState({
    activityId: '',
    activityName: '',
    wbsCode: '',
    plannedStartDate: '',
    plannedFinishDate: '',
    actualStartDate: '',
    percentComplete: 0,
    status: 'Not Started',
    isCriticalPath: false,
    duration: '',
    responsible: '',
    notes: ''
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['scheduleActivities', projectId],
    queryFn: () => base44.entities.ScheduleActivity.filter({ projectId }, 'plannedStartDate'),
    enabled: !!projectId
  });

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.ScheduleActivity.create({ ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleActivities', projectId] });
      setShowAddDialog(false);
      setFormData({
        activityId: '',
        activityName: '',
        wbsCode: '',
        plannedStartDate: '',
        plannedFinishDate: '',
        actualStartDate: '',
        percentComplete: 0,
        status: 'Not Started',
        isCriticalPath: false,
        duration: '',
        responsible: '',
        notes: ''
      });
    }
  });

  const filteredActivities = activities.filter(activity => {
    const statusMatch = filterStatus === 'all' || activity.status === filterStatus;
    const criticalMatch = !filterCriticalPath || activity.isCriticalPath;
    return statusMatch && criticalMatch;
  });

  const calculateScheduleMetrics = () => {
    const now = new Date();
    const total = activities.length;
    const completed = activities.filter(a => a.status === 'Completed').length;
    const inProgress = activities.filter(a => a.status === 'In Progress').length;
    const notStarted = activities.filter(a => a.status === 'Not Started').length;
    const criticalPath = activities.filter(a => a.isCriticalPath).length;
    
    const delayed = activities.filter(a => {
      if (a.status === 'Completed' || !a.plannedFinishDate) return false;
      return new Date(a.plannedFinishDate) < now && a.percentComplete < 100;
    }).length;

    const avgProgress = total > 0 
      ? activities.reduce((sum, a) => sum + (a.percentComplete || 0), 0) / total 
      : 0;

    return { total, completed, inProgress, notStarted, criticalPath, delayed, avgProgress };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-500 text-white';
      case 'In Progress': return 'bg-blue-500 text-white';
      case 'On Hold': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'In Progress': return <Clock className="w-4 h-4" />;
      case 'On Hold': return <AlertCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const isDelayed = (activity) => {
    if (activity.status === 'Completed' || !activity.plannedFinishDate) return false;
    return new Date(activity.plannedFinishDate) < new Date() && activity.percentComplete < 100;
  };

  const metrics = calculateScheduleMetrics();

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <p style={{ color: '#94A3B8' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }} className="shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))}
            className="mb-4"
            style={{ color: '#CADCFC' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>Schedule Monitoring</h1>
              <p className="mt-2" style={{ color: '#94A3B8' }}>{project.projectName} • P6/MS Project Integration</p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <CardDescription style={{ color: '#94A3B8' }}>Total Activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: '#CADCFC' }}>{metrics.total}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <CardDescription style={{ color: '#94A3B8' }}>Avg Progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{metrics.avgProgress.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <CardDescription style={{ color: '#94A3B8' }}>Critical Path</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{metrics.criticalPath}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <CardDescription style={{ color: '#94A3B8' }}>Delayed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{metrics.delayed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48" style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', border: '1px solid' }}>
            <Checkbox 
              checked={filterCriticalPath} 
              onCheckedChange={setFilterCriticalPath}
            />
            <Label style={{ color: '#CADCFC', cursor: 'pointer' }}>Critical Path Only</Label>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <Card key={activity.id} style={{ 
              background: 'rgba(30, 39, 97, 0.5)', 
              borderColor: 'rgba(202, 220, 252, 0.1)',
              borderLeft: activity.isCriticalPath ? '4px solid #EF4444' : '4px solid transparent'
            }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {activity.isCriticalPath && (
                        <Badge className="bg-red-500 text-white">Critical Path</Badge>
                      )}
                      {isDelayed(activity) && (
                        <Badge className="bg-yellow-500 text-black">Delayed</Badge>
                      )}
                      <Badge className={getStatusColor(activity.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(activity.status)}
                          {activity.status}
                        </span>
                      </Badge>
                    </div>
                    <CardTitle style={{ color: '#CADCFC' }} className="mb-1">
                      {activity.activityId && `${activity.activityId} - `}{activity.activityName}
                    </CardTitle>
                    {activity.wbsCode && (
                      <CardDescription style={{ color: '#94A3B8' }}>WBS: {activity.wbsCode}</CardDescription>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: '#CADCFC' }}>
                      {activity.percentComplete || 0}%
                    </div>
                    <div className="text-sm" style={{ color: '#94A3B8' }}>Complete</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Progress value={activity.percentComplete || 0} className="h-2" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span style={{ color: '#94A3B8' }}>Planned Start: </span>
                    <span style={{ color: '#F8FAFC' }}>{activity.plannedStartDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Planned Finish: </span>
                    <span style={{ color: '#F8FAFC' }}>{activity.plannedFinishDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Duration: </span>
                    <span style={{ color: '#F8FAFC' }}>{activity.duration ? `${activity.duration}d` : 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Responsible: </span>
                    <span style={{ color: '#F8FAFC' }}>{activity.responsible || 'N/A'}</span>
                  </div>
                </div>
                {activity.actualStartDate && (
                  <div className="mt-3 text-sm">
                    <span style={{ color: '#94A3B8' }}>Actual Start: </span>
                    <span style={{ color: '#F8FAFC' }}>{activity.actualStartDate}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredActivities.length === 0 && (
            <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
              <CardContent className="py-12 text-center">
                <p style={{ color: '#94A3B8' }}>No activities found. Add activities to track your schedule.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Activity Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>Add Schedule Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createActivityMutation.mutate(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Activity ID</Label>
                <Input
                  value={formData.activityId}
                  onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                  placeholder="e.g., A1010"
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>WBS Code</Label>
                <Input
                  value={formData.wbsCode}
                  onChange={(e) => setFormData({ ...formData, wbsCode: e.target.value })}
                  placeholder="e.g., 1.2.3"
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Activity Name</Label>
              <Input
                value={formData.activityName}
                onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                required
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Planned Start</Label>
                <Input
                  type="date"
                  value={formData.plannedStartDate}
                  onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Planned Finish</Label>
                <Input
                  type="date"
                  value={formData.plannedFinishDate}
                  onChange={(e) => setFormData({ ...formData, plannedFinishDate: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Duration (days)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) || '' })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>% Complete</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentComplete}
                  onChange={(e) => setFormData({ ...formData, percentComplete: parseInt(e.target.value) || 0 })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Responsible</Label>
                <Input
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Actual Start Date</Label>
                <Input
                  type="date"
                  value={formData.actualStartDate}
                  onChange={(e) => setFormData({ ...formData, actualStartDate: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={formData.isCriticalPath}
                onCheckedChange={(checked) => setFormData({ ...formData, isCriticalPath: checked })}
              />
              <Label style={{ color: '#CADCFC', cursor: 'pointer' }}>Critical Path Activity</Label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                Create Activity
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}