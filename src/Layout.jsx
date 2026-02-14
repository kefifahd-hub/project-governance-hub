import { Link, useLocation } from 'react-router-dom';
import { Home, Wrench, Settings } from 'lucide-react';
import { createPageUrl } from './utils';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  
  const navItems = [
    { name: 'Home', icon: Home, path: createPageUrl('Home') },
    { name: 'Tools', icon: Wrench, path: createPageUrl('ProjectDashboard' + location.search) },
    { name: 'Settings', icon: Settings, path: createPageUrl('Settings') }
  ];

  const isActive = (path) => {
    return location.pathname === path.split('?')[0];
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-20">
        {children}
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(15, 23, 42, 0.98)', borderTop: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-around py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all"
                  style={{
                    color: active ? '#00A896' : '#94A3B8',
                    background: active ? 'rgba(0, 168, 150, 0.1)' : 'transparent'
                  }}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}