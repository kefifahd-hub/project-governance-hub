import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getISOWeek, getYear, startOfISOWeek, endOfISOWeek, format, addWeeks, subWeeks, parseISO } from 'date-fns';
import WeeklyReportEditor from './WeeklyReportEditor';
import WeeklyReportReadOnly from './WeeklyReportReadOnly';
import { BarChart2, ChevronDown, ChevronUp, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

function buildWeekList(projectStart, projectEnd) {
  const weeks = [];
  const now = new Date();
  let cursor = startOfISOWeek(projectStart || subWeeks(now, 52));
  const end = projectEnd || addWeeks(now, 12);
  while (cursor <= end) {
    weeks.push({
      weekStart: new Date(cursor),
      weekEnd: endOfISOWeek(cursor),
      cw: getISOWeek(cursor),
      year: getYear(cursor),
    });
    cursor = addWeeks(cursor, 1);
  }
  return weeks;
}

const RAG_COLOR = { Green: '#10b981', Amber: '#f59e0b', Red: '#ef4444' };

function ragDot(rag) {
  return <span key={rag} style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: RAG_COLOR[rag] || '#475569', marginRight: 2 }} />;
}

function statusInfo(report, weekStart) {
  const now = new Date();
  const isFuture = weekStart > now;
  if (isFuture) return { label: 'Future', color: '#334155', badge: null };
  if (!report) return { label: 'Not Generated', color: '#475569', badge: '⬜' };
  if (report.status === 'Published') return { label: 'Published', color: '#10b981', badge: '✅' };
  if (report.status === 'Under Review') return { label: 'In Review', color: '#a855f7', badge: '🔍' };
  return { label: 'Draft', color: '#3b82f6', badge: '📝' };
}

