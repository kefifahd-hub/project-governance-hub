import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BUCKET_COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#f97316','#06b6d4','#84cc16','#ec4899'];

export default function DashboardView({ items, buckets, phases }) {
  const total = items.length;
  const open = items.filter(i => ['To Do', 'Open', 'Draft', 'Pending', 'Not Started'].includes(i.status)).length;
  const inProgress = items.filter(i => ['In Progress', 'In Review', 'Under Investigation', 'Implementing'].includes(i.status)).length;
  const blocked = items.filter(i => i.blocked || i.status === 'Blocked').length;
  const done = items.filter(i => ['Done', 'Closed', 'Resolved', 'Communicated', 'Approved'].includes(i.status)).length;
  const overdue = items.filter(i => i.dueDate && new Date(i.dueDate) < new Date() && !['Done', 'Closed', 'Resolved'].includes(i.status));

  const bucketData = buckets.map(b => ({
    name: b.bucketName.length > 12 ? b.bucketName.slice(0, 12) + '…' : b.bucketName,
    count: items.filter(i => i.bucket === b.bucketName).length
  })).filter(d => d.count > 0);

  const statusData = [
    { name: 'Open', value: open, color: '#94a3b8' },
    { name: 'In Progress', value: inProgress, color: '#3b82f6' },
    { name: 'Blocked', value: blocked, color: '#ef4444' },
    { name: 'Done', value: done, color: '#10b981' },
  ].filter(d => d.value > 0);

  const phaseData = phases.map(p => {
    const phaseItems = items.filter(i => i.phase === p.phaseName);
    const doneCount = phaseItems.filter(i => ['Done', 'Closed', 'Approved'].includes(i.status)).length;
    return {
      name: p.phaseName.split(':')[0] || p.phaseName,
      total: phaseItems.length,
      done: doneCount,
      pct: phaseItems.length > 0 ? Math.round((doneCount / phaseItems.length) * 100) : 0
    };
  }).filter(d => d.total > 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'TOTAL', value: total, color: '#CADCFC', bg: 'rgba(202,220,252,0.06)' },
          { label: 'OPEN', value: open, color: '#94a3b8', bg: 'rgba(148,163,184,0.06)' },
          { label: 'IN PROGRESS', value: inProgress, color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
          { label: 'BLOCKED', value: blocked, color: '#ef4444', bg: 'rgba(239,68,68,0.06)', alert: blocked > 0 },
          { label: 'DONE', value: done, color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4 text-center" style={{ background: k.bg, border: `1px solid ${k.color}22` }}>
            <div className="text-3xl font-bold mb-1" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs font-semibold" style={{ color: k.color }}>{k.label}</div>
            {k.alert && <div className="text-xs mt-1" style={{ color: '#ef4444' }}>⚠️</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <Card style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(202,220,252,0.1)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#CADCFC' }}>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(202,220,252,0.1)', color: '#CADCFC', fontSize: 12 }} />
                <Legend formatter={v => <span style={{ color: '#94A3B8', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Items by bucket */}
        <Card style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(202,220,252,0.1)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#CADCFC' }}>Items by Bucket</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bucketData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(202,220,252,0.1)', color: '#CADCFC', fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {bucketData.map((_, i) => <Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Phase completion */}
        {phaseData.length > 0 && (
          <Card style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(202,220,252,0.1)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#CADCFC' }}>Completion by Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {phaseData.map(p => (
                  <div key={p.name}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: '#94A3B8' }}>
                      <span className="truncate max-w-[180px]">{p.name}</span>
                      <span>{p.done}/{p.total} ({p.pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'rgba(202,220,252,0.1)' }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${p.pct}%`, background: p.pct >= 80 ? '#10b981' : p.pct >= 40 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overdue items */}
        <Card style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(202,220,252,0.1)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#CADCFC' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
              Overdue Items ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="text-sm" style={{ color: '#10b981' }}>✅ No overdue items!</p>
            ) : (
              <div className="space-y-2">
                {overdue.slice(0, 8).map(item => {
                  const daysLate = Math.ceil((new Date() - new Date(item.dueDate)) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b" style={{ borderColor: 'rgba(202,220,252,0.06)' }}>
                      <div>
                        <span className="font-mono" style={{ color: '#475569' }}>{item.itemKey} </span>
                        <span style={{ color: '#CADCFC' }}>{item.title.slice(0, 35)}{item.title.length > 35 ? '…' : ''}</span>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <div style={{ color: '#94A3B8' }}>{item.assignee}</div>
                        <div style={{ color: '#ef4444' }}>{daysLate}d late</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}