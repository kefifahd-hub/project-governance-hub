import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, LayoutDashboard, MapPin, FileText, DollarSign, Calculator, AlertTriangle, PiggyBank, CheckSquare, BarChart3, ClipboardCheck, FileBarChart } from 'lucide-react';
import { createPageUrl } from '../utils';

// Phase → which tools are relevant
const PHASE_TOOLS = {
  'Feasibility': ['SiteSelection', 'FeasibilityStudy', 'NPVCalculator', 'FinanceModel'],
  'Pre-FEED':    ['SiteSelection', 'FeasibilityStudy', 'NPVCalculator', 'FinanceModel', 'RiskRegister'],
  'FEED':        ['FeasibilityStudy', 'FinanceModel', 'NPVCalculator', 'FEEDTracker', 'RiskRegister', 'BudgetDashboard'],
  'Investment Decision': ['FinanceModel', 'NPVCalculator', 'RiskRegister', 'BudgetDashboard'],
  'Project Setup':       ['FinanceModel', 'RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring'],
  'Detailed Engineering':['FEEDTracker', 'RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring', 'WeeklyReports'],
  'Procurement':         ['RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring', 'WeeklyReports', 'QAQCDashboard'],
  'Construction':        ['RiskRegister', 'BudgetDashboard', 'ScheduleMonitoring', 'WeeklyReports', 'QAQCDashboard'],
  'Commissioning':       ['ScheduleMonitoring', 'WeeklyReports', 'QAQCDashboard', 'BudgetDashboard'],
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
];

// Always visible regardless of phase
const ALWAYS_TOOLS = ['ClientBriefing'];

export default function ProjectSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('id');
  const [expandedId, setExpandedId] = useState(selectedProjectId);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.filter({ status: 'Active' }, '-created_date'),
  });

  const currentPath = location.pathname;
  const isActivePage = (page) => currentPath.includes(page);

  const getToolsForProject = (phase) => {
    const phaseTools = PHASE_TOOLS[phase] || [];
    return ALL_TOOLS.filter(t => phaseTools.includes(t.page));
  };

  return (
    <div
      className="fixed left-0 top-14 bottom-16 w-64 overflow-y-auto hidden lg:block z-40"
      style={{ background: 'rgba(15, 23, 42, 0.98)', borderRight: '1px solid rgba(202, 220, 252, 0.1)' }}
    >
      <div className="p-4">
        <Button
          onClick={() => navigate(createPageUrl('NewProject'))}
          className="w-full mb-4"
          size="sm"
          style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>

        <div className="space-y-1">
          {projects.map((project) => {
            const isSelected = selectedProjectId === project.id;
            const isExpanded = expandedId === project.id;
            const phaseTools = getToolsForProject(project.currentPhase);

            return (
              <div key={project.id}>
                {/* Project Row */}
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : project.id);
                    navigate(createPageUrl(`Home?id=${project.id}`));
                  }}
                  className="w-full text-left p-3 rounded-lg transition-all flex items-center justify-between"
                  style={{
                    background: isSelected ? 'rgba(0, 168, 150, 0.15)' : 'rgba(30, 39, 97, 0.3)',
                    borderLeft: isSelected ? '3px solid #00A896' : '3px solid transparent',
                    color: isSelected ? '#CADCFC' : '#94A3B8',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm">{project.projectName}</div>
                      <div className="text-xs truncate opacity-70">{project.currentPhase}</div>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
                    : <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                  }
                </button>

                {/* Tool Links — only show when project is expanded/selected */}
                {isExpanded && (
                  <div className="ml-3 mt-1 space-y-0.5 border-l pl-3" style={{ borderColor: 'rgba(0,168,150,0.3)' }}>
                    {/* Dashboard */}
                    <button
                      onClick={() => navigate(createPageUrl(`Home?id=${project.id}`))}
                      className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-all"
                      style={{
                        color: isActivePage('Home') && isSelected ? '#00A896' : '#94A3B8',
                        background: isActivePage('Home') && isSelected ? 'rgba(0,168,150,0.1)' : 'transparent',
                      }}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                      Dashboard
                    </button>

                    {/* Phase-relevant tools */}
                    {phaseTools.map(tool => {
                      const Icon = tool.icon;
                      const active = isActivePage(tool.page) && isSelected;
                      return (
                        <button
                          key={tool.page}
                          onClick={() => navigate(createPageUrl(`${tool.page}?id=${project.id}`))}
                          className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-all"
                          style={{
                            color: active ? '#00A896' : '#94A3B8',
                            background: active ? 'rgba(0,168,150,0.1)' : 'transparent',
                          }}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          {tool.label}
                        </button>
                      );
                    })}

                    {/* Client Briefing — always */}
                    <button
                      onClick={() => navigate(createPageUrl(`ClientBriefing?id=${project.id}`))}
                      className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-all"
                      style={{
                        color: isActivePage('ClientBriefing') && isSelected ? '#00A896' : '#94A3B8',
                        background: isActivePage('ClientBriefing') && isSelected ? 'rgba(0,168,150,0.1)' : 'transparent',
                      }}
                    >
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      Client Briefing
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}