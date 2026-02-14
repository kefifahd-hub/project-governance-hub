import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ScheduleProgressChart({ data = [] }) {
  const statusCounts = data.reduce((acc, activity) => {
    acc[activity.status] = (acc[activity.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = [
    { name: 'Not Started', count: statusCounts['Not Started'] || 0, fill: '#6B7280' },
    { name: 'In Progress', count: statusCounts['In Progress'] || 0, fill: '#3B82F6' },
    { name: 'Completed', count: statusCounts['Completed'] || 0, fill: '#10B981' },
    { name: 'On Hold', count: statusCounts['On Hold'] || 0, fill: '#F59E0B' }
  ];

  return (
    <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
      <CardHeader>
        <CardTitle style={{ color: '#CADCFC' }}>Schedule Status</CardTitle>
        <CardDescription style={{ color: '#94A3B8' }}>Activity breakdown by status</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center" style={{ color: '#94A3B8' }}>
            <p>No schedule data available yet</p>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(202, 220, 252, 0.1)" />
            <XAxis dataKey="name" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip 
              contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
            />
            <Bar dataKey="count" fill="#00A896" />
          </BarChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}