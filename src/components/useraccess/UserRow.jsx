import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCircle, MoreHorizontal, ShieldCheck, ShieldOff } from 'lucide-react';
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

export default function UserRow({ user, onEdit, onToggleActive }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg transition-all hover:bg-white/5"
      style={{ borderBottom: '1px solid rgba(202,220,252,0.06)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'rgba(0,168,150,0.2)' }}>
        {user.avatar
          ? <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
          : <span className="text-sm font-semibold" style={{ color: '#00A896' }}>
              {user.full_name?.charAt(0)?.toUpperCase()}
            </span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: '#CADCFC' }}>{user.full_name}</div>
        <div className="text-xs truncate" style={{ color: '#64748B' }}>{user.email}</div>
      </div>
      <div className="hidden sm:block text-xs truncate max-w-[140px]" style={{ color: '#94A3B8' }}>{user.org_name}</div>
      <span className={`text-xs px-2 py-0.5 rounded-full border hidden md:inline-flex ${ROLE_COLORS[user.role_name] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
        {user.role_name}
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full border ${user.is_active ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
        {user.is_active ? 'Active' : 'Inactive'}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" style={{ color: '#64748B' }}>
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
  );
}