/*
 * Wall script — progressive enhancement of the card list into the wall.
 * When JavaScript runs it:
 *   1. switches the container to "wall mode" (cards absolutely placed on a
 *      plane, using the CSS variables written at build time),
 *   2. measures the cards and draws orthogonal wires between their ports,
 *   3. runs a camera: drag (mouse / touch), inertia, elastic edges, wheel
 *      panning, and auto-centering of the card that receives keyboard focus.
 * Without JS the plain card list stays as is.
 * Exposes: initWall().
 */

type Side = 'n' | 'e' | 's' | 'w';

interface WallLink {
  from: string;
  fromSide: Side;
  to: string;
  toSide: Side;
}

interface Point {
  x: number;
  y: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const DRAG_THRESHOLD = 6; // px moved before a press becomes a drag (keeps clicks working)
const FRICTION = 0.94; // velocity kept per 16ms frame during inertia
const EDGE_RESISTANCE = 0.35; // share of the movement applied past the edges
const SPRING = 0.18; // how fast the wall springs back inside its bounds
const EASE_TO = 0.14; // how fast the camera glides to a target card
const EDGE_PADDING = 120; // how far past the outermost cards the camera may go

function isSide(value: unknown): value is Side {
  return value === 'n' || value === 'e' || value === 's' || value === 'w';
}

function isLink(value: unknown): value is WallLink {
  if (typeof value !== 'object' || value === null) return false;
  const l = value as Record<string, unknown>;
  return typeof l.from === 'string' && typeof l.to === 'string' && isSide(l.fromSide) && isSide(l.toSide);
}

/** Links are serialized at build time in data-links; validate before use. */
function parseLinks(raw: string | undefined): WallLink[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? (data as unknown[]).filter(isLink) : [];
  } catch {
    return [];
  }
}

/** Middle of one edge of a box. */
function portPoint(b: Box, side: Side): Point {
  switch (side) {
    case 'n':
      return { x: b.x + b.w / 2, y: b.y };
    case 's':
      return { x: b.x + b.w / 2, y: b.y + b.h };
    case 'e':
      return { x: b.x + b.w, y: b.y + b.h / 2 };
    case 'w':
      return { x: b.x, y: b.y + b.h / 2 };
  }
}

