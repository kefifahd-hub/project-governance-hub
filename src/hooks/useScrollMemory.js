import { useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Persists window scroll position per route (pathname + search).
 * When the user navigates away and back to the same route, scroll is restored.
 * This gives each bottom tab its own independent scroll memory.
 */
export function useScrollMemory() {
  const location = useLocation();
  const scrollMap = useRef({});
  const prevKey = useRef(null);

  // Save scroll position on scroll (throttled via rAF)
  useEffect(() => {
    let ticking = false;
    const onSave = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const key = location.pathname + location.search;
        scrollMap.current[key] = window.scrollY;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onSave, { passive: true });
    return () => window.removeEventListener('scroll', onSave);
  }, [location]);

  // Save current scroll before navigation changes
  const saveCurrent = useCallback(() => {
    if (prevKey.current) {
      scrollMap.current[prevKey.current] = window.scrollY;
    }
  }, []);

  // Restore (or reset) on location change
  useEffect(() => {
    saveCurrent();
    const key = location.pathname + location.search;
    prevKey.current = key;
    const saved = scrollMap.current[key];
    // Defer to next frame so content has rendered
    requestAnimationFrame(() => {
      window.scrollTo(0, saved ?? 0);
    });
  }, [location, saveCurrent]);
}