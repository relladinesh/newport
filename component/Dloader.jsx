'use client';

import React, { useEffect, useRef } from 'react';

/**
 * DThreeLoader.jsx
 *
 * Three.js particle-based "D" loader (client-only).
 *
 * NOTE: only change from your previous version is that the pointInShape helper
 * is defined before initThree so it is always available when sampling SVG points.
 */

export default function DThreeLoader({
  size = 280,
  particleCount = 900,
  particleColorA = '#ff7ab6',
  particleColorB = '#ffd36b',
  dColor = '#fb923c',
  assembleMs = 900,
  holdMs = 700,
  disperseMs = 700,
  loop = true,
}) {
  const containerRef = useRef(null);
  const animRef = useRef({ raf: null, running: false });

  useEffect(() => {
    let mounted = true;
    let THREE = null;
    let SVGLoader = null;
    let renderer, scene, camera, points, geometry, material;
    let particlePositions, particleTargetPositions;
    let particleColors;
    let stage = 'idle';
    let stageStart = 0;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
    const effectiveCount = Math.max(64, Math.round(particleCount * (isMobile ? 0.45 : 1)));

    // D SVG path (keeps same shape)
    const dPath =
      'M60 30 H110 C142 30 170 58 170 90 C170 122 142 150 110 150 H60 Z M80 55 H110 C130 55 145 70 145 90 C145 110 130 125 110 125 H80 Z';
    const svgTemplate = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><path d="${dPath}" /></svg>`;

    // --- Ensure pointInShape is available before initThree runs ---
    // vanilla point-in-polygon for fallback sampling (simple winding rule)
    function pointInShape(x, y, pts) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i].x,
          yi = pts[i].y;
        const xj = pts[j].x,
          yj = pts[j].y;
        const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }
    // ----------------------------------------------------------------

    // create circular sprite for particle rendering (uses particleColorA/B)
    function createSprite(colA = '#fff', colB = '#fff') {
      const r = 64;
      const c = document.createElement('canvas');
      c.width = r;
      c.height = r;
      const ctx = c.getContext('2d');

      // radial gradient for particle (original pastel look)
      const g = ctx.createRadialGradient(r * 0.35, r * 0.35, 1, r * 0.5, r * 0.5, r * 0.9);
      g.addColorStop(0, colA);
      g.addColorStop(0.6, colB);
      g.addColorStop(1, 'rgba(255,255,255,0.02)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(r / 2, r / 2, r / 2 - 1, 0, Math.PI * 2);
      ctx.fill();

      // subtle inner glow
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.arc(r * 0.4, r * 0.35, r * 5 / 12, 0, Math.PI * 2);
      ctx.fill();
      return c;
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function seededRandom(seed) {
      let s = seed % 2147483647;
      if (s <= 0) s += 2147483646;
      return function () {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    }

    function hexToRgb(hex) {
      const h = hex.replace('#', '');
      const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
      return { r: ((bigint >> 16) & 255) / 255, g: ((bigint >> 8) & 255) / 255, b: (bigint & 255) / 255 };
    }

    function lerpColor(a, b, t) {
      const ac = hexToRgb(a);
      const bc = hexToRgb(b);
      return {
        r: ac.r + (bc.r - ac.r) * t,
        g: ac.g + (bc.g - ac.g) * t,
        b: ac.b + (bc.b - ac.b) * t,
      };
    }

    async function initThree() {
      // dynamic imports
      const threeModule = await import('three');
      THREE = threeModule;
      const svgModule = await import('three/examples/jsm/loaders/SVGLoader.js');
      SVGLoader = svgModule.SVGLoader;

      // renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0); // transparent background
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(size, size);

      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = ''; // clear
      container.appendChild(renderer.domElement);

      // camera & scene
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, 1, 1, 2000);
      camera.position.z = 300;

      // create sprite based on particle colors
      const spriteCanvas = createSprite(particleColorA, particleColorB);
      const spriteTex = new THREE.CanvasTexture(spriteCanvas);
      spriteTex.needsUpdate = true;

      // Build target positions by sampling the SVG "D" shapes
      const loader = new SVGLoader();
      const data = loader.parse(svgTemplate);
      // gather shapes
      const shapes = [];
      data.paths.forEach((p) => {
        p.toShapes(true).forEach((s) => shapes.push(s));
      });

      // Collect sampled points across shapes. We will sample many points proportionally to each shape area.
      const rand = seededRandom(123456);

      // Compute approximate area weights so we can sample proportional to area
      const shapeInfos = shapes.map((shape) => {
        const pts = shape.getPoints(200);
        let area = 0;
        for (let i = 0, len = pts.length; i < len; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % len];
          area += a.x * b.y - b.x * a.y;
        }
        area = Math.abs(area / 2) + 1e-6;
        return { shape, pts, area };
      });

      const totalArea = shapeInfos.reduce((s, it) => s + it.area, 0);
      const targets = [];

      // sample points on shapes: proportional number per shape
      shapeInfos.forEach((info) => {
        const countForShape = Math.max(8, Math.round((info.area / totalArea) * effectiveCount));
        // sample using shape.getSpacedPoints or sampling along contour and interior scatter
        const contour = info.shape.getSpacedPoints(Math.max(32, Math.round(countForShape / 3)));
        // fill interior by random barycentric sampling (fast)
        for (let i = 0; i < countForShape; i++) {
          // pick a random point in bbox until inside shape
          const bbox = info.shape.getBoundingBox ? info.shape.getBoundingBox() : null;
          // fallback bounding box compute
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          info.pts.forEach((p) => {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
          });
          const width = maxX - minX;
          const height = maxY - minY;
          // try a few times to get inside point
          let sampleX, sampleY, attempts = 0, inside = false;
          while (attempts < 8 && !inside) {
            sampleX = minX + rand() * width;
            sampleY = minY + rand() * height;
            // use helper defined above
            inside = info.shape.containsPoint ? info.shape.containsPoint(new THREE.Vector2(sampleX, sampleY)) : pointInShape(sampleX, sampleY, info.pts);
            attempts++;
          }
          // fallback to contour if sampling fails
          if (!inside) {
            const c = contour[Math.floor(rand() * contour.length)];
            sampleX = c.x; sampleY = c.y;
          }
          targets.push([sampleX, sampleY]);
        }
      });

      // scale and center targets to our scene coordinates
      const scale = (size * 0.9) / 200; // scale factor
      const centeredTargets = targets.map(([x, y]) => {
        const tx = (x - 100) * scale;
        const ty = -(y - 100) * scale; // invert Y to match three.js
        const tz = (rand() - 0.5) * 4; // small depth jitter
        return [tx, ty, tz];
      });

      // Ensure we have exactly effectiveCount targets (repeat or trim)
      const finalTargets = [];
      for (let i = 0; i < effectiveCount; i++) {
        finalTargets.push(centeredTargets[i % centeredTargets.length]);
      }

      // create buffers
      geometry = new THREE.BufferGeometry();
      particlePositions = new Float32Array(effectiveCount * 3);
      particleTargetPositions = new Float32Array(effectiveCount * 3);
      particleColors = new Float32Array(effectiveCount * 3);

      // initial random positions (spread around)
      for (let i = 0; i < effectiveCount; i++) {
        const ix = i * 3;
        const rx = (rand() - 0.5) * size * 1.6;
        const ry = (rand() - 0.5) * size * 1.6;
        const rz = (rand() - 0.5) * 120;
        particlePositions[ix] = rx;
        particlePositions[ix + 1] = ry;
        particlePositions[ix + 2] = rz;

        // target
        const t = finalTargets[i];
        particleTargetPositions[ix] = t[0];
        particleTargetPositions[ix + 1] = t[1];
        particleTargetPositions[ix + 2] = t[2];

        // color - since particleColorA/particleColorB define gradient
        const tnorm = i / effectiveCount;
        const col = lerpColor(particleColorA, particleColorB, tnorm);
        particleColors[ix] = col.r;
        particleColors[ix + 1] = col.g;
        particleColors[ix + 2] = col.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
      geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
      geometry.computeBoundingSphere();

      // material
      material = new THREE.PointsMaterial({
        size: Math.max(2.8, (size / 320) * 4.4),
        map: spriteTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);

      // small subtle rotation of group
      points.rotation.y = 0.06;

      // handle resizing of renderer
      function handleResize() {
        const s = Math.min(size, Math.max(160, Math.round(container.clientWidth)));
        renderer.setSize(s, s, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
      }
      window.addEventListener('resize', handleResize);

      // stage timing
      stage = 'idle';
      stageStart = performance.now();

      // animation loop: interpolate positions towards targets depending on stage
      const ease = (t) => 1 - Math.pow(1 - t, 3);

      function animate(now) {
        if (!mounted) return;
        animRef.current.raf = requestAnimationFrame(animate);

        // measure stage progress
        const elapsed = now - stageStart;

        if (stage === 'idle' && elapsed > 220) {
          stage = 'assemble';
          stageStart = now;
        }

        // progress fraction for assemble/disperse
        let progress = 0;
        if (stage === 'assemble') {
          progress = Math.min(1, elapsed / Math.max(80, assembleMs));
        } else if (stage === 'hold') {
          progress = 1;
        } else if (stage === 'disperse') {
          progress = Math.min(1, elapsed / Math.max(80, disperseMs));
        }

        // update positions buffer
        const posAttr = geometry.getAttribute('position');
        for (let i = 0; i < effectiveCount; i++) {
          const ix = i * 3;
          let px = posAttr.array[ix];
          let py = posAttr.array[ix + 1];
          let pz = posAttr.array[ix + 2];

          const tx = particleTargetPositions[ix];
          const ty = particleTargetPositions[ix + 1];
          const tz = particleTargetPositions[ix + 2];

          if (stage === 'assemble' || stage === 'hold') {
            const t = ease(progress);
            // small per-particle variation
            const v = 0.88 + (i % 7) * 0.006;
            posAttr.array[ix] = lerp(px, tx + Math.sin((now + i * 12) * 0.002 + i) * 0.4, v * t + (1 - t) * 0.04);
            posAttr.array[ix + 1] = lerp(py, ty + Math.cos((now + i * 8) * 0.003 + i) * 0.4, v * t + (1 - t) * 0.04);
            posAttr.array[ix + 2] = lerp(pz, tz + Math.sin((now + i * 5) * 0.004) * 0.6, v * t + (1 - t) * 0.04);
          } else if (stage === 'disperse') {
            // move back to random scatter or beyond
            const factor = ease(progress);
            posAttr.array[ix] = lerp(px, (Math.random() - 0.5) * size * (1 + factor * 1.8), 0.08 + factor * 0.5);
            posAttr.array[ix + 1] = lerp(py, (Math.random() - 0.5) * size * (1 + factor * 1.2), 0.08 + factor * 0.5);
            posAttr.array[ix + 2] = lerp(pz, (Math.random() - 0.5) * 200 * (1 + factor * 1.2), 0.08 + factor * 0.5);
          }
        }

        posAttr.needsUpdate = true;

        // switch stages
        if (stage === 'assemble' && elapsed >= assembleMs) {
          stage = 'hold';
          stageStart = now;
        } else if (stage === 'hold' && elapsed >= holdMs) {
          stage = 'disperse';
          stageStart = now;
        } else if (stage === 'disperse' && elapsed >= disperseMs) {
          if (loop) {
            stage = 'idle';
            stageStart = now;
          } else {
            // stop animation loop if not looping
            cancelAnimationFrame(animRef.current.raf);
            animRef.current.raf = null;
            animRef.current.running = false;
          }
        }

        // small rotation to give depth
        points.rotation.y += 0.002;

        try {
          renderer.render(scene, camera);
        } catch (err) {
          // fail-safe: stop loop on render error
          if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
          animRef.current.raf = null;
        }
      }

      // start RAF
      animRef.current.running = true;
      animRef.current.raf = requestAnimationFrame(animate);

      // cleanup on unmount
      const cleanup = () => {
        mounted = false;
        window.removeEventListener('resize', handleResize);
        if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
        if (renderer) {
          renderer.dispose();
          if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        }
        // dispose geometry/material
        try {
          if (geometry) geometry.dispose();
          if (material) material.dispose();
          if (spriteTex) spriteTex.dispose();
        } catch (e) {
          // noop
        }
      };

      // attach cleanup to ref for outer effect cleanup
      animRef.current.cleanup = cleanup;
    } // end initThree

    // start initialization (client-only)
    if (typeof window !== 'undefined' && !prefersReduced) {
      initThree().catch((err) => {
        // if something fails, we silently skip and allow fallback content
        // eslint-disable-next-line no-console
        console.error('DThreeLoader init error:', err);
      });
    }

    // If reduced-motion, don't initialize three; keep static fallback SVG in DOM (rendered below).
    return () => {
      mounted = false;
      if (animRef.current && animRef.current.cleanup) animRef.current.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, particleCount, particleColorA, particleColorB, dColor, assembleMs, holdMs, disperseMs, loop]);

  // Fallback SVG shows an orange D (dColor) while particles load or for reduced-motion users.
  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        position: 'relative',
      }}
      aria-hidden={false}
      role="status"
    >
      {/* Static SVG fallback (orange D) */}
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" focusable="false" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="DgradFallback" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={dColor} stopOpacity="1" />
            <stop offset="100%" stopColor={dColor} stopOpacity="1" />
          </linearGradient>

          <filter id="softOrange" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feBlend in="SourceGraphic" in2="b" mode="screen" />
          </filter>
        </defs>

        <g filter="url(#softOrange)">
          <path d="M60 30 H110 C142 30 170 58 170 90 C170 122 142 150 110 150 H60 Z" fill="url(#DgradFallback)" />
          <path d="M80 55 H110 C130 55 145 70 145 90 C145 110 130 125 110 125 H80 Z" fill="#000000" opacity="0.06" />
        </g>
      </svg>
    </div>
  );
}