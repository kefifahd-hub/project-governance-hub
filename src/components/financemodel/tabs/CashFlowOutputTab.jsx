import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import HelpTooltip from '../HelpTooltip';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { QUARTERS } from '../calcEngine';

const fmt = (v, d = 1) => v != null ? `€${v.toFixed(d)}M` : '-';

export default function CashFlowOutputTab({ cashFlowData }) {
  if (!cashFlowData || cashFlowData.length === 0) return <div style={{ color: '#94A3B8' }} className="p-8 text-center">No data. Configure inputs first.</div>;

  const annualIndices = QUARTERS.reduce((acc, q, i) => { if (q.startsWith('Q4')) acc.push(i); return acc; }, []);
  const annualData = annualIndices.map(i => cashFlowData[i]);

  const chartData = annualData.map(r => ({
    year: r.quarter.replace('Q4 ', ''),
    cfo: parseFloat(r.cfo.toFixed(1)),
    cfi: parseFloat(r.cfi.toFixed(1)),
    cff: parseFloat(r.cff.toFixed(1)),
    cash: parseFloat(r.cashBalance.toFixed(1))
  }));

  const minCash = Math.min(...cashFlowData.map(r => r.cashBalance));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          ['Min Cash Balance', fmt(minCash), minCash >= 0 ? '#34D399' : '#EF4444'],
          ['End Cash Balance', fmt(cashFlowData[cashFlowData.length - 1]?.cashBalance), '#60A5FA'],
          ['Total FCF', fmt(cashFlowData.reduce((s, r) => s + r.freeCashFlow, 0)), '#A78BFA'],
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
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle style={{ color: '#CADCFC' }}>Cash Balance Over Time (€M)</CardTitle>
            <HelpTooltip title="Cash Flow Statement">
              Three-section cash flow showing how cash moves each quarter.<br /><br />
              <strong>CFO (Operations)</strong> = Net Profit + Depreciation + Finance Costs + WC Changes − Grant Amortization.<br />
              <strong>CFI (Investing)</strong> = −CAPEX + Grant Cash Receipts.<br />
              <strong>CFF (Financing)</strong> = Equity Injections + LT Debt Drawdown − LT Repayment − Interest.<br />
              <strong>FCF</strong> = CFO + CFI (before financing — key valuation metric).<br />
              <strong>Cash Balance</strong> = cumulative sum of all three activities.<br /><br />
              Watch for negative cash — may require additional financing or equity.
            </HelpTooltip>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#028090" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#028090" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(202,220,252,0.1)" />
              <XAxis dataKey="year" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `€${v}M`} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.2)', borderRadius: '8px' }} labelStyle={{ color: '#CADCFC' }} formatter={v => [`€${v}M`]} />
              <Area type="monotone" dataKey="cash" stroke="#028090" fill="url(#cashGrad)" strokeWidth={2} name="Cash Balance" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <CardHeader><CardTitle style={{ color: '#CADCFC' }}>Cash Flow Statement (Annual, €M)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ color: '#94A3B8' }}>
                <th className="text-left p-2 sticky left-0" style={{ background: 'rgba(15,23,42,0.95)', minWidth: '160px' }}>Item</th>
                {annualData.map(r => <th key={r.quarter} className="text-right p-2 text-xs" style={{ minWidth: '80px' }}>{r.quarter.replace('Q4 ', '')}</th>)}
              </tr></thead>
              <tbody>
                {[
                  ['Cash from Operations', 'cfo', '#34D399'],
                  ['Cash from Investing', 'cfi', '#60A5FA'],
                  ['Cash from Financing', 'cff', '#A78BFA'],
                  ['Free Cash Flow', 'freeCashFlow', '#FBBF24'],
                  ['Cash Balance', 'cashBalance', '#00A896'],
                ].map(([label, key, color]) => (
                  <tr key={label} style={{ borderTop: '1px solid rgba(202,220,252,0.05)', background: key === 'cashBalance' ? 'rgba(0,168,150,0.08)' : undefined }}>
                    <td className="p-2 font-medium sticky left-0" style={{ color, background: 'rgba(15,23,42,0.95)', minWidth: '160px' }}>{label}</td>
                    {annualData.map(r => (
                      <td key={r.quarter} className="p-2 text-right text-xs" style={{ color: (r[key] ?? 0) < 0 ? '#EF4444' : color }}>{fmt(r[key])}</td>
                    ))}
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