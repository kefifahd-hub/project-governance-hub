import React from 'react';

export default function CompactStatGroup({ label, items }) {
  return (
    <section>
      <div className="px-1 mb-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
          {label}
        </h2>
      </div>
      <div
        className="rounded-[22px] p-2.5 sm:p-3"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="flex items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left active:scale-95 transition-transform"
                style={{ background: 'rgba(255, 255, 255, 0.045)' }}
              >
                <span className={`${item.color} flex items-center justify-center w-9 h-9 rounded-[11px] text-white shrink-0`}>
                  <Icon className="w-4 h-4" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold leading-tight truncate" style={{ color: item.valueColor || '#E2E8F0' }}>
                    {item.value}
                  </span>
                  <span className="block text-[10px] leading-tight truncate" style={{ color: '#94A3B8' }}>
                    {item.caption}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}