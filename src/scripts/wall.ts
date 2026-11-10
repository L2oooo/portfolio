/*
 * Wall script — progressive enhancement of the 5 tiles into an infinite wall.
 * When JavaScript runs it:
 *   1. fills the screen with a grid of tiles: the 5 real tiles plus clones,
 *      following the pattern "tile of cell (c, r) = (c + 2r) mod 5", so two
 *      neighbours are never the same tile;
 *   2. recycles that grid like a torus: a tile leaving one side comes back on
 *      the other, shifted by a multiple of 5 cells, so it stays the same tile
 *      and is only moved (never rebuilt) — the wall is infinite;
 *   3. runs a camera: drag (mouse / touch) with inertia, wheel panning, and
 *      gliding to a tile (bottom bar, keyboard focus, "#node-x" in the URL);
 *   4. curves the wall: each tile tilts and shrinks with its distance from the
 *      screen center (CSS 3D), and gets a glass reflection / lens fringe;
 *   5. drives the bottom bar and the wall / list toggle (choice remembered).
 * Clones are hidden from keyboard and screen readers (only the 5 real tiles
 * are announced) but stay clickable with the mouse.
 * Without JS the plain list of the 5 tiles stays as is.
 * Exposes: initWall().
 */

interface Point {
  x: number;
  y: number;
}

/** One cell of the recycled grid and the element shown in it. */
interface Slot {
  el: HTMLElement;
  c: number;
  r: number;
  ref: string; // id of the real tile it shows, e.g. "node-projects"
}

const PERIOD = 5; // number of different tiles = length of the pattern
const DRAG_THRESHOLD = 6; // px moved before a press becomes a drag (keeps clicks working)
const FRICTION = 0.94; // velocity kept per 16ms frame during inertia
const EASE_TO = 0.12; // how fast the camera glides to a target tile

// Curvature ("dome") settings
const TILT_DEG = 14; // max rotation of a tile one screen-half away from the center
const SHRINK = 0.07; // scale lost per unit of squared distance
const MIN_SCALE = 0.78;
const PERSPECTIVE = 1600; // px, lower = stronger 3D

const VIEW_KEY = 'wall-view'; // localStorage key of the visitor's wall/list choice
type View = 'wall' | 'list';

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'wall';
  } catch {
    return 'wall'; // storage blocked: default view
  }
}

function saveView(view: View): void {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    /* storage blocked: the choice simply won't persist */
  }
}

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
const round = (v: number): number => Math.round(v * 1000) / 1000;
const mod = (a: number, n: number): number => ((a % n) + n) % n;

/** A copy of a real tile: clickable with the mouse, invisible to keyboard and screen readers. */
function makeClone(tile: HTMLElement): HTMLElement {
  const clone = tile.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.setAttribute('aria-hidden', 'true');
  clone.dataset.clone = '';
  clone.style.viewTransitionName = 'none'; // transition names must stay unique
  clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  clone.querySelectorAll('[aria-labelledby]').forEach((n) => n.removeAttribute('aria-labelledby'));
  clone.querySelectorAll('a, button').forEach((n) => n.setAttribute('tabindex', '-1'));
  // Only one <h1> per page: the clone's becomes a <div> with the same look
  const h1 = clone.querySelector('h1');
  if (h1) {
    const div = document.createElement('div');
    for (const attr of h1.attributes) div.setAttribute(attr.name, attr.value);
    div.append(...h1.childNodes);
    h1.replaceWith(div);
  }
  return clone;
}

