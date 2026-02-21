import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Building2, CheckCircle } from 'lucide-react';

export default function OrgDetailPanel({ org, users, onClose }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...org });
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.update(org.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orgs'] }); setEditing(false); },
  });

  const orgUsers = users.filter(u => u.org_id === org.id);

  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(202,220,252,0.15)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,168,150,0.15)' }}>
            <Building2 className="w-5 h-5" style={{ color: '#00A896' }} />
          </div>
          <div>
            <div className="font-bold text-base" style={{ color: '#CADCFC' }}>{org.name}</div>
            <div className="text-xs" style={{ color: '#64748B' }}>{org.org_type}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}
            style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} style={{ color: '#64748B' }}><X className="w-4 h-4" /></Button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Name</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Type</label>
            <Select value={form.org_type} onValueChange={v => setForm(f => ({ ...f, org_type: v }))}>
              <SelectTrigger style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: 'rgba(202,220,252,0.15)' }}>
                {['Internal','Investor','Engineering Consultant','Legal Advisor','Other'].map(t =>
                  <SelectItem key={t} value={t} style={{ color: '#CADCFC' }}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Primary Contact</label>
            <Input value={form.primary_contact_name || ''} onChange={e => setForm(f => ({ ...f, primary_contact_name: e.target.value }))}
              style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>Contact Email</label>
            <Input value={form.primary_contact_email || ''} onChange={e => setForm(f => ({ ...f, primary_contact_email: e.target.value }))}
              style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} id="active" />
            <label htmlFor="active" className="text-xs" style={{ color: '#94A3B8' }}>Active</label>
          </div>
          <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}
            size="sm" style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          {org.primary_contact_name && <div style={{ color: '#94A3B8' }}>Contact: <span style={{ color: '#CADCFC' }}>{org.primary_contact_name}</span></div>}
          {org.primary_contact_email && <div style={{ color: '#94A3B8' }}>Email: <span style={{ color: '#CADCFC' }}>{org.primary_contact_email}</span></div>}
          {org.contract_reference && <div style={{ color: '#94A3B8' }}>Contract: <span style={{ color: '#CADCFC' }}>{org.contract_reference}</span></div>}
          {org.notes && <div style={{ color: '#94A3B8' }}>Notes: <span style={{ color: '#CADCFC' }}>{org.notes}</span></div>}
        </div>
      )}

      {orgUsers.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#475569' }}>Users ({orgUsers.length})</div>
          {orgUsers.map(u => (
            <div key={u.id} className="flex items-center gap-3 py-1.5 text-sm">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,168,150,0.2)', fontSize: '10px', color: '#00A896', fontWeight: 700 }}>
                {u.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <span style={{ color: '#CADCFC' }}>{u.full_name}</span>
              <span className="text-xs" style={{ color: '#64748B' }}>{u.role_name}</span>
              {u.is_active ? <CheckCircle className="w-3 h-3 text-green-400 ml-auto" /> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}