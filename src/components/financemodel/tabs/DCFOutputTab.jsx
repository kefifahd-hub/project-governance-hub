import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from 'recharts';

const fmt = (v, d = 1) => v != null ? `€${v.toFixed(d)}M` : '-';

export default function DCFOutputTab({ dcfResult, cashFlowData, dcfAssumptions }) {
  if (!dcfResult) return <div style={{ color: '#94A3B8' }} className="p-8 text-center">No data to display. Configure inputs first.</div>;

  const { annualRows, npvOfCashFlows, terminalValue, npvTerminalValue, totalNPV } = dcfResult;
  const chartData = annualRows.map(r => ({ year: r.year, fcf: parseFloat(r.fcf.toFixed(1)), discounted: parseFloat(r.discountedFCF.toFixed(1)) }));

  return (
    <div className="space-y-4">
      {/* NPV Result Card */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(0,168,150,0.2) 0%, rgba(30,39,97,0.8) 100%)', borderColor: 'rgba(0,168,150,0.4)', boxShadow: '0 0 30px rgba(0,168,150,0.2)' }}>
        <CardContent className="p-8 text-center">
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#94A3B8' }}>Total DCF Valuation</div>
          <div className="text-5xl font-bold mb-2" style={{ color: totalNPV >= 0 ? '#34D399' : '#EF4444', fontFamily: 'monospace' }}>
            {fmt(totalNPV, 1)}
          </div>
          <div className="text-sm" style={{ color: '#94A3B8' }}>Discount Rate: {dcfAssumptions?.discountRatePct ?? 18}% | Terminal Growth: {dcfAssumptions?.terminalGrowthRatePct ?? 1.5}%</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[
          ['NPV of Cash Flows', fmt(npvOfCashFlows), '#60A5FA'],
          ['Terminal Value', fmt(terminalValue), '#FBBF24'],
          ['NPV of Terminal Value', fmt(npvTerminalValue), '#A78BFA'],
        ].map(([label, val, color]) => (
          <Card key={label} style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold" style={{ color }}>{val}</div>
              <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <CardHeader><CardTitle style={{ color: '#CADCFC' }}>Annual Free Cash Flow & Discounted FCF (€M)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(202,220,252,0.1)" />
              <XAxis dataKey="year" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `€${v}M`} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.2)', borderRadius: '8px' }} labelStyle={{ color: '#CADCFC' }} formatter={(v, n) => [`€${v}M`, n === 'fcf' ? 'FCF' : 'Discounted FCF']} />
              <ReferenceLine y={0} stroke="rgba(202,220,252,0.3)" />
              <Bar dataKey="fcf" name="FCF" radius={[2, 2, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.fcf >= 0 ? '#028090' : '#EF4444'} />)}
              </Bar>
              <Bar dataKey="discounted" name="Discounted" fill="#A78BFA" opacity={0.7} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <CardHeader><CardTitle style={{ color: '#CADCFC' }}>Annual Detail</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ color: '#94A3B8' }}>
                <th className="text-left p-2">Year</th>
                <th className="text-right p-2">FCF (€M)</th>
                <th className="text-right p-2">Discounted FCF (€M)</th>
              </tr></thead>
              <tbody>
                {annualRows.map(r => (
                  <tr key={r.year} style={{ borderTop: '1px solid rgba(202,220,252,0.05)' }}>
                    <td className="p-2" style={{ color: '#CADCFC' }}>{r.year}</td>
                    <td className="p-2 text-right" style={{ color: r.fcf >= 0 ? '#34D399' : '#EF4444' }}>{fmt(r.fcf)}</td>
                    <td className="p-2 text-right" style={{ color: r.discountedFCF >= 0 ? '#A78BFA' : '#EF4444' }}>{fmt(r.discountedFCF)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}