'use client';

import React, { useEffect, useRef } from 'react';

/**
 * ExperienceJourney.jsx
 *
 * Adds entrance + subtle looped animations for desktop and mobile.
 * - Uses IntersectionObserver to add `.inview` to the container and `.visible` to each item when they enter viewport.
 * - Desktop: left cards slide in from left, right cards slide in from right.
 * - Mobile: stacked cards slide up with small stagger.
 * - Center line "draws" (scaleY) when section becomes visible.
 * - Dots have a soft pulse on hover and a subtle appear animation.
 *
 * No external animation libs required. Honours prefers-reduced-motion.
 */

const sampleEntries = [
  {
    id: 's1',
    title: 'Bachelor of Technology in Computer Science',
    org: 'Institute of Aeronautical Engineering',
    range: '2022 - 2026',
    desc: 'Studied core subjects including algorithms, data structures, and web development.',
  },
  {
    id: 's2',
    title: 'MERN STACK Developer',
    org: 'Outceedo',
    range: 'Jun 2025 — Present',
    desc: 'Gained hands-on experience building responsive websites and APIs using MongoDB, Express, React and Node.',
  },
  {
    id: 's3',
    title: 'UI/UX Designer',
    org: 'Self-paced Learning',
    range: '2024 — 2025',
    desc: 'Completed a React certification course and learned Figma for UI prototyping and state management.',
  },
];

