import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '../utils';

export default function NewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    projectType: 'Battery Gigafactory',
    currentPhase: 'Feasibility',
    status: 'Active',
    projectOwner: '',
    totalBudgetEurM: '',
    startDate: '',
    targetCompletion: '',
    healthScore: 75,
    notes: ''
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(createPageUrl(`ProjectDashboard?id=${newProject.id}`));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createProjectMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Home'))}
          className="mb-6 hover:bg-opacity-10"
          style={{ color: '#CADCFC' }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        <Card style={{ background: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
          <CardHeader>
            <CardTitle style={{ color: '#CADCFC' }}>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName" style={{ color: '#94A3B8' }}>Project Name *</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    required
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientName" style={{ color: '#94A3B8' }}>Client Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    required
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectType" style={{ color: '#94A3B8' }}>Project Type *</Label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                  >
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
                  <Label htmlFor="currentPhase" style={{ color: '#94A3B8' }}>Current Phase *</Label>
                  <Select
                    value={formData.currentPhase}
                    onValueChange={(value) => setFormData({ ...formData, currentPhase: value })}
                  >
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
                  <Label htmlFor="projectOwner" style={{ color: '#94A3B8' }}>Project Owner *</Label>
                  <Input
                    id="projectOwner"
                    value={formData.projectOwner}
                    onChange={(e) => setFormData({ ...formData, projectOwner: e.target.value })}
                    required
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalBudgetEurM" style={{ color: '#94A3B8' }}>Total Budget (€M)</Label>
                  <Input
                    id="totalBudgetEurM"
                    type="number"
                    step="0.1"
                    value={formData.totalBudgetEurM}
                    onChange={(e) => setFormData({ ...formData, totalBudgetEurM: parseFloat(e.target.value) || '' })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" style={{ color: '#94A3B8' }}>Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetCompletion" style={{ color: '#94A3B8' }}>Target Completion</Label>
                  <Input
                    id="targetCompletion"
                    type="date"
                    value={formData.targetCompletion}
                    onChange={(e) => setFormData({ ...formData, targetCompletion: e.target.value })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" style={{ color: '#94A3B8' }}>Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }} className="hover:opacity-90">
                  Create Project
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Home'))}
                  style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}