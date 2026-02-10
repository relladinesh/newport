'use client';

import React, { useEffect, useState } from 'react';
import MetaballsBg from '../component/MetaballsBg';
import Nav from '../component/Nav';
import Hero from '../component/Hero';
import Skills from '../component/Skills';
import ExperienceJourney from '../component/Exp';
import Projects from '../component/Projects';
import Contact from '@/component/Contact';
import ScrollToTop from '../component/ScrollToTop';
import DLetter3DLoader from '../component/Dloader';
import DebugAnimations from '@/component/motion';

/**
 * Page that shows Metaballs for the main site background, but NOT behind the Hero.
 *
 * Approach:
 * - Render Hero first (on top, with its own background/overlay).
 * - Place MetaballsBg in a wrapper that starts after the Hero (so blobs do not appear behind it).
 * - The metaballs wrapper is full-bleed and fixed, but positioned below the hero using CSS `top` tied to the hero's bottom via a CSS variable.
 * - The Hero keeps its own high-contrast overlay so it always hides/meters the blobs.
 *
 * If your Hero has dynamic height you can adjust --hero-height (inlined here) or set it in CSS to match.
 * If you prefer to compute hero height at runtime, we can add a ref + JS to measure and set the CSS variable instead.
 */

export default function Page() {
  const [showLoader, setShowLoader] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(true);

  const loaderDurationMs = 6000;
  const fadeOutMs = 420;

  useEffect(() => {
    if (showLoader) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }
    return undefined;
  }, [showLoader]);

  useEffect(() => {
    const t = setTimeout(() => {
      setOverlayVisible(false);
      const u = setTimeout(() => setShowLoader(false), fadeOutMs);
      return () => clearTimeout(u);
    }, loaderDurationMs);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {showLoader && (
        <div
          aria-hidden={!overlayVisible}
          className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black pointer-events-auto transition-opacity duration-400 ${
            overlayVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundColor: '#000' }}
        >
          <div className="flex flex-col items-center gap-6">
            <DLetter3DLoader size={220} depth={60} colorA="#ff7ab6" colorB="#ffd36b" speed={7.6} />
            <div className="text-sm text-slate-200/90">Loading — preparing the experience</div>
          </div>
        </div>
      )}

      <div className="app-root bg-black text-white min-h-screen">
        <style>{`
          .app-root { background-color: #000 !important; color: #fff !important; }

          /* Hero-safe area: hero must appear above the metaballs */
          .hero-wrapper { position: relative; z-index: 30; }

          /* The metaballs wrapper is fixed and full-bleed, but visually starts BELOW the hero.
             Adjust --hero-height to match your hero height. */
          .metaballs-wrapper {
            position: fixed;
            left: 0;
            right: 0;
            top: var(--hero-height, 420px); /* default hero height; change if needed */
            bottom: 0;
            z-index: 0;
            pointer-events: none;
          }
          .metaballs-wrapper canvas,
          .metaballs-wrapper svg {
            mix-blend-mode: screen !important;
            opacity: 0.98 !important;
            filter: saturate(1.12) blur(10px);
          }

          /* Main content sits above metaballs */
          .app-content { position: relative; z-index: 10; }

          /* Hero inner overlay to ensure it hides metaballs underneath and remains readable */
          .hero-contrast-overlay {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.88));
            mix-blend-mode: normal;
            z-index: 5;
            border-radius: inherit;
          }

          /* Ensure hero text/colors are preserved and readable */
          .hero-wrapper h1,
          .hero-wrapper p,
          .hero-wrapper a,
          .hero-wrapper button {
            color: #081019 !important;
            -webkit-text-fill-color: #081019 !important;
          }

          /* On small screens we may need a smaller hero height */
          @media (max-width: 640px) {
            :root { --hero-height: 420px; }
          }
        `}</style>

        <Nav />

        {/* HERO: will be above metaballs */}
      
          {/* Optional overlay to completely block any background from bleeding through the hero */}

          <Hero character="/character.png" />
        

        {/* Metaballs are fixed and start after the hero height so they DON'T appear behind the hero */}
        

        {/* Page content that should appear over metaballs */}
        <main className="app-content">
          <section id="blobs-section" style={{ position: 'relative', overflow: 'visible' }}>
               <MetaballsBg
            count={6}
            color="255,140,90"
            minR={60}
            maxR={180}
            speed={30}
            blur={16}
            z={-1}
            fixed={false}
            autoReduce={true}
            debug={false}
            interactive={true}
          />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <Skills />
             
       
              <ExperienceJourney />
              <Projects />
              
            </div>
            <Contact />
          </section>

          <ScrollToTop />
        </main>
      </div>
    </>
  );
}