export default function ExperienceJourney({ entries = sampleEntries }) {
  const containerRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Observe container to animate the central line when section enters view
    const containerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            containerRef.current.classList.add('inview');
          } else {
            // optional: remove to allow re-trigger; keep it if you prefer one-time
            // containerRef.current.classList.remove('inview');
          }
        });
      },
      { root: null, threshold: 0.12 }
    );
    containerObserver.observe(containerRef.current);

    if (!prefersReduced) {
      // Observe each item to reveal with stagger
      const io = new IntersectionObserver(
        (entriesObs) => {
          entriesObs.forEach((e) => {
            const el = e.target;
            if (e.isIntersecting) {
              el.classList.add('visible');
            } else {
              // keep visible once shown; comment out remove if you want one-time reveal
              // el.classList.remove('visible');
            }
          });
        },
        { root: null, threshold: 0.12 }
      );

      itemsRef.current.forEach((el) => {
        if (el) io.observe(el);
      });

      return () => {
        containerObserver.disconnect();
        io.disconnect();
      };
    }

    return () => containerObserver.disconnect();
  }, []);

  return (
    <section
      ref={containerRef}
      id="experience"
      className="py-16 px-4 md:px-8 lg:px-16 relative"
      style={{ background: 'transparent' }}
    >
      {/* Decorative warm blobs (hidden on small screens) */}
      <div
        aria-hidden
        className="hidden md:block absolute -right-8 -top-6 w-60 h-60 rounded-full filter blur-3xl opacity-90 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(255,138,101,0.95) 0%, rgba(255,98,98,0.06) 40%, transparent 60%)',
          transform: 'rotate(-10deg)',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        className="hidden md:block absolute left-6 bottom-12 w-48 h-48 rounded-full filter blur-3xl opacity-85 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(255,170,85,0.85) 0%, rgba(255,120,120,0.06) 40%, transparent 60%)',
          transform: 'rotate(8deg)',
          zIndex: 0,
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-8">My Journey</h2>

        <div className="relative">
          {/* center vertical line: animated by scale when container gets .inview */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div
              className="center-line hidden md:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-[6px] rounded"
              aria-hidden
            />
            <div
              className="mobile-line md:hidden absolute left-8 top-6 bottom-6 w-[4px] rounded bg-amber-500"
              aria-hidden
            />
          </div>

          <ol className="space-y-12 md:space-y-20 relative z-10">
            {entries.map((it, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <li
                  key={it.id}
                  ref={(el) => (itemsRef.current[idx] = el)}
                  className={`relative md:grid md:grid-cols-12 md:items-start md:gap-6 timeline-item ${isLeft ? 'left-side' : 'right-side'}`}
                >
                  {/* center dot (desktop only) */}
                  <div className="hidden md:flex md:col-start-6 md:col-span-2 justify-center items-start">
                    <div className="relative mt-1 md:mt-0">
                      <span className="center-dot block w-6 h-6 rounded-full" />
                    </div>
                  </div>

                  {/* Desktop left card */}
                  {isLeft ? (
                    <div className="hidden md:block md:col-start-1 md:col-span-5 md:pr-6">
                      <article className="glass-card text-white">
                        <div className="text-xs text-orange-100 opacity-90">{it.range}</div>
                        <h3 className="mt-2 text-2xl font-extrabold">{it.title}</h3>
                        <div className="mt-1 text-sm text-slate-300">{it.org}</div>
                        <p className="mt-4 text-slate-100 leading-relaxed">{it.desc}</p>
                      </article>
                    </div>
                  ) : (
                    <div className="hidden md:block md:col-start-1 md:col-span-5" />
                  )}

                  {/* Mobile stacked card */}
                  <div className="col-span-12 md:hidden">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className="mobile-dot block w-5 h-5 rounded-full mt-1" />
                      </div>

                      <article className="glass-card-mobile w-full">
                        <div className="text-xs text-orange-100 opacity-90">{it.range}</div>
                        <h3 className="mt-1 text-lg font-extrabold">{it.title}</h3>
                        <div className="mt-1 text-sm text-slate-400">{it.org}</div>
                        <p className="mt-3 text-slate-100 text-sm leading-relaxed">{it.desc}</p>
                      </article>
                    </div>
                  </div>

                  {/* Desktop right card */}
                  <div className="hidden md:block md:col-start-8 md:col-span-5 md:pl-6">
                    {!isLeft ? (
                      <article className="glass-card text-white">
                        <div className="text-xs text-orange-100 opacity-90">{it.range}</div>
                        <h3 className="mt-2 text-2xl font-extrabold">{it.title}</h3>
                        <div className="mt-1 text-sm text-slate-300">{it.org}</div>
                        <p className="mt-4 text-slate-100 leading-relaxed">{it.desc}</p>
                      </article>
                    ) : (
                      <div />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <style jsx>{`
        /* base glass styles */
        .glass-card {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,140,100,0.06);
          padding: 22px;
          border-radius: 12px;
          box-shadow: 0 14px 40px rgba(0,0,0,0.7), inset 0 0 18px rgba(255,110,80,0.03);
          opacity: 0;
          transform: translateX(-18px);
          transition: opacity 560ms cubic-bezier(.2,.9,.3,1), transform 560ms cubic-bezier(.2,.9,.3,1);
        }

        .glass-card-mobile {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255,120,80,0.06);
          padding: 16px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.7);
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 520ms cubic-bezier(.2,.9,.3,1), transform 520ms cubic-bezier(.2,.9,.3,1);
        }

        /* center line styling + draw animation */
        .center-line {
          background: linear-gradient(180deg,#ff8a65 0%, #ff6b91 50%, #ffcc66 100%);
          box-shadow: 0 8px 30px rgba(255,120,80,0.06), inset 0 0 18px rgba(255,140,100,0.06);
          transform-origin: top center;
          transform: scaleY(0);
          transition: transform 900ms cubic-bezier(.2,.9,.3,1);
        }

        /* when section in view -> draw the center line */
        :global(section#experience).inview .center-line {
          transform: scaleY(1);
        }

        /* center dot styling + appear animation */
        .center-dot {
          background: radial-gradient(circle at 35% 35%, #ffd36b 0%, #ff7ab6 55%);
          box-shadow: 0 8px 30px rgba(255,110,80,0.18), inset 0 0 6px rgba(255,200,120,0.12);
          border: 3px solid rgba(0,0,0,0.32);
          opacity: 0;
          transform: translateY(-6px) scale(.8);
          transition: opacity 520ms ease, transform 520ms ease;
        }

        /* mobile dot */
        .mobile-dot {
          background: linear-gradient(180deg,#ff8a65,#ff6b91);
          box-shadow: 0 8px 20px rgba(255,100,80,0.14);
          opacity: 0;
          transform: translateY(-6px) scale(.9);
          transition: opacity 520ms ease, transform 520ms ease;
        }

        /* when an item becomes visible, add .visible -> animate differently per side */
        .timeline-item.visible .glass-card {
          opacity: 1;
          transform: translateX(0);
        }

        /* right side card should slide from right */
        .timeline-item.right-side .glass-card {
          transform: translateX(18px);
          opacity: 0;
        }
        .timeline-item.right-side.visible .glass-card {
          transform: translateX(0);
          opacity: 1;
        }

        /* mobile stacked reveal */
        .timeline-item.visible .glass-card-mobile {
          opacity: 1;
          transform: translateY(0);
        }

        /* center dot visible */
        .timeline-item.visible .center-dot {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .timeline-item.visible .mobile-dot {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* slight stagger using nth-child to feel nicer on scroll (desktop & mobile) */
        .timeline-item:nth-child(1).visible .glass-card,
        .timeline-item:nth-child(1).visible .glass-card-mobile { transition-delay: 80ms; }
        .timeline-item:nth-child(2).visible .glass-card,
        .timeline-item:nth-child(2).visible .glass-card-mobile { transition-delay: 140ms; }
        .timeline-item:nth-child(3).visible .glass-card,
        .timeline-item:nth-child(3).visible .glass-card-mobile { transition-delay: 200ms; }
        .timeline-item:nth-child(4).visible .glass-card,
        .timeline-item:nth-child(4).visible .glass-card-mobile { transition-delay: 260ms; }
        .timeline-item:nth-child(5).visible .glass-card,
        .timeline-item:nth-child(5).visible .glass-card-mobile { transition-delay: 320ms; }

        /* subtle hover pulse on dots */
        .center-dot:hover, .mobile-dot:hover { transform: scale(1.08); box-shadow: 0 12px 30px rgba(255,110,80,0.25); }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .glass-card, .glass-card-mobile, .center-dot, .mobile-dot, .center-line, .timeline-item { transition: none !important; animation: none !important; transform: none !important; opacity: 1 !important; }
        }

        /* small-screen tweak: ensure mobile line not overlapping cards */
        @media (max-width: 767px) {
          .mobile-line { left: 6px; }
          .timeline-item { padding-left: 0; }
          .timeline-item .glass-card-mobile { margin-left: 6px; }
        }
      `}</style>
    </section>
  );
}