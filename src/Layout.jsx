import React, { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Home, Wrench, Settings, Menu, ChevronDown, Briefcase, FileBarChart, Users, BrainCircuit } from 'lucide-react';
import { createPageUrl } from './utils';
import ProjectSidebar from './components/ProjectSidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const STORAGE_KEY = 'pmo_auth';

export default function Layout({ children, currentPageName }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [authed, setAuthed] = useState(true);

  // All hooks must be called unconditionally before any early return
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.filter({ status: 'Active' }, '-created_date'),
    enabled: authed,
  });

  const { data: currentProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const result = await base44.entities.Project.filter({ id: projectId });
      return result[0];
    },
    enabled: authed && !!projectId,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === SECURITY_CODE) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <div className="w-full max-w-sm p-8 rounded-2xl shadow-2xl" style={{ background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(202, 220, 252, 0.15)' }}>
          <div className="text-center mb-8">
            <div className="text-3xl font-bold mb-2" style={{ color: '#CADCFC' }}>PMO Platform</div>
            <div className="text-sm" style={{ color: '#94A3B8' }}>Enter your access code to continue</div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(false); }}
              placeholder="Access code"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(30, 39, 97, 0.6)', border: `1px solid ${error ? '#EF4444' : 'rgba(202, 220, 252, 0.2)'}`, color: '#F8FAFC' }}
              autoFocus
            />
            {error && <div className="text-sm text-red-400">Incorrect access code. Please try again.</div>}
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  const showSidebar = !['NewProject', 'Settings'].includes(currentPageName) && !!projectId;
  const tools = [
    { name: 'Action Tracker', page: 'ActionTracker' },
    { name: 'Site Selection', page: 'SiteSelection' },
    { name: 'Feasibility Study', page: 'FeasibilityStudy' },
    { name: 'Finance Model', page: 'FinanceModel' },
    { name: 'FEED Tracker', page: 'FEEDTracker' },
    { name: 'NPV Calculator', page: 'NPVCalculator' },
    { name: 'Risk Register', page: 'RiskRegister' },
    { name: 'Budget Tracking', page: 'BudgetDashboard' },
    { name: 'QA/QC', page: 'QAQCDashboard' },
    { name: 'Schedule Monitoring', page: 'ScheduleMonitoring' },
    { name: 'Weekly Reports', page: 'WeeklyReports' },
    { name: 'Schedule Sync', page: 'ScheduleSync' },
    { name: 'Users & Access', page: 'UserAccess' },
    { name: 'Change Management', page: 'ChangeManagement' },
    { name: 'Reports', page: 'Reports' },
    { name: 'Client Briefing', page: 'ClientBriefing' }
  ];
  
  const navItems = [
    { name: 'Home', icon: Home, path: projectId ? createPageUrl(`Home?id=${projectId}`) : createPageUrl('Home') },
    { name: 'Tools', icon: Wrench, path: projectId ? createPageUrl(`ProjectDashboard?id=${projectId}`) : createPageUrl('Home') },
    { name: 'Settings', icon: Settings, path: createPageUrl('Settings') }
  ];

  const isActive = (path) => {
    const basePath = path.split('?')[0];
    const currentPath = location.pathname;
    
    if (basePath.includes('ProjectDashboard')) {
      return currentPath.includes('ProjectDashboard') || 
             currentPath.includes('FEEDTracker') || 
             currentPath.includes('NPVCalculator') || 
             currentPath.includes('RiskRegister') || 
             currentPath.includes('BudgetDashboard') || 
             currentPath.includes('WeeklyReports') || 
             currentPath.includes('ClientBriefing');
    }
    
    return currentPath === basePath;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(15, 23, 42, 0.98)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="font-bold text-lg" style={{ color: '#CADCFC' }}>
            PMO Platform
          </Link>
          
          <div className="flex items-center gap-2">
            {/* Projects Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" style={{ color: '#CADCFC' }}>
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{currentProject?.projectName || 'Projects'}</span>
                  <span className="sm:hidden">Projects</span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.2)' }}>
                {projects.map((project) => (
                  <DropdownMenuItem 
                    key={project.id}
                    onClick={() => window.location.href = createPageUrl(`Home?id=${project.id}`)}
                    style={{ color: projectId === project.id ? '#00A896' : '#CADCFC' }}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    {project.projectName}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator style={{ background: 'rgba(202, 220, 252, 0.1)' }} />
                <DropdownMenuItem 
                  onClick={() => window.location.href = createPageUrl('NewProject')}
                  style={{ color: '#00A896' }}
                >
                  + New Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tools Dropdown */}
            {projectId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" style={{ color: '#CADCFC' }}>
                    <Wrench className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Tools</span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.2)' }}>
                  {tools.map((tool) => (
                    <DropdownMenuItem 
                      key={tool.page}
                      onClick={() => window.location.href = createPageUrl(`${tool.page}?id=${projectId}`)}
                      style={{ color: '#CADCFC' }}
                    >
                      {tool.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Settings Link */}
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="sm" style={{ color: '#CADCFC' }}>
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {showSidebar && <ProjectSidebar />}
      
      <div className="flex-1 pb-20 pt-14">
        <div className={showSidebar ? 'lg:ml-64' : ''}>
          {children}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 right-0 left-0 z-50" style={{ background: 'rgba(15, 23, 42, 0.98)', borderTop: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-around py-2 sm:py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-6 py-1 sm:py-2 rounded-lg transition-all"
                  style={{
                    color: active ? '#00A896' : '#94A3B8',
                    background: active ? 'rgba(0, 168, 150, 0.1)' : 'transparent'
                  }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[10px] sm:text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}