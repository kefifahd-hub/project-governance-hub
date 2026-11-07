import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Wrench } from 'lucide-react';

export default function ToolsDrawer({ categories, onOpen }) {
  const [open, setOpen] = useState(false);
  const total = categories.reduce((sum, c) => sum + c.tools.length, 0);

  return (
    <div className="relative z-40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between rounded-[22px] px-3 py-2.5 active:scale-[0.99] transition-transform"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <span className="flex items-center gap-2.5">
          <span className="bg-indigo-500 flex items-center justify-center w-9 h-9 rounded-[11px] text-white shrink-0">
            <Wrench className="w-4 h-4" strokeWidth={1.9} />
          </span>
          <span className="text-left">
            <span className="block text-[13px] font-semibold leading-tight" style={{ color: '#E2E8F0' }}>
              Project Tools
            </span>
            <span className="block text-[10px] leading-tight" style={{ color: '#94A3B8' }}>
              {open ? 'Tap the arrow to close' : `${total} tools · tap the arrow to open`}
            </span>
          </span>
        </span>
        <ChevronDown
          className="w-5 h-5 shrink-0"
          style={{ color: '#94A3B8', transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              key="tools-menu"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl overflow-y-auto"
              style={{
                maxHeight: '58vh',
                background: 'rgba(15, 23, 42, 0.98)',
                border: '1px solid rgba(202, 220, 252, 0.15)',
                boxShadow: '0 18px 45px rgba(2, 6, 23, 0.55)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
              }}
            >
              {categories.map((cat) => (
                <div key={cat.label} className="px-2 py-2 border-b last:border-b-0" style={{ borderColor: 'rgba(202, 220, 252, 0.08)' }}>
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>
                    {cat.label}
                  </p>
                  {cat.tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.page}
                        type="button"
                        onClick={() => { setOpen(false); onOpen(tool.page); }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-2 py-2 text-left active:scale-[0.99] transition-transform"
                        style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                      >
                        <span className={`${tool.color} flex items-center justify-center w-8 h-8 rounded-[9px] text-white shrink-0`}>
                          <Icon className="w-4 h-4" strokeWidth={1.9} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium leading-tight truncate" style={{ color: '#E2E8F0' }}>
                            {tool.name}
                          </span>
                          <span className="block text-[10px] leading-tight truncate" style={{ color: '#94A3B8' }}>
                            {tool.description}
                          </span>
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 shrink-0 -rotate-90" style={{ color: '#64748B' }} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}