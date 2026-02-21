import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle } from 'lucide-react';

export default function InviteUserModal({ open, onClose, orgs, roles, onSuccess }) {
  const [form, setForm] = useState({ full_name: '', email: '', job_title: '', org_id: '', role_id: '' });
  const [loading, setLoading] = useState(false);

  const selectedRole = roles.find(r => r.id === form.role_id);
  let permissions = [];
  try { permissions = JSON.parse(selectedRole?.module_permissions || '[]'); } catch {}
  const visibleModules = permissions.filter(p => p.can_view);
  const hiddenModules = permissions.filter(p => !p.can_view);

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.org_id || !form.role_id) return;
    setLoading(true);
    const org = orgs.find(o => o.id === form.org_id);
    await base44.entities.PlatformUser.create({
      ...form,
      org_name: org?.name || '',
      role_name: selectedRole?.role_name || '',
      is_active: true,
      invited_at: new Date().toISOString(),
    });
    setLoading(false);
    setForm({ full_name: '', email: '', job_title: '', org_id: '', role_id: '' });
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" style={{ background: 'rgba(15,23,42,0.99)', border: '1px solid rgba(202,220,252,0.15)', color: '#CADCFC' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>📨 Invite User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Organization *</label>
            <Select value={form.org_id} onValueChange={v => setForm(f => ({ ...f, org_id: v }))}>
              <SelectTrigger style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                {orgs.map(o => <SelectItem key={o.id} value={o.id} style={{ color: '#CADCFC' }}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Full Name *</label>
            <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. Jane Smith"
              style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Email *</label>
            <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jane@example.com" type="email"
              style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Job Title</label>
            <Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
              placeholder="e.g. Board Member"
              style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Role *</label>
            <Select value={form.role_id} onValueChange={v => setForm(f => ({ ...f, role_id: v }))}>
              <SelectTrigger style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                {roles.map(r => <SelectItem key={r.id} value={r.id} style={{ color: '#CADCFC' }}>{r.role_name} ({r.role_type})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedRole && visibleModules.length > 0 && (
            <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(0,168,150,0.07)', border: '1px solid rgba(0,168,150,0.2)' }}>
              <div className="text-xs font-semibold" style={{ color: '#00A896' }}>Role Preview — {selectedRole.role_name}</div>
              <div className="space-y-1">
                {visibleModules.map(p => (
                  <div key={p.module} className="flex items-center gap-2 text-xs" style={{ color: '#94A3B8' }}>
                    <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                    {p.module} {p.data_scope && p.data_scope !== 'All' ? `(${p.data_scope})` : ''}
                  </div>
                ))}
                {hiddenModules.length > 0 && hiddenModules.slice(0, 3).map(p => (
                  <div key={p.module} className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
                    <XCircle className="w-3 h-3 text-red-500/60 shrink-0" />
                    {p.module}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || !form.full_name || !form.email || !form.org_id || !form.role_id}
              style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
              {loading ? 'Creating...' : '📨 Add User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}