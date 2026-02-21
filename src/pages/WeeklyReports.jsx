import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '../utils';

export default function WeeklyReports() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    weekEnding: '',
    highlights: '',
    concerns: '',
    nextWeek: '',
    overallStatus: 'Green'
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports', projectId],
    queryFn: () => base44.entities.WeeklyReport.filter({ projectId }, '-weekEnding'),
    enabled: !!projectId
  });

  const createReportMutation = useMutation({
    mutationFn: (data) => base44.entities.WeeklyReport.create({
      projectId,
      ...data,
      highlights: data.highlights.split('\n').filter(h => h.trim()),
      concerns: data.concerns.split('\n').filter(c => c.trim()),
      nextWeek: data.nextWeek.split('\n').filter(n => n.trim())
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', projectId] });
      setShowDialog(false);
      setFormData({ weekEnding: '', highlights: '', concerns: '', nextWeek: '', overallStatus: 'Green' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createReportMutation.mutate(formData);
  };

  const toArray = (val) => Array.isArray(val) ? val : (typeof val === 'string' ? val.split('\n').filter(s => s.trim()) : []);

  const getStatusColor = (status) => {
    if (status === 'Green') return 'bg-green-500';
    if (status === 'Yellow') return 'bg-yellow-500';
    return 'bg-red-500';
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
              <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>Weekly Reports</h1>
              <p className="mt-2" style={{ color: '#94A3B8' }}>{project.projectName}</p>
            </div>
            <Button onClick={() => setShowDialog(true)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={report.id} style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" style={{ color: '#028090' }} />
                    <CardTitle style={{ color: '#CADCFC' }}>
                      Week Ending {new Date(report.weekEnding).toLocaleDateString()}
                    </CardTitle>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(report.overallStatus)}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {toArray(report.highlights).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#CADCFC' }}>✅ Highlights</h3>
                    <ul className="list-disc list-inside space-y-1" style={{ color: '#94A3B8' }}>
                      {toArray(report.highlights).map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}
                {toArray(report.concerns).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#CADCFC' }}>⚠️ Concerns</h3>
                    <ul className="list-disc list-inside space-y-1" style={{ color: '#94A3B8' }}>
                      {toArray(report.concerns).map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {toArray(report.nextWeek).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#CADCFC' }}>📋 Next Week</h3>
                    <ul className="list-disc list-inside space-y-1" style={{ color: '#94A3B8' }}>
                      {toArray(report.nextWeek).map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && (
            <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#94A3B8' }} />
                <p style={{ color: '#94A3B8' }}>No weekly reports yet. Create your first report to track progress.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>Create Weekly Report</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Week Ending</Label>
                <Input
                  type="date"
                  value={formData.weekEnding}
                  onChange={(e) => setFormData({ ...formData, weekEnding: e.target.value })}
                  required
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>Overall Status</Label>
                <Select value={formData.overallStatus} onValueChange={(value) => setFormData({ ...formData, overallStatus: value })}>
                  <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="Yellow">Yellow</SelectItem>
                    <SelectItem value="Red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Highlights (one per line)</Label>
              <Textarea
                value={formData.highlights}
                onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                rows={3}
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Concerns (one per line)</Label>
              <Textarea
                value={formData.concerns}
                onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
                rows={3}
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Next Week Plans (one per line)</Label>
              <Textarea
                value={formData.nextWeek}
                onChange={(e) => setFormData({ ...formData, nextWeek: e.target.value })}
                rows={3}
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                Create Report
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