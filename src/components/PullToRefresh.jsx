import React, { useRef, useState, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const PULL_THRESHOLD = 70;
const MAX_PULL = 100;

/**
 * Native-style pull-to-refresh wrapper for touch devices.
 * On desktop, renders children normally (no interference).
 *
 * @param {function} onRefresh - async function to refresh data
 * @param {React.ReactNode} children
 */
export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const [pullDist, setPullDist] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  const handleTouchStart = useCallback((e) => {
    if (refreshing || window.scrollY > 0) return;
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  }, [refreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!pullingRef.current || refreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      setPullDist(0);
      return;
    }
    // Only activate pull when at top of scroll
    if (window.scrollY > 0) {
      pullingRef.current = false;
      setPullDist(0);
      return;
    }
    // Dampen the pull
    const damped = Math.min(MAX_PULL, delta * 0.5);
    setPullDist(damped);
    if (damped > 5) e.preventDefault();
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (pullDist >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDist(PULL_THRESHOLD);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPullDist(0);
      }
    } else {
      setPullDist(0);
    }
  }, [pullDist, onRefresh]);

  // Cleanup
  useEffect(() => {
    return () => { pullingRef.current = false; };
  }, []);

  if (!isTouchDevice) {
    return <div className={className}>{children}</div>;
  }

  const progress = Math.min(1, pullDist / PULL_THRESHOLD);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={className}
      style={{ position: 'relative' }}
    >
      {(pullDist > 0 || refreshing) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: pullDist,
            overflow: 'hidden',
          }}
        >
          <RefreshCw
            className="w-5 h-5"
            style={{
              color: '#00A896',
              transform: `rotate(${progress * 360}deg)`,
              animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
              transition: 'transform 0.1s ease-out',
            }}
          />
        </div>
      )}
      <div
        style={{
          transform: `translateY(${pullDist}px)`,
          transition: pullingRef.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}