export default function WeeklyReportView({ projectId }) {
  const qc = useQueryClient();
  const now = new Date();
  const currentCW = getISOWeek(now);
  const currentYear = getYear(now);
  const [selectedWeek, setSelectedWeek] = useState({
    cw: currentCW, year: currentYear,
    weekStart: startOfISOWeek(now), weekEnd: endOfISOWeek(now)
  });
  const currentWeekRef = useRef(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => { const r = await base44.entities.Project.filter({ id: projectId }); return r[0]; },
    enabled: !!projectId,
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['weeklyReports', projectId],
    queryFn: () => base44.entities.WeeklyReport.filter({ projectId }),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WeeklyReport.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weeklyReports', projectId] }),
  });

  const weeks = buildWeekList(
    new Date(currentYear, 0, 1),
    new Date(currentYear, 11, 31)
  );

  const reportMap = {};
  reports.forEach(r => { reportMap[`${r.calendarWeek}-${r.year}`] = r; });

  const selectedReport = reportMap[`${selectedWeek.cw}-${selectedWeek.year}`];

  const groupedByYear = weeks.reduce((acc, w) => {
    if (!acc[w.year]) acc[w.year] = [];
    acc[w.year].push(w);
    return acc;
  }, {});

  const [yearOpen, setYearOpen] = useState({ [currentYear]: true });

  // Scroll to current week on mount
  useEffect(() => {
    if (currentWeekRef.current) {
      currentWeekRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isLoading]);

  // Count missing past weeks
  const missingWeeks = weeks.filter(w => {
    const daysPast = (now - w.weekEnd) / 86400000;
    return daysPast > 7 && !reportMap[`${w.cw}-${w.year}`] && w.weekEnd <= now;
  }).length;

  function handleGenerate() {
    const existing = reportMap[`${selectedWeek.cw}-${selectedWeek.year}`];
    if (existing) return;
    const num = reports.length + 1;
    createMutation.mutate({
      projectId,
      reportNumber: `WR-${String(num).padStart(3, '0')}`,
      calendarWeek: selectedWeek.cw,
      year: selectedWeek.year,
      reportingPeriodStart: format(selectedWeek.weekStart, 'yyyy-MM-dd'),
      reportingPeriodEnd: format(selectedWeek.weekEnd, 'yyyy-MM-dd'),
      reportDate: format(now, 'yyyy-MM-dd'),
      preparedBy: project?.projectOwner || '',
      status: 'Draft',
      overallRag: 'Amber',
      scheduleRag: 'Amber',
      costRag: 'Green',
      riskRag: 'Amber',
      qualityRag: 'Green',
      enabledSections: JSON.stringify(['rag','summary','schedule','cost','actions','risks','changes','quality','lookahead']),
    });
  }

  return (
    <div className="flex h-[calc(100vh-160px)]">
      {/* Sidebar */}
      <div className="w-64 shrink-0 overflow-y-auto border-r flex flex-col" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.1)' }}>
        {/* Missing reports warning */}
        {missingWeeks > 0 && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            ⚠️ {missingWeeks} report{missingWeeks > 1 ? 's' : ''} missing. Generate to complete your archive.
          </div>
        )}
        <div className="p-3 flex-1">
          {isLoading ? (
            <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#94A3B8' }} /></div>
          ) : (
            Object.entries(groupedByYear).sort(([a],[b]) => Number(b)-Number(a)).map(([year, yearWeeks]) => (
              <div key={year}>
                <button
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold uppercase tracking-widest mb-1 mt-2"
                  style={{ color: '#475569' }}
                  onClick={() => setYearOpen(prev => ({ ...prev, [year]: !prev[year] }))}
                >
                  {year}
                  {yearOpen[year] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {yearOpen[year] && yearWeeks.map(w => {
                  const report = reportMap[`${w.cw}-${w.year}`];
                  const { color, badge } = statusInfo(report, w.weekStart);
                  const isCurrent = w.cw === currentCW && w.year === currentYear;
                  const isSelected = selectedWeek.cw === w.cw && selectedWeek.year === w.year;
                  const isFuture = w.weekStart > now;
                  const daysPast = (now - w.weekEnd) / 86400000;
                  const isMissing = daysPast > 7 && !report;
                  return (
                    <button
                      key={`${w.cw}-${w.year}`}
                      ref={isCurrent ? currentWeekRef : null}
                      onClick={() => !isFuture && setSelectedWeek(w)}
                      disabled={isFuture}
                      className="w-full text-left px-2 py-1.5 rounded-lg mb-0.5 transition-all"
                      style={{
                        background: isSelected ? 'rgba(0,168,150,0.15)' : isCurrent ? 'rgba(249,115,22,0.08)' : 'transparent',
                        border: isSelected ? '1px solid rgba(0,168,150,0.3)' : isCurrent ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent',
                        opacity: isFuture ? 0.35 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold" style={{ color: isCurrent ? '#f97316' : isMissing ? '#ef4444' : color }}>
                          CW{String(w.cw).padStart(2,'0')}
                          {isCurrent && <span className="ml-1 text-[9px] bg-orange-500 text-white rounded px-1">NOW</span>}
                          {isMissing && !isCurrent && <span className="ml-1 text-[9px]">⚠️</span>}
                        </span>
                        <span className="text-[10px]">{badge}</span>
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>
                        {format(w.weekStart, 'd MMM')}–{format(w.weekEnd, 'd MMM')}
                      </div>
                      {report && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <span className="text-[9px]" style={{ color: '#64748b' }}>{report.reportNumber}</span>
                          {report.status === 'Published' && report.scheduleRag && (
                            <span className="ml-1">{ragDot(report.scheduleRag)}{ragDot(report.costRag)}{ragDot(report.riskRag)}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        {/* Generate button */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(202,220,252,0.1)' }}>
          <Button
            className="w-full text-sm"
            onClick={handleGenerate}
            disabled={!!selectedReport || selectedWeek.weekStart > now || createMutation.isPending}
            style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart2 className="w-4 h-4 mr-2" />}
            Generate CW{selectedWeek.cw} Report
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedReport ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <BarChart2 className="w-12 h-12" style={{ color: '#334155' }} />
            <p className="text-lg font-medium" style={{ color: '#64748b' }}>
              {selectedWeek.weekStart > now ? 'Cannot generate future reports' : `No report for CW${selectedWeek.cw}/${selectedWeek.year}`}
            </p>
            <p className="text-sm" style={{ color: '#475569' }}>
              {format(selectedWeek.weekStart, 'd MMM')} – {format(selectedWeek.weekEnd, 'd MMM yyyy')}
            </p>
            {selectedWeek.weekStart <= now && (
              <Button onClick={handleGenerate} disabled={createMutation.isPending} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generate Report
              </Button>
            )}
          </div>
        ) : selectedReport.status === 'Published' ? (
          <WeeklyReportReadOnly report={selectedReport} projectId={projectId} />
        ) : (
          <WeeklyReportEditor report={selectedReport} projectId={projectId} />
        )}
      </div>
    </div>
  );
}