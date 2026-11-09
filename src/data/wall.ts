/*
 * Wall layout — where each card sits on the wall's plane, and which ports
 * are wired together. Pure data, computed at build time.
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

const GAP = 120; // space between Léo and the cards around him
const BUS_GAP = 64; // space between the bus line and the project cards
const PROJECT_WIDTH = 360;
const PROJECT_STEP = PROJECT_WIDTH + 64; // horizontal pitch of project columns

const LEO_WIDTH = 760;
const HUB_WIDTH = 320;

export function buildWall(projectIds: string[]): WallLayout {
  const half = LEO_WIDTH / 2;
  const hubRight = half + GAP + HUB_WIDTH;

  const placements: Record<string, Placement> = {
    'node-leo': { x: 0, y: 0, width: LEO_WIDTH, alignX: 'center', alignY: 'center' },
    'node-contact': { x: 0, y: -(GAP + 220), width: 380, alignX: 'center', alignY: 'end' },
    'node-skills': { x: 0, y: GAP + 220, width: 440, alignX: 'center', alignY: 'start' },
    'node-background': { x: -(half + GAP), y: 0, width: 420, alignX: 'end', alignY: 'center' },
    'node-projects': { x: half + GAP, y: 0, width: HUB_WIDTH, alignX: 'start', alignY: 'center' },
  };

  // Projects alternate above / below the bus, filling columns left to right
  projectIds.forEach((id, i) => {
    const column = Math.floor(i / 2);
    const above = i % 2 === 0;
    placements[id] = {
      x: hubRight + GAP + column * PROJECT_STEP,
      y: above ? -BUS_GAP : BUS_GAP,
      width: PROJECT_WIDTH,
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

/** CSS custom properties that place a card on the plane (used in wall mode only). */
export function placementStyle(p: Placement): string {
  const shift = { start: '0%', center: '-50%', end: '-100%' } as const;
  return [
    `--x: ${p.x}px`,
    `--y: ${p.y}px`,
    `--w: ${p.width}px`,
    `--tx: ${shift[p.alignX]}`,
    `--ty: ${shift[p.alignY]}`,
  ].join('; ');
}
