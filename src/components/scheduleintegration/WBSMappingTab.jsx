import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2 } from 'lucide-react';

const WORKSTREAMS = ['NMC Cylindrical', 'Na Electrode', 'NMC Flexible', 'Common/Shared', 'Building/LDC', 'PMO'];
const QUALITY_GATES = ['QG0', 'QG1', 'QG2', 'QG3', 'QG4', 'QG5', 'QG6'];

export default function WBSMappingTab({ projectId }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('unmapped');

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['wbsMappings', projectId],
    queryFn: () => base44.entities.WBSMapping.filter({ projectId }),
    enabled: !!projectId,
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['scheduleSources', projectId],
    queryFn: () => base44.entities.ScheduleSource.filter({ projectId }),
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WBSMapping.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wbsMappings', projectId] }),
  });

  const sourceMap = Object.fromEntries(sources.map(s => [s.id, s]));
  const filtered = filter === 'unmapped' ? mappings.filter(m => !m.isMapped) : mappings;

  if (isLoading) return <div className="flex justify-center pt-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#64748b' }} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: '#CADCFC' }}>⚙️ WBS Mapping</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#64748b' }}>
            {mappings.filter(m => m.isMapped).length}/{mappings.length} mapped
          </span>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ background: 'rgba(30,39,97,0.6)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }}
          >
            <option value="unmapped">Unmapped only</option>
            <option value="all">All mappings</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <CheckCircle2 className="w-10 h-10" style={{ color: '#10b981' }} />
          <p className="text-sm" style={{ color: '#64748b' }}>All WBS codes are mapped!</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'rgba(30,39,97,0.6)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
                {['Source', 'External WBS', 'External Name', 'Unified WBS Code', 'Workstream', 'Quality Gate', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider" style={{ color: '#64748b', fontSize: '0.65rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(30,39,97,0.2)', borderBottom: '1px solid rgba(202,220,252,0.05)' }}>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6' }}>
                      {sourceMap[m.sourceId]?.sourceType === 'Primavera P6' ? 'P6' : 'MSP'}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: '#94A3B8' }}>
                    {!m.isMapped && <span className="mr-1" style={{ color: '#f59e0b' }}>⚠️</span>}
                    {m.externalWbsCode}
                  </td>
                  <td className="px-3 py-2" style={{ color: '#64748b' }}>{m.externalWbsName}</td>
                  <td className="px-3 py-2">
                    <input
                      value={m.unifiedWbsCode || ''}
                      onChange={e => updateMutation.mutate({ id: m.id, data: { unifiedWbsCode: e.target.value } })}
                      className="w-24 px-2 py-1 rounded text-xs"
                      style={{ background: 'rgba(30,39,97,0.8)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }}
                      placeholder="e.g. 5.1.1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={m.workstream || ''}
                      onChange={e => updateMutation.mutate({ id: m.id, data: { workstream: e.target.value, isMapped: !!e.target.value } })}
                      className="text-xs px-1.5 py-1 rounded"
                      style={{ background: 'rgba(30,39,97,0.8)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }}
                    >
                      <option value="">—</option>
                      {WORKSTREAMS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={m.qualityGate || ''}
                      onChange={e => updateMutation.mutate({ id: m.id, data: { qualityGate: e.target.value } })}
                      className="text-xs px-1.5 py-1 rounded"
                      style={{ background: 'rgba(30,39,97,0.8)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }}
                    >
                      <option value="">—</option>
                      {QUALITY_GATES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {m.isMapped ? <CheckCircle2 className="w-4 h-4" style={{ color: '#10b981' }} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}