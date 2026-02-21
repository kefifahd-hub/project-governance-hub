import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Upload, BarChart2, RefreshCw, Settings } from 'lucide-react';
import { format } from 'date-fns';
import SourceCard from '@/components/scheduleintegration/SourceCard';
import ImportPreviewModal from '@/components/scheduleintegration/ImportPreviewModal';
import SyncHistoryTab from '@/components/scheduleintegration/SyncHistoryTab';
import ScheduleOverviewTab from '@/components/scheduleintegration/ScheduleOverviewTab';
import DeltaTab from '@/components/scheduleintegration/DeltaTab';
import WBSMappingTab from '@/components/scheduleintegration/WBSMappingTab';
import RegisterSourceModal from '@/components/scheduleintegration/RegisterSourceModal';
import { parseScheduleFile, generateDeltas } from '@/components/scheduleintegration/scheduleParser';

const TABS = [
  { id: 'import', label: '📥 Import / Sync' },
  { id: 'overview', label: '📊 Schedule Overview' },
  { id: 'deltas', label: '🔄 Delta Report' },
  { id: 'history', label: '📋 Sync History' },
  { id: 'mapping', label: '⚙️ WBS Mapping' },
];

export default function ScheduleSync() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState('import');
  const [uploading, setUploading] = useState(null); // sourceId being uploaded
  const [preview, setPreview] = useState(null); // { source, fileName, parsed, deltas }
  const [confirming, setConfirming] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ['scheduleSources', projectId],
    queryFn: () => base44.entities.ScheduleSource.filter({ projectId }),
    enabled: !!projectId,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['scheduleVersions', projectId],
    queryFn: () => base44.entities.ScheduleVersion.filter({ projectId }, '-importDate'),
    enabled: !!projectId,
  });

  async function handleUpload(source, file) {
    setUploading(source.id);
    try {
      const parsed = await parseScheduleFile(file);

      // Get previous version tasks for delta
      const prevVersions = versions.filter(v => v.sourceId === source.id && v.isCurrent);
      let prevTasks = [];
      if (prevVersions.length > 0) {
        prevTasks = await base44.entities.ScheduleTask.filter({ versionId: prevVersions[0].id });
      }

      const deltas = generateDeltas(prevTasks, parsed.tasks);
      setPreview({ source, fileName: file.name, parsed: parsed.summary, tasks: parsed.tasks, deltas });
    } catch (err) {
      alert(`Parse error: ${err.message}`);
    } finally {
      setUploading(null);
    }
  }

  async function handleConfirmImport() {
    if (!preview) return;
    setConfirming(true);
    try {
      const { source, fileName, parsed, tasks, deltas } = preview;

      // Upload the file
      const fileBlob = new Blob([JSON.stringify({ tasks, summary: parsed })], { type: 'application/json' });
      const fileObj = new File([fileBlob], fileName);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: fileObj });

      // Mark old versions as not current
      const oldVersions = versions.filter(v => v.sourceId === source.id && v.isCurrent);
      for (const ov of oldVersions) {
        await base44.entities.ScheduleVersion.update(ov.id, { isCurrent: false });
      }

      // Create new version
      const versionNum = `V${String(versions.filter(v => v.sourceId === source.id).length + 1).padStart(3, '0')}`;
      const newVersion = await base44.entities.ScheduleVersion.create({
        sourceId: source.id,
        projectId,
        versionNumber: versionNum,
        importDate: new Date().toISOString(),
        dataDate: parsed.dataDate || null,
        fileUrl: file_url,
        fileName,
        taskCount: parsed.taskCount,
        milestoneCount: parsed.milestoneCount,
        wbsLevels: parsed.wbsLevels,
        projectStart: parsed.projectStart || null,
        projectFinish: parsed.projectFinish || null,
        criticalPathLength: parsed.criticalPathLength,
        totalFloatMin: parsed.totalFloatMin,
        importStatus: 'Complete',
        importLog: parsed.importLog,
        isCurrent: true,
        isBaseline: oldVersions.length === 0, // first import is baseline
        baselineLabel: oldVersions.length === 0 ? 'Original Baseline' : null,
        deltaCount: deltas.length,
        criticalDeltaCount: deltas.filter(d => d.impactLevel === 'Critical').length,
      });

      // Bulk create tasks (in batches to avoid timeout)
      const batchSize = 50;
      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize).map(t => ({
          ...t,
          versionId: newVersion.id,
          sourceId: source.id,
          projectId,
          isMapped: false,
        }));
        await base44.entities.ScheduleTask.bulkCreate(batch);
      }

      // Create WBS mappings for unmapped WBS codes
      const wbsCodes = [...new Set(tasks.map(t => t.externalWbs).filter(Boolean))];
      const existingMappings = await base44.entities.WBSMapping.filter({ projectId, sourceId: source.id });
      const mappedCodes = new Set(existingMappings.map(m => m.externalWbsCode));
      const newWbs = wbsCodes.filter(code => !mappedCodes.has(code));
      if (newWbs.length > 0) {
        await base44.entities.WBSMapping.bulkCreate(newWbs.map(code => ({
          projectId,
          sourceId: source.id,
          externalWbsCode: code,
          externalWbsName: tasks.find(t => t.externalWbs === code)?.taskName || code,
          unifiedWbsCode: '',
          isMapped: false,
          autoMapped: false,
        })));
      }

      // Create deltas
      if (deltas.length > 0) {
        const fromVersionId = oldVersions[0]?.id;
        const deltaBatch = deltas.map(d => ({
          ...d,
          sourceId: source.id,
          projectId,
          fromVersionId: fromVersionId || null,
          toVersionId: newVersion.id,
          acknowledged: false,
        }));
        for (let i = 0; i < deltaBatch.length; i += 50) {
          await base44.entities.ScheduleDelta.bulkCreate(deltaBatch.slice(i, i + 50));
        }
      }

      // Update source metadata
      await base44.entities.ScheduleSource.update(source.id, {
        lastSyncDate: new Date().toISOString(),
        lastSyncStatus: 'Success',
        dataDate: parsed.dataDate || null,
        taskCount: parsed.taskCount,
        baselineCount: oldVersions.length === 0 ? 1 : source.baselineCount,
      });

      qc.invalidateQueries({ queryKey: ['scheduleSources', projectId] });
      qc.invalidateQueries({ queryKey: ['scheduleVersions', projectId] });
      qc.invalidateQueries({ queryKey: ['scheduleTasks', projectId] });
      qc.invalidateQueries({ queryKey: ['scheduleDeltas', projectId] });
      qc.invalidateQueries({ queryKey: ['wbsMappings', projectId] });

      setPreview(null);
      setActiveTab('overview');
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  }

  if (!projectId) {
    return <div className="p-8 text-center" style={{ color: '#64748b' }}>Please select a project first.</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E2761 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#CADCFC' }}>Schedule Integration</h1>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>P6 + Microsoft Project → Unified Master Schedule</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 flex-wrap" style={{ borderBottom: '1px solid rgba(202,220,252,0.1)', paddingBottom: '0' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all"
              style={{
                background: activeTab === tab.id ? 'rgba(0,168,150,0.15)' : 'transparent',
                color: activeTab === tab.id ? '#00A896' : '#94A3B8',
                borderBottom: activeTab === tab.id ? '2px solid #00A896' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'import' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold" style={{ color: '#CADCFC' }}>Schedule Sources</h2>
                <Button size="sm" onClick={() => setShowRegister(true)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                  <Plus className="w-4 h-4 mr-1" /> Register Source
                </Button>
              </div>

              {sourcesLoading ? (
                <div className="flex justify-center pt-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#64748b' }} /></div>
              ) : sources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl" style={{ border: '1px dashed rgba(202,220,252,0.15)' }}>
                  <span className="text-5xl">📅</span>
                  <p className="text-sm" style={{ color: '#64748b' }}>No schedule sources registered yet.</p>
                  <Button onClick={() => setShowRegister(true)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                    <Plus className="w-4 h-4 mr-2" /> Register First Source
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sources.map(source => (
                    <SourceCard key={source.id} source={source} uploading={uploading} onUpload={handleUpload} />
                  ))}
                </div>
              )}

              {/* Integration model info */}
              <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(30,39,97,0.3)', border: '1px solid rgba(202,220,252,0.08)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>INTEGRATION MODEL</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs" style={{ color: '#64748b' }}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">🏗️</span>
                    <div><div className="font-medium" style={{ color: '#94A3B8' }}>Primavera P6 (LDC)</div><div>Construction, civil, MEP works. Upload .XER or .XML weekly.</div></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">📋</span>
                    <div><div className="font-medium" style={{ color: '#94A3B8' }}>Microsoft Project (PMO)</div><div>FEED, procurement, PMO milestones. Upload .MPP as XML or .XML.</div></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">🔒</span>
                    <div><div className="font-medium" style={{ color: '#94A3B8' }}>One-way sync only</div><div>Base44 reads P6/MSP — never writes back. Planner's tool remains the source of truth.</div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && <ScheduleOverviewTab projectId={projectId} />}
          {activeTab === 'deltas' && <DeltaTab projectId={projectId} />}
          {activeTab === 'history' && <SyncHistoryTab projectId={projectId} />}
          {activeTab === 'mapping' && <WBSMappingTab projectId={projectId} />}
        </div>
      </div>

      {/* Modals */}
      {preview && (
        <ImportPreviewModal
          preview={preview}
          onConfirm={handleConfirmImport}
          onCancel={() => setPreview(null)}
          confirming={confirming}
        />
      )}
      {showRegister && <RegisterSourceModal projectId={projectId} onClose={() => setShowRegister(false)} />}
    </div>
  );
}