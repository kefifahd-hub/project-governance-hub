const SECTIONS = [
  { num: 1, label: 'Project Overview', critical: true },
  { num: 2, label: 'Market Assessment', critical: false },
  { num: 3, label: 'Site & Location', critical: true, source: '🔗 Site Selection' },
  { num: 4, label: 'Product & Capacity', critical: true, source: '🔗 Finance Model' },
  { num: 5, label: 'Technical Assessment', critical: false },
  { num: 6, label: 'Financial Assessment', critical: true, source: '🔗 Finance Model' },
  { num: 7, label: 'Headcount & Labour', critical: false },
  { num: 8, label: 'Execution Plan', critical: false },
  { num: 9, label: 'Risk Assessment', critical: true },
  { num: 10, label: 'Compliance', critical: false },
  { num: 11, label: 'Go/No-Go Decision', critical: true },
];

const STATUS_COLORS = { complete: '#10B981', partial: '#F59E0B', empty: '#475569' };

export default function FeasibilityProgressDashboard({ study, activeTab, onTabChange }) {
  const getStatus = (num) => {
    if (!study) return 'empty';
    const tabKey = `tab${num}Data`;
    if (num <= 6 && study.capexEurM && num === 6) return 'complete';
    if (study[tabKey]) {
      try {
        const d = JSON.parse(study[tabKey]);
        const vals = Object.values(d).filter(v => v !== '' && v != null);
        if (vals.length > 3) return 'complete';
        if (vals.length > 0) return 'partial';
      } catch { return 'partial'; }
    }
    return 'empty';
  };

  const completedCount = SECTIONS.filter(s => getStatus(s.num) === 'complete').length;
  const feasibilityScore = study?.feasibilityScore || 0;

  const scoreColor = feasibilityScore >= 70 ? '#10B981' : feasibilityScore >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div className="p-4 rounded-lg mb-4" style={{ background: 'rgba(30, 39, 97, 0.4)', border: '1px solid rgba(202, 220, 252, 0.1)' }}>
      <div className="flex flex-wrap gap-6 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: '#CADCFC' }}>{completedCount}/{SECTIONS.length}</div>
          <div className="text-xs" style={{ color: '#94A3B8' }}>Sections Complete</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: scoreColor }}>{feasibilityScore}/100</div>
          <div className="text-xs" style={{ color: '#94A3B8' }}>Feasibility Score</div>
        </div>
        {study?.linkedFinanceModelId && (
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: 'rgba(0,168,150,0.1)', color: '#00A896', border: '1px solid rgba(0,168,150,0.3)' }}>
            🔗 Finance Model Linked
          </div>
        )}
        {study?.linkedSiteId && (
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: 'rgba(0,168,150,0.1)', color: '#00A896', border: '1px solid rgba(0,168,150,0.3)' }}>
            🔗 Site Selection Linked
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 gap-1">
        {SECTIONS.map(s => {
          const status = getStatus(s.num);
          const color = STATUS_COLORS[status];
          const isActive = activeTab === `tab${s.num}`;
          return (
            <button
              key={s.num}
              onClick={() => onTabChange(`tab${s.num}`)}
              className="rounded p-1 text-center transition-all"
              style={{
                background: isActive ? 'rgba(0,168,150,0.2)' : 'rgba(15,23,42,0.4)',
                border: `1px solid ${isActive ? '#00A896' : 'rgba(202,220,252,0.1)'}`,
              }}
            >
              <div className="w-3 h-3 rounded-full mx-auto mb-0.5" style={{ background: color }} />
              <div className="text-xs" style={{ color: isActive ? '#00A896' : '#94A3B8', fontSize: 9 }}>{s.num}</div>
              {s.critical && <div style={{ color: '#F59E0B', fontSize: 8 }}>★</div>}
            </button>
          );
        })}
      </div>
      <div className="text-xs mt-1" style={{ color: '#475569' }}>★ = Critical section</div>
    </div>
  );
}