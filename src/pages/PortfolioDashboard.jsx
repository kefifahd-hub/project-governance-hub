import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, AlertTriangle, TrendingUp, Layers, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '../utils';
import {
  LIFECYCLE_PHASES,
  getPhase,
  getGateForPhase,
  getLifecycleProgress,
} from '../lib/lifecycle';

// Health score → RAG band
function ragOf(score) {
  if (score == null) return { label: 'No data', color: '#64748b', bg: 'rgba(100,116,139,0.15)' };
  if (score >= 80) return { label: 'Green', color: '#10B981', bg: 'rgba(16,185,129,0.15)' };
  if (score >= 60) return { label: 'Amber', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' };
  return { label: 'Red', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' };
}

const cardStyle = { background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' };

export default function PortfolioDashboard() {
  const navigate = useNavigate();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['portfolio-projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['portfolio-risks'],
    queryFn: () => base44.entities.Risk.list(),
  });

  // Open critical risks per project
  const criticalRiskByProject = risks.reduce((acc, r) => {
    if (r.riskLevel === 'Critical' && r.status !== 'Closed') {
      acc[r.projectId] = (acc[r.projectId] || 0) + 1;
    }
    return acc;
  }, {});

  // Portfolio roll-ups
  const activeProjects = projects.filter((p) => p.status !== 'Archived' && p.status !== 'Cancelled');
  const ragCounts = activeProjects.reduce(
    (acc, p) => {
      const band = ragOf(p.healthScore).label;
      acc[band] = (acc[band] || 0) + 1;
      return acc;
    },
    {}
  );
  const totalBudget = activeProjects.reduce((sum, p) => sum + (p.totalBudgetEurM || 0), 0);
  const totalCriticalRisks = Object.values(criticalRiskByProject).reduce((a, b) => a + b, 0);

  // Count of projects sitting at each phase, for the lifecycle distribution strip
  const phaseDistribution = LIFECYCLE_PHASES.map((phase) => ({
    ...phase,
    count: activeProjects.filter((p) => getPhase(p.currentPhase)?.key === phase.key).length,
  }));

  const stats = [
    { label: 'Active Projects', value: activeProjects.length, icon: Briefcase, color: '#00A896' },
    { label: 'Portfolio Budget', value: `€${totalBudget.toFixed(1)}M`, icon: TrendingUp, color: '#CADCFC' },
    { label: 'Critical Risks (open)', value: totalCriticalRisks, icon: AlertTriangle, color: '#EF4444' },
    { label: 'Amber / Red', value: (ragCounts.Amber || 0) + (ragCounts.Red || 0), icon: Layers, color: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>Portfolio Governance</h1>
          <p className="mt-2" style={{ color: '#94A3B8' }}>
            All projects across the industrialization lifecycle — gate position, health and exposure at a glance.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} style={cardStyle}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{s.label}</div>
                    </div>
                    <Icon className="w-7 h-7" style={{ color: s.color, opacity: 0.6 }} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Lifecycle distribution strip */}
        <Card className="mb-8" style={cardStyle}>
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#94A3B8' }}>
              Lifecycle Distribution
            </h2>
            <div className="flex items-end gap-1 overflow-x-auto">
              {phaseDistribution.map((phase) => {
                const gate = getGateForPhase(phase.key);
                return (
                  <div key={phase.key} className="flex-1 min-w-[70px] text-center">
                    <div
                      className="mx-auto rounded-t"
                      style={{
                        height: `${8 + phase.count * 22}px`,
                        background: phase.count ? '#00A896' : 'rgba(0,168,150,0.15)',
                        width: '70%',
                      }}
                      title={`${phase.count} project(s) in ${phase.label}`}
                    />
                    <div className="text-xs font-bold mt-1" style={{ color: phase.count ? '#CADCFC' : '#475569' }}>
                      {phase.count || ''}
                    </div>
                    <div className="text-[10px] leading-tight mt-0.5" style={{ color: '#94A3B8' }}>{phase.label}</div>
                    <div className="text-[9px]" style={{ color: '#475569' }}>{gate?.name}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Project table */}
        <h2 className="text-2xl font-semibold mb-4" style={{ color: '#CADCFC' }}>Projects</h2>
        {isLoading ? (
          <Card style={cardStyle}><CardContent className="p-12 text-center" style={{ color: '#94A3B8' }}>Loading portfolio…</CardContent></Card>
        ) : activeProjects.length === 0 ? (
          <Card style={cardStyle}><CardContent className="p-12 text-center" style={{ color: '#94A3B8' }}>No projects yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {activeProjects.map((p) => {
              const rag = ragOf(p.healthScore);
              const gate = getGateForPhase(p.currentPhase);
              const progress = getLifecycleProgress(p.currentPhase);
              const crit = criticalRiskByProject[p.id] || 0;
              return (
                <Card
                  key={p.id}
                  className="cursor-pointer transition-all hover:-translate-y-0.5"
                  style={cardStyle}
                  onClick={() => navigate(createPageUrl(`Home?id=${p.id}`))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* RAG dot */}
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: rag.color }} title={`Health: ${rag.label}`} />

                      {/* Name + client */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate" style={{ color: '#CADCFC' }}>{p.projectName || 'Untitled'}</div>
                        <div className="text-xs truncate" style={{ color: '#94A3B8' }}>{p.clientName || '—'}</div>
                      </div>

                      {/* Phase + gate */}
                      <div className="hidden sm:block w-44 shrink-0">
                        <div className="text-sm" style={{ color: '#CADCFC' }}>{getPhase(p.currentPhase)?.label || p.currentPhase || '—'}</div>
                        <div className="text-xs" style={{ color: '#00A896' }}>{gate ? `${gate.name} · ${gate.full}` : ''}</div>
                      </div>

                      {/* Lifecycle progress */}
                      <div className="hidden md:block w-28 shrink-0">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(202,220,252,0.1)' }}>
                          <div className="h-full" style={{ width: `${progress}%`, background: '#00A896' }} />
                        </div>
                        <div className="text-[10px] mt-1" style={{ color: '#94A3B8' }}>{progress}% lifecycle</div>
                      </div>

                      {/* Budget */}
                      <div className="hidden lg:block w-20 text-right shrink-0">
                        <div className="text-sm font-semibold" style={{ color: '#CADCFC' }}>€{(p.totalBudgetEurM || 0).toFixed(1)}M</div>
                        <div className="text-[10px]" style={{ color: '#94A3B8' }}>budget</div>
                      </div>

                      {/* Critical risks */}
                      <div className="w-24 text-right shrink-0">
                        {crit > 0 ? (
                          <Badge style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                            <AlertTriangle className="w-3 h-3 mr-1" />{crit} critical
                          </Badge>
                        ) : (
                          <span className="text-xs" style={{ color: '#475569' }}>no critical</span>
                        )}
                      </div>

                      <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#475569' }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
