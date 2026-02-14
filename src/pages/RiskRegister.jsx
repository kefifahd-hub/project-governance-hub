import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '../utils';

export default function RiskRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [newRisk, setNewRisk] = useState({
    riskDescription: '',
    category: 'Technical',
    probability: 2,
    impact: 2,
    mitigationPlan: '',
    owner: '',
    targetClosureDate: ''
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const result = await base44.entities.Project.filter({ id: projectId });
      return result[0];
    },
    enabled: !!projectId
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks', projectId],
    queryFn: () => base44.entities.Risk.filter({ projectId }),
    enabled: !!projectId
  });

  const createRiskMutation = useMutation({
    mutationFn: (data) => {
      const riskScore = data.probability * data.impact;
      let riskLevel = 'Low';
      if (riskScore >= 6) riskLevel = 'Critical';
      else if (riskScore >= 4) riskLevel = 'High';
      else if (riskScore >= 2) riskLevel = 'Medium';
      
      return base44.entities.Risk.create({ 
        ...data, 
        projectId, 
        riskScore, 
        riskLevel,
        status: 'Open'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
      setShowAddDialog(false);
      setNewRisk({
        riskDescription: '',
        category: 'Technical',
        probability: 2,
        impact: 2,
        mitigationPlan: '',
        owner: '',
        targetClosureDate: ''
      });
    }
  });

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const filteredRisks = risks.filter(risk => {
    if (statusFilter !== 'all' && risk.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && risk.category !== categoryFilter) return false;
    if (levelFilter !== 'all' && risk.riskLevel !== levelFilter) return false;
    return true;
  });

  const stats = {
    total: risks.length,
    critical: risks.filter(r => r.riskLevel === 'Critical').length,
    open: risks.filter(r => r.status === 'Open').length,
    closed: risks.filter(r => r.status === 'Closed').length
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
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} className="mb-4" style={{ color: '#CADCFC' }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>Risk Register</h1>
              <p className="mt-2" style={{ color: '#94A3B8' }}>{project.projectName}</p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Risk
                </Button>
              </DialogTrigger>
              <DialogContent style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.2)' }}>
                <DialogHeader>
                  <DialogTitle style={{ color: '#CADCFC' }}>Add New Risk</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label style={{ color: '#94A3B8' }}>Risk Description *</Label>
                    <Textarea
                      value={newRisk.riskDescription}
                      onChange={(e) => setNewRisk({ ...newRisk, riskDescription: e.target.value })}
                      style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Category</Label>
                      <Select value={newRisk.category} onValueChange={(value) => setNewRisk({ ...newRisk, category: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Financial">Financial</SelectItem>
                          <SelectItem value="Schedule">Schedule</SelectItem>
                          <SelectItem value="Regulatory">Regulatory</SelectItem>
                          <SelectItem value="Environmental">Environmental</SelectItem>
                          <SelectItem value="Safety">Safety</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Owner</Label>
                      <Input
                        value={newRisk.owner}
                        onChange={(e) => setNewRisk({ ...newRisk, owner: e.target.value })}
                        style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Probability (1-3)</Label>
                      <Select value={String(newRisk.probability)} onValueChange={(value) => setNewRisk({ ...newRisk, probability: parseInt(value) })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Low (1)</SelectItem>
                          <SelectItem value="2">Medium (2)</SelectItem>
                          <SelectItem value="3">High (3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Impact (1-3)</Label>
                      <Select value={String(newRisk.impact)} onValueChange={(value) => setNewRisk({ ...newRisk, impact: parseInt(value) })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Low (1)</SelectItem>
                          <SelectItem value="2">Medium (2)</SelectItem>
                          <SelectItem value="3">High (3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label style={{ color: '#94A3B8' }}>Mitigation Plan</Label>
                    <Textarea
                      value={newRisk.mitigationPlan}
                      onChange={(e) => setNewRisk({ ...newRisk, mitigationPlan: e.target.value })}
                      style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                    />
                  </div>
                  <Button onClick={() => createRiskMutation.mutate(newRisk)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                    Create Risk
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold mb-1" style={{ color: '#CADCFC' }}>{stats.total}</div>
              <div className="text-sm" style={{ color: '#94A3B8' }}>Total Risks</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold mb-1 text-red-500">{stats.critical}</div>
              <div className="text-sm" style={{ color: '#94A3B8' }}>Critical</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold mb-1" style={{ color: '#CADCFC' }}>{stats.open}</div>
              <div className="text-sm" style={{ color: '#94A3B8' }}>Open</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold mb-1 text-green-500">{stats.closed}</div>
              <div className="text-sm" style={{ color: '#94A3B8' }}>Closed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Mitigated">Mitigated</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40" style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Financial">Financial</SelectItem>
              <SelectItem value="Schedule">Schedule</SelectItem>
              <SelectItem value="Regulatory">Regulatory</SelectItem>
              <SelectItem value="Environmental">Environmental</SelectItem>
              <SelectItem value="Safety">Safety</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-40" style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Risk List */}
        <div className="space-y-4">
          {filteredRisks.map((risk) => (
            <Card 
              key={risk.id} 
              className={risk.riskLevel === 'Critical' && risk.status === 'Open' ? 'ring-2 ring-red-500' : ''}
              style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className={`w-6 h-6 mt-1 ${risk.riskLevel === 'Critical' ? 'text-red-500' : ''}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-lg mb-2" style={{ color: '#CADCFC' }}>{risk.riskDescription}</p>
                        <div className="flex gap-2">
                          <Badge className={getRiskLevelColor(risk.riskLevel)}>{risk.riskLevel}</Badge>
                          <Badge style={{ background: 'rgba(202, 220, 252, 0.2)', color: '#CADCFC' }}>{risk.category}</Badge>
                          <Badge style={{ background: 'rgba(202, 220, 252, 0.2)', color: '#CADCFC' }}>{risk.status}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: '#CADCFC' }}>{risk.riskScore}</div>
                        <div className="text-xs" style={{ color: '#94A3B8' }}>Risk Score</div>
                      </div>
                    </div>
                    {risk.mitigationPlan && (
                      <div className="mb-2">
                        <span className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Mitigation: </span>
                        <span className="text-sm" style={{ color: '#F8FAFC' }}>{risk.mitigationPlan}</span>
                      </div>
                    )}
                    {risk.owner && (
                      <div className="text-sm" style={{ color: '#94A3B8' }}>Owner: {risk.owner}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}