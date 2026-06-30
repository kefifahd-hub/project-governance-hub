import { Triangle, Crosshair, Wallet, CalendarClock, BadgeCheck } from 'lucide-react';

const PILLARS = [
  { label: 'Scope', icon: Crosshair, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { label: 'Cost', icon: Wallet, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  { label: 'Schedule', icon: CalendarClock, color: '#00A896', bg: 'rgba(0,168,150,0.1)' },
  { label: 'Quality', icon: BadgeCheck, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
];

export default function PMTriangleBanner() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      <div
        className="rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(0,168,150,0.06) 50%, rgba(245,158,11,0.08) 100%)',
          border: '1px solid rgba(202,220,252,0.12)',
        }}
      >
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(15,23,42,0.6)' }}>
            <Triangle className="w-6 h-6" style={{ color: '#CADCFC' }} />
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-wider" style={{ color: '#CADCFC' }}>
              The Project Triangle
            </div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>
              Balance competing constraints — change one, impact the others
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-center gap-2 sm:gap-3">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={p.label} className="flex items-center">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: p.bg, border: `1px solid ${p.color}33` }}
                >
                  <Icon className="w-4 h-4" style={{ color: p.color }} />
                  <span className="text-sm font-semibold" style={{ color: p.color }}>{p.label}</span>
                </div>
                {i < PILLARS.length - 1 && <span className="mx-1 text-xs font-bold" style={{ color: '#475569' }}>⇄</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}