import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BarChart2, HardHat } from 'lucide-react';

const STATUS_STYLE = {
  Draft: { label: '📝 Draft', color: '#3b82f6' },
  'Under Review': { label: '🔍 Under Review', color: '#a855f7' },
  Published: { label: '✅ Published', color: '#10b981' },
  Submitted: { label: '📤 Submitted', color: '#a855f7' },
  Reviewed: { label: '🔍 Reviewed', color: '#f59e0b' },
  Approved: { label: '✅ Approved', color: '#10b981' },
};

export default function ReportArchive({ projectId }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: weeklyReports = [] } = useQuery({
    queryKey: ['weeklyReports', projectId],
    queryFn: () => base44.entities.WeeklyReport.filter({ projectId }),
    enabled: !!projectId,
  });

  const { data: dsrs = [] } = useQuery({
    queryKey: ['dsrs', projectId],
    queryFn: () => base44.entities.DailySiteReport.filter({ projectId }),
    enabled: !!projectId,
  });

  const combined = [
    ...weeklyReports.map(r => ({ type: 'Weekly', ref: r.reportNumber || `CW${r.calendarWeek}`, date: r.reportDate || r.reportingPeriodStart, author: r.preparedBy, status: r.status, _orig: r })),
    ...dsrs.map(r => ({ type: 'Daily', ref: r.reportRef || `DSR-${(r.reportDate||'').replace(/-/g,'')}`, date: r.reportDate, author: r.preparedBy, status: r.status, _orig: r })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = combined.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.ref?.toLowerCase().includes(search.toLowerCase()) && !r.author?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const weeklyCount = combined.filter(r => r.type === 'Weekly').length;
  const dailyCount = combined.filter(r => r.type === 'Daily').length;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#CADCFC' }}>📁 Report Archive</h2>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>{weeklyCount} Weekly · {dailyCount} Daily · {combined.length} Total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-4 h-4" style={{ color: '#64748b' }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 h-8 text-sm w-48" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 h-8 text-sm" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Weekly">📊 Weekly</SelectItem>
            <SelectItem value="Daily">🏗️ Daily</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 text-sm" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">📝 Draft</SelectItem>
            <SelectItem value="Published">✅ Published</SelectItem>
            <SelectItem value="Approved">✅ Approved</SelectItem>
            <SelectItem value="Submitted">📤 Submitted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(30,39,97,0.6)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
              {['Type', 'Reference', 'Date', 'Author', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: '#475569' }}>No reports found.</td></tr>
            ) : filtered.map((r, i) => {
              const ss = STATUS_STYLE[r.status] || { label: r.status, color: '#64748b' };
              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(202,220,252,0.05)', background: i%2===0 ? 'rgba(15,23,42,0.3)' : 'transparent' }}>
                  <td className="px-4 py-3">
                    {r.type === 'Weekly' ? <span className="flex items-center gap-1.5"><BarChart2 className="w-4 h-4" style={{ color: '#3b82f6' }} /><span style={{ color: '#94A3B8' }}>Weekly</span></span> : <span className="flex items-center gap-1.5"><HardHat className="w-4 h-4" style={{ color: '#f59e0b' }} /><span style={{ color: '#94A3B8' }}>Daily</span></span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: '#CADCFC' }}>{r.ref}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>{r.date ? format(new Date(r.date), 'dd MMM yyyy') : '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>{r.author || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${ss.color}22`, color: ss.color, border: `1px solid ${ss.color}33` }}>{ss.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}