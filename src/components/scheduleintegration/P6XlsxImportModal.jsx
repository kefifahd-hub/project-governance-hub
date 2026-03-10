import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X, Loader2 } from 'lucide-react';

const cardStyle = { background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' };
const s = { color: '#64748b' };
const v = { color: '#CADCFC' };

export default function P6XlsxImportModal({ preview, onConfirm, onCancel, confirming, importProgress }) {
  const { fileName, tasks, existingMap, summary } = preview;
  const [showAll, setShowAll] = useState(false);

  const newRows    = tasks.filter(t => !existingMap[t.externalId]);
  const updateRows = tasks.filter(t =>  existingMap[t.externalId]);
  const visibleTasks = showAll ? tasks : tasks.slice(0, 20);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'rgba(15,23,42,0.99)', border: '1px solid rgba(202,220,252,0.15)' }}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#CADCFC' }}>📊 P6 XLSX Import Preview</h2>
              <p className="text-sm mt-0.5" style={s}>{fileName}</p>
            </div>
            <button onClick={onCancel}><X className="w-5 h-5" style={s} /></button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Total Activities', val: tasks.length, color: '#CADCFC' },
              { label: 'New (to create)', val: newRows.length, color: '#10b981' },
              { label: 'Updated (to upsert)', val: updateRows.length, color: '#f59e0b' },
              { label: 'Milestones', val: summary.milestoneCount, color: '#a78bfa' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={cardStyle}>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-xl p-4 mb-4" style={cardStyle}>
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={s}>File Summary</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><span style={s}>Project Start:</span> <span style={v}>{summary.projectStart || '—'}</span></div>
              <div><span style={s}>Project Finish:</span> <span style={v}>{summary.projectFinish || '—'}</span></div>
              <div><span style={s}>Critical:</span> <span style={v}>{summary.criticalPathLength}</span></div>
            </div>
          </div>

          {/* Activity preview table */}
          <div className="rounded-xl overflow-hidden mb-5" style={cardStyle}>
            <div className="text-xs font-bold uppercase tracking-wider px-4 py-2" style={{ ...s, borderBottom: '1px solid rgba(202,220,252,0.08)' }}>
              Activity Preview
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {['Status', 'Activity ID', 'Activity Name', 'WBS', 'Start', 'Finish', '% Complete'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold" style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map((t, i) => {
                    const isNew = !existingMap[t.externalId];
                    return (
                      <tr key={i} style={{ borderTop: '1px solid rgba(202,220,252,0.05)', background: i % 2 === 0 ? 'rgba(30,39,97,0.15)' : 'transparent' }}>
                        <td className="px-3 py-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: isNew ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: isNew ? '#10b981' : '#f59e0b' }}>
                            {isNew ? 'NEW' : 'UPD'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 font-mono" style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{t.externalId}</td>
                        <td className="px-3 py-1.5 max-w-[200px] truncate" style={{ color: '#CADCFC' }} title={t.taskName}>{t.taskName}</td>
                        <td className="px-3 py-1.5 font-mono text-[10px]" style={{ color: '#64748b' }}>{t.externalWbs || '—'}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: '#64748b' }}>{t.plannedStart || '—'}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: '#64748b' }}>{t.plannedFinish || '—'}</td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(202,220,252,0.1)' }}>
                              <div className="h-full rounded-full" style={{ width: `${t.percentComplete}%`, background: t.percentComplete >= 100 ? '#10b981' : '#028090' }} />
                            </div>
                            <span style={{ color: '#94a3b8' }}>{t.percentComplete}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {tasks.length > 20 && !showAll && (
              <button onClick={() => setShowAll(true)} className="w-full py-2 text-xs text-center" style={{ color: '#64748b', borderTop: '1px solid rgba(202,220,252,0.08)' }}>
                Show all {tasks.length} activities…
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onCancel} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Cancel</Button>
            <Button onClick={onConfirm} disabled={confirming} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
              {confirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Import {newRows.length} new + {updateRows.length} updated
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}