import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BudgetTrendChart({ data }) {
  const chartData = data
    .sort((a, b) => new Date(a.month) - new Date(b.month))
    .slice(-6)
    .map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
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
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(202, 220, 252, 0.1)" />
            <XAxis dataKey="month" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip 
              contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
            />
            <Legend />
            <Line type="monotone" dataKey="planned" stroke="#00A896" strokeWidth={2} name="Planned (€K)" />
            <Line type="monotone" dataKey="actual" stroke="#028090" strokeWidth={2} name="Actual (€K)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}