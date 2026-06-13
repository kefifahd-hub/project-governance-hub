import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';

const RECOMMENDATION_COLORS = {
  'Proceed': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Proceed with Conditions': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Further Study Required': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Do Not Proceed': 'bg-red-500/20 text-red-400 border-red-500/30',
};

const APPROVAL_COLORS = {
  'Draft': 'bg-gray-500/20 text-gray-400',
  'Under Review': 'bg-yellow-500/20 text-yellow-400',
  'Approved': 'bg-green-500/20 text-green-400',
  'Rejected': 'bg-red-500/20 text-red-400',
};

export default function FeasibilityStudy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [formData, setFormData] = useState({
    studyName: '',
    studyDate: '',
    studyMaturity: 'Preliminary',
    studyVersion: 'v1.0',
    studyOwner: '',
    executiveSummary: '',
    capexEurM: '',
    annualOpexEurM: '',
    annualRevenueEurM: '',
    npvEurM: '',
    irrPercent: '',
    paybackYears: '',
    feasibilityScore: '',
    recommendation: 'Proceed',
    conditionsRemarks: '',
    approvalStatus: 'Draft',
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

  const { data: studies = [] } = useQuery({
    queryKey: ['feasibilityStudies', projectId],
    queryFn: () => base44.entities.FeasibilityStudy.filter({ projectId }, '-created_date'),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FeasibilityStudy.create({ projectId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feasibilityStudies', projectId] });
      setShowDialog(false);
      resetForm();
    },
  });

  const resetForm = () => setFormData({
    studyName: '', studyDate: '', studyMaturity: 'Preliminary', studyVersion: 'v1.0',
    studyOwner: '', executiveSummary: '', capexEurM: '', annualOpexEurM: '',
    annualRevenueEurM: '', npvEurM: '', irrPercent: '', paybackYears: '',
    feasibilityScore: '', recommendation: 'Proceed', conditionsRemarks: '', approvalStatus: 'Draft',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericFields = ['capexEurM', 'annualOpexEurM', 'annualRevenueEurM', 'npvEurM', 'irrPercent', 'paybackYears', 'feasibilityScore'];
    const payload = { ...formData };
    numericFields.forEach(f => { if (payload[f] !== '') payload[f] = parseFloat(payload[f]); else delete payload[f]; });
    createMutation.mutate(payload);
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
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} className="mb-4" style={{ color: '#CADCFC' }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>Feasibility Study</h1>
              <p className="mt-2" style={{ color: '#94A3B8' }}>{project.projectName}</p>
            </div>
            <Button onClick={() => setShowDialog(true)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
              <Plus className="w-4 h-4 mr-2" /> New Study
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {studies.length === 0 ? (
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardContent className="p-16 text-center">
              <FileText className="w-14 h-14 mx-auto mb-4" style={{ color: '#94A3B8' }} />
              <p className="text-lg mb-2" style={{ color: '#CADCFC' }}>No feasibility studies yet</p>
              <p className="mb-6" style={{ color: '#94A3B8' }}>Create your first feasibility study to assess project viability.</p>
              <Button onClick={() => setShowDialog(true)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                <Plus className="w-4 h-4 mr-2" /> Create Study
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {studies.map((study) => (
              <Card
                key={study.id}
                className="cursor-pointer hover:ring-1 hover:ring-teal-500 transition-all"
                style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}
                onClick={() => setSelectedStudy(selectedStudy?.id === study.id ? null : study)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 shrink-0" style={{ color: '#028090' }} />
                      <div>
                        <CardTitle style={{ color: '#CADCFC' }}>{study.studyName}</CardTitle>
                        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                          {study.studyMaturity} · v{study.studyVersion} · {study.studyDate ? new Date(study.studyDate).toLocaleDateString() : '—'}
                          {study.studyOwner ? ` · ${study.studyOwner}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {study.recommendation && (
                        <Badge className={`border ${RECOMMENDATION_COLORS[study.recommendation] || ''}`}>{study.recommendation}</Badge>
                      )}
                      <Badge className={APPROVAL_COLORS[study.approvalStatus] || ''}>{study.approvalStatus}</Badge>
                    </div>
                  </div>
                </CardHeader>

                {selectedStudy?.id === study.id && (
                  <CardContent className="border-t pt-6 space-y-6" style={{ borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                    {study.executiveSummary && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: '#94A3B8' }}>Executive Summary</h4>
                        <p className="text-sm" style={{ color: '#CADCFC' }}>{study.executiveSummary}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { label: 'CAPEX', value: study.capexEurM != null ? `€${study.capexEurM}M` : '—' },
                        { label: 'Annual OpEx', value: study.annualOpexEurM != null ? `€${study.annualOpexEurM}M` : '—' },
                        { label: 'Annual Revenue', value: study.annualRevenueEurM != null ? `€${study.annualRevenueEurM}M` : '—' },
                        { label: 'NPV', value: study.npvEurM != null ? `€${study.npvEurM}M` : '—' },
                        { label: 'IRR', value: study.irrPercent != null ? `${study.irrPercent}%` : '—' },
                        { label: 'Payback', value: study.paybackYears != null ? `${study.paybackYears} yrs` : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-lg p-3 text-center" style={{ background: 'rgba(0,168,150,0.08)', border: '1px solid rgba(0,168,150,0.2)' }}>
                          <div className="text-xs mb-1" style={{ color: '#94A3B8' }}>{label}</div>
                          <div className="font-semibold" style={{ color: '#CADCFC' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {study.feasibilityScore != null && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm" style={{ color: '#94A3B8' }}>Feasibility Score:</span>
                        <span className="text-2xl font-bold" style={{ color: '#00A896' }}>{study.feasibilityScore}/100</span>
                      </div>
                    )}
                    {study.conditionsRemarks && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: '#94A3B8' }}>Conditions / Remarks</h4>
                        <p className="text-sm" style={{ color: '#CADCFC' }}>{study.conditionsRemarks}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>New Feasibility Study</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label style={{ color: '#94A3B8' }}>Study Name *</Label>
                <Input required value={formData.studyName} onChange={e => setFormData({ ...formData, studyName: e.target.value })}
                  style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              </div>
              <div className="space-y-1">
                <Label style={{ color: '#94A3B8' }}>Study Date *</Label>
                <Input required type="date" value={formData.studyDate} onChange={e => setFormData({ ...formData, studyDate: e.target.value })}
                  style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              </div>
              <div className="space-y-1">
                <Label style={{ color: '#94A3B8' }}>Maturity</Label>
                <Select value={formData.studyMaturity} onValueChange={v => setFormData({ ...formData, studyMaturity: v })}>
                  <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Preliminary', 'Detailed', 'Executive'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label style={{ color: '#94A3B8' }}>Version</Label>
                <Input value={formData.studyVersion} onChange={e => setFormData({ ...formData, studyVersion: e.target.value })}
                  style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              </div>
              <div className="space-y-1">
                <Label style={{ color: '#94A3B8' }}>Study Owner</Label>
                <Input value={formData.studyOwner} onChange={e => setFormData({ ...formData, studyOwner: e.target.value })}
                  style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              </div>
            </div>

            <div className="space-y-1">
              <Label style={{ color: '#94A3B8' }}>Executive Summary</Label>
              <Textarea rows={3} value={formData.executiveSummary} onChange={e => setFormData({ ...formData, executiveSummary: e.target.value })}
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
            </div>

            <div className="text-sm font-semibold pt-2" style={{ color: '#94A3B8' }}>Financial Metrics (€M)</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'capexEurM', label: 'CAPEX' },
                { key: 'annualOpexEurM', label: 'Annual OpEx' },
                { key: 'annualRevenueEurM', label: 'Annual Revenue' },
                { key: 'npvEurM', label: 'NPV' },
                { key: 'irrPercent', label: 'IRR (%)' },
                { key: 'paybackYears', label: 'Payback (yrs)' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label style={{ color: '#94A3B8' }}>{label}</Label>
                  <Input type="number" step="any" value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label style={{ color: '#94A3B8' }}>Feasibility Score (0–100)</Label>
                <Input type="number" min="0" max="100" value={formData.feasibilityScore} onChange={e => setFormData({ ...formData, feasibilityScore: e.target.value })}
                  style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              </div>
              <div className="space-y-1">
                <Label style={{ color: '#94A3B8' }}>Recommendation</Label>
                <Select value={formData.recommendation} onValueChange={v => setFormData({ ...formData, recommendation: v })}>
                  <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Proceed', 'Proceed with Conditions', 'Further Study Required', 'Do Not Proceed'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label style={{ color: '#94A3B8' }}>Approval Status</Label>
                <Select value={formData.approvalStatus} onValueChange={v => setFormData({ ...formData, approvalStatus: v })}>
                  <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Draft', 'Under Review', 'Approved', 'Rejected'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label style={{ color: '#94A3B8' }}>Conditions / Remarks</Label>
              <Textarea rows={2} value={formData.conditionsRemarks} onChange={e => setFormData({ ...formData, conditionsRemarks: e.target.value })}
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createMutation.isPending} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                {createMutation.isPending ? 'Creating...' : 'Create Study'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} style={{ borderColor: 'rgba(202,220,252,0.3)', color: '#CADCFC' }}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}