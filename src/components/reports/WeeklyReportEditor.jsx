import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Save, Send, Loader2, AlertTriangle, TrendingUp, DollarSign, List, Shield, RefreshCw, Flag, Telescope } from 'lucide-react';
import WeeklyAutoSections from './WeeklyAutoSections';
import SectionConfigModal from './SectionConfigModal';
import ExportPdfButton from './ExportPdfButton';

const RAG_OPTIONS = ['Green', 'Amber', 'Red'];
const RAG_COLORS = { Green: '#10b981', Amber: '#f59e0b', Red: '#ef4444' };
const RAG_LABELS = { Green: '🟢 Green', Amber: '🟡 Amber', Red: '🔴 Red' };

function RagSelect({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32 h-8 text-xs" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: RAG_COLORS[value] || '#CADCFC' }}>
        <SelectValue>{RAG_LABELS[value] || 'Select'}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {RAG_OPTIONS.map(r => <SelectItem key={r} value={r} style={{ color: RAG_COLORS[r] }}>{RAG_LABELS[r]}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function WeeklyReportEditor({ report, projectId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...report });
  const [showSectionConfig, setShowSectionConfig] = useState(false);

  useEffect(() => { setForm({ ...report }); }, [report?.id]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.WeeklyReport.update(report.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weeklyReports', projectId] }),
  });

  const publishMutation = useMutation({
    mutationFn: () => base44.entities.WeeklyReport.update(report.id, { ...form, status: 'Published', publishedAt: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weeklyReports', projectId] }),
  });

  const submitReviewMutation = useMutation({
    mutationFn: () => base44.entities.WeeklyReport.update(report.id, { ...form, status: 'Under Review' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weeklyReports', projectId] }),
  });

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  const enabledSections = (() => { try { return JSON.parse(form.enabledSections || '[]'); } catch { return []; } })();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#CADCFC' }}>
            {report.reportNumber} — CW{report.calendarWeek}/{report.year}
          </h2>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            {format(new Date(report.reportingPeriodStart), 'd MMM')} – {format(new Date(report.reportingPeriodEnd), 'd MMM yyyy')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>📝 Draft</Badge>
          <Button size="sm" variant="outline" onClick={() => setShowSectionConfig(true)} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>⚙️ Sections</Button>
          <Button size="sm" variant="outline" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-1">Save</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => submitReviewMutation.mutate()} style={{ borderColor: 'rgba(167,139,250,0.4)', color: '#a855f7' }}>
            <Send className="w-4 h-4 mr-1" /> Review
          </Button>
          <Button size="sm" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
            {publishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div>
          <Label className="text-xs" style={{ color: '#94A3B8' }}>Prepared By</Label>
          <Input value={form.preparedBy || ''} onChange={e => set('preparedBy', e.target.value)} className="mt-1 h-8 text-sm" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: '#94A3B8' }}>Reviewed By</Label>
          <Input value={form.reviewedBy || ''} onChange={e => set('reviewedBy', e.target.value)} className="mt-1 h-8 text-sm" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
        </div>
      </div>

      {/* RAG Status */}
      {enabledSections.includes('rag') && (
        <div className="p-5 rounded-xl space-y-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
          <h3 className="font-semibold flex items-center gap-2" style={{ color: '#CADCFC' }}>🚦 RAG Status Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'overallRag', label: 'Overall' },
              { key: 'scheduleRag', label: 'Schedule' },
              { key: 'costRag', label: 'Cost' },
              { key: 'riskRag', label: 'Risk' },
              { key: 'qualityRag', label: 'Quality' },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <span className="text-xs" style={{ color: '#94A3B8' }}>{label}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ background: `${RAG_COLORS[form[key]]}22` }}>
                  {form[key] === 'Green' ? '🟢' : form[key] === 'Amber' ? '🟡' : '🔴'}
                </div>
                <RagSelect value={form[key]} onChange={v => set(key, v)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {enabledSections.includes('summary') && (
        <div className="p-5 rounded-xl space-y-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
          <h3 className="font-semibold flex items-center gap-2" style={{ color: '#CADCFC' }}>📝 Executive Summary</h3>
          <Textarea value={form.executiveSummary || ''} onChange={e => set('executiveSummary', e.target.value)} placeholder="Write the weekly executive summary..." rows={4} style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs" style={{ color: '#10b981' }}>✅ Highlights</Label>
              <Textarea value={form.highlights || ''} onChange={e => set('highlights', e.target.value)} placeholder="Key achievements this week..." rows={3} className="mt-1" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(16,185,129,0.2)', color: '#F8FAFC', fontSize: '0.8rem' }} />
            </div>
            <div>
              <Label className="text-xs" style={{ color: '#ef4444' }}>⚠️ Concerns</Label>
              <Textarea value={form.concerns || ''} onChange={e => set('concerns', e.target.value)} placeholder="Issues requiring attention..." rows={3} className="mt-1" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(239,68,68,0.2)', color: '#F8FAFC', fontSize: '0.8rem' }} />
            </div>
            <div>
              <Label className="text-xs" style={{ color: '#3b82f6' }}>🔭 Next Week Focus</Label>
              <Textarea value={form.nextWeekFocus || ''} onChange={e => set('nextWeekFocus', e.target.value)} placeholder="Priorities for next week..." rows={3} className="mt-1" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(59,130,246,0.2)', color: '#F8FAFC', fontSize: '0.8rem' }} />
            </div>
          </div>
        </div>
      )}

      {/* Auto-populated sections from live data */}
      <WeeklyAutoSections projectId={projectId} enabledSections={enabledSections} reportingPeriodStart={report.reportingPeriodStart} reportingPeriodEnd={report.reportingPeriodEnd} />

      {/* Save footer */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
          <Save className="w-4 h-4 mr-1" /> Save Draft
        </Button>
        <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
          <CheckCircle2 className="w-4 h-4 mr-1" /> Publish Report
        </Button>
      </div>

      {showSectionConfig && (
        <SectionConfigModal projectId={projectId} reportType="weekly" enabledSections={enabledSections} onSave={sections => { set('enabledSections', JSON.stringify(sections)); setShowSectionConfig(false); }} onClose={() => setShowSectionConfig(false)} />
      )}
    </div>
  );
}