import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Lock, Pencil, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { MODULES, PERMISSION_ACTIONS, modulesByGroup } from '@/lib/modules';
import { parseRolePermissions, serializeRolePermissions, emptyPermission } from '@/lib/permissions';

const SCOPES = ['All', 'Own Org', 'Assigned Projects', 'None'];

/**
 * Per-role permission editor. In view mode it renders the current matrix;
 * in edit mode admins toggle View/Create/Edit/Delete/Export/Approve per module
 * (plus a data scope) and save it back to the role's module_permissions.
 */
export default function RolePermissionEditor({ role }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [draft, setDraft] = useState(() => parseRolePermissions(role));

  const groups = useMemo(() => modulesByGroup(), []);

  const saveMutation = useMutation({
    mutationFn: (permMap) =>
      base44.entities.PlatformRole.update(role.id, {
        module_permissions: serializeRolePermissions(permMap),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-roles'] });
      qc.invalidateQueries({ queryKey: ['session-role'] });
      setEditing(false);
    },
  });

  const startEdit = () => {
    setDraft(parseRolePermissions(role));
    setEditing(true);
    setCollapsed(false);
  };

  const permFor = (label) => draft[label] || emptyPermission();

  const toggle = (label, actionKey) => {
    setDraft((d) => {
      const current = d[label] || emptyPermission();
      return { ...d, [label]: { ...current, [actionKey]: !current[actionKey] } };
    });
  };

  const setScope = (label, value) => {
    setDraft((d) => ({ ...d, [label]: { ...(d[label] || emptyPermission()), data_scope: value } }));
  };

  const grantedCount = MODULES.filter((m) => (draft[m.label] || {}).can_view).length;

  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(202,220,252,0.1)' }}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <button className="flex items-center gap-2 text-left" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <ChevronRight className="w-4 h-4" style={{ color: '#64748B' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#64748B' }} />}
          <span className="font-semibold text-sm" style={{ color: '#CADCFC' }}>{role.role_name}</span>
          {role.is_system_role && <Lock className="w-3 h-3" style={{ color: '#475569' }} />}
          <span className={`text-xs px-2 py-0.5 rounded-full border ${role.role_type === 'Internal' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
            {role.role_type}
          </span>
          <span className="text-xs" style={{ color: '#64748B' }}>· {grantedCount} modules visible</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {!editing ? (
            <Button size="sm" variant="outline" onClick={startEdit}
              style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}
                style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate(draft)} disabled={saveMutation.isPending}
                style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
                <Save className="w-3.5 h-3.5 mr-1" /> {saveMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>
      {role.description && !collapsed && <div className="text-xs mb-3" style={{ color: '#64748B' }}>{role.description}</div>}

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left pb-2 pr-4 sticky left-0" style={{ color: '#475569' }}>Module</th>
                {PERMISSION_ACTIONS.map((a) => <th key={a.key} className="text-center pb-2 px-1" style={{ color: '#475569' }}>{a.label}</th>)}
                <th className="text-left pb-2 pl-2" style={{ color: '#475569' }}>Scope</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groups).map(([groupName, mods]) => (
                <Fragment key={groupName}>
                  <tr>
                    <td colSpan={PERMISSION_ACTIONS.length + 2} className="pt-3 pb-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#00A896' }}>
                      {groupName}
                    </td>
                  </tr>
                  {mods.map((m) => {
                    const p = permFor(m.label);
                    return (
                      <tr key={m.page} style={{ borderTop: '1px solid rgba(202,220,252,0.05)' }}>
                        <td className="py-1.5 pr-4 whitespace-nowrap" style={{ color: p.can_view ? '#CADCFC' : '#64748B' }}>{m.label}</td>
                        {PERMISSION_ACTIONS.map((a) => (
                          <td key={a.key} className="text-center py-1.5 px-1">
                            <input
                              type="checkbox"
                              checked={!!p[a.key]}
                              disabled={!editing}
                              onChange={() => toggle(m.label, a.key)}
                              className="accent-teal-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-default"
                            />
                          </td>
                        ))}
                        <td className="py-1.5 pl-2">
                          {editing ? (
                            <select
                              value={p.data_scope || 'All'}
                              onChange={(e) => setScope(m.label, e.target.value)}
                              className="text-xs rounded px-1 py-0.5"
                              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(202,220,252,0.15)', color: '#CADCFC' }}
                            >
                              {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span style={{ color: '#64748B' }}>{p.data_scope || '—'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
