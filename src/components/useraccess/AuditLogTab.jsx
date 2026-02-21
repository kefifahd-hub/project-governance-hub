import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const ACTION_COLORS = {
  Login: 'text-green-400', Logout: 'text-slate-400', Create: 'text-blue-400',
  Update: 'text-yellow-400', Delete: 'text-red-400', Export: 'text-purple-400',
  View: 'text-slate-300', Invite: 'text-cyan-400', 'Role Change': 'text-orange-400',
  Deactivate: 'text-red-400',
};

export default function AuditLogTab() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditlogs'],
    queryFn: () => base44.entities.AuditLog.list('-timestamp', 200),
  });

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.user_name?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    const matchModule = moduleFilter === 'all' || l.module === moduleFilter;
    return matchSearch && matchAction && matchModule;
  });

  const modules = [...new Set(logs.map(l => l.module).filter(Boolean))];

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or details..."
          className="w-48" style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36" style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
            <SelectItem value="all" style={{ color: '#CADCFC' }}>All Actions</SelectItem>
            {['Login','Logout','View','Create','Update','Delete','Export','Invite','Role Change','Deactivate'].map(a =>
              <SelectItem key={a} value={a} style={{ color: '#CADCFC' }}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-40" style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
            <SelectItem value="all" style={{ color: '#CADCFC' }}>All Modules</SelectItem>
            {modules.map(m => <SelectItem key={m} value={m} style={{ color: '#CADCFC' }}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs self-center" style={{ color: '#64748B' }}>{filtered.length} events</span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="grid grid-cols-[140px_1fr_1fr_80px_1fr] gap-0 px-4 py-2 text-xs font-semibold uppercase tracking-wider"
          style={{ background: 'rgba(30,41,59,0.6)', color: '#475569', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
          <span>Timestamp</span><span>User</span><span>Org</span><span>Action</span><span>Details</span>
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-sm" style={{ color: '#64748B' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: '#64748B' }}>No audit events found</div>
        ) : (
          filtered.map(log => (
            <div key={log.id} className="grid grid-cols-[140px_1fr_1fr_80px_1fr] gap-0 px-4 py-2.5 text-xs hover:bg-white/5 transition-colors"
              style={{ borderBottom: '1px solid rgba(202,220,252,0.05)' }}>
              <span style={{ color: '#475569' }}>
                {log.timestamp ? format(new Date(log.timestamp), 'dd/MM HH:mm') : '—'}
              </span>
              <span style={{ color: '#94A3B8' }}>{log.user_name || '—'}</span>
              <span style={{ color: '#64748B' }}>{log.org_name || '—'}</span>
              <span className={ACTION_COLORS[log.action] || 'text-slate-400'}>{log.action}</span>
              <span className="truncate" style={{ color: '#64748B' }}>{log.record_name ? `${log.record_name}: ` : ''}{log.details || log.module}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}