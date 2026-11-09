/*
 * Topology graph — turns content into node coordinates for the SVG map.
 * Pure function, computed at build time (no JS shipped):
 *   - "LÉO" (root) at the center,
 *   - the 5 domains evenly spread on an inner ring,
 *   - each project on an outer ring, at the circular mean of its domains'
 *     angles, so a project sits *between* the fields it combines.
 * A small relaxation pass pushes nodes apart when they are too close.
 */
import { DOMAINS, type Domain } from './domains';

export const MAP = {
  cx: 500,
  cy: 500,
  innerRadius: 215, // domains ring
  outerRadius: 395, // projects ring
  minGapDeg: 17, // minimum angle between two nodes (projects and domains)
} as const;

export interface Point {
  x: number;
  y: number;
}

export interface DomainNode extends Point {
  id: Domain;
  angle: number; // degrees, 0 = right, clockwise (SVG y axis points down)
}

export interface ProjectNode extends Point {
  slug: string;
  index: number; // 1-based position in the project index
  title: string;
  year: number;
  domains: Domain[];
  angle: number;
}

export interface Link {
  from: Point;
  to: Point;
  kind: 'root' | 'project';
  domain: Domain;
  project?: string; // project slug for project links
}

export interface Graph {
  root: Point;
  domains: DomainNode[];
  projects: ProjectNode[];
  links: Link[];
}

export interface GraphProjectInput {
  slug: string;
  title: string;
  year: number;
  domains: Domain[];
}

const rad = (deg: number): number => (deg * Math.PI) / 180;
const deg = (r: number): number => (r * 180) / Math.PI;

/** Signed smallest difference a - b, in (-180, 180]. */
const angleDiff = (a: number, b: number): number => {
  const d = (((a - b) % 360) + 540) % 360 - 180;
  return d === -180 ? 180 : d;
};

const polar = (angle: number, radius: number): Point => ({
  x: Math.round((MAP.cx + radius * Math.cos(rad(angle))) * 10) / 10,
  y: Math.round((MAP.cy + radius * Math.sin(rad(angle))) * 10) / 10,
});

/** Average of angles on a circle (e.g. mean of 350° and 10° is 0°, not 180°). */
function circularMean(angles: number[]): number {
  const x = angles.reduce((sum, a) => sum + Math.cos(rad(a)), 0);
  const y = angles.reduce((sum, a) => sum + Math.sin(rad(a)), 0);
  return deg(Math.atan2(y, x));
}

/**
 * Pushes movable angles away from each other and from fixed ones until every
 * pair is at least `gap` degrees apart (or iterations run out). Deterministic.
 */
function relax(movable: number[], fixed: number[], gap: number): number[] {
  const out = [...movable];
  for (let iter = 0; iter < 120; iter++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      const others = [...fixed, ...out.filter((_, j) => j !== i)];
      for (const other of others) {
        const d = angleDiff(out[i]!, other);
        if (Math.abs(d) < gap) {
          // Exact overlap: push clockwise so the result stays deterministic
          const direction = d >= 0 ? 1 : -1;
          out[i] = out[i]! + direction * ((gap - Math.abs(d)) / 2 + 0.5);
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return out;
}

export function buildGraph(projects: GraphProjectInput[]): Graph {
  const root: Point = { x: MAP.cx, y: MAP.cy };

  // Pentagon starting at the top (-90°)
  const domains: DomainNode[] = DOMAINS.map((id, i) => {
    const angle = -90 + (360 / DOMAINS.length) * i;
    return { id, angle, ...polar(angle, MAP.innerRadius) };
  });
  const angleOf = new Map(domains.map((d) => [d.id, d.angle]));

  const ideal = projects.map((p) => circularMean(p.domains.map((d) => angleOf.get(d) ?? 0)));
  const relaxed = relax(
    ideal,
    domains.map((d) => d.angle),
    MAP.minGapDeg,
  );

  const projectNodes: ProjectNode[] = projects.map((p, i) => {
    const angle = relaxed[i]!;
    return { ...p, index: i + 1, angle, ...polar(angle, MAP.outerRadius) };
  });

  const domainById = new Map(domains.map((d) => [d.id, d]));
  const links: Link[] = [
    ...domains.map((d): Link => ({ from: root, to: d, kind: 'root', domain: d.id })),
    ...projectNodes.flatMap((p) =>
      p.domains.flatMap((id): Link[] => {
        const d = domainById.get(id);
        return d ? [{ from: d, to: p, kind: 'project', domain: id, project: p.slug }] : [];
      }),
    ),
  ];

  return { root, domains, projects: projectNodes, links };
}
