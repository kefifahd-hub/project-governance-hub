import { useState } from 'react';
import { Wrench, AlertTriangle, HelpCircle, FileText, Search, Package, Shield, Clock, Link } from 'lucide-react';
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

function ItemCard({ item, onClick }) {
  const typeInfo = TYPE_ICONS[item.itemType] || TYPE_ICONS['Action'];
  const Icon = typeInfo.icon;
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'Done' && item.status !== 'Closed';
  const isDueSoon = item.dueDate && !isOverdue && (new Date(item.dueDate) - new Date()) < 3 * 24 * 60 * 60 * 1000;

  return (
    <div
      onClick={() => onClick(item)}
      className="rounded-lg p-3 cursor-pointer hover:-translate-y-0.5 transition-all"
      style={{ background: 'rgba(30,39,97,0.6)', border: '1px solid rgba(202,220,252,0.1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: typeInfo.color }} />
          <span className="text-xs font-mono" style={{ color: '#475569' }}>{item.itemKey}</span>
        </div>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${PRIORITY_COLORS[item.priority]}22`, color: PRIORITY_COLORS[item.priority] }}>
          {item.priority?.split(' - ')[0]}
        </span>
      </div>

      <p className="text-sm font-medium mb-2 line-clamp-2" style={{ color: '#CADCFC' }}>{item.title}</p>

      {item.progressPct > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-0.5" style={{ color: '#475569' }}>
            <span>Progress</span><span>{item.progressPct}%</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: 'rgba(202,220,252,0.1)' }}>
            <div className="h-1 rounded-full" style={{ width: `${item.progressPct}%`, background: '#00A896' }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span style={{ color: '#64748b' }}>👤 {item.assignee || '—'}</span>
        {item.dueDate && (
          <span style={{ color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#64748b' }}>
            {isOverdue && '⚠️ '}{new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      {item.labels && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.labels.split(',').slice(0, 2).map(l => (
            <span key={l} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>{l.trim()}</span>
          ))}
        </div>
      )}

      {(item.changeRequestId || item.riskId || item.milestoneId) && (
        <div className="mt-1.5 flex items-center gap-1" style={{ color: '#475569' }}>
          <Link className="w-3 h-3" />
          <span className="text-xs">Linked</span>
        </div>
      )}
    </div>
  );
}

export default function BoardView({ items, buckets, onItemClick, onNewItem }) {
  const allBuckets = buckets.length > 0 ? buckets : [{ bucketName: 'General', bucketColor: '#6366f1' }];

  // Group items by bucket; also collect items with no matching bucket
  const ungrouped = items.filter(i => !i.bucket || !allBuckets.find(b => b.bucketName === i.bucket));

  return (
    <div className="flex gap-4 overflow-x-auto p-4 sm:p-6 h-full" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {allBuckets.map(bucket => {
        const bucketItems = items.filter(i => i.bucket === bucket.bucketName);
        return (
          <div key={bucket.id || bucket.bucketName} className="flex-shrink-0 w-72 flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: bucket.bucketColor || '#6366f1' }} />
                <span className="font-semibold text-sm" style={{ color: '#CADCFC' }}>{bucket.bucketName}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(202,220,252,0.1)', color: '#94A3B8' }}>{bucketItems.length}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
              {bucketItems.map(item => (
                <ItemCard key={item.id} item={item} onClick={onItemClick} />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-xs justify-start"
              style={{ color: '#475569' }}
              onClick={() => onNewItem({ bucket: bucket.bucketName })}
            >
              + Add item
            </Button>
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        <div className="flex-shrink-0 w-72 flex flex-col">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-3 h-3 rounded-full" style={{ background: '#475569' }} />
            <span className="font-semibold text-sm" style={{ color: '#94A3B8' }}>No Bucket</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(202,220,252,0.1)', color: '#94A3B8' }}>{ungrouped.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {ungrouped.map(item => <ItemCard key={item.id} item={item} onClick={onItemClick} />)}
          </div>
        </div>
      )}
    </div>
  );
}