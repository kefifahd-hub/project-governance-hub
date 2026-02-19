import { useState } from 'react';
import { Wrench, AlertTriangle, HelpCircle, FileText, Search, Package, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const TYPE_ICONS = {
  'Action': { icon: Wrench, color: '#6366f1' },
  'Issue': { icon: AlertTriangle, color: '#ef4444' },
  'Decision': { icon: HelpCircle, color: '#f59e0b' },
  'RFI': { icon: FileText, color: '#3b82f6' },
  'Punch List': { icon: Search, color: '#8b5cf6' },
  'Deliverable': { icon: Package, color: '#10b981' },
  'Risk Action': { icon: Shield, color: '#f97316' },
};

const PRIORITY_COLORS = {
  'P1 - Critical': '#ef4444',
  'P2 - High': '#f97316',
  'P3 - Medium': '#f59e0b',
  'P4 - Low': '#94a3b8',
};

const STATUS_COLORS = {
  'To Do': '#94a3b8',
  'In Progress': '#3b82f6',
  'In Review': '#8b5cf6',
  'Done': '#10b981',
  'Blocked': '#ef4444',
  'Open': '#ef4444',
  'Closed': '#10b981',
  'Draft': '#94a3b8',
  'Submitted': '#3b82f6',
  'Pending': '#94a3b8',
  'Resolved': '#10b981',
};

function ItemRow({ item, depth = 0, allItems, onClick }) {
  const [expanded, setExpanded] = useState(false);
  const children = allItems.filter(i => i.parentId === item.id);
  const typeInfo = TYPE_ICONS[item.itemType] || TYPE_ICONS['Action'];
  const Icon = typeInfo.icon;
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !['Done', 'Closed'].includes(item.status);

  return (
    <>
      <tr
        className="border-b hover:bg-opacity-50 cursor-pointer transition-colors"
        style={{ borderColor: 'rgba(202,220,252,0.06)', background: depth > 0 ? 'rgba(30,39,97,0.2)' : 'transparent' }}
        onClick={() => onClick(item)}
      >
        <td className="px-3 py-2.5 w-8">
          {children.length > 0 && (
            <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} style={{ color: '#94A3B8' }}>
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </td>
        <td className="px-2 py-2.5 w-8">
          <Icon className="w-4 h-4" style={{ color: typeInfo.color }} />
        </td>
        <td className="px-2 py-2.5 w-24">
          <span className="text-xs font-mono" style={{ color: '#475569' }}>{item.itemKey}</span>
        </td>
        <td className="px-3 py-2.5" style={{ paddingLeft: `${12 + depth * 20}px` }}>
          <span className="text-sm" style={{ color: '#CADCFC' }}>{item.title}</span>
        </td>
        <td className="px-2 py-2.5">
          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${PRIORITY_COLORS[item.priority]}22`, color: PRIORITY_COLORS[item.priority] }}>
            {item.priority?.split(' - ')[0]}
          </span>
        </td>
        <td className="px-2 py-2.5">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[item.status] || '#94a3b8'}22`, color: STATUS_COLORS[item.status] || '#94a3b8' }}>
            {item.status}
          </span>
        </td>
        <td className="px-2 py-2.5 text-sm" style={{ color: '#94A3B8' }}>{item.assignee || '—'}</td>
        <td className="px-2 py-2.5 text-xs" style={{ color: isOverdue ? '#ef4444' : '#64748b' }}>
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
        </td>
        <td className="px-2 py-2.5 w-28">
          {item.progressPct > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(202,220,252,0.1)' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${item.progressPct}%`, background: '#00A896' }} />
              </div>
              <span className="text-xs" style={{ color: '#475569' }}>{item.progressPct}%</span>
            </div>
          ) : <span className="text-xs" style={{ color: '#475569' }}>—</span>}
        </td>
        <td className="px-2 py-2.5 text-xs" style={{ color: '#475569' }}>{item.bucket || '—'}</td>
      </tr>
      {expanded && children.map(child => (
        <ItemRow key={child.id} item={child} depth={depth + 1} allItems={allItems} onClick={onClick} />
      ))}
    </>
  );
}

export default function ListView({ items, onItemClick, onNewItem }) {
  const topLevel = items.filter(i => !i.parentId);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => onNewItem({})} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
          + New Item
        </Button>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(30,39,97,0.8)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
                <th className="w-8 px-3 py-2.5" />
                <th className="w-8 px-2 py-2.5" />
                <th className="px-2 py-2.5 text-left text-xs font-semibold" style={{ color: '#94A3B8' }}>Key</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: '#94A3B8' }}>Title</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold" style={{ color: '#94A3B8' }}>Priority</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold" style={{ color: '#94A3B8' }}>Status</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold" style={{ color: '#94A3B8' }}>Assignee</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold" style={{ color: '#94A3B8' }}>Due</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold w-28" style={{ color: '#94A3B8' }}>Progress</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold" style={{ color: '#94A3B8' }}>Bucket</th>
              </tr>
            </thead>
            <tbody>
              {topLevel.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center" style={{ color: '#475569' }}>
                    No items found. Create your first action item.
                  </td>
                </tr>
              ) : topLevel.map(item => (
                <ItemRow key={item.id} item={item} depth={0} allItems={items} onClick={onItemClick} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-2 text-xs" style={{ color: '#475569' }}>
        {items.length} item{items.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}