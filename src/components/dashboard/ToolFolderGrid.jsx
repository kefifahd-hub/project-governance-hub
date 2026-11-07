import React from 'react';

const clampStyle = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

export default function ToolFolderGrid({ categories, onOpen }) {
  return (
    <div className="space-y-5 sm:space-y-6">
      {categories.map((category) => (
        <section key={category.label}>
          <div className="flex items-baseline justify-between px-1 mb-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
              {category.label}
            </h2>
            <span className="text-[11px]" style={{ color: '#475569' }}>{category.tools.length}</span>
          </div>

          <div
            className="rounded-[22px] p-3 sm:p-4"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-y-4 gap-x-1.5 sm:gap-x-2">
              {category.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    title={tool.description}
                    onClick={() => onOpen(tool.page)}
                    className="flex flex-col items-center gap-1.5 focus:outline-none active:scale-95 transition-transform"
                  >
                    <span
                      className={`${tool.color} flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] sm:rounded-[16px] text-white`}
                      style={{ boxShadow: '0 6px 14px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)' }}
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.8} />
                    </span>
                    <span
                      className="text-[10px] sm:text-[11px] leading-tight text-center w-full"
                      style={{ color: '#CBD5E1', maxWidth: 68, ...clampStyle }}
                    >
                      {tool.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}