/*
 * Wall script — progressive enhancement of the card list into the wall.
 * On wide screens it:
 *   1. switches the container to "wall mode" (cards absolutely placed on a
 *      plane, using the CSS variables written at build time),
 *   2. scales the plane so the whole wall fits the viewport (overview),
 *   3. measures the cards and draws orthogonal wires between their ports.
 * Without JS, or on small screens, the plain card list stays as is.
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

const WALL_QUERY = '(min-width: 900px)';
const FIT_MARGIN = 48; // px kept around the wall when it is fitted to the screen
const SVG_NS = 'http://www.w3.org/2000/svg';

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

export function initWall(): void {
  const wall = document.querySelector<HTMLElement>('[data-wall]');
  const plane = wall?.querySelector<HTMLElement>('[data-plane]');
  const svg = wall?.querySelector<SVGSVGElement>('[data-wires]');
  if (!wall || !plane || !svg) return;

  const links = parseLinks(wall.dataset.links);
  const media = matchMedia(WALL_QUERY);
  let scale = 1;

  /** Card box in plane coordinates (independent of the current zoom). */
  const boxOf = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    const p = plane.getBoundingClientRect();
    return { x: (r.left - p.left) / scale, y: (r.top - p.top) / scale, w: r.width / scale, h: r.height / scale };
  };

  const cards = (): HTMLElement[] => [...plane.querySelectorAll<HTMLElement>('[data-node]')];

  /** Scales and centers the plane so every card is visible. */
  const fit = (): void => {
    plane.style.transform = 'none';
    scale = 1;
    const boxes = cards().map(boxOf);
    if (boxes.length === 0) return;
    const minX = Math.min(...boxes.map((b) => b.x));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w));
    const maxY = Math.max(...boxes.map((b) => b.y + b.h));
    const availW = wall.clientWidth - FIT_MARGIN * 2;
    const availH = wall.clientHeight - FIT_MARGIN * 2;
    scale = Math.min(availW / (maxX - minX), availH / (maxY - minY), 1);
    const tx = wall.clientWidth / 2 - ((minX + maxX) / 2) * scale;
    const ty = wall.clientHeight / 2 - ((minY + maxY) / 2) * scale;
    plane.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };

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

  const apply = (): void => {
    if (media.matches) {
      wall.classList.add('is-wall');
      fit();
      drawWires();
    } else {
      wall.classList.remove('is-wall');
      plane.style.transform = '';
      svg.replaceChildren();
    }
  };

  apply();
  media.addEventListener('change', apply);
  new ResizeObserver(() => {
    if (media.matches) apply();
  }).observe(wall);
  // Card heights change once the web fonts are loaded: measure again
  void document.fonts.ready.then(apply);
}
