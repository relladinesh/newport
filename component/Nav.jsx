'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Nav (click-only active; NO auto-hide on hero for mobile)
 *
 * Changes:
 * ✅ Removed IntersectionObserver logic that hid nav on #hero (mobile).
 * ✅ navVisible is removed; navbar always stays visible.
 * ✅ Everything else kept the same (active on click, menu, smooth scroll offset).
 */

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const firstLinkRef = useRef(null);
  const menuRef = useRef(null);
  const headerRef = useRef(null);

  // active item index (updated only on click)
  const [activeIndex, setActiveIndex] = useState(0);

  const logoConfig = {
    text: 'RELLA.',
    ariaLabel: 'noah homepage',
  };

  // Ensure these match your section ids
  const items = [
    { href: '#hero', label: 'Home' },
    { href: '#skills', label: 'Skills' },
    { href: '#experience', label: 'Experience' },
    { href: '#project', label: 'Project' },
    { href: '#contact', label: 'Contact' },
  ];

  // Close menu on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Body scroll lock while menu open
  useEffect(() => {
    const prev = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstLinkRef.current?.focus(), 50);
    } else {
      if (typeof document !== 'undefined') document.body.style.overflow = prev || '';
    }
    return () => {
      if (typeof document !== 'undefined') document.body.style.overflow = prev || '';
    };
  }, [open]);

  const Logo = ({ small = false }) => {
    const circleSize = small ? 34 : 36;
    return (
      <a href="/" aria-label={logoConfig.ariaLabel} className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
        <div
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg,#fb923c,#fb7185)',
            fontWeight: 800,
            fontSize: small ? 13 : 14,
          }}
          aria-hidden
        >
          <span style={{ color: 'black', lineHeight: 1 }}>{logoConfig.text[0]?.toUpperCase()}</span>
        </div>

        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
          {logoConfig.text}
        </span>
      </a>
    );
  };

  // Update isMobile on mount and resize
  useEffect(() => {
    function handleResize() {
      const mobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false; // < lg
      setIsMobile(mobile);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll helper that accounts for header offset
  function scrollToHash(href, idx) {
    if (typeof window === 'undefined') return;
    const id = (href || '').replace(/^#/, '');
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveIndex(0);
      setOpen(false);
      return;
    }
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`Nav: target element not found for id="${id}"`);
      return;
    }

    // compute header offset
    const headerEl = headerRef.current;
    const headerHeight = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;

    if (headerHeight) {
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setActiveIndex(typeof idx === 'number' ? idx : activeIndex);
    setOpen(false);
  }

  // motion variants for show/hide (always visible now)
  const variants = {
    hidden: { y: -22, opacity: 0, pointerEvents: 'none' },
    visible: { y: 0, opacity: 1, pointerEvents: 'auto' },
  };

  // Styles for mobile vs desktop nav "panel"
  const mobilePanelStyle = {
    background: 'rgba(0,0,0,0.6)',
    WebkitBackdropFilter: 'blur(18px)',
    backdropFilter: 'blur(18px)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
  };

  const desktopPanelStyle = {
    background: 'rgba(255,255,255,0.12)',
    WebkitBackdropFilter: 'blur(28px)',
    backdropFilter: 'blur(28px)',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: '0 8px 30px rgba(2,6,23,0.6)',
  };

  return (
    <AnimatePresence>
      <motion.header
        id="site-nav"
        ref={headerRef}
        key="nav"
        initial={false}
        animate="visible" // ✅ always visible
        variants={variants}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="w-full fixed top-0 left-0 z-50"
        style={{ willChange: 'transform, opacity' }}
      >
        <div style={{ width: '100%' }}>
          <div className="w-full flex justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full mt-4" style={{ display: 'flex', justifyContent: 'center' }}>
              {/* MOBILE panel */}
              <div
                className="flex justify-between w-full lg:hidden rounded-3xl mx-0 px-4 lg:px-6"
                style={{ padding: '8px 12px', gap: 18, boxSizing: 'border-box', ...mobilePanelStyle }}
              >
                <div className="flex-shrink-0 flex items-center">
                  <Logo />
                </div>

                <div className="flex-shrink-0 lg:hidden flex items-center">
                  <button
                    type="button"
                    aria-controls="mobile-menu"
                    aria-expanded={open}
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    onClick={() => setOpen((v) => !v)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <motion.path
                        initial={false}
                        animate={open ? { d: 'M6 18L18 6M6 6l12 12' } : { d: 'M3 6h18M3 12h18M3 18h18' }}
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* DESKTOP panel */}
              <div
                className="hidden lg:flex justify-between w-full lg:justify-center lg:w-auto lg:mx-auto rounded-3xl mx-0 px-4 lg:px-6 backdrop-blur-md"
                style={{ padding: '8px 12px', gap: 18, boxSizing: 'border-box', ...desktopPanelStyle }}
              >
                <div className="flex-shrink-0 flex items-center">
                  <Logo />
                </div>

                <div className="hidden lg:flex items-center">
                  <div className="flex items-center rounded-full" style={{ padding: '6px', borderRadius: 9999, gap: 8, whiteSpace: 'nowrap' }}>
                    {items.map((it, idx) => {
                      const active = idx === activeIndex;
                      return (
                        <a
                          key={it.href}
                          href={it.href}
                          ref={idx === 0 ? firstLinkRef : undefined}
                          className="text-sm"
                          aria-current={active ? 'page' : undefined}
                          onClick={(e) => {
                            e.preventDefault();
                            scrollToHash(it.href, idx);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 12px',
                            borderRadius: 9999,
                            color: active ? 'black' : 'rgba(255,255,255,0.9)',
                            background: active ? 'linear-gradient(90deg,#fb923c,#fb7185)' : 'transparent',
                            fontWeight: active ? 700 : 600,
                            textDecoration: 'none',
                            boxShadow: active ? '0 6px 18px rgba(251,114,138,0.12)' : 'none',
                          }}
                        >
                          {it.label}
                        </a>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-shrink-0 hidden lg:flex items-center" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu sheet */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => setOpen(false)}
              />

              <motion.nav
                key="sheet"
                id="mobile-menu"
                ref={menuRef}
                initial={{ y: '-8%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-8%', opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="fixed top-0 right-0 left-0 z-50 p-6 bg-black/95 backdrop-blur-md text-white"
                aria-label="Mobile"
              >
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Logo small />
                    </div>
                    <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky-400">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  <ul className="flex flex-col gap-4 text-xl">
                    {items.map((it, idx) => (
                      <li key={it.href}>
                        <button
                          ref={idx === 0 ? firstLinkRef : undefined}
                          onClick={() => scrollToHash(it.href, idx)}
                          className={`w-full text-left py-3 px-4 rounded-md hover:bg-white/5 ${idx === activeIndex ? 'bg-white/5' : ''}`}
                          aria-current={idx === activeIndex ? 'page' : undefined}
                        >
                          {it.label}
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 border-t border-white/10 pt-6 text-sm text-gray-300">
                    <p>Contact</p>
                    <a href="mailto:relladinesh19@gmail.com" className="text-slate-300">
                      relladinesh19@gmail.com
                    </a>
                  </div>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </motion.header>
    </AnimatePresence>
  );
}
