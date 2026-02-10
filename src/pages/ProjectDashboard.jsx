import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Activity, DollarSign, ClipboardCheck, AlertTriangle, FileText, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from './utils';

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
      id: 'health',
      name: 'Health Calculator',
      description: 'Monitor project health with weighted scoring',
      icon: Activity,
      color: 'bg-blue-500',
      page: 'HealthCalculator'
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
      id: 'feed',
      name: 'FEED Tracker',
      description: 'Track 23-item FEED checklist progress',
      icon: ClipboardCheck,
      color: 'bg-purple-500',
      page: 'FEEDTracker'
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
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Home'))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
              <p className="text-slate-600 mt-2">{project.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="text-sm">
                  <span className="text-slate-600">Owner: </span>
                  <span className="font-medium text-slate-900">{project.owner}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-600">Status: </span>
                  <span className="font-medium text-slate-900">{project.status}</span>
                </div>
              </div>
            </div>

            {/* Health Score Display */}
            <Card className="w-64">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Overall Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${healthStatus.color.split(' ')[0]}`} />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{healthScore.toFixed(1)}%</div>
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Governance Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.id}
                className="hover:shadow-lg transition-all cursor-pointer border-slate-200 group"
                onClick={() => navigate(createPageUrl(`${tool.page}?id=${projectId}`))}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`${tool.color} p-3 rounded-lg text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {tool.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}