import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function HelpTooltip({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors"
        style={{ color: open ? '#00A896' : '#94A3B8', background: open ? 'rgba(0,168,150,0.15)' : 'transparent' }}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute z-50 w-72 rounded-xl shadow-2xl p-4"
            style={{
              background: 'rgba(15,23,42,0.98)',
              border: '1px solid rgba(0,168,150,0.4)',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,168,150,0.15)'
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-semibold text-sm" style={{ color: '#00A896' }}>{title}</span>
              <button onClick={() => setOpen(false)} style={{ color: '#94A3B8' }}><X className="w-3 h-3" /></button>
            </div>
            <div className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{children}</div>
          </div>
        </>
      )}
    </div>
  );
}