import { useMemo } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CATEGORY_COLORS = ['#00A896','#028090','#F59E0B','#EF4444','#8B5CF6','#EC4899','#10B981'];

export default function ImpactDashboard({ changes, impacts }) {
  const approvedStatuses = ['Approved','Approved with Conditions','Implemented','Closed'];
  const approved = changes.filter(c => approvedStatuses.includes(c.status));

  const totalCapex = approved.reduce((s,cr) => {
    const imp = impacts.find(i => i.crId === cr.id);
    return s + (imp?.capexImpactUsd || 0);
  }, 0);

  const totalScheduleDays = approved.reduce((s,cr) => {
    const imp = impacts.find(i => i.crId === cr.id);
    return s + (imp?.scheduleImpactDays || 0);
  }, 0);

  const categoryCounts = useMemo(() => {
    const counts = {};
    changes.forEach(cr => { counts[cr.category] = (counts[cr.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [changes]);

  const fmtMoney = (v) => {
    if (Math.abs(v) >= 1000000) return `${v >= 0 ? '+' : ''}$${(v/1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000) return `${v >= 0 ? '+' : ''}$${(v/1000).toFixed(0)}K`;
    return `${v >= 0 ? '+' : ''}$${v}`;
  };

  const open = changes.filter(c => !['Approved','Approved with Conditions','Rejected','Withdrawn','Closed','Implemented'].includes(c.status)).length;
  const rejected = changes.filter(c => c.status === 'Rejected').length;
  const inReview = changes.filter(c => c.status.includes('Review')).length;

  // Cumulative cost trend (by month of raisedDate for approved CRs)
  const trendData = useMemo(() => {
    const byMonth = {};
    approved.forEach(cr => {
      if (!cr.raisedDate) return;
      const month = cr.raisedDate.slice(0, 7);
      const imp = impacts.find(i => i.crId === cr.id);
      byMonth[month] = (byMonth[month] || 0) + (imp?.capexImpactUsd || 0);
    });
    const sorted = Object.entries(byMonth).sort();
    let cumulative = 0;
    return sorted.map(([month, val]) => {
      cumulative += val;
      return { month, cumulative: Math.round(cumulative / 1000) };
    });
  }, [approved, impacts]);

  const cardStyle = { background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold" style={{ color: '#CADCFC' }}>Change Impact Dashboard</h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="text-3xl font-bold" style={{ color: '#CADCFC' }}>{changes.length}</div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>TOTAL CRs</div>
          <div className="mt-2 text-xs space-y-0.5" style={{ color: '#64748B' }}>
            <div>{approved.length} approved</div>
            <div>{inReview} in review</div>
            <div>{rejected} rejected</div>
            <div>{open} open</div>
          </div>
        </div>
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className={`text-3xl font-bold ${totalCapex > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{fmtMoney(totalCapex)}</div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>CUMULATIVE CAPEX IMPACT</div>
          <div className="text-xs mt-2" style={{ color: '#64748B' }}>From {approved.length} approved CRs</div>
        </div>
        <div className="rounded-xl p-5 col-span-2 sm:col-span-1" style={cardStyle}>
          <div className={`text-3xl font-bold ${totalScheduleDays > 0 ? 'text-orange-400' : 'text-green-400'}`}>
            {totalScheduleDays > 0 ? `+${totalScheduleDays}` : totalScheduleDays} days
          </div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>NET SCHEDULE IMPACT</div>
          <div className="text-xs mt-2" style={{ color: '#64748B' }}>Across all approved CRs</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="text-sm font-semibold mb-4" style={{ color: '#CADCFC' }}>Changes by Category</div>
          {categoryCounts.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#475569' }}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryCounts} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value}) => `${name}: ${value}`} labelLine={false}>
                  {categoryCounts.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="text-sm font-semibold mb-4" style={{ color: '#CADCFC' }}>Cumulative CAPEX Impact ($K)</div>
          {trendData.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#475569' }}>No approved CRs with CAPEX impact</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(202,220,252,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }} formatter={v => [`$${v}K`, 'Cumulative']} />
                <Line type="monotone" dataKey="cumulative" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Finance model impact table */}
      <div className="rounded-xl p-5" style={cardStyle}>
        <div className="text-sm font-semibold mb-4" style={{ color: '#CADCFC' }}>Finance Model Impact (Approved CRs)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: '#64748B', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
                <th className="text-left pb-2">Metric</th>
                <th className="text-right pb-2">Impact</th>
              </tr>
            </thead>
            <tbody className="space-y-1">
              {[
                { label: 'Total CAPEX Change', val: fmtMoney(totalCapex), color: totalCapex > 0 ? '#F59E0B' : '#10B981' },
                { label: 'Net Schedule Change', val: `${totalScheduleDays >= 0 ? '+' : ''}${totalScheduleDays} days`, color: totalScheduleDays > 0 ? '#F59E0B' : '#10B981' },
              ].map(row => (
                <tr key={row.label} style={{ borderBottom: '1px solid rgba(202,220,252,0.05)' }}>
                  <td className="py-2" style={{ color: '#94A3B8' }}>{row.label}</td>
                  <td className="py-2 text-right font-semibold" style={{ color: row.color }}>{row.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}