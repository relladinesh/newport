'use client';

import React, { useEffect, useMemo, useState } from 'react';

/**
 * Responsive Skills component
 * - Improves small-screen behavior (Galaxy S8 and similar)
 * - Ensures cards don't overflow horizontally: min-width:0, truncation, responsive SVG sizing
 * - Adjusts padding, gaps, font sizes on small screens
 *
 * Drop this file into components/Skills.jsx (replace your existing file).
 */

const SKILLS = [
  { id: 'react', title: 'React', category: 'Frontend', proficiency: 92, desc: 'Component-driven UI, hooks, SSR/CSR' },
  { id: 'next', title: 'Next.js', category: 'Frontend', proficiency: 88, desc: 'Hybrid rendering, app/router, optimizations' },
  { id: 'ts', title: 'TypeScript', category: 'Frontend', proficiency: 76, desc: 'Typed JS for safer apps' },
  { id: 'js', title: 'javaScript', category: 'Frontend', proficiency: 86, desc: 'Typed JS for safer apps' },
  { id: 'mongodb', title: 'mongodb', category: 'Database', proficiency: 85, desc: 'Relational DB, queries, indexing' },
  { id: 'Supa', title: 'supabase', category: 'Database', proficiency: 85, desc: 'Relational DB, queries, indexing' },
  { id: 'node', title: 'Node.js', category: 'Backend', proficiency: 84, desc: 'APIs, servers, tooling' },
  { id: 'python', title: 'Python', category: 'Programming Languages', proficiency: 84, desc: 'Coding' },
  { id: 'Java', title: 'Java', category: 'Programming Languages', proficiency: 84, desc: 'Core Java' }
];

const COLORS = {
  start: '#fb923c', // orange
  end: '#fb7185', // pink
  darkTrack: 'rgba(255,255,255,0.12)',
};

const STAGGER_BASE_MS = 80;

