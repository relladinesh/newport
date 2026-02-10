'use client';

import React, { useEffect, useRef } from 'react';

/**
 * StarsBg (realistic)
 *
 * Improvements to create a more "real" starfield feeling:
 * - Depth layers: stars exist on multiple depth layers (near / mid / far) with different sizes,
 *   speeds and parallax. This creates a natural 3D look.
 * - Soft multi-stop glows using additive blending ('lighter') to make bright stars bloom.
 * - Varied star color temperature: slight warm/cool tints for realism.
 * - Star clusters: a few soft clusters give structure (like Milky Way patches).
 * - Natural twinkle: per-star phase + small randomized frequency; brighter stars twinkle more.
 * - Occasional realistic shooting stars with tapered trails.
 * - Subtle nebula / dust blobs (very soft radial gradients) to add atmosphere.
 * - Pointer parallax + gentle auto drift.
 * - Mobile / low-end device fallbacks (reduced counts & DPR cap).
 *
 * Props (defaults tuned for subtle, warm look):
 *  - colorBase: '255,200,170' (base tint for glows)
 *  - density: stars per 100k px
 *  - maxStars: hard cap
 *  - nebula: enable/disable nebula blobs
 *  - clusters: enable/disable star clusters
 *  - shootingFrequency: seconds average between shooting stars (0 disable)
 *  - excludeSelector: same behavior as before (rect clears)
 *
 * Performance:
 * - Caps devicePixelRatio at 2.
 * - Reduces stars on devices with <= 2 logical cores.
 * - Avoids allocations in the animation loop where possible.
 *
 * Usage:
 *  <StarsBg excludeSelector={['#hero','#site-nav']} colorBase="255,160,120" density={8} />
 *
 * Notes:
 * - The component draws with globalCompositeOperation 'lighter' for bloom effects.
 * - If you observe jank on low devices, reduce density and set shootingFrequency=0.
 */

