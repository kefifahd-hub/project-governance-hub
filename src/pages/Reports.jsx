import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import WeeklyReportView from '../components/reports/WeeklyReportView';
import DailySiteReportView from '../components/reports/DailySiteReportView';
import ReportArchive from '../components/reports/ReportArchive';
import { BarChart2, HardHat, Archive } from 'lucide-react';

const TABS = [
  { id: 'weekly', label: 'Weekly Report', icon: BarChart2 },
  { id: 'daily', label: 'Daily Site Report', icon: HardHat },
  { id: 'archive', label: 'Report Archive', icon: Archive },
];

export default function Reports() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('weekly');

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <p style={{ color: '#94A3B8' }}>Select a project to view reports.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <h1 className="text-2xl font-bold" style={{ color: '#CADCFC' }}>Reports</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Weekly project reports, daily site reports, and archive</p>
          {/* Sub-tabs */}
          <div className="flex gap-1 mt-4">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: active ? 'rgba(0,168,150,0.15)' : 'transparent',
                    color: active ? '#00A896' : '#94A3B8',
                    border: active ? '1px solid rgba(0,168,150,0.3)' : '1px solid transparent'
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'weekly' && <WeeklyReportView projectId={projectId} />}
        {activeTab === 'daily' && <DailySiteReportView projectId={projectId} />}
        {activeTab === 'archive' && <ReportArchive projectId={projectId} />}
      </div>
    </div>
  );
}