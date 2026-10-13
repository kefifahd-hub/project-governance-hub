import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

export default function EditUserDialog({ user, orgs = [], roles = [], onClose }) {
  const [form, setForm] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        job_title: user.job_title || '',
        phone: user.phone || '',
        org_id: user.org_id || '',
        role_id: user.role_id || '',
        platform_role: user.platform_role || 'user',
        access_end_date: user.access_end_date || '',
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.PlatformUser.update(user.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-users'] });
      onClose();
    },
  });

  if (!user || !form) return null;

  const selectedOrg = orgs.find((o) => o.id === form.org_id);
  const selectedRole = roles.find((r) => r.id === form.role_id);

  const submit = () => {
    updateMutation.mutate({
      ...form,
      org_name: selectedOrg?.name || '',
      role_name: selectedRole?.name || '',
    });
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.15)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>Edit user</DialogTitle>
          <DialogDescription style={{ color: '#64748B' }}>{user.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label style={{ color: '#94A3B8' }}>Full name</Label>
            <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Job title</Label>
            <Input value={form.job_title} onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
              style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Domain</Label>
            <Select value={form.org_id} onValueChange={(v) => setForm((f) => ({ ...f, org_id: v }))}>
              <SelectTrigger style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                {orgs.map((o) => <SelectItem key={o.id} value={o.id} style={{ color: '#CADCFC' }}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Role</Label>
            <Select value={form.role_id} onValueChange={(v) => setForm((f) => ({ ...f, role_id: v }))}>
              <SelectTrigger style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                {roles.map((r) => <SelectItem key={r.id} value={r.id} style={{ color: '#CADCFC' }}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Platform access</Label>
            <Select value={form.platform_role} onValueChange={(v) => setForm((f) => ({ ...f, platform_role: v }))}>
              <SelectTrigger style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                <SelectItem value="user" style={{ color: '#CADCFC' }}>User (app access)</SelectItem>
                <SelectItem value="admin" style={{ color: '#CADCFC' }}>Admin (manage users)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Access end date (optional)</Label>
            <Input type="date" value={form.access_end_date} onChange={(e) => setForm((f) => ({ ...f, access_end_date: e.target.value }))}
              style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Cancel</Button>
          <Button onClick={submit} disabled={updateMutation.isPending}
            style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}