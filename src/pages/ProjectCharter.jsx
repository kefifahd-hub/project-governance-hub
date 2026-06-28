import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, CheckCircle2, RotateCcw, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '../utils';

export default function ProjectCharter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [formData, setFormData] = useState(null);

  const { data: charter, isLoading } = useQuery({
    queryKey: ['projectCharter', projectId],
    queryFn: async () => {
      const r = await base44.entities.ProjectCharter.filter({ projectId });
      return r[0] || null;
    },
    enabled: !!projectId,
  });

  // Sync form data when charter loads
  const effectiveForm = formData || charter || {};

  const updateField = (field, value) => {
    setFormData(prev => ({ ...(prev || charter || {}), [field]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (charter?.id) return base44.entities.ProjectCharter.update(charter.id, data);
      return base44.entities.ProjectCharter.create({ ...data, projectId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projectCharter', projectId] });
      setFormData(null);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const data = { ...(formData || charter || {}), approvalStatus: 'Approved', approvedBy: charter?.approvedBy || 'Current User', approvalDate: new Date().toISOString().split('T')[0] };
      if (charter?.id) return base44.entities.ProjectCharter.update(charter.id, data);
      return base44.entities.ProjectCharter.create({ ...data, projectId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projectCharter', projectId] }),
  });

  const revertMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.ProjectCharter.update(charter.id, { approvalStatus: 'Draft', approvedBy: '', approvalDate: '' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projectCharter', projectId] }),
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}><p style={{ color: '#94A3B8' }}>Loading charter...</p></div>;

  const isApproved = (formData || charter)?.approvalStatus === 'Approved';

  const sections = [
    { title: 'Purpose & Objectives', fields: [
      { key: 'purpose', label: 'Project Purpose', type: 'textarea' },
      { key: 'objectives', label: 'Objectives', type: 'textarea' },
      { key: 'successCriteria', label: 'Success Criteria', type: 'textarea' },
    ]},
    { title: 'Scope', fields: [
      { key: 'scopeIncluded', label: 'In Scope', type: 'textarea' },
      { key: 'scopeExcluded', label: 'Out of Scope', type: 'textarea' },
      { key: 'deliverables', label: 'Key Deliverables', type: 'textarea' },
    ]},
    { title: 'High-Level Plan', fields: [
      { key: 'milestonesSummary', label: 'Milestones Summary', type: 'textarea' },
      { key: 'estimatedBudgetEurM', label: 'Estimated Budget (€M)', type: 'number' },
      { key: 'assumptions', label: 'Assumptions', type: 'textarea' },
      { key: 'constraints', label: 'Constraints', type: 'textarea' },
      { key: 'risksSummary', label: 'Risks Summary', type: 'textarea' },
    ]},
    { title: 'Governance & Roles', fields: [
      { key: 'sponsor', label: 'Project Sponsor', type: 'text' },
      { key: 'projectManager', label: 'Project Manager', type: 'text' },
      { key: 'stakeholdersSummary', label: 'Key Stakeholders', type: 'textarea' },
    ]},
  ];

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}>
              <ArrowLeft className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-indigo-500 p-2 rounded-lg text-white"><FileCheck className="w-5 h-5" /></div>
              <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>Project Charter</h1>
              {isApproved && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Approved</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => saveMutation.mutate(effectiveForm)} disabled={saveMutation.isPending || !formData} style={{ background: '#00A896', color: '#F8FAFC' }}>
              <Save className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Save</span>
            </Button>
            {!isApproved ? (
              <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} style={{ background: '#16a34a', color: '#F8FAFC' }}>
                <CheckCircle2 className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Approve</span>
              </Button>
            ) : (
              <Button onClick={() => revertMutation.mutate()} disabled={revertMutation.isPending} variant="outline">
                <RotateCcw className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Revert</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {sections.map(section => (
          <Card key={section.title} style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader><CardTitle style={{ color: '#CADCFC' }}>{section.title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map(field => (
                <div key={field.key}>
                  <Label style={{ color: '#94A3B8' }} className="mb-1.5 block">{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <Textarea value={effectiveForm[field.key] || ''} onChange={e => updateField(field.key, e.target.value)} rows={3} className="bg-slate-900/50 border-slate-700 text-slate-100" />
                  ) : (
                    <Input type={field.type === 'number' ? 'number' : 'text'} value={effectiveForm[field.key] ?? ''} onChange={e => updateField(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)} className="bg-slate-900/50 border-slate-700 text-slate-100" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}