import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IMPACT_COLORS = { Critical: '#ef4444', Major: '#f97316', Minor: '#f59e0b', Info: '#3b82f6' };
const IMPACT_EMOJI = { Critical: '🔴', Major: '🟠', Minor: '🟡', Info: 'ℹ️' };

export default function DeltaTab({ projectId }) {
  const qc = useQueryClient();

  const { data: deltas = [], isLoading } = useQuery({
    queryKey: ['scheduleDeltas', projectId],
    queryFn: () => base44.entities.ScheduleDelta.filter({ projectId }, '-created_date', 200),
    enabled: !!projectId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduleDelta.update(id, { acknowledged: true, acknowledgedAt: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduleDeltas', projectId] }),
  });

  const unacknowledged = deltas.filter(d => !d.acknowledged);
  const critical = unacknowledged.filter(d => d.impactLevel === 'Critical');
  const major = unacknowledged.filter(d => d.impactLevel === 'Major');
  const others = unacknowledged.filter(d => d.impactLevel !== 'Critical' && d.impactLevel !== 'Major');

  if (isLoading) return <div className="flex justify-center pt-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#64748b' }} /></div>;

  if (deltas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-4xl">✅</span>
        <p className="text-sm" style={{ color: '#64748b' }}>No schedule changes detected yet.</p>
      </div>
    );
  }

  function DeltaSection({ title, items }) {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>{title} ({items.length})</div>
        <div className="space-y-2">
          {items.map(d => (
            <div key={d.id} className="rounded-xl p-4" style={{ background: `${IMPACT_COLORS[d.impactLevel] || '#475569'}08`, border: `1px solid ${IMPACT_COLORS[d.impactLevel] || '#475569'}25` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs" style={{ color: '#94A3B8' }}>{d.externalId}</span>
                    <span className="text-xs font-medium" style={{ color: IMPACT_COLORS[d.impactLevel] }}>{IMPACT_EMOJI[d.impactLevel]} {d.impactLevel}</span>
                    {d.affectsCriticalPath && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>⚡ Critical Path</span>}
                    {d.affectsMilestone && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>🎯 Milestone</span>}
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: '#CADCFC' }}>{d.taskName}</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>
                    {d.fieldChanged}: <span style={{ color: '#ef4444' }}>{d.oldValue}</span> → <span style={{ color: '#10b981' }}>{d.newValue}</span>
                    {d.varianceDays ? <span style={{ color: d.varianceDays > 0 ? '#ef4444' : '#10b981' }}> ({d.varianceDays > 0 ? '+' : ''}{d.varianceDays}d)</span> : ''}
                  </div>
                </div>
                {!d.acknowledged && (
                  <Button size="sm" variant="outline" onClick={() => acknowledgeMutation.mutate(d.id)} disabled={acknowledgeMutation.isPending}
                    style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#64748b', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Acknowledge
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: '#CADCFC' }}>🔄 Schedule Deltas</h3>
        <div className="flex items-center gap-3 text-xs" style={{ color: '#64748b' }}>
          <span>{unacknowledged.length} unacknowledged</span>
          <span>{deltas.length - unacknowledged.length} reviewed</span>
        </div>
      </div>

      {unacknowledged.length === 0 ? (
        <div className="rounded-xl p-4 text-sm text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
          ✅ All changes acknowledged
        </div>
      ) : (
        <div className="space-y-5">
          <DeltaSection title="🔴 Critical" items={critical} />
          <DeltaSection title="🟠 Major" items={major} />
          <DeltaSection title="Other Changes" items={others} />
        </div>
      )}

      {/* Acknowledged / history */}
      {deltas.filter(d => d.acknowledged).length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#334155' }}>✅ Acknowledged ({deltas.filter(d => d.acknowledged).length})</div>
          <div className="space-y-1">
            {deltas.filter(d => d.acknowledged).slice(0, 10).map(d => (
              <div key={d.id} className="rounded-lg px-3 py-2 flex items-center justify-between text-xs" style={{ background: 'rgba(30,39,97,0.2)', border: '1px solid rgba(202,220,252,0.05)' }}>
                <span style={{ color: '#475569' }}>{d.taskName} — {d.fieldChanged}</span>
                <span style={{ color: '#334155' }}>{IMPACT_EMOJI[d.impactLevel]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}