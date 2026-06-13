import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, MapPin, BarChart2, Table2 } from 'lucide-react';
import { createPageUrl } from '../utils';
import SiteQuestionnaireView from '../components/siteselection/SiteQuestionnaireView';
import SiteComparisonView from '../components/siteselection/SiteComparisonView';
import SiteScoringView from '../components/siteselection/SiteScoringView';

export default function SiteSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState('questionnaire');
  const [activeSiteId, setActiveSiteId] = useState(null);
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [newAssessment, setNewAssessment] = useState({ assessmentName: '', assessmentOwner: '' });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => { const r = await base44.entities.Project.filter({ id: projectId }); return r[0]; },
    enabled: !!projectId
  });

  const { data: assessments = [], refetch: refetchAssessments } = useQuery({
    queryKey: ['siteAssessments', projectId],
    queryFn: () => base44.entities.SiteAssessment.filter({ projectId }),
    enabled: !!projectId
  });

  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const assessment = assessments.find(a => a.id === selectedAssessmentId) || assessments[0];
  const assessmentId = assessment?.id;

  const { data: sites = [], refetch: refetchSites } = useQuery({
    queryKey: ['candidateSites', assessmentId],
    queryFn: () => base44.entities.CandidateSite.filter({ assessmentId }),
    enabled: !!assessmentId,
    onSuccess: (data) => { if (data.length > 0 && !activeSiteId) setActiveSiteId(data[0].id); }
  });

  const { data: criteria = [] } = useQuery({
    queryKey: ['siteCriteria', assessmentId],
    queryFn: async () => {
      if (!sites.length) return [];
      const allCriteria = await Promise.all(sites.map(s => base44.entities.SiteCriteria.filter({ siteId: s.id })));
      return allCriteria.flat();
    },
    enabled: !!assessmentId && sites.length > 0,
  });

  const createAssessmentMutation = useMutation({
    mutationFn: () => base44.entities.SiteAssessment.create({ ...newAssessment, projectId, assessmentDate: new Date().toISOString().split('T')[0], assessmentStatus: 'Draft' }),
    onSuccess: async (created) => {
      await refetchAssessments();
      setSelectedAssessmentId(created.id);
      setShowNewAssessment(false);
      setNewAssessment({ assessmentName: '', assessmentOwner: '' });
      // Create first site
      const site = await base44.entities.CandidateSite.create({ assessmentId: created.id, siteName: 'Site 1', status: 'Active Candidate' });
      setActiveSiteId(site.id);
      qc.invalidateQueries(['candidateSites', created.id]);
    }
  });

  const onRefresh = () => {
    qc.invalidateQueries(['siteAssessments', projectId]);
    qc.invalidateQueries(['candidateSites', assessmentId]);
    qc.invalidateQueries(['siteCriteria', assessmentId]);
  };

  // Handle sites loaded — auto-select first
  if (sites.length > 0 && !activeSiteId) {
    setActiveSiteId(sites[0].id);
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="max-w-full px-4 sm:px-6 py-4">
          <Button variant="ghost" onClick={() => navigate(createPageUrl(`ProjectDashboard?id=${projectId}`))} style={{ color: '#CADCFC' }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center justify-between mt-2 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#CADCFC' }}>
                <MapPin className="w-6 h-6 inline mr-2 mb-1" style={{ color: '#00A896' }} />
                Site Selection
              </h1>
              <p className="text-sm" style={{ color: '#94A3B8' }}>{project?.projectName}</p>
            </div>
            <div className="flex items-center gap-3">
              {assessments.length > 0 && (
                <Select value={assessmentId || ''} onValueChange={setSelectedAssessmentId}>
                  <SelectTrigger className="w-56" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                    <SelectValue placeholder="Select assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map(a => <SelectItem key={a.id} value={a.id}>{a.assessmentName}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={() => setShowNewAssessment(true)} style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
                <Plus className="w-4 h-4 mr-2" /> New Assessment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full px-4 sm:px-6 py-6">
        {!assessmentId ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: '#028090' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#CADCFC' }}>No Site Assessment Yet</h2>
            <p className="mb-6" style={{ color: '#94A3B8' }}>Create an assessment to start evaluating candidate sites</p>
            <Button onClick={() => setShowNewAssessment(true)} style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
              <Plus className="w-4 h-4 mr-2" /> Create Assessment
            </Button>
          </div>
        ) : (
          <>
            {/* Assessment Info Bar */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <Badge style={{ background: 'rgba(0,168,150,0.2)', color: '#00A896' }}>{assessment.assessmentStatus}</Badge>
              {assessment.assessmentOwner && <span className="text-sm" style={{ color: '#94A3B8' }}>Owner: {assessment.assessmentOwner}</span>}
              <span className="text-sm" style={{ color: '#94A3B8' }}>{sites.length} site{sites.length !== 1 ? 's' : ''} evaluated</span>
              {sites.some(s => s.status === 'Selected') && (
                <Badge style={{ background: 'rgba(52,211,153,0.2)', color: '#34D399' }}>
                  ✅ Selected: {sites.find(s => s.status === 'Selected')?.siteName}
                </Badge>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' }} className="mb-6">
                <TabsTrigger value="questionnaire" style={{ color: activeTab === 'questionnaire' ? '#CADCFC' : '#94A3B8' }}>
                  <Table2 className="w-4 h-4 mr-1" /> Questionnaire
                </TabsTrigger>
                <TabsTrigger value="comparison" style={{ color: activeTab === 'comparison' ? '#CADCFC' : '#94A3B8' }}>
                  <BarChart2 className="w-4 h-4 mr-1" /> Comparison Matrix
                </TabsTrigger>
                <TabsTrigger value="scoring" style={{ color: activeTab === 'scoring' ? '#CADCFC' : '#94A3B8' }}>
                  <MapPin className="w-4 h-4 mr-1" /> Scoring & Ranking
                </TabsTrigger>
              </TabsList>

              <TabsContent value="questionnaire">
                <SiteQuestionnaireView
                  sites={sites}
                  criteria={criteria}
                  activeSiteId={activeSiteId}
                  onSelectSite={setActiveSiteId}
                  assessmentId={assessmentId}
                />
              </TabsContent>
              <TabsContent value="comparison">
                <SiteComparisonView sites={sites} criteria={criteria} />
              </TabsContent>
              <TabsContent value="scoring">
                <SiteScoringView sites={sites} criteria={criteria} assessment={assessment} onRefresh={onRefresh} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* New Assessment Dialog */}
      <Dialog open={showNewAssessment} onOpenChange={setShowNewAssessment}>
        <DialogContent style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.1)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>New Site Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: '#94A3B8' }}>Assessment Name *</Label>
              <Input
                value={newAssessment.assessmentName}
                onChange={e => setNewAssessment(p => ({ ...p, assessmentName: e.target.value }))}
                placeholder="e.g., Phase 1 Site Comparison"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div>
              <Label style={{ color: '#94A3B8' }}>Owner</Label>
              <Input
                value={newAssessment.assessmentOwner}
                onChange={e => setNewAssessment(p => ({ ...p, assessmentOwner: e.target.value }))}
                placeholder="Assessment owner name"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => createAssessmentMutation.mutate()}
                disabled={!newAssessment.assessmentName || createAssessmentMutation.isPending}
                style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}
              >
                Create Assessment
              </Button>
              <Button variant="outline" onClick={() => setShowNewAssessment(false)} style={{ borderColor: 'rgba(202,220,252,0.3)', color: '#CADCFC' }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}