import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import RolePermissionEditor from './RolePermissionEditor';

export default function RolesTab() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newRole, setNewRole] = useState({ role_name: '', role_type: 'Internal', description: '' });

  const { data: roles = [] } = useQuery({
    queryKey: ['platform-roles'],
    queryFn: () => base44.entities.PlatformRole.list(),
  });

  const createRole = useMutation({
    mutationFn: (data) => base44.entities.PlatformRole.create({ ...data, module_permissions: '[]', is_system_role: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-roles'] });
      setShowAdd(false);
      setNewRole({ role_name: '', role_type: 'Internal', description: '' });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: '#64748B' }}>
          Set what each role can do per module — View, Create, Edit, Delete, Export, Approve — and its data scope.
        </p>
        <Button onClick={() => setShowAdd((s) => !s)} size="sm"
          style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
          <Plus className="w-4 h-4 mr-1" /> New Role
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(0,168,150,0.3)' }}>
          <div className="text-sm font-semibold" style={{ color: '#00A896' }}>New Role</div>
          <div className="flex gap-3 flex-wrap">
            <Input value={newRole.role_name} onChange={(e) => setNewRole((n) => ({ ...n, role_name: e.target.value }))} placeholder="Role name"
              className="flex-1 min-w-40" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
            <Select value={newRole.role_type} onValueChange={(v) => setNewRole((n) => ({ ...n, role_type: v }))}>
              <SelectTrigger className="w-40" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                {['Internal', 'External'].map((t) => <SelectItem key={t} value={t} style={{ color: '#CADCFC' }}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input value={newRole.description} onChange={(e) => setNewRole((n) => ({ ...n, description: e.target.value }))} placeholder="Description (optional)"
            style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          <div className="flex justify-end">
            <Button onClick={() => createRole.mutate(newRole)} disabled={!newRole.role_name || createRole.isPending}
              style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
              {createRole.isPending ? 'Creating…' : 'Create Role'}
            </Button>
          </div>
        </div>
      )}

      {roles.map((role) => <RolePermissionEditor key={role.id} role={role} />)}
    </div>
  );
}
