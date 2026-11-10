# Portfolio — Léo Salvayre

Bilingual (FR/EN) personal portfolio. Art direction **« Topologie »**: the site is a network map / blueprint where "LÉO" is the central node, linked to domain nodes and then to projects and experiences.

**Domains** (single list in `src/data/domains.ts`, shared by content schema, map and lens): `ai`, `cyber`, `dev`, `consulting`, `product`. Never hardcode this list elsewhere.

@AGENTS.md

## Home page: the infinite wall
Inspired by allanleone.com: the screen is filled with tiles, in an infinite draggable wall.
- **5 real tiles** in `src/components/wall/Wall.astro`: Léo (h1), Projets, Parcours, Compétences, Contact. A tile (`WallTile.astro`) shows ONLY a full-bleed visual, a title and a subtitle, and links to its section page. No wires, no ports.
- **Infinite grid** (`src/scripts/wall.ts`): tile of cell (c, r) = `(c + 2r) mod 5`. The grid has a multiple of 5 columns/rows and wraps like a torus, so recycled tiles stay the same tile (only moved via `transform`). Clones are `aria-hidden`, `tabindex=-1` on links, no ids, h1 turned into a div; they stay clickable with the mouse.
- **Camera**: drag with inertia, wheel panning, glide to a tile (bottom bar = nearest copy, keyboard focus, `/#node-x` on load). No bounds.
- **Curvature**: per-tile CSS 3D transform (tilt + shrink with distance from the screen center), glass edge from the shared `.glass` class in `global.css`. Flat under reduced motion. No WebGL.
- **Bottom bar** (`BottomBar.astro`): anchor links to the 5 tiles + wall/list toggle (remembered in localStorage). List view and no-JS = the 5 real tiles in a grid.
- **Section pages** (content lives there, not on the wall): `/a-propos/`, `/projets/`, `/parcours/`, `/competences/`, `/contact/` and `/en/{about,projects,background,skills,contact}/`, all built on `SectionPage.astro`. Page components live in `src/components/pages/`.
- **View transitions** (native CSS): tile and page head share `card-<section>`; on click the wall script moves the name to the copy that was clicked.
- **Back links** use `/#node-<x>` so the wall reopens centered on that tile.
- **Translated URL segments** live in `SEGMENTS` in `src/i18n/routes.ts`; always build URLs with its helpers (`sectionPath`, `projectPath`).
- **Visuals**: AI-generated images (Léo's choice) will go to `src/assets/` via Astro `<Image>`; until then `BlueprintPlaceholder` draws a generated schematic.

## Stack
- Astro 7 + TypeScript strict. Static output, zero JS by default; ship JS only where it is needed (topology map, lens selector).
- Plain CSS with custom properties (tokens in `src/styles/tokens.css`). **No Tailwind.**
- Wall and radial map in HTML/SVG + vanilla TS. **No Three.js / WebGL.**
- GSAP for animations, always disabled under `prefers-reduced-motion`.
- Fonts self-hosted via Fontsource: Archivo (display/body), JetBrains Mono (technical annotations).
- Deployment: Vercel.

## Design rules (no AI slop)
- One single accent color (signal orange). No decorative gradients, no emoji icons, no bento grid look. The tiles' glass edge is the one deliberate exception: keep it subtle.
- Banned fonts: Inter, Space Grotesk, Geist.
- Blueprint language: thin lines, visible grid, technical annotations (`fig.01`, `node: 12`).
- Dark and light themes both supported; check AA contrast.
- Accessibility: only the 5 real tiles are focusable/announced, visible focus, 44px min targets, the list view is the text equivalent of the wall.

## Signature feature: the lens selector
"Vous recrutez pour : IA · Cyber · Dev · Conseil · Produit". It lives in the bottom bar. It highlights what matches the chosen domain and dims the rest (exact behavior on the infinite wall still to design). It is stored in the URL (`?lens=cyber`) so a link can be tailored to each job application.

## Conventions
- Every file starts with a comment explaining its role.
- No `any` in TypeScript.
- i18n: FR is the default locale at `/`, EN lives at `/en/`. UI strings go in `src/i18n/ui.ts`, never hardcoded in components.
- Content (projects, experiences) lives in content collections under `src/content/{projects,experiences}/{fr,en}/`, same filename in both locales. Read it through `src/lib/content.ts` (`getProjects`, `getExperiences`), never `getCollection` directly.
- Placeholder projects (Alpha…Foxtrot) have `placeholder: true`; they must all be replaced before launch.
- After creating or changing `src/content.config.ts`, restart the dev server (`astro dev stop` then `astro dev --background`): a running server does not pick up new collections.
- One commit per logical step, English commit messages, no Co-Authored-By / Claude signature.

## Personal data
- Never commit the CV PDF (it contains a phone number); `*.pdf` is gitignored.
- Contact info is a placeholder until Léo provides it.