export function initWall(): void {
  const wall = document.querySelector<HTMLElement>('[data-wall]');
  const plane = wall?.querySelector<HTMLElement>('[data-plane]');
  if (!wall || !plane) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const realTiles = [...plane.querySelectorAll<HTMLElement>('[data-ref]')]; // reading order
  if (realTiles.length === 0) return;

  // ---- Grid state ----
  let slots: Slot[] = [];
  let cols = 0;
  let rows = 0;
  let tileW = 0;
  let tileH = 0;
  let cellW = 0;
  let cellH = 0;

  // ---- Camera state (translation of the whole grid, in px) ----
  const cam = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 }; // px per ms
  let target: Point | null = null;
  let frame = 0;
  let view: View = 'wall';

  const bar = document.querySelector<HTMLElement>('[data-wall-bar]');
  const barLinks = [...(bar?.querySelectorAll<HTMLAnchorElement>('a[data-target]') ?? [])];
  const toggle = bar?.querySelector<HTMLButtonElement>('[data-view-toggle]');
  const toggleLabel = toggle?.querySelector<HTMLElement>('[data-view-label]');

  /** Tile size and spacing, read from the CSS (--tile-w, --tile-gap, aspect-ratio). */
  const measure = (): void => {
    const first = realTiles[0]!;
    tileW = first.offsetWidth;
    tileH = first.offsetHeight;
    const gap = parseFloat(getComputedStyle(wall).getPropertyValue('--tile-gap')) || 24;
    cellW = tileW + gap;
    cellH = tileH + gap;
  };

  /** Creates the grid: enough cells to cover the screen, in multiples of the pattern. */
  const buildGrid = (): void => {
    plane.querySelectorAll('[data-clone]').forEach((n) => n.remove());
    cols = PERIOD * Math.ceil((wall.clientWidth + 2 * cellW) / (PERIOD * cellW));
    rows = PERIOD * Math.ceil((wall.clientHeight + 2 * cellH) / (PERIOD * cellH));
    const placed = new Set<number>();
    slots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = (c + 2 * r) % PERIOD;
        const real = realTiles[k % realTiles.length]!;
        let el = real;
        if (placed.has(k)) {
          el = makeClone(real);
          plane.append(el);
        }
        placed.add(k);
        slots.push({ el, c, r, ref: real.dataset.ref ?? '' });
      }
    }
  };

  /** Top-left corner of a slot on screen, wrapped so the grid never ends. */
  const positionOf = (s: Slot): Point => ({
    x: mod(s.c * cellW + cam.x + cellW, cols * cellW) - cellW,
    y: mod(s.r * cellH + cam.y + cellH, rows * cellH) - cellH,
  });

  // ---- Bottom bar: highlight the tile nearest to the screen center ----
  let currentRef = '';
  const markCurrent = (ref: string): void => {
    if (ref === currentRef) return;
    currentRef = ref;
    for (const link of barLinks) {
      if (link.dataset.target === ref) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  };

  /** Places every tile, applies the curvature, updates the bar. */
  const render = (): void => {
    const halfW = wall.clientWidth / 2;
    const halfH = wall.clientHeight / 2;
    const flat = reducedMotion.matches;
    let nearest = '';
    let nearestDist = Infinity;

    for (const s of slots) {
      const p = positionOf(s);
      // Tile center relative to the screen center, in "screen halves"
      const dx = p.x + tileW / 2 - halfW;
      const dy = p.y + tileH / 2 - halfH;
      const nx = clamp(dx / halfW, -2, 2);
      const ny = clamp(dy / halfH, -2, 2);
      const d2 = nx * nx + ny * ny;

      const dist = Math.hypot(dx, dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s.ref;
      }

      const el = s.el;
      el.style.setProperty('--nx', String(round(nx)));
      el.style.setProperty('--ny', String(round(ny)));
      el.style.setProperty('--ab', String(round(Math.min(1, Math.sqrt(d2) * 0.7))));
      const move = `translate3d(${round(p.x)}px, ${round(p.y)}px, 0)`;
      if (flat) {
        el.style.transform = move;
        continue;
      }
      // Dome bulging toward the viewer: a tile on the right gets a smaller right edge
      const rotY = round(nx * TILT_DEG);
      const rotX = round(-ny * TILT_DEG * 0.8);
      const scale = round(Math.max(MIN_SCALE, 1 - d2 * SHRINK));
      el.style.transform = `${move} perspective(${PERSPECTIVE}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
    }
    markCurrent(nearest);
  };

  // ---- Animation loop: inertia and glides share one loop ----
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
    }
    render();

    const moving = target !== null || Math.hypot(velocity.x, velocity.y) > 0.01;
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

  /** Camera move that brings a slot to the screen center. */
  const deltaTo = (s: Slot): Point => {
    const p = positionOf(s);
    return {
      x: wall.clientWidth / 2 - (p.x + tileW / 2),
      y: wall.clientHeight / 2 - (p.y + tileH / 2),
    };
  };

  /** Glides to a slot (instantly under reduced motion). */
  const glideTo = (s: Slot): void => {
    const d = deltaTo(s);
    stopMotion();
    if (reducedMotion.matches) {
      cam.x += d.x;
      cam.y += d.y;
      render();
    } else {
      target = { x: cam.x + d.x, y: cam.y + d.y };
      startLoop();
    }
  };

  /** The copy of a tile ("node-x") closest to the screen center. */
  const nearestSlot = (ref: string): Slot | undefined => {
    let best: Slot | undefined;
    let bestDist = Infinity;
    for (const s of slots) {
      if (s.ref !== ref) continue;
      const d = deltaTo(s);
      const dist = Math.hypot(d.x, d.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = s;
      }
    }
    return best;
  };

  // ---- Drag (mouse, pen and touch through Pointer Events) ----
  let press: { id: number; x: number; y: number; camX: number; camY: number } | null = null;
  let dragging = false;
  let samples: { x: number; y: number; t: number }[] = [];
  let suppressClick = false;

  wall.addEventListener('pointerdown', (e) => {
    if (view !== 'wall' || e.button !== 0) return;
    suppressClick = false; // a new press: any stale "ignore next click" is over
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
      wall.setPointerCapture(e.pointerId);
      wall.classList.add('is-dragging');
    }
    cam.x = press.camX + dx;
    cam.y = press.camY + dy;
    render();
    samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    samples = samples.filter((s) => e.timeStamp - s.t < 100); // last 100ms only
  });

  const release = (e: PointerEvent): void => {
    if (!press || e.pointerId !== press.id) return;
    press = null;
    if (!dragging) return;
    dragging = false;
    // The click that follows a drag must not open a tile. Some browsers never
    // fire that click: disarm right after, so the next real click still works
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
    wall.classList.remove('is-dragging');
    const first = samples[0];
    const lastSample = samples[samples.length - 1];
    if (first && lastSample && lastSample.t > first.t && !reducedMotion.matches) {
      velocity.x = (lastSample.x - first.x) / (lastSample.t - first.t);
      velocity.y = (lastSample.y - first.y) / (lastSample.t - first.t);
      startLoop();
    }
  };

  wall.addEventListener('pointerup', release);
  wall.addEventListener('pointercancel', release);

  // Clicks: swallow the one ending a drag; otherwise give the view-transition
  // name to the copy that was actually clicked, so that one morphs into the page
  wall.addEventListener(
    'click',
    (e) => {
      if (suppressClick) {
        suppressClick = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (view !== 'wall' || !(e.target instanceof Element)) return;
      const tile = e.target.closest<HTMLElement>('[data-ref]');
      const real = tile?.dataset.ref ? document.getElementById(tile.dataset.ref) : null;
      if (!tile || !real || tile === real) return;
      const name = real.style.viewTransitionName;
      real.style.viewTransitionName = 'none';
      tile.style.viewTransitionName = name;
    },
    true,
  );

  // ---- Wheel / trackpad: pan the wall instead of scrolling the page ----
  wall.addEventListener(
    'wheel',
    (e) => {
      if (view !== 'wall' || e.ctrlKey) return; // list view scrolls normally; pinch-zoom stays native
      e.preventDefault();
      stopMotion();
      const factor = e.deltaMode === 1 ? 16 : 1; // lines -> px
      cam.x -= e.deltaX * factor;
      cam.y -= e.deltaY * factor;
      render();
    },
    { passive: false },
  );

  // ---- Keyboard: bring the focused (real) tile into view ----
  wall.addEventListener('focusin', (e) => {
    if (view !== 'wall' || dragging || !(e.target instanceof Element)) return;
    const tile = e.target.closest<HTMLElement>('[data-ref]');
    const slot = slots.find((s) => s.el === tile);
    if (slot) glideTo(slot);
  });
  // The browser may scroll the overflow:hidden wall itself on focus: undo it
  wall.addEventListener('scroll', () => {
    if (view !== 'wall') return;
    wall.scrollTop = 0;
    wall.scrollLeft = 0;
  });

  // ---- Views: the infinite wall, or the plain list (the no-JS layout) ----
  const updateToggle = (): void => {
    if (!toggle) return;
    toggle.hidden = false;
    toggle.setAttribute('aria-pressed', String(view === 'list'));
    if (toggleLabel) {
      toggleLabel.textContent = (view === 'list' ? toggle.dataset.labelWall : toggle.dataset.labelList) ?? '';
    }
  };

  /** Centers a real tile instantly (opening, or coming back from the list). */
  const centerOn = (ref: string): void => {
    const slot = slots.find((s) => s.el.id === ref) ?? nearestSlot(ref);
    if (slot) {
      const d = deltaTo(slot);
      cam.x += d.x;
      cam.y += d.y;
    }
    render();
  };

  const layout = (): void => {
    wall.classList.add('is-wall');
    measure();
    buildGrid();
  };

  const enterList = (): void => {
    view = 'list';
    stopMotion();
    cancelAnimationFrame(frame);
    frame = 0;
    wall.classList.remove('is-wall', 'is-dragging');
    plane.querySelectorAll('[data-clone]').forEach((n) => n.remove());
    slots = [];
    for (const tile of realTiles) {
      tile.style.transform = '';
      ['--nx', '--ny', '--ab'].forEach((v) => tile.style.removeProperty(v));
    }
    barLinks.forEach((l) => l.removeAttribute('aria-current'));
    currentRef = '';
    updateToggle();
  };

  const enterWall = (ref: string): void => {
    view = 'wall';
    layout();
    centerOn(ref);
    window.scrollTo(0, 0);
    updateToggle();
  };

  /** In the list view, the tile taking the most room on screen (to resume there). */
  const mostVisibleTile = (): string => {
    let best = realTiles[0]?.id ?? '';
    let bestVisible = 0;
    for (const tile of realTiles) {
      const r = tile.getBoundingClientRect();
      const visible = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      if (visible > bestVisible) {
        bestVisible = visible;
        best = tile.id;
      }
    }
    return best;
  };

  toggle?.addEventListener('click', () => {
    if (view === 'wall') {
      enterList();
      saveView('list');
    } else {
      enterWall(mostVisibleTile());
      saveView('wall');
    }
  });

  // Bar links: glide to the nearest copy (the list view keeps the native anchor scroll)
  for (const link of barLinks) {
    link.addEventListener('click', (e) => {
      if (view !== 'wall' || !link.dataset.target) return;
      const slot = nearestSlot(link.dataset.target);
      if (!slot) return;
      e.preventDefault();
      glideTo(slot);
      // Keyboard / screen-reader focus goes to the real tile's link
      document.getElementById(link.dataset.target)?.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    });
  }

  // ---- Start ----
  // Opening tile: the one named in the URL hash ("/#node-projects", used by
  // "back to the wall" links), otherwise Léo's tile
  const hashRef = location.hash.slice(1);
  const startRef = realTiles.some((t) => t.id === hashRef) ? hashRef : (realTiles[0]?.id ?? '');

  if (readView() === 'list') {
    enterList();
  } else {
    layout();
    centerOn(startRef);
    updateToggle();
    // The hash also makes the browser scroll the page toward the tile: undo it
    if (hashRef) requestAnimationFrame(() => window.scrollTo(0, 0));
  }

  // Screen size changes: new tile size and grid, same tile in the center
  let lastSize = `${wall.clientWidth}x${wall.clientHeight}`;
  new ResizeObserver(() => {
    const size = `${wall.clientWidth}x${wall.clientHeight}`;
    if (view !== 'wall' || size === lastSize) return;
    lastSize = size;
    const ref = currentRef || startRef;
    layout();
    centerOn(ref);
  }).observe(wall);

  reducedMotion.addEventListener('change', () => {
    if (view === 'wall') render();
  });
}
