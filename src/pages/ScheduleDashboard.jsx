import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import DelayedActivitiesTab from '../components/scheduledashboard/DelayedActivitiesTab';
import ActiveActivitiesTab from '../components/scheduledashboard/ActiveActivitiesTab';
import CriticalPathTab from '../components/scheduledashboard/CriticalPathTab';
import LookaheadTab from '../components/scheduledashboard/LookaheadTab';
import SCurveTab from '../components/scheduledashboard/SCurveTab';
import MonteCarloTab from '../components/scheduledashboard/MonteCarloTab';
import ComparisonTab from '../components/scheduledashboard/ComparisonTab';
import PivotTab from '../components/scheduledashboard/PivotTab';
import TimelineMapTab from '../components/scheduledashboard/TimelineMapTab';

const TABS = [
  { id: 'delayed',     label: '⚠ Delayed' },
  { id: 'active',      label: '▶ Active' },
  { id: 'critical',    label: '⚡ Critical Path' },
  { id: 'lookahead',   label: '📅 2-Week Lookahead' },
  { id: 'scurve',      label: '📈 S-Curve' },
  { id: 'montecarlo',  label: '🎲 Monte Carlo' },
  { id: 'comparison',  label: '🔀 Delta / Comparison' },
  { id: 'pivot',       label: '📊 Pivot View' },
  { id: 'timeline',    label: '🗓 Timeline Map' },
];

export default function ScheduleDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const [activeTab, setActiveTab] = useState('delayed');

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['scheduleActivities', projectId],
    queryFn: () => base44.entities.ScheduleActivity.filter({ projectId }),
    enabled: !!projectId,
  });

  if (!projectId) return (
    <div className="flex items-center justify-center h-64">
      <p style={{ color: '#64748b' }}>Select a project to view schedule analytics.</p>
    </div>
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalCount    = activities.length;
  const delayedCount  = activities.filter(a => {
    const finish = a.plannedFinishDate ? new Date(a.plannedFinishDate) : null;
    return finish && finish < today && (a.percentComplete || 0) < 100;
  }).length;
  const criticalCount = activities.filter(a => a.isCriticalPath || (a.totalFloat != null && a.totalFloat <= 0)).length;
  const completedCount = activities.filter(a => (a.percentComplete || 0) >= 100).length;
  const onTrackCount  = Math.max(0, totalCount - delayedCount - completedCount);
  const overallPct    = totalCount > 0
    ? Math.round(activities.reduce((s, a) => s + (a.percentComplete || 0), 0) / totalCount)
    : 0;

  const stats = [
    { label: 'Total Activities', value: totalCount,       color: '#CADCFC' },
    { label: 'Delayed',          value: delayedCount,     color: '#ef4444' },
    { label: 'On Track',         value: onTrackCount,     color: '#10b981' },
    { label: 'Critical Path',    value: criticalCount,    color: '#f97316' },
    { label: 'Overall Complete', value: `${overallPct}%`, color: '#00A896' },
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e2761 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-5">
        <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>Schedule Dashboard</h1>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {stats.map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' }}>
              <div className="text-xs" style={{ color: '#64748b' }}>{s.label}</div>
              <div className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, #028090 0%, #00A896 100%)' : 'rgba(30,39,97,0.5)',
                color: activeTab === tab.id ? '#F8FAFC' : '#94A3B8',
                border: activeTab === tab.id ? '1px solid transparent' : '1px solid rgba(202,220,252,0.15)',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center pt-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#64748b' }} /></div>
        ) : (
          <>
            {activeTab === 'delayed'    && <DelayedActivitiesTab activities={activities} />}
            {activeTab === 'active'     && <ActiveActivitiesTab activities={activities} />}
            {activeTab === 'critical'   && <CriticalPathTab activities={activities} />}
            {activeTab === 'lookahead'  && <LookaheadTab activities={activities} />}
            {activeTab === 'scurve'     && <SCurveTab activities={activities} />}
            {activeTab === 'montecarlo' && <MonteCarloTab activities={activities} projectId={projectId} />}
            {activeTab === 'comparison' && <ComparisonTab activities={activities} />}
            {activeTab === 'pivot'      && <PivotTab activities={activities} />}
            {activeTab === 'timeline'   && <TimelineMapTab activities={activities} />}
          </>
        )}
      </div>
    </div>
  );
}