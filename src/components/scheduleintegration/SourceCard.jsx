import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, RefreshCw, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_CONFIG = {
  Success: { color: '#10b981', icon: CheckCircle2, label: 'Current' },
  Partial: { color: '#f59e0b', icon: AlertCircle, label: 'Partial' },
  Failed: { color: '#ef4444', icon: AlertCircle, label: 'Failed' },
  'Never Synced': { color: '#64748b', icon: Clock, label: 'Never Synced' },
};

export default function SourceCard({ source, onUpload, onRegister, uploading }) {
  const status = STATUS_CONFIG[source.lastSyncStatus] || STATUS_CONFIG['Never Synced'];
  const StatusIcon = status.icon;
  const isP6 = source.sourceType === 'Primavera P6';

  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.12)' }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{isP6 ? '🏗️' : '📋'}</span>
            <span className="font-semibold text-sm" style={{ color: '#CADCFC' }}>{source.sourceName}</span>
          </div>
          <div className="text-xs" style={{ color: '#64748b' }}>{source.sourceType}</div>
          {source.sourceOwner && <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>Owner: {source.sourceOwner}</div>}
        </div>
        <div className="flex items-center gap-1.5">
          <StatusIcon className="w-3.5 h-3.5" style={{ color: status.color }} />
          <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#94A3B8' }}>
        <div>Last sync: {source.lastSyncDate ? format(parseISO(source.lastSyncDate), 'd MMM yyyy') : '—'}</div>
        <div>Data date: {source.dataDate ? format(parseISO(source.dataDate), 'd MMM yyyy') : '—'}</div>
        <div>Tasks: {source.taskCount ?? '—'}</div>
        <div>Baselines: {source.baselineCount ?? 0}</div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <label className="cursor-pointer">
          <input type="file" accept=".xer,.xml,.mpp,.csv,.xlsx" className="hidden" onChange={e => e.target.files?.[0] && onUpload(source, e.target.files[0])} />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(0,168,150,0.15)', border: '1px solid rgba(0,168,150,0.3)', color: '#00A896', cursor: 'pointer' }}>
            {uploading === source.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload {isP6 ? '.XER' : '.MPP'}
          </div>
        </label>
        <Button size="sm" variant="ghost" className="text-xs h-7 px-2" style={{ color: '#94A3B8', border: '1px solid rgba(202,220,252,0.1)' }}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> API Sync
        </Button>
      </div>
    </div>
  );
}