/** Orthogonal path between two ports (right angles only, like a schematic). */
function route(a: Point, aSide: Side, b: Point, bSide: Side): string {
  const horizontalA = aSide === 'e' || aSide === 'w';
  const horizontalB = bSide === 'e' || bSide === 'w';
  if (horizontalA && horizontalB) {
    const mid = (a.x + b.x) / 2;
    return `M${a.x} ${a.y} H${mid} V${b.y} H${b.x}`;
  }
  if (!horizontalA && !horizontalB) {
    const mid = (a.y + b.y) / 2;
    return `M${a.x} ${a.y} V${mid} H${b.x} V${b.y}`;
  }
  // Mixed: leave A along its axis, then turn once toward B
  return horizontalA ? `M${a.x} ${a.y} H${b.x} V${b.y}` : `M${a.x} ${a.y} V${b.y} H${b.x}`;
}

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export function initWall(): void {
  const wall = document.querySelector<HTMLElement>('[data-wall]');
  const plane = wall?.querySelector<HTMLElement>('[data-plane]');
  const svg = wall?.querySelector<SVGSVGElement>('[data-wires]');
  if (!wall || !plane || !svg) return;

  const links = parseLinks(wall.dataset.links);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // ---- Camera state: plane translation (px) and zoom ----
  const cam = { x: 0, y: 0, scale: 1 };
  const velocity = { x: 0, y: 0 }; // px per ms
  let target: Point | null = null; // when set, the camera glides there
  let bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 }; // allowed camera translations
  let frame = 0;
  let userMoved = false; // once the visitor moves the wall, never recenter on our own

  const render = (): void => {
    plane.style.transform = `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.scale})`;
  };

  /** Card box in plane coordinates (independent of the camera). */
  const boxOf = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    const p = plane.getBoundingClientRect();
    return {
      x: (r.left - p.left) / cam.scale,
      y: (r.top - p.top) / cam.scale,
      w: r.width / cam.scale,
      h: r.height / cam.scale,
    };
  };

  const cards = (): HTMLElement[] => [...plane.querySelectorAll<HTMLElement>('[data-node]')];

  /** Camera translation that puts a plane point at the center of the screen. */
  const centerOn = (p: Point): Point => ({
    x: wall.clientWidth / 2 - p.x * cam.scale,
    y: wall.clientHeight / 2 - p.y * cam.scale,
  });

  /** The screen center may travel anywhere over the cards, plus a margin. */
  const computeBounds = (): void => {
    const boxes = cards().map(boxOf);
    if (boxes.length === 0) return;
    const minX = Math.min(...boxes.map((b) => b.x)) - EDGE_PADDING;
    const minY = Math.min(...boxes.map((b) => b.y)) - EDGE_PADDING;
    const maxX = Math.max(...boxes.map((b) => b.x + b.w)) + EDGE_PADDING;
    const maxY = Math.max(...boxes.map((b) => b.y + b.h)) + EDGE_PADDING;
    const halfW = wall.clientWidth / 2;
    const halfH = wall.clientHeight / 2;
    bounds = {
      minX: halfW - maxX * cam.scale,
      maxX: halfW - minX * cam.scale,
      minY: halfH - maxY * cam.scale,
      maxY: halfH - minY * cam.scale,
    };
  };

  const outside = (): Point => ({
    x: cam.x - clamp(cam.x, bounds.minX, bounds.maxX),
    y: cam.y - clamp(cam.y, bounds.minY, bounds.maxY),
  });

  // ---- Animation loop: inertia, spring-back and glides share one loop ----
  let last = 0;
  const tick = (now: number): void => {
    const dt = Math.min(now - last, 64) || 16;
    last = now;
    const k = dt / 16; // frame-rate independent factors

    if (target) {
      cam.x += (target.x - cam.x) * Math.min(1, EASE_TO * k);
      cam.y += (target.y - cam.y) * Math.min(1, EASE_TO * k);
      if (Math.hypot(target.x - cam.x, target.y - cam.y) < 0.5) {
        cam.x = target.x;
        cam.y = target.y;
        target = null;
      }
    } else {
      cam.x += velocity.x * dt;
      cam.y += velocity.y * dt;
      const decay = Math.pow(FRICTION, k);
      velocity.x *= decay;
      velocity.y *= decay;

      const over = outside();
      if (over.x !== 0 || over.y !== 0) {
        // Past an edge: kill the momentum faster and spring back inside
        velocity.x *= 0.6;
        velocity.y *= 0.6;
        cam.x -= over.x * Math.min(1, SPRING * k);
        cam.y -= over.y * Math.min(1, SPRING * k);
      }
    }
    render();

    const moving =
      target !== null ||
      Math.hypot(velocity.x, velocity.y) > 0.01 ||
      Math.hypot(outside().x, outside().y) > 0.5;
    frame = moving ? requestAnimationFrame(tick) : 0;
  };

  const startLoop = (): void => {
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const stopMotion = (): void => {
    velocity.x = 0;
    velocity.y = 0;
    target = null;
  };

  /** Moves the camera to a card (instantly under reduced motion). */
  const goTo = (el: Element): void => {
    const b = boxOf(el);
    const dest = centerOn({ x: b.x + b.w / 2, y: b.y + Math.min(b.h, wall.clientHeight) / 2 });
    stopMotion();
    if (reducedMotion.matches) {
      cam.x = dest.x;
      cam.y = dest.y;
      render();
    } else {
      target = dest;
      startLoop();
    }
  };

  // ---- Wires ----
  const drawWires = (): void => {
    svg.replaceChildren();
    plane.querySelectorAll('.is-linked').forEach((el) => el.classList.remove('is-linked'));

    for (const link of links) {
      const fromEl = document.getElementById(link.from);
      const toEl = document.getElementById(link.to);
      if (!fromEl || !toEl) continue;

      const a = portPoint(boxOf(fromEl), link.fromSide);
      const b = portPoint(boxOf(toEl), link.toSide);

      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', route(a, link.fromSide, b, link.toSide));
      path.setAttribute('class', 'wire');
      path.dataset.from = link.from;
      path.dataset.to = link.to;
      svg.append(path);

      // Bus tap: a small junction where a branch leaves a horizontal line
      const fromHorizontal = link.fromSide === 'e' || link.fromSide === 'w';
      const toVertical = link.toSide === 'n' || link.toSide === 's';
      if (fromHorizontal && toVertical) {
        const tap = document.createElementNS(SVG_NS, 'rect');
        tap.setAttribute('x', String(b.x - 4));
        tap.setAttribute('y', String(a.y - 4));
        tap.setAttribute('width', '8');
        tap.setAttribute('height', '8');
        tap.setAttribute('class', 'tap');
        svg.append(tap);
      }

      fromEl.querySelector(`[data-port="${link.fromSide}"]`)?.classList.add('is-linked');
      toEl.querySelector(`[data-port="${link.toSide}"]`)?.classList.add('is-linked');
    }
  };

  // ---- Drag (mouse, pen and touch through Pointer Events) ----
  let press: { id: number; x: number; y: number; camX: number; camY: number } | null = null;
  let dragging = false;
  let samples: { x: number; y: number; t: number }[] = [];
  let suppressClick = false;

  wall.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    stopMotion();
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, camX: cam.x, camY: cam.y };
    dragging = false;
    samples = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }];
  });

  wall.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    if (!dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      dragging = true;
      userMoved = true;
      wall.setPointerCapture(e.pointerId);
      wall.classList.add('is-dragging');
    }
    // Free movement inside the bounds, resistance beyond them
    const freeX = clamp(press.camX + dx, bounds.minX, bounds.maxX);
    const freeY = clamp(press.camY + dy, bounds.minY, bounds.maxY);
    cam.x = freeX + (press.camX + dx - freeX) * EDGE_RESISTANCE;
    cam.y = freeY + (press.camY + dy - freeY) * EDGE_RESISTANCE;
    render();

    samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    samples = samples.filter((s) => e.timeStamp - s.t < 100); // last 100ms only
  });

  const release = (e: PointerEvent): void => {
    if (!press || e.pointerId !== press.id) return;
    press = null;
    if (!dragging) return;
    dragging = false;
    suppressClick = true; // the click that follows a drag must not open a card
    wall.classList.remove('is-dragging');

    const first = samples[0];
    const lastSample = samples[samples.length - 1];
    if (first && lastSample && lastSample.t > first.t && !reducedMotion.matches) {
      velocity.x = (lastSample.x - first.x) / (lastSample.t - first.t);
      velocity.y = (lastSample.y - first.y) / (lastSample.t - first.t);
    }
    startLoop(); // inertia and/or spring-back
  };

  wall.addEventListener('pointerup', release);
  wall.addEventListener('pointercancel', release);

  wall.addEventListener(
    'click',
    (e) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );

  // ---- Wheel / trackpad: pan the wall instead of scrolling the page ----
  wall.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) return; // leave pinch-zoom to the browser
      e.preventDefault();
      stopMotion();
      userMoved = true;
      const factor = e.deltaMode === 1 ? 16 : 1; // lines -> px
      cam.x = clamp(cam.x - e.deltaX * factor, bounds.minX, bounds.maxX);
      cam.y = clamp(cam.y - e.deltaY * factor, bounds.minY, bounds.maxY);
      render();
    },
    { passive: false },
  );

  // ---- Keyboard: bring the focused card into view ----
  wall.addEventListener('focusin', (e) => {
    if (dragging || !(e.target instanceof Element)) return;
    const card = e.target.closest('[data-node]');
    if (card) goTo(card);
  });
  // The browser may scroll the overflow:hidden wall itself on focus: undo it
  wall.addEventListener('scroll', () => {
    wall.scrollTop = 0;
    wall.scrollLeft = 0;
  });

  // ---- Setup ----
  const layout = (): void => {
    wall.classList.add('is-wall');
    cam.scale = 1;
    drawWires();
    computeBounds();
  };

  // Opening card: the one named in the URL hash ("/#node-projects", used by
  // "back to the wall" links), otherwise Léo's card
  const hashTarget = location.hash ? document.getElementById(location.hash.slice(1)) : null;
  const startCard = hashTarget?.matches('[data-node]') ? hashTarget : document.getElementById('node-leo');

  const centerOnStart = (): void => {
    if (!startCard) return;
    const b = boxOf(startCard);
    Object.assign(cam, centerOn({ x: b.x + b.w / 2, y: b.y + Math.min(b.h, wall.clientHeight) / 2 }));
    render();
  };

  layout();
  centerOnStart();
  // The hash also makes the browser scroll the page toward the card: undo it
  if (hashTarget) requestAnimationFrame(() => window.scrollTo(0, 0));

  // Size changes (window resize, fonts loaded) move ports: redraw and re-bound
  new ResizeObserver(() => {
    layout();
    startLoop(); // springs back inside if the new bounds require it
  }).observe(wall);
  void document.fonts.ready.then(() => {
    layout();
    if (!userMoved) centerOnStart();
  });
}
