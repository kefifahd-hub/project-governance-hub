import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, BarChart2, User, TrendingUp, Search, Plus, SlidersHorizontal } from 'lucide-react';

const VIEWS = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'list', label: 'List', icon: List },
  { id: 'mytasks', label: 'My Tasks', icon: User },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
];

export default function ActionTrackerHeader({
  currentView, onViewChange,
  search, onSearch,
  filters, onFilters,
  buckets, phases,
  onNewItem
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(202,220,252,0.1)' }} className="px-4 sm:px-6 py-4">
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* View switcher */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'rgba(30,39,97,0.6)', border: '1px solid rgba(202,220,252,0.1)' }}>
          {VIEWS.map(v => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => onViewChange(v.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: currentView === v.id ? 'rgba(0,168,150,0.2)' : 'transparent',
                  color: currentView === v.id ? '#00A896' : '#94A3B8',
                  border: currentView === v.id ? '1px solid rgba(0,168,150,0.3)' : '1px solid transparent'
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#475569' }} />
          <Input
            placeholder="Search by title, key..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
            style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(f => !f)}
          style={{ color: showFilters ? '#00A896' : '#94A3B8' }}
        >
          <SlidersHorizontal className="w-4 h-4 mr-1" />
          Filters
        </Button>

        <Button
          size="sm"
          onClick={onNewItem}
          style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Item
        </Button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>
          {[
            { key: 'type', label: 'Type', options: ['All Types', 'Action', 'Issue', 'Decision', 'RFI', 'Punch List', 'Risk Action', 'Deliverable'] },
            { key: 'priority', label: 'Priority', options: ['All Priorities', 'P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'] },
            { key: 'status', label: 'Status', options: ['All Statuses', 'To Do', 'In Progress', 'In Review', 'Done', 'Blocked', 'Open', 'Closed'] },
          ].map(f => (
            <Select key={f.key} value={filters[f.key] || ''} onValueChange={v => onFilters({ ...filters, [f.key]: v === f.options[0] ? '' : v })}>
              <SelectTrigger className="h-8 text-xs w-36" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ))}

          <Select value={filters.bucket || ''} onValueChange={v => onFilters({ ...filters, bucket: v === 'All Buckets' ? '' : v })}>
            <SelectTrigger className="h-8 text-xs w-40" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
              <SelectValue placeholder="All Buckets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Buckets">All Buckets</SelectItem>
              {buckets.map(b => <SelectItem key={b.id} value={b.bucketName}>{b.bucketName}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.phase || ''} onValueChange={v => onFilters({ ...filters, phase: v === 'All Phases' ? '' : v })}>
            <SelectTrigger className="h-8 text-xs w-44" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
              <SelectValue placeholder="All Phases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Phases">All Phases</SelectItem>
              {phases.map(p => <SelectItem key={p.id} value={p.phaseName}>{p.phaseName}</SelectItem>)}
            </SelectContent>
          </Select>

          {Object.values(filters).some(v => v) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" style={{ color: '#94A3B8' }} onClick={() => onFilters({})}>
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}