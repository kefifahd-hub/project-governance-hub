import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QUARTERS } from '../calcEngine';

const fmt = (v, decimals = 1) => v != null ? `€${v.toFixed(decimals)}M` : '-';
const pct = (v) => v != null ? `${v.toFixed(1)}%` : '-';

function PLRow({ label, values, highlight, isPercent, color }) {
  return (
    <tr style={{ borderTop: '1px solid rgba(202,220,252,0.05)', background: highlight ? 'rgba(0,168,150,0.08)' : undefined }}>
      <td className="p-2 font-medium sticky left-0 z-10" style={{ color: color || (highlight ? '#00A896' : '#CADCFC'), background: 'rgba(15,23,42,0.95)', minWidth: '200px' }}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className="p-2 text-right text-xs" style={{ color: v < 0 ? '#EF4444' : (isPercent ? '#60A5FA' : '#CADCFC'), minWidth: '80px' }}>
          {isPercent ? pct(v) : fmt(v)}
        </td>
      ))}
    </tr>
  );
}

export default function PLOutputTab({ plData }) {
  // Show every 4th quarter (annual) for readability, with option to show all
  const displayQuarters = useMemo(() => QUARTERS.filter((q, i) => q.startsWith('Q4')), []);
  const displayIndices = useMemo(() => QUARTERS.reduce((acc, q, i) => { if (q.startsWith('Q4')) acc.push(i); return acc; }, []), []);

  if (!plData || plData.length === 0) return <div style={{ color: '#94A3B8' }} className="p-8 text-center">No data to display. Please configure inputs first.</div>;

  const annualPL = displayIndices.map(i => plData[i]);

  // KPIs
  const totalRevenue = plData.reduce((s, r) => s + (r.rev ?? 0), 0);
  const totalEBITDA = plData.reduce((s, r) => s + (r.ebitda ?? 0), 0);
  const totalNetProfit = plData.reduce((s, r) => s + (r.netProfit ?? 0), 0);
  const peakYear = annualPL.reduce((max, r) => r.rev > (max?.rev ?? 0) ? r : max, null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          ['Total Revenue', fmt(totalRevenue, 0), totalRevenue > 0 ? '#34D399' : '#94A3B8'],
          ['Total EBITDA', fmt(totalEBITDA, 0), totalEBITDA > 0 ? '#60A5FA' : '#EF4444'],
          ['Total Net Profit', fmt(totalNetProfit, 0), totalNetProfit > 0 ? '#A78BFA' : '#EF4444'],
          ['Peak Annual Rev', fmt(peakYear?.rev, 0), '#FBBF24'],
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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle style={{ color: '#CADCFC' }}>P&L Statement (Annual, €M)</CardTitle>
            <Badge className="bg-blue-900 text-blue-200">Q4 2025 → Q4 2040</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 sticky left-0 z-10" style={{ color: '#94A3B8', background: 'rgba(15,23,42,0.95)', minWidth: '200px' }}>Line Item</th>
                  {displayQuarters.map(q => (
                    <th key={q} className="text-right p-2 text-xs" style={{ color: '#94A3B8', minWidth: '80px' }}>{q.replace('Q4 ', '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <PLRow label="Revenue" values={annualPL.map(r => r.rev)} highlight color="#34D399" />
                <PLRow label="  BOM & Materials" values={annualPL.map(r => -(r.bom ?? 0))} />
                <PLRow label="  Labour" values={annualPL.map(r => -(r.labour ?? 0))} />
                <PLRow label="  Utilities" values={annualPL.map(r => -(r.utilities ?? 0))} />
                <PLRow label="  Op. Overheads" values={annualPL.map(r => -(r.opOverhead ?? 0))} />
                <PLRow label="  Depreciation" values={annualPL.map(r => -(r.depreciation ?? 0))} />
                <PLRow label="  Outbound Logistics" values={annualPL.map(r => -(r.outbound ?? 0))} />
                <PLRow label="COGS" values={annualPL.map(r => -(r.cogs ?? 0))} highlight />
                <PLRow label="Gross Profit" values={annualPL.map(r => r.grossProfit)} highlight color="#60A5FA" />
                <PLRow label="GP %" values={annualPL.map(r => r.grossProfitPct)} isPercent color="#60A5FA" />
                <PLRow label="  Royalty" values={annualPL.map(r => -(r.royalty ?? 0))} />
                <PLRow label="  Warranty" values={annualPL.map(r => -(r.warranty ?? 0))} />
                <PLRow label="  G&A Overhead" values={annualPL.map(r => r.sga != null ? -(r.sga) : null)} />
                <PLRow label="+ Grant Income" values={annualPL.map(r => r.grantIncome ?? 0)} color="#34D399" />
                <PLRow label="EBIT" values={annualPL.map(r => r.ebit)} highlight color="#A78BFA" />
                <PLRow label="EBITDA" values={annualPL.map(r => r.ebitda)} highlight color="#A78BFA" />
                <PLRow label="EBITDA %" values={annualPL.map(r => r.ebitdaPct)} isPercent color="#A78BFA" />
                <PLRow label="Finance Costs" values={annualPL.map(r => -(r.financeCost ?? 0))} />
                <PLRow label="Profit Before Tax" values={annualPL.map(r => r.pbt)} highlight />
                <PLRow label="Income Tax" values={annualPL.map(r => -(r.tax ?? 0))} />
                <PLRow label="Net Profit" values={annualPL.map(r => r.netProfit)} highlight color="#34D399" />
                <PLRow label="Net Profit %" values={annualPL.map(r => r.netProfitPct)} isPercent color="#34D399" />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}