import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const STATUS_COLORS = {
  'Draft': 'bg-gray-700 text-gray-300',
  'Submitted': 'bg-blue-900 text-blue-300',
  'In Technical Review': 'bg-purple-900 text-purple-300',
  'Technical Review Complete': 'bg-purple-800 text-purple-200',
  'In Finance Review': 'bg-orange-900 text-orange-300',
  'Finance Review Complete': 'bg-orange-800 text-orange-200',
  'In Schedule Review': 'bg-teal-900 text-teal-300',
  'Schedule Review Complete': 'bg-teal-800 text-teal-200',
  'Pending Approval': 'bg-yellow-900 text-yellow-300',
  'Approved': 'bg-green-900 text-green-300',
  'Approved with Conditions': 'bg-emerald-900 text-emerald-300',
  'Rejected': 'bg-red-900 text-red-300',
  'On Hold': 'bg-gray-800 text-gray-400',
  'Withdrawn': 'bg-gray-900 text-gray-500',
  'Implementation In Progress': 'bg-blue-800 text-blue-200',
  'Implemented': 'bg-green-800 text-green-200',
  'Closed': 'bg-green-950 text-green-400',
};

const PRIORITY_DOTS = {
  'Critical': '🔴',
  'High': '🟠',
  'Medium': '🟡',
  'Low': '🟢',
};

export default function ChangeLogTable({ changes, impacts, onNew, onSelect }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const getImpact = (cr) => {
    const impact = impacts.find(i => i.crId === cr.id);
    if (!impact) return null;
    return (Math.abs(impact.capexImpactUsd || 0) + Math.abs(impact.opexImpactAnnualUsd || 0) + Math.abs(impact.accelerationCostUsd || 0));
  };

  const filtered = changes.filter(cr => {
    if (statusFilter !== 'all' && cr.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && cr.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && cr.priority !== priorityFilter) return false;
    return true;
  });

  const totalImpact = changes
    .filter(cr => cr.status === 'Approved' || cr.status === 'Approved with Conditions' || cr.status === 'Implemented' || cr.status === 'Closed')
    .reduce((sum, cr) => sum + (getImpact(cr) || 0), 0);

  const open = changes.filter(c => !['Approved','Approved with Conditions','Rejected','Withdrawn','Closed','Implemented'].includes(c.status)).length;
  const approved = changes.filter(c => ['Approved','Approved with Conditions','Implemented','Closed'].includes(c.status)).length;
  const rejected = changes.filter(c => c.status === 'Rejected').length;
  const pending = changes.filter(c => c.status === 'Pending Approval').length;

  const fmtMoney = (v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`;

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total CRs', value: changes.length },
          { label: 'Open', value: open, color: 'text-blue-400' },
          { label: 'Approved', value: approved, color: 'text-green-400' },
          { label: 'Rejected', value: rejected, color: 'text-red-400' },
          { label: 'Total Impact', value: totalImpact > 0 ? fmtMoney(totalImpact) : '—', color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="rounded-lg px-4 py-3 text-center" style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' }}>
            <div className={`text-xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + New button */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {['Scope','Design / Technical','Cost / Budget','Schedule','Procurement','Quality','Regulatory / Compliance','Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {['Critical','High','Medium','Low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button onClick={onNew} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
            <Plus className="w-4 h-4 mr-2" /> New Change Request
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(30,39,97,0.7)', color: '#94A3B8' }}>
              <th className="px-3 py-3 text-left font-medium">CR #</th>
              <th className="px-3 py-3 text-left font-medium">Title</th>
              <th className="px-3 py-3 text-left font-medium hidden sm:table-cell">Category</th>
              <th className="px-3 py-3 text-center font-medium">Priority</th>
              <th className="px-3 py-3 text-left font-medium">Status</th>
              <th className="px-3 py-3 text-right font-medium hidden md:table-cell">Impact</th>
              <th className="px-3 py-3 text-left font-medium hidden lg:table-cell">Required By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10" style={{ color: '#64748B' }}>No change requests found</td></tr>
            )}
            {filtered.map((cr, i) => {
              const imp = getImpact(cr);
              return (
                <tr
                  key={cr.id}
                  onClick={() => onSelect(cr)}
                  className="cursor-pointer transition-colors hover:bg-white/5"
                  style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.6)' : 'rgba(30,39,97,0.3)', borderBottom: '1px solid rgba(202,220,252,0.06)' }}
                >
                  <td className="px-3 py-3 font-mono font-bold" style={{ color: '#00A896' }}>{cr.crNumber || '—'}</td>
                  <td className="px-3 py-3 max-w-xs truncate" style={{ color: '#CADCFC' }}>{cr.title}</td>
                  <td className="px-3 py-3 hidden sm:table-cell" style={{ color: '#94A3B8' }}>{cr.category}</td>
                  <td className="px-3 py-3 text-center">{PRIORITY_DOTS[cr.priority] || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[cr.status] || 'bg-gray-700 text-gray-300'}`}>{cr.status}</span>
                  </td>
                  <td className="px-3 py-3 text-right hidden md:table-cell" style={{ color: imp ? '#F59E0B' : '#475569' }}>
                    {imp ? fmtMoney(imp) : 'TBD'}
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell" style={{ color: '#64748B' }}>{cr.requiredByDate || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pending > 0 && (
        <div className="mt-3 text-xs px-3 py-2 rounded" style={{ background: 'rgba(234,179,8,0.1)', color: '#F59E0B', border: '1px solid rgba(234,179,8,0.2)' }}>
          ⏳ {pending} change request{pending > 1 ? 's' : ''} pending approval
        </div>
      )}
    </div>
  );
}