'use client';

import React, { useEffect, useState } from 'react';

/**
 * ScrollToTop
 *
 * - Shows only when the page is scrolled to the bottom (within a small threshold).
 * - Responsive placement:
 *   - Mobile: centered along the bottom.
 *   - Tablet/desktop: placed at the bottom-right.
 * - Accessible and respects reduced-motion setting for the scrolling behavior.
 */

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    setReduceMotion(mq ? mq.matches : false);

    function check() {
      if (typeof window === 'undefined') return;
      const nearBottom = window.innerHeight + window.scrollY >= (document.documentElement.scrollHeight - 100);
      setVisible(nearBottom);
    }

    // initial check + listeners
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    mq && mq.addEventListener && mq.addEventListener('change', () => setReduceMotion(mq.matches));

    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      mq && mq.removeEventListener && mq.removeEventListener('change', () => setReduceMotion(mq.matches));
    };
  }, []);

  function handleClick() {
    if (typeof window === 'undefined') return;
    if (reduceMotion) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={handleClick}
      className="
        fixed
        bottom-4
        left-1/2 -translate-x-1/2
        sm:left-auto sm:right-6 sm:translate-x-0
        z-50
        w-12 h-12 sm:w-10 sm:h-10
        rounded-full
        flex items-center justify-center
        text-white
        bg-gradient-to-tr from-orange-500 to-pink-500
        shadow-lg
        ring-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400
        transform transition-opacity duration-200
      "
      style={{ opacity: 1 }}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}