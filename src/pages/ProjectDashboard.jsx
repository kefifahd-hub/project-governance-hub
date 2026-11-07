import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileCheck, Users, AlertTriangle, Network, KeyRound, ClipboardCheck, GitBranch, BookOpen, Search, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '../utils';
import { toolCategories } from '@/components/dashboard/toolCatalog';
import CompactStatGroup from '@/components/dashboard/CompactStatGroup';
import ToolsDrawer from '@/components/dashboard/ToolsDrawer';

export default function ProjectDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  // Initiation summary data
  const { data: charter } = useQuery({
    queryKey: ['projectCharter', projectId],
    queryFn: async () => { const r = await base44.entities.ProjectCharter.filter({ projectId }); return r[0] || null; },
    enabled: !!projectId,
  });
  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders', projectId],
    queryFn: () => base44.entities.Stakeholder.filter({ projectId }),
    enabled: !!projectId,
  });
  const { data: risks = [] } = useQuery({
    queryKey: ['risks', projectId],
    queryFn: () => base44.entities.Risk.filter({ projectId }),
    enabled: !!projectId,
  });
  const { data: wbsElements = [] } = useQuery({
    queryKey: ['wbsElements', projectId],
    queryFn: () => base44.entities.WbsElement.filter({ projectId }),
    enabled: !!projectId,
  });
  const { data: turnoverPackages = [] } = useQuery({
    queryKey: ['turnoverPackages', projectId],
    queryFn: () => base44.entities.TurnoverPackage.filter({ projectId }),
    enabled: !!projectId,
  });
  const { data: qualityGates = [] } = useQuery({
    queryKey: ['qualityGates', projectId],
    queryFn: () => base44.entities.QualityGate.filter({ projectId }),
    enabled: !!projectId,
  });
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessonsLearned', projectId],
    queryFn: () => base44.entities.LessonLearned.filter({ projectId }),
    enabled: !!projectId,
  });
  const { data: auditFindings = [] } = useQuery({
    queryKey: ['auditFindings', projectId],
    queryFn: () => base44.entities.AuditFinding.filter({ projectId }),
    enabled: !!projectId,
  });

  const turnoverTurnedOver = turnoverPackages.filter(p => p.status === 'Turned Over to Ops').length;
  const turnoverPct = turnoverPackages.length ? Math.round(turnoverTurnedOver / turnoverPackages.length * 100) : 0;
  const punchlistAOpen = turnoverPackages.reduce((s, p) => s + (p.punchlistA || 0), 0);
  const qg5 = qualityGates.find(g => g.gateNumber === 5);
  const qg6 = qualityGates.find(g => g.gateNumber === 6);
  const qg5Ready = turnoverPct >= 80 && punchlistAOpen === 0;
  const qg6Ready = turnoverPct >= 100;

  const manageCloselyCount = stakeholders.filter(s => (s.influence === 'High') && (s.interest === 'High' || s.interest === 'Medium')).length;
  const highRisksCount = risks.filter(r => r.riskLevel === 'Critical' || r.riskLevel === 'High').length;
  const wbsCompleteCount = wbsElements.filter(w => w.status === 'Complete').length;
  const wbsBudgetTotal = wbsElements.reduce((sum, w) => sum + (w.budgetEurK || 0), 0);

  const wbsPct = wbsElements.length ? Math.round(wbsCompleteCount / wbsElements.length * 100) : 0;
  const openLessons = lessons.filter(l => l.status !== 'Closed').length;
  const openFindings = auditFindings.filter(f => f.status === 'Open').length;

  const initiationItems = [
    { id: 'charter', icon: FileCheck, color: 'bg-indigo-500', value: charter?.approvalStatus || 'Not created', caption: charter?.sponsor ? `Sponsor: ${charter.sponsor}` : 'No sponsor set', onClick: () => navigate(createPageUrl(`ProjectCharter?id=${projectId}`)) },
    { id: 'stakeholders', icon: Users, color: 'bg-cyan-500', value: stakeholders.length, caption: `${manageCloselyCount} manage closely`, onClick: () => navigate(createPageUrl(`StakeholderRegister?id=${projectId}`)) },
    { id: 'risks', icon: AlertTriangle, color: 'bg-red-500', value: highRisksCount, caption: 'Critical / high risks', valueColor: highRisksCount > 0 ? '#FCA5A5' : undefined, onClick: () => navigate(createPageUrl(`RiskRegister?id=${projectId}`)) },
    { id: 'wbs', icon: Network, color: 'bg-indigo-600', value: wbsElements.length, caption: wbsElements.length ? `${wbsPct}% complete` : 'No elements', onClick: () => navigate(createPageUrl(`WBS?id=${projectId}`)) },
  ];

  const turnoverItems = [
    { id: 'turned', icon: KeyRound, color: 'bg-green-500', value: `${turnoverPct}%`, caption: `${turnoverTurnedOver} of ${turnoverPackages.length} systems`, valueColor: '#86EFAC', onClick: () => navigate(createPageUrl(`TurnoverPackages?id=${projectId}`)) },
    { id: 'punchlist', icon: ClipboardCheck, color: 'bg-amber-600', value: punchlistAOpen, caption: 'Punchlist A open', valueColor: punchlistAOpen > 0 ? '#FCD34D' : '#86EFAC', onClick: () => navigate(createPageUrl(`TurnoverPackages?id=${projectId}`)) },
    { id: 'qg5', icon: GitBranch, color: 'bg-green-600', value: qg5?.status || 'Not reached', caption: 'QG5 — Mechanical completion', onClick: () => navigate(createPageUrl(`QualityGates?id=${projectId}`)) },
    { id: 'qg6', icon: GitBranch, color: 'bg-teal-500', value: qg6?.status || 'Not reached', caption: 'QG6 — Ready for Ops', onClick: () => navigate(createPageUrl(`QualityGates?id=${projectId}`)) },
  ];

  const closureItems = [
    { id: 'lessons', icon: BookOpen, color: 'bg-sky-500', value: openLessons, caption: 'Open lessons learned', onClick: () => navigate(createPageUrl(`LessonsLearned?id=${projectId}`)) },
    { id: 'findings', icon: Search, color: 'bg-purple-500', value: openFindings, caption: 'Open audit findings', valueColor: openFindings > 0 ? '#FCD34D' : undefined, onClick: () => navigate(createPageUrl(`AuditRegister?id=${projectId}`)) },
    { id: 'turnover', icon: KeyRound, color: 'bg-green-500', value: `${turnoverPct}%`, caption: 'Turnover complete', onClick: () => navigate(createPageUrl(`TurnoverPackages?id=${projectId}`)) },
    { id: 'reports', icon: BarChart3, color: 'bg-slate-500', value: 'Open', caption: 'Close-out reports', onClick: () => navigate(createPageUrl(`Reports?id=${projectId}`)) },
  ];

  const calculateHealthScore = () => {
    if (!project) return 0;
    const milestone = project.healthMilestone || 0;
    const budget = project.healthBudget || 0;
    const schedule = project.healthSchedule || 0;
    const risk = project.healthRisk || 0;
    return (milestone * 0.40) + (budget * 0.30) + (schedule * 0.20) + (risk * 0.10);
  };

  const getHealthStatus = (score) => {
    if (score >= 80) return { label: 'Healthy', color: 'bg-green-500 text-green-500' };
    if (score >= 60) return { label: 'Caution', color: 'bg-yellow-500 text-yellow-500' };
    return { label: 'Critical', color: 'bg-red-500 text-red-500' };
  };

  const healthScore = calculateHealthScore();
  const healthStatus = getHealthStatus(healthScore);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <p style={{ color: '#94A3B8' }}>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold mb-2" style={{ color: '#CADCFC' }}>No project selected</p>
          <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
            {projectId ? 'Project not found.' : 'Please select a project from the Projects dropdown in the top bar, or create a new one.'}
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
          >
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Header */}
      <div className="shadow-sm" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Home'))}
            className="mb-4 hover:bg-opacity-10"
            style={{ color: '#CADCFC' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Projects</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#CADCFC' }}>{project.projectName}</h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: '#94A3B8' }}>
                {project.notes || `${project.clientName ? project.clientName + ' · ' : ''}${project.projectType || ''}`}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="text-sm">
                  <span style={{ color: '#94A3B8' }}>Owner: </span>
                  <span className="font-medium" style={{ color: '#F8FAFC' }}>{project.projectOwner || project.owner || '—'}</span>
                </div>
                <div className="text-sm">
                  <span style={{ color: '#94A3B8' }}>Status: </span>
                  <span className="font-medium" style={{ color: '#F8FAFC' }}>{project.status}</span>
                </div>
              </div>
            </div>

            {/* Health Score Display */}
            <Card className="w-full lg:w-64" style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: '#94A3B8' }}>Overall Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full shrink-0 ${healthStatus.color.split(' ')[0]}`}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: '#F8FAFC' }}>{healthScore.toFixed(1)}%</div>
                    <div className={`text-sm font-medium ${healthStatus.color.split(' ')[1]}`}>
                      Status: {healthStatus.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tools dropdown — opens downward, tap a tool to open it for this project */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <ToolsDrawer
          categories={toolCategories}
          onOpen={(page) => navigate(createPageUrl(`${page}?id=${projectId}`))}
        />
      </div>

      {/* Summary groups — compact, iOS-style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <CompactStatGroup label="Project Initiation" items={initiationItems} />
        {turnoverPackages.length > 0 && (
          <CompactStatGroup label="Turnover & Handover Readiness" items={turnoverItems} />
        )}
        <CompactStatGroup label="Project Closure" items={closureItems} />
      </div>

      <div className="pb-8" />
    </div>
  );
}