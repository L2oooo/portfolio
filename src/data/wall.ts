/*
 * Wall layout — where each card sits on the wall's plane, and which ports
 * are wired together. Pure data, computed at build time, in two size sets:
 * DESKTOP and MOBILE (same topology, narrower cards on phones so text stays
 * full size).
 *
 * Plane coordinates are in px, origin (0, 0) = center of Léo's card.
 * `align` says which point of the card (x, y) refers to, so a card can be
 * anchored by its bottom edge without knowing its height in advance:
 *
 *                 [ Contact ]
 *                      │
 *   [ Background ]── [ Léo ] ──[ Projects ]──┬─────┬─────┬── bus
 *                      │                    [P1]  [P3]  [P5]   above
 *                  [ Skills ]               [P2]  [P4]  [P6]   below
 */

export type Side = 'n' | 'e' | 's' | 'w';
export type Align = 'start' | 'center' | 'end';

export interface Placement {
  x: number;
  y: number;
  width: number;
  alignX: Align;
  alignY: Align;
}

export interface WallLink {
  from: string; // card DOM id
  fromSide: Side;
  to: string;
  toSide: Side;
}

export interface WallLayout {
  placements: Record<string, Placement>;
  links: WallLink[];
}

/** Sizes of one layout variant. */
export interface WallMetrics {
  gap: number; // space between Léo and the cards around him
  busGap: number; // space between the bus line and the project cards
  leoWidth: number;
  leoHalfHeight: number; // expected half height of Léo's card: keeps contact/skills clear of it
  hubWidth: number;
  projectWidth: number;
  projectSpacing: number; // space between two project columns
  contactWidth: number;
  skillsWidth: number;
  backgroundWidth: number;
}

export const DESKTOP: WallMetrics = {
  gap: 120,
  busGap: 64,
  leoWidth: 760,
  leoHalfHeight: 220,
  hubWidth: 320,
  projectWidth: 360,
  projectSpacing: 64,
  contactWidth: 380,
  skillsWidth: 440,
  backgroundWidth: 420,
};

export const MOBILE: WallMetrics = {
  gap: 72,
  busGap: 48,
  leoWidth: 320,
  leoHalfHeight: 330,
  hubWidth: 280,
  projectWidth: 300,
  projectSpacing: 48,
  contactWidth: 300,
  skillsWidth: 320,
  backgroundWidth: 320,
};

export function buildWall(projectIds: string[], m: WallMetrics): WallLayout {
  const half = m.leoWidth / 2;
  const hubRight = half + m.gap + m.hubWidth;
  const projectStep = m.projectWidth + m.projectSpacing;

  const placements: Record<string, Placement> = {
    'node-leo': { x: 0, y: 0, width: m.leoWidth, alignX: 'center', alignY: 'center' },
    'node-contact': {
      x: 0,
      y: -(m.gap + m.leoHalfHeight),
      width: m.contactWidth,
      alignX: 'center',
      alignY: 'end',
    },
    'node-skills': {
      x: 0,
      y: m.gap + m.leoHalfHeight,
      width: m.skillsWidth,
      alignX: 'center',
      alignY: 'start',
    },
    'node-background': {
      x: -(half + m.gap),
      y: 0,
      width: m.backgroundWidth,
      alignX: 'end',
      alignY: 'center',
    },
    'node-projects': { x: half + m.gap, y: 0, width: m.hubWidth, alignX: 'start', alignY: 'center' },
  };

  // Projects alternate above / below the bus, filling columns left to right
  projectIds.forEach((id, i) => {
    const column = Math.floor(i / 2);
    const above = i % 2 === 0;
    placements[id] = {
      x: hubRight + m.gap + column * projectStep,
      y: above ? -m.busGap : m.busGap,
      width: m.projectWidth,
      alignX: 'start',
      alignY: above ? 'end' : 'start',
    };
  });

  const links: WallLink[] = [
    { from: 'node-leo', fromSide: 'n', to: 'node-contact', toSide: 's' },
    { from: 'node-leo', fromSide: 's', to: 'node-skills', toSide: 'n' },
    { from: 'node-leo', fromSide: 'w', to: 'node-background', toSide: 'e' },
    { from: 'node-leo', fromSide: 'e', to: 'node-projects', toSide: 'w' },
    ...projectIds.map(
      (id, i): WallLink => ({
        from: 'node-projects',
        fromSide: 'e',
        to: id,
        toSide: i % 2 === 0 ? 's' : 'n',
      }),
    ),
  ];

  return { placements, links };
}

const SHIFT = { start: '0%', center: '-50%', end: '-100%' } as const;

/**
 * CSS custom properties placing a card on the plane (wall mode only):
 * --x/--y/--w/--tx/--ty for desktop, the same with an "m" suffix for phones.
 * The stylesheet picks the right set with a media query.
 */
export function placementStyle(desktop: Placement, mobile: Placement): string {
  return [
    `--x: ${desktop.x}px`,
    `--y: ${desktop.y}px`,
    `--w: ${desktop.width}px`,
    `--tx: ${SHIFT[desktop.alignX]}`,
    `--ty: ${SHIFT[desktop.alignY]}`,
    `--xm: ${mobile.x}px`,
    `--ym: ${mobile.y}px`,
    `--wm: ${mobile.width}px`,
    `--txm: ${SHIFT[mobile.alignX]}`,
    `--tym: ${SHIFT[mobile.alignY]}`,
  ].join('; ');
}
