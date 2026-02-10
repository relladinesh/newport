'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function DebugAnimations() {
  const [framerToggle, setFramerToggle] = useState(false);
  const jsBoxRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // basic environment info
    console.log('DebugAnimations mounted — userAgent:', navigator.userAgent);
    console.log(
      'prefers-reduced-motion:',
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    );
  }, []);

  useEffect(() => {
    // simple requestAnimationFrame animation to move the plain JS box horizontally
    const el = jsBoxRef.current;
    if (!el) return;
    let running = true;
    startTimeRef.current = null;

    function step(ts) {
      if (!running) return;
      if (!startTimeRef.current) startTimeRef.current = ts;
      const t = (ts - startTimeRef.current) / 1000; // seconds
      // move back and forth using sine
      const x = Math.round(Math.sin(t * 1.5) * 90); // -90..90 px
      el.style.transform = `translateX(${x}px)`;
      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div style={{ padding: 18, color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Animation debug</h3>

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Framer Motion test */}
        <div>
          <p style={{ margin: '0 0 8px 0' }}>1) Framer Motion test</p>

          <motion.div
            initial={{ opacity: 0, x: -40, scale: 0.98 }}
            animate={framerToggle ? { opacity: 1, x: 40, scale: 1.02 } : { opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            onAnimationComplete={() => console.log('Framer: onAnimationComplete fired (toggle=' + framerToggle + ')')}
            style={{
              width: 300,
              height: 90,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(90deg,#FF8A00,#FF4DA6)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              fontWeight: 700,
            }}
          >
            Framer Motion box
          </motion.div>

          <div style={{ height: 8 }} />

          <button
            onClick={() => {
              console.log('Framer toggle clicked');
              setFramerToggle((s) => !s);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: '#111827',
              color: '#fff',
            }}
          >
            Toggle Framer animation
          </button>
        </div>

        {/* Plain JS animation test */}
        <div>
          <p style={{ margin: '0 0 8px 0' }}>2) Plain JS animation (requestAnimationFrame)</p>

          <div
            ref={jsBoxRef}
            style={{
              width: 160,
              height: 60,
              borderRadius: 10,
              background: '#0ea5a0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              color: '#042f2e',
              fontWeight: 700,
              transform: 'translateX(0)',
            }}
          >
            JS animating
          </div>

          <div style={{ height: 8 }} />

          <small style={{ opacity: 0.8 }}>
            This should move left/right continuously (no framer-motion involved).
          </small>
        </div>

        {/* CSS animation test */}
        <div>
          <p style={{ margin: '0 0 8px 0' }}>3) CSS animation test</p>

          <div
            className="css-pulse-box"
            style={{
              width: 120,
              height: 120,
              borderRadius: 16,
              background: 'linear-gradient(180deg,#7c3aed,#06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            CSS
          </div>

          <style>{`
            .css-pulse-box {
              animation: debugPulse 1.6s ease-in-out infinite;
            }
            @keyframes debugPulse {
              0% { transform: scale(0.98); opacity: 0.9; }
              50% { transform: scale(1.04); opacity: 1; }
              100% { transform: scale(0.98); opacity: 0.9; }
            }
          `}</style>
        </div>
      </div>

      <div style={{ marginTop: 12, opacity: 0.85 }}>
        <small>
          After loading, open DevTools → Console and paste the logs here. I expect to see:
          <ul>
            <li>"DebugAnimations mounted — userAgent: ..."</li>
            <li>"prefers-reduced-motion: false" (or true)</li>
            <li>"Framer: onAnimationComplete fired ..." after the framer animation runs</li>
          </ul>
        </small>
      </div>
    </div>
  );
}