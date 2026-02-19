import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RotateCcw, Loader2 } from 'lucide-react';
import WeeklyAutoSections from './WeeklyAutoSections';

const RAG_COLORS = { Green: '#10b981', Amber: '#f59e0b', Red: '#ef4444' };

export default function WeeklyReportReadOnly({ report, projectId }) {
  const qc = useQueryClient();
  const enabledSections = (() => { try { return JSON.parse(report.enabledSections || '[]'); } catch { return []; } })();

  const revertMutation = useMutation({
    mutationFn: () => base44.entities.WeeklyReport.update(report.id, { status: 'Draft', publishedAt: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weeklyReports', projectId] }),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#CADCFC' }}>
            {report.reportNumber} — CW{report.calendarWeek}/{report.year}
          </h2>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            {format(new Date(report.reportingPeriodStart), 'd MMM')} – {format(new Date(report.reportingPeriodEnd), 'd MMM yyyy')}
          </p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>
            Prepared by: {report.preparedBy}{report.reviewedBy ? ` | Reviewed by: ${report.reviewedBy}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✅ Published</Badge>
          <Button size="sm" variant="outline" onClick={() => revertMutation.mutate()} disabled={revertMutation.isPending} style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.7rem' }}>
            {revertMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
            Revert to Draft
          </Button>
        </div>
      </div>

      {/* RAG */}
      {(enabledSections.length === 0 || enabledSections.includes('rag')) && (
        <div className="p-5 rounded-xl" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#CADCFC' }}>🚦 RAG Status</h3>
          <div className="grid grid-cols-5 gap-3">
            {[
              { key: 'overallRag', label: 'Overall' },
              { key: 'scheduleRag', label: 'Schedule' },
              { key: 'costRag', label: 'Cost' },
              { key: 'riskRag', label: 'Risk' },
              { key: 'qualityRag', label: 'Quality' },
            ].map(({ key, label }) => (
              <div key={key} className="text-center p-3 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)' }}>
                <div className="text-xs mb-2" style={{ color: '#94A3B8' }}>{label}</div>
                <div className="text-2xl">{report[key] === 'Green' ? '🟢' : report[key] === 'Amber' ? '🟡' : '🔴'}</div>
                <div className="text-xs mt-1 font-medium" style={{ color: RAG_COLORS[report[key]] }}>{report[key]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {(enabledSections.length === 0 || enabledSections.includes('summary')) && (
        <div className="p-5 rounded-xl space-y-3" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
          <h3 className="font-semibold" style={{ color: '#CADCFC' }}>📝 Executive Summary</h3>
          {report.executiveSummary && (
            <p className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>{report.executiveSummary}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {report.highlights && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#10b981' }}>✅ Highlights</p>
                <p className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>{report.highlights}</p>
              </div>
            )}
            {report.concerns && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#ef4444' }}>⚠️ Concerns</p>
                <p className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>{report.concerns}</p>
              </div>
            )}
            {report.nextWeekFocus && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#3b82f6' }}>🔭 Next Week Focus</p>
                <p className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>{report.nextWeekFocus}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto sections in read-only mode */}
      <WeeklyAutoSections
        projectId={projectId}
        enabledSections={enabledSections.filter(s => !['rag','summary'].includes(s))}
        reportingPeriodStart={report.reportingPeriodStart}
        reportingPeriodEnd={report.reportingPeriodEnd}
        readOnly
      />

      {report.publishedAt && (
        <p className="text-xs text-center pb-6" style={{ color: '#334155' }}>
          Published {format(new Date(report.publishedAt), 'dd MMM yyyy HH:mm')} — CONFIDENTIAL
        </p>
      )}
    </div>
  );
}