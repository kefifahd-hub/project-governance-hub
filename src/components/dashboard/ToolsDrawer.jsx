import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Wrench } from 'lucide-react';
import ToolFolderGrid from '@/components/dashboard/ToolFolderGrid';

export default function ToolsDrawer({ categories, onOpen }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
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
              {open ? 'Tap the arrow to close' : 'Tap the arrow to open all tools'}
            </span>
          </span>
        </span>
        <ChevronDown
          className="w-5 h-5 shrink-0 transition-transform duration-200"
          style={{ color: '#94A3B8', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="tools"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <ToolFolderGrid categories={categories} onOpen={onOpen} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}