import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function QAQCStatsChart({ qaData = [], ncData = [] }) {
  const chartData = [
    { 
      name: 'QA Records', 
      passed: qaData.filter(r => r.status === 'Passed').length,
      failed: qaData.filter(r => r.status === 'Failed').length,
      pending: qaData.filter(r => ['Scheduled', 'In Progress'].includes(r.status)).length
    },
    {
      name: 'Non-Conformities',
      open: ncData.filter(nc => nc.status === 'Open').length,
      resolved: ncData.filter(nc => nc.status === 'Resolved').length,
      closed: ncData.filter(nc => nc.status === 'Closed').length
    }
  ];

  return (
    <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
      <CardHeader>
        <CardTitle style={{ color: '#CADCFC' }}>QA/QC Summary</CardTitle>
        <CardDescription style={{ color: '#94A3B8' }}>Quality metrics overview</CardDescription>
      </CardHeader>
      <CardContent>
        {qaData.length === 0 && ncData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center" style={{ color: '#94A3B8' }}>
            <p>No QA/QC data available yet</p>
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
            <Bar dataKey="passed" stackId="a" fill="#10B981" name="Passed" />
            <Bar dataKey="failed" stackId="a" fill="#EF4444" name="Failed" />
            <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
            <Bar dataKey="open" stackId="a" fill="#F59E0B" name="Open" />
            <Bar dataKey="resolved" stackId="a" fill="#3B82F6" name="Resolved" />
            <Bar dataKey="closed" stackId="a" fill="#10B981" name="Closed" />
          </BarChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}