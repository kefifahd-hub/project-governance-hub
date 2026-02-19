import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, LayoutDashboard, MapPin, FileText, DollarSign, Calculator, AlertTriangle, PiggyBank, CheckSquare, BarChart3, ClipboardCheck, FileBarChart, GitPullRequest, ListTodo } from 'lucide-react';
import { createPageUrl } from '../utils';

// Phase → which tools are relevant
const PHASE_TOOLS = {
  'Feasibility': ['SiteSelection', 'FeasibilityStudy', 'NPVCalculator', 'FinanceModel', 'SiteSelection'],
  'Pre-FEED':    ['SiteSelection', 'FeasibilityStudy', 'NPVCalculator', 'FinanceModel', 'RiskRegister'],
  'FEED':        ['FeasibilityStudy', 'FinanceModel', 'NPVCalculator', 'FEEDTracker', 'RiskRegister', 'BudgetDashboard'],
  'Investment Decision': ['FinanceModel', 'NPVCalculator', 'RiskRegister', 'BudgetDashboard'],
  'Project Setup':       ['FinanceModel', 'RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring'],
  'Detailed Engineering':['FEEDTracker', 'RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring', 'WeeklyReports', 'ChangeManagement'],
  'Procurement':         ['RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring', 'WeeklyReports', 'QAQCDashboard', 'ChangeManagement'],
  'Construction':        ['RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring', 'WeeklyReports', 'QAQCDashboard', 'ChangeManagement'],
  'Commissioning':       ['ScheduleMonitoring', 'WeeklyReports', 'QAQCDashboard', 'BudgetDashboard', 'RiskRegister', 'ChangeManagement'],

  'SOP':                 ['FinanceModel', 'BudgetDashboard', 'WeeklyReports'],
};

const ALL_TOOLS = [
  { page: 'SiteSelection',      label: 'Site Selection',       icon: MapPin },
  { page: 'FeasibilityStudy',   label: 'Feasibility Study',    icon: FileText },
  { page: 'NPVCalculator',      label: 'NPV Calculator',       icon: Calculator },
  { page: 'FinanceModel',       label: 'Finance Model',        icon: DollarSign },
  { page: 'FEEDTracker',        label: 'FEED Tracker',         icon: ClipboardCheck },
  { page: 'RiskRegister',       label: 'Risk Register',        icon: AlertTriangle },
  { page: 'BudgetDashboard',    label: 'Budget Tracking',      icon: PiggyBank },
  { page: 'ScheduleMonitoring', label: 'Schedule Monitoring',  icon: BarChart3 },
  { page: 'WeeklyReports',      label: 'Weekly Reports',       icon: FileBarChart },
  { page: 'QAQCDashboard',      label: 'QA/QC',                icon: CheckSquare },
  { page: 'ChangeManagement',   label: 'Change Management',    icon: GitPullRequest },
];

// Always visible regardless of phase
const ALWAYS_TOOLS = ['ClientBriefing'];

export default function ProjectSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => { const r = await base44.entities.Project.filter({ id: projectId }); return r[0]; },
    enabled: !!projectId,
  });

  const currentPath = location.pathname;
  const isActivePage = (page) => currentPath.includes(page);
  const isHomePage = currentPath.endsWith('/Home') || currentPath === '/';

  // Normalize phase matching (trim + case-insensitive fallback)
  const phase = project?.currentPhase?.trim();
  const matchedPhase = Object.keys(PHASE_TOOLS).find(k => k.toLowerCase() === phase?.toLowerCase()) || phase;
  const phaseTools = ALL_TOOLS.filter(t => (PHASE_TOOLS[matchedPhase] || []).includes(t.page));

  if (!projectId || !project) return null;

  return (
    <div
      className="fixed left-0 top-14 bottom-16 w-64 overflow-y-auto hidden lg:block z-40"
      style={{ background: 'rgba(15, 23, 42, 0.98)', borderRight: '1px solid rgba(202, 220, 252, 0.1)' }}
    >
      <div className="p-4">
        {/* Project info header */}
        <div className="mb-4 px-2 py-3 rounded-lg" style={{ background: 'rgba(0,168,150,0.1)', border: '1px solid rgba(0,168,150,0.2)' }}>
          <div className="font-semibold text-sm truncate" style={{ color: '#CADCFC' }}>{project.projectName}</div>
          <div className="text-xs mt-0.5" style={{ color: '#00A896' }}>{project.currentPhase}</div>
        </div>

        <div className="space-y-0.5">
          {/* Dashboard */}
          <button
            onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))}
            className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all"
            style={{
              color: isHomePage ? '#00A896' : '#94A3B8',
              background: isHomePage ? 'rgba(0,168,150,0.1)' : 'transparent',
            }}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Dashboard
          </button>

          {/* Divider */}
          <div className="my-2 text-xs px-3 uppercase tracking-wider" style={{ color: '#475569' }}>Tools</div>

          {/* All tools — active ones clickable, inactive ones greyed out */}
          {ALL_TOOLS.map(tool => {
            const Icon = tool.icon;
            const enabled = phaseTools.some(t => t.page === tool.page);
            const active = enabled && isActivePage(tool.page);
            return (
              <button
                key={tool.page}
                onClick={() => enabled && navigate(createPageUrl(`${tool.page}?id=${projectId}`))}
                disabled={!enabled}
                className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all"
                style={{
                  color: active ? '#00A896' : enabled ? '#94A3B8' : '#334155',
                  background: active ? 'rgba(0,168,150,0.1)' : 'transparent',
                  cursor: enabled ? 'pointer' : 'default',
                  opacity: enabled ? 1 : 0.45,
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tool.label}
              </button>
            );
          })}

          {/* Client Briefing — always */}
          <button
            onClick={() => navigate(createPageUrl(`ClientBriefing?id=${projectId}`))}
            className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all"
            style={{
              color: isActivePage('ClientBriefing') ? '#00A896' : '#94A3B8',
              background: isActivePage('ClientBriefing') ? 'rgba(0,168,150,0.1)' : 'transparent',
            }}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            Client Briefing
          </button>
        </div>
      </div>
    </div>
  );
}