function Donut({ id, percent = 75, baseSize = 84, strokeWidth = 8, delay = 0, play = true }) {
  // Use an internal SVG viewBox based on baseSize, but allow CSS to scale the rendered size responsively
  const size = baseSize;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(play), delay);
    return () => clearTimeout(t);
  }, [delay, play]);

  const gradId = `grad-${id}`;

  return (
    <div
      style={{
        // Allow parent CSS / media queries to control the rendered size via .donut-svg class
        display: 'inline-block',
        position: 'relative',
        flex: '0 0 auto',
        minWidth: 0,
      }}
      aria-hidden={false}
      role="img"
      aria-label={`Proficiency ${percent} percent`}
    >
      <svg
        className="donut-svg"
        viewBox={`0 0 ${size} ${size}`}
        style={{
          display: 'block',
          width: 'clamp(56px, 18vw, 84px)',
          height: 'clamp(56px, 18vw, 84px)',
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.start} />
            <stop offset="100%" stopColor={COLORS.end} />
          </linearGradient>
        </defs>

        {/* background track */}
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={COLORS.darkTrack} strokeWidth={strokeWidth} fill="none" />

        {/* progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={mounted ? 0 : circumference}
          style={{
            transition: 'stroke-dashoffset 850ms cubic-bezier(.22,.9,.3,1), stroke-dasharray 850ms cubic-bezier(.22,.9,.3,1)',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            willChange: 'stroke-dashoffset, stroke-dasharray',
          }}
        />
      </svg>

      {/* center label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          color: 'white',
          fontWeight: 700,
          fontSize: 'clamp(11px, 2.6vw, 13px)',
        }}
      >
        {percent}%
      </div>
    </div>
  );
}

export default function Skills() {
  const [selected, setSelected] = useState('All');
  const [animateStart, setAnimateStart] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(SKILLS.map((s) => s.category)));
    return ['All', ...cats];
  }, []);

  const filtered = useMemo(() => {
    if (selected === 'All') return SKILLS;
    return SKILLS.filter((s) => s.category === selected);
  }, [selected]);

  useEffect(() => {
    setAnimateStart(false);
    const t = setTimeout(() => setAnimateStart(true), 80);
    return () => clearTimeout(t);
  }, [selected]);

  return (
    <section id="skills" style={{ scrollMarginTop: '96px' }} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <style>{`
        :root {
          --glass-bg-top: rgba(255,255,255,0.06);
          --glass-bg-bottom: rgba(255,255,255,0.03);
          --glass-border: rgba(255,255,255,0.06);
          --glass-radius: 14px;
        }

        .tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
        .tab-btn {
          padding:8px 14px;
          border-radius:999px;
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.92);
          border: 1px solid rgba(255,255,255,0.04);
          cursor:pointer;
          font-weight:600;
        }
        .tab-btn[aria-pressed="true"] {
          background: linear-gradient(90deg, ${COLORS.start}, ${COLORS.end});
          color: #081019;
          box-shadow: 0 8px 24px rgba(251,146,60,0.12);
        }

        /* grid: single column on small screens, two columns on md+ */
        .skills-grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
        @media (min-width: 768px) { .skills-grid { grid-template-columns: repeat(2, 1fr); gap: 18px; } }

        .skill-card {
          background: linear-gradient(180deg, var(--glass-bg-top), var(--glass-bg-bottom));
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: var(--glass-radius);
          padding: 16px;
          display: flex;
          gap: 14px;
          align-items: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(2,6,23,0.6);
          transition: transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease;
          min-width: 0; /* critical to avoid overflow in flex items */
        }
        .skill-card:hover { transform: translateY(-6px); }

        /* ensure right content can shrink on small screens */
        .skill-meta { flex: 1 1 auto; min-width: 0; }
        .skill-title { font-weight: 700; color: white; font-size: 1rem; margin:0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .skill-sub { color: rgba(255,255,255,0.66); font-size: 0.85rem; margin-top: 4px; }
        .skill-desc { color: rgba(255,255,255,0.78); margin-top: 8px; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

        .mini-bar { position: absolute; right: 16px; top: 16px; width: clamp(88px, 28vw, 120px); height: 10px; border-radius: 9999px; background: rgba(255,255,255,0.03); overflow: hidden; border: 1px solid rgba(255,255,255,0.02); }
        .mini-bar .fill { height: 100%; background: linear-gradient(90deg, ${COLORS.start}, ${COLORS.end}); width: 0%; transition: width 900ms cubic-bezier(.22,.9,.3,1); border-radius: 9999px; }

        /* donut svg sizing handled inline; add a small class for fallback */
        .donut-svg { display:block; flex-shrink:0; }

        .badge { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.9); font-size:12px; border-radius:999px; margin-right:8px; border:1px solid rgba(255,255,255,0.02); }

        /* Small-screen adjustments for narrow phones (Galaxy S8 ~360px width) */
        @media (max-width: 420px) {
          .skill-card { padding: 12px; gap: 10px; }
          .mini-bar { right: 12px; top: 12px; width: 88px; }
          .skill-title { font-size: 0.95rem; }
          .skill-desc { font-size: 0.88rem; -webkit-line-clamp: 3; }
          .badge { padding:5px 8px; font-size:11px; }
        }

        /* If you prefer the donut stacked above content on extremely narrow screens,
           uncomment this block to switch to column layout:
        @media (max-width: 340px) {
          .skill-card { flex-direction: column; align-items: flex-start; }
          .mini-bar { position: absolute; right: 12px; top: 10px; }
        }
        */
      `}</style>

      <header className="mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Skills</h2>
        <p className="mt-2 text-sm text-gray-300 max-w-2xl">Tools, frameworks and languages I use frequently — filter by category.</p>
      </header>

      <div className="tabs" role="tablist" aria-label="Skill categories">
        {categories.map((c) => (
          <button
            key={c}
            role="tab"
            aria-pressed={selected === c}
            aria-label={`Show ${c} skills`}
            className="tab-btn"
            onClick={() => setSelected(c)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(c); } }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="skills-grid" role="list">
        {filtered.map((s, idx) => {
          const delayMs = STAGGER_BASE_MS * idx;
          return (
            <article
              key={s.id}
              className="skill-card"
              role="listitem"
              style={{
                opacity: animateStart ? 1 : 0,
                transform: animateStart ? 'translateY(0)' : 'translateY(8px)',
                transitionDelay: `${delayMs}ms`,
              }}
            >
              <div className="mini-bar" aria-hidden>
                <div
                  className="fill"
                  style={{
                    width: animateStart ? `${s.proficiency}%` : '0%',
                    transitionDelay: `${delayMs}ms`,
                  }}
                />
              </div>

              <Donut
                id={`${s.id}-${idx}`}
                percent={s.proficiency}
                baseSize={84}
                strokeWidth={8}
                delay={animateStart ? delayMs + 60 : 0}
                play={animateStart}
              />

              <div className="skill-meta">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="skill-title">{s.title}</div>
                    <div className="skill-sub">{s.category}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="mt-4">
                    <span className="badge">Proficiency</span>
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: 999, color: 'white', fontWeight: 700 }}>{s.proficiency}%</span>
                  </div>
                </div>

                <div className="skill-desc">{s.desc}</div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}