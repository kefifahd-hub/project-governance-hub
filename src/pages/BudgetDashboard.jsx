import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';

export default function BudgetDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    month: '',
    category: 'Engineering',
    plannedEurK: '',
    actualEurK: ''
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  const { data: budgetEntries = [] } = useQuery({
    queryKey: ['budget', projectId],
    queryFn: () => base44.entities.BudgetTracking.filter({ projectId }, '-month'),
    enabled: !!projectId
  });

  const createBudgetMutation = useMutation({
    mutationFn: (data) => {
      const variance = (data.actualEurK || 0) - data.plannedEurK;
      const variancePercent = data.plannedEurK > 0 ? (variance / data.plannedEurK) * 100 : 0;
      let varianceStatus = 'On Track';
      if (variancePercent > 10) varianceStatus = 'Over Budget';
      else if (variancePercent < -10) varianceStatus = 'Under Budget';
      
      return base44.entities.BudgetTracking.create({
        projectId,
        ...data,
        varianceEurK: variance,
        variancePercent,
        varianceStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      setShowDialog(false);
      setFormData({ month: '', category: 'Engineering', plannedEurK: '', actualEurK: '' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createBudgetMutation.mutate({
      ...formData,
      plannedEurK: parseFloat(formData.plannedEurK),
      actualEurK: formData.actualEurK ? parseFloat(formData.actualEurK) : 0
    });
  };

  const totalPlanned = budgetEntries.reduce((sum, e) => sum + (e.plannedEurK || 0), 0);
  const totalActual = budgetEntries.reduce((sum, e) => sum + (e.actualEurK || 0), 0);
  const totalVariance = totalActual - totalPlanned;
  const totalVariancePercent = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0;

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <p style={{ color: '#94A3B8' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
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
              <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>Budget Tracking</h1>
              <p className="mt-2" style={{ color: '#94A3B8' }}>{project.projectName}</p>
            </div>
            <Button onClick={() => setShowDialog(true)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ color: '#94A3B8' }}>Total Planned</CardTitle>
                <DollarSign className="w-5 h-5" style={{ color: '#028090' }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: '#CADCFC' }}>€{totalPlanned.toFixed(0)}K</div>
            </CardContent>
          </Card>

          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ color: '#94A3B8' }}>Total Actual</CardTitle>
                <DollarSign className="w-5 h-5" style={{ color: '#028090' }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: '#CADCFC' }}>€{totalActual.toFixed(0)}K</div>
            </CardContent>
          </Card>

          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ color: '#94A3B8' }}>Variance</CardTitle>
                {totalVariance > 0 ? <TrendingUp className="w-5 h-5 text-red-500" /> : <TrendingDown className="w-5 h-5 text-green-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${totalVariance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {totalVariance > 0 ? '+' : ''}€{totalVariance.toFixed(0)}K
              </div>
              <div className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                {totalVariancePercent.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
          <CardHeader>
            <CardTitle style={{ color: '#CADCFC' }}>Budget Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgetEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                  <div>
                    <div className="font-medium" style={{ color: '#CADCFC' }}>{entry.category}</div>
                    <div className="text-sm" style={{ color: '#94A3B8' }}>
                      {new Date(entry.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ color: '#CADCFC' }}>
                      €{entry.actualEurK}K / €{entry.plannedEurK}K
                    </div>
                    <div className={`text-sm ${entry.varianceStatus === 'Over Budget' ? 'text-red-500' : entry.varianceStatus === 'Under Budget' ? 'text-green-500' : ''}`} style={{ color: entry.varianceStatus === 'On Track' ? '#94A3B8' : undefined }}>
                      {entry.varianceStatus}
                    </div>
                  </div>
                </div>
              ))}
              {budgetEntries.length === 0 && (
                <p className="text-center py-8" style={{ color: '#94A3B8' }}>No budget entries yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>Add Budget Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Month</Label>
              <Input
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Procurement">Procurement</SelectItem>
                  <SelectItem value="PMO">PMO</SelectItem>
                  <SelectItem value="Contingency">Contingency</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Planned (€K)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.plannedEurK}
                  onChange={(e) => setFormData({ ...formData, plannedEurK: e.target.value })}
                  required
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Actual (€K)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.actualEurK}
                  onChange={(e) => setFormData({ ...formData, actualEurK: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                Add Entry
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}