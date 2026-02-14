import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '../utils';

export default function ProjectSidebar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('id');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.filter({ status: 'Active' }, '-created_date')
  });

  return (
    <div 
      className="fixed left-0 top-0 h-screen w-64 overflow-y-auto"
      style={{ background: 'rgba(15, 23, 42, 0.98)', borderRight: '1px solid rgba(202, 220, 252, 0.1)' }}
    >
      <div className="p-6">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#CADCFC' }}>Projects</h2>
        
        <Button 
          onClick={() => navigate(createPageUrl('NewProject'))}
          className="w-full mb-4"
          style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>

        <div className="space-y-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(createPageUrl(`Home?id=${project.id}`))}
              className="w-full text-left p-3 rounded-lg transition-all"
              style={{
                background: selectedProjectId === project.id ? 'rgba(0, 168, 150, 0.2)' : 'rgba(30, 39, 97, 0.3)',
                borderLeft: selectedProjectId === project.id ? '3px solid #00A896' : '3px solid transparent',
                color: selectedProjectId === project.id ? '#CADCFC' : '#94A3B8'
              }}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{project.projectName}</div>
                  <div className="text-xs truncate">{project.clientName}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}