export default function StarsBg({
  colorBase = '255,200,170',
  density = 7, // stars per 100k px
  maxStars = 280,
  nebula = true,
  clusters = true,
  connect = false,
  connectDistance = 120,
  shootingFrequency = 10,
  excludeSelector = null,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const dimsRef = useRef({ w: 0, h: 0, DPR: 1 });
  const starsRef = useRef([]); // array of star objects
  const shotsRef = useRef([]); // shooting stars
  const excludeRectsRef = useRef([]);
  const lastTimeRef = useRef(performance.now());
  const lastShotRef = useRef(0);
  const hiddenRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // helpers
    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }
    function choose(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    // heuristic for low-end devices
    function isLowEndDevice() {
      try {
        return navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
      } catch {
        return false;
      }
    }

    // initialize canvas size and stars
    function resize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // cap DPR
      dimsRef.current = { w, h, DPR };

      // set canvas pixel size
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      buildStars();
      updateExcludeRects();
    }

    // generate a set of stars with depth layers and optional clusters
    function buildStars() {
      const { w, h } = dimsRef.current;
      const area = Math.max(1, w * h);
      const desired = Math.round((area / 100000) * density);
      const cap = Math.min(maxStars, desired);
      const lowEnd = isLowEndDevice();
      const count = lowEnd ? Math.round(cap * 0.45) : cap;

      const layers = [
        { name: 'far', depth: 0.28, sizeMult: 0.7, glow: 0.28, density: 0.5 }, // many faint small stars
        { name: 'mid', depth: 0.55, sizeMult: 1.0, glow: 0.5, density: 0.35 },
        { name: 'near', depth: 0.9, sizeMult: 1.8, glow: 1.0, density: 0.15 }, // fewer, brighter
      ];

      // compute counts per layer by density fraction, scaled to count
      const stars = [];
      layers.forEach((layer) => {
        const n = Math.max(1, Math.round(count * layer.density));
        for (let i = 0; i < n; i++) {
          const baseRadius = rand(0.35, 1.9) * layer.sizeMult;
          // slight color temp variation: cooler / warmer
          const tintShift = rand(-18, 18);
          const color = colorBase
            .split(',')
            .map((v, idx) => {
              const num = Math.max(0, Math.min(255, Math.round(Number(v) + (idx === 0 ? tintShift : tintShift * 0.35))));
              return num;
            })
            .join(',');
          const brightness = rand(0.6, 1);
          // twinkle values: near stars twinkle more noticeably
          const twinkleSpeed = rand(0.45, 1.6) * (layer.depth < 0.5 ? 0.85 : 1.25);
          const twinklePhase = Math.random() * Math.PI * 2;

          // optional cluster seeding: some stars biased into clusters
          let x = Math.random() * w;
          let y = Math.random() * h;
          if (clusters && Math.random() < 0.12) {
            // create a small cluster center and bias some stars inside it
            const cx = Math.random() * w;
            const cy = Math.random() * h;
            const rCluster = Math.min(w, h) * rand(0.04, 0.14);
            x = Math.max(0, Math.min(w, cx + (rand(-1, 1) * rCluster * Math.abs(rand(-1, 1)))));
            y = Math.max(0, Math.min(h, cy + (rand(-1, 1) * rCluster * Math.abs(rand(-1, 1)))));
          }

          stars.push({
            id: `${layer.name}-${i}-${Math.floor(Math.random() * 1e6)}`,
            x,
            y,
            baseX: x,
            baseY: y,
            r: baseRadius,
            depth: layer.depth,
            glow: layer.glow,
            color,
            brightness,
            twinkleSpeed,
            twinklePhase,
            vx: rand(-0.006, 0.006), // slow drift (px per ms)
            vy: rand(-0.006, 0.006),
            // a few extremely bright stars for focal points
            isBright: Math.random() < 0.02,
          });
        }
      });

      // sort by depth ascending (far first)
      starsRef.current = stars.sort((a, b) => a.depth - b.depth);
      shotsRef.current = [];
      lastShotRef.current = performance.now();
    }

    // spawn a shooting star with tapered trail
    function spawnShot() {
      const { w, h } = dimsRef.current;
      const fromLeft = Math.random() < 0.5;
      const startX = fromLeft ? -60 : w + 60;
      const startY = Math.random() * h * 0.55;
      const angle = fromLeft ? rand(0.2, 0.35) * Math.PI : rand(0.65, 0.8) * Math.PI;
      const speed = rand(700, 1300) / 1000; // px per ms
      const len = rand(180, 420);
      const life = rand(420, 1000);
      shotsRef.current.push({ x: startX, y: startY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, len, life, age: 0 });
      // drop occasional secondary small sparkles
    }

    // measure and store excluded element rects (relative to canvas)
    function updateExcludeRects() {
      const rects = [];
      if (!excludeSelector) {
        excludeRectsRef.current = rects;
        return;
      }
      const sels = Array.isArray(excludeSelector) ? excludeSelector : [excludeSelector];
      const canvasRect = canvas.getBoundingClientRect();
      sels.forEach((sel) => {
        try {
          const nodes = document.querySelectorAll(sel);
          nodes.forEach((el) => {
            const r = el.getBoundingClientRect();
            const left = Math.max(0, Math.floor(r.left - canvasRect.left));
            const top = Math.max(0, Math.floor(r.top - canvasRect.top));
            const right = Math.min(canvasRect.width, Math.floor(r.right - canvasRect.left));
            const bottom = Math.min(canvasRect.height, Math.floor(r.bottom - canvasRect.top));
            const width = Math.max(0, right - left);
            const height = Math.max(0, bottom - top);
            if (width > 0 && height > 0) rects.push({ left, top, width, height });
          });
        } catch (err) {
          // ignore
        }
      });
      excludeRectsRef.current = rects;
    }

    // main draw loop
    function draw(now) {
      const dt = Math.min(40, now - lastTimeRef.current);
      lastTimeRef.current = now;
      if (hiddenRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const { w, h } = dimsRef.current;
      ctx.clearRect(0, 0, w, h);

      // draw subtle nebula blobs first (behind)
      if (nebula) {
        // soft radial blobs
        ctx.globalCompositeOperation = 'lighter';
        const blobs = [
          { x: w * 0.12, y: h * 0.2, r: Math.max(w, h) * 0.6, alpha: 0.09 },
          { x: w * 0.78, y: h * 0.34, r: Math.max(w, h) * 0.46, alpha: 0.07 },
        ];
        blobs.forEach((b, i) => {
          const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
          g.addColorStop(0, `rgba(${colorBase},${b.alpha})`);
          g.addColorStop(0.35, `rgba(${colorBase},${b.alpha * 0.26})`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
      }

      // pointer-based subtle parallax
      // compute a global parallax offset from pointer (low-frequency)
      const pointer = lastPointer.current || { x: null, y: null };
      const centerX = w / 2, centerY = h / 2;

      // draw stars (far -> near)
      ctx.globalCompositeOperation = 'lighter'; // additive for glows
      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // motion: slow drift
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < -20) { s.x = w + 20; s.baseX = s.x; }
        if (s.x > w + 20) { s.x = -20; s.baseX = s.x; }
        if (s.y < -20) { s.y = h + 20; s.baseY = s.y; }
        if (s.y > h + 20) { s.y = -20; s.baseY = s.y; }

        // twinkle
        s.twinklePhase += (s.twinkleSpeed * dt) / 1000;
        const tw = 0.75 + 0.25 * Math.sin(s.twinklePhase * 2);
        const alpha = Math.max(0.12, Math.min(1, s.brightness * tw));

        // parallax offset scaled by depth (near stars move more)
        let px = 0, py = 0;
        if (pointer.x != null && pointer.y != null) {
          const dx = (pointer.x - centerX);
          const dy = (pointer.y - centerY);
          px = dx * 0.0006 * (s.depth * 5); // tuned factor
          py = dy * 0.0006 * (s.depth * 5);
        }

        const drawX = s.x + px;
        const drawY = s.y + py;

        // glow
        const glowRadius = Math.max(4, s.r * 6 * (1 + s.glow * 0.9));
        const grd = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, glowRadius);
        // stronger core for very bright stars
        const coreAlpha = s.isBright ? Math.min(1, alpha + 0.28) : alpha;
        grd.addColorStop(0, `rgba(${s.color},${coreAlpha})`);
        grd.addColorStop(0.25, `rgba(${s.color},${coreAlpha * 0.35})`);
        grd.addColorStop(0.6, `rgba(${s.color},${coreAlpha * 0.08})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(drawX, drawY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.color},${Math.min(1, coreAlpha + 0.12)})`;
        ctx.arc(drawX, drawY, Math.max(0.4, s.r), 0, Math.PI * 2);
        ctx.fill();

        // tiny spark for very bright stars
        if (s.isBright && Math.random() < 0.001 * (dt / 16)) {
          // occasional small flare
          ctx.beginPath();
          ctx.fillStyle = `rgba(${s.color},0.9)`;
          ctx.arc(drawX + rand(-2, 2), drawY + rand(-2, 2), Math.max(1.2, s.r * 1.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // optional faint connects (constellation style) - very subtle
      if (connect) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 0.35;
        ctx.strokeStyle = `rgba(${colorBase},0.06)`;
        for (let i = 0; i < stars.length; i++) {
          const a = stars[i];
          for (let j = i + 1; j < stars.length; j++) {
            const b = stars[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < connectDistance * connectDistance) {
              const d = Math.sqrt(d2);
              const alpha = 0.06 * (1 - d / connectDistance);
              ctx.strokeStyle = `rgba(${colorBase},${alpha})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      // draw shooting stars
      ctx.globalCompositeOperation = 'lighter';
      const shots = shotsRef.current;
      for (let i = shots.length - 1; i >= 0; i--) {
        const p = shots[i];
        p.age += dt;
        if (p.age > p.life) {
          shots.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const prog = p.age / p.life;

        // tapered trail
        const tx = p.x - p.vx * (p.len * 0.5);
        const ty = p.y - p.vy * (p.len * 0.5);
        const grad = ctx.createLinearGradient(tx, ty, p.x, p.y);
        grad.addColorStop(0, `rgba(${colorBase},0)`);
        grad.addColorStop(0.6, `rgba(${colorBase},${0.6 * (1 - prog)})`);
        grad.addColorStop(1, `rgba(${colorBase},${0.95 * (1 - prog)})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(1.2, 2.0 * (1 - prog));
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = `rgba(${colorBase},${Math.max(0.6, 1 - prog)})`;
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // clear excluded rects (if any) — keep this hard clear so UI remains sharp
      const rects = excludeRectsRef.current;
      if (rects && rects.length) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        rects.forEach((r) => {
          // small padding for safety
          const pad = Math.min(48, Math.max(16, Math.round(Math.min(w, h) * 0.02)));
          const left = Math.max(0, r.left - pad);
          const top = Math.max(0, r.top - pad);
          const width = Math.min(w, r.width + pad * 2);
          const height = Math.min(h, r.height + pad * 2);
          // draw soft rounded rect clear (rounded helps blend)
          const radius = Math.min(48, Math.round(Math.min(width, height) * 0.12));
          roundRectClear(ctx, left, top, width, height, radius);
        });
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    } // end draw

    // helper: clear rounded rect by drawing a filled rounded rect (destination-out)
    function roundRectClear(ctx, x, y, w, h, r) {
      if (w <= 0 || h <= 0) return;
      ctx.beginPath();
      const minr = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + minr, y);
      ctx.arcTo(x + w, y, x + w, y + h, minr);
      ctx.arcTo(x + w, y + h, x, y + h, minr);
      ctx.arcTo(x, y + h, x, y, minr);
      ctx.arcTo(x, y, x + w, y, minr);
      ctx.closePath();
      ctx.fill();
    }

    // pointer handling for parallax
    const lastPointer = { current: null };
    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      lastPointer.current = { x: clientX - rect.left, y: clientY - rect.top };
      // store globally for draw loop access
      lastPointerGlobal.current = lastPointer.current;
    }
    const lastPointerGlobal = { current: null };
    // expose for draw loop closure
    Object.defineProperty(lastPointer, 'current', {
      get() { return lastPointerGlobal.current; },
      set(v) { lastPointerGlobal.current = v; },
    });

    // update exclude rects relative to canvas
    function updateExcludeRectsWrapper() {
      const rects = [];
      if (!excludeSelector) {
        excludeRectsRef.current = rects;
        return;
      }
      const sels = Array.isArray(excludeSelector) ? excludeSelector : [excludeSelector];
      const canvasRect = canvas.getBoundingClientRect();
      sels.forEach((s) => {
        try {
          const nodes = document.querySelectorAll(s);
          nodes.forEach((el) => {
            const r = el.getBoundingClientRect();
            const left = Math.max(0, Math.floor(r.left - canvasRect.left));
            const top = Math.max(0, Math.floor(r.top - canvasRect.top));
            const right = Math.min(canvasRect.width, Math.floor(r.right - canvasRect.left));
            const bottom = Math.min(canvasRect.height, Math.floor(r.bottom - canvasRect.top));
            const width = Math.max(0, right - left);
            const height = Math.max(0, bottom - top);
            if (width > 0 && height > 0) rects.push({ left, top, width, height });
          });
        } catch (err) {
          // ignore invalid selector
        }
      });
      excludeRectsRef.current = rects;
    }

    // pause/resume on visibility
    function onVisibility() {
      hiddenRef.current = document.hidden;
    }

    // initial setup
    resize();
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(draw);

    // event listeners
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', updateExcludeRectsWrapper, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    if (shootingFrequency > 0) {
      lastShotRef.current = performance.now() - Math.random() * shootingFrequency * 1000;
    }

    // shooting star timer using RAF-friendly logic
    function maybeSpawnShot(now) {
      const dt = Math.min(1000, now - lastTimeRef.current);
      if (shootingFrequency > 0 && Math.random() < (dt / (shootingFrequency * 1000))) {
        spawnShot();
      }
    }

    // cleanup
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', updateExcludeRectsWrapper);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    colorBase,
    density,
    maxStars,
    nebula,
    clusters,
    connect,
    connectDistance,
    shootingFrequency,
    excludeSelector,
  ]);

  // Canvas container
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -20,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          filter: 'saturate(1.02) contrast(1.02)',
        }}
      />
    </div>
  );
}