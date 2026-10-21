import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCircle, MoreHorizontal, ShieldCheck, ShieldOff, Mail, KeyRound } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const ROLE_COLORS = {
  'Platform Admin': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Project Manager': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Project Team': 'bg-blue-400/20 text-blue-200 border-blue-400/30',
  'Finance Controller': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Investor Viewer': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Investor Board': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Engineering Lead': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Engineering Team': 'bg-green-400/20 text-green-200 border-green-400/30',
};

export default function UserRow({ user, onEdit, onToggleActive, onResendInvite, onSendReset, orgs = [] }) {
  const orgIds = Array.isArray(user.org_ids) && user.org_ids.length ? user.org_ids : (user.org_id ? [user.org_id] : []);
  const extraDomains = Math.max(0, orgIds.length - 1);
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-lg transition-all hover:bg-white/5"
      style={{ borderBottom: '1px solid rgba(202,220,252,0.06)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'rgba(0,168,150,0.2)' }}>
        {user.avatar
          ? <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
          : <span className="text-sm font-semibold" style={{ color: '#00A896' }}>
              {user.full_name?.charAt(0)?.toUpperCase()}
            </span>}
      </div>
      <div className="flex-1 min-w-[140px]">
        <div className="text-sm font-medium truncate" style={{ color: '#CADCFC' }}>{user.full_name}</div>
        <div className="text-xs truncate" style={{ color: '#64748B' }}>{user.email}</div>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-xs truncate max-w-[160px]" style={{ color: '#94A3B8' }}>
        <span className="truncate">{user.org_name}</span>
        {extraDomains > 0 && (
          <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px]"
            style={{ background: 'rgba(0,168,150,0.15)', color: '#5eead4', border: '1px solid rgba(0,168,150,0.25)' }}
            title={`${orgIds.length} domains assigned`}>
            +{extraDomains}
          </span>
        )}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full border hidden md:inline-flex ${ROLE_COLORS[user.role_name] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
        {user.role_name}
      </span>
      {user.platform_role === 'admin' && (
        <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/30 inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Admin
        </span>
      )}
      <span className={`text-xs px-2 py-0.5 rounded-full border ${user.is_active ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
        {user.is_active ? 'Active' : 'Inactive'}
      </span>
      {/* Admin recovery actions, one click away: a locked-out user is never buried in a menu. */}
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <Button variant="ghost" size="icon" className="h-7 w-7"
          title="Resend invitation" aria-label={`Resend invitation to ${user.email}`}
          onClick={() => onResendInvite(user)} style={{ color: '#7DD3FC' }}>
          <Mail className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7"
          title="Send password reset" aria-label={`Send password reset to ${user.email}`}
          onClick={() => onSendReset(user)} style={{ color: '#FBBF24' }}>
          <KeyRound className="w-4 h-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"
              title="More actions" aria-label={`More actions for ${user.full_name || user.email}`}
              style={{ color: '#64748B' }}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.15)' }}>
            <DropdownMenuItem onClick={() => onEdit(user)} style={{ color: '#CADCFC' }}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleActive(user)} style={{ color: user.is_active ? '#F87171' : '#4ADE80' }}>
              {user.is_active ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}