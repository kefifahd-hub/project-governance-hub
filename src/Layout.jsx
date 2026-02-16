import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Home, Wrench, Settings } from 'lucide-react';
import { createPageUrl } from './utils';
import ProjectSidebar from './components/ProjectSidebar';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  
  const showSidebar = !['NewProject', 'Settings'].includes(currentPageName);
  
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
      {showSidebar && <ProjectSidebar />}
      
      <div className="flex-1 pb-20" style={{ marginLeft: showSidebar ? '0' : '0' }}>
        <div style={{ marginLeft: showSidebar ? '0' : '0' }} className="lg:ml-64">
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