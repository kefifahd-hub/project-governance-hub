import { Activity, DollarSign, ClipboardCheck, AlertTriangle, FileText, Briefcase, CheckSquare, BarChart3, MapPin, GitPullRequest, ListTodo, FileCheck, Users, Network, Flag, Mail, Grid3x3, ClipboardList, GitBranch, Workflow, BookOpen, Search, KeyRound } from 'lucide-react';

export const toolCategories = [
  { label: 'Initiation & Governance', tools: [
    { id: 'charter', name: 'Project Charter', description: 'Purpose, objectives, scope & approvals', icon: FileCheck, color: 'bg-indigo-500', page: 'ProjectCharter' },
    { id: 'stakeholders', name: 'Stakeholder Register', description: 'Power/interest mapping & engagement', icon: Users, color: 'bg-cyan-500', page: 'StakeholderRegister' },
    { id: 'requirements', name: 'Requirements', description: 'MoSCoW prioritized requirements', icon: ClipboardList, color: 'bg-teal-600', page: 'Requirements' },
    { id: 'wbs', name: 'WBS', description: 'Work breakdown with cost & schedule roll-up', icon: Network, color: 'bg-indigo-600', page: 'WBS' },
    { id: 'raci', name: 'RACI Matrix', description: 'Responsible, Accountable, Consulted, Informed', icon: Grid3x3, color: 'bg-purple-600', page: 'RaciMatrix' },
    { id: 'comms', name: 'Communications Plan', description: 'Audience, frequency & channel matrix', icon: Mail, color: 'bg-blue-500', page: 'CommunicationPlan' },
    { id: 'raid', name: 'RAID Log', description: 'Assumptions, issues & dependencies', icon: Flag, color: 'bg-amber-600', page: 'RaidLog' },
    { id: 'gates', name: 'Quality Gates', description: 'Stage-gate readiness & go/no-go', icon: GitBranch, color: 'bg-green-600', page: 'QualityGates' },
    { id: 'lessons', name: 'Lessons Learned', description: 'Capture lessons & recommendations', icon: BookOpen, color: 'bg-sky-500', page: 'LessonsLearned' },
    { id: 'audit', name: 'Audit & CAPA', description: 'Audits, findings & corrective actions', icon: Search, color: 'bg-purple-500', page: 'AuditRegister' },
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
    { id: 'turnover', name: 'Turnover Packages', description: 'System turnover status & workflow board', icon: KeyRound, color: 'bg-green-500', page: 'TurnoverPackages' },
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