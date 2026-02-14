import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RiskDistributionChart({ data }) {
  const riskCounts = data.reduce((acc, risk) => {
    if (risk.status !== 'Closed') {
      acc[risk.riskLevel] = (acc[risk.riskLevel] || 0) + 1;
    }
    return acc;
  }, {});

  const chartData = [
    { name: 'Critical', value: riskCounts.Critical || 0, color: '#EF4444' },
    { name: 'High', value: riskCounts.High || 0, color: '#F97316' },
    { name: 'Medium', value: riskCounts.Medium || 0, color: '#F59E0B' },
    { name: 'Low', value: riskCounts.Low || 0, color: '#10B981' }
  ].filter(item => item.value > 0);

  return (
    <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
      <CardHeader>
        <CardTitle style={{ color: '#CADCFC' }}>Active Risks Distribution</CardTitle>
        <CardDescription style={{ color: '#94A3B8' }}>By severity level</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}