import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '../utils';

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  const calculateHealthScore = (project) => {
    const milestone = project.healthMilestone || 0;
    const budget = project.healthBudget || 0;
    const schedule = project.healthSchedule || 0;
    const risk = project.healthRisk || 0;
    
    return (milestone * 0.40) + (budget * 0.30) + (schedule * 0.20) + (risk * 0.10);
  };

  const getHealthStatus = (score) => {
    if (score >= 80) return { label: 'Healthy', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Caution', color: 'bg-yellow-500' };
    return { label: 'Critical', color: 'bg-red-500' };
  };

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }} className="shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>PMO Governance Platform</h1>
              <p className="mt-2" style={{ color: '#94A3B8' }}>Integrated project management and governance tools</p>
            </div>
            <Button 
              className="hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
              onClick={() => navigate(createPageUrl('NewProject'))}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border"
              style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
            />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p style={{ color: '#94A3B8' }}>Loading projects...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const healthScore = calculateHealthScore(project);
              const healthStatus = getHealthStatus(healthScore);

              return (
                <Card
                  key={project.id}
                  className="cursor-pointer transition-all hover:transform hover:-translate-y-1"
                  style={{ 
                    background: 'rgba(30, 39, 97, 0.5)', 
                    borderColor: 'rgba(202, 220, 252, 0.1)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  onClick={() => navigate(createPageUrl(`ProjectDashboard?id=${project.id}`))}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 20px rgba(2, 128, 144, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg" style={{ color: '#CADCFC' }}>{project.name}</CardTitle>
                        <CardDescription className="mt-1" style={{ color: '#94A3B8' }}>{project.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2" style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Health Score */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${healthStatus.color}`} />
                          <span className="text-sm font-medium" style={{ color: '#CADCFC' }}>Project Health</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#F8FAFC' }}>
                          {healthScore.toFixed(1)}%
                        </span>
                      </div>

                      {/* Owner */}
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: '#94A3B8' }}>Owner</span>
                        <span className="font-medium" style={{ color: '#F8FAFC' }}>{project.owner}</span>
                      </div>

                      {/* Timeline */}
                      {project.startDate && project.endDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: '#94A3B8' }}>Timeline</span>
                          <span className="font-medium" style={{ color: '#F8FAFC' }}>
                            {new Date(project.startDate).getFullYear()} - {new Date(project.endDate).getFullYear()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: '#94A3B8' }}>No projects found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}