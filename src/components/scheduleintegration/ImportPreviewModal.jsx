import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const IMPACT_COLORS = { Critical: '#ef4444', Major: '#f97316', Minor: '#f59e0b', Info: '#3b82f6' };
const IMPACT_EMOJI = { Critical: '🔴', Major: '🟠', Minor: '🟡', Info: 'ℹ️' };

export default function ImportPreviewModal({ preview, onConfirm, onCancel, confirming }) {
  const { source, parsed, deltas } = preview;

  const criticalCount = deltas.filter(d => d.impactLevel === 'Critical').length;
  const majorCount = deltas.filter(d => d.impactLevel === 'Major').length;
  const minorCount = deltas.filter(d => d.impactLevel === 'Minor').length;
  const infoCount = deltas.filter(d => d.impactLevel === 'Info').length;
  const newCount = deltas.filter(d => d.changeType === 'New Task').length;
  const deletedCount = deltas.filter(d => d.changeType === 'Deleted Task').length;

  const [showAllDeltas, setShowAllDeltas] = useState(false);
  const visibleDeltas = showAllDeltas ? deltas : deltas.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'rgba(15,23,42,0.99)', border: '1px solid rgba(202,220,252,0.15)' }}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#CADCFC' }}>📋 Import Preview</h2>
              <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{source.sourceName} — {preview.fileName}</p>
            </div>
            <button onClick={onCancel}><X className="w-5 h-5" style={{ color: '#64748b' }} /></button>
          </div>

          {/* Summary */}
          <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>Summary</div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><span style={{ color: '#64748b' }}>Activities:</span> <span style={{ color: '#CADCFC' }}>{parsed.taskCount}</span></div>
              <div><span style={{ color: '#64748b' }}>Milestones:</span> <span style={{ color: '#CADCFC' }}>{parsed.milestoneCount}</span></div>
              <div><span style={{ color: '#64748b' }}>WBS Levels:</span> <span style={{ color: '#CADCFC' }}>{parsed.wbsLevels}</span></div>
              <div><span style={{ color: '#64748b' }}>Project Start:</span> <span style={{ color: '#CADCFC' }}>{parsed.projectStart}</span></div>
              <div><span style={{ color: '#64748b' }}>Project Finish:</span> <span style={{ color: '#CADCFC' }}>{parsed.projectFinish}</span></div>
              <div><span style={{ color: '#64748b' }}>Data Date:</span> <span style={{ color: '#CADCFC' }}>{parsed.dataDate || '—'}</span></div>
            </div>
          </div>

          {/* Delta summary */}
          {deltas.length > 0 && (
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>Changes vs Previous Version</div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                {criticalCount > 0 && <div>🔴 Critical: <span style={{ color: '#ef4444', fontWeight: 600 }}>{criticalCount}</span></div>}
                {majorCount > 0 && <div>🟠 Major: <span style={{ color: '#f97316', fontWeight: 600 }}>{majorCount}</span></div>}
                {minorCount > 0 && <div>🟡 Minor: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{minorCount}</span></div>}
                {infoCount > 0 && <div>ℹ️ Info: <span style={{ color: '#3b82f6', fontWeight: 600 }}>{infoCount}</span></div>}
                {newCount > 0 && <div>🆕 New: <span style={{ color: '#10b981', fontWeight: 600 }}>{newCount}</span></div>}
                {deletedCount > 0 && <div>❌ Removed: <span style={{ color: '#ef4444', fontWeight: 600 }}>{deletedCount}</span></div>}
              </div>

              <div className="space-y-2">
                {visibleDeltas.map((d, i) => (
                  <div key={i} className="rounded-lg p-3 text-xs" style={{ background: `${IMPACT_COLORS[d.impactLevel] || '#475569'}10`, border: `1px solid ${IMPACT_COLORS[d.impactLevel] || '#475569'}25` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold" style={{ color: '#94A3B8' }}>{d.externalId}</span>
                      <span style={{ color: IMPACT_COLORS[d.impactLevel] }}>{IMPACT_EMOJI[d.impactLevel]} {d.impactLevel}</span>
                    </div>
                    <div style={{ color: '#CADCFC' }}>{d.taskName}</div>
                    <div className="mt-1" style={{ color: '#64748b' }}>
                      {d.fieldChanged}: {d.oldValue} → {d.newValue}
                      {d.varianceDays ? ` (${d.varianceDays > 0 ? '+' : ''}${d.varianceDays}d)` : ''}
                      {d.affectsCriticalPath && <span className="ml-2 text-red-400">⚡ Critical Path</span>}
                    </div>
                  </div>
                ))}
                {deltas.length > 10 && !showAllDeltas && (
                  <button onClick={() => setShowAllDeltas(true)} className="text-xs w-full text-center py-2" style={{ color: '#64748b' }}>
                    Show all {deltas.length} changes...
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onCancel} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>❌ Cancel</Button>
            <Button onClick={onConfirm} disabled={confirming} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
              {confirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirm Import
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}