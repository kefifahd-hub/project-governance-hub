import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Unified page header for child screens.
 * Includes a consistent back button + title, respecting safe-area-top.
 *
 * @param {string} title - Page title
 * @param {string} subtitle - Optional subtitle
 * @param {function} onBack - Optional custom back handler; defaults to history.back()
 * @param {React.ReactNode} actions - Optional right-side actions
 * @param {string} backTo - Optional route path to navigate to instead of history.back()
 */
export default function PageHeader({ title, subtitle, onBack, actions, backTo }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      window.history.back();
    }
  };

  return (
    <div
      className="sticky top-14 z-30"
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(202, 220, 252, 0.1)',
        paddingTop: 'var(--safe-area-top)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="shrink-0"
            style={{ color: '#CADCFC' }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="min-w-0">
            {title && (
              <h1 className="text-lg sm:text-2xl font-bold truncate" style={{ color: '#CADCFC' }}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm mt-0.5 truncate" style={{ color: '#94A3B8' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}