import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Briefcase, Archive, Trash2, ArrowRightLeft, Plus, X } from 'lucide-react';
import { createPageUrl } from '@/utils';

const STATUS_COLOR = {
  Active: '#34d399',
  'On Hold': '#F59E0B',
  Completed: '#60A5FA',
  Cancelled: '#94A3B8',
};

const PROJECT_TYPES = [
  'Battery Gigafactory', 'Data Center', 'Energy Storage (BESS)', 'Mining & Minerals',
  'Steel & Metals', 'Oil & Gas', 'Chemicals & Process', 'Renewables (Solar / Wind)',
  'Semiconductor Fab', 'Pharma & Biotech', 'Infrastructure & Utilities', 'Other',
];
const PROJECT_PHASES = [
  'Feasibility', 'Pre-FEED', 'FEED', 'Investment Decision', 'Project Setup',
  'Detailed Engineering', 'Procurement', 'Construction', 'Commissioning', 'SOP',
];

export default function OrgProjectManager({ org, projects, allProjects, orgs }) {
  const [showAssign, setShowAssign] = useState(false);
  const [assignId, setAssignId] = useState('');
  const [moveTarget, setMoveTarget] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [newProj, setNewProj] = useState({ projectName: '', clientName: '', projectType: 'Other', currentPhase: 'Feasibility' });
  const qc = useQueryClient();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['all-projects-admin'] });
    qc.invalidateQueries({ queryKey: ['projects'] });
    qc.invalidateQueries({ queryKey: ['auditlogs'] });
  };

  const writeAudit = (entry) => {
    base44.entities.AuditLog.create({
      user_id: me?.id,
      user_name: me?.full_name || me?.email,
      org_id: org.id,
      org_name: org.name,
      timestamp: new Date().toISOString(),
      ...entry,
    }).catch(() => {});
  };

  const assignMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.update(id, { org_id: org.id }),
    onSuccess: (_data, id) => {
      const p = allProjects.find((x) => x.id === id);
      const fromOrg = p?.org_id && orgs.find((o) => o.id === p.org_id)?.name;
      writeAudit({
        action: 'Update', module: 'Project Assignment', record_type: 'Project',
        record_id: id, record_name: p?.projectName,
        details: fromOrg ? `Moved from ${fromOrg} to ${org.name}` : `Assigned to ${org.name}`,
      });
      invalidate(); setShowAssign(false); setAssignId('');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.update(id, { status: 'On Hold' }),
    onSuccess: (_data, id) => {
      const p = allProjects.find((x) => x.id === id);
      writeAudit({
        action: 'Update', module: 'Project Archive', record_type: 'Project',
        record_id: id, record_name: p?.projectName, details: 'Set to On Hold',
      });
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: (_data, id) => {
      const p = allProjects.find((x) => x.id === id);
      writeAudit({
        action: 'Delete', module: 'Project Delete', record_type: 'Project',
        record_id: id, record_name: p?.projectName, details: 'Permanently deleted',
      });
      invalidate();
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create({ ...data, org_id: org.id, status: 'Active' }),
    onSuccess: (created) => {
      writeAudit({
        action: 'Create', module: 'Project Create', record_type: 'Project',
        record_id: created.id, record_name: created.projectName,
        details: `Created project in ${org.name}`,
      });
      invalidate();
      setShowCreate(false);
      setNewProj({ projectName: '', clientName: '', projectType: 'Other', currentPhase: 'Feasibility' });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, targetOrgId }) => base44.entities.Project.update(id, { org_id: targetOrgId }),
    onSuccess: (_data, { id, targetOrgId }) => {
      const p = allProjects.find((x) => x.id === id);
      const targetName = orgs.find((o) => o.id === targetOrgId)?.name;
      writeAudit({
        action: 'Update', module: 'Project Move', record_type: 'Project',
        record_id: id, record_name: p?.projectName, details: `Moved from ${org.name} to ${targetName}`,
      });
      invalidate();
    },
  });

  const otherOrgs = orgs.filter((o) => o.id !== org.id);
  // Buildmind (as owner) can bring in projects from other domains or unassigned ones.
  // A project always belongs to exactly one domain — assigning it here relocates it.
  const assignable = allProjects
    .filter((p) => p.org_id !== org.id)
    .sort((a, b) => (a.org_id ? 0 : -1) - (b.org_id ? 0 : -1) || a.projectName.localeCompare(b.projectName));

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
          Projects ({projects.length})
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowCreate((s) => !s); setShowAssign(false); }}
            style={{ borderColor: 'rgba(0,168,150,0.4)', color: '#00A896' }}>
            <Plus className="w-3 h-3 mr-1" /> New Project
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowAssign((s) => !s); setShowCreate(false); }}
            style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>
            <ArrowRightLeft className="w-3 h-3 mr-1" /> Assign Existing
          </Button>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-lg p-3 mb-2 space-y-2"
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(0,168,150,0.25)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Project name *</label>
              <Input value={newProj.projectName} onChange={e => setNewProj(n => ({ ...n, projectName: e.target.value }))}
                placeholder="e.g. Battery Plant Phase 2"
                style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Client name *</label>
              <Input value={newProj.clientName} onChange={e => setNewProj(n => ({ ...n, clientName: e.target.value }))}
                placeholder="e.g. Acme Energy"
                style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Project type *</label>
              <Select value={newProj.projectType} onValueChange={v => setNewProj(n => ({ ...n, projectType: v }))}>
                <SelectTrigger style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                  {PROJECT_TYPES.map(t => <SelectItem key={t} value={t} style={{ color: '#CADCFC' }}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Current phase *</label>
              <Select value={newProj.currentPhase} onValueChange={v => setNewProj(n => ({ ...n, currentPhase: v }))}>
                <SelectTrigger style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                  {PROJECT_PHASES.map(ph => <SelectItem key={ph} value={ph} style={{ color: '#CADCFC' }}>{ph}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} style={{ color: '#64748B' }}>Cancel</Button>
            <Button size="sm"
              disabled={!newProj.projectName || !newProj.clientName || createProjectMutation.isPending}
              onClick={() => createProjectMutation.mutate(newProj)}
              style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
              {createProjectMutation.isPending ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </div>
      )}

      {showAssign && (
        <div className="rounded-lg p-3 mb-2 flex flex-wrap items-center gap-2"
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(0,168,150,0.25)' }}>
          <Select value={assignId} onValueChange={setAssignId}>
            <SelectTrigger className="flex-1 min-w-[200px]"
              style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
              <SelectValue placeholder="Select a project to assign…" />
            </SelectTrigger>
            <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
              {assignable.length === 0 && (
                <SelectItem value="__none__" disabled style={{ color: '#64748B' }}>No projects available</SelectItem>
              )}
              {assignable.map((p) => (
                <SelectItem key={p.id} value={p.id} style={{ color: '#CADCFC' }}>
                  {p.projectName}
                  <span className="text-xs ml-2" style={{ color: '#64748B' }}>
                    {p.org_id ? `· ${orgs.find((o) => o.id === p.org_id)?.name || 'other domain'}` : '· unassigned'}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!assignId || assignMutation.isPending}
            onClick={() => {
              const p = allProjects.find((x) => x.id === assignId);
              const fromOrg = p?.org_id && orgs.find((o) => o.id === p.org_id)?.name;
              if (fromOrg && !window.confirm(`"${p.projectName}" currently belongs to ${fromOrg}. Move it to ${org.name}?`)) return;
              assignMutation.mutate(assignId);
            }}
            style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
            {assignMutation.isPending ? 'Assigning…' : 'Assign'}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setShowAssign(false); setAssignId(''); }}
            style={{ color: '#64748B' }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-xs py-2" style={{ color: '#64748B' }}>No projects in this domain yet.</div>
      ) : (
        projects.map((p) => (
          <div key={p.id} className="rounded-lg p-2.5 mb-1.5 flex flex-wrap items-center gap-2"
            style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(202,220,252,0.08)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(202,220,252,0.1)', color: '#CADCFC' }}>
              <Briefcase className="w-3 h-3" />
            </div>
            <a href={createPageUrl(`Home?id=${p.id}`)} className="text-sm hover:underline" style={{ color: '#CADCFC' }}>
              {p.projectName}
            </a>
            <span className="text-xs" style={{ color: '#64748B' }}>{p.currentPhase}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(202,220,252,0.08)', color: STATUS_COLOR[p.status] || '#94A3B8' }}>
              {p.status}
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              {/* Move to another domain */}
              {otherOrgs.length > 0 && (
                <Select
                  value={moveTarget[p.id] || ''}
                  onValueChange={(v) => {
                    setMoveTarget((m) => ({ ...m, [p.id]: v }));
                    if (window.confirm(`Move "${p.projectName}" to ${orgs.find((o) => o.id === v)?.name}?`)) {
                      moveMutation.mutate({ id: p.id, targetOrgId: v });
                    }
                  }}
                >
                  <SelectTrigger className="h-7 w-[130px] text-xs"
                    style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.15)', color: '#94A3B8' }}>
                    <ArrowRightLeft className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Move to…" />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                    {otherOrgs.map((o) => (
                      <SelectItem key={o.id} value={o.id} style={{ color: '#CADCFC' }}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Archive */}
              <Button variant="ghost" size="icon" title="Archive (set On Hold)"
                disabled={archiveMutation.isPending}
                onClick={() => {
                  if (window.confirm(`Archive "${p.projectName}"? It will be set to On Hold.`)) {
                    archiveMutation.mutate(p.id);
                  }
                }}
                style={{ color: '#F59E0B' }}>
                <Archive className="w-3.5 h-3.5" />
              </Button>

              {/* Delete */}
              <Button variant="ghost" size="icon" title="Delete permanently"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm(`Permanently delete "${p.projectName}"? This cannot be undone.`)) {
                    deleteMutation.mutate(p.id);
                  }
                }}
                style={{ color: '#EF4444' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}