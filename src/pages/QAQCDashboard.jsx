import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '../utils';

export default function QAQCDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [showQADialog, setShowQADialog] = useState(false);
  const [showNCDialog, setShowNCDialog] = useState(false);
  const [qaFormData, setQAFormData] = useState({
    recordType: 'FAT',
    testName: '',
    equipmentSystem: '',
    status: 'Scheduled',
    scheduledDate: '',
    location: '',
    inspector: '',
    vendor: '',
    notes: ''
  });
  const [ncFormData, setNCFormData] = useState({
    ncNumber: '',
    description: '',
    severity: 'Minor',
    status: 'Open',
    detectedDate: '',
    detectedBy: '',
    assignedTo: '',
    targetCloseDate: '',
    correctiveAction: ''
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  const { data: qaRecords = [] } = useQuery({
    queryKey: ['qaRecords', projectId],
    queryFn: () => base44.entities.QARecord.filter({ projectId }, '-scheduledDate'),
    enabled: !!projectId
  });

  const { data: nonConformities = [] } = useQuery({
    queryKey: ['nonConformities', projectId],
    queryFn: () => base44.entities.NonConformity.filter({ projectId }, '-detectedDate'),
    enabled: !!projectId
  });

  const createQAMutation = useMutation({
    mutationFn: (data) => base44.entities.QARecord.create({ ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qaRecords', projectId] });
      setShowQADialog(false);
      setQAFormData({
        recordType: 'FAT',
        testName: '',
        equipmentSystem: '',
        status: 'Scheduled',
        scheduledDate: '',
        location: '',
        inspector: '',
        vendor: '',
        notes: ''
      });
    }
  });

  const createNCMutation = useMutation({
    mutationFn: (data) => base44.entities.NonConformity.create({ ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonConformities', projectId] });
      setShowNCDialog(false);
      setNCFormData({
        ncNumber: '',
        description: '',
        severity: 'Minor',
        status: 'Open',
        detectedDate: '',
        detectedBy: '',
        assignedTo: '',
        targetCloseDate: '',
        correctiveAction: ''
      });
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Passed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'Failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'Conditional Pass': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Passed': return 'bg-green-500';
      case 'Failed': return 'bg-red-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Conditional Pass': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'Major': return 'bg-orange-500 text-white';
      case 'Minor': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const qaStats = {
    total: qaRecords.length,
    passed: qaRecords.filter(r => r.status === 'Passed').length,
    failed: qaRecords.filter(r => r.status === 'Failed').length,
    pending: qaRecords.filter(r => ['Scheduled', 'In Progress'].includes(r.status)).length
  };

  const ncStats = {
    total: nonConformities.length,
    open: nonConformities.filter(nc => nc.status === 'Open').length,
    inProgress: nonConformities.filter(nc => nc.status === 'In Progress').length,
    closed: nonConformities.filter(nc => nc.status === 'Closed').length,
    critical: nonConformities.filter(nc => nc.severity === 'Critical' && nc.status !== 'Closed').length
  };

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
            onClick={() => navigate(createPageUrl(`ProjectDashboard?id=${projectId}`))}
            className="mb-4"
            style={{ color: '#CADCFC' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>QA/QC Dashboard</h1>
              <p className="mt-2" style={{ color: '#94A3B8' }}>{project.projectName}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowNCDialog(true)}
                variant="outline"
                style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Non-Conformity
              </Button>
              <Button
                onClick={() => setShowQADialog(true)}
                style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add QA Record
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <CardDescription style={{ color: '#94A3B8' }}>Total QA Records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: '#CADCFC' }}>{qaStats.total}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <CardDescription style={{ color: '#94A3B8' }}>Passed Tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{qaStats.passed}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <CardDescription style={{ color: '#94A3B8' }}>Open NCs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{ncStats.open}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <CardDescription style={{ color: '#94A3B8' }}>Critical NCs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{ncStats.critical}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="qa" className="w-full">
          <TabsList style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <TabsTrigger value="qa" style={{ color: '#CADCFC' }}>QA Records</TabsTrigger>
            <TabsTrigger value="nc" style={{ color: '#CADCFC' }}>Non-Conformities</TabsTrigger>
          </TabsList>

          <TabsContent value="qa" className="mt-6 space-y-4">
            {qaRecords.map((record) => (
              <Card key={record.id} style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getSeverityColor(record.recordType)}>{record.recordType}</Badge>
                        <CardTitle style={{ color: '#CADCFC' }}>{record.testName}</CardTitle>
                      </div>
                      <CardDescription style={{ color: '#94A3B8' }}>
                        {record.equipmentSystem} • {record.location}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <span style={{ color: '#CADCFC' }}>{record.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span style={{ color: '#94A3B8' }}>Inspector: </span>
                      <span style={{ color: '#F8FAFC' }}>{record.inspector || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Vendor: </span>
                      <span style={{ color: '#F8FAFC' }}>{record.vendor || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Scheduled: </span>
                      <span style={{ color: '#F8FAFC' }}>{record.scheduledDate || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>NCs: </span>
                      <span className="text-yellow-500 font-semibold">{record.ncCount || 0}</span>
                    </div>
                  </div>
                  {record.findings && (
                    <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                      <p className="text-sm" style={{ color: '#94A3B8' }}>{record.findings}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {qaRecords.length === 0 && (
              <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardContent className="py-12 text-center">
                  <p style={{ color: '#94A3B8' }}>No QA records yet. Click "Add QA Record" to create one.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="nc" className="mt-6 space-y-4">
            {nonConformities.map((nc) => (
              <Card key={nc.id} style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getSeverityColor(nc.severity)}>{nc.severity}</Badge>
                        <CardTitle style={{ color: '#CADCFC' }}>{nc.ncNumber}</CardTitle>
                        <Badge variant="outline" style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                          {nc.status}
                        </Badge>
                      </div>
                      <CardDescription style={{ color: '#94A3B8' }}>{nc.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span style={{ color: '#94A3B8' }}>Detected: </span>
                      <span style={{ color: '#F8FAFC' }}>{nc.detectedDate || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Detected By: </span>
                      <span style={{ color: '#F8FAFC' }}>{nc.detectedBy || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Assigned To: </span>
                      <span style={{ color: '#F8FAFC' }}>{nc.assignedTo || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Target Close: </span>
                      <span style={{ color: '#F8FAFC' }}>{nc.targetCloseDate || 'N/A'}</span>
                    </div>
                  </div>
                  {nc.correctiveAction && (
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                      <p className="text-sm font-medium mb-1" style={{ color: '#CADCFC' }}>Corrective Action:</p>
                      <p className="text-sm" style={{ color: '#94A3B8' }}>{nc.correctiveAction}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {nonConformities.length === 0 && (
              <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardContent className="py-12 text-center">
                  <p style={{ color: '#94A3B8' }}>No non-conformities recorded.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add QA Record Dialog */}
      <Dialog open={showQADialog} onOpenChange={setShowQADialog}>
        <DialogContent style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>Add QA Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createQAMutation.mutate(qaFormData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Record Type</Label>
                <Select value={qaFormData.recordType} onValueChange={(value) => setQAFormData({ ...qaFormData, recordType: value })}>
                  <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAT">FAT</SelectItem>
                    <SelectItem value="SAT">SAT</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Audit">Audit</SelectItem>
                    <SelectItem value="Commissioning Test">Commissioning Test</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Status</Label>
                <Select value={qaFormData.status} onValueChange={(value) => setQAFormData({ ...qaFormData, status: value })}>
                  <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Passed">Passed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Conditional Pass">Conditional Pass</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Test Name</Label>
              <Input
                value={qaFormData.testName}
                onChange={(e) => setQAFormData({ ...qaFormData, testName: e.target.value })}
                required
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Equipment/System</Label>
              <Input
                value={qaFormData.equipmentSystem}
                onChange={(e) => setQAFormData({ ...qaFormData, equipmentSystem: e.target.value })}
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Location</Label>
                <Input
                  value={qaFormData.location}
                  onChange={(e) => setQAFormData({ ...qaFormData, location: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Scheduled Date</Label>
                <Input
                  type="date"
                  value={qaFormData.scheduledDate}
                  onChange={(e) => setQAFormData({ ...qaFormData, scheduledDate: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Inspector</Label>
                <Input
                  value={qaFormData.inspector}
                  onChange={(e) => setQAFormData({ ...qaFormData, inspector: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Vendor</Label>
                <Input
                  value={qaFormData.vendor}
                  onChange={(e) => setQAFormData({ ...qaFormData, vendor: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Notes</Label>
              <Textarea
                value={qaFormData.notes}
                onChange={(e) => setQAFormData({ ...qaFormData, notes: e.target.value })}
                rows={3}
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                Create Record
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowQADialog(false)} style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Non-Conformity Dialog */}
      <Dialog open={showNCDialog} onOpenChange={setShowNCDialog}>
        <DialogContent style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>Add Non-Conformity</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createNCMutation.mutate(ncFormData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>NC Number</Label>
                <Input
                  value={ncFormData.ncNumber}
                  onChange={(e) => setNCFormData({ ...ncFormData, ncNumber: e.target.value })}
                  required
                  placeholder="e.g., NC-2026-001"
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Severity</Label>
                <Select value={ncFormData.severity} onValueChange={(value) => setNCFormData({ ...ncFormData, severity: value })}>
                  <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minor">Minor</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Description</Label>
              <Textarea
                value={ncFormData.description}
                onChange={(e) => setNCFormData({ ...ncFormData, description: e.target.value })}
                required
                rows={3}
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Detected Date</Label>
                <Input
                  type="date"
                  value={ncFormData.detectedDate}
                  onChange={(e) => setNCFormData({ ...ncFormData, detectedDate: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Target Close Date</Label>
                <Input
                  type="date"
                  value={ncFormData.targetCloseDate}
                  onChange={(e) => setNCFormData({ ...ncFormData, targetCloseDate: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Detected By</Label>
                <Input
                  value={ncFormData.detectedBy}
                  onChange={(e) => setNCFormData({ ...ncFormData, detectedBy: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Assigned To</Label>
                <Input
                  value={ncFormData.assignedTo}
                  onChange={(e) => setNCFormData({ ...ncFormData, assignedTo: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Corrective Action</Label>
              <Textarea
                value={ncFormData.correctiveAction}
                onChange={(e) => setNCFormData({ ...ncFormData, correctiveAction: e.target.value })}
                rows={3}
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                Create NC
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowNCDialog(false)} style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}