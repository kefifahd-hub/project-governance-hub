import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const RAG_COLORS = { Green: '#10b981', Amber: '#f59e0b', Red: '#ef4444' };
const RAG_EMOJI = { Green: '🟢', Amber: '🟡', Red: '🔴' };

function PrintTemplate({ report, project }) {
  const enabledSections = (() => { try { return JSON.parse(report.enabledSections || '[]'); } catch { return []; } })();

  return (
    <div id="pdf-print-area" style={{ width: '794px', background: '#ffffff', color: '#1e293b', fontFamily: 'Arial, sans-serif', padding: '40px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #028090', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>Weekly Progress Report</div>
          <div style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>{project?.projectName || ''}</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            {report.reportNumber} · CW{report.calendarWeek}/{report.year}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Reporting Period: {format(new Date(report.reportingPeriodStart), 'd MMM')} – {format(new Date(report.reportingPeriodEnd), 'd MMM yyyy')}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Prepared by: {report.preparedBy}</div>
          {report.reviewedBy && <div style={{ fontSize: '12px', color: '#64748b' }}>Reviewed by: {report.reviewedBy}</div>}
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>CONFIDENTIAL</div>
        </div>
      </div>

      {/* RAG */}
      {(enabledSections.length === 0 || enabledSections.includes('rag')) && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px', borderLeft: '3px solid #028090', paddingLeft: '8px' }}>RAG Status</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { key: 'overallRag', label: 'Overall' },
              { key: 'scheduleRag', label: 'Schedule' },
              { key: 'costRag', label: 'Cost' },
              { key: 'riskRag', label: 'Risk' },
              { key: 'qualityRag', label: 'Quality' },
            ].map(({ key, label }) => (
              <div key={key} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px', background: `${RAG_COLORS[report[key]] || '#64748b'}18`, border: `1px solid ${RAG_COLORS[report[key]] || '#64748b'}40` }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '20px' }}>{RAG_EMOJI[report[key]] || '⬜'}</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: RAG_COLORS[report[key]] || '#64748b', marginTop: '4px' }}>{report[key] || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {(enabledSections.length === 0 || enabledSections.includes('summary')) && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px', borderLeft: '3px solid #028090', paddingLeft: '8px' }}>Executive Summary</div>
          {report.executiveSummary && (
            <p style={{ fontSize: '12px', lineHeight: '1.7', color: '#334155', marginBottom: '12px' }}>{report.executiveSummary}</p>
          )}
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
        </div>
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
  const containerRef = useRef(null);

  async function handleExport() {
    setLoading(true);
    try {
      // Create off-screen container
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
      document.body.appendChild(container);

      // Render the template using a simple approach
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(container);

      await new Promise(resolve => {
        root.render(<PrintTemplate report={report} project={project} />);
        setTimeout(resolve, 500);
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
      Export PDF
    </Button>
  );
}