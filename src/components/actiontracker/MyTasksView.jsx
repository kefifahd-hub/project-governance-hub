import { useState } from 'react';
import { Wrench, AlertTriangle, HelpCircle, FileText, Search, Package, Shield, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const TYPE_ICONS = {
  'Action': { icon: Wrench, color: '#6366f1' },
  'Issue': { icon: AlertTriangle, color: '#ef4444' },
  'Decision': { icon: HelpCircle, color: '#f59e0b' },
  'RFI': { icon: FileText, color: '#3b82f6' },
  'Punch List': { icon: Search, color: '#8b5cf6' },
  'Deliverable': { icon: Package, color: '#10b981' },
  'Risk Action': { icon: Shield, color: '#f97316' },
};

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function groupByTime(items) {
  const overdue = [], today = [], thisWeek = [], later = [], done = [];
  const endOfToday = new Date(TODAY); endOfToday.setHours(23, 59, 59);
  const endOfWeek = new Date(TODAY); endOfWeek.setDate(endOfWeek.getDate() + 7);

  items.forEach(item => {
    if (['Done', 'Closed'].includes(item.status)) { done.push(item); return; }
    if (!item.dueDate) { later.push(item); return; }
    const due = new Date(item.dueDate);
    if (due < TODAY) overdue.push(item);
    else if (due <= endOfToday) today.push(item);
    else if (due <= endOfWeek) thisWeek.push(item);
    else later.push(item);
  });
  return { overdue, today, thisWeek, later, done };
}

function TaskGroup({ label, items, color, icon, onClick, onComplete }) {
  const [collapsed, setCollapsed] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        className="flex items-center gap-2 mb-2 w-full text-left"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-sm font-semibold" style={{ color }}>{icon} {label}</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>
          {items.length}
        </span>
      </button>
      {!collapsed && (
        <div className="space-y-1.5">
          {items.map(item => {
            const typeInfo = TYPE_ICONS[item.itemType] || TYPE_ICONS['Action'];
            const Icon = typeInfo.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer hover:opacity-90"
                style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.08)' }}
              >
                <button
                  onClick={e => { e.stopPropagation(); onComplete(item); }}
                  className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors"
                  style={{ borderColor: 'rgba(202,220,252,0.3)' }}
                >
                  {['Done', 'Closed'].includes(item.status) && <CheckCircle2 className="w-4 h-4" style={{ color: '#10b981' }} />}
                </button>
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: typeInfo.color }} />
                <div className="flex-1 min-w-0" onClick={() => onClick(item)}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono" style={{ color: '#475569' }}>{item.itemKey}</span>
                    <span className="text-sm truncate" style={{ color: ['Done', 'Closed'].includes(item.status) ? '#475569' : '#CADCFC' }}>{item.title}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: '#64748b' }}>
                    <span>{item.bucket}</span>
                    {item.dueDate && <span style={{ color: new Date(item.dueDate) < TODAY ? '#ef4444' : '#64748b' }}>
                      📅 {new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MyTasksView({ items, currentUser, onItemClick, projectId }) {
  const queryClient = useQueryClient();
  const myItems = items.filter(i => i.assignee?.toLowerCase() === currentUser?.toLowerCase());
  const { overdue, today, thisWeek, later, done } = groupByTime(myItems);

  const completeMutation = useMutation({
    mutationFn: (item) => base44.entities.ActionItem.update(item.id, { status: 'Done', completedDate: new Date().toISOString().split('T')[0] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actionItems', projectId] })
  });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="text-sm font-semibold mb-1" style={{ color: '#CADCFC' }}>My Tasks — {currentUser || 'All'}</div>
        <div className="flex gap-4 text-xs" style={{ color: '#94A3B8' }}>
          <span><span style={{ color: '#ef4444' }}>{overdue.length}</span> overdue</span>
          <span><span style={{ color: '#f59e0b' }}>{today.length}</span> today</span>
          <span><span style={{ color: '#3b82f6' }}>{thisWeek.length}</span> this week</span>
          <span>{later.length} later</span>
        </div>
      </div>

      <TaskGroup label="OVERDUE" items={overdue} color="#ef4444" icon="🔴" onClick={onItemClick} onComplete={completeMutation.mutate} />
      <TaskGroup label="TODAY" items={today} color="#f59e0b" icon="📅" onClick={onItemClick} onComplete={completeMutation.mutate} />
      <TaskGroup label="THIS WEEK" items={thisWeek} color="#3b82f6" icon="📅" onClick={onItemClick} onComplete={completeMutation.mutate} />
      <TaskGroup label="LATER" items={later} color="#94a3b8" icon="📅" onClick={onItemClick} onComplete={completeMutation.mutate} />
      <TaskGroup label="RECENTLY COMPLETED" items={done.slice(0, 10)} color="#10b981" icon="✅" onClick={onItemClick} onComplete={completeMutation.mutate} />

      {myItems.length === 0 && (
        <div className="text-center py-16" style={{ color: '#475569' }}>
          <p className="text-lg mb-2">No tasks assigned to you</p>
          <p className="text-sm">Tasks assigned to "{currentUser}" will appear here.</p>
        </div>
      )}
    </div>
  );
}