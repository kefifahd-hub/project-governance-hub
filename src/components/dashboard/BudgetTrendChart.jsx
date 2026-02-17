import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Accepts either BudgetTracking data OR CapexPlan data
export default function BudgetTrendChart({ data = [], capexData = [] }) {
  // If capexData is provided, aggregate by quarter and show CAPEX spend trend
  const chartData = capexData.length > 0
    ? Object.entries(
        capexData.reduce((acc, item) => {
          acc[item.quarter] = (acc[item.quarter] || 0) + (item.amountMEur || 0);
          return acc;
        }, {})
      )
      .sort((a, b) => {
        const [aq, ay] = a[0].split(' ');
        const [bq, by] = b[0].split(' ');
        return ay !== by ? ay - by : aq.localeCompare(bq);
      })
      .slice(0, 8)
      .map(([quarter, total]) => ({ quarter, planned: +(total * 1000).toFixed(0) }))
    : data
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6)
      .map(item => ({
        quarter: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        planned: item.plannedEurK,
        actual: item.actualEurK
      }));

  return (
    <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
      <CardHeader>
        <CardTitle style={{ color: '#CADCFC' }}>Budget Trend</CardTitle>
        <CardDescription style={{ color: '#94A3B8' }}>Planned vs Actual (Last 6 months)</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center" style={{ color: '#94A3B8' }}>
            <p>No budget data available yet</p>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(202, 220, 252, 0.1)" />
            <XAxis dataKey="quarter" stroke="#94A3B8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#94A3B8" tickFormatter={v => `€${(v/1000).toFixed(1)}M`} />
            <Tooltip 
              contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
              formatter={(value) => [`€${(value/1000).toFixed(2)}M`, capexData.length > 0 ? 'CAPEX Spend' : 'Amount']}
            />
            <Legend />
            <Line type="monotone" dataKey="planned" stroke="#00A896" strokeWidth={2} name={capexData.length > 0 ? 'CAPEX (€K)' : 'Planned (€K)'} dot={false} />
            {capexData.length === 0 && <Line type="monotone" dataKey="actual" stroke="#028090" strokeWidth={2} name="Actual (€K)" dot={false} />}
          </LineChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}