import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Lock } from 'lucide-react';

const PERM_KEYS = ['can_view','can_create','can_edit','can_delete','can_export','can_approve'];
const PERM_LABELS = { can_view:'View', can_create:'Create', can_edit:'Edit', can_delete:'Delete', can_export:'Export', can_approve:'Approve' };

export default function RolesTab() {
  const { data: roles = [] } = useQuery({
    queryKey: ['platform-roles'],
    queryFn: () => base44.entities.PlatformRole.list(),
  });

  return (
    <div className="space-y-4">
      {roles.map(role => {
        let perms = [];
        try { perms = JSON.parse(role.module_permissions || '[]'); } catch {}
        return (
          <div key={role.id} className="rounded-xl p-4" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(202,220,252,0.1)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: '#CADCFC' }}>{role.role_name}</span>
                  {role.is_system_role && <Lock className="w-3 h-3" style={{ color: '#475569' }} />}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${role.role_type === 'Internal' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                    {role.role_type}
                  </span>
                </div>
                {role.description && <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{role.description}</div>}
              </div>
            </div>
            {perms.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left pb-1 pr-4" style={{ color: '#475569' }}>Module</th>
                      {PERM_KEYS.map(k => <th key={k} className="text-center pb-1 px-1" style={{ color: '#475569' }}>{PERM_LABELS[k]}</th>)}
                      <th className="text-left pb-1 pl-2" style={{ color: '#475569' }}>Scope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perms.map(p => (
                      <tr key={p.module} style={{ borderTop: '1px solid rgba(202,220,252,0.05)' }}>
                        <td className="py-1 pr-4" style={{ color: p.can_view ? '#94A3B8' : '#334155' }}>{p.module}</td>
                        {PERM_KEYS.map(k => (
                          <td key={k} className="text-center py-1 px-1">
                            {p[k] === true
                              ? <CheckCircle className="w-3 h-3 text-green-400 inline" />
                              : p[k] === false
                              ? <XCircle className="w-3 h-3 text-red-500/40 inline" />
                              : <span style={{ color: '#334155' }}>—</span>}
                          </td>
                        ))}
                        <td className="py-1 pl-2 text-xs" style={{ color: '#64748B' }}>{p.data_scope || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}