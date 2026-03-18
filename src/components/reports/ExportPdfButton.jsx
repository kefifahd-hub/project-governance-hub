import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { base44 } from '@/api/base44Client';

const RAG_COLORS = { Green: '#10b981', Amber: '#f59e0b', Red: '#ef4444' };
const RAG_EMOJI = { Green: '🟢', Amber: '🟡', Red: '🔴' };

const s = {
  section: { marginBottom: '20px' },
  sectionTitle: { fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px', borderLeft: '3px solid #028090', paddingLeft: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '10px' },
  th: { textAlign: 'left', padding: '5px 8px', background: '#f1f5f9', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '5px 8px', borderBottom: '1px solid #f1f5f9', color: '#334155', verticalAlign: 'top' },
  stat: { display: 'inline-block', textAlign: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', minWidth: '70px', marginRight: '8px', marginBottom: '8px' },
  statVal: { fontSize: '16px', fontWeight: 'bold', color: '#0f172a' },
  statLabel: { fontSize: '9px', color: '#64748b', marginTop: '2px' },
};

function SectionBlock({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function DataTable({ headers, rows }) {
  return (
    <table style={s.table}>
      <thead>
        <tr>{headers.map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
            {row.map((cell, j) => <td key={j} style={s.td}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={s.stat}>
      <div style={{ ...s.statVal, color: color || '#0f172a' }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function PrintTemplate({ report, project, sectionData }) {
  const enabledSections = (() => { try { return JSON.parse(report.enabledSections || '[]'); } catch { return []; } })();
  const has = (id) => enabledSections.length === 0 || enabledSections.includes(id);

  const { actionItems = [], risks = [], changeRequests = [], milestones = [], qualityGates = [], dsrs = [] } = sectionData;

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 86400000);
  const periodStart = parseISO(report.reportingPeriodStart);
  const periodEnd = parseISO(report.reportingPeriodEnd);
  const isInPeriod = (d) => { try { return isWithinInterval(parseISO(d), { start: periodStart, end: periodEnd }); } catch { return false; } };

  const openActions = actionItems.filter(a => !a.archived && a.status !== 'Done');
  const overdueActions = actionItems.filter(a => !a.archived && a.dueDate && new Date(a.dueDate) < now && a.status !== 'Done');
  const blockedActions = actionItems.filter(a => !a.archived && a.blocked);
  const activeRisks = risks.filter(r => r.status !== 'Closed');
  const criticalRisks = activeRisks.filter(r => r.riskLevel === 'Critical');
  const highRisks = activeRisks.filter(r => r.riskLevel === 'High');
  const openCRs = changeRequests.filter(cr => !['Closed', 'Rejected', 'Withdrawn'].includes(cr.status));
  const pendingCRs = changeRequests.filter(cr => cr.status === 'Pending Approval');
  const upcomingMilestones = milestones.filter(m => m.dueDate && new Date(m.dueDate) >= now && new Date(m.dueDate) <= in14Days);
  const weekDSRs = dsrs.filter(d => isInPeriod(d.reportDate));

  return (
    <div id="pdf-print-area" style={{ width: '794px', background: '#ffffff', color: '#1e293b', fontFamily: 'Arial, sans-serif', padding: '40px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #028090', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>Weekly Progress Report</div>
          <div style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>{project?.projectName || ''}</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{report.reportNumber} · CW{report.calendarWeek}/{report.year}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Reporting Period: {format(new Date(report.reportingPeriodStart), 'd MMM')} – {format(new Date(report.reportingPeriodEnd), 'd MMM yyyy')}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Prepared by: {report.preparedBy}</div>
          {report.reviewedBy && <div style={{ fontSize: '12px', color: '#64748b' }}>Reviewed by: {report.reviewedBy}</div>}
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>CONFIDENTIAL</div>
        </div>
      </div>

      {/* RAG */}
      {has('rag') && (
        <SectionBlock title="RAG Status">
          <div style={{ display: 'flex', gap: '10px' }}>
            {[['overallRag','Overall'],['scheduleRag','Schedule'],['costRag','Cost'],['riskRag','Risk'],['qualityRag','Quality']].map(([key, label]) => (
              <div key={key} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px', background: `${RAG_COLORS[report[key]] || '#64748b'}18`, border: `1px solid ${RAG_COLORS[report[key]] || '#64748b'}40` }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '20px' }}>{RAG_EMOJI[report[key]] || '⬜'}</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: RAG_COLORS[report[key]] || '#64748b', marginTop: '4px' }}>{report[key] || '—'}</div>
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Executive Summary */}
      {has('summary') && (
        <SectionBlock title="Executive Summary">
          {report.executiveSummary && <p style={{ fontSize: '12px', lineHeight: '1.7', color: '#334155', marginBottom: '12px' }}>{report.executiveSummary}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            {report.highlights && (
              <div style={{ flex: 1, padding: '10px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a', marginBottom: '4px' }}>✅ Highlights</div>
                <div style={{ fontSize: '11px', lineHeight: '1.6', color: '#334155' }}>{report.highlights}</div>
              </div>
            )}
            {report.concerns && (
              <div style={{ flex: 1, padding: '10px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626', marginBottom: '4px' }}>⚠️ Concerns</div>
                <div style={{ fontSize: '11px', lineHeight: '1.6', color: '#334155' }}>{report.concerns}</div>
              </div>
            )}
            {report.nextWeekFocus && (
              <div style={{ flex: 1, padding: '10px', borderRadius: '6px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>🔭 Next Week Focus</div>
                <div style={{ fontSize: '11px', lineHeight: '1.6', color: '#334155' }}>{report.nextWeekFocus}</div>
              </div>
            )}
          </div>
        </SectionBlock>
      )}

      {/* Schedule */}
      {has('schedule') && milestones.length > 0 && (
        <SectionBlock title="📅 Schedule Status">
          <DataTable
            headers={['Phase / Milestone', 'Status', 'Completion', 'Due Date']}
            rows={milestones.slice(0, 10).map(m => [m.phaseName, m.status, `${m.completionPercent || 0}%`, m.dueDate || '—'])}
          />
        </SectionBlock>
      )}

      {/* Action Tracker */}
      {has('actions') && (
        <SectionBlock title="📋 Action Tracker">
          <div style={{ marginBottom: '10px' }}>
            <Stat label="Total" value={actionItems.filter(a => !a.archived).length} />
            <Stat label="Open" value={openActions.length} color="#64748b" />
            <Stat label="Blocked" value={blockedActions.length} color="#ef4444" />
            <Stat label="Done" value={actionItems.filter(a => a.status === 'Done').length} color="#10b981" />
          </div>
          {overdueActions.length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>⚠️ Overdue ({overdueActions.length})</div>
              <DataTable
                headers={['Key', 'Title', 'Assignee', 'Due Date', 'Days Late']}
                rows={overdueActions.slice(0, 8).map(a => [
                  a.itemKey || '—', (a.title || '').slice(0, 45), a.assignee || '—', a.dueDate || '—',
                  `${Math.ceil((now - new Date(a.dueDate)) / 86400000)}d`
                ])}
              />
            </>
          )}
          {blockedActions.length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444', margin: '8px 0 4px' }}>🚫 Blocked</div>
              <DataTable
                headers={['Key', 'Title', 'Blocked Reason']}
                rows={blockedActions.slice(0, 5).map(a => [a.itemKey || '—', (a.title || '').slice(0, 40), (a.blockedReason || '—').slice(0, 60)])}
              />
            </>
          )}
        </SectionBlock>
      )}

      {/* Risk */}
      {has('risks') && (
        <SectionBlock title="⚠️ Risk Status">
          <div style={{ marginBottom: '10px' }}>
            <Stat label="Active" value={activeRisks.length} />
            <Stat label="Critical" value={criticalRisks.length} color="#ef4444" />
            <Stat label="High" value={highRisks.length} color="#f59e0b" />
            <Stat label="Closed" value={risks.filter(r => r.status === 'Closed').length} color="#10b981" />
          </div>
          {(criticalRisks.length > 0 || highRisks.length > 0) && (
            <DataTable
              headers={['ID', 'Description', 'Owner', 'Level', 'Status']}
              rows={[...criticalRisks, ...highRisks].slice(0, 8).map(r => [
                r.riskId || r.id?.slice(-4) || '—',
                (r.description || r.title || '').slice(0, 50),
                r.owner || r.riskOwner || '—',
                r.riskLevel || '—',
                r.status || '—'
              ])}
            />
          )}
        </SectionBlock>
      )}

      {/* Change Management */}
      {has('changes') && (
        <SectionBlock title="🔄 Change Management">
          <div style={{ marginBottom: '10px' }}>
            <Stat label="Total CRs" value={changeRequests.length} />
            <Stat label="Open" value={openCRs.length} color="#3b82f6" />
            <Stat label="Approved" value={changeRequests.filter(c => c.status?.startsWith('Approved')).length} color="#10b981" />
            <Stat label="Pending" value={pendingCRs.length} color="#f59e0b" />
          </div>
          {openCRs.length > 0 && (
            <DataTable
              headers={['CR#', 'Title', 'Category', 'Priority', 'Status']}
              rows={openCRs.slice(0, 8).map(cr => [cr.crNumber || '—', (cr.title || '').slice(0, 40), cr.category || '—', cr.priority || '—', cr.status || '—'])}
            />
          )}
        </SectionBlock>
      )}

      {/* Quality Gates */}
      {has('quality') && qualityGates.length > 0 && (
        <SectionBlock title="🚩 Quality Gates">
          <DataTable
            headers={['Gate', 'Name', 'Status', 'Decision Date']}
            rows={qualityGates.sort((a,b)=>a.gateNumber-b.gateNumber).map(g => [
              `QG${g.gateNumber}`, g.gateName,
              g.status === 'Passed' ? '✅ Passed' : g.status === 'Active' ? '🔴 Active' : g.status === 'Passed with Reserves' ? '⚠️ Reserves' : g.status || '—',
              g.decisionDate || '—'
            ])}
          />
        </SectionBlock>
      )}

      {/* Site Activity */}
      {has('site') && (
        <SectionBlock title="🏗️ Site Activity">
          <div style={{ marginBottom: '8px' }}>
            <Stat label="Reports Filed" value={weekDSRs.length} />
            <Stat label="Total Workers" value={weekDSRs.reduce((s,d)=>s+(d.totalWorkers||0),0)} color="#3b82f6" />
            <Stat label="Total Hours" value={weekDSRs.reduce((s,d)=>s+(d.totalHours||0),0)} color="#10b981" />
          </div>
          {weekDSRs.length === 0 && <p style={{ fontSize: '11px', color: '#64748b' }}>No daily site reports filed for this week.</p>}
        </SectionBlock>
      )}

      {/* 2-Week Look-Ahead */}
      {has('lookahead') && (upcomingMilestones.length > 0 || pendingCRs.length > 0) && (
        <SectionBlock title="🔭 2-Week Look-Ahead">
          {upcomingMilestones.length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Upcoming Milestones</div>
              <DataTable
                headers={['Phase / Milestone', 'Due Date', 'Status']}
                rows={upcomingMilestones.map(m => [m.phaseName, m.dueDate, m.status])}
              />
            </>
          )}
          {pendingCRs.length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b', margin: '8px 0 4px' }}>CRs Pending Approval</div>
              <DataTable
                headers={['CR#', 'Title', 'Priority']}
                rows={pendingCRs.map(cr => [cr.crNumber || '—', (cr.title || '').slice(0, 50), cr.priority || '—'])}
              />
            </>
          )}
        </SectionBlock>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '32px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
        <span>Generated {format(new Date(), 'dd MMM yyyy HH:mm')}</span>
        <span>CONFIDENTIAL — {project?.projectName || ''}</span>
      </div>
    </div>
  );
}

export default function ExportPdfButton({ report, project, size = 'sm' }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const projectId = report.projectId;
      const enabledSections = (() => { try { return JSON.parse(report.enabledSections || '[]'); } catch { return []; } })();
      const has = (id) => enabledSections.length === 0 || enabledSections.includes(id);

      // Fetch all section data in parallel
      const [actionItems, risks, changeRequests, milestones, qualityGates, dsrs] = await Promise.all([
        has('actions') || has('lookahead') ? base44.entities.ActionItem.filter({ projectId }) : Promise.resolve([]),
        has('risks') ? base44.entities.Risk.filter({ projectId }) : Promise.resolve([]),
        has('changes') || has('lookahead') ? base44.entities.ChangeRequest.filter({ projectId }) : Promise.resolve([]),
        has('schedule') || has('lookahead') ? base44.entities.Milestone.filter({ projectId }) : Promise.resolve([]),
        has('quality') ? base44.entities.QualityGate.filter({ projectId }) : Promise.resolve([]),
        has('site') ? base44.entities.DailySiteReport.filter({ projectId }) : Promise.resolve([]),
      ]);

      const sectionData = { actionItems, risks, changeRequests, milestones, qualityGates, dsrs };

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
      document.body.appendChild(container);

      const { createRoot } = await import('react-dom/client');
      const root = createRoot(container);

      await new Promise(resolve => {
        root.render(<PrintTemplate report={report} project={project} sectionData={sectionData} />);
        setTimeout(resolve, 800);
      });

      const element = container.querySelector('#pdf-print-area');
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let y = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let remaining = pdfHeight;

      while (remaining > 0) {
        if (y > 0) pdf.addPage();
        const sliceHeight = Math.min(pageHeight, remaining);
        const srcY = (y / pdfHeight) * canvas.height;
        const srcH = (sliceHeight / pdfHeight) * canvas.height;

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcH;
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, sliceHeight);
        y += pageHeight;
        remaining -= pageHeight;
      }

      pdf.save(`${report.reportNumber}-CW${report.calendarWeek}-${report.year}.pdf`);
      root.unmount();
      document.body.removeChild(container);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size={size} variant="outline" onClick={handleExport} disabled={loading} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
      {loading ? 'Generating...' : 'Export PDF'}
    </Button>
  );
}