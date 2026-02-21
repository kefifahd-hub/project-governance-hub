import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Building2, Shield, ClipboardList, Plus, Search } from 'lucide-react';
import OrgCard from '../components/useraccess/OrgCard';
import OrgDetailPanel from '../components/useraccess/OrgDetailPanel';
import UserRow from '../components/useraccess/UserRow';
import InviteUserModal from '../components/useraccess/InviteUserModal';
import AuditLogTab from '../components/useraccess/AuditLogTab';
import RolesTab from '../components/useraccess/RolesTab';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'orgs', label: 'Organizations', icon: Building2 },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'audit', label: 'Audit Log', icon: ClipboardList },
];

export default function UserAccess() {
  const [activeTab, setActiveTab] = useState('users');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', org_type: 'Internal' });
  const qc = useQueryClient();

  const { data: orgs = [] } = useQuery({ queryKey: ['orgs'], queryFn: () => base44.entities.Organization.list() });
  const { data: users = [] } = useQuery({ queryKey: ['platform-users'], queryFn: () => base44.entities.PlatformUser.list() });
  const { data: roles = [] } = useQuery({ queryKey: ['platform-roles'], queryFn: () => base44.entities.PlatformRole.list() });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlatformUser.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-users'] }),
  });

  const createOrgMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orgs'] }); setShowAddOrg(false); setNewOrg({ name: '', org_type: 'Internal' }); },
  });

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchOrg = orgFilter === 'all' || u.org_id === orgFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active);
    return matchSearch && matchOrg && matchStatus;
  });

  const orgUserCounts = users.reduce((acc, u) => { acc[u.org_id] = (acc[u.org_id] || 0) + 1; return acc; }, {});

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E2761 100%)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#CADCFC' }}>👥 Users & Access</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            Manage organizations, users, roles and permissions across the platform.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Organizations', value: orgs.length, sub: `${orgs.filter(o => o.is_active).length} active` },
            { label: 'Users', value: users.length, sub: `${users.filter(u => u.is_active).length} active` },
            { label: 'Roles', value: roles.length, sub: 'system-defined' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(202,220,252,0.1)' }}>
              <div className="text-2xl font-bold" style={{ color: '#00A896' }}>{s.value}</div>
              <div className="text-sm font-medium" style={{ color: '#CADCFC' }}>{s.label}</div>
              <div className="text-xs" style={{ color: '#64748B' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'rgba(30,41,59,0.6)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: active ? 'rgba(0,168,150,0.2)' : 'transparent', color: active ? '#00A896' : '#64748B' }}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#64748B' }} />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
                  className="pl-8 w-48" style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
              </div>
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger className="w-44" style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                  <SelectValue placeholder="All Orgs" />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                  <SelectItem value="all" style={{ color: '#CADCFC' }}>All Organizations</SelectItem>
                  {orgs.map(o => <SelectItem key={o.id} value={o.id} style={{ color: '#CADCFC' }}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                  <SelectItem value="all" style={{ color: '#CADCFC' }}>All Status</SelectItem>
                  <SelectItem value="active" style={{ color: '#CADCFC' }}>Active</SelectItem>
                  <SelectItem value="inactive" style={{ color: '#CADCFC' }}>Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowInvite(true)} className="ml-auto"
                style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
                <Plus className="w-4 h-4 mr-1" /> Invite User
              </Button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(202,220,252,0.1)' }}>
              <div className="px-4 py-2 text-xs uppercase tracking-wider grid grid-cols-[32px_1fr_140px_120px_80px_36px] gap-4 font-semibold"
                style={{ background: 'rgba(30,41,59,0.8)', color: '#475569', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
                <span></span><span>Name</span><span className="hidden sm:block">Organization</span><span className="hidden md:block">Role</span><span>Status</span><span></span>
              </div>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-sm" style={{ color: '#64748B' }}>No users found</div>
              ) : (
                filteredUsers.map(u => (
                  <UserRow key={u.id} user={u}
                    onEdit={() => {}}
                    onToggleActive={(user) => updateUserMutation.mutate({ id: user.id, data: { is_active: !user.is_active } })} />
                ))
              )}
            </div>
          </div>
        )}

        {/* Organizations Tab */}
        {activeTab === 'orgs' && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowAddOrg(!showAddOrg)}
                style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
                <Plus className="w-4 h-4 mr-1" /> Add Organization
              </Button>
            </div>
            {showAddOrg && (
              <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(0,168,150,0.3)' }}>
                <div className="text-sm font-semibold" style={{ color: '#00A896' }}>New Organization</div>
                <div className="flex gap-3 flex-wrap">
                  <Input value={newOrg.name} onChange={e => setNewOrg(n => ({ ...n, name: e.target.value }))} placeholder="Organization name"
                    className="flex-1" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
                  <Select value={newOrg.org_type} onValueChange={v => setNewOrg(n => ({ ...n, org_type: v }))}>
                    <SelectTrigger className="w-48" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                      {['Internal','Investor','Engineering Consultant','Legal Advisor','Other'].map(t =>
                        <SelectItem key={t} value={t} style={{ color: '#CADCFC' }}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => createOrgMutation.mutate({ ...newOrg, is_active: true })} disabled={!newOrg.name || createOrgMutation.isPending}
                    style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
                    {createOrgMutation.isPending ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgs.map(org => (
                <OrgCard key={org.id} org={org} userCount={orgUserCounts[org.id] || 0}
                  onClick={() => setSelectedOrg(selectedOrg?.id === org.id ? null : org)} />
              ))}
            </div>
            {selectedOrg && (
              <div className="mt-4">
                <OrgDetailPanel org={selectedOrg} users={users} onClose={() => setSelectedOrg(null)} />
              </div>
            )}
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && <RolesTab />}

        {/* Audit Tab */}
        {activeTab === 'audit' && <AuditLogTab />}
      </div>

      <InviteUserModal open={showInvite} onClose={() => setShowInvite(false)}
        orgs={orgs} roles={roles} onSuccess={() => qc.invalidateQueries({ queryKey: ['platform-users'] })} />
    </div>
  );
}