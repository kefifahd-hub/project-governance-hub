import { Badge } from '@/components/ui/badge';
import { Building2, Users, CheckCircle, XCircle } from 'lucide-react';

const ORG_TYPE_COLORS = {
  'Internal': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Investor': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Engineering Consultant': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Legal Advisor': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Other': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export default function OrgCard({ org, userCount, onClick }) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(202,220,252,0.1)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,168,150,0.15)' }}>
            <Building2 className="w-5 h-5" style={{ color: '#00A896' }} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#CADCFC' }}>{org.name}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${ORG_TYPE_COLORS[org.org_type] || ORG_TYPE_COLORS['Other']}`}>
              {org.org_type}
            </span>
          </div>
        </div>
        {org.is_active
          ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
      </div>
      <div className="flex items-center gap-4 text-xs" style={{ color: '#64748B' }}>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {userCount || 0} users</span>
        {org.primary_contact_name && <span>{org.primary_contact_name}</span>}
      </div>
    </div>
  );
}