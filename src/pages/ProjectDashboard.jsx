import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Activity, DollarSign, ClipboardCheck, AlertTriangle, FileText, Briefcase, CheckSquare, BarChart3, MapPin, GitPullRequest, ListTodo } from 'lucide-react';
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

  const tools = [
    {
      id: 'actiontracker',
      name: 'Action Tracker',
      description: 'Day-to-day task, issue, decision & RFI management',
      icon: ListTodo,
      color: 'bg-violet-500',
      page: 'ActionTracker'
    },
    {
      id: 'siteselection',
      name: 'Site Selection',
      description: 'Evaluate and compare candidate sites with structured scoring matrix',
      icon: MapPin,
      color: 'bg-violet-600',
      page: 'SiteSelection'
    },
    {
      id: 'finance',
      name: 'Finance Model',
      description: 'Full P&L, Cash Flow, Balance Sheet & DCF',
      icon: DollarSign,
      color: 'bg-emerald-600',
      page: 'FinanceModel'
    },
    {
      id: 'feasibility',
      name: 'Feasibility Study',
      description: 'Comprehensive project viability assessment',
      icon: FileText,
      color: 'bg-blue-600',
      page: 'FeasibilityStudy'
    },
    {
      id: 'feed',
      name: 'FEED Tracker',
      description: 'Track phase milestones and quality gates',
      icon: ClipboardCheck,
      color: 'bg-purple-500',
      page: 'FEEDTracker'
    },
    {
      id: 'npv',
      name: 'NPV Calculator',
      description: 'Assess financial viability and returns',
      icon: DollarSign,
      color: 'bg-green-500',
      page: 'NPVCalculator'
    },
    {
      id: 'risk',
      name: 'Risk Register',
      description: 'Manage and mitigate project risks',
      icon: AlertTriangle,
      color: 'bg-red-500',
      page: 'RiskRegister'
    },
    {
      id: 'budget',
      name: 'Budget Tracking',
      description: 'Monitor budget vs actual spending',
      icon: Activity,
      color: 'bg-blue-500',
      page: 'BudgetDashboard'
    },
    {
      id: 'weekly',
      name: 'Weekly Reports',
      description: 'Generate compiled status reports',
      icon: FileText,
      color: 'bg-orange-500',
      page: 'WeeklyReports'
    },
    {
      id: 'briefing',
      name: 'Client Briefing',
      description: 'One-click executive summaries',
      icon: Briefcase,
      color: 'bg-indigo-500',
      page: 'ClientBriefing'
    },
    {
      id: 'qaqc',
      name: 'QA/QC',
      description: 'FAT, SAT, inspections & non-conformities',
      icon: CheckSquare,
      color: 'bg-teal-500',
      page: 'QAQCDashboard'
    },
    {
      id: 'schedule',
      name: 'Schedule Monitoring',
      description: 'P6/MS Project schedule tracking',
      icon: BarChart3,
      color: 'bg-cyan-500',
      page: 'ScheduleMonitoring'
    },
    {
      id: 'changemanagement',
      name: 'Change Management',
      description: 'Track, assess and approve project change requests',
      icon: GitPullRequest,
      color: 'bg-pink-600',
      page: 'ChangeManagement'
    }
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <p style={{ color: '#94A3B8' }}>Project not found</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#CADCFC' }}>{project.name}</h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: '#94A3B8' }}>{project.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="text-sm">
                  <span style={{ color: '#94A3B8' }}>Owner: </span>
                  <span className="font-medium" style={{ color: '#F8FAFC' }}>{project.owner}</span>
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
                  <div className={`w-4 h-4 rounded-full ${healthStatus.color.split(' ')[0]}`} />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: '#F8FAFC' }}>{healthScore.toFixed(1)}%</div>
                    <div className={`text-sm font-medium ${healthStatus.color.split(' ')[1]}`}>
                      {healthStatus.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6" style={{ color: '#CADCFC' }}>Governance Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.id}
                className="transition-all cursor-pointer group hover:transform hover:-translate-y-1"
                style={{ 
                  background: 'rgba(30, 39, 97, 0.5)', 
                  borderColor: 'rgba(202, 220, 252, 0.1)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onClick={() => navigate(createPageUrl(`${tool.page}?id=${projectId}`))}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 20px rgba(2, 128, 144, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`${tool.color} p-3 rounded-lg text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg transition-colors" style={{ color: '#CADCFC' }}>
                        {tool.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription style={{ color: '#94A3B8' }}>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}