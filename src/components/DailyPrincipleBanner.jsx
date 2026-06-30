import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FALLBACK = {
  title: 'The Project Triangle',
  subtitle: 'Balance competing constraints — change one, impact the others',
  principles: [
    { label: 'Scope', color: '#a78bfa' },
    { label: 'Cost', color: '#F59E0B' },
    { label: 'Schedule', color: '#00A896' },
    { label: 'Quality', color: '#10B981' },
  ],
};

export default function DailyPrincipleBanner({ variant = 'dark' }) {
  const { data: latest } = useQuery({
    queryKey: ['dailyPrinciple'],
    queryFn: async () => {
      const list = await base44.entities.DailyPrinciple.list('-date', 1);
      return list[0];
    },
    staleTime: 1000 * 60 * 10,
  });

  let principle = FALLBACK;
  let pillars = FALLBACK.principles;
  if (latest?.principles) {
    try { pillars = JSON.parse(latest.principles); } catch { pillars = FALLBACK.principles; }
    principle = { title: latest.title, subtitle: latest.subtitle || FALLBACK.subtitle, principles: pillars };
  }

  const isLight = variant === 'light';
  const labelColor = isLight ? '#CADCFC' : '#CADCFC';
  const subColor = isLight ? '#64748b' : '#94A3B8';

  return (
    <div
      className="rounded-lg flex items-center flex-wrap gap-3 px-3 py-2"
      style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(0,168,150,0.05) 50%, rgba(245,158,11,0.06) 100%)',
        border: '1px solid rgba(202,220,252,0.1)',
      }}
    >
      <span className="text-xs font-bold uppercase tracking-wider shrink-0" style={{ color: labelColor }}>
        ⚡ {principle.title}
      </span>
      {principle.subtitle && (
        <span className="text-xs hidden sm:inline shrink-0" style={{ color: subColor }}>
          {principle.subtitle}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-1.5 ml-auto">
        {principle.principles.map((p, i, arr) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{ background: `${p.color}1a`, border: `1px solid ${p.color}33`, color: p.color }}
            >
              {p.label}
            </span>
            {i < arr.length - 1 && <span className="text-xs font-bold" style={{ color: '#475569' }}>⇄</span>}
          </div>
        ))}
      </div>
    </div>
  );
}