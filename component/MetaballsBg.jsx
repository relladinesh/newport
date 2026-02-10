'use client';

import React, { useEffect, useRef, useMemo } from 'react';

/**
 * MetaballsBg
 *
 * DOM-based metaballs background with option to render full-viewport (fixed)
 * or scoped to the parent (absolute). When fixed=false the parent must be
 * position: relative so the metaballs are clipped to that area.
 *
 * Props:
 * - count (number)
 * - color (string) "r,g,b"
 * - minR, maxR (number)
 * - speed (number) multiplier (1 = baseline)
 * - blur (number)
 * - z (number)
 * - fixed (boolean) default true (full-viewport). false = absolute in parent.
 * - autoReduce (boolean) detect low-end device & reduce quality
 * - debug (boolean) place blobs above UI for debugging
 */

export default function MetaballsBg({
  count = 6,
  color = '255,140,90',
  minR = 64,
  maxR = 180,
  speed = 0.14,
  blur = 28,
  z = -30,
  fixed = true,
  autoReduce = false,
  debug = false,
}) {
  const containerRef = useRef(null);
  const rafRef = useRef(0);
  const blobsRef = useRef([]);
  const blobEls = useRef([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const resizeObserverRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Optionally reduce quality for low-end devices or prefers-reduced-motion
  const { countToUse, blurToUse, speedToUse } = useMemo(() => {
    let c = count;
    let b = blur;
    let s = speed;

    if (autoReduce && typeof window !== 'undefined') {
      try {
        const dm = navigator?.deviceMemory || 0;
        const hc = navigator?.hardwareConcurrency || 0;
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const lowMemory = dm && dm <= 2;
        const fewCores = hc && hc <= 2;

        if (prefersReduced) {
          c = Math.max(2, Math.floor(count * 0.35));
          b = Math.max(6, Math.floor(blur * 0.45));
          s = Math.max(0.25, speed * 0.5);
        } else if (lowMemory || fewCores) {
          c = Math.max(2, Math.floor(count * 0.5));
          b = Math.max(8, Math.floor(blur * 0.6));
          s = Math.max(0.4, speed * 0.6);
        }
      } catch (e) {
        // ignore and use defaults
      }
    }

    return { countToUse: c, blurToUse: b, speedToUse: s };
  }, [count, blur, speed, autoReduce]);

  // Stable filter id based on blurToUse
  const filterId = useMemo(() => `gooey-filter-${String(blurToUse).replace('.', '-')}`, [blurToUse]);

  // Keep blobEls array the right length for refs
  if (blobEls.current.length !== countToUse) {
    blobEls.current = Array(countToUse).fill(null).map((_, i) => blobEls.current[i] || null);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function readBox() {
      const box = container.getBoundingClientRect();
      return { w: Math.max(1, box.width), h: Math.max(1, box.height) };
    }

    function seed() {
      const { w, h } = readBox();
      sizeRef.current = { w, h };

      blobsRef.current = Array.from({ length: countToUse }).map(() => {
        const r = Math.floor(Math.random() * (maxR - minR) + minR);
        const baseV = 0.08; // baseline velocity scale
        return {
          r,
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * baseV * speedToUse,
          vy: (Math.random() - 0.5) * baseV * speedToUse * 0.6,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.0025 + Math.random() * 0.0018,
          drift: 0.0006 + Math.random() * 0.0024,
          driftFactor: 0.002 + Math.random() * 0.004,
        };
      });

      // Initialize DOM elements
      for (let i = 0; i < countToUse; i++) {
        const el = blobEls.current[i];
        const b = blobsRef.current[i];
        if (!el || !b) continue;
        el.style.position = 'absolute';
        el.style.left = '0';
        el.style.top = '0';
        el.style.width = `${b.r * 2}px`;
        el.style.height = `${b.r * 2}px`;
        el.style.borderRadius = '50%';
        el.style.pointerEvents = 'none';
        el.style.willChange = 'transform, width, height, opacity';
        el.style.transform = `translate3d(${Math.round(b.x - b.r)}px, ${Math.round(b.y - b.r)}px, 0)`;
        el.style.background = `radial-gradient(circle at 30% 30%, rgba(${color},0.98) 0%, rgba(${color},0.55) 28%, rgba(0,0,0,0) 70%)`;
        el.style.mixBlendMode = 'screen';
        el.style.opacity = '0.96';
        if (debug) {
          el.style.zIndex = String(Math.max(0, z + 1000));
          el.style.pointerEvents = 'auto';
        }
      }
    }

    seed();

    function animate(ts) {
      // If tab hidden, keep scheduling but don't advance animation state
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        rafRef.current = requestAnimationFrame(animate);
        lastTimeRef.current = ts;
        return;
      }

      if (lastTimeRef.current == null) lastTimeRef.current = ts;
      const dt = Math.max(1, ts - lastTimeRef.current);
      lastTimeRef.current = ts;

      const { w, h } = sizeRef.current;
      const blobs = blobsRef.current;

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        b.phase += b.phaseSpeed * (dt / 16.6667);
        b.x += b.vx * (dt / 16.6667) + Math.sin(b.phase) * b.drift * w * b.driftFactor;
        b.y += b.vy * (dt / 16.6667) + Math.cos(b.phase) * b.drift * h * b.driftFactor;

        // wrap-around so blobs re-enter if they go off-edge
        if (b.x < -b.r) b.x = w + b.r;
        if (b.x > w + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = h + b.r;
        if (b.y > h + b.r) b.y = -b.r;

        const el = blobEls.current[i];
        if (el) {
          const scale = 0.97 + Math.sin(b.phase) * 0.035;
          el.style.width = `${Math.round(b.r * 2 * scale)}px`;
          el.style.height = `${Math.round(b.r * 2 * scale)}px`;
          el.style.transform = `translate3d(${Math.round(b.x - (b.r * scale))}px, ${Math.round(b.y - (b.r * scale))}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    // ResizeObserver to reseed on size changes
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver(() => {
        seed();
      });
      resizeObserverRef.current.observe(container);
    } else {
      // fallback to window resize
      const onResize = () => seed();
      window.addEventListener('resize', onResize, { passive: true });
      resizeObserverRef.current = {
        disconnect: () => window.removeEventListener('resize', onResize),
      };
    }

    function handleVisibility() {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        lastTimeRef.current = null;
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility, { passive: true });
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch (e) {
          // ignore
        }
        resizeObserverRef.current = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
    // Re-run effect when these inputs change
  }, [countToUse, color, minR, maxR, speedToUse, blurToUse, z, debug]);

  // Outer wrapper style: fixed (viewport) or absolute (parent-scoped)
  const outerStyle = fixed
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: z,
        pointerEvents: 'none',
        overflow: 'hidden',
      }
    : {
        position: 'absolute',
        inset: 0,
        zIndex: z,
        pointerEvents: 'none',
        overflow: 'hidden',
      };

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={blurToUse} result="blur" />
            <feColorMatrix in="blur" type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 18 -7" result="gooey" />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
        </defs>
      </svg>

      <div aria-hidden={true} style={outerStyle}>
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            inset: 0,
            filter: `url(#${filterId})`,
            WebkitFilter: `url(#${filterId})`,
            transform: 'translateZ(0)',
            opacity: 0.95,
          }}
        >
          {Array.from({ length: countToUse }).map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                blobEls.current[i] = el;
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}