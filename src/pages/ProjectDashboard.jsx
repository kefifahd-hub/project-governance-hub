import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Activity, DollarSign, ClipboardCheck, AlertTriangle, FileText, Briefcase, CheckSquare, BarChart3, MapPin, GitPullRequest, ListTodo, FileCheck, Users, Network, Flag, Mail, Grid3x3, ClipboardList, GitBranch, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '../utils';

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

  const manageCloselyCount = stakeholders.filter(s => (s.influence === 'High') && (s.interest === 'High' || s.interest === 'Medium')).length;
  const highRisksCount = risks.filter(r => r.riskLevel === 'Critical' || r.riskLevel === 'High').length;
  const wbsCompleteCount = wbsElements.filter(w => w.status === 'Complete').length;
  const wbsBudgetTotal = wbsElements.reduce((sum, w) => sum + (w.budgetEurK || 0), 0);

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

  const toolCategories = [
    { label: 'Initiation & Governance', tools: [
      { id: 'charter', name: 'Project Charter', description: 'Purpose, objectives, scope & approvals', icon: FileCheck, color: 'bg-indigo-500', page: 'ProjectCharter' },
      { id: 'stakeholders', name: 'Stakeholder Register', description: 'Power/interest mapping & engagement', icon: Users, color: 'bg-cyan-500', page: 'StakeholderRegister' },
      { id: 'requirements', name: 'Requirements', description: 'MoSCoW prioritized requirements', icon: ClipboardList, color: 'bg-teal-600', page: 'Requirements' },
      { id: 'wbs', name: 'WBS', description: 'Work breakdown with cost & schedule roll-up', icon: Network, color: 'bg-indigo-600', page: 'WBS' },
      { id: 'raci', name: 'RACI Matrix', description: 'Responsible, Accountable, Consulted, Informed', icon: Grid3x3, color: 'bg-purple-600', page: 'RaciMatrix' },
      { id: 'comms', name: 'Communications Plan', description: 'Audience, frequency & channel matrix', icon: Mail, color: 'bg-blue-500', page: 'CommunicationPlan' },
      { id: 'raid', name: 'RAID Log', description: 'Assumptions, issues & dependencies', icon: Flag, color: 'bg-amber-600', page: 'RaidLog' },
      { id: 'gates', name: 'Quality Gates', description: 'Stage-gate readiness & go/no-go', icon: GitBranch, color: 'bg-green-600', page: 'QualityGates' },
    ]},
    { label: 'Planning & Business Case', tools: [
      { id: 'feasibility', name: 'Feasibility Study', description: 'Comprehensive project viability assessment', icon: FileText, color: 'bg-blue-600', page: 'FeasibilityStudy' },
      { id: 'siteselection', name: 'Site Selection', description: 'Evaluate and compare candidate sites', icon: MapPin, color: 'bg-violet-600', page: 'SiteSelection' },
      { id: 'feed', name: 'FEED Tracker', description: 'Track phase milestones and quality gates', icon: ClipboardCheck, color: 'bg-purple-500', page: 'FEEDTracker' },
      { id: 'finance', name: 'Finance Model', description: 'Full P&L, Cash Flow, Balance Sheet & DCF', icon: DollarSign, color: 'bg-emerald-600', page: 'FinanceModel' },
      { id: 'npv', name: 'NPV Calculator', description: 'Assess financial viability and returns', icon: DollarSign, color: 'bg-green-500', page: 'NPVCalculator' },
    ]},
    { label: 'Execution & Monitoring', tools: [
      { id: 'actiontracker', name: 'Action Tracker', description: 'Day-to-day task, issue, decision & RFI management', icon: ListTodo, color: 'bg-violet-500', page: 'ActionTracker' },
      { id: 'risk', name: 'Risk Register', description: 'Manage and mitigate project risks', icon: AlertTriangle, color: 'bg-red-500', page: 'RiskRegister' },
      { id: 'budget', name: 'Budget Tracking', description: 'Monitor budget vs actual spending', icon: Activity, color: 'bg-blue-500', page: 'BudgetDashboard' },
      { id: 'qaqc', name: 'QA/QC', description: 'FAT, SAT, inspections & non-conformities', icon: CheckSquare, color: 'bg-teal-500', page: 'QAQCDashboard' },
      { id: 'changemanagement', name: 'Change Management', description: 'Track, assess and approve change requests', icon: GitPullRequest, color: 'bg-pink-600', page: 'ChangeManagement' },
      { id: 'changeworkflow', name: 'Change Workflow', description: 'Drag-and-drop CCB process canvas', icon: Workflow, color: 'bg-pink-700', page: 'ChangeWorkflow' },
    ]},
    { label: 'Reporting', tools: [
      { id: 'weekly', name: 'Weekly Reports', description: 'Generate compiled status reports', icon: FileText, color: 'bg-orange-500', page: 'WeeklyReports' },
      { id: 'briefing', name: 'Client Briefing', description: 'One-click executive summaries', icon: Briefcase, color: 'bg-indigo-500', page: 'ClientBriefing' },
      { id: 'reports', name: 'Reports', description: 'Custom report builder', icon: BarChart3, color: 'bg-slate-500', page: 'Reports' },
    ]},
    { label: 'Administration', tools: [
      { id: 'useraccess', name: 'Users & Access', description: 'Roles, organizations & audit logs', icon: Users, color: 'bg-slate-600', page: 'UserAccess' },
    ]},
  ];

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

      {/* Initiation Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: '#CADCFC' }}>Project Initiation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }} onClick={() => navigate(createPageUrl(`ProjectCharter?id=${projectId}`))}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Charter</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${charter?.approvalStatus === 'Approved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{charter?.approvalStatus || 'Not Created'}</span>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#CADCFC' }}>{charter?.sponsor ? `Sponsor: ${charter.sponsor}` : 'No sponsor set'}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>{charter?.projectManager ? `PM: ${charter.projectManager}` : 'No PM assigned'}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }} onClick={() => navigate(createPageUrl(`StakeholderRegister?id=${projectId}`))}>
            <CardContent className="pt-4">
              <span className="text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Stakeholders</span>
              <div className="text-2xl font-bold" style={{ color: '#CADCFC' }}>{stakeholders.length}</div>
              <p className="text-xs" style={{ color: '#64748b' }}>{manageCloselyCount} manage closely</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }} onClick={() => navigate(createPageUrl(`RiskRegister?id=${projectId}`))}>
            <CardContent className="pt-4">
              <span className="text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Key Risks</span>
              <div className="text-2xl font-bold text-red-400">{highRisksCount}</div>
              <p className="text-xs" style={{ color: '#64748b' }}>Critical/High severity</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }} onClick={() => navigate(createPageUrl(`WBS?id=${projectId}`))}>
            <CardContent className="pt-4">
              <span className="text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>WBS</span>
              <div className="text-2xl font-bold" style={{ color: '#CADCFC' }}>{wbsElements.length}</div>
              <p className="text-xs" style={{ color: '#64748b' }}>{wbsElements.length > 0 ? `${Math.round(wbsCompleteCount/wbsElements.length*100)}% complete · €${wbsBudgetTotal.toLocaleString()}K` : 'No elements'}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Categorized Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {toolCategories.map(category => (
          <div key={category.label}>
            <h2 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: '#CADCFC' }}>{category.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {category.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card
                    key={tool.id}
                    className="transition-all cursor-pointer group hover:transform hover:-translate-y-1"
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    onClick={() => navigate(createPageUrl(`${tool.page}?id=${projectId}`))}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 20px rgba(2, 128, 144, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`${tool.color} p-3 rounded-lg text-white`}><Icon className="w-6 h-6" /></div>
                        <CardTitle className="text-lg transition-colors" style={{ color: '#CADCFC' }}>{tool.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent><CardDescription style={{ color: '#94A3B8' }}>{tool.description}</CardDescription></CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}