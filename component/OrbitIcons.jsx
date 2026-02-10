'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * OrbitIconsDoubleSmall (larger, aligned orbits)
 *
 * Changes:
 * - Added outerOrbitScale and innerOrbitScale props to increase orbit radii.
 * - Applied scales to computed base radii so rings, badges and positions remain aligned.
 * - Center image is now positioned using the computed center coordinates and centerSize
 *   (no hardcoded 300px), ensuring the orbits are centered around the image.
 *
 * Usage:
 * <OrbitIconsDoubleSmall size={360} outerOrbitScale={1.25} innerOrbitScale={1.12} centerScale={0.46} />
 */

export default function OrbitIconsDoubleSmall({
  size = 320,
  innerBadgeSize = 46,
  outerBadgeSize = 46,
  speed = 14,
  outerSpeed = 20,
  // new scale props to increase orbit radii
  outerOrbitScale = 1.25,
  innerOrbitScale = 1.50,
  // center image fraction of inner drawing area
  centerScale = 0.46,
  icons = [
    { id: 'js', content: 'JS', bg: 'bg-yellow-400 text-black' },
    { id: 'css', content: 'CSS', bg: 'bg-sky-500 text-white' },
    { id: 'html', content: 'HTML', bg: 'bg-orange-500 text-white' },
    { id: 'react', content: 'R', bg: 'bg-blue-400 text-white' },
  ],
  outerIcons = [
    { id: 'node', content: 'Node', bg: 'bg-emerald-500 text-white' },
    { id: 'ts', content: 'TS', bg: 'bg-sky-700 text-white' },
    { id: 'py', content: 'Py', bg: 'bg-indigo-500 text-white' },
    { id: 'git', content: 'Git', bg: 'bg-red-500 text-white' },
  ],
  className = '',
}) {
  const wrapRef = useRef(null);
  const [visualSize, setVisualSize] = useState(size);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    function measure() {
      const parent = el.parentElement;
      const parentW = parent ? parent.clientWidth : window.innerWidth;
      const clamped = Math.min(size, Math.max(160, Math.floor(parentW * 0.9)));
      setVisualSize(clamped);
    }

    measure();
    window.addEventListener('resize', measure);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el.parentElement || el);
    }

    return () => {
      window.removeEventListener('resize', measure);
      if (ro && el.parentElement) ro.unobserve(el.parentElement);
    };
  }, [size]);

  // Compute padding to ensure badges sit fully inside the box
  const maxBadge = Math.max(innerBadgeSize, outerBadgeSize);
  const padding = Math.ceil(maxBadge * 0.7) + 8;

  // inner drawing area (square) where orbits are centered
  const innerDrawing = Math.max(120, visualSize - padding * 2);
  const containerSize = visualSize;
  const centerCoord = containerSize / 2;

  // compute base radii so badges fit
  const baseOuterRadius = Math.max(Math.floor((innerDrawing / 2) - (outerBadgeSize / 2) - 6), 40);
  const baseInnerRadius = Math.max(Math.floor(baseOuterRadius * 0.58), 30);

  // apply requested scales to enlarge (or shrink) the orbits, keeping alignment
  const outerRadius = Math.round(baseOuterRadius * outerOrbitScale);
  const innerRadius = Math.round(baseInnerRadius * innerOrbitScale);

  // center image size (responsive) - based on innerDrawing and centerScale
  const centerSize = Math.round(Math.max(64, Math.min(innerDrawing * 0.9, innerDrawing * centerScale)));

  // compute absolute positions (left/top) for a given radius
  const computePos = (i, len, radius) => {
    if (len <= 0) return { left: `${centerCoord}px`, top: `${centerCoord}px` };
    const angle = (i / len) * Math.PI * 2 - Math.PI / 2; // start from top
    const x = Math.round(centerCoord + Math.cos(angle) * radius);
    const y = Math.round(centerCoord + Math.sin(angle) * radius);
    return { left: `${x}px`, top: `${y}px` };
  };

  // small renderer for badge content (string or JSX)
  const renderBadge = (item, badgePx, fontScale = 0.34) => {
    const fontSize = Math.max(10, Math.round(badgePx * fontScale));
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          textTransform: 'uppercase',
          fontSize,
          lineHeight: 1,
        }}
        className={`${item.bg || ''}`}
      >
        {item.content}
      </div>
    );
  };

  return (
    <div
      ref={wrapRef}
      className={`relative ${className}`}
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        minWidth: '160px',
        minHeight: '160px',
        boxSizing: 'border-box',
        overflow: 'hidden', // prevent page scrollbars
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes orbit-cw-${outerSpeed} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbit-ccw-${speed} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes badge-ccw-${outerSpeed} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes badge-cw-${speed}  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Decorative rings */}
      <svg
        viewBox={`0 0 ${containerSize} ${containerSize}`}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none', zIndex: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx={centerCoord}
          cy={centerCoord}
          r={outerRadius + 6}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx={centerCoord}
          cy={centerCoord}
          r={innerRadius + 4}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>

      {/* OUTER orbit (clockwise) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${containerSize}px`,
          height: `${containerSize}px`,
          transformOrigin: `${centerCoord}px ${centerCoord}px`,
          animation: `orbit-cw-${outerSpeed} ${outerSpeed}s linear infinite`,
          zIndex: 1,
        }}
      >
        {outerIcons.map((it, idx) => {
          const pos = computePos(idx, outerIcons.length, outerRadius);
          const sizePx = `${outerBadgeSize}px`;
          return (
            <div
              key={it.id || idx}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                width: sizePx,
                height: sizePx,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                boxShadow: '0 10px 26px rgba(0,0,0,0.55)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '9999px',
                  animation: `badge-ccw-${outerSpeed} ${outerSpeed}s linear infinite`,
                }}
              >
                {renderBadge(it, outerBadgeSize, 0.34)}
              </div>
            </div>
          );
        })}
      </div>

      {/* INNER orbit (counter-clockwise) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${containerSize}px`,
          height: `${containerSize}px`,
          transformOrigin: `${centerCoord}px ${centerCoord}px`,
          animation: `orbit-ccw-${speed} ${speed}s linear infinite`,
          zIndex: 1,
        }}
      >
        {icons.map((it, idx) => {
          const pos = computePos(idx, icons.length, innerRadius);
          const sizePx = `${innerBadgeSize}px`;
          return (
            <div
              key={it.id || idx}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                width: sizePx,
                height: sizePx,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '9999px',
                  animation: `badge-cw-${speed} ${speed}s linear infinite`,
                }}
              >
                {renderBadge(it, innerBadgeSize, 0.32)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Center image (on top) */}
      <div
        style={{
          position: 'absolute',
          left: `${250}px`,
          top: `${310}px`,
          transform: 'translate(-50%,-50%)',
          width: `${250}px`,
          height: `${400}px`,
          borderRadius: '14px',
          overflow: 'hidden',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        
          pointerEvents: 'auto',
        }}
      >
        <img
          src="/character1.png"
          alt="Noah Rella"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    </div>
  );
}