import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const RAG_COLORS = { Green: '#10b981', Amber: '#f59e0b', Red: '#ef4444' };
const RAG_LABELS = { Green: '🟢 Green', Amber: '🟡 Amber', Red: '🔴 Red' };

export default function WeeklyReportReadOnly({ report }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#CADCFC' }}>
            {report.reportNumber} — CW{report.calendarWeek}/{report.year}
          </h2>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            {format(new Date(report.reportingPeriodStart), 'd MMM')} – {format(new Date(report.reportingPeriodEnd), 'd MMM yyyy')}
          </p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>
            Prepared by: {report.preparedBy} {report.reviewedBy && `| Reviewed by: ${report.reviewedBy}`}
          </p>
        </div>
        <Badge style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✅ Published</Badge>
      </div>

      {/* RAG */}
      <div className="p-5 rounded-xl" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <h3 className="font-semibold mb-3" style={{ color: '#CADCFC' }}>🚦 RAG Status</h3>
        <div className="grid grid-cols-5 gap-3">
          {[
            { key: 'overallRag', label: 'Overall' },
            { key: 'scheduleRag', label: 'Schedule' },
            { key: 'costRag', label: 'Cost' },
            { key: 'riskRag', label: 'Risk' },
            { key: 'qualityRag', label: 'Quality' },
          ].map(({ key, label }) => (
            <div key={key} className="text-center">
              <div className="text-xs mb-1" style={{ color: '#94A3B8' }}>{label}</div>
              <div className="text-2xl">{report[key] === 'Green' ? '🟢' : report[key] === 'Amber' ? '🟡' : '🔴'}</div>
              <div className="text-xs mt-1 font-medium" style={{ color: RAG_COLORS[report[key]] }}>{report[key]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {report.executiveSummary && (
        <div className="p-5 rounded-xl" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
          <h3 className="font-semibold mb-2" style={{ color: '#CADCFC' }}>📝 Executive Summary</h3>
          <p className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>{report.executiveSummary}</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {report.highlights && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#10b981' }}>✅ Highlights</p>
                <p className="text-xs" style={{ color: '#CBD5E1' }}>{report.highlights}</p>
              </div>
            )}
            {report.concerns && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#ef4444' }}>⚠️ Concerns</p>
                <p className="text-xs" style={{ color: '#CBD5E1' }}>{report.concerns}</p>
              </div>
            )}
            {report.nextWeekFocus && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#3b82f6' }}>🔭 Next Week</p>
                <p className="text-xs" style={{ color: '#CBD5E1' }}>{report.nextWeekFocus}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {report.publishedAt && (
        <p className="text-xs text-center" style={{ color: '#334155' }}>
          Published on {format(new Date(report.publishedAt), 'dd MMM yyyy HH:mm')} — CONFIDENTIAL
        </p>
      )}
    </div>
  );
}