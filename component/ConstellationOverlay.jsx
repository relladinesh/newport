'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ConstellationOverlay (portal + debug)
 *
 * - Renders the full-screen SVG into document.body using a portal (reliable top-level overlay).
 * - debug: if true, draws visible debug dots and forces the SVG z-index on top so you can verify node detection.
 * - Keeps previous features: retries, MutationObserver, mask/exclude support, parallax, hover highlights.
 *
 * Usage:
 *  <ConstellationOverlay debug={true} nodeSelector=".orbit-node" excludeSelector={null} />
 */

export default function ConstellationOverlay({
  nodeSelector = '.orbit-node',
  targetSelector = null,
  color = '255,160,120',
  maxLinkDistance = 260,
  lineWidth = 1.0,
  lineOpacity = 0.12,
  highlightOpacity = 0.9,
  parallaxStrength = 0.03,
  excludeSelector = null,
  debug = false,          // show debug dots and stronger lines
  debugOnTop = false,     // put svg above everything when debugging
}) {
  const svgRef = useRef(null);
  const linksRef = useRef([]);
  const nodesRef = useRef([]);
  const targetsRef = useRef([]);
  const rafRef = useRef(0);
  const pointerRef = useRef({ x: null, y: null });
  const maskIdRef = useRef(`const-mask-${Math.random().toString(36).slice(2, 9)}`);
  const rebuildScheduled = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // small helpers
  function getCenter(el, svgRect) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - svgRect.left, y: r.top + r.height / 2 - svgRect.top };
  }
  function quadPath(x1, y1, x2, y2, curvature = 0.18) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const px = -dy;
    const py = dx;
    const len = Math.sqrt(px * px + py * py) || 1;
    const nx = px / len;
    const ny = py / len;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offset = Math.min(140, dist * curvature);
    const sign = ((Math.abs(Math.round((x1 + y1 + x2 + y2))) % 2) === 0) ? 1 : -1;
    const cx = mx + nx * offset * sign;
    const cy = my + ny * offset * sign;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }

  function rebuild() {
    const svg = svgRef.current;
    if (!svg) return;
    const svgRect = svg.getBoundingClientRect();

    const gLinks = svg.querySelector('g.const-links');
    const gNodes = svg.querySelector('g.const-nodes');
    const gTargets = svg.querySelector('g.const-targets');
    if (gLinks) gLinks.innerHTML = '';
    if (gNodes) gNodes.innerHTML = '';
    if (gTargets) gTargets.innerHTML = '';

    // find nodes (cap to avoid huge loops)
    const nodeEls = Array.from(document.querySelectorAll(nodeSelector)).slice(0, 140);
    nodesRef.current = nodeEls.map((el, i) => {
      const c = getCenter(el, svgRect);
      return { el, cx: c.x, cy: c.y, idx: i };
    });

    if (targetSelector) {
      const targetEls = Array.from(document.querySelectorAll(targetSelector));
      targetsRef.current = targetEls.map((el) => {
        const c = getCenter(el, svgRect);
        return { el, cx: c.x, cy: c.y };
      });
    } else {
      targetsRef.current = [];
    }

    // debug log
    // eslint-disable-next-line no-console
    console.log(`[ConstellationOverlay] found ${nodesRef.current.length} node(s) for selector "${nodeSelector}"`);

    // create links between nearby nodes
    linksRef.current = [];
    const gLinksEl = svg.querySelector('g.const-links');
    for (let i = 0; i < nodesRef.current.length; i++) {
      for (let j = i + 1; j < nodesRef.current.length; j++) {
        const a = nodesRef.current[i];
        const b = nodesRef.current[j];
        const dx = a.cx - b.cx;
        const dy = a.cy - b.cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= maxLinkDistance) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', `rgba(${color},${debug ? Math.min(1, lineOpacity * 2) : lineOpacity})`);
          path.setAttribute('stroke-width', `${lineWidth}`);
          path.setAttribute('vector-effect', 'non-scaling-stroke');
          path.setAttribute('opacity', String(debug ? Math.min(1, lineOpacity * 2) : lineOpacity));
          path.style.transition = 'stroke 220ms ease, opacity 220ms ease, stroke-width 220ms ease';
          gLinksEl.appendChild(path);
          linksRef.current.push({ pathEl: path, aIdx: i, bIdx: j });
        }
      }
    }

    // optional node->target links
    const gTargetsEl = svg.querySelector('g.const-targets');
    if (targetsRef.current.length > 0 && gTargetsEl) {
      nodesRef.current.forEach((n, i) => {
        let nearest = null;
        let bestD = Infinity;
        for (let t = 0; t < targetsRef.current.length; t++) {
          const targ = targetsRef.current[t];
          const dx = n.cx - targ.cx;
          const dy = n.cy - targ.cy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < bestD) {
            bestD = d;
            nearest = targ;
          }
        }
        if (nearest && bestD <= maxLinkDistance * 1.2) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', `rgba(${color},${lineOpacity * 0.9})`);
          path.setAttribute('stroke-width', `${lineWidth * 0.9}`);
          path.setAttribute('vector-effect', 'non-scaling-stroke');
          path.setAttribute('opacity', String(lineOpacity * 0.9));
          path.style.transition = 'stroke 220ms ease, opacity 220ms ease, stroke-width 220ms ease';
          gTargetsEl.appendChild(path);
          linksRef.current.push({ pathEl: path, aIdx: i, tTarget: nearest });
        }
      });
    }

    // if debug, draw visible dots to verify positions
    if (debug && gNodes) {
      nodesRef.current.forEach((n) => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', String(n.cx));
        dot.setAttribute('cy', String(n.cy));
        dot.setAttribute('r', '6');
        dot.setAttribute('fill', 'rgba(255,80,120,0.95)');
        dot.setAttribute('pointer-events', 'none');
        gNodes.appendChild(dot);
      });
    }

    updatePositions();
  }

  function updateMask() {
    const svg = svgRef.current;
    if (!svg) return;
    const mask = svg.querySelector(`#${maskIdRef.current}`);
    if (!mask) return;
    mask.innerHTML = '';
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'white');
    mask.appendChild(rect);

    if (!excludeSelector) return;
    const sels = Array.isArray(excludeSelector) ? excludeSelector : [excludeSelector];
    const canvasRect = svg.getBoundingClientRect();
    sels.forEach((s) => {
      try {
        const nodes = document.querySelectorAll(s);
        nodes.forEach((el) => {
          const r = el.getBoundingClientRect();
          const left = Math.max(0, Math.floor(r.left - canvasRect.left));
          const top = Math.max(0, Math.floor(r.top - canvasRect.top));
          const width = Math.max(0, Math.floor(r.width));
          const height = Math.max(0, Math.floor(r.height));
          const mr = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          mr.setAttribute('x', String(left));
          mr.setAttribute('y', String(top));
          mr.setAttribute('width', String(width));
          mr.setAttribute('height', String(height));
          mr.setAttribute('fill', 'black');
          mr.setAttribute('rx', String(Math.min(48, Math.round(Math.min(width, height) * 0.06))));
          mask.appendChild(mr);
        });
      } catch (err) {}
    });
  }

  function updatePositions() {
    const svg = svgRef.current;
    if (!svg) return;
    const svgRect = svg.getBoundingClientRect();
    nodesRef.current.forEach((n) => {
      const c = getCenter(n.el, svgRect);
      n.cx = c.x;
      n.cy = c.y;
    });
    targetsRef.current.forEach((t) => {
      const c = getCenter(t.el, svgRect);
      t.cx = c.x;
      t.cy = c.y;
    });

    linksRef.current.forEach((ln) => {
      const a = nodesRef.current[ln.aIdx];
      if (!a) return;
      if (ln.bIdx != null) {
        const b = nodesRef.current[ln.bIdx];
        if (!b) return;
        ln.pathEl.setAttribute('d', quadPath(a.cx, a.cy, b.cx, b.cy));
      } else if (ln.tTarget) {
        const t = ln.tTarget;
        ln.pathEl.setAttribute('d', quadPath(a.cx, a.cy, t.cx, t.cy, 0.12));
      }
    });

    updateMask();
  }

  function highlightNode(nodeObj, enter) {
    linksRef.current.forEach((ln) => {
      if (ln.aIdx === nodeObj.idx || ln.bIdx === nodeObj.idx) {
        if (enter) {
          ln.pathEl.setAttribute('stroke', `rgba(${color},${highlightOpacity})`);
          ln.pathEl.setAttribute('stroke-width', String(lineWidth * 1.8));
          ln.pathEl.setAttribute('opacity', '1');
        } else {
          ln.pathEl.setAttribute('stroke', `rgba(${color},${lineOpacity})`);
          ln.pathEl.setAttribute('stroke-width', String(lineWidth));
          ln.pathEl.setAttribute('opacity', String(lineOpacity));
        }
      }
      if (ln.aIdx === nodeObj.idx && ln.tTarget) {
        if (enter) {
          ln.pathEl.setAttribute('stroke', `rgba(${color},${highlightOpacity * 0.96})`);
          ln.pathEl.setAttribute('stroke-width', String(lineWidth * 1.6));
          ln.pathEl.setAttribute('opacity', '1');
          try { ln.tTarget.el.classList.add('constel-target-highlight'); } catch {}
        } else {
          ln.pathEl.setAttribute('stroke', `rgba(${color},${lineOpacity * 0.9})`);
          ln.pathEl.setAttribute('stroke-width', String(lineWidth * 0.9));
          ln.pathEl.setAttribute('opacity', String(lineOpacity * 0.9));
          try { ln.tTarget.el.classList.remove('constel-target-highlight'); } catch {}
        }
      }
    });
  }

  function attachNodeListeners() {
    nodesRef.current.forEach((n) => {
      const onEnter = () => highlightNode(n, true);
      const onLeave = () => highlightNode(n, false);
      n._enter = onEnter;
      n._leave = onLeave;
      n.el.addEventListener('mouseenter', onEnter);
      n.el.addEventListener('focus', onEnter, true);
      n.el.addEventListener('mouseleave', onLeave);
      n.el.addEventListener('blur', onLeave, true);
    });
  }

  function detachNodeListeners() {
    nodesRef.current.forEach((n) => {
      if (n._enter) n.el.removeEventListener('mouseenter', n._enter);
      if (n._leave) n.el.removeEventListener('mouseleave', n._leave);
      if (n._enter) n.el.removeEventListener('focus', n._enter, true);
      if (n._leave) n.el.removeEventListener('blur', n._leave, true);
      delete n._enter;
      delete n._leave;
    });
  }

  function onPointerMove(e) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    pointerRef.current.x = clientX - rect.left;
    pointerRef.current.y = clientY - rect.top;
  }

  function rafLoop() {
    const svg = svgRef.current;
    if (!svg) return;
    const g = svg.querySelector('g.const-group');
    if (g) {
      const p = pointerRef.current;
      const { width, height } = svg.getBoundingClientRect();
      if (p.x != null && p.y != null) {
        const dx = (p.x - width / 2) * parallaxStrength;
        const dy = (p.y - height / 2) * parallaxStrength;
        g.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      } else {
        g.style.transform = `translate3d(0,0,0)`;
      }
    }
    rafRef.current = requestAnimationFrame(rafLoop);
  }

  useEffect(() => {
    if (!mounted) return;
    const svg = svgRef.current;
    if (!svg) return;

    svg.innerHTML = `
      <defs>
        <mask id="${maskIdRef.current}"></mask>
      </defs>
      <g class="const-group" mask="url(#${maskIdRef.current})">
        <g class="const-links"></g>
        <g class="const-targets"></g>
        <g class="const-nodes"></g>
      </g>
    `;
    svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;');

    // initial build + retries
    rebuild();
    setTimeout(() => rebuild(), 200);
    setTimeout(() => rebuild(), 800);

    attachNodeListeners();

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    let pending = false;
    function scheduleRecalc() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        rebuild();
      });
    }
    window.addEventListener('resize', scheduleRecalc, { passive: true });
    window.addEventListener('scroll', scheduleRecalc, { passive: true });

    const mo = new MutationObserver(() => {
      if (rebuildScheduled.current) return;
      rebuildScheduled.current = true;
      requestAnimationFrame(() => {
        rebuildScheduled.current = false;
        rebuild();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    rafRef.current = requestAnimationFrame(rafLoop);
    const intervalId = setInterval(updatePositions, 600);

    return () => {
      cancelAnimationFrame(rafRef.current);
      detachNodeListeners();
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('resize', scheduleRecalc);
      window.removeEventListener('scroll', scheduleRecalc);
      mo.disconnect();
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, nodeSelector, targetSelector, color, maxLinkDistance, lineWidth, lineOpacity, excludeSelector]);

  // portal render
  if (!mounted) return null;

  const svgElement = (
    <svg
      ref={svgRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: debugOnTop || debug ? 9999 : -25,
        pointerEvents: 'none',
      }}
    />
  );

  return createPortal(svgElement, document.body);
}